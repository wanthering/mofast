#!/usr/bin/env node
const mofast = require('../dist')
const path = require('path')
const spawn = require('cross-spawn')

const dest = 'mofast-example'

if (process.argv.slice(2)[0] === 'example') {
  mofast().source('**', { baseDir: path.resolve(__dirname, 'boilerplate') })
    .filter(filepath => !['package-lock.json', 'yarn.lock'].includes(filepath))
    .rename({
      '_package.json': 'package.json'
    })
    .dest(dest, { clean: true })
    .then(() => {
      console.log('mofast:\t 示例构建完成，正在安装依赖...')
      let pmClient, command
      if (spawn.sync('yarn', ['--version']).status) {
        pmClient = 'yarn'
        command = []
      } else {
        pmClient = 'npm'
        command = ['install']
      }
      let ps = spawn(pmClient, command, { cwd: dest })
      return new Promise(resolve => {
        ps.on('close', code => {
          resolve()
        })
      })
    }).then(() => {
    console.log('mofast:\t 依赖安装完成\n')
    console.log('cd mofast-example 进入文件夹')
    console.log('请打开 compile.js文件，查看mofast的标准用法')
    console.log('请输入 node compile 运行构建工具')
  })
} else {
  console.error('命令：\n\tmofast example\t\t----查看mofast调用示例')
}
