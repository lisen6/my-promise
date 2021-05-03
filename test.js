let Promise = require('./promise')

Promise.reject(1)
  .then((data) => console.log(data, 'data'))
  .catch((e) => console.log(e, 'err'))

Promise.resolve(123)
  .finally(() => {
    // console.log(1)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(1)
      }, 3000)
    })
  })
  .then((data) => console.log(data, 'data'))
  .catch((e) => {
    console.log(e)
  })

let p1 = new Promise(() => {
  throw new Error(1)
})
let p2 = new Promise((res, rej) => res(2))

Promise.race([p1, p2])
  .then((data) => {
    console.log(data, 'data')
  })
  .catch((e) => console.log(e, 'err'))
