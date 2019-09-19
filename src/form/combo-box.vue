<template>
  <input-box
    button-type="button"
    @buttonclick="dropdownVisible = !dropdownVisible">
    <dropdown
      v-model="dropdownVisible"
      :height="ddHeight"
      :width="ddWidth">
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
    props: {
      ddWidth: String,
      ddHeight: String
    },
    data () {
      return {
        dropdownVisible: false
      }
    }
  }
</script>
