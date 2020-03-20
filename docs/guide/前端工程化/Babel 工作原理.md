# Babel 是如何转换代码的？

Babel 是一个是一个 JavaScript 编译器，主要用于将 ECMAScript 2015+ 版本的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。

Babel 是一个编译器（输入源码 => 输出编译后的代码）。就像其他编译器一样，编译过程分为三个阶段：解析、转换和打印输出。



## Babel 工作原理





## 实战：转换箭头函数

### 环境搭建

```
yarn add @babel/core @babel/types --dev
```



### 明确目标：转换箭头函数

```javascript
const sum = (a, b) => a + b
// 我们要转换为
const sum = function(a, b) {
  return a + b
}
```



[@babel/types](https://babeljs.io/docs/en/babel-types) 已经准备了大量的API，我们通过这些 API 就可以对对应的部分进行修改。

我们将两个函数分别输入[AST Explorer](https://astexplorer.net/)，对比输出的 AST，结果给大家标示出来了

![image-20200225135237205](https://tva1.sinaimg.cn/large/0082zybply1gc8lq0wwegj30sn0l7n2d.jpg)



好了，我们知道，babel 做的事情就是 AST 的修改，去[@babel/types](https://babeljs.io/docs/en/babel-types)找一找function函数和箭头函数的定义：

```javascript
/**
 * ES5函数 functionExpression
 * @param {Identifier} id default: null
 * @param {Array<LVal>} params required
 * @param {BlockStatement} body required
 * @param {boolean} generator default: false
 * @param {boolean} async default: false
 */
t.functionExpression(id, params, body, generator, async)

/**
 * ES6箭头函数 arrowFunctionExpression
 * @param {Identifier} params required
 * @param {BlockStatement} body required
 * @param {boolean} async default: false
 */
t.arrowFunctionExpression(params, body, async)
```

我们马上可以知道思路，我们创建出一个新的 `FunctionExpression`，然后把原来的 `ArrowFunctionExpression` 整个替换掉就行了。怎么替换呢，看上面定义，我们把箭头函数的



### 代码实现

```javascript
const babel = require('@babel/core')
// 用于检查，构建和更改AST树的节点
const types = require('@babel/types')

const code = `const sum = (a, b) => a + b`

let visitor = {
  // 要处理的是 ArrowFunctionExpression
  ArrowFunctionExpression(path) {
    let params = path.node.params
    // 这里我们新建一个块 blockStatement
    // 另外我们分析 AST 对比图，可以发现 ReturnStatement 内部
    // 其实是一致的，因此下面这么写就行了
    let blockStatement = types.blockStatement([
      types.returnStatement(path.node.body)
    ])
    let func = types.functionExpression(null, params, blockStatement, false, false)
    path.replaceWith(func)
  }
}

// 这里我们需要用到 babel 中的 transform 方法，
// 它可以将 js 代码转换成 AST
let result = babel.transform(code, {
  plugins: [
    { visitor }
  ]
})

console.log(result.code)
```





## 参考链接

- [Babel是如何读懂JS代码的](https://zhuanlan.zhihu.com/p/27289600)

- [剖析 Babel——Babel 总览](http://www.alloyteam.com/2017/04/analysis-of-babel-babel-overview/)
- [聊一聊 Javascript 中的 AST](https://juejin.im/post/5d9ed72b6fb9a04e3043d36e#heading-5)
- [面试官: 你了解过Babel吗?](https://cnodejs.org/topic/5a9317d38d6e16e56bb808d1)
- [@babel/types](https://babeljs.io/docs/en/babel-types)
- [AST Explorer](https://astexplorer.net/)