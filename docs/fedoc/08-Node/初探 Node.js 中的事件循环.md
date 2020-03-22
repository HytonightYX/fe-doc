# 初探 Node.js 中的事件循环

笔者认为，自己对于游览器端的 JavaScript 的顿悟，是从理解了事件循环开始的，那之后，很多不明不白的现象和 bug 都能得到很好的解答。而在向 Node.js 进军的路上，笔者先想从事件循环开始，以免自己再走之前的弯路。

事件循环是 Node 处理非阻塞 I/O 操作的机制，node 中事件循环是依靠的 libuv 引擎实现的。而在 Node 11 之后，事件循环的一些原理也发生了变化。

<!--more-->

## Node 中的宏任务和微任务

和游览器中类似。

**微任务大概包括：**

- setTimeout
- setInterval
- setImmediate
- script（整体代码)
- I/O 操作等

**micro-task 大概包括：**

- `process.nextTick` (与普通微任务有区别，在微任务队列执行之前执行)
- `new Promise().then` (回调)等

## 事件循环之前

> "When Node.js starts, it initializes the event loop, processes the provided input script which may make async API calls, schedule timers, or call process.nextTick(), then begins processing the event loop."
>
> ——Node 官方文档

文档内表达了三层意思

1. 有些人以为，除了主线程，还存在一个单独的事件循环线程。不是这样的，只有一个主线程，事件循环是在主线程上完成的
2. Node 开始执行脚本时，会先进行事件循环的初始化，但是这时事件循环还没有开始，会先完成下面的事情

- _同步任务_
- _发出异步请求_
- _规划定时器生效的时间_
- _执行`process.nextTick()`等等_

3. 最后，上面这些事情都干完了，事件循环就正式开始了。

## 阶段概述

事件循环是 Node.js 背后的魔法，简言之，事件循环实际上是一个无限循环，并且是 Node 唯一可用的线程。

```c
/**
 * 源码地址：https://github.com/nodejs/node/blob/master/src/node_main_instance.cc#L113
 * 留意 do {...} while {more == true && !env->is_stopping()}
 */
int NodeMainInstance::Run() {
	// ...
    {
      SealHandleScope seal(isolate_);
      bool more;
      env->performance_state()->Mark(
          node::performance::NODE_PERFORMANCE_MILESTONE_LOOP_START);
      do {
        uv_run(env->event_loop(), UV_RUN_DEFAULT);

        per_process::v8_platform.DrainVMTasks(isolate_);

        more = uv_loop_alive(env->event_loop());
        if (more && !env->is_stopping()) continue;

        if (!uv_loop_alive(env->event_loop())) {
          EmitBeforeExit(env.get());
        }

        // Emit `beforeExit` if the loop became alive either after emitting
        // event, or after running some callbacks.
        more = uv_loop_alive(env->event_loop());
      } while (more == true && !env->is_stopping());
      env->performance_state()->Mark(
          node::performance::NODE_PERFORMANCE_MILESTONE_LOOP_EXIT);
    }
  	// ...
}
```

Libuv 是一个实现此模式的 C 语言库，是 Node.js 核心模块的一部分。

事件循环需要经历 6 个阶段，所有阶段的执行被称为 tick。经典循环图

```
   ┌───────────────────────────┐
┌─>│           timers          │ (setInterval, setTimeout)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │    pending I/O callbacks  │ (I/O callbacks)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │			 (这里可以作为起点)
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │ (setImmediate)
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘

输入数据阶段(incoming data)
-> 轮询阶段(poll)
-> 检查阶段(check)
-> 关闭事件回调阶段(close callback)
-> 定时器检测阶段(timers)
-> I/O事件回调阶段(pending callbacks)
-> 闲置阶段(idle, prepare)
-> 轮询阶段(poll)
...
```

*注意：每个方框都是事件循环中的一个阶段（*phase*）。*

每个阶段都有一个 FIFO 队列来执行回调。虽然每个阶段都是特殊的，但通常情况下，它将执行特定于该阶段的任何操作，然后执行该阶段队列中的回调，直到队列用尽或最大回调数已执行。当该队列已用尽或达到回调限制，事件循环将移动到下一阶段。

- **timers（定时器检测阶段）**：这个阶段执行定时器 `setTimeout()` 和 `setInterval()` 的回调函数
- **pending callbacks（事件回调阶段）**：执行上一轮循环中未被执行的一些 I/O 回调
- **idle, prepare（闲置阶段）**: 该阶段只供 libuv 内部调用，这里可以忽略
- **poll（轮询阶段）**：检索新的 I/O 事件；适当时 Node 将在此处阻塞
- **check（检查阶段）**：执行 `setImmediate()` 回调函数
- **close callbacks（关闭事件回调阶段）**: 一些准备关闭的回调函数，如：`socket.on('close', ...)`

## 三大重点阶段

日常开发中的绝大部分异步任务都是在 poll、check、timers 这 3 个阶段处理的。

#### timers

timers 阶段会执行 setTimeout 和 setInterval 回调，并且是由 poll 阶段控制的。同样，在 Node 中定时器指定的时间也不是准确时间，只能是尽快执行。

#### poll

poll 是一个至关重要的阶段，poll 阶段的执行逻辑流程图如下：

![image-20200308164041152](http://qn-noter.yunxi.site/imagehost/y7hao.png)

这个阶段是轮询时间，用于等待还未返回的 I/O 事件，比如服务器的回应、用户移动鼠标等等。

如果当前已经存在定时器，而且有定时器到时间了，拿出来执行，eventLoop 将回到 timers 阶段。

如果没有定时器, 会去看回调函数队列。

- 如果 poll 队列不为空，会遍历回调队列并同步执行，直到队列为空或者达到系统限制

- 如果 poll 队列为空时，会有两件事发生

- - 如果有 `setImmediate()` 回调需要执行，poll 阶段会停止并且进入到 check 阶段执行回调
  - 如果没有 `setImmediate()` 回调需要执行，会等待回调被加入到队列中并立即执行回调，这里同样会有个超时时间设置防止一直等待下去,一段时间后自动进入 check 阶段。

#### check

这是一个比较简单的阶段，该阶段执行 setImmdiate 的回调。

## process.nextTick

`process.nextTick` 这个名字有点误导，它是在本轮循环执行的，而且是所有异步任务里面最快执行的。

process.nextTick 是一个独立于 eventLoop 的任务队列。Node 11 版本前后会有一些区别。

**在每一个 eventLoop 阶段完成后会去检查 nextTick 队列，如果里面有任务，会让这部分任务优先于微任务执行。**

```javascript
setImmediate(() => {
  console.log('timeout1')
  Promise.resolve().then(() => console.log('promise resolve'))
  process.nextTick(() => console.log('next tick1'))
})
setImmediate(() => {
  console.log('timeout2')
  process.nextTick(() => console.log('next tick2'))
})
setImmediate(() => {
  console.log('timeout3')
})
setImmediate(() => {
  console.log('timeout4')
})
```

> - 在 node11 之前，因为每一个 eventLoop 阶段完成后会去检查 nextTick 队列，如果里面有任务，会让这部分任务优先于微任务执行，因此上述代码是先进入 check 阶段，执行所有 setImmediate，完成之后执行 nextTick 队列，最后执行微任务队列，因此输出为`timeout1=>timeout2=>timeout3=>timeout4=>next tick1=>next tick2=>promise resolve`
> - 在 node11 之后，process.nextTick 是微任务的一种,因此上述代码是先进入 check 阶段，执行一个 setImmediate 宏任务，然后执行其微任务队列，再执行下一个宏任务及其微任务,因此输出为`timeout1=>next tick1=>promise resolve=>timeout2=>next tick2=>timeout3=>timeout4`

代码验证：

目前使用 `V12.13.0`

![image-20200308172509443](http://qn-noter.yunxi.site/imagehost/28f39.png)

结果：

![image-20200308172715696](http://qn-noter.yunxi.site/imagehost/rr5k1.png)

修改版本为 `V10.15.3`

![image-20200308172819588](http://qn-noter.yunxi.site/imagehost/cjy4v.png)

## Node 11+ 版本差异

Node 11 之后一些特性已经向浏览器看齐了，总的变化一句话来说就是，如果是 Node11+ 一旦执行一个阶段里的一个宏任务(`setTimeout`，`setInterval` 和 `setImmediate`)就立刻执行对应的微任务队列。

### timers 阶段的执行时机的变化

```javascript
setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(function() {
    console.log('promise1')
  })
}, 0)

setTimeout(() => {
  console.log('timer2')
  Promise.resolve().then(function() {
    console.log('promise2')
  })
}, 0)
```

## Node 和游览器的 Event Loop 区别

两者最主要的区别在于浏览器中的微任务是在每个相应的宏任务完成后执行的，而 node 中的微任务是在不同阶段之间执行的。

## 致谢

- 《深入浅出 Node.js》（朴灵）
- [Everything you need to know about Node.js](https://dev.to/jorge_rockr/everything-you-need-to-know-about-node-js-lnc)

- [The Node.js Event Loop, Timers, and `process.nextTick()`](https://nodejs.org/uk/docs/guides/event-loop-timers-and-nexttick/)

- [说说 Node 的事件循环机制](https://mp.weixin.qq.com/s/qEmR-N6cANSkKuJt2QO_eg)
- [Node 定时器详解](http://www.ruanyifeng.com/blog/2018/02/node-event-loop.html)
