export const timeStepProp = {
  type: Number,
  default: 5,
  validator: v => [0, 1, 5, 10, 15, 30].includes(v)
}
