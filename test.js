let Promise = require('./promise');

let p = new Promise((resolve, reject) => {
  resolve(123);
})
let promise2 = p.then((data) => {
  return promise2;
})

promise2.then(data=> {
  console.log(data);
}, err => {
  console.log('err', err);
})