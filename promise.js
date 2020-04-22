const PENDING = 'PENDING'; // 等待
const RESOLVED = 'RESOLVED'; // 成功
const REJECTED = 'REJECTED'; // 失败

// x.then为什么会报错;
// Object.defineProperty(x, 'then', {
//   get() {
//     throw new Error('')
//   }
// })

// 什么情况下promise2跟x相等
// let p = new Promise((resolve, reject) => {
//   resolve(123);
// })
// let promise2 = p.then((data) => { // promise2一直在等待自身。就死循环了
//   return promise2;
// })

// promise2.then(data=> {
//   console.log(data);
// }, err => {
//   console.log('err', err);
// })


function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') { // 如果返回值x是一个promise
    let called;
    try {
      let then = x.then; // 为什么取then的时候会报错。有一种不常见的写法(见顶部注释)
      if (typeof then === 'function') { // 如果then是一个函数。那么姑且认为他是一个promise
        then.call(x, y => { // 给返回值promise添加一个then让他执行。y就是resolve函数。r就是reject函数。
          if (called) {
            return
          }
          called = true;
          resolvePromise(promise2, y, resolve, reject) // 判断y的值是不是一个promise。如果是就递归执行。然后改变promise2的状态
        }, r => {
          if (called) {
            return
          }
          called = true;
          reject(r);
        })
      } else {
        resolve(x) // x: {then: 1}
      }
    } catch (e) {
      if (called) {
        return
      }
      called = true;
      reject(e);
    }
  } else {
    resolve(x); // x值是一个普通值
  }
}

class Promise {
  constructor(executor) {
    this.status = PENDING; // promise的状态。默认值是pending
    this.value = undefined; // 成功的值
    this.reason = undefined; // 失败的值
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    let resolve = (value) => {
      if (this.status === PENDING) {  // promise的状态一旦确定就不能改变
        this.value = value;
        this.status = RESOLVED;
        this.onResolvedCallbacks.forEach(fn => fn());
      }
    };
    let reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason;
        this.status = REJECTED;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : err => {
      throw err
    };
    let promise2 = new Promise((resolve, reject) => {
      // 当promise状态成功的时候。调用成功的回调
      if (this.status === RESOLVED) {
        setTimeout(() => { // 加一层定时器的原因是: new Promise还未构造完。promise2是undefined。resolvePromise中的promise2也就是undefined
          try {
            let x = onFulfilled(this.value); // 当返回值x是直接throw err的时候。executor的try.catch是捕获不到的。因为try.catch只能捕获同步错误。所以套一层try.catch
            // resolve(x) // x有可能是一个普通值。也有可能是一个promise
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0)
      }

      // 当promise状态失败的时候。调用失败的回调
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0)
      }

      // (异步情况)当promise还没有改变的时候。把相应的回调存起来。
      if (this.status === PENDING) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);  // x有可能是一个普通值。也有可能是一个promise
              // resolve(x) // 
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0)
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0)
        })
      }
    })
    // 因为then函数可以链式调用。所以返回的肯定也是个promise
    return promise2;
  }
}

Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  })
  return dfd;
}

module.exports = Promise;