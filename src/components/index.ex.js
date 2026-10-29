import { install as installBase } from './index.js'
import { MuTableEx } from './table/ex/index.js'

export function install (app, options) {
  const result = installBase(app, options)
  app.component('MuTableEx', MuTableEx)
  return result
}
