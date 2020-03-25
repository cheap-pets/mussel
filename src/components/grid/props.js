export default {
  columns: {
    type: Array,
    required: true
  },
  records: Array,
  frozenHeader: Boolean,
  frozenColCount: {
    type: Number,
    default: 0
  },
  frozenRowCount: {
    type: Number,
    default: 0
  }
}
