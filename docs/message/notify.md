# Notify

Show message on a floating bar, that will dismiss itself.



### Examples

``` javascript
mussel.notify('You have got a message.')
```

``` javascript
mussel.notify('success', 'Mission Accomplished !')
```

``` javascript
mussel.notify('warning', 'A monster is coming !')
```





### API

mussel.notify(message)

mussel.notify(message, timeout)

mussel.notify(notifyType, message)

mussel.notify(notifyType, message, timeout)

#### arguments

| name       | type   | accepted values                  | default |
| ---------- | ------ | -------------------------------- | ------- |
| notifyType | string | info / success / warning / error | info    |
| message    | string |                                  | -       |
| timeout    | number |                                  | 3000ms  |

