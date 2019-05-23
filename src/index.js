import { EventEmitter } from 'events'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs-extra'
import assert from 'assert'
import transformer from 'jstransformer'
import minimatch from 'minimatch'
import { transform as babelTransform } from 'buble'

class Mofast extends EventEmitter {
  constructor () {
    super()
    this.files = {}
    this.meta = {}
    this.middlewares = []
  }

  /**
   * 将参数挂载到this上
   * @param patterns  glob匹配模式
   * @param baseDir   源文件根目录
   * @param dotFiles   是否识别隐藏文件
   * @returns this 返回this，提供链式操作
   */
  source (patterns, { baseDir, dotFiles = true } = {}) {
    this.sourcePatterns = patterns
    this.baseDir = baseDir || extractCallDir()
    this.dotFiles = dotFiles
    return this
  }

  /**
   * 中间件推入数组
   * @param middleware 中间件函数
   * @returns this  返回this，提供链式操作
   */
  use (middleware) {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * 将baseDir中的文件的内容、状态和绝对路径，挂载到this.files上
   * @returns this  返回this，提供链式操作
   */
  async process () {
    const allStats = await glob(this.sourcePatterns, {
      cwd: this.baseDir,
      dot: this.dotFiles,
      stats: true
    })
    if (allStats.length === 0) {
      throw new Error(`${this.baseDir}内搜寻不到所需的文件`)
    }

    this.files = {}
    await Promise.all(
      allStats.map(stats => {
        const absolutePath = path.resolve(this.baseDir, stats.path)
        return fs.readFile(absolutePath).then(contents => {
          this.files[stats.path] = { contents, stats, path: absolutePath }
        })
      })
    )

    for (let middleware of this.middlewares) {
      await middleware(this)
    }
    return this
  }

  /**
   * 支持的模板引擎
   * @param type  引擎的类型，现在为handlebars和ejs两种
   * @param locals  输入的参数
   * @param pattern  匹配文件
   * @returns this  返回this，提供链式操作
   */
  engine (type, locals, pattern) {
    const supportedEngines = ['handlebars', 'ejs']
    assert(typeof (type) === 'string' && supportedEngines.includes(type), `engine must be value of ${supportedEngines.join(',')}`)
    const Transform = transformer(require(`jstransformer-${type}`))
    locals = locals || {}

    const middleware = (context) => {
      const files = context.files
      locals = typeof locals === 'function' ? locals(context) : { ...locals, ...context.meta }
      for (let filepath in files) {
        if (pattern && !minimatch(filepath, pattern)) continue
        const content = files[filepath].contents.toString()
        files[filepath].contents = Buffer.from(Transform.render(content, locals).body)
      }
    }
    this.middlewares.push(middleware)
    return this
  }

  /**
   * 支持的babel转译
   * @param pattern 匹配文件
   * @returns this  返回this，提供链式操作
   */
  babel (pattern) {
    pattern = pattern || '*.js?(x)'
    const middleware = (context) => {
      const files = context.files
      for (let filepath in files) {
        if (pattern && !minimatch(filepath, pattern)) continue
        const content = files[filepath].contents.toString()
        files[filepath].contents = Buffer.from(babelTransform(content).code)
      }
    }
    this.middlewares.push((context) => {
      return middleware(context)
    })
    return this
  }

  /**
   * 过滤掉部分文件
   * @param handler  鉴定filename是否需要过滤的函数
   * @returns this 返回this，提供链式操作
   */
  filter (handler) {
    const middleware = ({ files }) => {
      for (let filepath in files) {
        if (!handler(filepath, files[filepath])) {
          delete files[filepath]
        }
      }
    }
    this.middlewares.push((context) => {
      return middleware(context)
    })
    return this
  }

  /**
   * 获取所有文件名
   * @returns {string[]}  文件名数组
   */
  get fileList () {
    return Object.keys(this.files).sort()
  }

  /**
   * 读取this.files上指定文件的内容
   * @param relativePath 相对路径
   */
  fileContents (relativePath) {
    return this.files[relativePath].contents.toString()
  }

  /**
   * 将this.files写入目标文件夹
   * @param destPath 目标路径
   */
  async writeFileTree (destPath) {
    await Promise.all(
      Object.keys(this.files).map(filepath => {
        const { contents } = this.files[filepath]
        const target = path.join(destPath, filepath)
        this.emit('write', filepath, target)
        return fs.ensureDir(path.dirname(target))
          .then(() => fs.writeFile(target, contents))
      })
    )
  }

  /**
   * 处理文件流，导入目标文件夹
   * @param dest   目标文件夹
   * @param baseDir  目标文件根目录
   * @param clean   是否清空目标文件夹
   */
  async dest (dest, { baseDir = '.', clean = false } = {}) {
    const destPath = path.resolve(baseDir, dest)
    await this.process()
    if (clean) {
      await fs.remove(destPath)
    }
    await this.writeFileTree(destPath)
    return this
  }

  /**
   *
   * @param relativePath 相对路径
   * @param string 需要写入文件contents的字符串
   * @returns this 返回this，提供链式操作
   */
  writeContents (relativePath, string) {
    this.files[relativePath].contents = Buffer.from(string)
    return this
  }

  /**
   * 返回文件状态
   * @param relativePath  文件相对路径
   * @returns {Object} 文件状态
   */
  fileStats (relativePath) {
    return this.file(relativePath).stats
  }

  /**
   * 删除指定的文件
   * @param relativePath 文件相对路径
   * @returns this 返回this，提供链式操作
   */
  deleteFile (relativePath) {
    delete this.files[relativePath]
    return this
  }

  rename (changer) {
    const middleware = ({ files }) => {
      assert(typeof changer === 'object', '输入的参数必须为对象')
      for (let changerPath in changer) {
        const cached = { ...files[changerPath] }
        delete files[changerPath]
        files[changer[changerPath]] = cached
      }
    }
    this.middlewares.push(middleware)
    return this
  }

  /**
   * 新建文件
   * @param relativePath 文件相对路径
   * @param file  文件对象
   * @returns this 返回this，提供链式操作
   */
  createFile (relativePath, file) {
    this.files[relativePath] = file
    return this
  }
}

const mofast = () => new Mofast()

mofast.fs = fs
mofast.glob = glob
mofast.minimatch = minimatch

function extractCallDir () {
  // extract api.render() callsite file location using error stack
  const obj = {}
  Error.captureStackTrace(obj)
  const callSite = obj.stack.split('\n')[3]
  const fileName = callSite.match(/\s\((.*):\d+:\d+\)$/)[1]
  return path.dirname(fileName)
}

export default mofast
