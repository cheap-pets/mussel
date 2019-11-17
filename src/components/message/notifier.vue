<template>
  <transition-group name="mu-notifier" tag="div" class="mu-notifier">
    <div
      v-for="item in items"
      :key="item.id"
      :notify-type="item.notifyType"
      class="mu-text-ellipsis">
      {{ item.message }}
    </div>
  </transition-group>
</template>

<script>
  export default {
    name: 'MusselNotifier',
    data () {
      return {
        counter: 0,
        items: []
      }
    },
    methods: {
      notify (notifyType, message, timeout = 3000) {
        if (!isNaN(message) || (!message && !timeout)) {
          timeout = isNaN(message) ? 3000 : message
          message = notifyType
          notifyType = null
        }
        const id = ++this.counter
        this.items.unshift({
          id,
          message,
          notifyType
        })
        setTimeout(() => { this.dismiss(id) }, timeout)
      },
      dismiss (id) {
        const idx = this.items.findIndex(el => el.id === id)
        if (idx !== -1) this.items.splice(idx, 1)
      }
    }
  }
</script>
