# React 底层原理

## 目录

**现象**

1. 不可变值
2. 可能异步
3. 可能会被合并

**原理**

- 函数式编程
- VDOM 和 diff
- JSX 的本质
- 合成事件
- setState batchUpdate
- 组件渲染过程
- 前端路由



## 不能直接修改 state，要用不可变值

```javascript
// 错误
this.state.count++ 
// 正确
this.setState({
	count: this.state.count++
})
```





## setState 可能是异步，也可能是同步

### 直接使用是异步的



### setTimeout 中，setState 是同步的



###自己定义的 DOM 事件，setState 是同步的





##合并

### 传入对象，会被合并，只执行一次 +1

```javascript
this.setState({
  count: this.state.count + 1
})
this.setState({
  count: this.state.count + 1
})
this.setState({
  count: this.state.count + 1
})

// 最终只加1
// 类比：Object.assign
```



### 传入函数，不会被合并

```javascript
this.setState((prevState) => {
  count: prevState.count + 1
})

this.setState((prevState) => {
  count: prevState.count + 1
})

this.setState((prevState) => {
  count: prevState.count + 1
})

// 函数无法合并
```



# 原理梳理

函数式编程

- 一种编程范式
- 纯函数
- 不可变值



## VDOM 和 diff 是 React 的基石

### VDOM

h 函数

vnode 数据结构，树

![image-20200225214648201](https://tva1.sinaimg.cn/large/0082zybply1gc8zfcbh0nj30am0do0tw.jpg)

patch函数



### diff 算法

- 同级比较
- tag 不同，则直接删掉重建，不再深度比较
- tag 和 key，两者都相同，则认为是相同节点，不再深度比较

O(n^3) 改进为 O(n)



### JSX 的本质？

JSX 不是 JS。

- 编译后成为一堆 `React.createElement()` ；
- `React.createElement()` 执行返回的是一个 vnode，能通过后续的 patch 来渲染；
- 第一个参数，可能是组件，也可能是个 HTML 标签；
- 组件名首字母必须大写，就是为了区分组件和 tag。





## 合成事件机制

- event 是 SyntheticEvent，模拟出 DOM 事件所有能力
- event.nativeEvent 是原生对象事件
- 所有的事件，都被挂载到 document 上
- 和 DOM 事件不一样

![image-20200225221807193](https://tva1.sinaimg.cn/large/0082zybply1gc90bxjx1dj30q00bjtbg.jpg)

React 通过这种合成事件机制，模拟了每一个原生 event 的行为。相当于在原生 event 上包装了一层。



### 为什么需要合成事件机制

- 更好的兼容性和跨平台
- 挂载到 document 上，**减少内存消耗**，避免频繁解绑 （事件委托？）
  - 比如 `<a onClick={fn} />`，其实没有直接在 a 上挂事件，而是挂载 document上，这样当组件销毁的时候也不用去解绑
- 方便事件统一管理（如事物机制）



## setState 和 batchUpdate

**回顾现象：**

- setState 有时**异步**（普通使用），有时**同步**（setTimeout，DOM 事件）
- 有时合并（对象形式），有时不合并（函数形式）
- 后者好理解（类似Object.assign），主要理解 setState

**核心要点：**

- setState 的主要流程
- batchUpdate 机制
- transaction （事务）机制

### setState 的流程

![image-20200226074600085](https://tva1.sinaimg.cn/large/0082zybply1gc9gqugd88j30ht0cemz9.jpg)

上面的结果最终是1，在`setState`的时候react内部会创建一个`updateQueue`，通过`firstUpdate`、`lastUpdate`、`lastUpdate.next`去维护一个更新的队列，在最终的`performWork`中，相同的key会被覆盖，只会对最后一次的`setState`进行更新。



### batchUpdate 机制以及 isBatchingUpdates

举个🌰，放在 setTimeout 中

![image-20200226074848656](https://tva1.sinaimg.cn/large/0082zybply1gc9gtpyrobj30sp0d20zu.jpg)



看右边，开始处于 `batchUpdate` 中，`isBatchingUpdates = true`，接着开始执行 `setTimeout`，但是里面的 `setState` 是异步的，所以还没执行，紧接着 `isBatchingUpdates = false` 。因此之后 `setState` 执行的时候，`isBatchingUpdates = false` ，所以开始走流程图的右边了。

其实 React 所有函数都是这样的逻辑。

自定义事件也是一样的：

![image-20200226075447475](https://tva1.sinaimg.cn/large/0082zybply1gc9gzybiulj30lt0bjgqd.jpg)



总结：

-  同步异步不是由 setState 自己决定的
- 就是看能否命中 batchUpdate 机制
- 判断 `isBatchingUpdate`



能命中 batchUpdate 机制：

- 生命周期以及其调用的函数
- React 中注册的事件（和它调用的函数）
- React 可以“管理”的入口



不能命中：

- setTimeout，setInterval（和它调用的函数）
- 自定义的 DOM 事件
- React “管不到” 的入口，不是 React 那儿注册的



### transction 机制

![image-20200226080322386](/Users/husiyuan/Library/Application Support/typora-user-images/image-20200226080322386.png)

![image-20200226080439053](https://tva1.sinaimg.cn/large/0082zybply1gc9ha7qr8hj30jq0d7gpa.jpg)

可以看到，这两个`wrapper`的`initialize`都没有做什么事情，但是在callback执行完之后，`RESET_BATCHED_UPDATES` 的作用是将`isBatchingUpdates`置为`false`, `FLUSH_BATCHED_UPDATES` 的作用是执行`flushBatchedUpdates`,然后里面会循环所有`dirtyComponent`,调用`updateComponent`来执行所有的生命周期方法，`componentWillReceiveProps`, `shouldComponentUpdate`, `componentWillUpdate`, `render`, `componentDidUpdate` 最后实现组件的更新。



## 组件渲染和更新

### 组件渲染和更新的过程

- `setState(newState)` => dirtyComponents （可能有子组件）
- `render()` 生成 newVnode
- `patch(vnode, newVnode)`
  1. reconciliation阶段：执行 diff 算法，纯 JS 计算
  2. commit 阶段：将 diff 结果渲染到 DOM



### 为何 patch 分为两个阶段？

- js 是单线程的，和 DOM 渲染公用一个线程（类比回流的过程）
- 组件复杂的时候，组件更新计算和渲染都压力很大
- 同时有 DOM 操作需求的时候（动画、鼠标拖拽），会卡顿。解决方案是 `fiber`



### 何为 fiber

单线程调度算法

[fiber介绍](https://juejin.im/post/5ab7b3a2f265da2378403e57)

react在进行组件渲染时，从setState开始到渲染完成整个过程是同步的（“一气呵成”）。如果需要渲染的组件比较庞大，js执行会占据主线程时间较长，会导致页面响应度变差，使得react在动画、手势等应用中效果比较差。

为了解决这个问题，react团队经过两年的工作，重写了react中核心算法——[reconciliation](https://reactjs.org/docs/reconciliation.html)。并在v16版本中发布了这个新的特性。为了区别之前和之后的reconciler，通常将之前的reconciler称为stack reconciler，重写后的称为fiber reconciler，简称为Fiber。

- 将 reconciliation（重写了） 阶段进行拆分（commit无法拆分，一次执行完）
- DOM 需要渲染时候暂停，空闲时恢复
- 何时暂停何时恢复呢？ [window.requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) (Edge,IE,Safari不支持，用 polyfill)



## 总结

- 函数式编程：纯函数，不可变值
- VDOM 和 diff
- JSX 的本质
- 合成事件
- setState 和 batchUpdate
- 组件渲染和更新的过程
- fiber 架构