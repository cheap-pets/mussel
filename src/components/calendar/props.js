export const outputTypeProp = {
  type: String,
  default: 'date',
  validator: v => ['date', 'string'].includes(v)
}

export const timeSteProp = {
  type: Number,
  default: 5,
  validator: v => [0, 1, 5, 10, 15, 30].includes(v)
}
