export const RULE_TYPES = {
  required (value, { label, message }) {
    if (value == null || value === '') {
      return message || `${label} is required`
    }
  }
}
