export default class Wares {
  constructor() {
    this.middlewares = []
  }

  use(middleware) {
    this.middlewares = this.middlewares.concat(middleware)

    return this
  }

  run(context) {
    console.log('running')
    return this.middlewares.reduce((current, next) => {
      return current.then(() => Promise.resolve(next(context)))
    }, Promise.resolve())
  }
}
