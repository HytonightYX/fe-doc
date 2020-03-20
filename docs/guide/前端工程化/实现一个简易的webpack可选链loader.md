# 实现一个简易的webpack可选链loader



## 1.可选链是什么？解决了什么问题？

根据 [MDN 文档]([https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/%E5%8F%AF%E9%80%89%E9%93%BE](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/可选链))

> **可选链**操作符**`?.`**能够去读取一个被连接对象的深层次的属性的值而无需明确校验链条上每一个引用的有效性。**`?.`**运算符功能类似于**`.`**运算符，不同之处在于如果链条上的一个引用是[nullish](https://developer.mozilla.org/en-US/docs/Glossary/nullish) ([`null`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/null) 或 [`undefined`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/undefined))，**`.`**操作符会引起一个错误，**`?.`**操作符取而代之的是会按照**短路计算**的方式返回一个undefined。当**`?.`**操作符用于函数调用时，如果该函数不存在也将会返回undefined。
>
> 当访问链条上可能存在的属性却不存在时，**`?.`**操作符将会使表达式更短和更简单。当不能保证哪些属性是必需的时，**`?.`**操作符对于探索一个对象的内容是很有帮助的。

实际业务中，我们常用 `axios` 做数据拉取

```javascript
const adventurer = {
  name: 'Alice',
  cat: {
    name: 'Dinah'
  }
};

const dogName = adventurer.dog?.name;
console.log(dogName);
// expected output: undefined

console.log(adventurer.someNonExistentMethod?.())
// expected output: undefined
```

因此，可以理解为 `obj && obj.foo` 的语法糖。此外，文档给了我们几个信息：

- 



## 2.思路

### babel loader

可选链是 ES-next 的内容，第一时间会想到用 `babel`。因此写一个 `babel loader` 操作 AST 肯定是可以做的



### webpack loader

不过，既然本质还是字符串的修改，只要拿到代码字符串就可以做，那么写一个 `webpack-loader`  做正则匹配也可行。



## 3.配置开发环境

显然，我们需要 webpack

```c
yarn init
// webpack
yarn add -D webpack webpack-cli webpack-dev-server
// env-var
yarn add cross-env
```



## 4.