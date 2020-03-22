# URL3—渲染树形成+原理

![image-20200321085528048](http://qn-noter.yunxi.site/imagehost/dtbvt.png-style1)

## 什么是 DOM？

DOM 是 Document Object Model（文档对象模型）的缩写

> W3C 文档对象模型 （DOM） 是中立于平台和语言的接口，它允许程序和脚本动态地访问和更新文档的内容、结构和样式。-这是 W3Cschool 给的概念

看了上面的概念好像太“官方”，解释就是 DOM 是对 HTML 文档结构化的表述，后端服务器返回给浏览器渲染引擎的 HTML 文件字节流是无法直接被浏览器渲染引擎理解的，要转化为渲染器引擎可以理解的内部结构，这个结构就是 DOM。W3C 那个概念我好像还没有把它全部翻译完，“**允许程序和脚本动态地访问和更新文档的内容、结构和样式”**。这里其实就是 DOM 的作用了

1. 页面展示: DOM 是生成页面的基础数据结构
2. JavaScript 脚本操作: DOM 提供给 JavaScript 脚本操作的接口，JavaScript 可以通过这些接口对 DOM 结构进行访问，从而改变文档的结构和样式
3. 安全: DOM 是一道安全防线，DOM 解析阶段会过滤掉一些不安全的 DOM 内容。

> 本文我主要以 Webkit 渲染引擎来讲解，Safari 和 Chrome 都使用 Webkit。Webkit 是一款开源渲染引擎，它本来是为 linux 平台研发的，后来由 Apple 移植到 Mac 及 Windows 上。

## 渲染树最终形成经历了哪些

![image-20200321085613168](http://qn-noter.yunxi.site/imagehost/yozp2.png-style1)

## HTML 解析器(构建 DOM 树)

从后端返回给浏览器渲染引擎 HTML 文件字节流， 第一步要经过的就是渲染引擎中的 HTML 解析器。它实现了将 HTML 字节流转换为 DOM 树 结构。 HTML 文件字节流返回的过程中 HTML 解析器就一直在解析，边加载边解析哦(这里注意下，有些文章写的有问题)。

**例子 1:最简单的不带 CSS 和 JavaScript 的 HTML 代码讲解 HTML 解析器**

```html
<html>
  <body>
    <div>
      koala
      <p>
        程序员成长指北
      </p>
    </div>
  </body>
</html>
```

根据这段代码具体分析 HTML 解析器做了哪些事

### 阶段一 字节流转换为字符并 W3C 标准令牌化

读取 HTML 的原始字节流，并根据文件的指定编码（例如 UTF-8）将它们转换成各个字符。 并将字符串转换成 W3C HTML5 标准规定的各种令牌，例如，“”、“”，以及其他尖括号内的字符串。每个令牌都具有特殊含义和一组规则。

一堆字节流 bytes

```html
3C 62 6F ...
```

### 阶段二 通过分词器将字节流转化为 Token

分词器将字节流转换为一个一个的 Token，Token 分为 Tag Token 和文本 Token，上面这段代码最后分词器转化后的结果是:

![image-20200321090346514](http://qn-noter.yunxi.site/imagehost/6iw6k.png-style1)

### 阶段三和阶段四 将 Token 解析为 DOM 节点，并将 DOM 节点添加到 DOM 树中

HTML 解析器维护了一个 Token 栈结构（**数据结构**真是个好东西），这个栈结构的目的就是用来计算节点间的父子关系，在上一个阶段生成的 Token 会被顺序压到这个栈中，以下是具体规则：

1. HTML 解析器开始工作时，会默认创建了一个根为 document 的空 DOM 结构，同时会将一个 StartTag document 的 Token 压入栈底。

![image-20200321090905498](http://qn-noter.yunxi.site/imagehost/g8his.png-style1)

2. 如果压入到栈中的 StartTagToken，HTML 解析器会为该 Token 创建一个 DOM 节点，然后将这个 DOM 节点加入到 DOM 树中，它的`父节点`就是栈中相邻的那个元素生成的 DOM 节点

![image-20200321091006665](http://qn-noter.yunxi.site/imagehost/pqgni.png-style1)

3. 如果分词器解析出来的是文本 Token，那么会生成一个文本节点，然后把这个文本 Dom 节点加入到 DOM 树中（注:文本 Token 不需入栈）,它的`父节点`就是当前栈顶 Token 所对应的 DOM 节点

![image-20200321091101540](http://qn-noter.yunxi.site/imagehost/vv531.png-style1)

## CSS 解析器(构建 CSSOM 树)

CSS 解析器最终的目的也是构建树不过它构建的树是 CSSOM 树 树的构建流程和 DOM 树的构建流程基本相同

![image-20200321091956149](http://qn-noter.yunxi.site/imagehost/bilch.png)

看下最后构造的 CSSOM 树

![image-20200321092027428](http://qn-noter.yunxi.site/imagehost/g0q5e.png-style1)

CSSOM 为何具有树结构？为页面上的任何对象计算最后一组样式时，浏览器都会先从适用于该节点的最通用规则开始（例如，如果该节点是 body 元素的子项，则应用所有 body 样式），然后通过应用更具体的规则（即规则“向下级联”）以递归方式优化计算的样式。

以上面的 CSSOM 树为例进行更具体的阐述。置于 body 元素内的文本都将具有 16 像素字号，并且颜色为红色 — font-size 指令从 body 向下级联至 span。不过，如果某个 span 标记是某个段落 (p) 标记的子项，则其内容将不会显示。

> 注意点:
>
> 1. CSS 解析可以与 DOM 解析同进行
> 2. 如果只有 CSS 和 HTML 的页面，CSS 不会影响 DOM 树的创建，但是如果页面中还有 JavaScript，结论就不一样了，请继续往下看。

## javascript 对 DOM 树与 CSSOM 树创建的影响

上面两个例子中都还没有 javascript 的出现，接下来说下 JavaScript 对 DOM 树和 CSSOM 树构建的影响。

## 情况 1：当前页面中只有 Html 和 JavaScript，而且 JavaScript 非外部引入

DOM 树构建时当遇到 JavaScript 脚本，就要暂停 DOM 解析，先去执行 Javascript，因为在 JavaScript 可能会操作当前已经生成的 DOM 节点。
有一点需要注意:javascript 是可能操作**当前已经生成的 DOM 节点**，如果是后面还未生成的 DOM 节点是不生效的，比如这段代码:

```html
<html>
  <body>
    <div>1</div>
    <script>
      let div1 = document.getElementsByTagName('div')[0]
      div1.innerText = '程序员成长指北'

      let div2 = document.getElementsByTagName('div')[1]
      div2.innerText = 'kaola'
    </script>
    <div>test</div>
  </body>
</html>
```

显示结果为两行： 第一行结果是程序员成长指北 第二行记过是 test 因为在执行第三行和第四行 script 脚本的时候，DOM 树中还没有生成第二个 div 对应的 dom 节点。

### 情况 2：当页面中同时有 Html JavaScript CSS ，而且都非外部引入

DOM 树构建时当遇到 JavaScript 脚本，就要暂停 DOM 解析，先去执行 JavaScript，同时 JavaScript 还要判断 CSSOM 是否解析完成，因为在 JavaScript 可能会操作 CSSOM 节点，CSSOM 节点确认解析完成，执行 JavaScript 再次回到 DOM 树创建。（**所以这里也可以所 CSS 解析间接影响 DOM 树创建**）

### 情况 3：当页面中同时有 Html，JavaScript， CSS ，而且外部引入

Webkit 渲染引擎有一个优化，当渲染进程接收 HTML 文件字节流时，会先开启一个预解析线程，如果遇到 JavaScript 文件或者 CSS 文件，那么预解析线程会提前下载这些数据。当渲染进程接收 HTML 文件字节流时，会先开启一个预解析线程，如果遇到 JavaScript 文件或者 CSS 文件，那么预解析线程会提前下载这些数据。DOM 树在创建过程中如果遇到 JavaScript 文件，接下来就和情况 2 类型一样了。

影响关系图: 画了一张影响关系图希望大家更好的记忆:

![image-20200321093220548](http://qn-noter.yunxi.site/imagehost/wmwwe.png-style1)

## 构建渲染树

通过 DOM 树和 CSSOM 树，浏览器就可以通过二者构建渲染树了。浏览器会先从 DOM 树的根节点开始遍历每个可见节点，然后对每个可见节点找到适配的 CSS 样式规则并应用。具体的规则有以下几点需要注意：

- Render Tree 和 DOM Tree 不完全对应。
- 请注意 visibility: hidden 与 display: none 是不一样的。前者隐藏元素，但元素仍占据着布局空间（即将其渲染成一个空框），而后者 (display: none) **将元素从渲染树中完全移除**，元素既不可见，也不是布局的组成部分

看一下前问中提到的 DOM 树和 CSSOM 树最终合成的渲染树结果是:

![image-20200321115035654](http://qn-noter.yunxi.site/imagehost/eaqvl.png-style1)

## 渲染树形成过程可以做哪些优化

看完了渲染树的形成，在开发过程中我们能做哪些优化？(注意这里的优化只是针对渲染树形成部分，其他的优化会在系列文章之后继续讲)

1. 在引入顺序上，CSS 资源先于 JavaScript 资源。样式文件应当在 head 标签中，而脚本文件在 body 结束前，这样可以防止阻塞的方式。
2. 尽量减少在 JavaScript 中进行 DOM 操作。
3. 简化并优化 CSS 选择器，尽量将嵌套层减少到最小。
4. 修改元素样式时，更改其 class 属性是性能最高的方法。
