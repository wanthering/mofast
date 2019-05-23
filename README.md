# mofast 

> [Move Fast] 精简实用的前端构建工具。

# 安装
```bash
yarn add mofast -D
```
或者
```bash
npm i mofast -D
```

# 示例
假如你的js文件夹下有app.js 和 index.js
```js
const mofast = require('mofast')

mofast()
  .source('js/**')
  .babel()
  .dest('dist')
```
执行完这段代码，你就会发现js文件夹下的文件通过babel转译，导入到了dist文件夹中。

完整的示例，可以example文件夹下查看。

示例中实现了功能： 

- prompt对话框交互
- 将对话框得到的数据写入模板
- less文件转译成css
- js文件通过babel
- js文件uglify

基本上，gulp、grunt、blacksmith、yeoman、fis3能实现的功能，mofast都能实现。

# API

## mofast()

返回Mofast实例

## .source(pattern, [options])

### pattern
类型： Array或String
必选： 是

一个glob模式，或者一个glob模式数组。

### options

#### baseDir
类型： String
默认： '.'
存放源文件的根目录，glob在这个目录下开始查询所需文件。

#### dotFile
类型： Boolean
默认： true

是否包含隐藏文件

## .use(middleware)

### middleware
类型： Function
必选： 是

> middleware是一个接收Mofast对象做为参数的函数。它常常用来访问this.files和this.meta对象，以及其中的方法
```js
function customMiddleware(context){
  const files = context.files
  for(let filepath of files){
    context.writeContents(filepath, 'some string')
  }
  context.meta = {name: 'some name'}
}
```

middleware可以是同步函数，也可以是异步函数。

## .dest(directory, [options])

异步函数，将源文件写入目标文件夹。 采用await异步调用方式。 或者接收Promise对象。

### directory

类型：String
必选： 是

输出到的目标文件夹，可以是绝对路径和相对路径。

### options
#### baseDir
类型： String
默认： '.'

如果目标文件夹是相对路径，它的起始点为`baseDir`

#### clean
类型：Boolean

设定是否在写入前，清空目标文件夹

## .process()
与.dest执行一样，但不输出到目标文件夹。

## .engine

## .files
当你调用过 .process() 或.dest()之后。 你再调用.files将会发现它是一个这样的对象
```js
{
  'src/index.js': {
    contents: Buffer<...>, // 文件内容的Buffer
    stats: {}, //fs.stats对象
    path: '/absolute/path/to/src/index.js' // 源文件路径
  }
}
```
## .fileList
获取所有相对路径组成的数组，如
```js
[
  '.gitignore',
  'src/index.js'
]
```

## .filter(handler)
### handler(filepath, file)

当返回`true`时，则保留文件，当返回`false`将移除文件。
#### filepath
文件的相对路径
#### file
文件对象

## .meta
类型： Object
默认： {}

用来在所有中间件中传递数据的函数。 同时，在调用.engine时，第二个对象参数将自动把.meta合并进去，直接进行模板引擎渲染。

## .file(filepath)
返回filepath对应的文件。

## .deleteFile(filepath)
删除filepath对应的文件。

## .createFile(filepath,file)
在filepath的位置创建file文件。

## .fileContent(filepath)
取得filepath对应的文件的内容。

## writeContent(filepath, content)
向filepath位置的文件写入内容。

## .rename(changer)
类型： Object
必须： 是
输入的change为{'a.js':'b.js'}时，在构建时将文件'a.js'改名为'b.js'

# 加入我们
1. 点击右上角的Fork按钮。
2. 新建一个分支:`git checkout -b my-new-feature`
3. 上报你的更新：`git commit -am 'Add some feature'`
4. 分支上传云端：`git push origin my-new-feature`
5. 提交 `pull request`😘


# 作者信息

mofast &copy; wanthering, Released under the MIT License.

> GitHub [@wanthering](https://github.com/wanthering)
