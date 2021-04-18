<script>
  import SideBar from '../sidebar/sidebar.vue'

  import './sidebar-menu.pcss'

  export default {
    name: 'MusselSidebarMenu',
    extends: SideBar,
    provide () {
      return {
        menu: this
      }
    },
    props: {
      accordion: Boolean,
      selectMode: {
        type: String,
        default: 'auto',
        validator (value) {
          return ['auto', 'manual'].indexOf(value) !== -1
        }
      }
    },
    data () {
      return {
        expandedGroup: null
      }
    },
    beforeDestroy () {
      this.expandedGroup = null
    },
    methods: {
      setActiveItem (item) {
        if (this.activeItem !== item) {
          this.activeItem?.unselect()
          this.activeItem = item
        }
      },
      setExpandedGroup (group) {
        this.expandedGroup = group
      }
    }
  }
</script>
