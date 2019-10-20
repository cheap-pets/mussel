<script>
  import FlexItem from './flex-item.vue'

  export default {
    name: 'MusselFlexBox',
    extends: FlexItem,
    provide () {
      return {
        parentDirection: this.flexDirection
      }
    },
    props: {
      direction: {
        type: String,
        default: 'row',
        validator (value) {
          return ['row', 'column'].indexOf(value) !== -1
        }
      }
    },
    computed: {
      flexDirection () {
        return this.direction
      }
    },
    watch: {
      direction (v) {
        this.setDirection()
      }
    },
    mounted () {
      this.$el.classList.add('mu-flex-box')
      this.setDirection()
    },
    methods: {
      setDirection () {
        this.$el?.setAttribute('direction', this.flexDirection)
      }
    }
  }
</script>

<style lang="postcss">
  .mu-flex-box {
    position: relative;
    display: flex;
    align-items: stretch;

    &[direction="column"] {
      flex-direction: column;
      & > .mu-input-box,
      & > .mu-input {
        width: auto;
      }
    }

    &[inline] {
      display: inline-flex;
    }

    &[flex-wrap] {
      flex-wrap: wrap;
      align-content: flex-start;
    }

    &[justify-content="center"] {
      justify-content: center;
    }

    &[align-items="flex-start"] {
      align-items: flex-start;
    }

    &[align-items="center"] {
      align-items: center;
    }

    &[align-items="stretch"] {
      align-items: stretch;
    }

    &[flex-center] {
      align-items: center;
      justify-content: center;
    }

    &[bordered], & > [bordered] {
      border: 1px solid #ddd;
    }

    &[itemspacing],
    &[cellpadding] {
      padding: $(unitSpacingSizePx)px;
    }

    &[itemspacing] > *,
    & [cellspacing] {
      margin: $(unitSpacingSizePx)px;
    }

    & > * {
      position: relative;
    }

    & > [flex-auto] {
      flex: 1 1 auto !important;
    }

    & > [flex-none] {
      flex: 0 0 none !important;
    }

    &[direction="column"] > [size] {
      height: 10px;
    }
    &:not(direction="column") > [size] {
      width: 10px;
    }
    & > [size="auto"] {
      flex-grow: 1;
    }
    @for $i from 1 to 8 {
      & > [size="$i"] {
        flex-grow: $i;
      }
    }
  }
</style>
