# Quick Start



## Installation
It is recommended to install mussel as a devDependency.
``` bash
npm i mussel --save-dev
```

## Importing
### Global Register
When importing `mussel`, if `window.Vue` exist, it will install all mussel components globally.

``` javascript
import 'mussel'
```
Or install manually:
``` javascript
import Vue from 'mussel'
import { install } from 'mussel'

install(Vue)
```



### Part Importing
Or use specified component by exported name.
``` vue
<template>
  <div>
    <mu-button>my button</mu-button>
  </div>
</template>

<script>
  import { Button } from 'mussel'

  const foo = new Vue({
    components: {
      'mu-button': Button
    }
  })
</script>
```