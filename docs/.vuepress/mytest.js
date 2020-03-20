const fs = require('fs')
const path = require('path')

const docPath = path.resolve(__dirname, '../guide')

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

// console.log(walk(docPath))
console.log(_walk(docPath))
