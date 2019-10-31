import { generate, presetPalettes } from '@ant-design/colors'

const grey = generate('#b2b2b2')
/*
'#f2f2f2', '#e6e6e6', '#d9d9d9', '#cccccc', '#bfbfbf',
'#b2b2b2', '#8c8c8c', '#666666', '#404040', '#1a1a1a'
*/

const {
  geekblue: primary,
  green: success,
  red: danger,
  volcano: warning
} = presetPalettes

export default {
  /* spacing */
  halfSpacingSize: '8px',
  unitSpacingSize: '16px',

  /* grey */
  grey: grey[7],
  greyTiny: grey[4],
  greyPlus: grey[7],
  greyMinus: grey[6],

  /* primary colors */
  primaryColor: primary[5],
  primaryTinyColor: primary[2],
  primaryPlusColor: primary[6],
  primaryMinusColor: primary[4],

  /* success colors */
  successColor: success[5],
  successTinyColor: success[2],
  successPlusColor: success[6],
  successMinusColor: success[4],

  /* danger colors */
  dangerColor: danger[5],
  dangerTinyColor: danger[2],
  dangerPlusColor: danger[6],
  dangerMinusColor: danger[4],

  /* warning colors */
  warningColor: warning[5],

  /* font */
  documentFontSize: '14px',
  documentFontWeight: '400',

  /* common control vars */
  commonTextColor: '#333',
  commonBackground: '#fff',
  commonHeaderBackground: '#fff',
  commonFooterBackground: grey[1],
  commonBorderColor: grey[5],
  commonGridLineColor: grey[2],
  commonHoverBackground: '#eee',
  commonDisabledTextColor: grey[6],
  commonDisabledBackground: grey[1],

  commonBarHeight: '40px',
  compactBarHeight: '32px',
  commonLineHeight: '20px',
  commonIconWidth: '20px',

  /* input & button */
  inputElementHeight: '32px',
  inputElementPaddingX: '10px',
  inputElementPadding: '5px 10px',
  inputElementRoundRadius: '16px',
  inputElementBorderRadius: '2px',

  buttonFontSize: '1rem',
  buttonShadow: '0 0 0 0',
  buttonRoundRadius: '16px',
  buttonActiveShadow: '0 0 0 0',
  buttonHoverShadow: '0 0 0 3px',
  buttonDisabledTextColor: '#eee',
  buttonDividerColor: 'rgba(255, 255, 255, .5)',

  inputFontSize: '1rem',
  inputFocusShadow: '0 0 0 3px',
  inputReadonlyBackground: '#ffd',

  inputIconSize: '30px',
  inputIconSizeX2: '60px',
  inputIconColor: grey[5],

  /* calendar */
  calendarFontSize: '0.857rem',
  calendarTitleFontSize: '1.14rem',

  /* dropdown */
  dropdownBorderRadius: 0,
  dropdownShadow: 'none',
  dropdownListPadding: '4px 0',
  dropdownItemPadding: '5px 16px',

  /* expander */
  expanderHeaderFontSize: '1rem',

  /* form */
  formLabelFontSize: '1rem',

  /* modal & dialog */
  maskBackground: 'rgba(0, 0, 0, .17)',

  dialogHeaderHeight: '50px',
  dialogTitleFontSize: '1rem',
  dialogHeaderBackground: '$commonHeaderBackground',
  dialogHeaderBorderBottom: '2px solid $primaryColor',
  dialogFooterHeight: '50px',
  dialogFooterBackground: '$commonFooterBackground',
  dialogShadow:
  '0 6px 12px rgba(0, 0, 0, 0.23), 0 10px 40px rgba(0, 0, 0, 0.19)',

  /* layout & splitter */
  splitterSize: '4px',
  splitterColor: 'rgba(0, 0, 0, 0.1)',
  splitterHoverColor: 'rgba(0, 0, 0, 0.2)',

  /* list */
  listItemPadding: '10px 16px',
  listDividerMargin: '4px 0',
  listDividerHeight: '1px',

  /* tab */
  tabCardBackground: '#eee'
}
