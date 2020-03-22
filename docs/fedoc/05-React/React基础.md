# React 基础

## React 最新的生命周期是怎样的?

[参考](https://juejin.im/post/5b6f1800f265da282d45a79a#heading-0)

### 挂载阶段

- constructor
- getDerivedStateFromProps
- UNSAVE_componentWillMount 组件即将被装载、渲染到页面上
- render 组件在这里生成虚拟的`DOM`节点
- componentDidMount 组件真正在被装载之后

### 更新阶段

更新阶段，当组件的 props 改变了，或组件内部调用了 setState 或者 forceUpdate 发生，会发生多次

- UNSAFE_componentWillReceiveProps 组件将要接收到属性的时候调用
- getDerivedStateFromProps
- shouldComponentUpdate
- UNSAFE_componentWillUpdate 组件即将更新不能修改属性和状态
- render
- getSnapshotBeforeUpdate
- componentDidUpdate

### 卸载阶段

- componentWillUnmount

当我们的组件被卸载或者销毁了就会调用，我们可以在这个函数里去清除一些定时器，取消网络请求，清理无效的 DOM 元素等垃圾清理工作

注意不要在这个函数里去调用 setState，因为组件不会重新渲染了

## ajax 应该放在哪个生命周期中？

- `React` 下一代调和算法 `Fiber` 会通过开始或停止渲染的方式优化应用性能，其会影响到 `componentWillMount` 的触发次数。对于 `componentWillMount` 这个生命周期函数的调用次数会变得不确定，`React` 可能会多次频繁调用 `componentWillMount`。如果我们将 `AJAX` 请求放到 `componentWillMount` 函数中，那么可能会被触发多次，自然也就不是好的选择。
- 如果我们将`AJAX` 请求放置在生命周期的其他函数中，我们并不能保证请求仅在组件挂载完毕后才会要求响应。如果我们的数据请求在组件挂载之前就完成，并且调用了`setState`函数将数据添加到组件状态中，对于未挂载的组件则会报错。而在 `componentDidMount` 函数中进行 `AJAX` 请求则能有效避免这个问题

## diff 算法做了哪些优化？

- 把树形结构按照层级分解，只比较同级元素。
- 给列表结构的每个单元添加唯一的`key`属性，方便比较。
- `React` 只会匹配相同 tag 的 `component`（这里面的`class`指的是组件的名字）
- 合并操作，调用 `component` 的 `setState` 方法的时候, `React` 将其标记为 - `dirty`.到每一个事件循环结束, `React` 检查所有标记 `dirty`的 `component`重新绘制.
- 选择性子树渲染。开发人员可以重写`shouldComponentUpdate`提高`diff`的性能

## shouldComponentUpdate 如何配合性能优化

**scu 有什么用？背后逻辑是什么？**

- 默认返回 true。父组件更新，所有子组件无条件更新

**既然 scu 这么好，为什么还给你提供自定义的能力，不给他直接实现到框架内部呢？**

- 因为一定要配合不可变值
- 所以有的开发者会使用不合规范的写法，导致不发生重渲染

**比较的时候如何有什么要注意的问题？**

- 用\_.isEqual JSON.stringfy() 深度比较会非常耗费性能
- 所以设计 state 的时候不要层级太深
- 使用浅比较，浅比较已经适用大部分情况了
- 另外可以自定义比较

当然如果真的想完整对比当前 `state` 和之前的 `state` 是否相同，并且不影响性能也是行得通的，可以通过 `immutable` 或者 `immer` 这些库来生成不可变对象。这类库对于操作大规模的数据来说会提升不错的性能，并且一旦改变数据就会生成一个新的对象，对比前后 `state` 是否一致也就方便多了，同时也很推荐阅读下 `immer` 的源码实现。

- 彻底拥抱不可变值
- 解决了什么问题？深拷贝性能太差，immutable.js 基于共享数据和结构，性能好
- 有一定学习和使用成本
- [Immer](https://github.com/mweststrate/immer) 是 mobx 的作者写的一个 immutable 库，核心实现是利用 ES6 的 proxy，几乎以最小的成本实现了 js 的不可变数据结构

## React 中 keys 的作用是什么？

`Keys`是 `React` 用于追踪哪些列表中元素被修改、被添加或者被移除的辅助标识

- 在开发过程中，我们需要保证某个元素的 `key` 在其同级元素中具有唯一性。在 `React Diff` 算法中`React` 会借助元素的 `Key` 值来判断该元素是新近创建的还是被移动而来的元素，从而减少不必要的元素重渲染。此外，React 还需要借助 `Key` 值来判断元素与本地状态的关联关系，因此我们绝不可忽视转换函数中 `Key` 的重要性

## 函数组件和 class 组件的区别？

- 纯函数，输入 props，输出 JSX
- 没有实例，没有生命周期，没有 state
- 不能拓展其他方法

## setState 后发生了什么?

当给 setState 传入新对象时，React 内部会进行一种类似 Object.assign() 的方式对象合并，把需要更新的 state 合并后放入状态队列，利用这个队列可以更加高效的批量更新 state；当参数为函数时，React 会将所有更新组成队列，并且按顺序来执行，这样避免了将 state 合并成一个对象的问题，之后会启动一个`reconciliation`调和过程，即创建一个新的 React Element tree（UI 层面的对象表示）并且和之前的 tree 作比较，基于你传递给 setState 的对象找出发生的变化，最后更新 DOM 中需改动的部分。

![image-20200226074600085](https://tva1.sinaimg.cn/large/0082zybply1gc9gqugd88j30ht0cemz9.jpg)

## setState 到底是异步还是同步?

看右边，开始处于 `batchUpdate` 中，`isBatchingUpdates = true`，接着开始执行 `setTimeout`，但是里面的 `setState` 是异步的，所以还没执行，紧接着 `isBatchingUpdates = false` 。因此之后 `setState` 执行的时候，`isBatchingUpdates = false` ，所以开始走流程图的右边了。

- 同步异步不是由 setState 自己决定的
- 就是看能否命中 batchUpdate 机制
- 判断 `isBatchingUpdate`

**能命中 batchUpdate 机制：**

- 生命周期以及其调用的函数
- React 中注册的事件（和它调用的函数）
- React 可以“管理”的入口

**不能命中：**

- setTimeout，setInterval（和它调用的函数）
- 自定义的 DOM 事件
- React “管不到” 的入口，不是 React 那儿注册的

## HOC 解决了什么问题？

```js
function add(a, b) {
  return a + b
}
```

现在如果我想给这个 `add` 函数添加一个输出结果的功能，那么你可能会考虑我直接使用 `console.log` 不就实现了么。说的没错，但是如果我们想做的**更加优雅并且容易复用和扩展**，我们可以这样去做

```js
function withLog(fn) {
  function wrapper(a, b) {
    const result = fn(a, b)
    console.log(result)
    return result
  }
  return wrapper
}
const withLogAdd = withLog(add)
withLogAdd(1, 2)
```

- 其实这个做法在函数式编程里称之为高阶函数，大家都知道 `React` 的思想中是存在函数式编程的，高阶组件和高阶函数就是同一个东西。我们实现一个函数，传入一个组件，然后在函数内部再实现一个函数去扩展传入的组件，最后返回一个新的组件，这就是高阶组件的概念，作用就是为了更好的复用代码。
- 其实 `HOC` 和 `Vue` 中的 `mixins` 作用是一致的，并且在早期 `React` 也是使用 `mixins` 的方式。但是在使用 `class` 的方式创建组件以后，`mixins` 的方式就不能使用了，并且其实 `mixins` 也是存在一些问题的，比如

1. 隐含了一些依赖，比如我在组件中写了某个 `state` 并且在 `mixin` 中使用了，就这存在了一个依赖关系。万一下次别人要移除它，就得去 `mixin` 中查找依赖
2. 多个 `mixin` 中可能存在相同命名的函数，同时代码组件中也不能出现相同命名的函数，否则就是重写了，其实我一直觉得命名真的是一件麻烦事。。
3. 雪球效应，虽然我一个组件还是使用着同一个 `mixin`，但是一个 `mixin` 会被多个组件使用，可能会存在需求使得 `mixin` 修改原本的函数或者新增更多的函数，这样可能就会产生一个维护成本

> `HOC` 解决了这些问题，并且它们达成的效果也是一致的，同时也更加的政治正确（毕竟更加函数式了）

抽离多个组件的公共逻辑

- HOC
- Render Props

## state 和 props 有什么区别？

一句话概括，props 是组件对外的接口，state 是组件对内的接口。

`state` 的主要作用是用于组件保存、控制、修改*自己*的可变状态。`state` 在组件内部初始化，可以被组件自身修改，而外部不能访问也不能修改。你可以认为 `state` 是一个局部的、只能被组件自身控制的数据源。`state` 中状态可以通过 `this.setState` 方法进行更新，`setState` 会导致组件的重新渲染。

`props` 的主要作用是让使用该组件的父组件可以传入参数来配置该组件。它是外部传进来的配置参数，组件内部无法控制也无法修改。

`state` 和 `props` 有着千丝万缕的关系。它们都可以决定组件的行为和显示形态。一个组件的 `state` 中的数据可以通过 `props` 传给子组件，一个组件可以使用外部传入的 `props` 来初始化自己的 `state`。但是它们的职责其实非常明晰分明：_`state` 是让组件控制自己的状态，`props` 是让外部对组件自己进行配置_。

如果你觉得还是搞不清 `state` 和 `props` 的使用场景，那么请记住一个简单的规则：尽量少地用 `state`，尽量多地用 `props`。

没有 `state` 的组件叫无状态组件（stateless component），设置了 state 的叫做有状态组件（stateful component）。因为状态会带来管理的复杂性，我们尽量多地写无状态组件，尽量少地写有状态的组件。这样会降低代码维护的难度，也会在一定程度上增强组件的可复用性。前端应用状态管理是一个复杂的问题，我们后续会继续讨论。

| 场景                         | props  | state  |
| :--------------------------- | :----- | :----- |
| 是否可以从父组件中获取初始值 | 可以   | 可以   |
| 是否能被父组件改变           | 可以   | 不可以 |
| 是否能设置默认值             | 可以   | 不可以 |
| 是否在组件里改变值           | 不可以 | 可以   |
| 能否给子组件设置初始值       | 可以   | 可以   |
| 能否在子组件里被改变值       | 可以   | 可以   |

**总结一下**：

1. props 用于定义外部接口，使用 state 来存储控制当前页面逻辑的数据；
2. props 的赋值是在父级组件，state 赋值在当前组件内部；
3. props 是不可变的，而 state 是可变的；
4. 使用 props 比 state 会有更好的性能；

## PureComponent 纯组件 和 memo

- PureComponent，memo 实现了 SCU 中的浅比较（只比较第一层）
- memo 就是 PC 的函数组件版本
- 必须配合不可变值

## 什么是受控组件？

- 表单的值，受 state 控制
- 需要自行监听 onChange 事件
- 对比非受控组件

## react-router 如何配置懒加载？

![image-20200318151935024](https://tva1.sinaimg.cn/large/00831rSTly1gcy3v85jpwj30tb0fsgtu.jpg)

## 何为 fiber

js 的单线程调度算法

[fiber 介绍](https://juejin.im/post/5ab7b3a2f265da2378403e57)

react 在进行组件渲染时，从 setState 开始到渲染完成整个过程是同步的（“一气呵成”）。如果需要渲染的组件比较庞大，js 执行会占据主线程时间较长，会导致页面响应度变差，使得 react 在动画、手势等应用中效果比较差。

为了解决这个问题，react 团队经过两年的工作，重写了 react 中核心算法——[reconciliation](https://reactjs.org/docs/reconciliation.html)。并在 v16 版本中发布了这个新的特性。为了区别之前和之后的 reconciler，通常将之前的 reconciler 称为 stack reconciler，重写后的称为 fiber reconciler，简称为 Fiber。

- 将 reconciliation（重写了） 阶段进行拆分（commit 无法拆分，一次执行完）
- DOM 需要渲染时候暂停，空闲时恢复
- 何时暂停何时恢复呢？ [window.requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) (Edge,IE,Safari 不支持，用 polyfill)

## React 性能优化

- 减少 bind this
- 合理使用 SCU，Pure 和 memo
- webpack 层面的优化
- 前端通用的，比如图片懒加载，base64，CSS
- 使用 SSR
