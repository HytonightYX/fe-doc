# JS 继承的八种写法

笔者刚接触前端是在大半年前，那是早已是 ES6 + React/Vue 盛行的年代。而自己又是追求新潮新技术的人，心想有了ES6+这么多“高级”的写法为何还要去学那古老的ES5-？但是随着学习的深入，遇到了许多不明不白的错误，DEBUG起来一头雾水，这才明白是自己对JavaScript的原理了解甚少，语法糖终究是语法糖，不懂底层原理最终坑的是自己。其实不仅是JS，React框架等等也是一个道理。

感悟抒发完了，今天好好地把继承这部分捋捋清楚。



## 继承分类

先来个整体印象。如图所示，JS中继承可以按照是否使用object函数（在下文中会提到），将继承分成两部分（Object.create是ES5新增的方法，用来规范化这个函数）。

其中，原型链继承和原型式继承有一样的优缺点，构造函数继承与寄生式继承也相互对应。寄生组合继承基于Object.create, 同时优化了组合继承，成为了完美的继承方式。ES6 Class Extends的结果与寄生组合继承基本一致，但是实现方案又略有不同。

![image-20200301095456912](http://qn-noter.yunxi.site/imagehost/n5zcl.png-style1)



## 原型链继承

构造函数、原型和实例之间的关系：每个构造函数都有一个原型对象，原型对象都包含一个指向构造函数的指针，而实例都包含一个原型对象的指针。

继承的本质就是**复制，即重写原型对象，代之以一个新类型的实例**。

```javascript
function SuperType() {
  this.property = true
}
SuperType.prototype.getSuperValue = function() {
  return this.property
}
function SubType() {
  this.subProperty = false
}
SubType.prototype.getSubValue = function() {
  return this.subProperty
}
// 关键，创建SuperType的实例，让SubType.prototype指向这个实例
SubType.prototype = new SuperType()
console.dir(SuperType)
let inst1 = new SuperType()
let inst2 = new SubType()
console.log(inst2.getSuperValue()) // true
```



**优点**：

- 父类方法可以复用

**缺点**：

- 父类的引用属性会被所有子类实例共享，多个实例对引用类型的操作会被篡改（代码如下）；
- 子类构建实例时不能向父类传递参数

```javascript
function SuperType(){
  this.colors = ["red", "blue", "green"];
}
function SubType(){}

SubType.prototype = new SuperType();

// 多个实例共享父类引用（上面的 new SuperType()）
var instance1 = new SubType();
instance1.colors.push("black");
alert(instance1.colors); //"red,blue,green,black"

var instance2 = new SubType(); 
alert(instance2.colors); //"red,blue,green,black"
```



## 构造函数继承

使用父类的构造函数来增强子类**实例**，等同于复制父类的实例给子类（不使用原型）

```javascript
function SuperType() {
  this.color = ['red', 'green']
}

// 构造函数继承
// 使得每个实例都会复制得到自己独有的一份属性
function SubType() {
  // 将父对象的构造函数绑定在子对象上
  SuperType.call(this)
}

let inst1 = new SubType()

console.log(inst1)

// SubType {color: Array(2)}
```

核心代码是`SuperType.call(this)`，创建子类实例时调用`SuperType`构造函数，于是`SubType`的每个实例都会将SuperType中的属性复制一份，**解决了原型链继承中多实例相互影响的问题**。



**优点**：和原型链继承完全反过来

- 父类的引用属性不会被共享
- 子类构建实例时可以向父类传递参数

**缺点**：

- 只能继承父类的**实例**属性和方法，不能继承原型属性/方法
- 无法实现复用，每个子类都有父类实例函数的副本，影响性能

```javascript
...
// 父类原型链上的方法
SuperType.prototype.getColor = function () {
  return this.color
}
...

console.log(inst1.getColor()) // TypeError: inst1.getColor is not a function
```



## 组合继承（上面两种结合起来）

组合上述两种方法就是组合继承。用原型链实现对**原型**属性和方法的继承，用借用构造函数技术来实现**实例**属性的继承。

```javascript
function SuperType(name) {
  this.name = name
  this.colors = ['red', 'blue', 'green']
}

SuperType.prototype.getName = function () {
  return this.name
}

function SubType(name, age) {
  // 1、构造函数来复制父类的属性给SubType实例
  // *** 第二次调用SuperType()
  SuperType.call(this, name)
  this.age = age
}

SubType.prototype.getAge = function () {
  return this.age
}

// 2、原型继承
// *** 第一次调用SuperType()
SubType.prototype = new SuperType()
// 手动挂上构造器，指向自己的构造函数 SubType
SubType.prototype.constructor = SubType
SubType.prototype.getAge = function () {
  return this.age
}

let inst1 = new SubType('Asuna', 20)

console.log('inst1', inst1)
console.log(inst1.getName(), inst1.getAge())
console.log(inst1 instanceof SubType, inst1 instanceof SuperType)


// inst1 SubType {name: "Asuna", colors: Array(3), age: 20}
// Asuna 20
// true true
```

![image-20200301153621951](http://qn-noter.yunxi.site/imagehost/yozb8.png)



**优点**：

- 父类的方法可以被复用
- 父类的引用属性不会被共享
- 子类构建实例时可以向父类传递参数



**缺点（对照注释）**：

- 第一次调用`SuperType()`：给`SubType.prototype`写入两个属性name，color。
- 第二次调用`SuperType()`：给`instance1`写入两个属性name，color。

实例对象`inst1`上的两个属性就屏蔽了其原型对象SubType.prototype的两个同名属性。所以，组合模式的缺点就是在使用子类创建实例对象时，其原型中会存在两份相同的父类实例的属性/方法。这种被覆盖的情况造成了性能上的浪费。



## 原型式继承(哎，就是浅拷贝)

我们举个🌰，比如，现在有一个对象，叫做"中国人"，还有一个对象，叫做"医生"。

```javascript
const Chinese = {
  nation: '中国'
}

const Doctor = {
  career: '医生'
}
```

请问怎样才能让"医生"去继承"中国人"，也就是说，我怎样才能生成一个"中国医生"的对象？

这里要注意，这两个对象都是**普通对象**，不是构造函数，所以无法使用构造函数方法实现"继承"。



**可以用`object()`方法**

利用一个**空对象作为中介**，将某个对象直接赋值给空对象构造函数的原型。

```javascript
// ES5中存在Object.create()的方法，能覆盖下面这个方法
function object(obj) {
  function F() { }
  F.prototype = obj
  return new F()
}
```

`object()`本质上是对传入其中的对象执行了一次`浅拷贝`，将构造函数`F`的原型直接指向传入的对象。

```javascript
let person = {
  name: "Nicholas",
  friends: ["Shelby", "Court", "Van"]
};

let anotherPerson = object(person);
anotherPerson.name = "Greg";
anotherPerson.friends.push("Rob");

let yetAnotherPerson = object(person);
yetAnotherPerson.name = "Linda";
yetAnotherPerson.friends.push("Barbie");

alert(person.friends);   //"Shelby,Court,Van,Rob,Barbie"
```

> ECMAScript 5 通过新增 [Object.create()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create) 方法规范化了原型式继承。这个方法接收两个参数:一 个用作新对象原型的对象和(可选的)一个为新对象定义额外属性的对象。在传入一个参数的情况下， Object.create()与 object()方法的行为相同。——《JavaScript高级程序设计》

```javascript
let yetAnotherPerson = object(person)
//  => 
let yetAnotherPerson = Object.create(person)
```



**优点**：

- 父类方法可以复用

**缺点**：

- 原型链继承多个实例的引用类型属性指向相同，存在篡改的可能
- 子类构建实例时不能向父类传递参数



## 寄生式继承（能附加一些方法）

使用原型式继承获得一份目标对象的`浅拷贝`，然后增强了这个浅拷贝的能力。

**优缺点其实和原型式继承一样**，寄生式继承说白了就是能在拷贝来的对象上加点方法，也就是所谓增强能力。

```javascript
function object(obj) {
  function F() { }
  F.prototype = obj
  return new F()
}

function createAnother(original) {
  // 通过调用函数创建一个新对象
  let clone = object(original)
  //以某种方式来增强这个对象
  clone.getName = function () {
    console.log('我有了getName方法: ' + this.name)
  }
  return clone
}

let person = {
  name: 'Asuna',
  friends: ['Kirito', 'Yuuki', 'Sinon']
}

let inst1 = createAnother(person)
let inst2 = createAnother(person)
```

**优点**：

- 父类方法可以复用

**缺点**：

- 原型链继承多个实例的引用类型属性指向相同，存在篡改的可能
- 子类构建实例时不能向父类传递参数



## 寄生组合继承（最优方案）

组合继承会有两次调用父类的构造函数而造成浪费的缺点，寄生组合继承就可以解决这个问题。

核心在于`inheritPrototype(subType, superType)`，让子类的`prototype`指向**父类原型的拷贝**，这样就不会调用父类的构造函数，进而引发内存的浪费问题。



**完整代码**：

```javascript
function inheritPrototype(subType, superType) {
  // 修正子类原型对象指针，指向父类原型的一个副本 (用object()也可以) 
  subType.prototype = Object.create(superType.prototype)
  // 增强对象，弥补因重写原型而失去的默认的constructor属性
  subType.prototype.constructor = subType
}

function SuperType(name) {
  this.name = name
  this.colors = ['red', 'blue', 'green']
}

SuperType.prototype.getColors = function () {
  console.log(this.colors)
}

function SubType(name, age) {
  SuperType.call(this, name)
  this.age = age
}

inheritPrototype(SubType, SuperType)

SubType.prototype.getAge = function () {
  console.log(this.age)
}

let inst1 = new SubType("Asuna", 20)
let inst2 = new SubType("Krito", 21)
console.log('inst1', inst1)
console.log('inst2', inst2)
```

![image-20200301182914803](http://qn-noter.yunxi.site/imagehost/65y7m.png)



```javascript
// 构造函数继承和组合继承的缺陷：二次调用 SuperType 的构造函数
subType.prototype = new SuperType()
// 改为 => 
subType.prototype = Object.create(superType.prototype)
```



## 实现多继承

如果你希望能继承到多个对象，则可以使用混入的方式。

```javascript
function MyClass() {
     SuperClass.call(this);
     OtherSuperClass.call(this);
}

// 继承一个类（就是寄生组合继承的套路）
MyClass.prototype = Object.create(SuperClass.prototype);

// 混合其它类，关键是这里的 assign() 方法
Object.assign(MyClass.prototype, OtherSuperClass.prototype);

// 重新指定constructor
MyClass.prototype.constructor = MyClass;

// 在之类上附加方法
MyClass.prototype.myMethod = function() {
  // do a thing
};
```

> [Object.assign](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) 会把  `OtherSuperClass`原型上的函数拷贝到 `MyClass`原型上，使 MyClass 的所有实例都可用 OtherSuperClass 的方法。Object.assign 是在 ES2015 引入的，且可用[ polyfilled](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill)。要支持旧浏览器的话，可用使用 [jQuery.extend()](https://api.jquery.com/jQuery.extend/) 或者 [_.assign()](https://lodash.com/docs/#assign)。 ——[[MDN] Object.create()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create)



## ES6 extends

> 虽然 ES6 引入了关键字 class，但是底层仍然是基于原型的实现。class 只是语法糖，使得在 JavaScript 模拟类的代码更为简洁。——《JavaScript忍者秘籍》

```javascript
class Person {
  constructor(name) {
    this.name = name
  }

  // 原型方法
  // 即 Person.prototype.getName = function() { }
  // 下面可以简写为 getName() {...}
  getName = function () {
    console.log('Person:', this.name)
  }
}

class Gamer extends Person {
  constructor(name, age) {
    // 子类中存在构造函数，则需要在使用“this”之前首先调用 super()。
    super(name)
    this.age = age
  }
}

const asuna = new Gamer('Asuna', 20)
asuna.getName() // 成功访问到父类的方法
```



**`super` 实现的原理**

就是将继承的那个父类对象在子类中调用，比如 `super.call(this)` 实现将父类中的属性(父类的方法是通过原型链来继承，实例都可以共享这些方法)在子类中声明。



 **`extends` 中实现继承的源码**

```javascript
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass)
  }
  // 子类的原型的__proto__指向父类的原型
  subClass.prototype = Object.create(superClass && superClass.prototype,  
    // 给子类添加 constructor属性 subclass.prototype.constructor === subclass
    {
      constructor:
      {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    }
  )
  if (superClass)
    //子类__proto__ 指向父类
    Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass
}
```

更多 ES6 的源码解释点击[这里](https://segmentfault.com/a/1190000008390268)



## 总结

- ES6 Class extends是ES5继承的语法糖
- JS的继承除了构造函数继承之外都基于原型链构建的
- 函数声明和类声明的区别
  - 函数声明会提升，类声明不会。首先需要声明你的类，然后才能访问它。
- 可以用寄生组合继承实现ES6 Class extends，但是还是会有细微的差别
  - ES6的继承有所不同，实质上是先创建父类的实例对象this，然后再用子类的构造函数修改this。因为子类没有自己的this对象，所以必须先调用父类的super()方法，否则新建实例报错。



## 致谢

**本文参考自下面几篇很不错的文章**

[一篇文章理解JS继承——原型链/构造函数/组合/原型式/寄生式/寄生组合/Class extends](https://segmentfault.com/a/1190000015727237)

[JavaScript常用八种继承方案](https://juejin.im/post/5bcb2e295188255c55472db0)

[Javascript面向对象编程（三）：非构造函数的继承](http://www.ruanyifeng.com/blog/2010/05/object-oriented_javascript_inheritance_continued.html)

[ES6中类的实现原理](https://segmentfault.com/a/1190000008390268)



**还有这本书籍**

《JavaScript忍者秘籍》第七章