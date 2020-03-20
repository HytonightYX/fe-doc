# Cookie, Session, Web Storage与IndexedDB 总结



## 一、Cookie

### 1.Cookie 的来源

**Cookie 的本职工作并非本地存储，而是“维持状态”**。 因为**HTTP协议是无状态的，HTTP协议自身不对请求和响应之间的通信状态进行保存**，通俗来说，服务器不知道用户上一次做了什么，这严重阻碍了交互式Web应用程序的实现。在典型的网上购物场景中，用户浏览了几个页面，买了一盒饼干和两瓶饮料。最后结帐时，由于HTTP的无状态性，不通过额外的手段，服务器并不知道用户到底买了什么，于是就诞生了Cookie。它就是用来绕开HTTP的无状态性的“额外手段”之一。服务器可以设置或读取Cookies中包含信息，借此维护用户跟服务器会话中的状态。

我们可以把Cookie 理解为一个存储在浏览器里的一个小小的文本文件，它附着在 HTTP 请求上，在浏览器和服务器之间“飞来飞去”。它可以携带用户信息，当服务器检查 Cookie 的时候，便可以获取到客户端的状态。

在刚才的购物场景中，当用户选购了第一项商品，服务器在向用户发送网页的同时，还发送了一段Cookie，记录着那项商品的信息。当用户访问另一个页面，浏览器会把Cookie发送给服务器，于是服务器知道他之前选购了什么。用户继续选购饮料，服务器就在原来那段Cookie里追加新的商品信息。结帐时，服务器读取发送来的Cookie就行了。



### 2.什么是Cookie及应用场景

**Cookie指某些网站为了辨别用户身份而储存在用户本地终端上的数据(通常经过加密)。 cookie是服务端生成，客户端进行维护和存储**。通过cookie,可以让服务器知道请求是来源哪个客户端，就可以进行客户端状态的维护，比如登陆后刷新，请求头就会携带登陆时response header中的set-cookie,Web服务器接到请求时也能读出cookie的值，根据cookie值的内容就可以判断和恢复一些用户的信息状态。

**Cookie 以键值对的形式存在**。

典型的应用场景有：

- 记住密码，下次自动登录。
- 购物车功能。
- 记录用户浏览数据，进行商品（广告）推荐。



### 3.Cookie的原理及生成方式

![image-20200306111453238](https://tva1.sinaimg.cn/large/00831rSTly1gck1cx9lahj30f805e40p.jpg)





### 5.Cookie与安全

| 属性      | 作用                                                         |
| --------- | ------------------------------------------------------------ |
| value     | 用于保存用户登录状态，应该将该值加密，不能使用铭文的用户标识 |
| http-only | 不能通过 JavaScript 访问 Cookie，减少 XSS 攻击               |
| secure    | 只能在协议为 HTTPS 的请求中携带                              |
| SameSite  | 规定游览器不能再跨域请求中携带 Cookie，减少 CSRF 攻击        |

![image-20200306110631856](http://qn-noter.yunxi.site/imagehost/344rc.png-style1)



**HttpOnly** 

浏览器不允许脚本操作 `document.cookie` 去更改 cookie， 所以为避免跨域脚本 (XSS) 攻击，通过 `JavaScript` 的 `Document.cookie` API 无法访问带有 `HttpOnly` 标记的 Cookie，它们只应该发送给服务端。如果包含服务端 Session 信息的 Cookie 不想被客户端 JavaScript 脚本调用，那么就应该为其设置 HttpOnly 标记。

```
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure; HttpOnly
```



**secure**

标记为 Secure 的 Cookie 只应通过被 HTTPS 协议加密过的请求发送给服务端。但即便设置了 Secure 标记，敏感信息也不应该通过 Cookie 传输，因为 Cookie 有其固有的不安全性，Secure 标记也无法提供确实的安全保障。



总结一下：

`cookie` 的缺点： 

- cookie的长度和数量的限制。每个domain最多只能有20条cookie，每个cookie长度不能超过4KB。否则会被截掉。 
- 安全性问题。如果cookie被人拦掉了，那个人就可以获取到所有 `session` 信息。加密的话也不起什么作用。 
- 有些状态不可能保存在客户端。例如，为了防止重复提交表单，我们需要在服务端保存一个计数器。若吧计数器保存在客户端，则起不到什么作用。
- 原生的 `cookie` 接口不太友好

因此，为了弥补 Cookie 的局限性，让“专业的人做专业的事情”，Web Storage 出现了。

**HTML5中新增了本地存储的解决方案——Web Storage，它分为 sessionStorage 和 localStorage**。有了 WebStorage 后，cookie 只需做它应该做的事情了——作为客户端与服务器交互的通道，保持客户端状态。

## 二、LocalStorage

### 1.LocalStorage的特点

- 保存的数据**长期存储**，下一次访问该网站的时候，网页可以直接读取以前保存的数据。
- 大小为5M左右
- 仅在客户端使用，不和服务端进行通信
- 接口封装较好

基于上面的特点，LocalStorage 可以作为浏览器本地缓存方案，用来提升网页首屏渲染速度(根据第一请求返回时，将一些不变信息直接存储在本地)。



### 2.JavaScript 操作





### 3.使用场景

LocalStorage在存储方面没有什么特别的限制，理论上 Cookie 无法胜任的、可以用简单的键值对来存取的数据存储任务，都可以交给 LocalStorage 来做。

这里给大家举个例子，考虑到 LocalStorage 的特点之一是持久，有时我们更倾向于用它来存储一些**内容稳定的资源**。比如图片内容丰富的电商网站会用它来存储 Base64 格式的图片字符串：





## 三、sessionStorage

`sessionStorage`保存的数据用于浏览器的一次会话，当会话结束（通常是该窗口关闭），数据被清空；`sessionStorage` 特别的一点在于，**即便是相同域名下的两个页面，只要它们不在同一个浏览器窗口中打开，那么它们的 sessionStorage 内容便无法共享**。`localStorage` 在所有同源窗口中都是共享的；`cookie` 也是在所有同源窗口中都是共享的。除了保存期限的长短不同，`sessionStorage`的属性和方法与 `localStorage` 完全一样。

### 1.sessionStorage的特点

- 会话级别的浏览器存储
- 大小为5M左右
- 仅在客户端使用，不和服务端进行通信
- 接口封装较好

基于上面的特点，sessionStorage 可以有效对表单信息进行维护，比如刷新时，表单信息不丢失。



### 2.使用场景

`sessionStorage` 更适合用来存储生命周期和它同步的会话级别的信息。这些信息只适用于当前会话，当你开启新的会话时，它也需要相应的更新或释放。比如微博的 `sessionStorage` 就主要是存储你本次会话的浏览足迹。





### sessionStorage 、localStorage 和 cookie 之间的区别

- 共同点：都是保存在浏览器端，且都遵循同源策略。
- 不同点：在于**生命周期**与**作用域**的不同



**作用域**

localStorage只要在相同的协议、相同的主机名、相同的端口下，就能读取/修改到同一份localStorage数据。sessionStorage比localStorage更严苛一点，除了协议、主机名、端口外，还要求在同一窗口（也就是浏览器的标签页）下

![image-20200306172554605](https://tva1.sinaimg.cn/large/00831rSTly1gckc2y8k3ij30gc09smzx.jpg)

**生命周期**

localStorage 是持久化的本地存储，存储在其中的数据是永远不会过期的，使其消失的唯一办法是手动删除；而 sessionStorage 是临时性的本地存储，它是会话级别的存储，当会话结束（页面被关闭）时，存储内容也随之被释放。

| localStorage                        | sessionStorage                              |
| :---------------------------------- | :------------------------------------------ |
| 能够在所有同源的tabs和windows下共享 | 在一个游览器的tab下可见，包含同源的 iframes |
| Survives browser restart            | page刷新存在，关闭消失                      |



Web Storage 是一个从定义到使用都非常简单的东西。它使用键值对的形式进行存储，这种模式有点类似于对象，却甚至连对象都不是——**它只能存储字符串**，要想得到对象，我们还需要先对字符串进行一轮解析。

说到底，Web Storage 是对 Cookie 的拓展，它只能用于存储少量的简单数据。当遇到大规模的、结构复杂的数据时，Web Storage 也爱莫能助了。这时候我们就要清楚我们的终极大 boss——IndexedDB！



## IndexedDB

使用场景：离线登陆，博客写文章草稿





## 致谢

- [使用 Web Storage API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
- [Document.cookie](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/cookie)
- [深入了解浏览器存储--从cookie到WebStorage、IndexedDB](https://juejin.im/post/5c8e6fa8e51d453ec75168cd#heading-12)
- [本地存储——从 Cookie 到 Web Storage、IndexedDB](https://juejin.im/book/5b936540f265da0a9624b04b/section/5ba5bb16f265da0ae92a6cfc)
- [这样讲 webStorage，面试官会对你刮目相看](https://juejin.im/post/5e5a06b0f265da574b79165c#heading-3)
- [Cookie,Session,sessionStorage与localStorage的区别及应用场景](https://www.jianshu.com/p/e0c1b3b42c6f)
- [这一次带你彻底了解Cookie](https://mp.weixin.qq.com/s/oOGIuJCplPVW3BuIx9tNQg)