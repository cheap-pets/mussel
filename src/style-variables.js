import { generate } from '@ant-design/colors'

const grey = generate('#b2b2b2')
/*
'#f2f2f2', '#e6e6e6', '#d9d9d9', '#cccccc', '#bfbfbf',
'#b2b2b2', '#8c8c8c', '#666666', '#404040', '#1a1a1a'
*/
let _primaryColor, _successColor, _warningColor, _dangerColor, _infoColor
let _primaryColors, _successColors, _dangerColors

let _buttonShadow = 'none'
let _buttonHoverShadow = '0 0 0 0.2rem $$shadowColor'
let _buttonActiveShadow = 'none'

const variables = {
  /* margin, padding */
  unitSpacingSizePx: 8,

  /* document */
  documentFontSizePx: 14,

  /* button */
  buttonHeightPx: 32,
  buttonLineHeightPx: 20,
  buttonXPaddingPx: 10,
  buttonBorderRadiusPx: 2,
  buttonFontSize: '1rem',
  buttonDefaultColor: grey[7],
  buttonDefaultHoverColor: grey[6],
  buttonDefaultActiveColor: grey[8],
  buttonDefaultDisabledColor: grey[4],
  buttonDefaultShadow: _buttonShadow.replace('$$shadowColor', grey[2]),
  buttonDefaultHoverShadow: _buttonHoverShadow.replace('$$shadowColor', grey[2]),
  buttonDefaultActiveShadow: _buttonActiveShadow.replace('$$shadowColor', grey[4]),

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

  /* dropdown */
  dropdownShadow: 'none',
  dropdownBorder: `1px solid ${grey[3]}`,
  dropdownItemYPaddingPx: 5,
  dropdownListPadding: '4px 0',

  /* list */
  listItemXPaddingPx: 10,
  listItemYPaddingPx: 10,
  listItemLineHeightPx: 20,
  listDividerColor: 'rgba(0, 0, 0, .1)',
  listItemBackground: '#fff',
  listItemHoverBackground: 'rgba(0, 0, 0, .05)',

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

  /* border colours */
  defaultBorderColor: grey[3],

  /* layer */
  modalMaskBackground: 'rgba(0, 0, 0, .17)',
  dialogBackground: 'rgba(255, 255, 255, .95)',
  dialogTitleFontSize: '1rem',
  dialogHeaderHeightPx: 50,
  dialogHeaderBorderBottom: '2px solid $primaryColor',
  dialogHeaderBackground: 'transparent',
  dialogFooterHeightPx: 50,
  dialogFooterBackground: 'rgba(0, 0, 0, .05)',
  dialogShadow: '0 6px 12px rgba(0, 0, 0, 0.23), 0 10px 40px rgba(0, 0, 0, 0.19)',

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

function setButtonShadow (buttonType, shadowType) {
  const colors = {
    Default: grey,
    Primary: _primaryColors,
    Submit: _successColors,
    Danger: _dangerColors
  }

  Object.keys(colors).forEach(key => {
    if (!buttonType || buttonType === key) {
      const color = [...colors[key]]
      // if (buttonType === 'Default') color.splice(0, 1)
      if (!shadowType || shadowType === 'normal') {
        variables[`button${key}Shadow`] =
          variables.buttonShadow.replace('$$shadowColor', color[2])
      }

      if (!shadowType || shadowType === 'hover') {
        variables[`button${key}HoverShadow`] =
          variables.buttonHoverShadow.replace('$$shadowColor', color[2])
      }

      if (!shadowType || shadowType === 'active') {
        variables[`button${key}ActiveShadow`] =
          variables.buttonActiveShadow.replace('$$shadowColor', color[4])
      }
    }
  })
}

function setButtonColors (buttonType, colors) {
  variables[`button${buttonType}Color`] = colors[5]
  variables[`button${buttonType}HoverColor`] = colors[4]
  variables[`button${buttonType}ActiveColor`] = colors[6]
  variables[`button${buttonType}DisabledColor`] = colors[2]

  setButtonShadow(buttonType)
}

Object.defineProperties(variables, {
  primaryColor: {
    get () {
      return _primaryColor
    },
    set (v) {
      _primaryColor = v
      _primaryColors = generate(v)
      setButtonColors('Primary', _primaryColors)
      this.inputShadowColor = _primaryColors[2]
      this.inputHoverBorderColor = _primaryColors[5]
    },
    enumerable: true
  },
  successColor: {
    get () {
      return _successColor
    },
    set (v) {
      _successColor = v
      _successColors = generate(v)
      setButtonColors('Submit', _successColors)
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
      _dangerColors = generate(v)
      setButtonColors('Danger', _dangerColors)
      this.inputInvalidShadowColor = _dangerColors[2]
      this.inputInvalidBorderColor = _dangerColors[5]
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
  },
  buttonShadow: {
    get () {
      return _buttonShadow
    },
    set (v) {
      _buttonShadow = v
      setButtonShadow(null, 'normal')
    },
    enumerable: true
  },
  buttonHoverShadow: {
    get () {
      return _buttonHoverShadow
    },
    set (v) {
      _buttonHoverShadow = v
      setButtonShadow(null, 'hover')
    },
    enumerable: true
  },
  buttonActiveShadow: {
    get () {
      return _buttonActiveShadow
    },
    set (v) {
      _buttonActiveShadow = v
      setButtonShadow(null, 'active')
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
