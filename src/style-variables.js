import { generate } from '@ant-design/colors'

const grey = generate('#b2b2b2')
/*
'#f2f2f2', '#e6e6e6', '#d9d9d9', '#cccccc', '#bfbfbf',
'#b2b2b2', '#8c8c8c', '#666666', '#404040', '#1a1a1a'
*/
let _primaryColor, _successColor, _warningColor, _dangerColor, _infoColor

const buttonShadow = 'none'
const buttonHoverShadow = '0 0 0 0.2rem $$shadowColor'
const buttonActiveShadow = 'none'

const variables = {
  /* document */
  documentFontSizePx: 14,

  /* button */
  buttonHeightPx: 32,
  buttonLineHeightPx: 20,
  buttonXPaddingPx: 10,
  buttonBorderRadiusPx: 2,
  buttonFontSize: '1rem',
  buttonShadow,
  buttonHoverShadow,
  buttonActiveShadow,
  buttonDefaultColor: grey[7],
  buttonDefaultHoverColor: grey[6],
  buttonDefaultActiveColor: grey[8],
  buttonDefaultDisabledColor: grey[4],
  buttonDefaultShadow: buttonShadow.replace('$$shadowColor', grey[3]),
  buttonDefaultHoverShadow: buttonHoverShadow.replace('$$shadowColor', grey[3]),
  buttonDefaultActiveShadow: buttonActiveShadow.replace('$$shadowColor', grey[4]),

  /* input */
  inputHeightPx: 32,
  inputLineHeightPx: 20,
  inputXPaddingPx: 10,
  inputBorderRadiusPx: 2,
  inputFontSize: '1rem',
  inputTextColor: grey[8],
  inputBorderColor: grey[5],
  inputReadonlyBackground: '#feffe6',
  inputDisabledBackground: grey[1],
  inputShadow: '0 0 0 0.2rem $inputShadowColor',
  inputInvalidShadow: '0 0 0 0.2rem $inputInvalidShadowColor',

  /* text colours */
  textBlack: grey[9],
  textGrey: grey[7],
  textDarkGrey: grey[8],
  textLightGrey: grey[6],
  textDark: 'rgba(0, 0, 0, .7)',
  textHalfDark: 'rgba(0, 0, 0, .35)',
  textQuarterDark: 'rgba(0, 0, 0, .17)',
  textLight: 'rgba(255, 255, 255, .7)',
  textHalfLight: 'rgba(255, 255, 255, .35)',
  textQuarterLight: 'rgba(255, 255, 25, .17)',

  /* margin, padding */
  marginUnitSize: 8,

  /* shadow */
  // level 1: button
  boxShadowLevel1: '0 1.5px 4px rgba(0, 0, 0, 0.24), 0 1.5px 6px rgba(0, 0, 0, 0.12)',
  // level 2: button:hover, dropdown
  boxShadowLevel2: '0 3px 12px rgba(0, 0, 0, 0.23), 0 3px 12px rgba(0, 0, 0, 0.16)',
  // level 3: drawer, window, dialog
  boxShadowLevel3: '0 6px 12px rgba(0, 0, 0, 0.23), 0 10px 40px rgba(0, 0, 0, 0.19)',
  boxshadowLevel4: '0 10px 20px rgba(0, 0, 0, 0.22), 0 14px 56px rgba(0, 0, 0, 0.25)',
  boxshadowLevel5: '0 15px 24px rgba(0, 0, 0, 0.22), 0 19px 76px rgba(0, 0, 0, 0.3)'

}

function setButtonColors (buttonType, colors) {
  variables[`button${buttonType}Color`] = colors[5]
  variables[`button${buttonType}HoverColor`] = colors[4]
  variables[`button${buttonType}ActiveColor`] = colors[6]
  variables[`button${buttonType}DisabledColor`] = colors[2]

  const {
    buttonShadow,
    buttonHoverShadow,
    buttonActiveShadow
  } = variables

  variables[`button${buttonType}Shadow`] =
    buttonShadow.replace('$$shadowColor', colors[2])

  variables[`button${buttonType}HoverShadow`] =
    buttonHoverShadow.replace('$$shadowColor', colors[2])

  variables[`button${buttonType}ActiveShadow`] =
    buttonActiveShadow.replace('$$shadowColor', colors[4])
}

Object.defineProperties(variables, {
  primaryColor: {
    get () {
      return _primaryColor
    },
    set (v) {
      _primaryColor = v
      const colors = generate(v)
      setButtonColors('Primary', colors)
      this.inputShadowColor = colors[2]
      this.inputHoverBorderColor = colors[5]
    },
    enumerable: true
  },
  successColor: {
    get () {
      return _successColor
    },
    set (v) {
      _successColor = v
      const colors = generate(v)
      setButtonColors('Submit', colors)
    },
    enumerable: true
  },
  warningColor: {
    get () {
      return _warningColor
    },
    set (v) {
      _warningColor = v
    },
    enumerable: true
  },
  dangerColor: {
    get () {
      return _dangerColor
    },
    set (v) {
      _dangerColor = v
      const colors = generate(v)
      setButtonColors('Danger', colors)
      this.inputInvalidShadowColor = colors[2]
      this.inputInvalidBorderColor = colors[5]
    },
    enumerable: true
  },
  infoColor: {
    get () {
      return _infoColor
    },
    set (v) {
      _infoColor = v
    },
    enumerable: true
  }
})

Object.assign(variables, {
  primaryColor: '#1890ff',
  successColor: '#52c41a',
  warningColor: '#fa8c16',
  dangerColor: '#fa541c',
  infoColor: '#2ccdfa'
})

export default variables
