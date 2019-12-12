<script>
  import SideBar from '../sidebar/sidebar.vue'

  export default {
    name: 'MusselSidebarMenu',
    extends: SideBar,
    provide () {
      return {
        menu: this
      }
    },
    methods: {
      setActiveItem (item) {
        if (this.$activeItem !== item) {
          this.$activeItem?.unselect()
          this.$activeItem = item
        }
      }
    }
  }
</script>
