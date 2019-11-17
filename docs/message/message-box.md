# Message Box

Set of modal dialog, be used for alerting message or requiring confirmation.



### Examples

``` javascript
mussel.alert('You have got a message.', () => {
  console.log('done')
})
```

``` javascript
mussel.confirm('Quit ?', btn => {
  if (btn === 'ok') quit()
})
```

```javascript
mussel.warn('Delete ?', btn => {
  if (btn === 'ok') delete()
})
```






### API

| method  | visible buttons | arguments              |
| ------- | --------------- | ---------------------- |
| alert   | ok              | message, callback(btn) |
| confirm | ok / cancel     | message, callback(btn) |
| warn    | ok / cancel     | message, callback(btn) |

