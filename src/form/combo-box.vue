<template>
  <input-box button-type="button" @buttonclick="visible = !visible">
    <dropdown v-model="visible">
      <slot />
    </dropdown>
  </input-box>
</template>

<script>
  import InputBox from './input-box.vue'
  import Dropdown from '../layer/dropdown.vue'

  export default {
    components: {
      InputBox,
      Dropdown
    },
    data () {
      return {
        visible: false
      }
    }
  }
</script>
