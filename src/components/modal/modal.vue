<template>
  <div
    v-if="rendered"
    class="mu-modal-mask"
    :visible="popupVisible"
    @click="onMaskClick">
    <slot />
  </div>
</template>

<script>
  import BaseModal from './base-modal.vue'

  export default {
    name: 'MusselModal',
    extends: BaseModal
  }
</script>
