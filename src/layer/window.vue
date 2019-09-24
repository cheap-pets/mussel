<template>
  <div class="mu-modal-mask" :visible="actualVisible" @click="onClick">
    <slot />
  </div>
</template>

<script>
  export default {
    
  }
</script>
