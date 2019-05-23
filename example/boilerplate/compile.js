// const mofast = require('mofast')
const mofast = require('mofast')
const path = require('path')
const inquirer = require('inquirer')
const { minimatch } = mofast
const jstransformer = require('jstransformer')
const uglify = jstransformer(require('jstransformer-uglify-js'))
const less = jstransformer(require('jstransformer-less'))


mofast()
  .source('**', { baseDir: path.resolve('templates') })
  .use(promptMiddleware)
  .engine('ejs')
  .use(lessMiddleware)
  .babel('**/*.js')
  .use(uglifyMiddleware)
  .dest('./output',{baseDir: __dirname,clean:true})

function promptMiddleware(context) {
  const questions = [{
    name: 'title',
    message: 'input the title',
    validate: t => t.length > 0
  }, {
    name: 'message',
    message: 'leave a message',
    default: 'Hello world!'
  }
  ]
  return inquirer.prompt(questions).then(answers=>{
    context.meta = answers
  })
}

function lessMiddleware(context){
  const files = context.files
  for(let filePath in files){
    if(minimatch(filePath,'**/*.less')){
      const dirPath = path.dirname(filePath)
      const basename = path.parse(filePath).name
      const cssPath = path.join(dirPath, basename+'.css')
      const contents = context.fileContents(filePath)
      context.createFile(cssPath,{contents:less.render(contents).body})
      context.deleteFile(filePath)
    }
  }
}

function uglifyMiddleware(context){
  const files = context.files
  for(let filePath in files){
    if(minimatch(filePath,'**/*.js')){
      const contents = context.fileContents(filePath)
      context.writeContents(filePath,uglify.render(contents).body)
    }
  }
}
