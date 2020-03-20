# 从零搭建 React 开发环境

https://www.valentinog.com/blog/babel/

### 安装 webpack

初始化目录，安装 webpack

```
mkdir react-starter && cd react-starter
npm init -y
npm i webpack webpack-cli --save-dev
```



package.json 添加 `scripts`

```json
"scripts": {
  "build": "webpack --mode production"
},
```



### Babel

现代 React 开发几乎都用上了最新 ES6+ 的语法，比如 class、箭头函数等等，但是一些游览器不认识这些新语法，所以我们要转为更通用的 ES5，这种转换叫做“transpiling”。

当然 webpack 本身不知道如何转换，它需要依赖一种叫做 loader 的东西。**一个 loader 能将输入的内容做一些处理后输出，输出的结果就叫做 bundle。**

babel-loader 就是这样一个负责将 ES6+ 代码转换为 ES5 的 loader。

- **@babel/preset-env** 用于将 ES6+ 代码转换为 ES5
- **@babel/preset-react** 用于解析 JSX 为 JavaScript



安装 bebel 环境

```
npm i @babel/core babel-loader @babel/preset-env @babel/preset-react --save-dev
```



然后，新建 `.babelrc`，这里面是用来配置 babel 的

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```



现在配置完成，可以告诉 webpack 要用 babel-loader 来编译代码了。

新建 `webpack.config.js`

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,    // 正则匹配 *.js 和 *.jsx
        exclude: /node_modules/,// 排除 node_modules
        use: {
          loader: "babel-loader"// 匹配到的这些文件用 babel-loader 处理
        }
      }
    ]
  }
}
```



### 安装 React

```
npm i react react-dom

mkdir -p src/components
```







# webpack 基本配置



## 拆分配置和 merge





常用 loader 

babel-loader

postcss-loader 游览器兼容性的

postcss.config.js 加 autoprefixer

![image-20200227102029661](https://tva1.sinaimg.cn/large/0082zybply1gcaqtu959lj30fi03b75e.jpg)