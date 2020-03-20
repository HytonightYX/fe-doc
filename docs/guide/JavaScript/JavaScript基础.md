

# 你不知道的JavaScript

### 基本类型(原始类型)有哪几种？null 是对象吗？基本数据类型和复杂数据类型（Object）存储有什么区别？

- [原始类型](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures)有 7 种，分别是`boolean`, `null`, `undefined`, `number`, `bigint`, `string`, `symbol`

- 原始类型存储的都是值，是没有函数可以调用的
- `'1'.toString()` 这样的情况，`'1'` 已经不是原始的`string`类型了，而是被强制转换成了 `String` 类型，也就是对象类型
- **基本数据类型存储在栈内存**，存储的是值
- **复杂数据类型的值存储在堆内存，地址（指向堆中的值）存储在栈内存**。当我们把对象赋值给另外一个变量的时候，复制的是地址，指向同一块内存空间，当其中一个对象改变时，另一个对象也会变化

两个坑：

-  `number` 类型是浮点类型的，在使用中会遇到某些 Bug，比如 `0.1 + 0.2 !== 0.3`。`string` 类型是不可变的，无论你在 `string` 类型上调用何种方法，都不会对值有改变
- 虽然 `typeof null` 返回的值是 `object`，但是 `null` 不是对象，而是基本数据类型的一种。这是一个悠久 Bug。在 JS 的最初版本中使用的是 32 位系统，为了性能考虑使用低位存储变量的类型信息，`000` 开头代表是对象，然而 `null` 表示为全零，所以将它错误的判断为 `object` 

### 

JavaScript中`Number.MAX_SAFE_INTEGER`表示最大安全数字,计算结果是9007199254740991，即在这个数范围内不会出现精度丢失（小数除外）。

但是一旦超过这个范围，js就会出现计算不准确的情况，这在大数计算的时候不得不依靠一些第三方库进行解决，因此官方提出了BigInt来解决此问题。



### typeof 是否正确判断类型? instanceof呢？ instanceof 的实现原理是什么？

- `typeof` 能正确判断基本数据类型，**除了 null**（null 输出 object，这是一个bug）
- 对于对象来说，



### for...of , for...in, forEach, map 的区别

- `for...of` 有 iterator 接口，就可以用for of遍历他的成员（属性值）。

https://juejin.im/post/5cab0c45f265da2513734390#heading-0



### == 和 === 有什么区别？

- === 不需要进行类型转换，只有类型相同并且值相等时，才返回 true
- == 如果两者类型不同，首先需要进行类型转换。具体流程如下

1. 首先判断两者类型是否相同，如果相同，判断值是否相等
2. 如果类型不同，进行类型转换
3. 判断比较的是否是 `null` 或者是 `undefined`, 如果是, 返回 `true`

### 如何进行尾递归优化？

```javascript
function factorial(n) {
    if (n === 1) {
        return n;
    }

    return n * factorial(n - 1) // 重点在尾部调用返回
}

console.log(factorial(5)) // 120
```

```javascript
function factorial(n, total = 1) {
    if (n === 1) {
        return total;
    }
    
    return factorial(n - 1, total * n); // 重点在尾部调用返回
}

console.log(factorial(5)) // 120
```



### 箭头函数相比普通函数的区别

[参考](https://juejin.im/post/5c979300e51d456f49110bf0#heading-4)

> 第一，箭头函数更简洁；第二，没有自己的this，他的this 指向在定义时所处的外层上下文，并且永远不会变，即使是 call,apply,bind 也是无效的，但不会报错；第三，没有自己的 auguments 对象，arguments 指向的也是外层上下文的 auguments，如果是全局，则为 undefined；第四，没有原型对象 `prototype`；第五，不能用作Generator函数。

**1.箭头函数更简洁清晰**

**2.箭头函数不会创建自己的`this`，所以它没有自己的`this`，它只会从自己的作用域链的上一层继承`this`**

> 箭头函数没有自己的this，它会捕获自己在**定义时（注意，是定义时，不是调用时）**所处的外层执行环境的this，并继承这个this值。所以，**箭头函数中this的指向在它被定义的时候就已经确定了，之后永远不会改变**。

```javascript
var id = 'Global'
function fun1() {
  setTimeout(function() {
    console.log(this.id)
  }, 2000)
}
function fun2() {
  setTimeout(() => {
    console.log(this.id)
  }, 2000)
}
fun1.call({ id: 'Obj' }) // 'Global'
fun2.call({ id: 'Obj' }) // 'Obj'
```

**3.箭头函数继承而来的this指向永远不变**

上面的例子，就完全可以说明箭头函数继承而来的`this`指向永远不变。对象`obj`的方法`b`是使用箭头函数定义的，这个函数中的`this`就**永远指向**它定义时所处的全局执行环境中的`this`，即便这个函数是作为对象`obj`的方法调用，`this`依旧指向`Window`对象。

**4.call()/apply()/bind() 无法改变箭头函数中this的指向**

`.call()`/`.apply()`/`.bind()`方法可以用来动态修改函数执行时`this`的指向，但由于箭头函数的`this`定义时就已经确定且永远不会改变。所以使用这些方法永远也改变不了箭头函数`this`的指向，虽然这么做代码不会报错。

**5.箭头函数不能作为构造函数使用**

构造函数 new 做了什么？

① JS内部首先会先生成一个对象； ② 再把函数中的this指向该对象； ③ 然后执行构造函数中的语句； ④ 最终返回该对象实例。

但还是由于**箭头函数没有自己的 this** 的特性，所以无法作为构造函数来使用。

**6.箭头函数没有自己的arguments**

箭头函数没有自己的`arguments`对象。在箭头函数中访问`arguments`实际上获得的是外层局部（函数）执行环境中的值。当然如果外层OR全局没有 arguments 的话，就报错。

<details>
  <summary>折叠代码块</summary>
  <pre><code> 
// 例子一
let fun = (val) => {
    console.log(val);   // 111
    // 下面一行会报错
    // Uncaught ReferenceError: arguments is not defined
    // 因为外层全局环境没有arguments对象
    console.log(arguments); 
};
fun(111);
// 例子二
function outer(val1, val2) {
    let argOut = arguments;
    console.log(argOut);    // ①
    let fun = () => {
        let argIn = arguments;
        console.log(argIn);     // ②
        console.log(argOut === argIn);  // ③
    };
    fun();
}
outer(111, 222);
  </code></pre>
</details>

**7、箭头函数没有原型prototype**

**8、箭头函数不能用作Generator函数，不能使用yeild关键字**



### ES6 Module 和 Commonjs 的区别

- #### ES6 Module的特点(对比CommonJS)

- CommonJS模块是运行时加载，ES6 Module是编译时输出接口；
- CommonJS加载的是整个模块，将所有的接口全部加载进来，ES6 Module可以单独加载其中的某个接口；
- CommonJS输出是值的拷贝，ES6 Module输出的是值的引用，被输出模块的内部的改变会影响引用的改变；
- CommonJS `this`指向当前模块，ES6 Module默认开启严格模式 `this`指向`undefined`;



### 什么是函数式编程？

- 纯函数
  - 返回一个新的值，没有副作用，不会偷偷修改其他值
  - 重点：不可变值
  - 输入和返回的值的类型相同，接口相同

- curry 化

