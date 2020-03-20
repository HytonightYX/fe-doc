const { fs, path } = require('@vuepress/shared-utils')
const docPath = path.resolve(__dirname, '../guide')

module.exports = ctx => ({
  locales: {
    '/': {
      lang: 'zh-CN',
      title: '前端面试与进阶指南',
      description: '可能是全网最给力的前端面试项目'
    }
  },
  head: [
    ['link', { rel: 'icon', href: `/logo.png` }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['link', { rel: 'apple-touch-icon', href: `/icons/apple-touch-icon-152x152.png` }],
    ['link', { rel: 'mask-icon', href: '/icons/safari-pinned-tab.svg', color: '#3eaf7c' }],
    ['meta', { name: 'msapplication-TileImage', content: '/icons/msapplication-icon-144x144.png' }],
    ['meta', { name: 'msapplication-TileColor', content: '#000000' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', }]
  ],
  themeConfig: {
    repo: 'xiaomuzhu/front-end-interview',
    editLinks: true,
    // docsDir: 'packages/docs/docs',
    locales: {
      '/': {
        editLinkText: '在 GitHub 上编辑此页',
        nav: require('./nav/zh'),
        sidebar: {
          '/guide/': _walk(docPath)
        }
      }
    }
  },
  plugins: [
    ['@vuepress/back-to-top', true],
    ['@vuepress/pwa', {
      serviceWorker: true,
      updatePopup: true
    }],
    ['@vuepress/medium-zoom', true],
    ['@vuepress/google-analytics', {
      ga: 'UA-145821923-1'
    }],
    ['vuepress-plugin-baidu-google-analytics', {
      hm: '009a2f9b8cfc23cb5722f109462e450f',
      ignore_hash: false
    }],
    ['container', {
      type: 'vue',
      before: '<pre class="vue-container"><code>',
      after: '</code></pre>',
    }],
    ['container', {
      type: 'upgrade',
      before: info => `<UpgradePath title="${info}">`,
      after: '</UpgradePath>',
    }],
  ],
  extraWatchFiles: [
    '.vuepress/nav/zh.js',
  ]
})

function _walk(dir) {
  const fs = require('fs')
  var list = fs.readdirSync(dir)
  list = list.filter(item => item !== '.DS_Store' && item !== 'readme.md')
  const ret = []
  list.forEach(dirname => {
    // if (dirname === '.DS_Store') continue
    const dirpath = dir + '/' + dirname

    ret.push({
      title: dirname,
      collapsable: true,
      children: [...fs.readdirSync(dirpath).filter(item => item !== '.DS_Store').map(item => `${dirname}/${item}`.replace('.md', ''))]
    })
  })
  return ret
}