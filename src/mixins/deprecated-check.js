export default {
  created () {
    Object.keys(this.$options.props).forEach(key => {
      const prop = this.$options.props[key]

      if (prop.deprecated && this[key]) {
        const replacement = prop.replacement
          ? `, use "${prop.replacement}" instead`
          : ''

        console.warn(
          `[${this.$options.name}]`,
          `property "${key}" is deprecated${replacement}!`
        )
      }
    })
  }
}
