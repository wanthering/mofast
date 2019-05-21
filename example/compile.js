// const mofast = require('mofast')
const mofast = require('../dist')
const path = require('path')
const inquirer = require('inquirer')
const { minimatch } = mofast

const promptMiddleware = (context) => {
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
    context.meta.answers = answers
  })
}


const stream = mofast()
stream
  .source('**', { baseDir: path.resolve('templates') })
  .use(promptMiddleware)
  .engine('ejs',({meta})=>{
    console.log('engine called')
    console.log(meta)
    return meta.answers
  })
  .dest('./output',{baseDir: __dirname})
  .then()
  .catch(err=>{
    console.log(err)
  })

