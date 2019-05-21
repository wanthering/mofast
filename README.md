# mofast 

> [Move Fast] 精简实用的前端构建工具。

## 安装
```bash
yarn add mofast -D
```
或者
```bash
npm i mofast -D
```

## 示例
假设有一个文件夹，你想将其中的.vue文件和.js文件通过babel转译成ES5可用代码。 
同时，你想将其中的ejs代码`<%= name %>` 通过注入数组`{name: 'jack'}`转译成`jack`
可以这样构建：

```js
const mofast = require('mofast')

const stream = mofast()

async run = ()=>{
  await mofast()
    .source('**',{baseDir:template})
}

run()
// 假设你的文件目录中有
```



### Lint File
```bash
yarn lint
```

### Test File
```bash
yarn test
```

### Build File
```bash
yarn build
```

## Contributing
1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D

## Author

mofast &copy; wanthering, Released under the MIT License.

> GitHub [@wanthering](https://github.com/wanthering)
