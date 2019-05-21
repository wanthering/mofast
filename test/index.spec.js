import fs from 'fs-extra'
import mofast from '../src'
import path from 'path'

jest.mock('fs')

// 准备原始模板文件
const templateDir = path.join(__dirname, 'fixture/templates')
fs.ensureDirSync(templateDir)
fs.writeFileSync(path.join(templateDir, 'add.js'), `const add = (a, b) => a + b`)

test('main', async () => {
  await mofast()
    .source('**', { baseDir: templateDir })
    .dest('./output', { baseDir: __dirname })

  const fileOutput = fs.readFileSync(path.resolve(__dirname, 'output/add.js'), 'utf-8')
  expect(fileOutput).toBe(`const add = (a, b) => a + b`)
})

test('middleware', async () => {
  const stream = mofast()
    .source('**', { baseDir: templateDir })
    .use(({ files }) => {
      const contents = files['add.js'].contents.toString()
      files['add.js'].contents = Buffer.from(contents.replace(`const`, `var`))
    })

  await stream.process()
  expect(stream.fileContents('add.js')).toMatch(`var add = (a, b) => a + b`)
})

// 准备原始模板文件
fs.writeFileSync(path.join(templateDir, 'ejstmp.txt'), `my name is <%= name %>`)
fs.writeFileSync(path.join(templateDir, 'hbtmp.hbs'), `my name is {{name}}`)

test('ejs engine', async () => {
  await mofast()
    .source('**', { baseDir: templateDir })
    .engine('ejs', { name: 'jack' }, '*.txt')
    .dest('./output', { baseDir: __dirname })
  const fileOutput = fs.readFileSync(path.resolve(__dirname, 'output/ejstmp.txt'), 'utf-8')
  expect(fileOutput).toBe(`my name is jack`)
})

test('handlebars engine', async () => {
  await mofast()
    .source('**', { baseDir: templateDir })
    .engine('handlebars', { name: 'jack' }, '*.hbs')
    .dest('./output', { baseDir: __dirname })
  const fileOutput = fs.readFileSync(path.resolve(__dirname, 'output/hbtmp.hbs'), 'utf-8')
  expect(fileOutput).toBe(`my name is jack`)
})

test('babel', async () => {
  await mofast()
    .source('**', { baseDir: templateDir })
    .babel()
    .dest('./output', { baseDir: __dirname })
  const fileOutput = fs.readFileSync(path.resolve(__dirname, 'output/add.js'), 'utf-8')
  expect(fileOutput).toBe(`var add = function (a, b) { return a + b; }`)
})

test('filter', async () => {
  const stream = mofast()
  stream.source('**', { baseDir: templateDir })
    .filter(filepath => {
      return filepath !== 'hbtmp.hbs'
    })

  await stream.process()

  expect(stream.fileList).toContain('add.js')
  expect(stream.fileList).not.toContain('hbtmp.hbs')
})
