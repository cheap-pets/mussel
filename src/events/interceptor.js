const registeredInterceptors = {}

function hack (prototype) {
  const prototypeAdd = prototype.addEventListener
  const prototypeRemove = prototype.removeEventListener

  prototype.addEventListener = function (type, listener, options) {
    registeredInterceptors[type]?.add?.call(this, type, listener, options)
    prototypeAdd.call(this, type, listener, options)
  }

  prototype.removeEventListener = function (type, listener, options) {
    registeredInterceptors[type]?.remove?.call(this, type, listener, options)
    prototypeRemove.call(this, type, listener, options)
  }
}

if (typeof Element !== 'undefined') {
  hack(Element.prototype)
}

export const EventInterceptor = {
  register (type, interceptor) {
    registeredInterceptors[type] = interceptor
  },
  unregister (type) {
    delete registeredInterceptors[type]
  }
}
