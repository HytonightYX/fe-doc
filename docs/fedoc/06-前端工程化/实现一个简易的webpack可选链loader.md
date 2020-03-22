# optional-chaining-loader

## 1.可选链是什么？解决了什么问题？

根据 [MDN 文档](<[https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/%E5%8F%AF%E9%80%89%E9%93%BE](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/可选链)>)

> 可选链操作符`?.`能够去读取一个被连接对象的深层次的属性的值而无需明确校验链条上每一个引用的有效性。`?.`运算符功能类似于`.`运算符，不同之处在于如果链条上的一个引用是[nullish](https://developer.mozilla.org/en-US/docs/Glossary/nullish) ([`null`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/null) 或 [`undefined`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/undefined))，`.`操作符会引起一个错误，`?.`操作符取而代之的是会按照短路计算的方式返回一个 undefined。当`?.`操作符用于函数调用时，如果该函数不存在也将会返回 undefined。
>
> 当访问链条上可能存在的属性却不存在时，`?.`操作符将会使表达式更短和更简单。当不能保证哪些属性是必需的时，`?.`操作符对于探索一个对象的内容是很有帮助的。

例子

```javascript
const adventurer = {
  name: 'Alice',
  cat: {
    name: 'Dinah'
  }
}

const dogName = adventurer.dog?.name
console.log(dogName)
// expected output: undefined

console.log(adventurer.someNonExistentMethod?.())
// expected output: undefined
```

更多语法可以参见 [TC39](https://github.com/tc39/proposal-optional-chaining#syntax)

## 2.思路

```javascript
const obj = { foo: { bar: { baz: 2 } } }
console.log(obj.foo.bar?.baz)
// 需要转换成 obj && obj.foo && obj.foo.bar && obj.foo.bar.baz
```

观察上面两个例子，可以发现三点

（1） 对于 `x?.y`，相当于 `x && x.y`

（2） 对于 `x.y?.z`，则相当于 `x?.y?.z`，也就是`x && x.y && x.y.z`，这是相比 [**TC39**](https://github.com/tc39/proposal-optional-chaining#faq) 不一样的地方

> **In a deeply nested chain like `a?.b?.c`, why should I write `?.` at each level? Should I not be able to write the operator only once for the whole chain?**
>
> By design, we want the developer to be able to mark each place that they expect to be null/undefined, and only those. Indeed, we believe that an unexpected null/undefined value, being a symptom of a probable bug, should be reported as a TypeError rather than swept under the rug.

（3） 对于函数，`fn?.()` 相当于 `fn && fn()`

### webpack loader

本质还是字符串的修改，只要拿到代码字符串就可以做，那么写一个 `webpack-loader` 做正则匹配也可行。

### babel loader

可选链是 ES-next 的内容，容易想到用 `babel`。因此写一个 `babel loader` 操作 AST 应该也可以做。

[@babel/plugin-proposal-optional-chaining](https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js)

## 3.webpack loader 实现

### 正则匹配

之后，我们本质上修改字符串就可以达到这个效果，请出[正则表达式](regex101)就完事了。

##### 匹配变量和.号，变量可以是字母、数字、美元符号(`$`)和下划线

`[\w\$_\.]`

##### 匹配.和?

`\?\.`

##### 匹配函数后跟的`(` , `[`

判断是否为函数 `fn?.()`, 数组 `arr?.[1]` 或对象属性 `obj?.['name']`

`[(\(\[]?`

最终得到

`/([\w\$_\?\.]+\?\.)[(\(\[]?/g`

![image-20200313101052251](http://qn-noter.yunxi.site/imagehost/0wyn5.png)

根据 `.` 或者 `?.` 去拆开变量，最后把他们套娃一样套起来。

`x.y.z?. => x && x.y && x.y.z`

再判断一下结尾，如果有 `(` 或 `[` 则需要补上括号，否则补个 `.`

### 代码实现

```javascript
/**
 * webpack loader
 * Optional Chain Transformer
 *
 * @param {string} source 待处理代码字符串
 * @author Husiyuan
 */
function optionalChain(source) {
  const replacer = str => {
    // 判断是否为函数 fn?.(), 数组arr?.[1] 或对象属性, obj?.['name']
    const endBrackets = str[str.length - 1]
    const haveEndBrackets = endBrackets === '(' || endBrackets === '['

    // 去除末尾 ( 或 [，切分变量
    const varList = str.replace(/[\[\(]/g, '').split(/\.|\?\./)
    // 去除末尾空字符
    varList.pop()

    const defaultListIndex = 0
    let ret = varList[defaultListIndex]
    let pre = ret
    // 开始拼接操作
    for (let i = 1; i < varList.length; i++) {
      pre = pre + '.' + varList[i]
      ret += ' && ' + pre
    }
    ret += ' && ' + pre

    return ret + (haveEndBrackets ? endBrackets : '.')
  }

  return source.replace(/([\w\$_\?\.]+\?\.)[(\(\[]?/g, replacer)
}
```
