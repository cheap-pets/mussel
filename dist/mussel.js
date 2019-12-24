(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue'], factory) :
  (global = global || self, factory(global.mussel = {}, global.Vue));
}(this, (function (exports, Vue) { 'use strict';

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

  function styleInject(css, ref) {
    if ( ref === void 0 ) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css = "html {\n  color: rgba(0,0,0,.7);\n  font-size: 14px;\n  font-weight: 400;\n}\nbody {\n  font-size: 100%;\n}\nbutton,\nhtml {\n  font-family: -apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",\"Helvetica Neue\",Helvetica,Arial,sans-serif;\n}\n[class^=mu-] {\n  box-sizing: border-box;\n}";
  styleInject(css);

  var css$1 = ".mu-background-normal {\n  background: #fff;\n}\n.mu-background-grey {\n  background: rgba(0,0,0,.04);\n}\n.mu-background-highlight {\n  background: rgba(0,0,0,.35);\n  color: #fff;\n}\n.mu-background-info {\n  background: #ffd;\n}\n.mu-background-hover:hover {\n  background: rgba(0,0,0,.05);\n}\n.mu-background-disabled[disabled] {\n  background: rgba(0,0,0,.08);\n  color: rgba(0,0,0,.3);\n}\n.mu-background-primary {\n  background: #1890ff;\n}\n.mu-background-success {\n  background: #52c41a;\n}\n.mu-background-danger {\n  background: #52c41a;\n}\n.mu-background-warning {\n  background: #faad14;\n}";
  styleInject(css$1);

  var css$2 = ".mu-text-ellipsis {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.mu-text-color-normal {\n  color: rgba(0,0,0,.7);\n  fill: rgba(0,0,0,.7);\n}\n.mu-text-color-weak {\n  color: rgba(0,0,0,.3);\n  fill: rgba(0,0,0,.3);\n}\n.mu-text-color-title {\n  color: rgba(0,0,0,.85);\n  fill: rgba(0,0,0,.85);\n}\n.mu-text-color-subtitle {\n  color: rgba(0,0,0,.5);\n  fill: rgba(0,0,0,.5);\n}\n.mu-text-color-primary {\n  color: #1890ff;\n  fill: #1890ff;\n}\n.mu-text-color-success {\n  color: #52c41a;\n  fill: #52c41a;\n}\n.mu-text-color-danger {\n  color: #52c41a;\n  fill: #52c41a;\n}\n.mu-text-color-warning {\n  color: #faad14;\n  fill: #faad14;\n}\n.mu-text-color-highlight {\n  color: #fff;\n  fill: #fff;\n}";
  styleInject(css$2);

  var css$3 = ".mu-icon {\n  display: inline-block;\n}\n.mu-icon > svg {\n  vertical-align: -.15em;\n}\n.mu-icon[trigger-type] {\n  cursor: pointer;\n  -webkit-transition: -webkit-transform .2s ease-in-out;\n  transition: -webkit-transform .2s ease-in-out;\n  transition: transform .2s ease-in-out;\n  transition: transform .2s ease-in-out,-webkit-transform .2s ease-in-out;\n}\n.mu-icon[trigger-type=close]:hover {\n  fill: #f5222d;\n  color: #f5222d;\n}\n.mu-dropdown[expanded] [trigger-type=expander],\n.mu-expander[expanded] [trigger-type=expander],\n.mu-icon[trigger-type=expander][trigger-on],\n.mu-popup-editor[expanded] > [trigger-type=expander] {\n  -webkit-transform: rotate(180deg);\n  transform: rotate(180deg);\n}";
  styleInject(css$3);

  var css$4 = ".mu-flex-box {\n  position: relative;\n  display: -webkit-box;\n  display: flex;\n  -webkit-box-align: stretch;\n  align-items: stretch;\n}\n.mu-flex-box[direction=column] {\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  flex-direction: column;\n}\n.mu-flex-box[direction=row-reverse] {\n  -webkit-box-orient: horizontal;\n  -webkit-box-direction: reverse;\n  flex-direction: row-reverse;\n}\n.mu-flex-box[direction=column-reverse] {\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: reverse;\n  flex-direction: column-reverse;\n}\n.mu-flex-box[inline] {\n  display: -webkit-inline-box;\n  display: inline-flex;\n}\n.mu-flex-box[flex-wrap] {\n  flex-wrap: wrap;\n  align-content: flex-start;\n}\n.mu-flex-box[justify-content=center] {\n  -webkit-box-pack: center;\n  justify-content: center;\n}\n.mu-flex-box[align-items=flex-start] {\n  -webkit-box-align: start;\n  align-items: flex-start;\n}\n.mu-flex-box[align-items=center] {\n  -webkit-box-align: center;\n  align-items: center;\n}\n.mu-flex-box[align-items=stretch] {\n  -webkit-box-align: stretch;\n  align-items: stretch;\n}\n.mu-flex-box[flex-center] {\n  -webkit-box-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  justify-content: center;\n}\n.mu-flex-box > [bordered],\n.mu-flex-box[bordered] {\n  border: 1px solid rgba(0,0,0,.15);\n}\n.mu-flex-box[cellpadding],\n.mu-flex-box[content-spacing] {\n  padding: 8px;\n}\n.mu-flex-box [cellspacing],\n.mu-flex-box[content-spacing] > * {\n  margin: 8px;\n}\n.mu-flex-box > * {\n  position: relative;\n  box-sizing: border-box;\n}\n.mu-flex-box > [flex-auto] {\n  -webkit-box-flex: 1!important;\n  flex: 1 1 auto!important;\n}\n.mu-flex-box > [flex-none] {\n  -webkit-box-flex: 0!important;\n  flex: 0 0 none!important;\n}\n.mu-flex-box > [align-self=center] {\n  align-self: center;\n}\n.mu-flex-box > [align-self=stretch] {\n  align-self: stretch;\n}\n.mu-flex-box > [size=auto] {\n  -webkit-box-flex: 1;\n  flex: 1 1 auto;\n}\n.mu-flex-box > [size=\"1\"] {\n  -webkit-box-flex: 1;\n  flex: 1 1 1px;\n}\n.mu-flex-box > [size=\"2\"] {\n  -webkit-box-flex: 2;\n  flex: 2 2 2px;\n}\n.mu-flex-box > [size=\"3\"] {\n  -webkit-box-flex: 3;\n  flex: 3 3 3px;\n}\n.mu-flex-box > [size=\"4\"] {\n  -webkit-box-flex: 4;\n  flex: 4 4 4px;\n}\n.mu-flex-box > [size=\"5\"] {\n  -webkit-box-flex: 5;\n  flex: 5 5 5px;\n}\n.mu-flex-box > [size=\"6\"] {\n  -webkit-box-flex: 6;\n  flex: 6 6 6px;\n}\n.mu-flex-box > [size=\"7\"] {\n  -webkit-box-flex: 7;\n  flex: 7 7 7px;\n}\n.mu-flex-box > [size=\"8\"] {\n  -webkit-box-flex: 8;\n  flex: 8 8 8px;\n}\n.mu-absolute-fit {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n[content-spacing] > .mu-absolute-fit {\n  top: 16px;\n  left: 16px;\n  right: 16px;\n  bottom: 16px;\n}\n[cellpadding] > .mu-absolute-fit {\n  top: 8px;\n  left: 8px;\n  right: 8px;\n  bottom: 8px;\n}\n.mu-bordered {\n  border: 1px solid rgba(0,0,0,.15);\n}\n.mu-splitter {\n  background: rgba(0,0,0,.09);\n  border-radius: 4px;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.mu-splitter[draggable]:hover {\n  background: rgba(0,0,0,.15);\n}\n.mu-splitter:first-child,\n.mu-splitter:last-child {\n  display: none;\n}\n[cellpadding] > .mu-splitter,\n[item-spacing] > .mu-splitter {\n  margin: 8px;\n}\n[direction=row] > .mu-splitter {\n  width: 4px;\n  margin-left: 0;\n  margin-right: 0;\n}\n[direction=row] > .mu-splitter[draggable] {\n  cursor: col-resize;\n}\n[direction=column] > .mu-splitter[draggable] {\n  height: 4px;\n  margin-top: 0;\n  margin-bottom: 0;\n}\n[direction=column] > .mu-splitter[draggable][draggable] {\n  cursor: row-resize;\n}\n.mu-space {\n  -webkit-box-flex: 1;\n  flex: 1 1 0%;\n}\n[direction=row][flex-wrap] > .mu-space {\n  -webkit-box-flex: 0;\n  flex: none;\n  width: 100%;\n}";
  styleInject(css$4);

  var css$5 = ".mu-list-item {\n  position: relative;\n  line-height: 20px;\n  padding: 10px 16px;\n  overflow: hidden;\n  color: rgba(0,0,0,.7);\n  fill: rgba(0,0,0,.7);\n}\n.mu-list-item[selected] {\n  color: #1890ff;\n  fill: #1890ff;\n  font-weight: 600;\n}\n.mu-list-item:hover {\n  color: #1890ff;\n  fill: #1890ff;\n  background: rgba(0,0,0,.05);\n}\n.mu-list-item[disabled] {\n  color: rgba(0,0,0,.3);\n  fill: rgba(0,0,0,.3);\n  background: 0 0;\n}\n.mu-list-item[active] {\n  color: #fff;\n  fill: #fff;\n  background: #1890ff;\n}\n.mu-list-item > .mu-icon {\n  display: inline-block;\n  width: 20px;\n}\n.mu-list-item:not([multi-lines]) {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  cursor: default;\n}\n.mu-list-divider {\n  display: block;\n  height: 1px;\n  margin: 4px 0;\n  border-bottom: 1px solid rgba(0,0,0,.09);\n}\n.mu-list-divider:first-child,\n.mu-list-divider:last-child {\n  display: none;\n}";
  styleInject(css$5);

  var css$6 = ".mu-button {\n  position: relative;\n  display: inline-block;\n  height: 32px;\n  padding: 5px 10px;\n  outline: 0;\n  border: 1px solid rgba(0,0,0,.15);\n  border-radius: 2px;\n  line-height: 20px;\n  background: #fff;\n  text-decoration: none;\n  text-align: center;\n  font-size: 1rem;\n  color: rgba(0,0,0,.7);\n  fill: rgba(0,0,0,.7);\n  cursor: pointer;\n}\n.mu-button::before {\n  display: inline-block;\n  width: 0;\n  content: '\\00a0';\n}\n.mu-button[button-style=link] {\n  padding-left: 0;\n  padding-right: 0;\n}\n.mu-button:not([button-type]),\n.mu-button[button-type=normal] {\n  box-shadow: 0 0 0 0 rgba(0,0,0,.04);\n}\n.mu-button:not([button-type])[button-style=link]:hover,\n.mu-button[button-type=normal][button-style=link]:hover {\n  color: #40a9ff;\n  fill: #40a9ff;\n}\n.mu-button:not([button-type])[active],\n.mu-button[button-type=normal][active] {\n  background: rgba(0,0,0,.35);\n  box-shadow: 0 0 0 0 rgba(0,0,0,.04);\n  color: #fff;\n  fill: #fff;\n}\n.mu-button:not([button-type]):hover,\n.mu-button[button-type=normal]:hover {\n  background: #fff;\n  box-shadow: 0 0 0 2px rgba(0,0,0,.05);\n  color: #1890ff;\n  fill: #1890ff;\n}\n.mu-button[button-style=text] {\n  box-shadow: none;\n}\n.mu-button[button-style=text]:hover {\n  border-color: rgba(0,0,0,.15);\n}\n.mu-button[button-style=link],\n.mu-button[disabled] {\n  box-shadow: none!important;\n}\n.mu-button[button-type=primary] {\n  color: #fff;\n  fill: #fff;\n  border-color: #1890ff;\n  background: #1890ff;\n  box-shadow: 0 0 0 0 #bae7ff;\n}\n.mu-button[button-type=primary][button-style=link] {\n  color: #1890ff;\n  fill: #1890ff;\n}\n.mu-button[button-type=primary][button-style=link]:hover {\n  color: #40a9ff;\n  fill: #40a9ff;\n}\n.mu-button[button-type=primary][button-style=outline],\n.mu-button[button-type=primary][button-style=text] {\n  color: #1890ff;\n  fill: #1890ff;\n}\n.mu-button[button-type=primary][active] {\n  background: #096dd9;\n  border-color: #096dd9;\n  box-shadow: 0 0 0 0 #bae7ff;\n}\n.mu-button[button-type=primary]:hover {\n  background: #40a9ff;\n  border-color: #40a9ff;\n  box-shadow: 0 0 0 2px #bae7ff;\n  color: #fff;\n  fill: #fff;\n}\n.mu-button[button-type=submit] {\n  color: #fff;\n  fill: #fff;\n  background: #52c41a;\n  border-color: #52c41a;\n  box-shadow: 0 0 0 0 #d9f7be;\n}\n.mu-button[button-type=submit][button-style=link] {\n  color: #52c41a;\n  fill: #52c41a;\n}\n.mu-button[button-type=submit][button-style=link]:hover {\n  color: #73d13d;\n  fill: #73d13d;\n}\n.mu-button[button-type=submit][button-style=outline],\n.mu-button[button-type=submit][button-style=text] {\n  color: #52c41a;\n  fill: #52c41a;\n}\n.mu-button[button-type=submit][active] {\n  background: #389e0d;\n  border-color: #389e0d;\n  box-shadow: 0 0 0 0 #d9f7be;\n}\n.mu-button[button-type=submit]:hover {\n  background: #73d13d;\n  border-color: #73d13d;\n  box-shadow: 0 0 0 2px #d9f7be;\n  color: #fff;\n  fill: #fff;\n}\n.mu-button[button-type=danger] {\n  color: #fff;\n  fill: #fff;\n  background: #f5222d;\n  border-color: #f5222d;\n  box-shadow: 0 0 0 0 #ffccc7;\n}\n.mu-button[button-type=danger][button-style=link] {\n  color: #f5222d;\n  fill: #f5222d;\n}\n.mu-button[button-type=danger][button-style=link]:hover {\n  color: #ff4d4f;\n  fill: #ff4d4f;\n}\n.mu-button[button-type=danger][button-style=outline],\n.mu-button[button-type=danger][button-style=text] {\n  color: #f5222d;\n  fill: #f5222d;\n}\n.mu-button[button-type=danger][active] {\n  background: #cf1322;\n  border-color: #cf1322;\n  box-shadow: 0 0 0 0 #ffccc7;\n}\n.mu-button[button-type=danger]:hover {\n  background: #ff4d4f;\n  border-color: #ff4d4f;\n  box-shadow: 0 0 0 2px #ffccc7;\n  color: #fff;\n  fill: #fff;\n}\n.mu-button[button-style=link],\n.mu-button[button-style=link]:hover,\n.mu-button[button-style=link][active],\n.mu-button[button-style=text] {\n  border-color: transparent;\n  background: 0 0;\n  box-shadow: none;\n}\n.mu-button[button-style=outline] {\n  background: #fff;\n}\n.mu-button[disabled] {\n  color: rgba(0,0,0,.3)!important;\n  fill: rgba(0,0,0,.3)!important;\n  cursor: default;\n}\n.mu-button[disabled]:not([button-style=link]) {\n  border-color: rgba(0,0,0,.08)!important;\n  background: rgba(0,0,0,.08)!important;\n}\n.mu-button:empty,\n.mu-button[icon-only] {\n  width: 32px;\n  padding-left: 0;\n  padding-right: 0;\n}\nbutton.mu-button {\n  padding-top: 0;\n  padding-bottom: 0;\n}\n[button-shape=round],\n[button-shape=round] > .mu-button {\n  border-radius: 16px;\n}\n.mu-button-like {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  cursor: pointer;\n}\n.mu-button-like:hover {\n  color: #1890ff;\n  fill: #1890ff;\n  background: rgba(0,0,0,.05);\n}\n.mu-button-like[active] {\n  color: #fff;\n  fill: #fff;\n  background: #1890ff;\n}";
  styleInject(css$6);

  var css$7 = ".mu-toggle {\n  display: -webkit-inline-box;\n  display: inline-flex;\n  -webkit-box-align: center;\n  align-items: center;\n  height: 32px;\n  vertical-align: middle;\n}\n.mu-toggle > * {\n  cursor: pointer;\n}\n.mu-toggle > .mu-toggle-slide-bar {\n  position: relative;\n  width: 40px;\n  height: 20px;\n  border-radius: 10px;\n  background: rgba(0,0,0,.35);\n  -webkit-transition: background .2s ease-in-out;\n  transition: background .2s ease-in-out;\n}\n.mu-toggle > .mu-toggle-slide-bar:after {\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  bottom: 3px;\n  display: inline-block;\n  width: 14px;\n  background: #fff;\n  border-radius: 7px;\n  content: '';\n  -webkit-transition: all .2s ease-in-out;\n  transition: all .2s ease-in-out;\n}\n.mu-toggle[active] > .mu-toggle-slide-bar {\n  background: #52c41a;\n}\n.mu-toggle[active] > .mu-toggle-slide-bar:after {\n  left: 100%;\n  -webkit-transform: translateX(-17px);\n  transform: translateX(-17px);\n}\n.mu-toggle > * + * {\n  margin-left: 5px;\n}\n.mu-toggle[disabled] > * {\n  color: rgba(0,0,0,.3);\n  cursor: default;\n}\n.mu-toggle[disabled] > .mu-toggle-slide-bar {\n  background: rgba(0,0,0,.04);\n}\n.mu-toggle[disabled] > .mu-toggle-slide-bar:after {\n  background: rgba(0,0,0,.08);\n}";
  styleInject(css$7);

  var css$8 = ".mu-button-group {\n  position: relative;\n  display: inline-block;\n  vertical-align: top;\n  border-radius: 2px;\n  box-shadow: 0 0 0 0 rgba(0,0,0,.04);\n}\n.mu-button-group[button-type=primary] {\n  box-shadow: 0 0 0 0 #1890ff;\n}\n.mu-button-group[button-type=success] {\n  box-shadow: 0 0 0 0 #d9f7be;\n}\n.mu-button-group[button-type=danger] {\n  box-shadow: 0 0 0 0 #ffccc7;\n}\n.mu-button-group > .mu-button {\n  z-index: 0;\n  float: left;\n  box-shadow: none;\n}\n.mu-button-group > .mu-button:hover:not([disabled]) {\n  z-index: 1;\n}\n.mu-button-group > .mu-button + .mu-button {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.mu-button-group > .mu-button + .mu-button[button-type]:not([button-type=normal]):not(:hover):not([active]):not([button-style]),\n.mu-button-group > .mu-button + .mu-button[button-type]:not([button-type=normal]):not(:hover):not([active])[button-style=normal] {\n  border-left-color: rgba(255,255,255,.5);\n}\n.mu-button-group > .mu-button:not(:last-child) {\n  margin-right: -1px;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}";
  styleInject(css$8);

  var css$9 = ".mu-input {\n  position: relative;\n  z-index: 1;\n  width: 200px;\n  padding: 5px 10px;\n  outline: 0;\n  border: 1px solid rgba(0,0,0,.15);\n  border-radius: 2px;\n  line-height: 20px;\n  background: #fff;\n  font-size: 1rem;\n  color: rgba(0,0,0,.7);\n}\n.mu-input::-webkit-input-placeholder {\n  color: rgba(0,0,0,.3);\n}\n.mu-input::-moz-placeholder {\n  color: rgba(0,0,0,.3);\n}\n.mu-input:-ms-input-placeholder {\n  color: rgba(0,0,0,.3);\n}\n.mu-input::-ms-input-placeholder {\n  color: rgba(0,0,0,.3);\n}\n.mu-input::placeholder {\n  color: rgba(0,0,0,.3);\n}\n.mu-input:focus,\n.mu-input:hover,\n.mu-input[focus] {\n  border-color: #1890ff;\n}\n.mu-input:focus,\n.mu-input[focus] {\n  z-index: 2;\n  text-align: left!important;\n  box-shadow: 0 0 0 2px #bae7ff;\n}\n.mu-input[readonly] {\n  cursor: default;\n  background-color: #ffd;\n}\n.mu-input[disabled] {\n  background-color: rgba(0,0,0,.08);\n  border-color: rgba(0,0,0,.15);\n  color: rgba(0,0,0,.3);\n  box-shadow: none;\n}\n.mu-input::-ms-clear {\n  display: none;\n}\n.mu-input[invalid],\n[invalid] .mu-input {\n  color: #f5222d;\n  border-color: #f5222d;\n}\n.mu-input[invalid]:focus,\n.mu-input[invalid][focus],\n[invalid] .mu-input:focus,\n[invalid] .mu-input[focus] {\n  box-shadow: 0 0 0 2px #ffccc7;\n}\ninput.mu-input {\n  height: 32px;\n  padding-top: 0;\n  padding-bottom: 0;\n}\ntextarea.mu-input {\n  min-height: 80px;\n  resize: none;\n}\n.mu-input[input-shape=round],\n[input-shape=round] > .mu-input {\n  border-radius: 16px;\n}";
  styleInject(css$9);

  var css$a = ".mu-editor {\n  position: relative;\n  display: inline-block;\n  width: 200px;\n}\n.mu-editor:hover > .mu-input {\n  border-color: #1890ff;\n}\n.mu-editor > .mu-input[disabled],\n.mu-editor[disabled] > .mu-input {\n  border-color: rgba(0,0,0,.15);\n}\n.mu-editor > .mu-input {\n  width: 100%;\n  vertical-align: middle;\n  padding-right: 30px;\n  background: #fff;\n}\n.mu-editor[buttons=\"0\"] > .mu-input {\n  padding-right: 10px;\n}\n.mu-editor[buttons=\"2\"] > input {\n  padding-right: 60px;\n}\n.mu-editor[buttons=\"2\"] > input + .mu-editor-icon {\n  right: 30px;\n}\n.mu-editor[buttons=\"2\"] > .mu-editor-icon:first-child + .mu-editor-icon {\n  left: 30px;\n  right: auto;\n}\n.mu-editor[buttons=\"2\"] > .mu-editor-icon:first-child ~ input {\n  padding-left: 60px;\n  padding-right: 10px;\n}\n.mu-editor[buttons=\"2\"] > .mu-editor-icon:first-child + input {\n  padding-left: 30px;\n  padding-right: 30px;\n}\n.mu-editor[buttons=\"2\"] > .mu-editor-icon:first-child + input + .mu-editor-icon {\n  right: 1px;\n}\n.mu-editor[readonly] > input {\n  background-color: #ffd;\n}\n.mu-editor[disabled] > input {\n  background-color: rgba(0,0,0,.08);\n}\n.mu-editor[disabled] > input,\n.mu-editor[readonly] > input {\n  padding-left: 10px;\n  padding-right: 10px;\n}\n.mu-editor[disabled] > .mu-editor-icon,\n.mu-editor[readonly] > .mu-editor-icon {\n  display: none;\n}\n.mu-icon.mu-editor-icon {\n  position: absolute;\n  z-index: 3;\n  top: 1px;\n  bottom: 1px;\n  right: 1px;\n  display: -webkit-inline-box;\n  display: inline-flex;\n  -webkit-box-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  justify-content: center;\n  width: 30px;\n  color: rgba(0,0,0,.5);\n  fill: rgba(0,0,0,.5);\n}\n.mu-icon.mu-editor-icon:first-child {\n  left: 1px;\n  right: auto;\n}\n.mu-icon.mu-editor-icon:first-child + input {\n  padding-left: 30px;\n  padding-right: 10px;\n}\n.mu-icon.mu-editor-icon[clickable] {\n  cursor: pointer;\n}\n.mu-icon.mu-editor-icon[clickable]:hover {\n  fill: #1890ff;\n  color: #1890ff;\n}\n.mu-icon.mu-editor-icon[trigger-type=clear] {\n  color: rgba(0,0,0,.3);\n  fill: rgba(0,0,0,.3);\n}\n.mu-icon.mu-editor-icon[trigger-type=clear]:hover {\n  color: rgba(0,0,0,.5);\n  fill: rgba(0,0,0,.5);\n}\n.mu-editor[invalid] > .mu-input,\n[invalid] .mu-editor > .mu-input {\n  border-color: #f5222d;\n}\n.mu-editor[invalid] > [clickable]:hover,\n[invalid] .mu-editor > [clickable]:hover {\n  color: #f5222d;\n  fill: #f5222d;\n}";
  styleInject(css$a);

  var css$b = ".mu-color-editor > input[readonly] {\n  background: #fff;\n}\n.mu-color-editor > .mu-color-indicator {\n  position: absolute;\n  z-index: 2;\n  top: 50%;\n  left: 10px;\n  padding: 0 10px;\n  -webkit-transform: translateY(-50%);\n  transform: translateY(-50%);\n}\n.mu-color-palette {\n  padding: 8px;\n  overflow: hidden;\n  text-align: center;\n  font-size: 0;\n}\n.mu-color-palette > div + div {\n  margin-top: 2px;\n}\n.mu-color-palette .mu-color-palette-cell {\n  display: inline-block;\n  width: 12px;\n  height: 12px;\n  border: 1px solid rgba(0,0,0,.25);\n  overflow: hidden;\n  cursor: pointer;\n}\n.mu-color-palette .mu-color-palette-cell:hover {\n  -webkit-transform: scale(2);\n  transform: scale(2);\n}\n.mu-color-palette .mu-color-palette-cell + .mu-color-palette-cell {\n  margin-left: 2px;\n}";
  styleInject(css$b);

  var css$c = ".mu-form-field {\n  min-width: 80px;\n}\n.mu-form-field > label {\n  display: inline-block;\n  line-height: 32px;\n  padding-right: 12px;\n  font-size: 1rem;\n}\n.mu-form-field > label:before {\n  position: absolute;\n  right: 0;\n  top: -3px;\n  display: inline-block;\n  visibility: hidden;\n  width: 10px;\n  text-align: left;\n  font-weight: 500;\n  color: #f5222d;\n  content: \"*\";\n}\n.mu-form-field[required] > label:before {\n  visibility: visible;\n}\n.mu-form-field[invalid] > label {\n  color: #f5222d;\n}\n.mu-form-field > .mu-editor,\n.mu-form-field > .mu-input {\n  -webkit-box-flex: 1;\n  flex: 1 1 1px;\n  width: 1px;\n}";
  styleInject(css$c);

  var css$d = ".mu-calendar {\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  flex-direction: column;\n  min-height: 240px;\n  min-width: 280px;\n  font-size: .857rem;\n  background: #fff;\n  border: 1px solid rgba(0,0,0,.15);\n  overflow: hidden;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.mu-calendar,\n.mu-calendar .mu-calendar-cell,\n.mu-calendar .mu-calendar-row,\n.mu-calendar > .mu-calendar-grid,\n.mu-calendar > .mu-calendar-header,\n.mu-calendar > .mu-week-header {\n  display: -webkit-box;\n  display: flex;\n  -webkit-box-align: stretch;\n  align-items: stretch;\n}\n.mu-calendar > .mu-calendar-header {\n  -webkit-box-align: center;\n  align-items: center;\n  height: 32px;\n  padding: 0 8px;\n}\n.mu-calendar > .mu-calendar-header > .mu-calendar-title {\n  margin-right: auto;\n  font-size: 1.14rem;\n  font-weight: 600;\n  color: #1890ff;\n  cursor: pointer;\n}\n.mu-calendar > .mu-week-header {\n  -webkit-box-align: center;\n  align-items: center;\n  height: 32px;\n  font-weight: 600;\n  color: rgba(0,0,0,.5);\n  border-top: 1px solid #1890ff;\n}\n.mu-calendar > .mu-week-header > * {\n  -webkit-box-flex: 1;\n  flex-grow: 1;\n  width: 1px;\n  text-align: center;\n}\n.mu-calendar > .mu-calendar-grid {\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  flex-direction: column;\n  -webkit-box-flex: 1;\n  flex-grow: 1;\n  height: 1px;\n  border-top: 1px solid #1890ff;\n  overflow: visible;\n}\n.mu-calendar > .mu-calendar-grid > .mu-calendar-row {\n  height: 1px;\n  -webkit-box-flex: 1;\n  flex-grow: 1;\n}\n.mu-calendar > .mu-calendar-grid > .mu-calendar-row + .mu-calendar-row {\n  border-top: 1px solid rgba(0,0,0,.09);\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell {\n  position: relative;\n  -webkit-box-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  justify-content: center;\n  -webkit-box-flex: 1;\n  flex-grow: 1;\n  width: 1px;\n  color: #1890ff;\n  cursor: pointer;\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell + .mu-calendar-cell {\n  border-left: 1px solid rgba(0,0,0,.09);\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell[marked]:after {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 0;\n  height: 0;\n  content: '';\n  border-bottom: 8px solid #f5222d;\n  border-right: 8px solid transparent;\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell[adjacent] {\n  color: rgba(0,0,0,.3);\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell:hover {\n  color: #40a9ff;\n  background: rgba(0,0,0,.05);\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell[present] {\n  font-weight: 600;\n  color: #faad14;\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell[invalid] {\n  color: rgba(0,0,0,.3);\n  background: rgba(0,0,0,.08);\n  cursor: default;\n}\n.mu-calendar > .mu-calendar-grid .mu-calendar-cell[active] {\n  z-index: 1;\n  font-weight: 600;\n  color: #fff;\n  background: #1890ff;\n  box-shadow: 0 0 8px rgba(0,0,0,.17),0 0 4px rgba(0,0,0,.35);\n}\n.mu-dropdown-panel > .mu-calendar {\n  border: 0;\n}";
  styleInject(css$d);

  var css$e = ".mu-bar > * {\n  margin-right: 8px;\n}\n.mu-bar > :last-child {\n  margin-right: 0;\n}";
  styleInject(css$e);

  var css$f = ".mu-tabs {\n  background: #fff;\n}\n.mu-tabs-header {\n  font-size: 1rem;\n}\n.mu-tabs-header[tab-style=card] > .mu-tab-item {\n  background: rgba(0,0,0,.04);\n  border-style: solid;\n  border-color: rgba(0,0,0,.15);\n}\n.mu-tabs-header[tab-style=card] > .mu-tab-item[active] {\n  background: #fff;\n}\n.mu-tabs-header[tab-style=card] > [active]:before {\n  position: absolute;\n  background-color: #1890ff;\n  content: '';\n}\n.mu-tabs-header[tab-style=card] > [active]:after {\n  background: #fff;\n}\n.mu-tabs-header[tab-style=card] ~ .mu-tab-panel {\n  padding: 16px;\n  border: 1px solid rgba(0,0,0,.15);\n}\n.mu-tabs-header[tab-position=bottom],\n.mu-tabs-header[tab-position=top] {\n  -webkit-box-align: center;\n  align-items: center;\n  height: 40px;\n}\n.mu-tabs-header[tab-position=bottom] > .mu-tab-item,\n.mu-tabs-header[tab-position=top] > .mu-tab-item {\n  align-self: stretch;\n}\n.mu-tabs-header[tab-position=bottom] > .mu-tab-item[active]:after,\n.mu-tabs-header[tab-position=top] > .mu-tab-item[active]:after {\n  left: 0;\n  right: 0;\n  height: 2px;\n}\n.mu-tabs-header[tab-position=bottom] > .mu-tab-item + .mu-tab-item,\n.mu-tabs-header[tab-position=top] > .mu-tab-item + .mu-tab-item {\n  margin-left: 20px;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card],\n.mu-tabs-header[tab-position=top][tab-style=card] {\n  border: 0;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > .mu-tab-item,\n.mu-tabs-header[tab-position=top][tab-style=card] > .mu-tab-item {\n  margin-left: 0;\n  padding: 0 16px;\n  border-width: 0;\n  border-right-width: 1px;\n  border-left-width: 1px;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > .mu-tab-item[active]:before,\n.mu-tabs-header[tab-position=top][tab-style=card] > .mu-tab-item[active]:before {\n  left: -1px;\n  right: -1px;\n  height: 3px;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > .mu-tab-item[active]:after,\n.mu-tabs-header[tab-position=top][tab-style=card] > .mu-tab-item[active]:after {\n  height: 1px;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > .mu-tab-item + .mu-tab-item,\n.mu-tabs-header[tab-position=top][tab-style=card] > .mu-tab-item + .mu-tab-item {\n  border-left-width: 0;\n}\n.mu-tabs-header[tab-position=left],\n.mu-tabs-header[tab-position=right] {\n  display: -webkit-inline-box;\n  display: inline-flex;\n}\n.mu-tabs-header[tab-position=left] > .mu-tab-item,\n.mu-tabs-header[tab-position=right] > .mu-tab-item {\n  height: 40px;\n}\n.mu-tabs-header[tab-position=left] > .mu-tab-item[active]:after,\n.mu-tabs-header[tab-position=right] > .mu-tab-item[active]:after {\n  top: 0;\n  bottom: 0;\n  width: 2px;\n}\n.mu-tabs-header[tab-position=left][tab-style=card],\n.mu-tabs-header[tab-position=right][tab-style=card] {\n  border: 0;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > .mu-tab-item,\n.mu-tabs-header[tab-position=right][tab-style=card] > .mu-tab-item {\n  padding: 0 16px;\n  border-width: 0;\n  border-top-width: 1px;\n  border-bottom-width: 1px;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > .mu-tab-item[active]:before,\n.mu-tabs-header[tab-position=right][tab-style=card] > .mu-tab-item[active]:before {\n  top: -1px;\n  bottom: -1px;\n  width: 3px;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > .mu-tab-item[active]:after,\n.mu-tabs-header[tab-position=right][tab-style=card] > .mu-tab-item[active]:after {\n  width: 1px;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > .mu-tab-item + .mu-tab-item,\n.mu-tabs-header[tab-position=right][tab-style=card] > .mu-tab-item + .mu-tab-item {\n  border-top-width: 0;\n}\n.mu-tabs-header[tab-position=top] {\n  border-bottom: 2px solid rgba(0,0,0,.09);\n}\n.mu-tabs-header[tab-position=top] > .mu-tab-item {\n  border-bottom: 0;\n}\n.mu-tabs-header[tab-position=top] > [active]:after {\n  bottom: -2px;\n}\n.mu-tabs-header[tab-position=top] ~ .mu-tab-panel {\n  padding-top: 16px;\n  border-top: 0;\n}\n.mu-tabs-header[tab-position=top][tab-style=card] {\n  border-bottom: 1px solid rgba(0,0,0,.15);\n}\n.mu-tabs-header[tab-position=top][tab-style=card] > .mu-tab-item {\n  border-top-width: 1px;\n}\n.mu-tabs-header[tab-position=top][tab-style=card] > [active]:before {\n  top: -1px;\n}\n.mu-tabs-header[tab-position=top][tab-style=card] > [active]:after {\n  bottom: -1px;\n}\n.mu-tabs-header[tab-position=bottom] {\n  border-top: 2px solid rgba(0,0,0,.09);\n}\n.mu-tabs-header[tab-position=bottom] > [active]:after {\n  top: -2px;\n}\n.mu-tabs-header[tab-position=bottom] ~ .mu-tab-panel {\n  padding-bottom: 16px;\n  border-bottom: 0;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] {\n  border-top: 1px solid rgba(0,0,0,.15);\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > .mu-tab-item {\n  border-bottom-width: 1px;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > [active]:before {\n  bottom: -1px;\n}\n.mu-tabs-header[tab-position=bottom][tab-style=card] > [active]:after {\n  top: -1px;\n}\n.mu-tabs-header[tab-position=left] {\n  border-right: 2px solid rgba(0,0,0,.09);\n}\n.mu-tabs-header[tab-position=left] > :not(.mu-tab-item) {\n  align-self: flex-end;\n  margin-right: 16px;\n}\n.mu-tabs-header[tab-position=left] > .mu-tab-item {\n  margin-right: 0;\n  padding-right: 16px;\n}\n.mu-tabs-header[tab-position=left] .mu-tab-label {\n  text-align: right;\n}\n.mu-tabs-header[tab-position=left] > [active]:after {\n  right: -2px;\n}\n.mu-tabs-header[tab-position=left] ~ .mu-tab-panel {\n  padding-left: 16px;\n  border-left: 0;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] {\n  border-right: 1px solid rgba(0,0,0,.15);\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > .mu-tab-item {\n  border-left-width: 1px;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] .mu-tab-label {\n  text-align: left;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > [active]:before {\n  left: -1px;\n}\n.mu-tabs-header[tab-position=left][tab-style=card] > [active]:after {\n  right: -1px;\n}\n.mu-tabs-header[tab-position=right] {\n  border-left: 2px solid rgba(0,0,0,.09);\n}\n.mu-tabs-header[tab-position=right] > * {\n  margin-left: 16px;\n}\n.mu-tabs-header[tab-position=right] > :not(.mu-tab-item) {\n  align-self: flex-start;\n}\n.mu-tabs-header[tab-position=right] > .mu-tab-item {\n  margin-left: 0;\n  padding-left: 16px;\n}\n.mu-tabs-header[tab-position=right] > [active]:after {\n  left: -2px;\n}\n.mu-tabs-header[tab-position=right] ~ .mu-tab-panel {\n  padding-right: 16px;\n  border-right: 0;\n}\n.mu-tabs-header[tab-position=right][tab-style=card] {\n  border-left: 1px solid rgba(0,0,0,.15);\n}\n.mu-tabs-header[tab-position=right][tab-style=card] > .mu-tab-item {\n  border-right-width: 1px;\n}\n.mu-tabs-header[tab-position=right][tab-style=card] > [active]:before {\n  right: -1px;\n}\n.mu-tabs-header[tab-position=right][tab-style=card] > [active]:after {\n  left: -1px;\n}\n.mu-tab-item {\n  display: -webkit-box;\n  display: flex;\n  -webkit-box-align: center;\n  align-items: center;\n  max-width: 150px;\n  cursor: pointer;\n}\n.mu-tab-item > .mu-tab-label {\n  display: inline-block;\n  width: 100%;\n  float: left;\n}\n.mu-tab-item:hover {\n  color: #1890ff;\n}\n.mu-tab-item[active] {\n  color: #1890ff;\n}\n.mu-tab-item[active]:after {\n  position: absolute;\n  content: '';\n  background-color: #1890ff;\n}";
  styleInject(css$f);

  var css$g = ".mu-dropdown {\n  position: relative;\n  display: inline-block;\n  vertical-align: top;\n}\n.mu-dropdown-panel {\n  position: absolute;\n  z-index: 110;\n  display: none;\n  overflow: auto;\n  background: #fff;\n  border: 1px solid rgba(0,0,0,.15);\n  border-radius: 0;\n  box-shadow: none;\n  -webkit-transition: opacity .2s ease-in-out;\n  transition: opacity .2s ease-in-out;\n}\n.mu-dropdown-panel[visible] {\n  display: block;\n}\n.mu-dropdown-panel[popup-style=dropdown-list],\n.mu-dropdown-panel[popup-style=dropdown-menu] {\n  padding: 4px 0;\n}\n.mu-dropdown-panel > .mu-list-item {\n  padding: 5px 16px;\n  cursor: pointer;\n}\n.mu-dropdown-panel > .mu-footer-button {\n  padding: 4px;\n  text-align: center;\n  cursor: pointer;\n}\n.mu-dropdown-panel > .mu-footer-button:hover {\n  background: rgba(0,0,0,.05);\n}\n[popup-style=dropdown-menu] > .mu-list-item:hover {\n  color: #fff;\n  fill: #fff;\n  background: #1890ff;\n}\nbody > .mu-dropdown-panel {\n  position: fixed;\n}";
  styleInject(css$g);

  var css$h = ".mu-expander {\n  color: rgba(0,0,0,.7);\n  fill: rgba(0,0,0,.7);\n}\n.mu-expander [expand-trigger] {\n  cursor: pointer;\n}\n.mu-expander > .mu-expander-header {\n  display: -webkit-box;\n  display: flex;\n  -webkit-box-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  justify-content: center;\n  height: 40px;\n  text-align: center;\n  font-size: 1rem;\n}\n.mu-expander > .mu-expander-header:hover {\n  background: rgba(0,0,0,.05);\n}\n.mu-expander > .mu-expand-panel {\n  position: relative;\n  visibility: hidden;\n  max-height: 0;\n  overflow: hidden;\n  -webkit-transition: all .2s ease-in-out;\n  transition: all .2s ease-in-out;\n}\n.mu-expander[expanded] > .mu-expand-panel {\n  visibility: visible;\n  max-height: 2000px;\n}";
  styleInject(css$h);

  var css$i = ".mu-modal-mask {\n  position: absolute;\n  z-index: 100;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  display: none;\n  background: rgba(0,0,0,.17);\n}\n.mu-modal-mask[visible] {\n  display: block;\n}\n.mu-modal-mask.mu-flex-box[visible] {\n  display: -webkit-box;\n  display: flex;\n}\nbody > .mu-modal-mask {\n  position: fixed;\n}";
  styleInject(css$i);

  var css$j = ".mu-dialog {\n  position: relative;\n  min-width: 200px;\n  min-height: 100px;\n  background: #fff;\n  opacity: 0;\n  box-shadow: 0 6px 12px rgba(0,0,0,.23),0 10px 40px rgba(0,0,0,.19);\n  -webkit-transition: all .2s ease-in-out;\n  transition: all .2s ease-in-out;\n}\n.mu-dialog[visible] {\n  opacity: 1;\n}\n.mu-dialog[danger] > .mu-dialog-header {\n  border-bottom-color: #f5222d;\n}\n.mu-dialog-header {\n  height: 50px;\n  padding: 0 16px;\n  background: #fff;\n  border-bottom: 2px solid #1890ff;\n}\n.mu-dialog-header > .mu-dialog-title {\n  font-size: 1rem;\n  font-weight: 600;\n}\n.mu-dialog-header > [trigger-type=close] {\n  margin-left: 16px;\n}\n.mu-dialog-footer {\n  margin-top: auto;\n  height: 50px;\n  background: 0 0;\n  padding: 0 16px;\n}\n.mu-dialog-footer > .mu-button {\n  margin-left: 8px;\n}\n.mu-dialog-body {\n  padding: 16px;\n}";
  styleInject(css$j);

  var css$k = ".mu-message-box > .mu-dialog {\n  min-width: 300px;\n}\n.mu-message-box > .mu-dialog > .mu-dialog-body > div {\n  padding: 16px;\n}\n.mu-message-box > .mu-dialog .mu-button {\n  min-width: 55px;\n}\n.mu-notifier {\n  position: fixed;\n  top: 0;\n  right: 0;\n  padding: 8px;\n  overflow: hidden;\n}\n.mu-notifier > div {\n  width: 300px;\n  font-size: 1rem;\n  line-height: 20px;\n  margin: 8px;\n  padding: 16px;\n  background: #fff;\n  border-left: 5px solid #1890ff;\n  border-radius: 4px;\n  box-shadow: 0 1.5px 4px rgba(0,0,0,.24),0 1.5px 6px rgba(0,0,0,.12);\n}\n.mu-notifier > [notify-type=success] {\n  border-color: #52c41a;\n  color: #52c41a;\n  fill: #52c41a;\n}\n.mu-notifier > [notify-type=warning] {\n  border-color: #faad14;\n  color: #faad14;\n  fill: #faad14;\n}\n.mu-notifier > [notify-type=error] {\n  border-color: #f5222d;\n  color: #f5222d;\n  fill: #f5222d;\n}\n.mu-notifier-enter,\n.mu-notifier-leave-to {\n  opacity: 0;\n  -webkit-transform: translateX(100px);\n  transform: translateX(100px);\n}\n.mu-notifier-enter-active,\n.mu-notifier-leave-active,\n.mu-notifier-move {\n  -webkit-transition: all .5s;\n  transition: all .5s;\n}";
  styleInject(css$k);

  var css$l = ".mu-menu-group_header,\n.mu-menu-item {\n  position: relative;\n  padding: 0 16px 0 32px;\n  height: 32px;\n  line-height: 32px;\n  font-size: 1rem;\n  color: rgba(0,0,0,.7);\n  fill: rgba(0,0,0,.7);\n  cursor: pointer;\n}\n.mu-menu-group_header > .mu-icon,\n.mu-menu-item > .mu-icon {\n  position: absolute;\n  left: 0;\n  display: inline-block;\n  width: 32px;\n  text-align: center;\n}\n.mu-menu-group_header > .mu-icon[trigger-type],\n.mu-menu-item > .mu-icon[trigger-type] {\n  left: auto;\n  right: 0;\n}\n.mu-menu-group_body .mu-menu-group_header {\n  font-size: .857rem;\n  font-weight: 600;\n  color: rgba(0,0,0,.5);\n  fill: rgba(0,0,0,.5);\n  background: 0 0;\n  cursor: default;\n}\n.mu-menu-group .mu-menu-item {\n  display: block;\n}\n.mu-menu-group .mu-menu-group + .mu-menu-item {\n  border-top: 1px solid rgba(0,0,0,.09);\n}\n.mu-sidebar .mu-menu-group_header,\n.mu-sidebar .mu-menu-item {\n  display: block;\n  height: 40px;\n  line-height: 40px;\n  padding-left: 40px;\n}\n.mu-sidebar .mu-menu-group_header > .mu-icon,\n.mu-sidebar .mu-menu-item > .mu-icon {\n  width: 40px;\n}\n.mu-sidebar_body-container > .mu-menu-group > .mu-menu-group_header {\n  padding-right: 40px;\n}\n.mu-sidebar_body-container > .mu-menu-group > .mu-menu-group_body {\n  position: relative;\n  visibility: hidden;\n  overflow: hidden;\n  max-height: 0;\n  -webkit-transition: all .1s ease-in-out;\n  transition: all .1s ease-in-out;\n}\n.mu-sidebar_body-container > .mu-menu-group[expanded] {\n  background: rgba(24,144,255,.05);\n}\n.mu-sidebar_body-container > .mu-menu-group[expanded] > .mu-menu-group_body {\n  visibility: visible;\n  max-height: 2000px;\n}\n.mu-sidebar_body-container > .mu-menu-group[expanded] > .mu-menu-group_header {\n  background: rgba(0,0,0,.04);\n}";
  styleInject(css$l);

  var css$m = ".mu-sidebar {\n  position: relative;\n  z-index: 90;\n  overflow: visible;\n}\n.mu-sidebar[floating] {\n  width: 40px;\n  overflow: visible;\n}\n.mu-sidebar[floating] .mu-sidebar_collapse-button {\n  fill: rgba(0,0,0,.7);\n}\n.mu-sidebar[collapsed] {\n  width: 40px;\n}\n.mu-sidebar[collapsed] > .mu-sidebar_container {\n  width: 40px;\n}\n.mu-sidebar[collapsed] .mu-sidebar_collapse-button {\n  border-right: 0;\n}\n.mu-sidebar[collapsed] .mu-sidebar_collapse-button > .mu-icon {\n  -webkit-transform: rotate3d(0,1,0,180deg);\n  transform: rotate3d(0,1,0,180deg);\n}\n.mu-sidebar_container {\n  overflow: hidden;\n  background: #fff;\n  -webkit-transition: width .1s ease-in-out;\n  transition: width .1s ease-in-out;\n}\n.mu-sidebar_body {\n  position: relative;\n}\n.mu-sidebar_body-container {\n  overflow: auto;\n}\n.mu-sidebar_footer,\n.mu-sidebar_header {\n  overflow: hidden;\n  height: 40px;\n}\n.mu-sidebar_header {\n  border-bottom: 1px solid rgba(0,0,0,.09);\n}\n.mu-sidebar_footer {\n  border-top: 1px solid rgba(0,0,0,.09);\n}\n.mu-sidebar_collapse-button {\n  width: 40px;\n  min-width: 40px;\n  line-height: 40px;\n  text-align: center;\n  border-right: 1px solid rgba(0,0,0,.09);\n  fill: #1890ff;\n}\n.mu-sidebar_collapse-button > .mu-icon {\n  -webkit-transition: -webkit-transform .2s ease-in-out;\n  transition: -webkit-transform .2s ease-in-out;\n  transition: transform .2s ease-in-out;\n  transition: transform .2s ease-in-out,-webkit-transform .2s ease-in-out;\n}";
  styleInject(css$m);

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var check = function (it) {
    return it && it.Math == Math && it;
  };

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global_1 =
    // eslint-disable-next-line no-undef
    check(typeof globalThis == 'object' && globalThis) ||
    check(typeof window == 'object' && window) ||
    check(typeof self == 'object' && self) ||
    check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
    // eslint-disable-next-line no-new-func
    Function('return this')();

  var fails = function (exec) {
    try {
      return !!exec();
    } catch (error) {
      return true;
    }
  };

  // Thank's IE8 for his funny defineProperty
  var descriptors = !fails(function () {
    return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
  });

  var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // Nashorn ~ JDK8 bug
  var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

  // `Object.prototype.propertyIsEnumerable` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
  var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
    var descriptor = getOwnPropertyDescriptor(this, V);
    return !!descriptor && descriptor.enumerable;
  } : nativePropertyIsEnumerable;

  var objectPropertyIsEnumerable = {
  	f: f
  };

  var createPropertyDescriptor = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

  var toString = {}.toString;

  var classofRaw = function (it) {
    return toString.call(it).slice(8, -1);
  };

  var split = ''.split;

  // fallback for non-array-like ES3 and non-enumerable old V8 strings
  var indexedObject = fails(function () {
    // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    // eslint-disable-next-line no-prototype-builtins
    return !Object('z').propertyIsEnumerable(0);
  }) ? function (it) {
    return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
  } : Object;

  // `RequireObjectCoercible` abstract operation
  // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
  var requireObjectCoercible = function (it) {
    if (it == undefined) throw TypeError("Can't call method on " + it);
    return it;
  };

  // toObject with fallback for non-array-like ES3 strings



  var toIndexedObject = function (it) {
    return indexedObject(requireObjectCoercible(it));
  };

  var isObject = function (it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };

  // `ToPrimitive` abstract operation
  // https://tc39.github.io/ecma262/#sec-toprimitive
  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  var toPrimitive = function (input, PREFERRED_STRING) {
    if (!isObject(input)) return input;
    var fn, val;
    if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
    if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

  var hasOwnProperty = {}.hasOwnProperty;

  var has = function (it, key) {
    return hasOwnProperty.call(it, key);
  };

  var document$1 = global_1.document;
  // typeof document.createElement is 'object' in old IE
  var EXISTS = isObject(document$1) && isObject(document$1.createElement);

  var documentCreateElement = function (it) {
    return EXISTS ? document$1.createElement(it) : {};
  };

  // Thank's IE8 for his funny defineProperty
  var ie8DomDefine = !descriptors && !fails(function () {
    return Object.defineProperty(documentCreateElement('div'), 'a', {
      get: function () { return 7; }
    }).a != 7;
  });

  var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
    O = toIndexedObject(O);
    P = toPrimitive(P, true);
    if (ie8DomDefine) try {
      return nativeGetOwnPropertyDescriptor(O, P);
    } catch (error) { /* empty */ }
    if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
  };

  var objectGetOwnPropertyDescriptor = {
  	f: f$1
  };

  var anObject = function (it) {
    if (!isObject(it)) {
      throw TypeError(String(it) + ' is not an object');
    } return it;
  };

  var nativeDefineProperty = Object.defineProperty;

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
    anObject(O);
    P = toPrimitive(P, true);
    anObject(Attributes);
    if (ie8DomDefine) try {
      return nativeDefineProperty(O, P, Attributes);
    } catch (error) { /* empty */ }
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

  var objectDefineProperty = {
  	f: f$2
  };

  var createNonEnumerableProperty = descriptors ? function (object, key, value) {
    return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

  var setGlobal = function (key, value) {
    try {
      createNonEnumerableProperty(global_1, key, value);
    } catch (error) {
      global_1[key] = value;
    } return value;
  };

  var SHARED = '__core-js_shared__';
  var store = global_1[SHARED] || setGlobal(SHARED, {});

  var sharedStore = store;

  var functionToString = Function.toString;

  // this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
  if (typeof sharedStore.inspectSource != 'function') {
    sharedStore.inspectSource = function (it) {
      return functionToString.call(it);
    };
  }

  var inspectSource = sharedStore.inspectSource;

  var WeakMap = global_1.WeakMap;

  var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

  var shared = createCommonjsModule(function (module) {
  (module.exports = function (key, value) {
    return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
  })('versions', []).push({
    version: '3.5.0',
    mode:  'global',
    copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
  });
  });

  var id = 0;
  var postfix = Math.random();

  var uid = function (key) {
    return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
  };

  var keys = shared('keys');

  var sharedKey = function (key) {
    return keys[key] || (keys[key] = uid(key));
  };

  var hiddenKeys = {};

  var WeakMap$1 = global_1.WeakMap;
  var set, get, has$1;

  var enforce = function (it) {
    return has$1(it) ? get(it) : set(it, {});
  };

  var getterFor = function (TYPE) {
    return function (it) {
      var state;
      if (!isObject(it) || (state = get(it)).type !== TYPE) {
        throw TypeError('Incompatible receiver, ' + TYPE + ' required');
      } return state;
    };
  };

  if (nativeWeakMap) {
    var store$1 = new WeakMap$1();
    var wmget = store$1.get;
    var wmhas = store$1.has;
    var wmset = store$1.set;
    set = function (it, metadata) {
      wmset.call(store$1, it, metadata);
      return metadata;
    };
    get = function (it) {
      return wmget.call(store$1, it) || {};
    };
    has$1 = function (it) {
      return wmhas.call(store$1, it);
    };
  } else {
    var STATE = sharedKey('state');
    hiddenKeys[STATE] = true;
    set = function (it, metadata) {
      createNonEnumerableProperty(it, STATE, metadata);
      return metadata;
    };
    get = function (it) {
      return has(it, STATE) ? it[STATE] : {};
    };
    has$1 = function (it) {
      return has(it, STATE);
    };
  }

  var internalState = {
    set: set,
    get: get,
    has: has$1,
    enforce: enforce,
    getterFor: getterFor
  };

  var redefine = createCommonjsModule(function (module) {
  var getInternalState = internalState.get;
  var enforceInternalState = internalState.enforce;
  var TEMPLATE = String(String).split('String');

  (module.exports = function (O, key, value, options) {
    var unsafe = options ? !!options.unsafe : false;
    var simple = options ? !!options.enumerable : false;
    var noTargetGet = options ? !!options.noTargetGet : false;
    if (typeof value == 'function') {
      if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
      enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
    if (O === global_1) {
      if (simple) O[key] = value;
      else setGlobal(key, value);
      return;
    } else if (!unsafe) {
      delete O[key];
    } else if (!noTargetGet && O[key]) {
      simple = true;
    }
    if (simple) O[key] = value;
    else createNonEnumerableProperty(O, key, value);
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, 'toString', function toString() {
    return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
  });
  });

  var path = global_1;

  var aFunction = function (variable) {
    return typeof variable == 'function' ? variable : undefined;
  };

  var getBuiltIn = function (namespace, method) {
    return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
      : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
  };

  var ceil = Math.ceil;
  var floor = Math.floor;

  // `ToInteger` abstract operation
  // https://tc39.github.io/ecma262/#sec-tointeger
  var toInteger = function (argument) {
    return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
  };

  var min = Math.min;

  // `ToLength` abstract operation
  // https://tc39.github.io/ecma262/#sec-tolength
  var toLength = function (argument) {
    return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
  };

  var max = Math.max;
  var min$1 = Math.min;

  // Helper for a popular repeating case of the spec:
  // Let integer be ? ToInteger(index).
  // If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
  var toAbsoluteIndex = function (index, length) {
    var integer = toInteger(index);
    return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
  };

  // `Array.prototype.{ indexOf, includes }` methods implementation
  var createMethod = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = toIndexedObject($this);
      var length = toLength(O.length);
      var index = toAbsoluteIndex(fromIndex, length);
      var value;
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare
        if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
      } else for (;length > index; index++) {
        if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
      } return !IS_INCLUDES && -1;
    };
  };

  var arrayIncludes = {
    // `Array.prototype.includes` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.includes
    includes: createMethod(true),
    // `Array.prototype.indexOf` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
    indexOf: createMethod(false)
  };

  var indexOf = arrayIncludes.indexOf;


  var objectKeysInternal = function (object, names) {
    var O = toIndexedObject(object);
    var i = 0;
    var result = [];
    var key;
    for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while (names.length > i) if (has(O, key = names[i++])) {
      ~indexOf(result, key) || result.push(key);
    }
    return result;
  };

  // IE8- don't enum bug keys
  var enumBugKeys = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ];

  var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    return objectKeysInternal(O, hiddenKeys$1);
  };

  var objectGetOwnPropertyNames = {
  	f: f$3
  };

  var f$4 = Object.getOwnPropertySymbols;

  var objectGetOwnPropertySymbols = {
  	f: f$4
  };

  // all object keys, includes non-enumerable and symbols
  var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
    var keys = objectGetOwnPropertyNames.f(anObject(it));
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
  };

  var copyConstructorProperties = function (target, source) {
    var keys = ownKeys(source);
    var defineProperty = objectDefineProperty.f;
    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  };

  var replacement = /#|\.prototype\./;

  var isForced = function (feature, detection) {
    var value = data[normalize(feature)];
    return value == POLYFILL ? true
      : value == NATIVE ? false
      : typeof detection == 'function' ? fails(detection)
      : !!detection;
  };

  var normalize = isForced.normalize = function (string) {
    return String(string).replace(replacement, '.').toLowerCase();
  };

  var data = isForced.data = {};
  var NATIVE = isForced.NATIVE = 'N';
  var POLYFILL = isForced.POLYFILL = 'P';

  var isForced_1 = isForced;

  var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






  /*
    options.target      - name of the target object
    options.global      - target is the global object
    options.stat        - export as static methods of target
    options.proto       - export as prototype methods of target
    options.real        - real prototype method for the `pure` version
    options.forced      - export even if the native feature is available
    options.bind        - bind methods to the target, required for the `pure` version
    options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
    options.unsafe      - use the simple assignment of property instead of delete + defineProperty
    options.sham        - add a flag to not completely full polyfills
    options.enumerable  - export as enumerable property
    options.noTargetGet - prevent calling a getter on target
  */
  var _export = function (options, source) {
    var TARGET = options.target;
    var GLOBAL = options.global;
    var STATIC = options.stat;
    var FORCED, target, key, targetProperty, sourceProperty, descriptor;
    if (GLOBAL) {
      target = global_1;
    } else if (STATIC) {
      target = global_1[TARGET] || setGlobal(TARGET, {});
    } else {
      target = (global_1[TARGET] || {}).prototype;
    }
    if (target) for (key in source) {
      sourceProperty = source[key];
      if (options.noTargetGet) {
        descriptor = getOwnPropertyDescriptor$1(target, key);
        targetProperty = descriptor && descriptor.value;
      } else targetProperty = target[key];
      FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
      // contained in target
      if (!FORCED && targetProperty !== undefined) {
        if (typeof sourceProperty === typeof targetProperty) continue;
        copyConstructorProperties(sourceProperty, targetProperty);
      }
      // add a flag to not completely full polyfills
      if (options.sham || (targetProperty && targetProperty.sham)) {
        createNonEnumerableProperty(sourceProperty, 'sham', true);
      }
      // extend global
      redefine(target, key, sourceProperty, options);
    }
  };

  var sloppyArrayMethod = function (METHOD_NAME, argument) {
    var method = [][METHOD_NAME];
    return !method || !fails(function () {
      // eslint-disable-next-line no-useless-call,no-throw-literal
      method.call(null, argument || function () { throw 1; }, 1);
    });
  };

  var $indexOf = arrayIncludes.indexOf;


  var nativeIndexOf = [].indexOf;

  var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
  var SLOPPY_METHOD = sloppyArrayMethod('indexOf');

  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  _export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || SLOPPY_METHOD }, {
    indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
      return NEGATIVE_ZERO
        // convert -0 to +0
        ? nativeIndexOf.apply(this, arguments) || 0
        : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var aPossiblePrototype = function (it) {
    if (!isObject(it) && it !== null) {
      throw TypeError("Can't set " + String(it) + ' as a prototype');
    } return it;
  };

  // `Object.setPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.setprototypeof
  // Works with __proto__ only. Old v8 can't work with null proto objects.
  /* eslint-disable no-proto */
  var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
    var CORRECT_SETTER = false;
    var test = {};
    var setter;
    try {
      setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
      setter.call(test, []);
      CORRECT_SETTER = test instanceof Array;
    } catch (error) { /* empty */ }
    return function setPrototypeOf(O, proto) {
      anObject(O);
      aPossiblePrototype(proto);
      if (CORRECT_SETTER) setter.call(O, proto);
      else O.__proto__ = proto;
      return O;
    };
  }() : undefined);

  // makes subclassing work correct for wrapped built-ins
  var inheritIfRequired = function ($this, dummy, Wrapper) {
    var NewTarget, NewTargetPrototype;
    if (
      // it can work only with native `setPrototypeOf`
      objectSetPrototypeOf &&
      // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
      typeof (NewTarget = dummy.constructor) == 'function' &&
      NewTarget !== Wrapper &&
      isObject(NewTargetPrototype = NewTarget.prototype) &&
      NewTargetPrototype !== Wrapper.prototype
    ) objectSetPrototypeOf($this, NewTargetPrototype);
    return $this;
  };

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  var objectKeys = Object.keys || function keys(O) {
    return objectKeysInternal(O, enumBugKeys);
  };

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
    anObject(O);
    var keys = objectKeys(Properties);
    var length = keys.length;
    var index = 0;
    var key;
    while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
    return O;
  };

  var html = getBuiltIn('document', 'documentElement');

  var IE_PROTO = sharedKey('IE_PROTO');

  var PROTOTYPE = 'prototype';
  var Empty = function () { /* empty */ };

  // Create object with fake `null` prototype: use iframe Object with cleared prototype
  var createDict = function () {
    // Thrash, waste and sodomy: IE GC bug
    var iframe = documentCreateElement('iframe');
    var length = enumBugKeys.length;
    var lt = '<';
    var script = 'script';
    var gt = '>';
    var js = 'java' + script + ':';
    var iframeDocument;
    iframe.style.display = 'none';
    html.appendChild(iframe);
    iframe.src = String(js);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
    iframeDocument.close();
    createDict = iframeDocument.F;
    while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];
    return createDict();
  };

  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  var objectCreate = Object.create || function create(O, Properties) {
    var result;
    if (O !== null) {
      Empty[PROTOTYPE] = anObject(O);
      result = new Empty();
      Empty[PROTOTYPE] = null;
      // add "__proto__" for Object.getPrototypeOf polyfill
      result[IE_PROTO] = O;
    } else result = createDict();
    return Properties === undefined ? result : objectDefineProperties(result, Properties);
  };

  hiddenKeys[IE_PROTO] = true;

  // a string of all valid unicode whitespaces
  // eslint-disable-next-line max-len
  var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

  var whitespace = '[' + whitespaces + ']';
  var ltrim = RegExp('^' + whitespace + whitespace + '*');
  var rtrim = RegExp(whitespace + whitespace + '*$');

  // `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
  var createMethod$1 = function (TYPE) {
    return function ($this) {
      var string = String(requireObjectCoercible($this));
      if (TYPE & 1) string = string.replace(ltrim, '');
      if (TYPE & 2) string = string.replace(rtrim, '');
      return string;
    };
  };

  var stringTrim = {
    // `String.prototype.{ trimLeft, trimStart }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
    start: createMethod$1(1),
    // `String.prototype.{ trimRight, trimEnd }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
    end: createMethod$1(2),
    // `String.prototype.trim` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.trim
    trim: createMethod$1(3)
  };

  var getOwnPropertyNames = objectGetOwnPropertyNames.f;
  var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;
  var defineProperty = objectDefineProperty.f;
  var trim = stringTrim.trim;

  var NUMBER = 'Number';
  var NativeNumber = global_1[NUMBER];
  var NumberPrototype = NativeNumber.prototype;

  // Opera ~12 has broken Object#toString
  var BROKEN_CLASSOF = classofRaw(objectCreate(NumberPrototype)) == NUMBER;

  // `ToNumber` abstract operation
  // https://tc39.github.io/ecma262/#sec-tonumber
  var toNumber = function (argument) {
    var it = toPrimitive(argument, false);
    var first, third, radix, maxCode, digits, length, index, code;
    if (typeof it == 'string' && it.length > 2) {
      it = trim(it);
      first = it.charCodeAt(0);
      if (first === 43 || first === 45) {
        third = it.charCodeAt(2);
        if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
      } else if (first === 48) {
        switch (it.charCodeAt(1)) {
          case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
          case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
          default: return +it;
        }
        digits = it.slice(2);
        length = digits.length;
        for (index = 0; index < length; index++) {
          code = digits.charCodeAt(index);
          // parseInt parses a string to a first unavailable symbol
          // but ToNumber should return NaN if a string contains unavailable symbols
          if (code < 48 || code > maxCode) return NaN;
        } return parseInt(digits, radix);
      }
    } return +it;
  };

  // `Number` constructor
  // https://tc39.github.io/ecma262/#sec-number-constructor
  if (isForced_1(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
    var NumberWrapper = function Number(value) {
      var it = arguments.length < 1 ? 0 : value;
      var dummy = this;
      return dummy instanceof NumberWrapper
        // check on 1..constructor(foo) case
        && (BROKEN_CLASSOF ? fails(function () { NumberPrototype.valueOf.call(dummy); }) : classofRaw(dummy) != NUMBER)
          ? inheritIfRequired(new NativeNumber(toNumber(it)), dummy, NumberWrapper) : toNumber(it);
    };
    for (var keys$1 = descriptors ? getOwnPropertyNames(NativeNumber) : (
      // ES3:
      'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
      // ES2015 (in case, if modules with ES2015 Number statics required before):
      'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
      'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
    ).split(','), j = 0, key; keys$1.length > j; j++) {
      if (has(NativeNumber, key = keys$1[j]) && !has(NumberWrapper, key)) {
        defineProperty(NumberWrapper, key, getOwnPropertyDescriptor$2(NativeNumber, key));
      }
    }
    NumberWrapper.prototype = NumberPrototype;
    NumberPrototype.constructor = NumberWrapper;
    redefine(global_1, NUMBER, NumberWrapper);
  }

  // `ToObject` abstract operation
  // https://tc39.github.io/ecma262/#sec-toobject
  var toObject = function (argument) {
    return Object(requireObjectCoercible(argument));
  };

  var nativeAssign = Object.assign;
  var defineProperty$1 = Object.defineProperty;

  // `Object.assign` method
  // https://tc39.github.io/ecma262/#sec-object.assign
  var objectAssign = !nativeAssign || fails(function () {
    // should have correct order of operations (Edge bug)
    if (descriptors && nativeAssign({ b: 1 }, nativeAssign(defineProperty$1({}, 'a', {
      enumerable: true,
      get: function () {
        defineProperty$1(this, 'b', {
          value: 3,
          enumerable: false
        });
      }
    }), { b: 2 })).b !== 1) return true;
    // should work with symbols and should have deterministic property order (V8 bug)
    var A = {};
    var B = {};
    // eslint-disable-next-line no-undef
    var symbol = Symbol();
    var alphabet = 'abcdefghijklmnopqrst';
    A[symbol] = 7;
    alphabet.split('').forEach(function (chr) { B[chr] = chr; });
    return nativeAssign({}, A)[symbol] != 7 || objectKeys(nativeAssign({}, B)).join('') != alphabet;
  }) ? function assign(target, source) { // eslint-disable-line no-unused-vars
    var T = toObject(target);
    var argumentsLength = arguments.length;
    var index = 1;
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    var propertyIsEnumerable = objectPropertyIsEnumerable.f;
    while (argumentsLength > index) {
      var S = indexedObject(arguments[index++]);
      var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
      var length = keys.length;
      var j = 0;
      var key;
      while (length > j) {
        key = keys[j++];
        if (!descriptors || propertyIsEnumerable.call(S, key)) T[key] = S[key];
      }
    } return T;
  } : nativeAssign;

  // `Object.assign` method
  // https://tc39.github.io/ecma262/#sec-object.assign
  _export({ target: 'Object', stat: true, forced: Object.assign !== objectAssign }, {
    assign: objectAssign
  });

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  _export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
    defineProperty: objectDefineProperty.f
  });

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  //
  //
  //
  //
  //
  //
  var script = {
    name: 'MusselFlexItem',
    inject: {
      parentLayout: {
        "default": 'row'
      }
    },
    props: {
      size: {
        type: [Number, String],
        validator: function validator(value) {
          return value === undefined || /^([1-8]|auto|([1-9]\d*(px|%)))$/.test(value);
        }
      }
    },
    computed: {
      sizeValue: function sizeValue() {
        var _this$$el;

        return this.size || ((_this$$el = this.$el) === null || _this$$el === void 0 ? void 0 : _this$$el.getAttribute('size'));
      },
      sizeUnit: function sizeUnit() {
        var s = String(this.sizeValue);
        return s.indexOf('%') > -1 ? '%' : s.indexOf('px') > -1 ? 'px' : null;
      }
    },
    watch: {
      size: function size() {
        this.setItemAttributes();
      },
      parentLayout: function parentLayout() {
        this.setItemAttributes();
      }
    },
    mounted: function mounted() {
      var _Object = Object(this.$el.style),
          width = _Object.width,
          height = _Object.height;

      this.flexItemOriginStyles = {
        width: width,
        height: height
      };
      this.setItemAttributes();
    },
    methods: {
      setItemAttributes: function setItemAttributes() {
        var $el = this.$el,
            sizeValue = this.sizeValue,
            sizeUnit = this.sizeUnit;
        if (!$el) return;
        if (!sizeValue || sizeUnit) $el.removeAttribute('size');else if (sizeValue) $el.setAttribute('size', sizeValue);
        Object.assign($el.style, this.flexItemOriginStyles, sizeUnit ? _defineProperty({}, this.parentLayout === 'column' ? 'height' : 'width', sizeValue) : undefined);
      }
    }
  };

  function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
  /* server only */
  , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
      createInjectorSSR = createInjector;
      createInjector = shadowMode;
      shadowMode = false;
    } // Vue.extend constructor export interop.


    var options = typeof script === 'function' ? script.options : script; // render functions

    if (template && template.render) {
      options.render = template.render;
      options.staticRenderFns = template.staticRenderFns;
      options._compiled = true; // functional template

      if (isFunctionalTemplate) {
        options.functional = true;
      }
    } // scopedId


    if (scopeId) {
      options._scopeId = scopeId;
    }

    var hook;

    if (moduleIdentifier) {
      // server build
      hook = function hook(context) {
        // 2.3 injection
        context = context || // cached call
        this.$vnode && this.$vnode.ssrContext || // stateful
        this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
        // 2.2 with runInNewContext: true

        if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
          context = __VUE_SSR_CONTEXT__;
        } // inject component styles


        if (style) {
          style.call(this, createInjectorSSR(context));
        } // register component module identifier for async chunk inference


        if (context && context._registeredComponents) {
          context._registeredComponents.add(moduleIdentifier);
        }
      }; // used by ssr in case component is cached and beforeCreate
      // never gets called


      options._ssrRegister = hook;
    } else if (style) {
      hook = shadowMode ? function () {
        style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
      } : function (context) {
        style.call(this, createInjector(context));
      };
    }

    if (hook) {
      if (options.functional) {
        // register for functional component in vue file
        var originalRender = options.render;

        options.render = function renderWithStyleInjection(h, context) {
          hook.call(context);
          return originalRender(h, context);
        };
      } else {
        // inject component registration as beforeCreate hook
        var existing = options.beforeCreate;
        options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
      }
    }

    return script;
  }

  var normalizeComponent_1 = normalizeComponent;

  /* script */
  var __vue_script__ = script;
  /* template */

  var __vue_render__ = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__ = [];
  __vue_render__._withStripped = true;
  /* style */

  var __vue_inject_styles__ = undefined;
  /* scoped */

  var __vue_scope_id__ = undefined;
  /* module identifier */

  var __vue_module_identifier__ = undefined;
  /* functional template */

  var __vue_is_functional_template__ = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__ = normalizeComponent_1({
    render: __vue_render__,
    staticRenderFns: __vue_staticRenderFns__
  }, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, undefined, undefined);

  var script$1 = {
    name: 'MusselFlexBox',
    "extends": __vue_component__,
    provide: function provide() {
      return {
        parentLayout: this.flexLayout
      };
    },
    props: {
      flexWrap: Boolean,
      layout: {
        type: String,
        validator: function validator(value) {
          return ['flow', 'column', 'row'].indexOf(value) !== -1;
        }
      },
      direction: {
        type: String,
        "default": 'row',
        validator: function validator(value) {
          return ['row', 'column'].indexOf(value) !== -1;
        }
      }
    },
    computed: {
      flexLayout: function flexLayout() {
        var _this$$el, _this$$el2;

        var v = this.layout || ((_this$$el = this.$el) === null || _this$$el === void 0 ? void 0 : _this$$el.getAttribute('layout')) || this.direction || ((_this$$el2 = this.$el) === null || _this$$el2 === void 0 ? void 0 : _this$$el2.getAttribute('direction')) || 'row';
        return ['flow', 'column', 'row'].indexOf(v) !== -1 ? v : 'row';
      },
      flexDirection: function flexDirection() {
        return this.flexLayout === 'column' ? 'column' : 'row';
      }
    },
    watch: {
      layout: function layout(v) {
        this.setBoxAttributes();
      }
    },
    mounted: function mounted() {
      this.setBoxAttributes();
    },
    methods: {
      setBoxAttributes: function setBoxAttributes() {
        var $el = this.$el,
            flexLayout = this.flexLayout,
            flexDirection = this.flexDirection,
            flexWrap = this.flexWrap;

        if ($el) {
          $el.setAttribute('direction', flexDirection);

          if (flexLayout === 'flow' || flexWrap) {
            $el.setAttribute('flex-wrap', '');
          }
        }
      }
    }
  };

  /* script */
  var __vue_script__$1 = script$1;
  /* template */

  var __vue_render__$1 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-flex-box"
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$1 = [];
  __vue_render__$1._withStripped = true;
  /* style */

  var __vue_inject_styles__$1 = undefined;
  /* scoped */

  var __vue_scope_id__$1 = undefined;
  /* module identifier */

  var __vue_module_identifier__$1 = undefined;
  /* functional template */

  var __vue_is_functional_template__$1 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$1 = normalizeComponent_1({
    render: __vue_render__$1,
    staticRenderFns: __vue_staticRenderFns__$1
  }, __vue_inject_styles__$1, __vue_script__$1, __vue_scope_id__$1, __vue_is_functional_template__$1, __vue_module_identifier__$1, false, undefined, undefined, undefined);

  var HBox = {
    name: 'MusselHBox',
    "extends": __vue_component__$1,
    props: ['layout', 'direction'],
    computed: {
      flexLayout: function flexLayout() {
        return 'row';
      }
    }
  };

  var VBox = {
    name: 'MusselVBox',
    "extends": __vue_component__$1,
    props: ['layout', 'direction'],
    computed: {
      flexLayout: function flexLayout() {
        return 'column';
      }
    }
  };

  //
  var script$2 = {
    name: 'MusselSpace',
    "extends": __vue_component__,
    computed: {
      flexStyle: function flexStyle() {
        return this.size ? 'none' : undefined;
      }
    }
  };

  /* script */
  var __vue_script__$2 = script$2;
  /* template */

  var __vue_render__$2 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-space",
      style: {
        flex: _vm.flexStyle
      }
    });
  };

  var __vue_staticRenderFns__$2 = [];
  __vue_render__$2._withStripped = true;
  /* style */

  var __vue_inject_styles__$2 = undefined;
  /* scoped */

  var __vue_scope_id__$2 = undefined;
  /* module identifier */

  var __vue_module_identifier__$2 = undefined;
  /* functional template */

  var __vue_is_functional_template__$2 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$2 = normalizeComponent_1({
    render: __vue_render__$2,
    staticRenderFns: __vue_staticRenderFns__$2
  }, __vue_inject_styles__$2, __vue_script__$2, __vue_scope_id__$2, __vue_is_functional_template__$2, __vue_module_identifier__$2, false, undefined, undefined, undefined);

  var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
    // Chrome 38 Symbol has incorrect toString conversion
    // eslint-disable-next-line no-undef
    return !String(Symbol());
  });

  var useSymbolAsUid = nativeSymbol
    // eslint-disable-next-line no-undef
    && !Symbol.sham
    // eslint-disable-next-line no-undef
    && typeof Symbol() == 'symbol';

  // `IsArray` abstract operation
  // https://tc39.github.io/ecma262/#sec-isarray
  var isArray = Array.isArray || function isArray(arg) {
    return classofRaw(arg) == 'Array';
  };

  var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f;

  var toString$1 = {}.toString;

  var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
    ? Object.getOwnPropertyNames(window) : [];

  var getWindowNames = function (it) {
    try {
      return nativeGetOwnPropertyNames(it);
    } catch (error) {
      return windowNames.slice();
    }
  };

  // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
  var f$5 = function getOwnPropertyNames(it) {
    return windowNames && toString$1.call(it) == '[object Window]'
      ? getWindowNames(it)
      : nativeGetOwnPropertyNames(toIndexedObject(it));
  };

  var objectGetOwnPropertyNamesExternal = {
  	f: f$5
  };

  var WellKnownSymbolsStore = shared('wks');
  var Symbol$1 = global_1.Symbol;
  var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : uid;

  var wellKnownSymbol = function (name) {
    if (!has(WellKnownSymbolsStore, name)) {
      if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
      else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    } return WellKnownSymbolsStore[name];
  };

  var f$6 = wellKnownSymbol;

  var wrappedWellKnownSymbol = {
  	f: f$6
  };

  var defineProperty$2 = objectDefineProperty.f;

  var defineWellKnownSymbol = function (NAME) {
    var Symbol = path.Symbol || (path.Symbol = {});
    if (!has(Symbol, NAME)) defineProperty$2(Symbol, NAME, {
      value: wrappedWellKnownSymbol.f(NAME)
    });
  };

  var defineProperty$3 = objectDefineProperty.f;



  var TO_STRING_TAG = wellKnownSymbol('toStringTag');

  var setToStringTag = function (it, TAG, STATIC) {
    if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
      defineProperty$3(it, TO_STRING_TAG, { configurable: true, value: TAG });
    }
  };

  var aFunction$1 = function (it) {
    if (typeof it != 'function') {
      throw TypeError(String(it) + ' is not a function');
    } return it;
  };

  // optional / simple context binding
  var bindContext = function (fn, that, length) {
    aFunction$1(fn);
    if (that === undefined) return fn;
    switch (length) {
      case 0: return function () {
        return fn.call(that);
      };
      case 1: return function (a) {
        return fn.call(that, a);
      };
      case 2: return function (a, b) {
        return fn.call(that, a, b);
      };
      case 3: return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
    }
    return function (/* ...args */) {
      return fn.apply(that, arguments);
    };
  };

  var SPECIES = wellKnownSymbol('species');

  // `ArraySpeciesCreate` abstract operation
  // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
  var arraySpeciesCreate = function (originalArray, length) {
    var C;
    if (isArray(originalArray)) {
      C = originalArray.constructor;
      // cross-realm fallback
      if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
      else if (isObject(C)) {
        C = C[SPECIES];
        if (C === null) C = undefined;
      }
    } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
  };

  var push = [].push;

  // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
  var createMethod$2 = function (TYPE) {
    var IS_MAP = TYPE == 1;
    var IS_FILTER = TYPE == 2;
    var IS_SOME = TYPE == 3;
    var IS_EVERY = TYPE == 4;
    var IS_FIND_INDEX = TYPE == 6;
    var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
    return function ($this, callbackfn, that, specificCreate) {
      var O = toObject($this);
      var self = indexedObject(O);
      var boundFunction = bindContext(callbackfn, that, 3);
      var length = toLength(self.length);
      var index = 0;
      var create = specificCreate || arraySpeciesCreate;
      var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
      var value, result;
      for (;length > index; index++) if (NO_HOLES || index in self) {
        value = self[index];
        result = boundFunction(value, index, O);
        if (TYPE) {
          if (IS_MAP) target[index] = result; // map
          else if (result) switch (TYPE) {
            case 3: return true;              // some
            case 5: return value;             // find
            case 6: return index;             // findIndex
            case 2: push.call(target, value); // filter
          } else if (IS_EVERY) return false;  // every
        }
      }
      return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
    };
  };

  var arrayIteration = {
    // `Array.prototype.forEach` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
    forEach: createMethod$2(0),
    // `Array.prototype.map` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.map
    map: createMethod$2(1),
    // `Array.prototype.filter` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.filter
    filter: createMethod$2(2),
    // `Array.prototype.some` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.some
    some: createMethod$2(3),
    // `Array.prototype.every` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.every
    every: createMethod$2(4),
    // `Array.prototype.find` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    find: createMethod$2(5),
    // `Array.prototype.findIndex` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
    findIndex: createMethod$2(6)
  };

  var $forEach = arrayIteration.forEach;

  var HIDDEN = sharedKey('hidden');
  var SYMBOL = 'Symbol';
  var PROTOTYPE$1 = 'prototype';
  var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
  var setInternalState = internalState.set;
  var getInternalState = internalState.getterFor(SYMBOL);
  var ObjectPrototype = Object[PROTOTYPE$1];
  var $Symbol = global_1.Symbol;
  var $stringify = getBuiltIn('JSON', 'stringify');
  var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
  var nativeDefineProperty$1 = objectDefineProperty.f;
  var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;
  var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f;
  var AllSymbols = shared('symbols');
  var ObjectPrototypeSymbols = shared('op-symbols');
  var StringToSymbolRegistry = shared('string-to-symbol-registry');
  var SymbolToStringRegistry = shared('symbol-to-string-registry');
  var WellKnownSymbolsStore$1 = shared('wks');
  var QObject = global_1.QObject;
  // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
  var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

  // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
  var setSymbolDescriptor = descriptors && fails(function () {
    return objectCreate(nativeDefineProperty$1({}, 'a', {
      get: function () { return nativeDefineProperty$1(this, 'a', { value: 7 }).a; }
    })).a != 7;
  }) ? function (O, P, Attributes) {
    var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(ObjectPrototype, P);
    if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
    nativeDefineProperty$1(O, P, Attributes);
    if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
      nativeDefineProperty$1(ObjectPrototype, P, ObjectPrototypeDescriptor);
    }
  } : nativeDefineProperty$1;

  var wrap = function (tag, description) {
    var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
    setInternalState(symbol, {
      type: SYMBOL,
      tag: tag,
      description: description
    });
    if (!descriptors) symbol.description = description;
    return symbol;
  };

  var isSymbol = nativeSymbol && typeof $Symbol.iterator == 'symbol' ? function (it) {
    return typeof it == 'symbol';
  } : function (it) {
    return Object(it) instanceof $Symbol;
  };

  var $defineProperty = function defineProperty(O, P, Attributes) {
    if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
    anObject(O);
    var key = toPrimitive(P, true);
    anObject(Attributes);
    if (has(AllSymbols, key)) {
      if (!Attributes.enumerable) {
        if (!has(O, HIDDEN)) nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}));
        O[HIDDEN][key] = true;
      } else {
        if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
        Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
      } return setSymbolDescriptor(O, key, Attributes);
    } return nativeDefineProperty$1(O, key, Attributes);
  };

  var $defineProperties = function defineProperties(O, Properties) {
    anObject(O);
    var properties = toIndexedObject(Properties);
    var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
    $forEach(keys, function (key) {
      if (!descriptors || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
    });
    return O;
  };

  var $create = function create(O, Properties) {
    return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
  };

  var $propertyIsEnumerable = function propertyIsEnumerable(V) {
    var P = toPrimitive(V, true);
    var enumerable = nativePropertyIsEnumerable$1.call(this, P);
    if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
    return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
  };

  var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
    var it = toIndexedObject(O);
    var key = toPrimitive(P, true);
    if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
    var descriptor = nativeGetOwnPropertyDescriptor$1(it, key);
    if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
      descriptor.enumerable = true;
    }
    return descriptor;
  };

  var $getOwnPropertyNames = function getOwnPropertyNames(O) {
    var names = nativeGetOwnPropertyNames$1(toIndexedObject(O));
    var result = [];
    $forEach(names, function (key) {
      if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
    });
    return result;
  };

  var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
    var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
    var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
    var result = [];
    $forEach(names, function (key) {
      if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
        result.push(AllSymbols[key]);
      }
    });
    return result;
  };

  // `Symbol` constructor
  // https://tc39.github.io/ecma262/#sec-symbol-constructor
  if (!nativeSymbol) {
    $Symbol = function Symbol() {
      if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
      var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
      var tag = uid(description);
      var setter = function (value) {
        if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
        if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
        setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
      };
      if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
      return wrap(tag, description);
    };

    redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
      return getInternalState(this).tag;
    });

    objectPropertyIsEnumerable.f = $propertyIsEnumerable;
    objectDefineProperty.f = $defineProperty;
    objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor;
    objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
    objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

    if (descriptors) {
      // https://github.com/tc39/proposal-Symbol-description
      nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
        configurable: true,
        get: function description() {
          return getInternalState(this).description;
        }
      });
      {
        redefine(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
      }
    }
  }

  if (!useSymbolAsUid) {
    wrappedWellKnownSymbol.f = function (name) {
      return wrap(wellKnownSymbol(name), name);
    };
  }

  _export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
    Symbol: $Symbol
  });

  $forEach(objectKeys(WellKnownSymbolsStore$1), function (name) {
    defineWellKnownSymbol(name);
  });

  _export({ target: SYMBOL, stat: true, forced: !nativeSymbol }, {
    // `Symbol.for` method
    // https://tc39.github.io/ecma262/#sec-symbol.for
    'for': function (key) {
      var string = String(key);
      if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
      var symbol = $Symbol(string);
      StringToSymbolRegistry[string] = symbol;
      SymbolToStringRegistry[symbol] = string;
      return symbol;
    },
    // `Symbol.keyFor` method
    // https://tc39.github.io/ecma262/#sec-symbol.keyfor
    keyFor: function keyFor(sym) {
      if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
      if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
    },
    useSetter: function () { USE_SETTER = true; },
    useSimple: function () { USE_SETTER = false; }
  });

  _export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
    // `Object.create` method
    // https://tc39.github.io/ecma262/#sec-object.create
    create: $create,
    // `Object.defineProperty` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperty
    defineProperty: $defineProperty,
    // `Object.defineProperties` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperties
    defineProperties: $defineProperties,
    // `Object.getOwnPropertyDescriptor` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
    getOwnPropertyDescriptor: $getOwnPropertyDescriptor
  });

  _export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
    // `Object.getOwnPropertyNames` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
    getOwnPropertyNames: $getOwnPropertyNames,
    // `Object.getOwnPropertySymbols` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
    getOwnPropertySymbols: $getOwnPropertySymbols
  });

  // Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
  // https://bugs.chromium.org/p/v8/issues/detail?id=3443
  _export({ target: 'Object', stat: true, forced: fails(function () { objectGetOwnPropertySymbols.f(1); }) }, {
    getOwnPropertySymbols: function getOwnPropertySymbols(it) {
      return objectGetOwnPropertySymbols.f(toObject(it));
    }
  });

  // `JSON.stringify` method behavior with symbols
  // https://tc39.github.io/ecma262/#sec-json.stringify
  if ($stringify) {
    var FORCED_JSON_STRINGIFY = !nativeSymbol || fails(function () {
      var symbol = $Symbol();
      // MS Edge converts symbol values to JSON as {}
      return $stringify([symbol]) != '[null]'
        // WebKit converts symbol values to JSON as null
        || $stringify({ a: symbol }) != '{}'
        // V8 throws on boxed symbols
        || $stringify(Object(symbol)) != '{}';
    });

    _export({ target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY }, {
      // eslint-disable-next-line no-unused-vars
      stringify: function stringify(it, replacer, space) {
        var args = [it];
        var index = 1;
        var $replacer;
        while (arguments.length > index) args.push(arguments[index++]);
        $replacer = replacer;
        if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
        if (!isArray(replacer)) replacer = function (key, value) {
          if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
          if (!isSymbol(value)) return value;
        };
        args[1] = replacer;
        return $stringify.apply(null, args);
      }
    });
  }

  // `Symbol.prototype[@@toPrimitive]` method
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
  if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
    createNonEnumerableProperty($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
  }
  // `Symbol.prototype[@@toStringTag]` property
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
  setToStringTag($Symbol, SYMBOL);

  hiddenKeys[HIDDEN] = true;

  var userAgent = getBuiltIn('navigator', 'userAgent') || '';

  var process = global_1.process;
  var versions = process && process.versions;
  var v8 = versions && versions.v8;
  var match, version;

  if (v8) {
    match = v8.split('.');
    version = match[0] + match[1];
  } else if (userAgent) {
    match = userAgent.match(/Edge\/(\d+)/);
    if (!match || match[1] >= 74) {
      match = userAgent.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    }
  }

  var v8Version = version && +version;

  var SPECIES$1 = wellKnownSymbol('species');

  var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
    // We can't use this feature detection in V8 since it causes
    // deoptimization and serious performance degradation
    // https://github.com/zloirock/core-js/issues/677
    return v8Version >= 51 || !fails(function () {
      var array = [];
      var constructor = array.constructor = {};
      constructor[SPECIES$1] = function () {
        return { foo: 1 };
      };
      return array[METHOD_NAME](Boolean).foo !== 1;
    });
  };

  var $filter = arrayIteration.filter;



  var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');
  // Edge 14- issue
  var USES_TO_LENGTH = HAS_SPECIES_SUPPORT && !fails(function () {
    [].filter.call({ length: -1, 0: 1 }, function (it) { throw it; });
  });

  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH }, {
    filter: function filter(callbackfn /* , thisArg */) {
      return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var $forEach$1 = arrayIteration.forEach;


  // `Array.prototype.forEach` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  var arrayForEach = sloppyArrayMethod('forEach') ? function forEach(callbackfn /* , thisArg */) {
    return $forEach$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  } : [].forEach;

  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  _export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
    forEach: arrayForEach
  });

  var nativeReverse = [].reverse;
  var test = [1, 2];

  // `Array.prototype.reverse` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reverse
  // fix for Safari 12.0 bug
  // https://bugs.webkit.org/show_bug.cgi?id=188794
  _export({ target: 'Array', proto: true, forced: String(test) === String(test.reverse()) }, {
    reverse: function reverse() {
      // eslint-disable-next-line no-self-assign
      if (isArray(this)) this.length = this.length;
      return nativeReverse.call(this);
    }
  });

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  _export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
    defineProperties: objectDefineProperties
  });

  var nativeGetOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;


  var FAILS_ON_PRIMITIVES = fails(function () { nativeGetOwnPropertyDescriptor$2(1); });
  var FORCED = !descriptors || FAILS_ON_PRIMITIVES;

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  _export({ target: 'Object', stat: true, forced: FORCED, sham: !descriptors }, {
    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
      return nativeGetOwnPropertyDescriptor$2(toIndexedObject(it), key);
    }
  });

  var createProperty = function (object, key, value) {
    var propertyKey = toPrimitive(key);
    if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
    else object[propertyKey] = value;
  };

  // `Object.getOwnPropertyDescriptors` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
  _export({ target: 'Object', stat: true, sham: !descriptors }, {
    getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
      var O = toIndexedObject(object);
      var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
      var keys = ownKeys(O);
      var result = {};
      var index = 0;
      var key, descriptor;
      while (keys.length > index) {
        descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
        if (descriptor !== undefined) createProperty(result, key, descriptor);
      }
      return result;
    }
  });

  var FAILS_ON_PRIMITIVES$1 = fails(function () { objectKeys(1); });

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  _export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$1 }, {
    keys: function keys(it) {
      return objectKeys(toObject(it));
    }
  });

  // iterable DOM collections
  // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
  var domIterables = {
    CSSRuleList: 0,
    CSSStyleDeclaration: 0,
    CSSValueList: 0,
    ClientRectList: 0,
    DOMRectList: 0,
    DOMStringList: 0,
    DOMTokenList: 1,
    DataTransferItemList: 0,
    FileList: 0,
    HTMLAllCollection: 0,
    HTMLCollection: 0,
    HTMLFormElement: 0,
    HTMLSelectElement: 0,
    MediaList: 0,
    MimeTypeArray: 0,
    NamedNodeMap: 0,
    NodeList: 1,
    PaintRequestList: 0,
    Plugin: 0,
    PluginArray: 0,
    SVGLengthList: 0,
    SVGNumberList: 0,
    SVGPathSegList: 0,
    SVGPointList: 0,
    SVGStringList: 0,
    SVGTransformList: 0,
    SourceBufferList: 0,
    StyleSheetList: 0,
    TextTrackCueList: 0,
    TextTrackList: 0,
    TouchList: 0
  };

  for (var COLLECTION_NAME in domIterables) {
    var Collection = global_1[COLLECTION_NAME];
    var CollectionPrototype = Collection && Collection.prototype;
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
      createNonEnumerableProperty(CollectionPrototype, 'forEach', arrayForEach);
    } catch (error) {
      CollectionPrototype.forEach = arrayForEach;
    }
  }

  function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  //
  //
  //
  //
  function getOnlyResizableElement(prevEl, nextEl) {
    return prevEl && !prevEl.getAttribute('size') ? prevEl : nextEl && !nextEl.getAttribute('size') ? nextEl : null;
  }

  function getMaxSize(prevEl, nextEl) {
    var _Object = Object(prevEl),
        _Object$offsetWidth = _Object.offsetWidth,
        pw = _Object$offsetWidth === void 0 ? 0 : _Object$offsetWidth,
        _Object$offsetHeight = _Object.offsetHeight,
        ph = _Object$offsetHeight === void 0 ? 0 : _Object$offsetHeight;

    var _Object2 = Object(nextEl),
        _Object2$offsetWidth = _Object2.offsetWidth,
        nw = _Object2$offsetWidth === void 0 ? 0 : _Object2$offsetWidth,
        _Object2$offsetHeight = _Object2.offsetHeight,
        nh = _Object2$offsetHeight === void 0 ? 0 : _Object2$offsetHeight;

    return {
      maxWidth: pw + nw,
      maxHeight: ph + nh
    };
  }

  function getInitialState(prevEl, nextEl) {
    var el = getOnlyResizableElement(prevEl, nextEl);
    return el ? _objectSpread({
      el: el,
      reverse: el === nextEl,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight
    }, getMaxSize(prevEl, nextEl)) : null;
  }

  function resizeElement(_ref) {
    var el = _ref.el,
        direction = _ref.direction,
        reverse = _ref.reverse,
        startWidth = _ref.startWidth,
        startHeight = _ref.startHeight,
        maxWidth = _ref.maxWidth,
        maxHeight = _ref.maxHeight,
        startX = _ref.startX,
        startY = _ref.startY,
        x = _ref.x,
        y = _ref.y;

    if (direction === 'row') {
      var w = startWidth + (reverse ? startX - x : x - startX);

      if (w >= 50 && w < maxWidth - 100) {
        el.style.width = w + 'px';
        return true;
      }
    } else {
      var h = startHeight + (reverse ? startY - y : y - startY);

      if (h >= 50 && h < maxHeight - 100) {
        el.style.height = h + 'px';
        return true;
      }
    }
  }

  var script$3 = {
    name: 'MusselSplitter',
    props: {
      draggable: {
        type: Boolean,
        "default": true
      }
    },
    computed: {
      parentDirection: function parentDirection() {
        return this.$parent.flexDirection || 'row';
      }
    },
    methods: {
      onDragStart: function onDragStart(event) {
        if (!this.draggable) return;
        var state = getInitialState(this.$el.previousElementSibling, this.$el.nextElementSibling);
        if (!state) return;
        this.initialState = _objectSpread({
          direction: this.parentDirection,
          startX: event.pageX,
          startY: event.pageY
        }, state);
        window.addEventListener('mousemove', this.onDragMove);
        window.addEventListener('mouseup', this.onDragEnd);
        if (this.initialState.resized) this.$emit('resizestart');
      },
      onDragMove: function onDragMove(event) {
        if (!this.draggable) return;

        if (resizeElement(_objectSpread({}, this.initialState, {
          x: event.pageX,
          y: event.pageY
        }))) {
          this.initialState.resized = true;
          this.$emit('resize');
        }
      },
      onDragEnd: function onDragEnd(event) {
        if (!this.draggable) return;
        window.removeEventListener('mousemove', this.onDragMove);
        window.removeEventListener('mouseup', this.onDragEnd);
        if (this.initialState.resized) this.$emit('resizeend');
      }
    }
  };

  /* script */
  var __vue_script__$3 = script$3;
  /* template */

  var __vue_render__$3 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-splitter",
      attrs: {
        draggable: _vm.draggable
      },
      on: {
        mousedown: _vm.onDragStart
      }
    });
  };

  var __vue_staticRenderFns__$3 = [];
  __vue_render__$3._withStripped = true;
  /* style */

  var __vue_inject_styles__$3 = undefined;
  /* scoped */

  var __vue_scope_id__$3 = undefined;
  /* module identifier */

  var __vue_module_identifier__$3 = undefined;
  /* functional template */

  var __vue_is_functional_template__$3 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$3 = normalizeComponent_1({
    render: __vue_render__$3,
    staticRenderFns: __vue_staticRenderFns__$3
  }, __vue_inject_styles__$3, __vue_script__$3, __vue_scope_id__$3, __vue_is_functional_template__$3, __vue_module_identifier__$3, false, undefined, undefined, undefined);

  // `Array.isArray` method
  // https://tc39.github.io/ecma262/#sec-array.isarray
  _export({ target: 'Array', stat: true }, {
    isArray: isArray
  });

  var ok = 'M351.81165742 729.48242963L134.32922778 512 61.83508498 584.49414281 351.81165742 874.47071645 973.19002778 253.09234608 900.69588498 180.59820206Z';
  var close = 'M951.90520135 160.07583979L863.92416021 72.09479865 512 424.01896032 160.07583979 72.09479865 72.09479865 160.07583979 424.01896032 512 72.09479865 863.92416021 160.07583979 951.90520135 512 599.98103968 863.92416021 951.90520135 951.90520135 863.92416021 599.98103968 512Z';
  var clear = 'M442.333867 521.3184L310.6816 652.970667a55.842133 55.842133 0 0 0 78.984533 78.984533l131.652267-131.652267 131.652267 131.652267a55.842133 55.842133 0 1 0 78.984533-78.984533l-131.652267-131.652267 131.652267-131.652267a55.842133 55.842133 0 1 0-78.984533-78.984533l-131.652267 131.652267-131.652267-131.652267a55.842133 55.842133 0 1 0-78.984533 78.984533l131.652267 131.652267zM512 1024C229.239467 1024 0 794.760533 0 512 0 229.239467 229.239467 0 512 0c282.760533 0 512 229.239467 512 512 0 282.760533-229.239467 512-512 512z';
  var search = 'M1021.184 925.696l-91.904 91.584-202.752-201.92c-75.904 56.64-169.216 91.392-271.424 91.392C203.712 906.688 0 703.744 0 453.376 0 202.944 203.712 0 455.168 0c251.328 0 455.04 202.944 455.04 453.376 0 101.76-34.88 194.752-91.712 270.336L1021.184 925.696 1021.184 925.696zM455.168 129.6c-179.584 0-325.056 144.96-325.056 323.84 0 178.816 145.472 323.84 325.056 323.84 179.456 0 325.056-145.024 325.056-323.84C780.224 274.496 634.624 129.6 455.168 129.6L455.168 129.6z';
  var expand = 'M1023.13426849 891.55864801l-848.70963949 0c-15.61966349 0-28.29362182-12.67395833-28.29362182-28.29362182l0-28.29362183c0-15.61966349 12.67395833-28.29362182 28.29362182-28.29362183L1023.13426849 806.67778253A28.29362182 28.29362182 0 0 1 1051.4278903 834.97140436L1051.4278903 863.26502619C1051.4278903 878.88468968 1038.75393199 891.55864801 1023.13426849 891.55864801z m-372.76784872-226.32422079l-396.06119792 0c-15.61966349 0-28.29362182-12.67395833-28.29362183-28.29362183l0-28.29362182c0-15.61966349 12.67395833-28.29362182 28.29362183-28.29362183l396.06119792 0a28.29362182 28.29362182 0 0 1 28.29362183 28.29362183l0 28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362183z m0-226.32422079l-396.06119792 0c-15.61966349 0-28.29362182-12.67395833-28.29362183-28.29362182l-1e-8-28.29362183c0-15.61966349 12.67395833-28.29362182 28.29362184-28.29362182l396.06119792 0a28.29362182 28.29362182 0 0 1 28.29362182 28.29362182l1e-8 28.29362183c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362182zM1023.13426849 212.58598565l-848.70963949 1e-8c-15.61966349 0-28.29362182-12.67395833-28.29362182-28.29362183l0-28.29362183c0-15.61966349 12.67395833-28.29362182 28.29362181-28.29362182L1023.13426849 127.70512018A28.29362182 28.29362182 0 0 1 1051.4278903 155.998742l0 28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362181 28.29362183z m-219.41790365 455.22283936l0-316.32912802a11.33725179 11.33725179 0 0 1 17.82275393-9.25793049L1045.95729502 500.37395359a11.31249797 11.31249797 0 0 1 1e-8 18.49110717l-224.41817627 158.1521871a11.33725179 11.33725179 0 0 1-17.82275392-9.23317667z';
  var collapse = 'M167.51156481 125.61099486h848.70963949c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362181v28.29362184c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362182H167.51156481A28.29362182 28.29362182 0 0 1 139.217943 182.19823851V153.90461667C139.217943 138.28495319 151.89190131 125.61099486 167.51156481 125.61099486z m372.76784871 226.32422079h396.06119793c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362182v28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362184h-396.06119793a28.29362182 28.29362182 0 0 1-28.29362182-28.29362184v-28.29362182c0-15.61966349 12.67395833-28.29362182 28.29362182-28.29362182z m0 226.32422078h396.06119793c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362183v28.29362182c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362183h-396.06119793a28.29362182 28.29362182 0 0 1-28.29362182-28.29362183v-28.29362182c0-15.61966349 12.67395833-28.29362182 28.29362182-28.29362183zM167.51156481 804.58365721h848.70963949c15.61966349 0 28.29362182 12.67395833 28.29362183 28.29362184v28.29362181c0 15.61966349-12.67395833 28.29362182-28.29362183 28.29362184H167.51156481A28.29362182 28.29362182 0 0 1 139.217943 861.17090086v-28.29362181c0-15.61966349 12.67395833-28.29362182 28.29362181-28.29362184z m219.41790365-455.22283936v316.32912802a11.33725179 11.33725179 0 0 1-17.82275392 9.2579305L144.68853828 516.79568928a11.31249797 11.31249797 0 0 1 0-18.49110718l224.41817626-158.1521871a11.33725179 11.33725179 0 0 1 17.82275392 9.23317668z';
  var ellipsis = 'M180.59820247 401.53273459c-60.75699579 0-110.46726541 49.71026963-110.46726541 110.46726541s49.71026963 110.46726541 110.46726541 110.46726541c60.75699579 0 110.46726541-49.71026963 110.46726541-110.46726541S241.35519825 401.53273459 180.59820247 401.53273459zM843.40179753 401.53273459c-60.75699579 0-110.46726541 49.71026963-110.46726541 110.46726541s49.71026963 110.46726541 110.46726541 110.46726541c60.75699579 0 110.46726541-49.71026963 110.46726541-110.46726541S904.15879331 401.53273459 843.40179753 401.53273459zM512 401.53273459c-60.75699579 0-110.46726541 49.71026963-110.46726541 110.46726541s49.71026963 110.46726541 110.46726541 110.46726541c60.75699579 0 110.46726541-49.71026963 110.46726541-110.46726541S572.75699579 401.53273459 512 401.53273459z';
  var calendar = 'M770.90765392 557.5111111l-258.90765392 0 0 258.90765392 258.90765392 0L770.90765392 557.5111111zM719.12612386-12.085728l0 103.56306132L304.87387614 91.47733332 304.87387614-12.085728 201.31081482-12.085728l0 103.56306132L149.52928355 91.47733332C92.5696 91.47733332 45.96622222 138.0807111 45.96622222 195.04039466l0 724.94143169c0 56.95968355 46.60337778 103.56306132 103.56306133 103.56306132l724.94143169 0c56.95968355 0 103.56306132-46.60337778 103.56306133-103.56306132L978.03377778 195.04039466c0-56.95968355-46.60337778-103.56306132-103.56306133-103.56306134l-51.78153127 0L822.68918518-12.085728 719.12612386-12.085728zM874.47071645 919.98182755L149.52928355 919.98182755 149.52928355 350.38498724l724.94143169 0L874.47071645 919.98182755z';
  var org = 'M890.424889 663.04h-37.660445V473.998222H549.376V360.277333h37.660444c41.585778 0 76.003556-33.792 76.003556-76.003555v-151.324445c0-41.642667-33.792-76.060444-76.003556-76.060444H435.768889c-41.642667 0-76.060444 33.792-76.060445 76.003555v151.381334c0 41.585778 33.792 76.003556 76.003556 76.003555h37.660444v113.720889H170.666667v189.724445h-37.717334c-41.528889 0-76.003556 33.792-76.003555 76.003555v151.324445C56.888889 932.750222 90.680889 967.111111 132.892444 967.111111h151.381334c41.585778 0 76.003556-33.792 76.003555-76.003555V738.986667c0-41.528889-33.792-76.003556-76.003555-76.003556h-37.660445V549.376h530.773334v113.664h-37.660445c-41.585778 0-76.003556 33.792-76.003555 76.003556v151.381333c0 41.585778 33.792 76.060444 76.003555 76.060444h151.324445c41.642667 0 76.060444-33.792 76.060444-76.060444v-151.324445a77.084444 77.084444 0 0 0-76.686222-76.060444zM435.655111 284.273778v-151.324445h151.381333v151.324445H435.768889z m-151.324444 454.769778v151.381333H132.835556v-151.324445h151.381333z m606.094222 151.381333h-151.324445v-151.324445h151.324445v151.324445z';
  var keyDown = 'M240.98697401 294.01126208L512 565.02428806 783.01302599 294.01126208 865.4952507 376.49348677 512 729.98873747 158.5047493 376.49348677Z';
  var keyLeft = 'M733.64730918 774.88842085L462.6342832 503.87539624 733.64730918 232.86237024 651.1650831 150.38014552 297.6698324 503.87539624 651.1650831 857.37064693Z';
  var keyRight = 'M290.35269082 765.33826345L561.3657168 500.21682544 290.35269082 229.20379943 372.8349169 146.72157474 726.3301676 500.21682544 372.8349169 853.71207613Z';
  var keyUp = 'M240.98697401 733.64730918L512 462.6342832 783.01302599 733.64730918 865.4952507 651.1650831 512 297.6698324 158.5047493 651.1650831Z';
  var expandAll = 'M852.13671875 174.5h-685.546875c-30.32226563 0-55.37109375 25.04882813-55.37109374 55.37109375s25.04882813 55.37109375 55.37109374 55.37109375h685.546875c30.32226563 0 55.37109375-25.04882813 55.37109375-55.37109375s-23.73046875-55.37109375-55.37109375-55.37109375zM372.25390625 448.71874999H166.58984375c-30.32226563 0-55.37109375 25.04882813-55.37109376 55.37109376s25.04882813 55.37109375 55.37109376 55.37109375h205.6640625c30.32226563 0 55.37109375-25.04882813 55.37109375-55.37109375s-23.73046875-55.37109375-55.37109375-55.37109376zM372.25390625 722.9375H166.58984375c-30.32226563 0-55.37109375 25.04882813-55.37109376 55.37109375s25.04882813 55.37109375 55.37109376 55.37109375h206.98242188c14.50195313 0 27.68554688-5.2734375 38.23242187-15.8203125 10.546875-10.546875 15.8203125-23.73046875 15.8203125-39.55078125 0-30.32226563-23.73046875-55.37109375-55.37109375-55.37109375zM715.02734375 846.86328125l205.6640625-342.7734375H509.36328125z';
  var collapseAll = 'M857.41015625 174.49999999h-685.54687502C141.54101562 174.49999999 116.49218751 199.54882812 116.49218751 229.87109375s25.04882814 55.37109375 55.37109372 55.37109374h685.54687502c30.32226563 0 55.37109375-25.04882814 55.37109378-55.37109374s-25.04882814-55.37109375-55.37109378-55.37109376zM376.20898437 448.71874998H170.54492187c-30.32226563 0-55.37109375 25.04882814-55.37109374 55.37109377s25.04882814 55.37109375 55.37109375 55.37109376h205.66406249c30.32226563 0 55.37109375-25.04882814 55.37109376-55.37109376s-23.73046875-55.37109375-55.37109375-55.37109377zM376.20898437 722.9375H170.54492187c-30.32226563 0-55.37109375 25.04882814-55.37109374 55.37109376s25.04882814 55.37109375 55.37109375 55.37109374h206.98242186c14.50195313 0 27.68554688-5.2734375 38.2324219-15.8203125 10.54687499-10.54687499 15.8203125-23.73046875 15.82031249-39.55078124 0-30.32226563-23.73046875-55.37109375-55.37109375-55.37109376zM720.30078125 494.86132812l-206.98242188 342.77343751h412.64648438z';
  var data$1 = {
    ok: ok,
    org: org,
    close: close,
    clear: clear,
    search: search,
    expand: expand,
    collapse: collapse,
    ellipsis: ellipsis,
    calendar: calendar,
    'key-down': keyDown,
    'key-left': keyLeft,
    'key-right': keyRight,
    'key-up': keyUp,
    'expand-all': expandAll,
    'collapse-all': collapseAll
  };

  var triggerIcons = {
    close: 'close',
    clear: 'clear',
    dropdown: 'key-down',
    expander: 'key-down'
  };
  var script$4 = {
    name: 'MusselIcon',
    props: {
      icon: String,
      svgData: String,
      iconClass: String,
      triggerType: String,
      size: {
        type: String,
        "default": '1em'
      },
      viewBox: {
        type: String,
        "default": '0 0 1024 1024'
      }
    },
    computed: {
      className: function className() {
        return undefined;
      },
      iconName: function iconName() {
        var icon = this.icon,
            iconClass = this.iconClass,
            triggerType = this.triggerType;
        return icon || (iconClass || !triggerType ? undefined : triggerIcons[triggerType]);
      },
      paths: function paths() {
        var data = this.svgData || (this.iconName ? data$1[this.iconName] : null);
        return data ? Array.isArray(data) ? data : [data] : null;
      }
    },
    methods: {
      onClick: function onClick() {
        this.$emit('click');
      }
    }
  };

  /* script */
  var __vue_script__$4 = script$4;
  /* template */

  var __vue_render__$4 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("span", {
      staticClass: "mu-icon",
      "class": [_vm.className, _vm.iconClass],
      attrs: {
        icon: _vm.icon,
        "trigger-type": _vm.triggerType
      },
      on: {
        click: _vm.onClick
      }
    }, [_vm.paths ? _c("svg", {
      attrs: {
        viewBox: _vm.viewBox,
        width: _vm.size,
        height: _vm.size
      }
    }, _vm._l(_vm.paths, function (d) {
      return _c("path", {
        key: d,
        attrs: {
          d: d
        }
      });
    }), 0) : _vm._e()]);
  };

  var __vue_staticRenderFns__$4 = [];
  __vue_render__$4._withStripped = true;
  /* style */

  var __vue_inject_styles__$4 = undefined;
  /* scoped */

  var __vue_scope_id__$4 = undefined;
  /* module identifier */

  var __vue_module_identifier__$4 = undefined;
  /* functional template */

  var __vue_is_functional_template__$4 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$4 = normalizeComponent_1({
    render: __vue_render__$4,
    staticRenderFns: __vue_staticRenderFns__$4
  }, __vue_inject_styles__$4, __vue_script__$4, __vue_scope_id__$4, __vue_is_functional_template__$4, __vue_module_identifier__$4, false, undefined, undefined, undefined);

  function register(icons) {
    Object.assign(data$1, icons);
  }

  var Button = {
    name: 'MusselButton',
    components: {
      Icon: __vue_component__$4
    },
    props: {
      buttonType: {
        type: String,
        validator: function validator(value) {
          return ['normal', 'primary', 'submit', 'danger'].indexOf(value) !== -1;
        }
      },
      buttonStyle: {
        type: String,
        validator: function validator(value) {
          return ['normal', 'outline', 'text', 'link'].indexOf(value) !== -1;
        }
      },
      buttonShape: {
        type: String,
        validator: function validator(value) {
          return ['normal', 'round'].indexOf(value) !== -1;
        }
      },
      icon: String,
      iconClass: String,
      triggerType: String,
      iconOnly: Boolean,
      caption: String,
      stopPropagation: Boolean
    },
    computed: {
      isIconOnly: function isIconOnly() {
        return this.iconOnly || !this.$slots["default"] && !this.caption && (this.icon || this.iconClass || this.triggerType);
      }
    },
    methods: {
      onClick: function onClick(event) {
        if (this.stopPropagation) event.stopPropagation();
        this.$emit('click', event);
      }
    },
    render: function render(h) {
      return h("button", {
        "class": "mu-button mu-text-ellipsis",
        "attrs": {
          "icon-only": this.isIconOnly,
          "button-type": this.buttonType,
          "button-style": this.buttonStyle,
          "button-shape": this.buttonShape
        },
        "on": {
          "click": this.onClick
        }
      }, [this.icon || this.iconClass || this.triggerType ? h("icon", {
        "attrs": {
          "icon": this.icon,
          "icon-class": this.iconClass,
          "trigger-type": this.triggerType
        }
      }) : undefined, this.$slots["default"] ? this.icon || this.iconClass || this.triggerType ? h("span", [this.$slots["default"]]) : this.$slots["default"] : this.caption ? h("span", [this.caption]) : undefined]);
    }
  };

  var IconButton = {
    name: 'MusselIconButton',
    "extends": Button,
    computed: {
      isIconOnly: function isIconOnly() {
        return true;
      }
    }
  };

  var script$5 = {
    name: 'MusselCloseButton',
    "extends": __vue_component__$4,
    props: {
      triggerType: {
        type: String,
        "default": 'close'
      }
    }
  };

  /* script */
  var __vue_script__$5 = script$5;
  /* template */

  /* style */

  var __vue_inject_styles__$5 = undefined;
  /* scoped */

  var __vue_scope_id__$5 = undefined;
  /* module identifier */

  var __vue_module_identifier__$5 = undefined;
  /* functional template */

  var __vue_is_functional_template__$5 = undefined;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$5 = normalizeComponent_1({}, __vue_inject_styles__$5, __vue_script__$5, __vue_scope_id__$5, __vue_is_functional_template__$5, __vue_module_identifier__$5, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  var script$6 = {
    name: 'MusselButtonGroup'
  };

  /* script */
  var __vue_script__$6 = script$6;
  /* template */

  var __vue_render__$5 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-button-group"
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$5 = [];
  __vue_render__$5._withStripped = true;
  /* style */

  var __vue_inject_styles__$6 = undefined;
  /* scoped */

  var __vue_scope_id__$6 = undefined;
  /* module identifier */

  var __vue_module_identifier__$6 = undefined;
  /* functional template */

  var __vue_is_functional_template__$6 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$6 = normalizeComponent_1({
    render: __vue_render__$5,
    staticRenderFns: __vue_staticRenderFns__$5
  }, __vue_inject_styles__$6, __vue_script__$6, __vue_scope_id__$6, __vue_is_functional_template__$6, __vue_module_identifier__$6, false, undefined, undefined, undefined);

  //
  var script$7 = {
    name: 'MusselSplitButton',
    components: {
      'mu-button': Button
    },
    props: {
      disabled: Boolean,
      buttonType: String,
      buttonStyle: String,
      buttonShape: String,
      caption: String,
      stopPropagation: Boolean,
      splitIcon: String,
      splitIconClass: String,
      splitTriggerType: String,
      splitSvgData: String
    },
    computed: {
      buttonParams: function buttonParams() {
        return {
          caption: this.caption,
          disabled: this.disabled,
          buttonType: this.buttonType,
          buttonStyle: this.buttonStyle,
          stopPropagation: this.stopPropagation
        };
      },
      splitParams: function splitParams() {
        return {
          icon: this.splitIcon,
          iconClass: this.splitIconClass,
          disabled: this.disabled,
          triggerType: this.splitIcon || this.splitIconClass || this.splitTriggerType || this.splitSvgData ? this.splitTriggerType : 'dropdown',
          svgData: this.splitSvgData,
          buttonType: this.buttonType,
          buttonStyle: this.buttonStyle,
          stopPropagation: this.stopPropagation
        };
      }
    },
    methods: {
      onButtonClick: function onButtonClick(event) {
        this.$emit('click', event);
      },
      onSplitButtonClick: function onSplitButtonClick(event) {
        this.$emit('splitbuttonclick', event);
      }
    }
  };

  /* script */
  var __vue_script__$7 = script$7;
  /* template */

  var __vue_render__$6 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-button-group",
      attrs: {
        "button-shape": _vm.buttonShape
      }
    }, [_c("mu-button", _vm._b({
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-button", _vm.buttonParams, false), [_vm._t("default")], 2), _vm._v(" "), _c("mu-button", _vm._b({
      on: {
        click: _vm.onSplitButtonClick
      }
    }, "mu-button", _vm.splitParams, false))], 1);
  };

  var __vue_staticRenderFns__$6 = [];
  __vue_render__$6._withStripped = true;
  /* style */

  var __vue_inject_styles__$7 = undefined;
  /* scoped */

  var __vue_scope_id__$7 = undefined;
  /* module identifier */

  var __vue_module_identifier__$7 = undefined;
  /* functional template */

  var __vue_is_functional_template__$7 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$7 = normalizeComponent_1({
    render: __vue_render__$6,
    staticRenderFns: __vue_staticRenderFns__$6
  }, __vue_inject_styles__$7, __vue_script__$7, __vue_scope_id__$7, __vue_is_functional_template__$7, __vue_module_identifier__$7, false, undefined, undefined, undefined);

  // `Array.prototype.{ reduce, reduceRight }` methods implementation
  var createMethod$3 = function (IS_RIGHT) {
    return function (that, callbackfn, argumentsLength, memo) {
      aFunction$1(callbackfn);
      var O = toObject(that);
      var self = indexedObject(O);
      var length = toLength(O.length);
      var index = IS_RIGHT ? length - 1 : 0;
      var i = IS_RIGHT ? -1 : 1;
      if (argumentsLength < 2) while (true) {
        if (index in self) {
          memo = self[index];
          index += i;
          break;
        }
        index += i;
        if (IS_RIGHT ? index < 0 : length <= index) {
          throw TypeError('Reduce of empty array with no initial value');
        }
      }
      for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
        memo = callbackfn(memo, self[index], index, O);
      }
      return memo;
    };
  };

  var arrayReduce = {
    // `Array.prototype.reduce` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
    left: createMethod$3(false),
    // `Array.prototype.reduceRight` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
    right: createMethod$3(true)
  };

  var $reduce = arrayReduce.left;


  // `Array.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  _export({ target: 'Array', proto: true, forced: sloppyArrayMethod('reduce') }, {
    reduce: function reduce(callbackfn /* , initialValue */) {
      return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var SPECIES$2 = wellKnownSymbol('species');
  var nativeSlice = [].slice;
  var max$1 = Math.max;

  // `Array.prototype.slice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.slice
  // fallback for not array-like ES3 strings and DOM objects
  _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('slice') }, {
    slice: function slice(start, end) {
      var O = toIndexedObject(this);
      var length = toLength(O.length);
      var k = toAbsoluteIndex(start, length);
      var fin = toAbsoluteIndex(end === undefined ? length : end, length);
      // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
      var Constructor, result, n;
      if (isArray(O)) {
        Constructor = O.constructor;
        // cross-realm fallback
        if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
          Constructor = undefined;
        } else if (isObject(Constructor)) {
          Constructor = Constructor[SPECIES$2];
          if (Constructor === null) Constructor = undefined;
        }
        if (Constructor === Array || Constructor === undefined) {
          return nativeSlice.call(O, k, fin);
        }
      }
      result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
      for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
      result.length = n;
      return result;
    }
  });

  var slice = [].slice;
  var MSIE = /MSIE .\./.test(userAgent); // <- dirty ie9- check

  var wrap$1 = function (scheduler) {
    return function (handler, timeout /* , ...arguments */) {
      var boundArgs = arguments.length > 2;
      var args = boundArgs ? slice.call(arguments, 2) : undefined;
      return scheduler(boundArgs ? function () {
        // eslint-disable-next-line no-new-func
        (typeof handler == 'function' ? handler : Function(handler)).apply(this, args);
      } : handler, timeout);
    };
  };

  // ie9- setTimeout & setInterval additional parameters fix
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
  _export({ global: true, bind: true, forced: MSIE }, {
    // `setTimeout` method
    // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
    setTimeout: wrap$1(global_1.setTimeout),
    // `setInterval` method
    // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
    setInterval: wrap$1(global_1.setInterval)
  });

  var PopupGroupMixin = {
    data: function data() {
      return {
        popupParams: {
          visible: false,
          width: this.popupWidth,
          height: this.popupHeight,
          popupStyle: this.popupStyle,
          iconIndent: this.popupIconIndent,
          renderToBody: this.popupRenderToBody
        }
      };
    },
    provide: function provide() {
      return {
        popupParams: this.popupParams
      };
    },
    props: {
      popupStyle: String,
      popupWidth: {
        type: String,
        "default": 'auto'
      },
      popupHeight: String,
      popupIconIndent: null,
      popupRenderToBody: {
        type: Boolean,
        "default": true
      }
    },
    watch: {
      popupWidth: function popupWidth(value) {
        this.popupParams.width = value;
      },
      popupHeight: function popupHeight(value) {
        this.popupParams.height = value;
      },
      popupRenderToBody: function popupRenderToBody(value) {
        this.popupParams.renderToBody = value;
      }
    },
    methods: {
      setPopupVisible: function setPopupVisible(value) {
        this.popupParams.visible = value;
      },
      togglePopup: function togglePopup() {
        this.setPopupVisible(!this.popupParams.visible);
      },
      showPopup: function showPopup() {
        this.setPopupVisible(true);
      },
      hidePopup: function hidePopup() {
        this.setPopupVisible(false);
      }
    }
  };

  var RenderToBodyMixin = {
    props: {
      renderToBody: {
        type: Boolean,
        "default": true
      }
    },
    mounted: function mounted() {
      if (this.renderToBody) {
        document.body.appendChild(this.$el);
      }
    },
    beforeDestroy: function beforeDestroy() {
      this.deactivate();
      var pEl = this.$el.parentNode;

      if (this.$el && pEl && pEl !== Object(this.$parent).$el) {
        pEl.removeChild(this.$el);
      }
    }
  };

  function callbackIf(name, handler) {
    var popup = window['__mussel_' + name];
    if (popup) handler(popup);
    return popup;
  }

  function hideIf(name, force) {
    return name === 'dropdown' ? callbackIf('dropdown', function (dropdown) {
      return dropdown.hide();
    }) : name === 'modal' ? callbackIf('modal', function (modal) {
      return (modal.$options.maskAction || modal.maskAction) === 'close' && modal.hide(force);
    }) : undefined;
  }

  function setPositionIf() {
    callbackIf('dropdown', function (dropdown) {
      return dropdown.setPosition();
    });
  }

  window.addEventListener('blur', function () {
    return hideIf('dropdown');
  });
  window.addEventListener('keyup', function (event) {
    return event.keyCode === 27 && (hideIf('dropdown') || hideIf('modal'));
  });
  window.addEventListener('mousedown', function (event) {
    return callbackIf('dropdown', function (dropdown) {
      return dropdown.hideIf(event.target);
    });
  });
  window.addEventListener('popstate', function () {
    hideIf('dropdown');
    hideIf('modal', true);
  });
  window.addEventListener('resize', setPositionIf);
  window.addEventListener('scroll', function () {
    hideIf('dropdown');
  });
  window.addEventListener('mousewheel', function () {
    hideIf('dropdown');
  });

  var PopupVisibleMixin = {
    model: {
      prop: 'visible',
      event: 'change'
    },
    props: {
      visible: Boolean
    },
    data: function data() {
      return {
        popupVisible: false
      };
    },
    watch: {
      visible: {
        handler: function handler(value) {
          if (!!value === !this.popupVisible) {
            return value ? this.show() : this.hide(true);
          }
        },
        immediate: true
      }
    },
    methods: {
      show: function show() {
        this.popupVisible = true;
        this.$emit('show');
        this.$emit('change', true);
      },
      hide: function hide() {
        this.popupVisible = false;
        this.$emit('hide');
        this.$emit('change', false);
      }
    }
  };

  function isParentElement(element, parentElement, includeSelf) {
    if (includeSelf && element === parentElement) return true;

    while (Object(element.parentNode).nodeType === 1) {
      element = element.parentNode;
      if (element === parentElement) return true;
    }

    return false;
  }

  function getClientRect(el) {
    var _el$getBoundingClient = el.getBoundingClientRect(),
        top = _el$getBoundingClient.top,
        bottom = _el$getBoundingClient.bottom,
        left = _el$getBoundingClient.left,
        right = _el$getBoundingClient.right,
        w = _el$getBoundingClient.width,
        h = _el$getBoundingClient.height;

    return {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: w || right - left,
      height: h || bottom - top
    };
  }

  function popOnTop(parentRect, height) {
    return parentRect.bottom + 4 + height > window.innerHeight && parentRect.top - height - 4 >= 0;
  }

  function popOnRight(parentRect, width) {
    return (width < parentRect.width || parentRect.left + width > window.innerWidth) && parentRect.right - width >= 0;
  }

  function getAbsolutePosition(isOnTop, isOnRight, pRect, height, width) {
    var top = pRect.top,
        bottom = pRect.bottom,
        left = pRect.left,
        right = pRect.right;
    return {
      top: "".concat(isOnTop ? top - height - 4 : bottom + 4, "px"),
      left: "".concat(isOnRight ? right - width : left, "px")
    };
  }

  function getRelativePosition(isOnTop, isOnRight, pRect) {
    return {
      top: isOnTop ? undefined : "".concat(pRect.height + 4, "px"),
      bottom: isOnTop ? "".concat(pRect.height + 4, "px") : undefined,
      left: isOnRight ? undefined : '0',
      right: isOnRight ? '0' : undefined
    };
  }

  var script$8 = {
    name: 'MusselDropdownPanel',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    props: {
      width: String,
      height: String,
      popupStyle: String
    },
    data: function data() {
      return {
        style: {
          visibility: 'hidden',
          opacity: 0,
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined,
          height: undefined,
          width: undefined,
          minWidth: undefined
        }
      };
    },
    mounted: function mounted() {
      this.$emit('mounted', this.$el);
    },
    beforeDestroy: function beforeDestroy() {
      this.$emit('beforedestroy');
    },
    methods: {
      deactivate: function deactivate() {
        if (window.__mussel_dropdown === this) window.__mussel_dropdown = null;
      },
      show: function show() {
        var dd = window.__mussel_dropdown;
        if (dd !== this) hideIf('dropdown', dd);
        window.__mussel_dropdown = this;
        this.popupVisible = true;
        var w = this.width;
        Object.assign(this.style, {
          width: w && w !== 'auto' && w !== 'inherit' && w !== 'fit-content' ? w : undefined,
          height: this.height
        });
        this.$nextTick(this.setPosition);
        this.$emit('show');
        this.$emit('change', true);
      },
      hide: function hide() {
        this.deactivate();
        this.style.opacity = 0;
        this.style.visibility = 'hidden';
        this.popupVisible = false;
        this.$emit('hide');
        this.$emit('change', false);
      },
      hideIf: function hideIf(triggerEl) {
        if (!isParentElement(triggerEl, this.$parent.$el) && (!this.renderToBody || !isParentElement(triggerEl, this.$el, true))) {
          this.hide();
        }
      },
      setPosition: function setPosition() {
        var _this = this;

        if (this.positionTimer) clearTimeout(this.positionTimer);
        this.setPositionTimer = setTimeout(function () {
          if (!_this.popupVisible) return;
          var _this$$el = _this.$el,
              offsetWidth = _this$$el.offsetWidth,
              offsetHeight = _this$$el.offsetHeight;
          var pRect = getClientRect(_this.$parent.$el);
          var width = !_this.width || _this.width === 'inherit' ? pRect.width : _this.width === 'auto' && offsetWidth < pRect.width ? pRect.width : null;
          var isOnTop = popOnTop(pRect, offsetHeight);
          var isOnRight = popOnRight(pRect, width || offsetWidth);
          Object.assign(_this.style, width ? {
            width: width + 'px'
          } : {}, _this.renderToBody ? getAbsolutePosition(isOnTop, isOnRight, pRect, offsetHeight, width || offsetWidth) : getRelativePosition(isOnTop, isOnRight, pRect), {
            visibility: 'visible',
            opacity: 1
          });
        }, 50);
      }
    }
  };

  /* script */
  var __vue_script__$8 = script$8;
  /* template */

  var __vue_render__$7 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-dropdown-panel",
      style: _vm.style,
      attrs: {
        "popup-style": _vm.popupStyle,
        visible: _vm.popupVisible
      },
      on: {
        scroll: function scroll($event) {
          $event.stopPropagation();
        },
        mousewheel: function mousewheel($event) {
          $event.stopPropagation();
        }
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$7 = [];
  __vue_render__$7._withStripped = true;
  /* style */

  var __vue_inject_styles__$8 = undefined;
  /* scoped */

  var __vue_scope_id__$8 = undefined;
  /* module identifier */

  var __vue_module_identifier__$8 = undefined;
  /* functional template */

  var __vue_is_functional_template__$8 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$8 = normalizeComponent_1({
    render: __vue_render__$7,
    staticRenderFns: __vue_staticRenderFns__$7
  }, __vue_inject_styles__$8, __vue_script__$8, __vue_scope_id__$8, __vue_is_functional_template__$8, __vue_module_identifier__$8, false, undefined, undefined, undefined);

  var script$9 = {
    name: 'MusselDropdown',
    components: {
      'mu-dropdown-panel': __vue_component__$8
    },
    provide: function provide() {
      return {
        dropdown: this
      };
    },
    mixins: [PopupGroupMixin],
    props: {
      disabled: Boolean,
      triggerAction: {
        type: String,
        "default": 'hover',
        validator: function validator(value) {
          return ['hover', 'click'].indexOf(value) !== -1;
        }
      },
      popupStyle: {
        type: String,
        "default": 'dropdown-list'
      }
    },
    mounted: function mounted() {
      this.triggerElements = Array.prototype.slice.call(this.$el.querySelectorAll('[dropdown-trigger]'), 0);
    },
    methods: {
      clearHoverTimer: function clearHoverTimer() {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
          delete this.hoverTimer;
        }
      },
      delayHidePopup: function delayHidePopup() {
        var _this = this;

        this.hoverTimer = setTimeout(function () {
          _this.setPopupVisible(false);
        }, 200);
      },
      findTrigger: function findTrigger(target) {
        return this.triggerElements.reduce(function (result, el) {
          return result || isParentElement(target, el, true);
        }, false);
      },
      onClick: function onClick(event) {
        if (this.disabled) return;

        if (this.triggerAction === 'click' && (!this.triggerElements.length || this.findTrigger(event.target))) {
          this.clearHoverTimer();
          this.togglePopup();
        }
      },
      onMouseOver: function onMouseOver(event) {
        if (this.disabled) return;
        this.clearHoverTimer();
        var target = event.target;
        var triggerCount = this.triggerElements.length;

        if (this.triggerAction === 'hover' && (!triggerCount || this.findTrigger(target))) {
          this.showPopup();
        } else if (triggerCount && !this.findTrigger(target)) {
          this.delayHidePopup();
        }
      },
      onMouseLeave: function onMouseLeave(event) {
        this.clearHoverTimer();
        this.delayHidePopup();
      },
      onDropdownClick: function onDropdownClick() {},
      onItemClick: function onItemClick(item) {
        this.hidePopup();
        this.$emit('itemclick', item);
      }
    }
  };

  /* script */
  var __vue_script__$9 = script$9;
  /* template */

  var __vue_render__$8 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-dropdown",
      attrs: {
        expanded: _vm.popupParams.visible
      },
      on: {
        click: _vm.onClick,
        mouseover: _vm.onMouseOver,
        mouseleave: _vm.onMouseLeave
      }
    }, [_vm._t("default"), _vm._v(" "), _c("mu-dropdown-panel", _vm._b({
      directives: [{
        name: "show",
        rawName: "v-show",
        value: !_vm.disabled && _vm.popupParams.visible,
        expression: "!disabled && popupParams.visible"
      }],
      on: {
        change: _vm.setPopupVisible
      },
      nativeOn: {
        mouseover: function mouseover($event) {
          $event.stopPropagation();
          return _vm.clearHoverTimer($event);
        },
        mouseleave: function mouseleave($event) {
          $event.stopPropagation();
          return _vm.onMouseLeave($event);
        },
        click: function click($event) {
          $event.stopPropagation();
          return _vm.onDropdownClick($event);
        }
      }
    }, "mu-dropdown-panel", _vm.popupParams, false), [_vm._t("dropdown")], 2)], 2);
  };

  var __vue_staticRenderFns__$8 = [];
  __vue_render__$8._withStripped = true;
  /* style */

  var __vue_inject_styles__$9 = undefined;
  /* scoped */

  var __vue_scope_id__$9 = undefined;
  /* module identifier */

  var __vue_module_identifier__$9 = undefined;
  /* functional template */

  var __vue_is_functional_template__$9 = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$9 = normalizeComponent_1({
    render: __vue_render__$8,
    staticRenderFns: __vue_staticRenderFns__$8
  }, __vue_inject_styles__$9, __vue_script__$9, __vue_scope_id__$9, __vue_is_functional_template__$9, __vue_module_identifier__$9, false, undefined, undefined, undefined);

  //
  var script$a = {
    name: 'MusselDropdownButton',
    components: {
      'mu-button': Button,
      'mu-icon': __vue_component__$4
    },
    "extends": __vue_component__$9,
    mixins: [__vue_component__$7],
    props: {
      splitButton: Boolean
    }
  };

  /* script */
  var __vue_script__$a = script$a;
  /* template */

  var __vue_render__$9 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-dropdown",
      attrs: {
        expanded: _vm.popupParams.visible
      },
      on: {
        click: _vm.onClick,
        mouseover: _vm.onMouseOver,
        mouseleave: _vm.onMouseLeave
      }
    }, [_vm.splitButton ? _c("div", {
      staticClass: "mu-button-group",
      attrs: {
        "button-shape": _vm.buttonShape
      }
    }, [_c("mu-button", _vm._b({
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-button", _vm.buttonParams, false), [_vm._t("default")], 2), _vm._v(" "), _c("mu-button", _vm._b({
      attrs: {
        "dropdown-trigger": ""
      },
      on: {
        click: _vm.onSplitButtonClick
      }
    }, "mu-button", _vm.splitParams, false))], 1) : _c("mu-button", _vm._b({
      attrs: {
        "button-shape": _vm.buttonShape
      },
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-button", _vm.buttonParams, false), [_vm._t("default", [_c("span", [_vm._v(_vm._s(_vm.caption))]), _vm._v(" "), _c("mu-icon", {
      attrs: {
        "trigger-type": "expander"
      }
    })])], 2), _vm._v(" "), !_vm.disabled && _vm.popupParams.visible ? _c("mu-dropdown-panel", _vm._b({
      on: {
        change: _vm.setPopupVisible
      },
      nativeOn: {
        mouseover: function mouseover($event) {
          $event.stopPropagation();
          return _vm.clearHoverTimer($event);
        },
        mouseleave: function mouseleave($event) {
          $event.stopPropagation();
          return _vm.onMouseLeave($event);
        },
        click: function click($event) {
          $event.stopPropagation();
          return _vm.onDropdownClick($event);
        }
      }
    }, "mu-dropdown-panel", _vm.popupParams, false), [_vm._t("dropdown")], 2) : _vm._e()], 1);
  };

  var __vue_staticRenderFns__$9 = [];
  __vue_render__$9._withStripped = true;
  /* style */

  var __vue_inject_styles__$a = undefined;
  /* scoped */

  var __vue_scope_id__$a = undefined;
  /* module identifier */

  var __vue_module_identifier__$a = undefined;
  /* functional template */

  var __vue_is_functional_template__$a = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$a = normalizeComponent_1({
    render: __vue_render__$9,
    staticRenderFns: __vue_staticRenderFns__$9
  }, __vue_inject_styles__$a, __vue_script__$a, __vue_scope_id__$a, __vue_is_functional_template__$a, __vue_module_identifier__$a, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  var script$b = {
    name: 'MusselInput',
    model: {
      prop: 'value',
      event: 'input'
    },
    props: {
      type: {
        type: String,
        "default": 'text'
      },
      value: [String, Number],
      disabled: {
        type: Boolean,
        "default": false
      }
    },
    methods: {
      onInput: function onInput(event) {
        var value = event.target.value;
        if (value !== this.value) this.$emit('input', value);
      },
      onKeyDown: function onKeyDown() {
        if (event.keyCode === 13) this.$emit('enterkey', this);else if (event.keyCode === 27) this.$emit('esckey', this);
      },
      onClick: function onClick() {
        if (!this.disabled) this.$emit('click');
      },
      onBlur: function onBlur() {
        this.$emit('blur', this);
      }
    }
  };

  /* script */
  var __vue_script__$b = script$b;
  /* template */

  var __vue_render__$a = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("input", {
      staticClass: "mu-input",
      attrs: {
        type: _vm.type,
        disabled: _vm.disabled
      },
      domProps: {
        value: _vm.value
      },
      on: {
        input: _vm.onInput,
        blur: _vm.onBlur,
        click: _vm.onClick,
        keydown: _vm.onKeyDown
      }
    });
  };

  var __vue_staticRenderFns__$a = [];
  __vue_render__$a._withStripped = true;
  /* style */

  var __vue_inject_styles__$b = undefined;
  /* scoped */

  var __vue_scope_id__$b = undefined;
  /* module identifier */

  var __vue_module_identifier__$b = undefined;
  /* functional template */

  var __vue_is_functional_template__$b = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$b = normalizeComponent_1({
    render: __vue_render__$a,
    staticRenderFns: __vue_staticRenderFns__$a
  }, __vue_inject_styles__$b, __vue_script__$b, __vue_scope_id__$b, __vue_is_functional_template__$b, __vue_module_identifier__$b, false, undefined, undefined, undefined);

  var EditorIcon = {
    name: 'MusselEditorIcon',
    "extends": __vue_component__$4,
    computed: {
      className: function className() {
        return 'mu-editor-icon';
      }
    }
  };

  //
  var script$c = {
    name: 'MusselBaseEditorWrapper',
    components: {
      'mu-input': __vue_component__$b,
      'mu-editor-icon': EditorIcon
    },
    inject: ['editor', 'params'],
    computed: {
      clearable: function clearable() {
        var p = this.params;
        return p.clearable && (!!p.value || p.value === 0);
      },
      iconPosition: function iconPosition() {
        var p = this.params;
        return p.icon || p.iconClass || p.triggerType ? p.iconPosition || 'right' : null;
      },
      buttons: function buttons() {
        return 0 + (this.clearable ? 1 : 0) + (this.iconPosition ? 1 : 0);
      },
      iconParams: function iconParams() {
        var p = this.params;
        return this.iconPosition ? {
          icon: p.icon,
          iconClass: p.iconClass,
          clickable: p.iconClickable,
          triggerType: p.triggerType
        } : null;
      },
      inputParams: function inputParams() {
        var p = this.params;
        return {
          type: p.type,
          value: p.value,
          focus: p.focus,
          readonly: p.readonly || !p.editable,
          disabled: p.disabled,
          placeholder: p.placeholder
        };
      }
    },
    methods: {
      onInput: function onInput(value) {
        this.editor.onInput(value);
      },
      onInputClick: function onInputClick() {
        this.editor.onInputClick();
      },
      onClearClick: function onClearClick() {
        this.editor.onClearClick();
      },
      onButtonClick: function onButtonClick() {
        this.editor.onButtonClick();
      },
      onKeyPress: function onKeyPress(event) {
        this.editor.onKeyPress(event);
      },
      onEscKey: function onEscKey() {
        this.editor.onEscKey();
      },
      onEnterKey: function onEnterKey() {
        this.editor.onEnterKey();
      },
      onBlur: function onBlur() {
        this.editor.onBlur();
      }
    }
  };

  /* script */
  var __vue_script__$c = script$c;
  /* template */

  var __vue_render__$b = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-editor",
      attrs: {
        buttons: _vm.buttons,
        readonly: _vm.params.readonly,
        disabled: _vm.params.disabled
      }
    }, [_vm.iconPosition === "left" ? _c("mu-editor-icon", _vm._b({
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-editor-icon", _vm.iconParams, false)) : _vm._e(), _vm._v(" "), _c("mu-input", _vm._b({
      on: {
        input: _vm.onInput,
        click: _vm.onInputClick,
        blur: _vm.onBlur,
        esckey: _vm.onEscKey,
        enterkey: _vm.onEnterKey
      },
      nativeOn: {
        keypress: function keypress($event) {
          return _vm.onKeyPress($event);
        }
      }
    }, "mu-input", _vm.inputParams, false)), _vm._v(" "), _vm.clearable ? _c("mu-editor-icon", {
      attrs: {
        clickable: "",
        "trigger-type": "clear"
      },
      on: {
        click: _vm.onClearClick
      }
    }) : _vm._e(), _vm._v(" "), _vm.iconPosition === "right" ? _c("mu-editor-icon", _vm._b({
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-editor-icon", _vm.iconParams, false)) : _vm._e(), _vm._v(" "), _vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$b = [];
  __vue_render__$b._withStripped = true;
  /* style */

  var __vue_inject_styles__$c = undefined;
  /* scoped */

  var __vue_scope_id__$c = undefined;
  /* module identifier */

  var __vue_module_identifier__$c = undefined;
  /* functional template */

  var __vue_is_functional_template__$c = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$c = normalizeComponent_1({
    render: __vue_render__$b,
    staticRenderFns: __vue_staticRenderFns__$b
  }, __vue_inject_styles__$c, __vue_script__$c, __vue_scope_id__$c, __vue_is_functional_template__$c, __vue_module_identifier__$c, false, undefined, undefined, undefined);

  var BaseEditor = {
    name: 'MusselBaseButtonEditor',
    components: {
      'mu-editor-wrapper': __vue_component__$c
    },
    provide: function provide() {
      return {
        editor: this,
        params: this.params
      };
    },
    data: function data() {
      var p = this;
      return {
        params: {
          focus: false,
          type: p.type,
          value: p.value,
          icon: p.icon,
          iconClickable: p.iconClickable !== false,
          iconClass: p.iconClass,
          iconPosition: p.iconPosition,
          triggerType: p.triggerType,
          readonly: p.readonly,
          disabled: p.disabled,
          editable: p.editable,
          clearable: p.clearable,
          placeholder: p.placeholder
        }
      };
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      placeholder: String,
      readonly: Boolean,
      disabled: Boolean,
      type: {
        type: String,
        "default": 'text'
      },
      value: {
        type: [String, Number]
      },
      icon: String,
      iconClass: String,
      iconPosition: {
        type: String,
        "default": 'right',
        validator: function validator(value) {
          return ['left', 'right'].indexOf(value) !== -1;
        }
      },
      iconClickable: null,
      editable: {
        type: Boolean,
        "default": true
      },
      clearable: {
        type: Boolean,
        "default": true
      },
      triggerType: String
    },
    watch: {
      value: {
        handler: function handler(value) {
          this.setInputValue(value);
        },
        immediate: true
      },
      readonly: function readonly(value) {
        this.params.readonly = value;
      },
      disabled: function disabled(value) {
        this.params.disabled = value;
      },
      type: function type(value) {
        this.params.type = value;
      },
      icon: function icon(value) {
        this.params.icon = value;
      },
      iconClass: function iconClass(value) {
        this.params.iconClass = value;
      },
      iconPosition: function iconPosition(value) {
        this.params.iconPosition = value;
      },
      triggerType: function triggerType(value) {
        this.params.triggerType = value;
      },
      editable: function editable(value) {
        this.editable = value;
      },
      clearable: function clearable(value) {
        this.params.clearable = value;
      },
      placeholder: function placeholder(value) {
        this.params.placeholder = value;
      }
    },
    methods: {
      setInputValue: function setInputValue(value) {
        this.params.value = value;
      },
      onInput: function onInput(value) {
        this.setInputValue(value);
        this.$emit('input', value);
        this.$emit('change', value);
      },
      onInputClick: function onInputClick() {
        this.$emit('inputclick');
      },
      onClearClick: function onClearClick() {
        this.clear();
        this.$emit('change', '');
      },
      onButtonClick: function onButtonClick() {
        this.focus();
        if (this.params.iconClickable) this.$emit('buttonclick');
      },
      onKeyPress: function onKeyPress(event) {
        this.$emit('keypress', event);
      },
      onEscKey: function onEscKey() {
        this.$emit('esckey', this);
      },
      onEnterKey: function onEnterKey() {
        this.$emit('enterkey', this);
      },
      onBlur: function onBlur() {
        this.$emit('blur', this);
      },
      clear: function clear() {
        this.params.value = '';
        this.focus();
        this.$emit('clear');
      },
      focus: function focus() {
        this.$el.querySelector('.mu-input').focus();
      }
    }
  };

  //
  var script$d = {
    name: 'MusselEditor',
    "extends": BaseEditor,
    props: {
      iconClickable: {
        type: Boolean,
        "default": false
      }
    }
  };

  /* script */
  var __vue_script__$d = script$d;
  /* template */

  var __vue_render__$c = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-editor-wrapper");
  };

  var __vue_staticRenderFns__$c = [];
  __vue_render__$c._withStripped = true;
  /* style */

  var __vue_inject_styles__$d = undefined;
  /* scoped */

  var __vue_scope_id__$d = undefined;
  /* module identifier */

  var __vue_module_identifier__$d = undefined;
  /* functional template */

  var __vue_is_functional_template__$d = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$d = normalizeComponent_1({
    render: __vue_render__$c,
    staticRenderFns: __vue_staticRenderFns__$c
  }, __vue_inject_styles__$d, __vue_script__$d, __vue_scope_id__$d, __vue_is_functional_template__$d, __vue_module_identifier__$d, false, undefined, undefined, undefined);

  //
  var script$e = {
    name: 'MusselPopupBoxWrapper',
    inject: ['params', 'popupParams'],
    components: {
      'mu-editor-wrapper': __vue_component__$c,
      'mu-dropdown-panel': __vue_component__$8
    },
    methods: {
      setPopupVisible: function setPopupVisible(value) {
        this.popupParams.visible = value;
        this.params.focus = value;
      },
      onDropdownMounted: function onDropdownMounted(el) {
        this.$emit('dropdownmounted', el);
      },
      beforeDropdownDestroy: function beforeDropdownDestroy() {
        this.$emit('beforedropdowndestroy');
      }
    }
  };

  /* script */
  var __vue_script__$e = script$e;
  /* template */

  var __vue_render__$d = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-editor-wrapper", {
      staticClass: "mu-popup-editor",
      attrs: {
        expanded: _vm.popupParams.visible
      }
    }, [_c("mu-dropdown-panel", _vm._b({
      on: {
        change: _vm.setPopupVisible,
        mounted: _vm.onDropdownMounted,
        beforedestroy: _vm.beforeDropdownDestroy
      }
    }, "mu-dropdown-panel", _vm.popupParams, false), [_vm._t("default")], 2), _vm._v(" "), _vm._t("expert")], 2);
  };

  var __vue_staticRenderFns__$d = [];
  __vue_render__$d._withStripped = true;
  /* style */

  var __vue_inject_styles__$e = undefined;
  /* scoped */

  var __vue_scope_id__$e = undefined;
  /* module identifier */

  var __vue_module_identifier__$e = undefined;
  /* functional template */

  var __vue_is_functional_template__$e = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$e = normalizeComponent_1({
    render: __vue_render__$d,
    staticRenderFns: __vue_staticRenderFns__$d
  }, __vue_inject_styles__$e, __vue_script__$e, __vue_scope_id__$e, __vue_is_functional_template__$e, __vue_module_identifier__$e, false, undefined, undefined, undefined);

  var BasePopupEditor = {
    name: 'MusselBasePopupEditor',
    components: {
      'mu-popup-editor-wrapper': __vue_component__$e
    },
    "extends": BaseEditor,
    mixins: [PopupGroupMixin],
    props: {
      editable: {
        type: Boolean,
        "default": false
      },
      popupWidth: {
        type: String,
        "default": 'inherit'
      }
    },
    methods: {
      onInputClick: function onInputClick() {
        if (!this.readonly && !this.params.editable) {
          this.togglePopup();
        }

        this.$emit('inputclick');
      },
      onButtonClick: function onButtonClick() {
        this.focus();
        this.togglePopup();
        this.$emit('buttonclick');
      },
      onClearClick: function onClearClick() {
        this.hidePopup();
        this.clear();
        this.$emit('change', '');
      }
    },
    created: function created() {
      if (!this.icon && !this.iconClass && !this.triggerType) {
        this.params.triggerType = 'expander';
      }
    }
  };

  //
  var script$f = {
    name: 'MusselButtonEditor',
    "extends": BaseEditor,
    props: {
      icon: {
        type: String,
        "default": 'ellipsis'
      }
    }
  };

  /* script */
  var __vue_script__$f = script$f;
  /* template */

  var __vue_render__$e = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-editor-wrapper");
  };

  var __vue_staticRenderFns__$e = [];
  __vue_render__$e._withStripped = true;
  /* style */

  var __vue_inject_styles__$f = undefined;
  /* scoped */

  var __vue_scope_id__$f = undefined;
  /* module identifier */

  var __vue_module_identifier__$f = undefined;
  /* functional template */

  var __vue_is_functional_template__$f = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$f = normalizeComponent_1({
    render: __vue_render__$e,
    staticRenderFns: __vue_staticRenderFns__$e
  }, __vue_inject_styles__$f, __vue_script__$f, __vue_scope_id__$f, __vue_is_functional_template__$f, __vue_module_identifier__$f, false, undefined, undefined, undefined);

  var trim$1 = stringTrim.trim;


  var nativeParseInt = global_1.parseInt;
  var hex = /^[+-]?0[Xx]/;
  var FORCED$1 = nativeParseInt(whitespaces + '08') !== 8 || nativeParseInt(whitespaces + '0x16') !== 22;

  // `parseInt` method
  // https://tc39.github.io/ecma262/#sec-parseint-string-radix
  var _parseInt = FORCED$1 ? function parseInt(string, radix) {
    var S = trim$1(String(string));
    return nativeParseInt(S, (radix >>> 0) || (hex.test(S) ? 16 : 10));
  } : nativeParseInt;

  // `parseInt` method
  // https://tc39.github.io/ecma262/#sec-parseint-string-radix
  _export({ global: true, forced: parseInt != _parseInt }, {
    parseInt: _parseInt
  });

  var safe = ['#000000', '#000033', '#000066', '#000099', '#0000CC', '#0000FF', '#003300', '#003333', '#003366', '#003399', '#0033CC', '#0033FF', '#006600', '#006633', '#006666', '#006699', '#0066CC', '#0066FF', '#009900', '#009933', '#009966', '#009999', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#00FF00', '#00FF33', '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#330000', '#330033', '#330066', '#330099', '#3300CC', '#3300FF', '#333300', '#333333', '#333366', '#333399', '#3333CC', '#3333FF', '#336600', '#336633', '#336666', '#336699', '#3366CC', '#3366FF', '#339900', '#339933', '#339966', '#339999', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#33FF00', '#33FF33', '#33FF66', '#33FF99', '#33FFCC', '#33FFFF', '#660000', '#660033', '#660066', '#660099', '#6600CC', '#6600FF', '#663300', '#663333', '#663366', '#663399', '#6633CC', '#6633FF', '#666600', '#666633', '#666666', '#666699', '#6666CC', '#6666FF', '#669900', '#669933', '#669966', '#669999', '#6699CC', '#6699FF', '#66CC00', '#66CC33', '#66CC66', '#66CC99', '#66CCCC', '#66CCFF', '#66FF00', '#66FF33', '#66FF66', '#66FF99', '#66FFCC', '#66FFFF', '#990000', '#990033', '#990066', '#990099', '#9900CC', '#9900FF', '#993300', '#993333', '#993366', '#993399', '#9933CC', '#9933FF', '#996600', '#996633', '#996666', '#996699', '#9966CC', '#9966FF', '#999900', '#999933', '#999966', '#999999', '#9999CC', '#9999FF', '#99CC00', '#99CC33', '#99CC66', '#99CC99', '#99CCCC', '#99CCFF', '#99FF00', '#99FF33', '#99FF66', '#99FF99', '#99FFCC', '#99FFFF', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC6666', '#CC6699', '#CC66CC', '#CC66FF', '#CC9900', '#CC9933', '#CC9966', '#CC9999', '#CC99CC', '#CC99FF', '#CCCC00', '#CCCC33', '#CCCC66', '#CCCC99', '#CCCCCC', '#CCCCFF', '#CCFF00', '#CCFF33', '#CCFF66', '#CCFF99', '#CCFFCC', '#CCFFFF', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF6666', '#FF6699', '#FF66CC', '#FF66FF', '#FF9900', '#FF9933', '#FF9966', '#FF9999', '#FF99CC', '#FF99FF', '#FFCC00', '#FFCC33', '#FFCC66', '#FFCC99', '#FFCCCC', '#FFCCFF', '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#FFFFFF'];
  var Colors = {
    safe: safe
  };

  var script$g = {
    name: 'MusselColorEditor',
    "extends": BasePopupEditor,
    props: {
      popupWidth: {
        type: String,
        "default": 'auto'
      }
    },
    data: function data() {
      var grid = [];
      var row = [];
      Colors.safe.forEach(function (color) {
        row.push(color);

        if (row.length === 18) {
          grid.push(row);
          row = [];
        }
      });
      if (row.length) grid.push(row);
      return {
        colors: grid
      };
    },
    mounted: function mounted() {
      this.setIndicator(this.value);
    },
    methods: {
      setInputValue: function setInputValue(value) {
        if (this.$el) this.setIndicator(this.value);
      },
      setIndicator: function setIndicator(color) {
        var indicator = this.$el.querySelector('.mu-color-indicator');
        if (!indicator) return;

        if (color) {
          var isDark = false;

          if (color.indexOf('#') === 0) {
            var rgb = [parseInt('0x' + color.slice(1, 3)), parseInt('0x' + color.slice(3, 5)), parseInt('0x' + color.slice(5, 7))];
            isDark = rgb[0] * 0.299 + rgb[1] * 0.578 + rgb[2] * 0.114 < 192;
          }

          indicator.style.backgroundColor = color;
          indicator.style.color = isDark ? '#eee' : '#222';
          indicator.innerText = color;
          this.params.value = color;
          return color;
        } else {
          indicator.style.backgroundColor = 'transparent';
          indicator.innerText = '';
          this.params.value = '';
        }
      },
      setColor: function setColor(color) {
        var hex = this.setIndicator(color);
        this.$emit('change', hex);
      },
      clear: function clear() {
        this.setIndicator();
        this.focus();
        this.$emit('clear');
      },
      onMouseOver: function onMouseOver(event, color) {
        if (event.buttons === 1) this.setColor(color);
      }
    }
  };

  /* script */
  var __vue_script__$g = script$g;
  /* template */

  var __vue_render__$f = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-popup-editor-wrapper", {
      staticClass: "mu-color-editor",
      scopedSlots: _vm._u([{
        key: "expert",
        fn: function fn() {
          return [_c("div", {
            staticClass: "mu-color-indicator",
            on: {
              click: _vm.togglePopup
            }
          })];
        },
        proxy: true
      }])
    }, [_c("div", {
      staticClass: "mu-color-palette"
    }, _vm._l(_vm.colors, function (row, rowIdx) {
      return _c("div", {
        key: rowIdx
      }, _vm._l(row, function (color) {
        return _c("span", {
          key: color,
          staticClass: "mu-color-palette-cell",
          style: {
            background: color
          },
          on: {
            click: function click($event) {
              return _vm.setColor(color);
            },
            mouseover: function mouseover($event) {
              return _vm.onMouseOver($event, color);
            }
          }
        });
      }), 0);
    }), 0), _vm._v(" "), _c("div", {
      staticClass: "mu-footer-button mu-text-color-success",
      on: {
        click: _vm.hidePopup
      }
    }, [_c("mu-icon", {
      attrs: {
        icon: "ok"
      }
    })], 1)]);
  };

  var __vue_staticRenderFns__$f = [];
  __vue_render__$f._withStripped = true;
  /* style */

  var __vue_inject_styles__$g = undefined;
  /* scoped */

  var __vue_scope_id__$g = undefined;
  /* module identifier */

  var __vue_module_identifier__$g = undefined;
  /* functional template */

  var __vue_is_functional_template__$g = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$g = normalizeComponent_1({
    render: __vue_render__$f,
    staticRenderFns: __vue_staticRenderFns__$f
  }, __vue_inject_styles__$g, __vue_script__$g, __vue_scope_id__$g, __vue_is_functional_template__$g, __vue_module_identifier__$g, false, undefined, undefined, undefined);

  //
  var script$h = {
    name: 'MusselPopupEditor',
    "extends": BasePopupEditor
  };

  /* script */
  var __vue_script__$h = script$h;
  /* template */

  var __vue_render__$g = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-popup-editor-wrapper", [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$g = [];
  __vue_render__$g._withStripped = true;
  /* style */

  var __vue_inject_styles__$h = undefined;
  /* scoped */

  var __vue_scope_id__$h = undefined;
  /* module identifier */

  var __vue_module_identifier__$h = undefined;
  /* functional template */

  var __vue_is_functional_template__$h = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$h = normalizeComponent_1({
    render: __vue_render__$g,
    staticRenderFns: __vue_staticRenderFns__$g
  }, __vue_inject_styles__$h, __vue_script__$h, __vue_scope_id__$h, __vue_is_functional_template__$h, __vue_module_identifier__$h, false, undefined, undefined, undefined);

  var DatePrototype = Date.prototype;
  var INVALID_DATE = 'Invalid Date';
  var TO_STRING = 'toString';
  var nativeDateToString = DatePrototype[TO_STRING];
  var getTime = DatePrototype.getTime;

  // `Date.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.tostring
  if (new Date(NaN) + '' != INVALID_DATE) {
    redefine(DatePrototype, TO_STRING, function toString() {
      var value = getTime.call(this);
      // eslint-disable-next-line no-self-compare
      return value === value ? nativeDateToString.call(this) : INVALID_DATE;
    });
  }

  var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
  var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/679
  var IS_CONCAT_SPREADABLE_SUPPORT = v8Version >= 51 || !fails(function () {
    var array = [];
    array[IS_CONCAT_SPREADABLE] = false;
    return array.concat()[0] !== array;
  });

  var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

  var isConcatSpreadable = function (O) {
    if (!isObject(O)) return false;
    var spreadable = O[IS_CONCAT_SPREADABLE];
    return spreadable !== undefined ? !!spreadable : isArray(O);
  };

  var FORCED$2 = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

  // `Array.prototype.concat` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.concat
  // with adding support of @@isConcatSpreadable and @@species
  _export({ target: 'Array', proto: true, forced: FORCED$2 }, {
    concat: function concat(arg) { // eslint-disable-line no-unused-vars
      var O = toObject(this);
      var A = arraySpeciesCreate(O, 0);
      var n = 0;
      var i, k, length, len, E;
      for (i = -1, length = arguments.length; i < length; i++) {
        E = i === -1 ? O : arguments[i];
        if (isConcatSpreadable(E)) {
          len = toLength(E.length);
          if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
        } else {
          if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          createProperty(A, n++, E);
        }
      }
      A.length = n;
      return A;
    }
  });

  var ceil$1 = Math.ceil;
  var floor$1 = Math.floor;

  // `Math.trunc` method
  // https://tc39.github.io/ecma262/#sec-math.trunc
  _export({ target: 'Math', stat: true }, {
    trunc: function trunc(it) {
      return (it > 0 ? floor$1 : ceil$1)(it);
    }
  });

  var lodash_isdate = createCommonjsModule(function (module, exports) {
  /**
   * lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright jQuery Foundation and other contributors <https://jquery.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** `Object#toString` result references. */
  var dateTag = '[object Date]';

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      return freeProcess && freeProcess.binding('util');
    } catch (e) {}
  }());

  /* Node.js helper references. */
  var nodeIsDate = nodeUtil && nodeUtil.isDate;

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * The base implementation of `_.isDate` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
   */
  function baseIsDate(value) {
    return isObjectLike(value) && objectToString.call(value) == dateTag;
  }

  /**
   * Checks if `value` is classified as a `Date` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
   * @example
   *
   * _.isDate(new Date);
   * // => true
   *
   * _.isDate('Mon April 23 2012');
   * // => false
   */
  var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  module.exports = isDate;
  });

  /**
   * lodash 4.0.1 (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Available under MIT license <https://lodash.com/license>
   */

  /** `Object#toString` result references. */
  var stringTag = '[object String]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray$1 = Array.isArray;

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /**
   * Checks if `value` is classified as a `String` primitive or object.
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   * @example
   *
   * _.isString('abc');
   * // => true
   *
   * _.isString(1);
   * // => false
   */
  function isString(value) {
    return typeof value == 'string' ||
      (!isArray$1(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
  }

  var lodash_isstring = isString;

  function isZh(defaultLang) {
    return (defaultLang || navigator.language || navigator.userLanguage).indexOf('zh') === 0;
  }

  function fillGrid(rowCount, colCount, callbackFn) {
    var rows = [];

    for (var i = 0; i < rowCount; i++) {
      var row = [];

      for (var j = 0; j < colCount; j++) {
        callbackFn(row, i, j);
      }

      rows.push(row);
    }

    return rows;
  }
  function parseDate(v) {
    v = v || new Date();
    return {
      year: v.getFullYear(),
      month: v.getMonth(),
      date: v.getDate()
    };
  }
  function getMaxDays(_ref) {
    var year = _ref.year,
        month = _ref.month;
    return month === 1 && (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) ? 29 : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  }
  function getFirstDay(_ref2) {
    var year = _ref2.year,
        month = _ref2.month;
    return new Date(year, month, 1).getDay();
  }
  function getMonthName(month, isZh) {
    var months = isZh ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month] + (isZh ? ' 月' : '');
  }
  function compare(a, b) {
    a = lodash_isdate(a) ? parseDate(a) : Object(a);
    b = lodash_isdate(b) ? parseDate(b) : Object(b);
    return a.year === b.year && a.month === b.month && a.date === b.date;
  }
  function getSiblingMonth(_ref3) {
    var year = _ref3.year,
        month = _ref3.month,
        step = _ref3.step;
    month += step;

    if (month < 0) {
      month = 11;
      year--;
    } else if (month > 11) {
      month = 0;
      year++;
    }

    return {
      year: year,
      month: month
    };
  }
  function getFilteredMarks(markedDates, year, month) {
    return markedDates.reduce(function (items, date) {
      var p = parseDate(date);

      if (p.year === year && p.month === month) {
        items.push("".concat(p.year, "-").concat(p.month + 1, "-").concat(p.date));
      }

      return items;
    }, []);
  }

  var script$i = {
    components: {
      IconButton: IconButton
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: [String, Date],
      rangeStart: Date,
      rangeEnd: Date,
      language: {
        type: String,
        validator: function validator(v) {
          return ['zh', 'en'].indexOf(v) !== -1;
        }
      },
      selectMode: {
        type: String,
        "default": 'date',
        validator: function validator(v) {
          return ['year', 'month', 'date'].indexOf(v) !== -1;
        }
      },
      markedDates: {
        type: Array,
        "default": function _default() {
          return [];
        }
      }
    },
    data: function data() {
      return {
        tab: 'date',
        dateText: '',
        dateRows: [],
        yearRows: [],
        startYear: null,
        naviYear: null,
        naviMonth: null
      };
    },
    computed: {
      isChinese: function isChinese() {
        return isZh(this.language);
      },
      weekDays: function weekDays() {
        return this.isChinese ? ['日', '一', '二', '三', '四', '五', '六'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      },
      title: function title() {
        var isChinese = this.isChinese,
            startYear = this.startYear,
            year = this.naviYear,
            month = this.naviMonth;
        return this.tab === 'date' ? "".concat(year, " ").concat(isChinese ? '年' : '', " ").concat(getMonthName(month, isChinese)) : "".concat(startYear, " ~ ").concat(startYear + 9);
      },
      monthRows: function monthRows() {
        var _this = this;

        var n = 0;
        return fillGrid(3, 4, function (row) {
          row.push({
            month: n,
            monthName: getMonthName(n, _this.isChinese)
          });
          n++;
        });
      }
    },
    watch: {
      value: function value(v) {
        this.update(v);
      },
      rangeStart: function rangeStart() {
        this.updateDateCells();
      },
      rangeEnd: function rangeEnd() {
        this.updateDateCells();
      },
      markedDates: function markedDates() {
        this.updateDateCells();
      }
    },
    mounted: function mounted() {
      this.tab = this.selectMode === 'date' ? 'date' : 'year';
      this.update(this.value);
    },
    methods: {
      setDateCellStatus: function setDateCellStatus(cell, marks, today) {
        var date = new Date(cell.year, cell.month, cell.date);
        var start = this.rangeStart,
            end = this.rangeEnd;
        if (compare(cell, today)) cell.today = true;
        if (marks.indexOf(cell.text) !== -1) cell.marked = true;

        if (start && date < start || end && date > end) {
          cell.invalid = true;
        }
      },
      updateDateCells: function updateDateCells() {
        var _this2 = this;

        var year = this.naviYear,
            month = this.naviMonth,
            markedDates = this.markedDates;
        var today = parseDate();
        var firstDay = getFirstDay({
          year: year,
          month: month
        });
        var maxDays = getMaxDays({
          year: year,
          month: month
        });
        var prev = getSiblingMonth({
          year: year,
          month: month,
          step: -1
        });
        var prevMaxDays = getMaxDays(prev);
        var next = getSiblingMonth({
          year: year,
          month: month,
          step: 1
        });
        var marks = getFilteredMarks(markedDates, year, month);
        var n = 1;
        this.dateRows = fillGrid(7, 7, function (row, i, j) {
          var isPrevMonth = i === 0 && j < firstDay;
          var isNextMonth = n > maxDays;
          var cell = isPrevMonth ? {
            year: prev.year,
            month: prev.month,
            date: prevMaxDays - firstDay + j + 1,
            adjacent: true
          } : isNextMonth ? {
            year: next.year,
            month: next.month,
            date: n - maxDays,
            adjacent: true
          } : {
            year: year,
            month: month,
            date: n
          };
          cell.text = "".concat(cell.year, "-").concat(cell.month + 1, "-").concat(cell.date);
          if (!isPrevMonth) n++;

          _this2.setDateCellStatus(cell, marks, today);

          row.push(cell);
        });
        this.$emit('updatecells', {
          year: year,
          month: month
        });
        this.$emit('navigate', {
          year: year,
          month: month
        });
      },
      updateYearCells: function updateYearCells() {
        var _this3 = this;

        var n = this.startYear - 1;
        this.yearRows = fillGrid(3, 4, function (row) {
          var cell = {
            year: n
          };

          if (n < _this3.startYear || n > _this3.startYear + 9) {
            cell.adjacent = true;
          }

          if (n === parseDate().year) cell.present = true;
          row.push(cell);
          n++;
        });
      },
      update: function update(value) {
        var v;

        try {
          v = value ? lodash_isdate(value) ? value : lodash_isstring(value) ? new Date(Date.parse(value)) : null : null;
        } catch (e) {}

        var _parseDate = parseDate(v),
            year = _parseDate.year,
            month = _parseDate.month,
            date = _parseDate.date;

        this.dateText = v ? "".concat(year, "-").concat(month + 1, "-").concat(date) : '';
        this.startYear = Math.trunc(year / 10) * 10;

        if (this.naviYear !== year || this.naviMonth !== month) {
          this.naviYear = year;
          this.naviMonth = month;
          return this.tab === 'year' ? this.updateYearCells() : this.updateDateCells();
        }
      },
      goMonth: function goMonth(step) {
        var _getSiblingMonth = getSiblingMonth({
          year: this.naviYear,
          month: this.naviMonth,
          step: step
        }),
            year = _getSiblingMonth.year,
            month = _getSiblingMonth.month;

        this.naviYear = year;
        this.naviMonth = month;
        this.updateDateCells();
      },
      goNow: function goNow() {
        return this.tab === 'date' ? this.goThisMonth() : this.goThisYear();
      },
      goPrev: function goPrev() {
        return this.tab === 'date' ? this.goMonth(-1) : this.goPrevYears();
      },
      goNext: function goNext() {
        return this.tab === 'date' ? this.goMonth(1) : this.goNextYears();
      },
      goThisMonth: function goThisMonth() {
        var _parseDate2 = parseDate(),
            year = _parseDate2.year,
            month = _parseDate2.month;

        this.naviYear = year;
        this.naviMonth = month;
        this.updateDateCells();
      },
      goPrevYears: function goPrevYears() {
        this.startYear -= 10;
        this.updateYearCells();
      },
      goNextYears: function goNextYears() {
        this.startYear += 10;
        this.updateYearCells();
      },
      goThisYear: function goThisYear() {
        this.startYear = Math.trunc(new Date().getFullYear() / 10) * 10;
        this.updateYearCells();
      },
      onTitleClick: function onTitleClick() {
        if (this.tab === 'date') {
          this.startYear = Math.trunc(this.naviYear / 10) * 10;
          this.updateYearCells();
          this.tab = 'year';
        }
      },
      onYearCellClick: function onYearCellClick(cell) {
        this.naviYear = cell.year;

        if (this.selectMode === 'year') {
          this.$emit('change', new Date(this.naviYear, 1, 1), this.naviYear);
        }
      },
      onMonthCellClick: function onMonthCellClick(cell) {
        var naviYear = this.naviYear,
            startYear = this.startYear,
            selectMode = this.selectMode;
        this.naviMonth = cell.month;

        if (naviYear >= startYear - 1 && naviYear < startYear + 11) {
          if (selectMode === 'date') {
            this.updateDateCells();
            this.tab = 'date';
          } else {
            var value = new Date(naviYear, this.naviMonth, 1);
            this.$emit('change', value, naviYear, this.naviMonth);
          }
        }
      },
      onDateCellClick: function onDateCellClick(cell) {
        var year = cell.year,
            month = cell.month,
            date = cell.date,
            invalid = cell.invalid;
        var value = new Date(year, month, date);
        if (invalid) return;

        if (!this.value || !compare(cell, this.value)) {
          this.dateText = "".concat(year, "-").concat(month + 1, "-").concat(date);
          this.$emit('change', value, year, month, date);
        }
      }
    }
  };

  /* script */
  var __vue_script__$i = script$i;
  /* template */

  var __vue_render__$h = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-calendar"
    }, [_c("div", {
      staticClass: "mu-calendar-header"
    }, [_c("div", {
      staticClass: "mu-calendar-title",
      on: {
        click: _vm.onTitleClick
      }
    }, [_vm._v("\n      " + _vm._s(_vm.title) + "\n    ")]), _vm._v(" "), _c("icon-button", {
      attrs: {
        "button-style": "link",
        icon: "key-up"
      },
      on: {
        click: _vm.goPrev
      }
    }), _vm._v(" "), _c("icon-button", {
      attrs: {
        "button-style": "link",
        icon: "calendar"
      },
      on: {
        click: _vm.goNow
      }
    }), _vm._v(" "), _c("icon-button", {
      attrs: {
        "button-style": "link",
        icon: "key-down"
      },
      on: {
        click: _vm.goNext
      }
    })], 1), _vm._v(" "), _vm.tab === "date" ? [_c("div", {
      staticClass: "mu-week-header"
    }, _vm._l(_vm.weekDays, function (name) {
      return _c("div", {
        key: name,
        staticClass: "mu-week-cell"
      }, [_vm._v("\n        " + _vm._s(name) + "\n      ")]);
    }), 0), _vm._v(" "), _c("div", {
      staticClass: "mu-calendar-grid"
    }, _vm._l(_vm.dateRows, function (row, rowIdx) {
      return _c("div", {
        key: rowIdx,
        staticClass: "mu-calendar-row",
        attrs: {
          size: "auto"
        }
      }, _vm._l(row, function (cell, cellIdx) {
        return _c("div", {
          key: cellIdx,
          staticClass: "mu-calendar-cell",
          attrs: {
            present: cell.today,
            marked: cell.marked,
            invalid: cell.invalid,
            adjacent: cell.adjacent,
            active: cell.text === _vm.dateText
          },
          on: {
            click: function click($event) {
              return _vm.onDateCellClick(cell);
            }
          }
        }, [_vm._v("\n          " + _vm._s(cell.date) + "\n        ")]);
      }), 0);
    }), 0)] : [_c("div", {
      staticClass: "mu-calendar-grid"
    }, _vm._l(_vm.yearRows, function (row, rowIdx) {
      return _c("div", {
        key: rowIdx,
        staticClass: "mu-calendar-row"
      }, _vm._l(row, function (cell, cellIdx) {
        return _c("div", {
          key: cellIdx,
          staticClass: "mu-calendar-cell",
          "class": {
            active: cell.year === _vm.naviYear
          },
          attrs: {
            present: cell.present,
            invalid: cell.invalid,
            adjacent: cell.adjacent,
            active: cell.year === _vm.naviYear
          },
          on: {
            click: function click($event) {
              return _vm.onYearCellClick(cell);
            }
          }
        }, [_vm._v("\n          " + _vm._s(cell.year) + "\n        ")]);
      }), 0);
    }), 0), _vm._v(" "), _vm.selectMode !== "year" ? _c("div", {
      staticClass: "mu-calendar-grid"
    }, _vm._l(_vm.monthRows, function (row, rowIdx) {
      return _c("div", {
        key: rowIdx,
        staticClass: "mu-calendar-row"
      }, _vm._l(row, function (cell, cellIdx) {
        return _c("div", {
          key: cellIdx,
          staticClass: "mu-calendar-cell",
          attrs: {
            active: cell.month === _vm.naviMonth
          },
          on: {
            click: function click($event) {
              return _vm.onMonthCellClick(cell);
            }
          }
        }, [_vm._v("\n          " + _vm._s(cell.monthName) + "\n        ")]);
      }), 0);
    }), 0) : _vm._e()]], 2);
  };

  var __vue_staticRenderFns__$h = [];
  __vue_render__$h._withStripped = true;
  /* style */

  var __vue_inject_styles__$i = undefined;
  /* scoped */

  var __vue_scope_id__$i = undefined;
  /* module identifier */

  var __vue_module_identifier__$i = undefined;
  /* functional template */

  var __vue_is_functional_template__$i = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$i = normalizeComponent_1({
    render: __vue_render__$h,
    staticRenderFns: __vue_staticRenderFns__$h
  }, __vue_inject_styles__$i, __vue_script__$i, __vue_scope_id__$i, __vue_is_functional_template__$i, __vue_module_identifier__$i, false, undefined, undefined, undefined);

  var MATCH = wellKnownSymbol('match');

  // `IsRegExp` abstract operation
  // https://tc39.github.io/ecma262/#sec-isregexp
  var isRegexp = function (it) {
    var isRegExp;
    return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
  };

  // `RegExp.prototype.flags` getter implementation
  // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
  var regexpFlags = function () {
    var that = anObject(this);
    var result = '';
    if (that.global) result += 'g';
    if (that.ignoreCase) result += 'i';
    if (that.multiline) result += 'm';
    if (that.dotAll) result += 's';
    if (that.unicode) result += 'u';
    if (that.sticky) result += 'y';
    return result;
  };

  var SPECIES$3 = wellKnownSymbol('species');

  var setSpecies = function (CONSTRUCTOR_NAME) {
    var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
    var defineProperty = objectDefineProperty.f;

    if (descriptors && Constructor && !Constructor[SPECIES$3]) {
      defineProperty(Constructor, SPECIES$3, {
        configurable: true,
        get: function () { return this; }
      });
    }
  };

  var defineProperty$4 = objectDefineProperty.f;
  var getOwnPropertyNames$1 = objectGetOwnPropertyNames.f;







  var MATCH$1 = wellKnownSymbol('match');
  var NativeRegExp = global_1.RegExp;
  var RegExpPrototype = NativeRegExp.prototype;
  var re1 = /a/g;
  var re2 = /a/g;

  // "new" should create a new object, old webkit bug
  var CORRECT_NEW = new NativeRegExp(re1) !== re1;

  var FORCED$3 = descriptors && isForced_1('RegExp', (!CORRECT_NEW || fails(function () {
    re2[MATCH$1] = false;
    // RegExp constructor can alter flags and IsRegExp works correct with @@match
    return NativeRegExp(re1) != re1 || NativeRegExp(re2) == re2 || NativeRegExp(re1, 'i') != '/a/i';
  })));

  // `RegExp` constructor
  // https://tc39.github.io/ecma262/#sec-regexp-constructor
  if (FORCED$3) {
    var RegExpWrapper = function RegExp(pattern, flags) {
      var thisIsRegExp = this instanceof RegExpWrapper;
      var patternIsRegExp = isRegexp(pattern);
      var flagsAreUndefined = flags === undefined;
      return !thisIsRegExp && patternIsRegExp && pattern.constructor === RegExpWrapper && flagsAreUndefined ? pattern
        : inheritIfRequired(CORRECT_NEW
          ? new NativeRegExp(patternIsRegExp && !flagsAreUndefined ? pattern.source : pattern, flags)
          : NativeRegExp((patternIsRegExp = pattern instanceof RegExpWrapper)
            ? pattern.source
            : pattern, patternIsRegExp && flagsAreUndefined ? regexpFlags.call(pattern) : flags)
        , thisIsRegExp ? this : RegExpPrototype, RegExpWrapper);
    };
    var proxy = function (key) {
      key in RegExpWrapper || defineProperty$4(RegExpWrapper, key, {
        configurable: true,
        get: function () { return NativeRegExp[key]; },
        set: function (it) { NativeRegExp[key] = it; }
      });
    };
    var keys$2 = getOwnPropertyNames$1(NativeRegExp);
    var index = 0;
    while (keys$2.length > index) proxy(keys$2[index++]);
    RegExpPrototype.constructor = RegExpWrapper;
    RegExpWrapper.prototype = RegExpPrototype;
    redefine(global_1, 'RegExp', RegExpWrapper);
  }

  // https://tc39.github.io/ecma262/#sec-get-regexp-@@species
  setSpecies('RegExp');

  var nativeExec = RegExp.prototype.exec;
  // This always refers to the native implementation, because the
  // String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
  // which loads this file before patching the method.
  var nativeReplace = String.prototype.replace;

  var patchedExec = nativeExec;

  var UPDATES_LAST_INDEX_WRONG = (function () {
    var re1 = /a/;
    var re2 = /b*/g;
    nativeExec.call(re1, 'a');
    nativeExec.call(re2, 'a');
    return re1.lastIndex !== 0 || re2.lastIndex !== 0;
  })();

  // nonparticipating capturing group, copied from es5-shim's String#split patch.
  var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

  var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

  if (PATCH) {
    patchedExec = function exec(str) {
      var re = this;
      var lastIndex, reCopy, match, i;

      if (NPCG_INCLUDED) {
        reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
      }
      if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

      match = nativeExec.call(re, str);

      if (UPDATES_LAST_INDEX_WRONG && match) {
        re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
      }
      if (NPCG_INCLUDED && match && match.length > 1) {
        // Fix browsers whose `exec` methods don't consistently return `undefined`
        // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
        nativeReplace.call(match[0], reCopy, function () {
          for (i = 1; i < arguments.length - 2; i++) {
            if (arguments[i] === undefined) match[i] = undefined;
          }
        });
      }

      return match;
    };
  }

  var regexpExec = patchedExec;

  _export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
    exec: regexpExec
  });

  var TO_STRING$1 = 'toString';
  var RegExpPrototype$1 = RegExp.prototype;
  var nativeToString = RegExpPrototype$1[TO_STRING$1];

  var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
  // FF44- RegExp#toString has a wrong name
  var INCORRECT_NAME = nativeToString.name != TO_STRING$1;

  // `RegExp.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
  if (NOT_GENERIC || INCORRECT_NAME) {
    redefine(RegExp.prototype, TO_STRING$1, function toString() {
      var R = anObject(this);
      var p = String(R.source);
      var rf = R.flags;
      var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype$1) ? regexpFlags.call(R) : rf);
      return '/' + p + '/' + f;
    }, { unsafe: true });
  }

  var SPECIES$4 = wellKnownSymbol('species');

  var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
    // #replace needs built-in support for named groups.
    // #match works fine because it just return the exec results, even if it has
    // a "grops" property.
    var re = /./;
    re.exec = function () {
      var result = [];
      result.groups = { a: '7' };
      return result;
    };
    return ''.replace(re, '$<a>') !== '7';
  });

  // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
  // Weex JS has frozen built-in prototypes, so use try / catch wrapper
  var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
    var re = /(?:)/;
    var originalExec = re.exec;
    re.exec = function () { return originalExec.apply(this, arguments); };
    var result = 'ab'.split(re);
    return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
  });

  var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
    var SYMBOL = wellKnownSymbol(KEY);

    var DELEGATES_TO_SYMBOL = !fails(function () {
      // String methods call symbol-named RegEp methods
      var O = {};
      O[SYMBOL] = function () { return 7; };
      return ''[KEY](O) != 7;
    });

    var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
      // Symbol-named RegExp methods call .exec
      var execCalled = false;
      var re = /a/;

      if (KEY === 'split') {
        // We can't use real regex here since it causes deoptimization
        // and serious performance degradation in V8
        // https://github.com/zloirock/core-js/issues/306
        re = {};
        // RegExp[@@split] doesn't call the regex's exec method, but first creates
        // a new one. We need to return the patched regex when creating the new one.
        re.constructor = {};
        re.constructor[SPECIES$4] = function () { return re; };
        re.flags = '';
        re[SYMBOL] = /./[SYMBOL];
      }

      re.exec = function () { execCalled = true; return null; };

      re[SYMBOL]('');
      return !execCalled;
    });

    if (
      !DELEGATES_TO_SYMBOL ||
      !DELEGATES_TO_EXEC ||
      (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
      (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
    ) {
      var nativeRegExpMethod = /./[SYMBOL];
      var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
        if (regexp.exec === regexpExec) {
          if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
            // The native String method already delegates to @@method (this
            // polyfilled function), leasing to infinite recursion.
            // We avoid it by directly calling the native @@method method.
            return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
          }
          return { done: true, value: nativeMethod.call(str, regexp, arg2) };
        }
        return { done: false };
      });
      var stringMethod = methods[0];
      var regexMethod = methods[1];

      redefine(String.prototype, KEY, stringMethod);
      redefine(RegExp.prototype, SYMBOL, length == 2
        // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
        // 21.2.5.11 RegExp.prototype[@@split](string, limit)
        ? function (string, arg) { return regexMethod.call(string, this, arg); }
        // 21.2.5.6 RegExp.prototype[@@match](string)
        // 21.2.5.9 RegExp.prototype[@@search](string)
        : function (string) { return regexMethod.call(string, this); }
      );
      if (sham) createNonEnumerableProperty(RegExp.prototype[SYMBOL], 'sham', true);
    }
  };

  // `String.prototype.{ codePointAt, at }` methods implementation
  var createMethod$4 = function (CONVERT_TO_STRING) {
    return function ($this, pos) {
      var S = String(requireObjectCoercible($this));
      var position = toInteger(pos);
      var size = S.length;
      var first, second;
      if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
      first = S.charCodeAt(position);
      return first < 0xD800 || first > 0xDBFF || position + 1 === size
        || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
          ? CONVERT_TO_STRING ? S.charAt(position) : first
          : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
    };
  };

  var stringMultibyte = {
    // `String.prototype.codePointAt` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
    codeAt: createMethod$4(false),
    // `String.prototype.at` method
    // https://github.com/mathiasbynens/String.prototype.at
    charAt: createMethod$4(true)
  };

  var charAt = stringMultibyte.charAt;

  // `AdvanceStringIndex` abstract operation
  // https://tc39.github.io/ecma262/#sec-advancestringindex
  var advanceStringIndex = function (S, index, unicode) {
    return index + (unicode ? charAt(S, index).length : 1);
  };

  // `RegExpExec` abstract operation
  // https://tc39.github.io/ecma262/#sec-regexpexec
  var regexpExecAbstract = function (R, S) {
    var exec = R.exec;
    if (typeof exec === 'function') {
      var result = exec.call(R, S);
      if (typeof result !== 'object') {
        throw TypeError('RegExp exec method returned something other than an Object or null');
      }
      return result;
    }

    if (classofRaw(R) !== 'RegExp') {
      throw TypeError('RegExp#exec called on incompatible receiver');
    }

    return regexpExec.call(R, S);
  };

  var max$2 = Math.max;
  var min$2 = Math.min;
  var floor$2 = Math.floor;
  var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
  var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

  var maybeToString = function (it) {
    return it === undefined ? it : String(it);
  };

  // @@replace logic
  fixRegexpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative) {
    return [
      // `String.prototype.replace` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.replace
      function replace(searchValue, replaceValue) {
        var O = requireObjectCoercible(this);
        var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
        return replacer !== undefined
          ? replacer.call(searchValue, O, replaceValue)
          : nativeReplace.call(String(O), searchValue, replaceValue);
      },
      // `RegExp.prototype[@@replace]` method
      // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
      function (regexp, replaceValue) {
        var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
        if (res.done) return res.value;

        var rx = anObject(regexp);
        var S = String(this);

        var functionalReplace = typeof replaceValue === 'function';
        if (!functionalReplace) replaceValue = String(replaceValue);

        var global = rx.global;
        if (global) {
          var fullUnicode = rx.unicode;
          rx.lastIndex = 0;
        }
        var results = [];
        while (true) {
          var result = regexpExecAbstract(rx, S);
          if (result === null) break;

          results.push(result);
          if (!global) break;

          var matchStr = String(result[0]);
          if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
        }

        var accumulatedResult = '';
        var nextSourcePosition = 0;
        for (var i = 0; i < results.length; i++) {
          result = results[i];

          var matched = String(result[0]);
          var position = max$2(min$2(toInteger(result.index), S.length), 0);
          var captures = [];
          // NOTE: This is equivalent to
          //   captures = result.slice(1).map(maybeToString)
          // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
          // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
          // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
          for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
          var namedCaptures = result.groups;
          if (functionalReplace) {
            var replacerArgs = [matched].concat(captures, position, S);
            if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
            var replacement = String(replaceValue.apply(undefined, replacerArgs));
          } else {
            replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
          }
          if (position >= nextSourcePosition) {
            accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
            nextSourcePosition = position + matched.length;
          }
        }
        return accumulatedResult + S.slice(nextSourcePosition);
      }
    ];

    // https://tc39.github.io/ecma262/#sec-getsubstitution
    function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
      var tailPos = position + matched.length;
      var m = captures.length;
      var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
      if (namedCaptures !== undefined) {
        namedCaptures = toObject(namedCaptures);
        symbols = SUBSTITUTION_SYMBOLS;
      }
      return nativeReplace.call(replacement, symbols, function (match, ch) {
        var capture;
        switch (ch.charAt(0)) {
          case '$': return '$';
          case '&': return matched;
          case '`': return str.slice(0, position);
          case "'": return str.slice(tailPos);
          case '<':
            capture = namedCaptures[ch.slice(1, -1)];
            break;
          default: // \d\d?
            var n = +ch;
            if (n === 0) return match;
            if (n > m) {
              var f = floor$2(n / 10);
              if (f === 0) return match;
              if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
              return match;
            }
            capture = captures[n - 1];
        }
        return capture === undefined ? '' : capture;
      });
    }
  });

  function formatDate(date) {
    var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'yyyy-MM-dd';
    var result = new RegExp('(y+)', 'i').test(format) ? format.replace(RegExp.$1, ('' + date.getFullYear()).substr(4 - RegExp.$1.length)) : format;
    var patterns = {
      '(M+)': date.getMonth() + 1,
      '(d+)': date.getDate(),
      '(h+)': date.getHours(),
      '(m+)': date.getMinutes(),
      '(s+)': date.getSeconds(),
      '(S+)': date.getMilliseconds()
    };
    Object.keys(patterns).forEach(function (pattern) {
      var re = new RegExp(pattern, pattern === '(d+)' || pattern === '(h+)' ? 'i' : undefined);

      if (re.test(result)) {
        var len = RegExp.$1.length;
        var v = '' + patterns[pattern];
        var start = v.length;
        result = result.replace(RegExp.$1, len === 2 ? ('00' + v).substr(start) : len === 3 ? ('000' + v).substr(start) : v);
      }
    });
    return result;
  }

  var script$j = {
    name: 'MusselDateEditor',
    components: {
      Calendar: __vue_component__$i
    },
    "extends": BasePopupEditor,
    props: {
      popupWidth: {
        type: String,
        "default": '300px'
      },
      popupHeight: {
        type: String,
        "default": '250px'
      },
      value: [String, Date],
      format: String,
      rangeStart: Date,
      rangeEnd: Date,
      language: String,
      selectMode: String,
      markedDates: Array
    },
    data: function data() {
      var p = this;
      return {
        calendarParams: {
          value: this.value,
          rangeStart: p.rangeStart,
          rangeEnd: p.rangeEnd,
          language: p.language,
          selectMode: p.selectMode,
          markedDates: p.markedDates
        }
      };
    },
    computed: {
      dateFormat: function dateFormat() {
        var mode = this.selectMode;
        return this.format || (mode === 'year' ? 'yyyy' : mode === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd');
      }
    },
    watch: {
      value: {
        handler: function handler(value) {
          this.calendarParams.value = value;
          this.setInputValue(value);
        },
        immediate: true
      },
      rangeStart: function rangeStart(value) {
        this.calendarParams.rangeStart = value;
      },
      rangeEnd: function rangeEnd(value) {
        this.calendarParams.rangeEnd = value;
      },
      markedDates: function markedDates(value) {
        this.calendarParams.markedDates = value;
      }
    },
    methods: {
      setInputValue: function setInputValue(value) {
        this.params.value = value ? formatDate(value, this.dateFormat) : '';
      },
      onSelect: function onSelect(value, year, month, date) {
        this.setInputValue(value);
        this.hidePopup();
        this.focus();
        this.$emit('change', value, year, month, date);
      }
    }
  };

  /* script */
  var __vue_script__$j = script$j;
  /* template */

  var __vue_render__$i = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-popup-editor-wrapper", [_c("calendar", _vm._b({
      staticClass: "mu-absolute-fit",
      on: {
        change: _vm.onSelect
      }
    }, "calendar", _vm.calendarParams, false))], 1);
  };

  var __vue_staticRenderFns__$i = [];
  __vue_render__$i._withStripped = true;
  /* style */

  var __vue_inject_styles__$j = undefined;
  /* scoped */

  var __vue_scope_id__$j = undefined;
  /* module identifier */

  var __vue_module_identifier__$j = undefined;
  /* functional template */

  var __vue_is_functional_template__$j = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$j = normalizeComponent_1({
    render: __vue_render__$i,
    staticRenderFns: __vue_staticRenderFns__$i
  }, __vue_inject_styles__$j, __vue_script__$j, __vue_scope_id__$j, __vue_is_functional_template__$j, __vue_module_identifier__$j, false, undefined, undefined, undefined);

  var UNSCOPABLES = wellKnownSymbol('unscopables');
  var ArrayPrototype = Array.prototype;

  // Array.prototype[@@unscopables]
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  if (ArrayPrototype[UNSCOPABLES] == undefined) {
    createNonEnumerableProperty(ArrayPrototype, UNSCOPABLES, objectCreate(null));
  }

  // add a key to Array.prototype[@@unscopables]
  var addToUnscopables = function (key) {
    ArrayPrototype[UNSCOPABLES][key] = true;
  };

  var $find = arrayIteration.find;


  var FIND = 'find';
  var SKIPS_HOLES = true;

  // Shouldn't skip holes
  if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  _export({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
    find: function find(callbackfn /* , that = undefined */) {
      return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables(FIND);

  var $findIndex = arrayIteration.findIndex;


  var FIND_INDEX = 'findIndex';
  var SKIPS_HOLES$1 = true;

  // Shouldn't skip holes
  if (FIND_INDEX in []) Array(1)[FIND_INDEX](function () { SKIPS_HOLES$1 = false; });

  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findindex
  _export({ target: 'Array', proto: true, forced: SKIPS_HOLES$1 }, {
    findIndex: function findIndex(callbackfn /* , that = undefined */) {
      return $findIndex(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables(FIND_INDEX);

  var nativeJoin = [].join;

  var ES3_STRINGS = indexedObject != Object;
  var SLOPPY_METHOD$1 = sloppyArrayMethod('join', ',');

  // `Array.prototype.join` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.join
  _export({ target: 'Array', proto: true, forced: ES3_STRINGS || SLOPPY_METHOD$1 }, {
    join: function join(separator) {
      return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
    }
  });

  var $map = arrayIteration.map;



  var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('map');
  // FF49- issue
  var USES_TO_LENGTH$1 = HAS_SPECIES_SUPPORT$1 && !fails(function () {
    [].map.call({ length: -1, 0: 1 }, function (it) { throw it; });
  });

  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$1 }, {
    map: function map(callbackfn /* , thisArg */) {
      return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var max$3 = Math.max;
  var min$3 = Math.min;
  var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

  // `Array.prototype.splice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.splice
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('splice') }, {
    splice: function splice(start, deleteCount /* , ...items */) {
      var O = toObject(this);
      var len = toLength(O.length);
      var actualStart = toAbsoluteIndex(start, len);
      var argumentsLength = arguments.length;
      var insertCount, actualDeleteCount, A, k, from, to;
      if (argumentsLength === 0) {
        insertCount = actualDeleteCount = 0;
      } else if (argumentsLength === 1) {
        insertCount = 0;
        actualDeleteCount = len - actualStart;
      } else {
        insertCount = argumentsLength - 2;
        actualDeleteCount = min$3(max$3(toInteger(deleteCount), 0), len - actualStart);
      }
      if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
        throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
      }
      A = arraySpeciesCreate(O, actualDeleteCount);
      for (k = 0; k < actualDeleteCount; k++) {
        from = actualStart + k;
        if (from in O) createProperty(A, k, O[from]);
      }
      A.length = actualDeleteCount;
      if (insertCount < actualDeleteCount) {
        for (k = actualStart; k < len - actualDeleteCount; k++) {
          from = k + actualDeleteCount;
          to = k + insertCount;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
        for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
      } else if (insertCount > actualDeleteCount) {
        for (k = len - actualDeleteCount; k > actualStart; k--) {
          from = k + actualDeleteCount - 1;
          to = k + insertCount - 1;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
      }
      for (k = 0; k < insertCount; k++) {
        O[k + actualStart] = arguments[k + 2];
      }
      O.length = len - actualDeleteCount + insertCount;
      return A;
    }
  });

  function unsetOrFalse(value) {
    return value === undefined || value === null || value === false || value === 'false';
  }

  //
  var script$k = {
    name: 'MusselListItem',
    components: {
      'mu-icon': __vue_component__$4
    },
    props: {
      value: null,
      icon: String,
      iconClass: String,
      iconIndent: null,
      label: String,
      selected: null,
      active: Boolean,
      disabled: Boolean,
      triggerIcon: String
    },
    computed: {
      actualLabel: function actualLabel() {
        return this.label;
      },
      actualIcon: function actualIcon() {
        return this.icon;
      },
      actualIconClass: function actualIconClass() {
        return this.iconClass;
      },
      actualIconIndent: function actualIconIndent() {
        return !unsetOrFalse(this.iconIndent);
      },
      actualActive: function actualActive() {
        return this.active;
      },
      actualSelected: function actualSelected() {
        return !unsetOrFalse(this.selected);
      },
      actualTriggerIcon: function actualTriggerIcon() {
        return this.triggerIcon;
      }
    },
    methods: {
      onClick: function onClick() {
        if (!this.disabled) this.$emit('click');
      },
      onIconClick: function onIconClick() {
        if (!this.disabled) this.$emit('iconclick');
      }
    }
  };

  /* script */
  var __vue_script__$k = script$k;
  /* template */

  var __vue_render__$j = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-list-item",
      attrs: {
        disabled: _vm.disabled,
        active: _vm.actualActive,
        selected: _vm.actualSelected,
        "icon-indent": _vm.actualIconIndent
      },
      on: {
        click: _vm.onClick
      }
    }, [_vm.actualIcon || _vm.actualIconClass || _vm.actualIconIndent ? _c("mu-icon", {
      attrs: {
        icon: _vm.actualIcon,
        "icon-class": _vm.actualIconClass
      },
      on: {
        click: _vm.onIconClick
      }
    }) : _vm._e(), _vm._v(" "), _vm._t("default", [_vm._v(_vm._s(_vm.actualLabel))])], 2);
  };

  var __vue_staticRenderFns__$j = [];
  __vue_render__$j._withStripped = true;
  /* style */

  var __vue_inject_styles__$k = undefined;
  /* scoped */

  var __vue_scope_id__$k = undefined;
  /* module identifier */

  var __vue_module_identifier__$k = undefined;
  /* functional template */

  var __vue_is_functional_template__$k = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$k = normalizeComponent_1({
    render: __vue_render__$j,
    staticRenderFns: __vue_staticRenderFns__$j
  }, __vue_inject_styles__$k, __vue_script__$k, __vue_scope_id__$k, __vue_is_functional_template__$k, __vue_module_identifier__$k, false, undefined, undefined, undefined);

  var Option = {
    name: 'MusselOption',
    "extends": __vue_component__$k,
    inject: {
      editor: {
        "default": null
      },
      multiple: {
        "default": false
      },
      popupParams: {
        "default": null
      }
    },
    props: {
      fields: Array,
      option: [String, Number, Object]
    },
    computed: {
      valueField: function valueField() {
        var _this$fields;

        return ((_this$fields = this.fields) === null || _this$fields === void 0 ? void 0 : _this$fields.value) || 'value';
      },
      labelField: function labelField() {
        var _this$fields2;

        return ((_this$fields2 = this.fields) === null || _this$fields2 === void 0 ? void 0 : _this$fields2.label) || 'label';
      },
      actualValue: function actualValue() {
        var option = Object(this.option);
        var v = this.value === undefined ? this.valueField in option ? option[this.valueField] : option.key : this.value;
        return v === undefined ? this.option : v;
      },
      actualLabel: function actualLabel() {
        var _this$option;

        var editable = this.editor.params.editable;
        var label = editable ? null : this.label === undefined ? (_this$option = this.option) === null || _this$option === void 0 ? void 0 : _this$option[this.labelField] : this.label;
        return label || this.actualValue;
      },
      actualIcon: function actualIcon() {
        return this.multiple ? this.actualSelected ? 'ok' : '_' : this.icon;
      },
      actualIconIndent: function actualIconIndent() {
        var _this$popupParams;

        return !unsetOrFalse(this.iconIndent) || !unsetOrFalse((_this$popupParams = this.popupParams) === null || _this$popupParams === void 0 ? void 0 : _this$popupParams.iconIndent);
      },
      actualSelected: function actualSelected() {
        var _this = this;

        var comboValue = this.editor.comboValue;
        return this.multiple ? comboValue === null || comboValue === void 0 ? void 0 : comboValue.find(function (value) {
          return value === _this.actualValue;
        }) : comboValue === this.actualValue;
      }
    },
    created: function created() {
      this.mountedOption = {
        value: this.actualValue,
        label: this.actualLabel
      };
      this.editor.mountOption(this.mountedOption);
    },
    beforeDestroy: function beforeDestroy() {
      this.editor.unmountOption(this.mountedOption);
    },
    watch: {
      actualIcon: {
        handler: function handler(value) {
          var params = this.popupParams || {
            iconIndent: true
          };
          var indent = params.iconIndent;

          if (value && !indent && indent !== false && indent !== 'false') {
            params.iconIndent = true;
          }
        },
        immediate: true
      }
    },
    methods: {
      onClick: function onClick() {
        if (this.disabled) return;
        this.editor.toggleSelection(this.actualValue, this.option);
        this.$emit('click');
      }
    }
  };

  function isEmptyValue(v) {
    return v === undefined || v === null || v === '';
  }

  var script$l = {
    name: 'MusselComboBox',
    components: {
      'mu-option': Option
    },
    "extends": BasePopupEditor,
    provide: function provide() {
      return {
        multiple: this.multiple
      };
    },
    props: {
      value: null,
      fields: Object,
      options: Array,
      multiple: Boolean,
      popupStyle: {
        type: String,
        "default": 'mu-dropdown-list'
      }
    },
    data: function data() {
      return {
        comboValue: null,
        mountedOptions: []
      };
    },
    computed: {
      valueField: function valueField() {
        var _this$fields;

        return ((_this$fields = this.fields) === null || _this$fields === void 0 ? void 0 : _this$fields.value) || 'value';
      }
    },
    watch: {
      multiple: function multiple(value) {
        this.params.editable = this.editable && !value;
      },
      options: function options() {
        this.mountedOptions = [];
      }
    },
    created: function created() {
      this.params.value = null;
    },
    mounted: function mounted() {
      this.params.editable = this.editable && !this.multiple;
      this.refreshInputValue();
    },
    methods: {
      setInputValue: function setInputValue(value) {
        console.log('value: ', value);

        if (this.comboValue !== value) {
          this.comboValue = isEmptyValue(value) ? this.multiple ? [] : null : value;
          this.refreshInputValue();
        }
      },
      setInputValueImmediately: function setInputValueImmediately() {
        var options = this.mountedOptions,
            v = this.comboValue,
            multiple = this.multiple,
            params = this.params;
        params.value = isEmptyValue(v) ? '' : params.editable ? v : (multiple ? v : [v]).map(function (value) {
          var _options$find;

          return ((_options$find = options.find(function (item) {
            return item.value === value;
          })) === null || _options$find === void 0 ? void 0 : _options$find.label) || '';
        }).join(',');
      },
      refreshInputValue: function refreshInputValue() {
        var immediate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        if (this.rivTimer) {
          clearTimeout(this.rivTimer);
          this.rivTimer = null;
        }

        if (this.params.editable || immediate) {
          this.setInputValueImmediately();
        } else {
          this.rivTimer = setTimeout(this.setInputValueImmediately, 50);
        }
      },
      mountOption: function mountOption(option) {
        var options = this.mountedOptions;

        if (!options.find(function (item) {
          return option === item;
        })) {
          options.push(option);
          if (!this.params.editable) this.refreshInputValue();
        }
      },
      unmountOption: function unmountOption(option) {
        var options = this.mountedOptions;
        var idx = options.findIndex(function (item) {
          return option === item;
        });
        if (idx !== -1) options.splice(idx, 1);
      },
      toggleSelection: function toggleSelection(value, option) {
        var hidePopup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        if (this.multiple) {
          var values = this.comboValue;
          var idx = values.indexOf(value);

          if (idx !== -1) {
            values.splice(idx, 1);
          } else {
            values.push(value);
          }

          this.$emit('change', values);
        } else {
          this.comboValue = value;
          this.$emit('change', value);
        }

        this.refreshInputValue(true);

        if (hidePopup) {
          this.popupParams.visible = false;
          this.focus();
        }

        this.$emit('optionclick', value, option);
      },
      onClearClick: function onClearClick() {
        this.comboValue = this.multiple ? [] : null;
        this.hidePopup();
        this.clear();
        this.$emit('change', this.comboValue);
      }
    }
  };

  var __vue_script__$l = script$l;
  /* template */

  var __vue_render__$k = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-popup-editor-wrapper", [!_vm.options ? _vm._t("default") : _vm._l(_vm.options, function (option, index) {
      return _c("mu-option", {
        key: +new Date() + "_" + index,
        attrs: {
          "icon-indent": _vm.popupIconIndent,
          option: option,
          fields: _vm.fields
        }
      });
    })], 2);
  };

  var __vue_staticRenderFns__$k = [];
  __vue_render__$k._withStripped = true;
  /* style */

  var __vue_inject_styles__$l = undefined;
  /* scoped */

  var __vue_scope_id__$l = undefined;
  /* module identifier */

  var __vue_module_identifier__$l = undefined;
  /* functional template */

  var __vue_is_functional_template__$l = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$l = normalizeComponent_1({
    render: __vue_render__$k,
    staticRenderFns: __vue_staticRenderFns__$k
  }, __vue_inject_styles__$l, __vue_script__$l, __vue_scope_id__$l, __vue_is_functional_template__$l, __vue_module_identifier__$l, false, undefined, undefined, undefined);

  var script$m = {
    name: 'MusselForm',
    "extends": __vue_component__$1,
    provide: function provide() {
      return {
        form: this
      };
    },
    props: {
      layout: {
        type: String,
        "default": 'flow',
        validator: function validator(value) {
          return ['flow', 'column', 'row'].indexOf(value) !== -1;
        }
      },
      cellpadding: {
        type: Boolean,
        "default": true
      },
      labelWidth: {
        type: String,
        "default": '75px'
      },
      labelAlign: String
    }
  };

  /* script */
  var __vue_script__$m = script$m;
  /* template */

  var __vue_render__$l = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-flex-box mu-form",
      attrs: {
        cellpadding: _vm.cellpadding
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$l = [];
  __vue_render__$l._withStripped = true;
  /* style */

  var __vue_inject_styles__$m = undefined;
  /* scoped */

  var __vue_scope_id__$m = undefined;
  /* module identifier */

  var __vue_module_identifier__$m = undefined;
  /* functional template */

  var __vue_is_functional_template__$m = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$m = normalizeComponent_1({
    render: __vue_render__$l,
    staticRenderFns: __vue_staticRenderFns__$l
  }, __vue_inject_styles__$m, __vue_script__$m, __vue_scope_id__$m, __vue_is_functional_template__$m, __vue_module_identifier__$m, false, undefined, undefined, undefined);

  var script$n = {
    name: 'MusselFormField',
    "extends": __vue_component__,
    inject: {
      form: {
        "default": null
      }
    },
    props: {
      label: String,
      labelWidth: String,
      labelAlign: {
        type: String,
        validator: function validator(value) {
          return ['right', 'left'].indexOf(value) !== -1;
        }
      },
      cellpadding: {
        type: Boolean,
        "default": true
      }
    },
    computed: {
      sizeValue: function sizeValue() {
        var _this$$el;

        var layout = this.parentLayout || 'flow';
        return this.size || ((_this$$el = this.$el) === null || _this$$el === void 0 ? void 0 : _this$$el.getAttribute('size')) || (layout === 'flow' ? '100%' : undefined);
      },
      labelStyle: function labelStyle() {
        var w = this.labelWidth || this.form.labelWidth;
        return {
          width: w,
          minWidth: w,
          textAlign: this.labelAlign || this.form.labelAlign || 'right'
        };
      }
    }
  };

  /* script */
  var __vue_script__$n = script$n;
  /* template */

  var __vue_render__$m = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-form-field mu-flex-box",
      attrs: {
        cellpadding: _vm.cellpadding
      }
    }, [_vm.label ? _c("label", {
      staticClass: "mu-text-ellipsis",
      style: _vm.labelStyle
    }, [_vm._v("\n    " + _vm._s(_vm.label) + "\n  ")]) : _vm._e(), _vm._v(" "), _vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$m = [];
  __vue_render__$m._withStripped = true;
  /* style */

  var __vue_inject_styles__$n = undefined;
  /* scoped */

  var __vue_scope_id__$n = undefined;
  /* module identifier */

  var __vue_module_identifier__$n = undefined;
  /* functional template */

  var __vue_is_functional_template__$n = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$n = normalizeComponent_1({
    render: __vue_render__$m,
    staticRenderFns: __vue_staticRenderFns__$m
  }, __vue_inject_styles__$n, __vue_script__$n, __vue_scope_id__$n, __vue_is_functional_template__$n, __vue_module_identifier__$n, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  var script$o = {
    name: 'MusselToggle',
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: null,
      activeValue: {
        type: null,
        "default": true
      },
      inactiveValue: {
        type: null,
        "default": false
      },
      label: String,
      disabled: Boolean,
      activeLabel: String,
      inactiveLabel: String
    },
    data: function data() {
      return {
        active: false
      };
    },
    computed: {
      leftLabel: function leftLabel() {
        return this.label || this.inactiveLabel;
      },
      labelClass: function labelClass() {
        return this.activeLabel ? this.value === this.activeValue ? 'mu-text-color-subtitle' : 'mu-text-color-title' : 'mu-text-color-normal';
      },
      activeLabelClass: function activeLabelClass() {
        return this.value === this.activeValue ? 'mu-text-color-success' : 'mu-text-color-subtitle';
      }
    },
    methods: {
      changeValue: function changeValue(value) {
        if (this.disabled) return;
        this.$emit('change', arguments.length ? value : this.value === this.activeValue ? this.inactiveValue : this.activeValue);
      },
      onLeftLabelClick: function onLeftLabelClick() {
        if (this.activeLabel) {
          if (this.value === this.activeValue) {
            this.changeValue(this.inactiveValue);
          }
        } else {
          this.changeValue();
        }
      },
      onRightLabelClick: function onRightLabelClick() {
        if (this.value === this.inactiveValue) {
          this.changeValue(this.activeValue);
        }
      }
    }
  };

  /* script */
  var __vue_script__$o = script$o;
  /* template */

  var __vue_render__$n = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-toggle",
      attrs: {
        active: _vm.value === _vm.activeValue,
        disabled: _vm.disabled
      }
    }, [_vm.label || _vm.inactiveLabel ? _c("label", {
      "class": _vm.labelClass,
      on: {
        click: _vm.onLeftLabelClick
      }
    }, [_vm._v("\n    " + _vm._s(_vm.label || _vm.inactiveLabel) + "\n  ")]) : _vm._e(), _vm._v(" "), _c("div", {
      staticClass: "mu-toggle-slide-bar",
      on: {
        click: function click($event) {
          return _vm.changeValue();
        }
      }
    }), _vm._v(" "), _vm.activeLabel ? _c("label", {
      "class": _vm.activeLabelClass,
      on: {
        click: _vm.onRightLabelClick
      }
    }, [_vm._v("\n    " + _vm._s(_vm.activeLabel) + "\n  ")]) : _vm._e()]);
  };

  var __vue_staticRenderFns__$n = [];
  __vue_render__$n._withStripped = true;
  /* style */

  var __vue_inject_styles__$o = undefined;
  /* scoped */

  var __vue_scope_id__$o = undefined;
  /* module identifier */

  var __vue_module_identifier__$o = undefined;
  /* functional template */

  var __vue_is_functional_template__$o = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$o = normalizeComponent_1({
    render: __vue_render__$n,
    staticRenderFns: __vue_staticRenderFns__$n
  }, __vue_inject_styles__$o, __vue_script__$o, __vue_scope_id__$o, __vue_is_functional_template__$o, __vue_module_identifier__$o, false, undefined, undefined, undefined);

  //
  //
  //
  //
  var script$p = {
    name: 'MusselListDivider'
  };

  /* script */
  var __vue_script__$p = script$p;
  /* template */

  var __vue_render__$o = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-list-divider"
    });
  };

  var __vue_staticRenderFns__$o = [];
  __vue_render__$o._withStripped = true;
  /* style */

  var __vue_inject_styles__$p = undefined;
  /* scoped */

  var __vue_scope_id__$p = undefined;
  /* module identifier */

  var __vue_module_identifier__$p = undefined;
  /* functional template */

  var __vue_is_functional_template__$p = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$p = normalizeComponent_1({
    render: __vue_render__$o,
    staticRenderFns: __vue_staticRenderFns__$o
  }, __vue_inject_styles__$p, __vue_script__$p, __vue_scope_id__$p, __vue_is_functional_template__$p, __vue_module_identifier__$p, false, undefined, undefined, undefined);

  //
  var script$q = {
    name: 'MusselBar',
    components: {
      HBox: HBox
    }
  };

  /* script */
  var __vue_script__$q = script$q;
  /* template */

  var __vue_render__$p = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("h-box", {
      staticClass: "mu-bar",
      attrs: {
        "align-items": "center"
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$p = [];
  __vue_render__$p._withStripped = true;
  /* style */

  var __vue_inject_styles__$q = undefined;
  /* scoped */

  var __vue_scope_id__$q = undefined;
  /* module identifier */

  var __vue_module_identifier__$q = undefined;
  /* functional template */

  var __vue_is_functional_template__$q = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$q = normalizeComponent_1({
    render: __vue_render__$p,
    staticRenderFns: __vue_staticRenderFns__$p
  }, __vue_inject_styles__$q, __vue_script__$q, __vue_scope_id__$q, __vue_is_functional_template__$q, __vue_module_identifier__$q, false, undefined, undefined, undefined);

  var defineProperty$5 = objectDefineProperty.f;

  var FunctionPrototype = Function.prototype;
  var FunctionPrototypeToString = FunctionPrototype.toString;
  var nameRE = /^\s*function ([^ (]*)/;
  var NAME = 'name';

  // Function instances `.name` property
  // https://tc39.github.io/ecma262/#sec-function-instances-name
  if (descriptors && !(NAME in FunctionPrototype)) {
    defineProperty$5(FunctionPrototype, NAME, {
      configurable: true,
      get: function () {
        try {
          return FunctionPrototypeToString.call(this).match(nameRE)[1];
        } catch (error) {
          return '';
        }
      }
    });
  }

  var script$r = {
    name: 'MusselTabsHeader',
    inject: {
      tabs: {
        "default": null
      }
    },
    model: {
      prop: 'activeTab',
      event: 'change'
    },
    props: {
      tabItems: Array,
      tabPosition: {
        type: String,
        "default": 'top',
        validator: function validator(v) {
          return ['top', 'bottom', 'left', 'right'].indexOf(v) !== -1;
        }
      },
      modelControl: {
        type: String,
        "default": 'both',
        validator: function validator(v) {
          return ['both', 'external'].indexOf(v) !== -1;
        }
      },
      activeTab: String
    },
    data: function data() {
      return {
        activeName: ''
      };
    },
    computed: {
      direction: function direction() {
        return this.tabPosition === 'top' || this.tabPosition === 'bottom' ? 'row' : 'column';
      },
      items: function items() {
        return this.tabItems ? this.tabItems.map(function (item) {
          return lodash_isstring(item) ? {
            name: item
          } : item;
        }) : [];
      }
    },
    watch: {
      activeTab: {
        handler: function handler(value) {
          this.activeName = value;
        },
        immediate: true
      }
    },
    methods: {
      onTabClick: function onTabClick(item) {
        if (this.tabs) {
          this.tabs.select(item.name);
        } else {
          if (this.modelControl !== 'external') {
            this.activeName = item.name;
          }

          this.$emit('change', item.name);
        }
      }
    }
  };

  var __vue_script__$r = script$r;
  /* template */

  var __vue_render__$q = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-tabs-header mu-flex-box",
      attrs: {
        "tab-position": _vm.tabPosition,
        direction: _vm.direction
      }
    }, [_vm._t("header-prefix"), _vm._v(" "), _vm._l(_vm.items, function (item) {
      return _c("div", {
        key: item.name,
        staticClass: "mu-tab-item",
        attrs: {
          disabled: item.disabled,
          active: _vm.activeName === item.name
        },
        on: {
          click: function click($event) {
            return _vm.onTabClick(item);
          }
        }
      }, [_c("span", {
        staticClass: "mu-tab-label mu-text-ellipsis"
      }, [_vm._v("\n      " + _vm._s(item.label || item.name) + "\n    ")])]);
    }), _vm._v(" "), _vm._t("header-suffix")], 2);
  };

  var __vue_staticRenderFns__$q = [];
  __vue_render__$q._withStripped = true;
  /* style */

  var __vue_inject_styles__$r = undefined;
  /* scoped */

  var __vue_scope_id__$r = undefined;
  /* module identifier */

  var __vue_module_identifier__$r = undefined;
  /* functional template */

  var __vue_is_functional_template__$r = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$r = normalizeComponent_1({
    render: __vue_render__$q,
    staticRenderFns: __vue_staticRenderFns__$q
  }, __vue_inject_styles__$r, __vue_script__$r, __vue_scope_id__$r, __vue_is_functional_template__$r, __vue_module_identifier__$r, false, undefined, undefined, undefined);

  var script$s = {
    name: 'MusselTabs',
    components: {
      TabsHeader: __vue_component__$r
    },
    provide: function provide() {
      return {
        tabs: this,
        tabParams: this.tabParams
      };
    },
    model: {
      prop: 'activeTab',
      event: 'change'
    },
    props: {
      tabItems: Array,
      tabPosition: {
        type: String,
        "default": 'top',
        validator: function validator(v) {
          return ['top', 'bottom', 'left', 'right'].indexOf(v) !== -1;
        }
      },
      tabStyle: {
        type: String,
        "default": 'simple',
        validator: function validator(v) {
          return ['simple', 'card'].indexOf(v) !== -1;
        }
      },
      modelControl: {
        type: String,
        "default": 'both',
        validator: function validator(v) {
          return ['both', 'external'].indexOf(v) !== -1;
        }
      },
      activeTab: String
    },
    data: function data() {
      return {
        tabParams: {
          activeName: ''
        },
        mountedTabs: []
      };
    },
    computed: {
      direction: function direction() {
        var v;

        switch (this.tabPosition) {
          case 'left':
            v = 'row';
            break;

          case 'right':
            v = 'row-reverse';
            break;

          case 'bottom':
            v = 'column-reverse';
            break;

          default:
            v = 'column';
        }

        return v;
      },
      items: function items() {
        return this.tabItems || this.mountedTabs;
      }
    },
    watch: {
      activeTab: {
        handler: function handler(value) {
          this.tabParams.activeName = value;
        },
        immediate: true
      }
    },
    created: function created() {
      console.log(this);
    },
    methods: {
      mountTab: function mountTab(tab) {
        var idx = this.mountedTabs.findIndex(function (item) {
          return tab.name === item.name;
        });
        if (idx === -1) this.mountedTabs.push(tab);
      },
      unmountTab: function unmountTab(tab) {
        var idx = this.mountedTabs.findIndex(function (item) {
          return tab.name === item.name;
        });
        if (idx !== -1) this.mountedTabs.splice(idx, 1);
      },
      select: function select(name) {
        var tabParams = this.tabParams,
            modelControl = this.modelControl;

        if (modelControl !== 'external' && tabParams.activeName !== name) {
          tabParams.activeName = name;
        }

        this.$emit('change', name);
      }
    }
  };

  /* script */
  var __vue_script__$s = script$s;
  /* template */

  var __vue_render__$r = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-tabs mu-flex-box",
      attrs: {
        direction: _vm.direction,
        "tab-position": _vm.tabPosition
      }
    }, [_c("tabs-header", {
      attrs: {
        "tab-items": _vm.items,
        "tab-style": _vm.tabStyle,
        "active-tab": _vm.tabParams.activeName,
        "tab-position": _vm.tabPosition
      },
      scopedSlots: _vm._u([{
        key: "header-prefix",
        fn: function fn() {
          return [_vm._t("header-suffix")];
        },
        proxy: true
      }], null, true)
    }), _vm._v(" "), _vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$r = [];
  __vue_render__$r._withStripped = true;
  /* style */

  var __vue_inject_styles__$s = undefined;
  /* scoped */

  var __vue_scope_id__$s = undefined;
  /* module identifier */

  var __vue_module_identifier__$s = undefined;
  /* functional template */

  var __vue_is_functional_template__$s = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$s = normalizeComponent_1({
    render: __vue_render__$r,
    staticRenderFns: __vue_staticRenderFns__$r
  }, __vue_inject_styles__$s, __vue_script__$s, __vue_scope_id__$s, __vue_is_functional_template__$s, __vue_module_identifier__$s, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  var script$t = {
    name: 'MusselTabPanel',
    inject: {
      tabs: {
        "default": null
      },
      tabParams: {
        "default": null
      }
    },
    props: {
      name: String,
      label: String
    },
    computed: {
      visible: function visible() {
        var _this$tabParams;

        return ((_this$tabParams = this.tabParams) === null || _this$tabParams === void 0 ? void 0 : _this$tabParams.activeName) === this.name;
      }
    },
    mounted: function mounted() {
      var _this$tabs;

      (_this$tabs = this.tabs) === null || _this$tabs === void 0 ? void 0 : _this$tabs.mountTab({
        name: this.name,
        label: this.label
      });
    },
    beforeDestroy: function beforeDestroy() {
      var _this$tabs2;

      (_this$tabs2 = this.tabs) === null || _this$tabs2 === void 0 ? void 0 : _this$tabs2.unmountTab({
        name: this.name,
        label: this.label
      });
    }
  };

  /* script */
  var __vue_script__$t = script$t;
  /* template */

  var __vue_render__$s = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      directives: [{
        name: "show",
        rawName: "v-show",
        value: _vm.visible,
        expression: "visible"
      }],
      staticClass: "mu-tab-panel",
      attrs: {
        size: "1"
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$s = [];
  __vue_render__$s._withStripped = true;
  /* style */

  var __vue_inject_styles__$t = undefined;
  /* scoped */

  var __vue_scope_id__$t = undefined;
  /* module identifier */

  var __vue_module_identifier__$t = undefined;
  /* functional template */

  var __vue_is_functional_template__$t = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$t = normalizeComponent_1({
    render: __vue_render__$s,
    staticRenderFns: __vue_staticRenderFns__$s
  }, __vue_inject_styles__$t, __vue_script__$t, __vue_scope_id__$t, __vue_is_functional_template__$t, __vue_module_identifier__$t, false, undefined, undefined, undefined);

  var DropdownItem = {
    name: 'MusselDropdownItem',
    "extends": __vue_component__$k,
    inject: {
      dropdown: {
        "default": null
      },
      popupParams: {
        "default": null
      }
    },
    computed: {
      actualIcon: function actualIcon() {
        return this.icon || (this.actualSelected ? 'ok' : undefined);
      },
      actualIconIndent: function actualIconIndent() {
        var _this$popupParams;

        return !unsetOrFalse(this.iconIndent) || !unsetOrFalse((_this$popupParams = this.popupParams) === null || _this$popupParams === void 0 ? void 0 : _this$popupParams.iconIndent);
      }
    },
    watch: {
      actualIcon: {
        handler: function handler(value) {
          var params = this.popupParams || {
            iconIndent: true
          };
          var indent = params.iconIndent;

          if (value && !indent && indent !== false && indent !== 'false') {
            params.iconIndent = true;
          }
        },
        immediate: true
      }
    },
    methods: {
      onClick: function onClick() {
        var _this$dropdown;

        (_this$dropdown = this.dropdown) === null || _this$dropdown === void 0 ? void 0 : _this$dropdown.onItemClick({
          value: this.value,
          label: this.label
        });
        this.$emit('click');
      }
    }
  };

  var script$u = {
    name: 'MusselExpander',
    model: {
      prop: 'expanded',
      event: 'change'
    },
    props: {
      disabled: Boolean,
      expanded: Boolean,
      title: String
    },
    data: function data() {
      return {
        actualExpanded: false
      };
    },
    watch: {
      expanded: {
        handler: function handler(value) {
          this.actualExpanded = value;
        },
        immediate: true
      }
    },
    mounted: function mounted() {
      this.triggerElements = Array.prototype.slice.call(this.$el.querySelectorAll('[expand-trigger]'), 0);
    },
    methods: {
      findTrigger: function findTrigger(target) {
        return this.triggerElements.reduce(function (result, el) {
          return result || isParentElement(target, el, true);
        }, false);
      },
      onClick: function onClick(event) {
        if (this.disabled) return;

        if (!this.triggerElements.length || this.findTrigger(event.target)) {
          this.toggleExpand();
        }
      },
      toggleExpand: function toggleExpand() {
        this.actualExpanded = !this.actualExpanded;
        this.$emit('change', this.actualExpanded);
      }
    }
  };

  /* script */
  var __vue_script__$u = script$u;
  /* template */

  var __vue_render__$t = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-expander",
      attrs: {
        expanded: _vm.actualExpanded
      },
      on: {
        click: _vm.onClick
      }
    }, [_vm._t("header", [_c("div", {
      staticClass: "mu-expander-header",
      attrs: {
        "expand-trigger": ""
      }
    }, [_vm._v("\n      " + _vm._s(_vm.title) + "\n      "), _c("mu-icon", {
      staticStyle: {
        "margin-left": "8px"
      },
      attrs: {
        "trigger-type": "expander"
      }
    })], 1)]), _vm._v(" "), _c("div", {
      directives: [{
        name: "show",
        rawName: "v-show",
        value: !_vm.disabled,
        expression: "!disabled"
      }],
      staticClass: "mu-expand-panel",
      on: {
        click: function click($event) {
          $event.stopPropagation();
        }
      }
    }, [_vm._t("default")], 2)], 2);
  };

  var __vue_staticRenderFns__$t = [];
  __vue_render__$t._withStripped = true;
  /* style */

  var __vue_inject_styles__$u = undefined;
  /* scoped */

  var __vue_scope_id__$u = undefined;
  /* module identifier */

  var __vue_module_identifier__$u = undefined;
  /* functional template */

  var __vue_is_functional_template__$u = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$u = normalizeComponent_1({
    render: __vue_render__$t,
    staticRenderFns: __vue_staticRenderFns__$t
  }, __vue_inject_styles__$u, __vue_script__$u, __vue_scope_id__$u, __vue_is_functional_template__$u, __vue_module_identifier__$u, false, undefined, undefined, undefined);

  var script$v = {
    name: 'MusselBaseModal',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    props: {
      maskAction: {
        type: String,
        "default": 'close',
        validator: function validator(value) {
          return ['none', 'close'].indexOf(value) !== -1;
        }
      }
    },
    methods: {
      deactivate: function deactivate() {
        if (window.__mussel_modal === this) window.__mussel_modal = null;
      },
      onMaskClick: function onMaskClick(event) {
        if (event.target === this.$el) {
          var action = this.$options.maskAction || this.maskAction;
          if (action === 'close') this.hide();
          this.$emit('maskclick');
        }
      },
      show: function show() {
        window.__mussel_modal = this;
        this.popupVisible = true;
        this.$emit('show');
        this.$emit('change', true);
      },
      hide: function hide() {
        this.deactivate();
        this.popupVisible = false;
        this.$emit('hide');
        this.$emit('change', false);
      }
    }
  };

  /* script */
  var __vue_script__$v = script$v;
  /* template */

  /* style */

  var __vue_inject_styles__$v = undefined;
  /* scoped */

  var __vue_scope_id__$v = undefined;
  /* module identifier */

  var __vue_module_identifier__$v = undefined;
  /* functional template */

  var __vue_is_functional_template__$v = undefined;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$v = normalizeComponent_1({}, __vue_inject_styles__$v, __vue_script__$v, __vue_scope_id__$v, __vue_is_functional_template__$v, __vue_module_identifier__$v, false, undefined, undefined, undefined);

  var script$w = {
    name: 'MusselDialogWrapper',
    components: {
      'mu-v-box': VBox,
      'mu-close-button': __vue_component__$5
    },
    inject: ['dialog', 'params'],
    data: function data() {
      return {
        translateX: 0,
        translateY: 0,
        transitionDuration: '.2s'
      };
    },
    computed: {
      style: function style() {
        var _this$params = this.params,
            visible = _this$params.dialogVisible,
            width = _this$params.width,
            height = _this$params.height;
        var tx = this.translateX,
            ty = this.translateY,
            transitionDuration = this.transitionDuration;
        ty = visible ? ty : ty + 200;
        return {
          width: width,
          height: height,
          transitionDuration: transitionDuration,
          transform: "translate3d(".concat(tx, "px, ").concat(ty, "px, 0)")
        };
      }
    },
    methods: {
      onMaskClick: function onMaskClick(event) {
        if (!this.dragState) this.dialog.onMaskClick(event);
      },
      hide: function hide(btn) {
        this.dialog.hide(false, btn);
      },
      onButtonClick: function onButtonClick(btn) {
        this.dialog.onButtonClick(btn);
      },
      onDragStart: function onDragStart(event) {
        var target = event.target,
            pageX = event.pageX,
            pageY = event.pageY;
        var el = this.$el.querySelector('.mu-dialog');
        var isIcon = String(target.className).indexOf('mu-icon') !== -1;
        var isInput = target.tagName.toLowerCase() === 'input';
        if (!el || this.params.draggable === false || isIcon || isInput) return;
        this.dragState = {
          tx: this.translateX,
          ty: this.translateY,
          startX: pageX,
          startY: pageY,
          el: this.$el.querySelector('.mu-dialog')
        };
        this.transitionDuration = '0s';
        window.addEventListener('mousemove', this.onDragMove);
        window.addEventListener('mouseup', this.onDragEnd);
      },
      onDragMove: function onDragMove(event) {
        if (!this.dragState) return;
        var x = event.pageX,
            y = event.pageY;
        var _this$dragState = this.dragState,
            el = _this$dragState.el,
            tx = _this$dragState.tx,
            ty = _this$dragState.ty,
            startX = _this$dragState.startX,
            startY = _this$dragState.startY;

        var _getClientRect = getClientRect(el),
            top = _getClientRect.top,
            left = _getClientRect.left;

        var newX = tx + x - startX;
        var newY = ty + y - startY;

        if ((left > 0 || newX > this.translateX) && x < window.innerWidth) {
          this.translateX = newX;
        }

        if ((top > 0 || ty + y - startY > this.translateY) && y < window.innerHeight) {
          this.translateY = newY;
        }
      },
      onDragEnd: function onDragEnd(event) {
        var _this = this;

        if (!this.dragState) return;
        window.removeEventListener('mousemove', this.onDragMove);
        window.removeEventListener('mouseup', this.onDragEnd);
        this.transitionDuration = '.2s';
        setTimeout(function () {
          delete _this.dragState;
        }, 50);
      }
    }
  };

  /* script */
  var __vue_script__$w = script$w;
  /* template */

  var __vue_render__$u = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-v-box", {
      staticClass: "mu-modal-mask",
      attrs: {
        "flex-center": "",
        visible: _vm.params.modalVisible
      },
      nativeOn: {
        click: function click($event) {
          return _vm.onMaskClick($event);
        }
      }
    }, [_vm.params.keepAlive || _vm.params.modalVisible ? _c("mu-v-box", {
      directives: [{
        name: "show",
        rawName: "v-show",
        value: !_vm.params.keepAlive || _vm.params.modalVisible,
        expression: "!params.keepAlive || params.modalVisible"
      }],
      staticClass: "mu-dialog",
      style: _vm.style,
      attrs: {
        danger: _vm.params.danger,
        visible: _vm.params.dialogVisible
      }
    }, [_c("mu-h-box", {
      staticClass: "mu-dialog-header",
      attrs: {
        "align-items": "center"
      },
      nativeOn: {
        mousedown: function mousedown($event) {
          return _vm.onDragStart($event);
        }
      }
    }, [_c("mu-flex-item", {
      staticClass: "mu-dialog-title mu-text-ellipsis",
      attrs: {
        size: "auto"
      }
    }, [_vm._v("\n        " + _vm._s(_vm.params.title) + "\n      ")]), _vm._v(" "), _vm._t("header"), _vm._v(" "), _c("mu-close-button", {
      staticClass: "mu-text-color-subtitle",
      on: {
        click: function click($event) {
          return _vm.hide("$close");
        }
      }
    })], 2), _vm._v(" "), _c("mu-flex-item", {
      staticClass: "mu-dialog-body",
      attrs: {
        size: _vm.params.height ? "auto" : undefined
      }
    }, [_vm._t("default")], 2), _vm._v(" "), _vm.params.footer ? _c("mu-h-box", {
      staticClass: "mu-dialog-footer",
      attrs: {
        "align-items": "center"
      }
    }, [_vm._t("footer"), _vm._v(" "), _c("div", {
      staticStyle: {
        "margin-right": "auto"
      }
    }), _vm._v(" "), _vm._l(_vm.params.buttons, function (btn) {
      return _c("mu-button", _vm._b({
        key: btn.caption || btn.icon || btn.iconClass,
        on: {
          click: function click($event) {
            return _vm.onButtonClick(btn);
          }
        }
      }, "mu-button", btn, false));
    })], 2) : _vm._e()], 1) : _vm._e()], 1);
  };

  var __vue_staticRenderFns__$u = [];
  __vue_render__$u._withStripped = true;
  /* style */

  var __vue_inject_styles__$w = undefined;
  /* scoped */

  var __vue_scope_id__$w = undefined;
  /* module identifier */

  var __vue_module_identifier__$w = undefined;
  /* functional template */

  var __vue_is_functional_template__$w = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$w = normalizeComponent_1({
    render: __vue_render__$u,
    staticRenderFns: __vue_staticRenderFns__$u
  }, __vue_inject_styles__$w, __vue_script__$w, __vue_scope_id__$w, __vue_is_functional_template__$w, __vue_module_identifier__$w, false, undefined, undefined, undefined);

  function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  var script$x = {
    name: 'MusselBaseDialog',
    components: {
      'mu-dialog-wrapper': __vue_component__$w
    },
    "extends": __vue_component__$v,
    provide: function provide() {
      return {
        dialog: this,
        params: this.params
      };
    },
    props: {
      title: String,
      width: String,
      height: String,
      buttons: Array,
      danger: Boolean,
      keepAlive: Boolean,
      primaryButton: String,
      footer: {
        type: Boolean,
        "default": true
      },
      draggable: {
        type: Boolean,
        "default": true
      },
      modelControl: {
        type: String,
        "default": 'both',
        validator: function validator(v) {
          return ['both', 'external'].indexOf(v) !== -1;
        }
      }
    },
    data: function data() {
      var o = this.$options;
      return {
        params: {
          modalVisible: false,
          dialogVisible: false,
          width: this.width || o.width,
          height: this.height || o.height,
          danger: this.danger || o.danger,
          title: this.title || o.title,
          btns: this.btns,
          keepAlive: this.keepAlive || o.keepAlive,
          footer: this.footer !== false && o.footer !== false,
          primaryButton: this.primaryButton || o.primaryButton,
          draggable: !(this.draggable === false || o.draggable === false)
        }
      };
    },
    computed: {
      btns: function btns() {
        var _this = this;

        var buttons = this.buttons || this.$options.buttons;
        var primaryButton = this.params.primaryButton;
        return Array.isArray(buttons) ? buttons.map(function (button) {
          var btn = lodash_isstring(button) ? {
            caption: button,
            _rawData: button
          } : _objectSpread$1({}, button);

          if (primaryButton && !btn.buttonType && [btn.id, btn.caption].indexOf(primaryButton) !== -1) {
            btn.buttonType = _this.params.danger ? 'danger' : 'primary';
          }

          return btn;
        }) : null;
      }
    },
    watch: {
      // popupVisible (value) {
      //   this.params.modalVisible = value
      // },
      buttons: {
        handler: function handler() {
          this.params.buttons = this.btns;
        },
        immediate: true
      },
      title: function title(value) {
        this.setTitle(value);
      },
      width: function width(value) {
        this.setWidth(value);
      },
      height: function height(value) {
        this.setHeight(value);
      },
      danger: function danger(value) {
        this.setDanger(value);
      },
      primaryButton: function primaryButton(value) {
        this.setPrimaryButton(value);
      }
    },
    methods: {
      setTitle: function setTitle(value) {
        this.params.title = value;
      },
      setWidth: function setWidth(value) {
        this.params.width = value;
      },
      setHeight: function setHeight(value) {
        this.params.height = value;
      },
      setDanger: function setDanger(value) {
        this.params.danger = value;
        this.params.buttons = this.btns;
      },
      setPrimaryButton: function setPrimaryButton(value) {
        this.params.primaryButton = value;
        this.params.buttons = this.btns;
      },
      clearHideTimer: function clearHideTimer() {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }
      },
      show: function show() {
        var _this2 = this;

        window.__mussel_modal = this;
        this.clearHideTimer();
        this.popupVisible = true;

        if (!this.$el) {
          this.$mount();
          document.body.appendChild(this.$el);
        }

        this.params.modalVisible = true;
        setTimeout(function () {
          _this2.params.dialogVisible = true;
        }, 10);
        this.$emit('show');
        this.$emit('change', true);
      },
      actualHide: function actualHide(button) {
        var _this3 = this;

        this.clearHideTimer();
        this.popupVisible = false;
        this.params.dialogVisible = false;
        this.deactivate();
        this.$hideTimer = setTimeout(function () {
          _this3.params.modalVisible = false;
        }, 200);
        this.$emit('hide', button);

        if (this.visible !== false) {
          this.$emit('change', false, button);
        }
      },
      hide: function hide(force, button) {
        if (!force && this.$options.beforeClose) {
          this.$options.beforeClose(this.actualHide, button);
        } else if (!force && this.modelControl === 'external') {
          this.$emit('change', false, button);
        } else {
          this.actualHide(button);
        }
      },
      onButtonClick: function onButtonClick(btn) {
        var _Object = Object(btn),
            action = _Object.action,
            _rawData = _Object._rawData;

        var button = _rawData || btn;

        if (['hide', 'close'].indexOf(action) !== -1) {
          this.hide(false, button);
        }

        this.$emit('buttonclick', button, this);
      }
    }
  };

  /* script */
  var __vue_script__$x = script$x;
  /* template */

  /* style */

  var __vue_inject_styles__$x = undefined;
  /* scoped */

  var __vue_scope_id__$x = undefined;
  /* module identifier */

  var __vue_module_identifier__$x = undefined;
  /* functional template */

  var __vue_is_functional_template__$x = undefined;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$x = normalizeComponent_1({}, __vue_inject_styles__$x, __vue_script__$x, __vue_scope_id__$x, __vue_is_functional_template__$x, __vue_module_identifier__$x, false, undefined, undefined, undefined);

  //
  var script$y = {
    name: 'MusselModal',
    "extends": __vue_component__$v
  };

  /* script */
  var __vue_script__$y = script$y;
  /* template */

  var __vue_render__$v = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-modal-mask",
      attrs: {
        visible: _vm.popupVisible
      },
      on: {
        click: _vm.onMaskClick
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$v = [];
  __vue_render__$v._withStripped = true;
  /* style */

  var __vue_inject_styles__$y = undefined;
  /* scoped */

  var __vue_scope_id__$y = undefined;
  /* module identifier */

  var __vue_module_identifier__$y = undefined;
  /* functional template */

  var __vue_is_functional_template__$y = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$y = normalizeComponent_1({
    render: __vue_render__$v,
    staticRenderFns: __vue_staticRenderFns__$v
  }, __vue_inject_styles__$y, __vue_script__$y, __vue_scope_id__$y, __vue_is_functional_template__$y, __vue_module_identifier__$y, false, undefined, undefined, undefined);

  //
  var script$z = {
    name: 'MusselDialog',
    "extends": __vue_component__$x
  };

  /* script */
  var __vue_script__$z = script$z;
  /* template */

  var __vue_render__$w = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-dialog-wrapper", {
      scopedSlots: _vm._u([{
        key: "header",
        fn: function fn() {
          return [_vm._t("header")];
        },
        proxy: true
      }, {
        key: "footer",
        fn: function fn() {
          return [_vm._t("footer")];
        },
        proxy: true
      }], null, true)
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$w = [];
  __vue_render__$w._withStripped = true;
  /* style */

  var __vue_inject_styles__$z = undefined;
  /* scoped */

  var __vue_scope_id__$z = undefined;
  /* module identifier */

  var __vue_module_identifier__$z = undefined;
  /* functional template */

  var __vue_is_functional_template__$z = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$z = normalizeComponent_1({
    render: __vue_render__$w,
    staticRenderFns: __vue_staticRenderFns__$w
  }, __vue_inject_styles__$z, __vue_script__$z, __vue_scope_id__$z, __vue_is_functional_template__$z, __vue_module_identifier__$z, false, undefined, undefined, undefined);

  var script$A = {
    name: 'MusselMessageBox',
    "extends": __vue_component__$x,
    methods: {
      hide: function hide(button) {
        var _this = this;

        this.actualHide(button);
        setTimeout(function () {
          _this.$el.parentNode.removeChild(_this.$el);

          _this.$destroy();
        }, 500);
      },
      onButtonClick: function onButtonClick(button) {
        this.hide(button.id || button);
      }
    }
  };

  /* script */
  var __vue_script__$A = script$A;
  /* template */

  var __vue_render__$x = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-dialog-wrapper", {
      staticClass: "mu-message-box"
    }, [_c("div", {
      domProps: {
        innerHTML: _vm._s(_vm.message)
      }
    })]);
  };

  var __vue_staticRenderFns__$x = [];
  __vue_render__$x._withStripped = true;
  /* style */

  var __vue_inject_styles__$A = undefined;
  /* scoped */

  var __vue_scope_id__$A = undefined;
  /* module identifier */

  var __vue_module_identifier__$A = undefined;
  /* functional template */

  var __vue_is_functional_template__$A = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$A = normalizeComponent_1({
    render: __vue_render__$x,
    staticRenderFns: __vue_staticRenderFns__$x
  }, __vue_inject_styles__$A, __vue_script__$A, __vue_scope_id__$A, __vue_is_functional_template__$A, __vue_module_identifier__$A, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  var script$B = {
    name: 'MusselNotifier',
    data: function data() {
      return {
        counter: 0,
        items: []
      };
    },
    methods: {
      notify: function notify(notifyType, message) {
        var _this = this;

        var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3000;

        if (!isNaN(message) || !message && !timeout) {
          timeout = isNaN(message) ? 3000 : message;
          message = notifyType;
          notifyType = null;
        }

        var id = ++this.counter;
        this.items.unshift({
          id: id,
          message: message,
          notifyType: notifyType
        });
        setTimeout(function () {
          _this.dismiss(id);
        }, timeout);
      },
      dismiss: function dismiss(id) {
        var idx = this.items.findIndex(function (el) {
          return el.id === id;
        });
        if (idx !== -1) this.items.splice(idx, 1);
      }
    }
  };

  /* script */
  var __vue_script__$B = script$B;
  /* template */

  var __vue_render__$y = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("transition-group", {
      staticClass: "mu-notifier",
      attrs: {
        name: "mu-notifier",
        tag: "div"
      }
    }, _vm._l(_vm.items, function (item) {
      return _c("div", {
        key: item.id,
        staticClass: "mu-text-ellipsis",
        attrs: {
          "notify-type": item.notifyType
        }
      }, [_vm._v("\n    " + _vm._s(item.message) + "\n  ")]);
    }), 0);
  };

  var __vue_staticRenderFns__$y = [];
  __vue_render__$y._withStripped = true;
  /* style */

  var __vue_inject_styles__$B = undefined;
  /* scoped */

  var __vue_scope_id__$B = undefined;
  /* module identifier */

  var __vue_module_identifier__$B = undefined;
  /* functional template */

  var __vue_is_functional_template__$B = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$B = normalizeComponent_1({
    render: __vue_render__$y,
    staticRenderFns: __vue_staticRenderFns__$y
  }, __vue_inject_styles__$B, __vue_script__$B, __vue_scope_id__$B, __vue_is_functional_template__$B, __vue_module_identifier__$B, false, undefined, undefined, undefined);

  var alertTitle = isZh ? '提示' : 'Alert';
  var errorTitle = isZh ? '错误' : 'Error';
  var confirmTitle = isZh ? '确认提示' : 'Confirm';
  var warnTitle = isZh ? '确认警告' : 'Warning';
  var defaultButtons = [{
    id: 'ok',
    caption: isZh ? '确定' : 'OK',
    action: 'close'
  }, {
    id: 'cancel',
    caption: isZh ? '取消' : 'CANCEL',
    action: 'close'
  }, {
    id: 'yes',
    caption: isZh ? '是' : 'YES',
    action: 'close'
  }, {
    id: 'no',
    caption: isZh ? '否' : 'NO',
    action: 'close'
  }];
  function showMessage(options) {
    var title = options.title,
        message = options.message,
        buttons = options.buttons,
        primaryButton = options.primaryButton,
        danger = options.danger,
        callback = options.callback;
    var dialog = new Vue({
      "extends": __vue_component__$A,
      data: {
        message: message
      },
      title: title,
      danger: danger,
      buttons: buttons.map(function (btn) {
        return defaultButtons.find(function (item) {
          return item.id === btn;
        }) || btn;
      }),
      primaryButton: primaryButton === undefined ? buttons[0] : primaryButton
    });
    if (callback) dialog.$on('hide', callback);
    dialog.show();
  }
  function alert(message, callback) {
    showMessage({
      title: alertTitle,
      buttons: ['ok'],
      message: message,
      callback: callback
    });
  }
  function error(message, callback) {
    showMessage({
      title: errorTitle,
      buttons: ['ok'],
      danger: true,
      message: message,
      callback: callback
    });
  }
  function confirm(message, callback) {
    showMessage({
      title: confirmTitle,
      buttons: ['ok', 'cancel'],
      message: message,
      callback: callback
    });
  }
  function warn(message, callback) {
    showMessage({
      title: warnTitle,
      buttons: ['ok', 'cancel'],
      danger: true,
      message: message,
      callback: callback
    });
  }
  var notifier;
  function notify(notifyType, message, timeout) {
    if (!notifier) {
      notifier = new Vue(__vue_component__$B).$mount();
      document.body.appendChild(notifier.$el);
    }

    notifier.notify(notifyType, message, timeout);
  }

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  var script$C = {
    name: 'MusselSidebar',
    provide: function provide() {
      return {
        sidebar: this
      };
    },
    props: {
      floatable: Boolean,
      collapsible: Boolean,
      collapseButtonPosition: {
        type: String,
        validator: function validator(v) {
          return ['top', 'bottom'].indexOf(v) !== -1;
        }
      },
      width: {
        type: String,
        "default": '240px'
      }
    },
    data: function data() {
      return {
        floating: false,
        collapsed: false
      };
    },
    computed: {
      collapseBtnPosition: function collapseBtnPosition() {
        var _this$$slots = this.$slots,
            header = _this$$slots.header,
            footer = _this$$slots.footer;
        return this.collapsible ? this.collapseButtonPosition || (footer || !header ? 'bottom' : 'top') : '';
      },
      headerVisible: function headerVisible() {
        return this.$slots.header || this.collapsible && this.collapseBtnPosition === 'top';
      },
      footerVisible: function footerVisible() {
        return this.$slots.footer || this.collapsible && this.collapseBtnPosition === 'bottom';
      },
      sidebarWidth: function sidebarWidth() {
        return this.floating || this.collapsed ? undefined : this.width;
      },
      contentWidth: function contentWidth() {
        return this.collapsed ? undefined : this.width;
      }
    },
    methods: {
      toggleCollapse: function toggleCollapse() {
        if (this.floatable) {
          this.floating = !this.floating;
        } else {
          this.collapsed = !this.collapsed;
        }
      },
      clearHoverTimer: function clearHoverTimer() {
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
          delete this.hoverTimer;
        }
      },
      delayCollapse: function delayCollapse() {
        var _this = this;

        this.hoverTimer = setTimeout(function () {
          _this.collapsed = true;
        }, 500);
      },
      onCollapseBtnMouseOver: function onCollapseBtnMouseOver() {
        if (!this.floating) return;
        this.clearHoverTimer();
        this.collapsed = false;
      },
      onCollapseBtnMouseLeave: function onCollapseBtnMouseLeave() {
        if (!this.floating) return;
        this.clearHoverTimer();
        this.delayCollapse();
      }
    }
  };

  /* script */
  var __vue_script__$C = script$C;
  /* template */

  var __vue_render__$z = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-sidebar",
      style: {
        width: _vm.sidebarWidth
      },
      attrs: {
        floating: _vm.floating,
        collapsed: _vm.collapsed
      }
    }, [_c("div", {
      staticClass: "mu-sidebar_container mu-absolute-fit mu-flex-box",
      style: {
        width: _vm.contentWidth
      },
      attrs: {
        direction: "column"
      },
      on: {
        mouseleave: _vm.onCollapseBtnMouseLeave
      }
    }, [_vm.headerVisible ? _c("div", {
      staticClass: "mu-sidebar_header mu-flex-box"
    }, [_vm.collapseBtnPosition === "top" ? _c("a", {
      staticClass: "mu-sidebar_collapse-button mu-button-like",
      on: {
        mouseover: _vm.onCollapseBtnMouseOver,
        click: _vm.toggleCollapse
      }
    }, [_c("mu-icon", {
      attrs: {
        icon: "collapse"
      }
    })], 1) : _vm._e(), _vm._v(" "), !_vm.collapsed ? _vm._t("header") : _vm._e()], 2) : _vm._e(), _vm._v(" "), _c("div", {
      staticClass: "mu-sidebar_body",
      attrs: {
        size: "1"
      }
    }, [_c("div", {
      directives: [{
        name: "show",
        rawName: "v-show",
        value: !_vm.collapsed,
        expression: "!collapsed"
      }],
      staticClass: "mu-sidebar_body-container mu-absolute-fit"
    }, [_vm._t("default")], 2)]), _vm._v(" "), _vm.footerVisible ? _c("div", {
      staticClass: "mu-sidebar_footer mu-flex-box"
    }, [_vm.collapseBtnPosition === "bottom" ? _c("a", {
      staticClass: "mu-sidebar_collapse-button mu-button-like",
      "class": {
        "mu-text-color-success": !_vm.floating
      },
      on: {
        click: _vm.toggleCollapse
      }
    }, [_c("mu-icon", {
      attrs: {
        icon: "collapse"
      }
    })], 1) : _vm._e(), _vm._v(" "), !_vm.collapsed ? _vm._t("footer") : _vm._e()], 2) : _vm._e()])]);
  };

  var __vue_staticRenderFns__$z = [];
  __vue_render__$z._withStripped = true;
  /* style */

  var __vue_inject_styles__$C = undefined;
  /* scoped */

  var __vue_scope_id__$C = undefined;
  /* module identifier */

  var __vue_module_identifier__$C = undefined;
  /* functional template */

  var __vue_is_functional_template__$C = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$C = normalizeComponent_1({
    render: __vue_render__$z,
    staticRenderFns: __vue_staticRenderFns__$z
  }, __vue_inject_styles__$C, __vue_script__$C, __vue_scope_id__$C, __vue_is_functional_template__$C, __vue_module_identifier__$C, false, undefined, undefined, undefined);

  var script$D = {
    name: 'MusselSidebarMenu',
    "extends": __vue_component__$C,
    provide: function provide() {
      return {
        menu: this
      };
    },
    methods: {
      setActiveItem: function setActiveItem(item) {
        if (this.$activeItem !== item) {
          var _this$$activeItem;

          (_this$$activeItem = this.$activeItem) === null || _this$$activeItem === void 0 ? void 0 : _this$$activeItem.unselect();
          this.$activeItem = item;
        }
      }
    }
  };

  /* script */
  var __vue_script__$D = script$D;
  /* template */

  /* style */

  var __vue_inject_styles__$D = undefined;
  /* scoped */

  var __vue_scope_id__$D = undefined;
  /* module identifier */

  var __vue_module_identifier__$D = undefined;
  /* functional template */

  var __vue_is_functional_template__$D = undefined;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$D = normalizeComponent_1({}, __vue_inject_styles__$D, __vue_script__$D, __vue_scope_id__$D, __vue_is_functional_template__$D, __vue_module_identifier__$D, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  var script$E = {
    name: 'MusselMenuGroup',
    provide: function provide() {
      return {
        menuGroup: this
      };
    },
    inject: {
      sidebar: {
        "default": null
      },
      menuGroup: {
        "default": null
      }
    },
    props: {
      icon: String,
      iconClass: String,
      title: String
    },
    data: function data() {
      return {
        expanded: false
      };
    },
    computed: {
      isExpander: function isExpander() {
        return this.sidebar && !this.menuGroup;
      },
      isDropdown: function isDropdown() {
        return !this.sidebar && !this.menuGroup;
      }
    },
    methods: {
      onClick: function onClick() {
        if (!this.isExpander) return;
        this.toggleExpand();
      },
      onMouseOver: function onMouseOver() {
        if (!this.isDropdown) return;
      },
      onMouseLeave: function onMouseLeave() {
        if (!this.isDropdown) return;
      },
      expand: function expand() {
        this.expanded = true;
        var el = this.$el.querySelector('.mu-menu-group_body');
        if (el) el.style.maxHeight = el.scrollHeight + 'px';
      },
      collapse: function collapse() {
        this.expanded = false;
        var el = this.$el.querySelector('.mu-menu-group_body');
        if (el) el.style.maxHeight = 0;
      },
      toggleExpand: function toggleExpand() {
        return this.expanded ? this.collapse() : this.expand();
      }
    }
  };

  /* script */
  var __vue_script__$E = script$E;
  /* template */

  var __vue_render__$A = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-menu-group",
      attrs: {
        expanded: _vm.expanded
      }
    }, [_c("div", {
      staticClass: "mu-menu-group_header mu-button-like",
      on: {
        click: _vm.onClick,
        mouseover: _vm.onMouseOver,
        mouseleave: _vm.onMouseLeave
      }
    }, [_vm._t("header", [_c("mu-icon", {
      attrs: {
        icon: _vm.icon,
        "icon-class": _vm.iconClass
      }
    }), _vm._v("\n      " + _vm._s(_vm.title) + "\n    ")]), _vm._v(" "), _vm.isExpander || _vm.isDropdown ? _c("mu-icon", {
      attrs: {
        "trigger-type": "expander",
        "trigger-on": _vm.expanded
      }
    }) : _vm._e()], 2), _vm._v(" "), _vm.isDropdown ? [_c("div", {
      staticClass: "mu-menu-group_body"
    }, [_vm._t("default")], 2)] : [_c("div", {
      staticClass: "mu-menu-group_body"
    }, [_vm._t("default")], 2)]], 2);
  };

  var __vue_staticRenderFns__$A = [];
  __vue_render__$A._withStripped = true;
  /* style */

  var __vue_inject_styles__$E = undefined;
  /* scoped */

  var __vue_scope_id__$E = undefined;
  /* module identifier */

  var __vue_module_identifier__$E = undefined;
  /* functional template */

  var __vue_is_functional_template__$E = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$E = normalizeComponent_1({
    render: __vue_render__$A,
    staticRenderFns: __vue_staticRenderFns__$A
  }, __vue_inject_styles__$E, __vue_script__$E, __vue_scope_id__$E, __vue_is_functional_template__$E, __vue_module_identifier__$E, false, undefined, undefined, undefined);

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  var script$F = {
    name: 'MusselMenuItem',
    inject: {
      menu: {
        "default": null
      },
      menuGroup: {
        "default": null
      }
    },
    model: {
      prop: 'active',
      event: 'change'
    },
    props: {
      icon: String,
      iconClass: String,
      title: String,
      active: Boolean,
      disabled: Boolean
    },
    data: function data() {
      return {
        selected: false
      };
    },
    watch: {
      active: {
        handler: function handler(v) {
          if (!v === !this.selected) return;
          return v ? this.select() : this.unselect();
        },
        immediate: true
      }
    },
    mounted: function mounted() {
      var _this$menuGroup;

      if (this.active && ((_this$menuGroup = this.menuGroup) === null || _this$menuGroup === void 0 ? void 0 : _this$menuGroup.isExpander)) {
        this.menuGroup.expand();
      }
    },
    methods: {
      onClick: function onClick() {
        if (!this.disabled) {
          this.$emit('click');
          this.select();
        }
      },
      select: function select() {
        var _this$menu;

        this.selected = true;
        (_this$menu = this.menu) === null || _this$menu === void 0 ? void 0 : _this$menu.setActiveItem(this);
        if (!this.active) this.$emit('change', true);
      },
      unselect: function unselect() {
        this.selected = false;
        if (this.active) this.$emit('change', false);
      }
    }
  };

  /* script */
  var __vue_script__$F = script$F;
  /* template */

  var __vue_render__$B = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("a", {
      staticClass: "mu-menu-item mu-button-like",
      attrs: {
        disabled: _vm.disabled,
        active: _vm.selected
      },
      on: {
        click: _vm.onClick
      }
    }, [_vm._t("default", [_c("mu-icon", {
      attrs: {
        icon: _vm.icon,
        "icon-class": _vm.iconClass
      }
    }), _vm._v("\n    " + _vm._s(_vm.title) + "\n  ")])], 2);
  };

  var __vue_staticRenderFns__$B = [];
  __vue_render__$B._withStripped = true;
  /* style */

  var __vue_inject_styles__$F = undefined;
  /* scoped */

  var __vue_scope_id__$F = undefined;
  /* module identifier */

  var __vue_module_identifier__$F = undefined;
  /* functional template */

  var __vue_is_functional_template__$F = false;
  /* style inject */

  /* style inject SSR */

  /* style inject shadow dom */

  var __vue_component__$F = normalizeComponent_1({
    render: __vue_render__$B,
    staticRenderFns: __vue_staticRenderFns__$B
  }, __vue_inject_styles__$F, __vue_script__$F, __vue_scope_id__$F, __vue_is_functional_template__$F, __vue_module_identifier__$F, false, undefined, undefined, undefined);

  function install() {
    Vue.component('mu-flex-box', __vue_component__$1);
    Vue.component('mu-flex-item', __vue_component__);
    Vue.component('mu-h-box', HBox);
    Vue.component('mu-v-box', VBox);
    Vue.component('mu-space', __vue_component__$2);
    Vue.component('mu-splitter', __vue_component__$3);
    Vue.component('mu-icon', __vue_component__$4);
    Vue.component('mu-button', Button);
    Vue.component('mu-icon-button', IconButton);
    Vue.component('mu-close-button', __vue_component__$5);
    Vue.component('mu-button-group', __vue_component__$6);
    Vue.component('mu-split-button', __vue_component__$7);
    Vue.component('mu-dropdown-button', __vue_component__$a);
    Vue.component('mu-input', __vue_component__$b);
    Vue.component('mu-editor', __vue_component__$d);
    Vue.component('mu-button-editor', __vue_component__$f);
    Vue.component('mu-popup-editor', __vue_component__$h);
    Vue.component('mu-color-editor', __vue_component__$g);
    Vue.component('mu-date-editor', __vue_component__$j);
    Vue.component('mu-combo-box', __vue_component__$l);
    Vue.component('mu-option', Option);
    Vue.component('mu-form', __vue_component__$m);
    Vue.component('mu-form-field', __vue_component__$n);
    Vue.component('mu-toggle', __vue_component__$o);
    Vue.component('mu-list-item', __vue_component__$k);
    Vue.component('mu-list-divider', __vue_component__$p);
    Vue.component('mu-bar', __vue_component__$q);
    Vue.component('mu-tabs', __vue_component__$s);
    Vue.component('mu-tabs-header', __vue_component__$r);
    Vue.component('mu-tab-panel', __vue_component__$t);
    Vue.component('mu-dropdown', __vue_component__$9);
    Vue.component('mu-dropdown-item', DropdownItem);
    Vue.component('mu-dropdown-panel', __vue_component__$8);
    Vue.component('mu-expander', __vue_component__$u);
    Vue.component('mu-base-modal', __vue_component__$v);
    Vue.component('mu-base-dialog', __vue_component__$x);
    Vue.component('mu-modal', __vue_component__$y);
    Vue.component('mu-dialog', __vue_component__$z);
    Vue.component('mu-dialog-wrapper', __vue_component__$w);
    Vue.component('mu-calendar', __vue_component__$i);
    Vue.component('mu-sidebar-menu', __vue_component__$D);
    Vue.component('mu-menu-group', __vue_component__$E);
    Vue.component('mu-menu-item', __vue_component__$F);
  }

  if (Vue) install();
  var showMessage$1 = showMessage,
      alert$1 = alert,
      error$1 = error,
      confirm$1 = confirm,
      warn$1 = warn,
      notify$1 = notify;

  exports.Bar = __vue_component__$q;
  exports.BaseDialog = __vue_component__$x;
  exports.BaseEditor = BaseEditor;
  exports.BaseModal = __vue_component__$v;
  exports.BasePopupEditor = BasePopupEditor;
  exports.Button = Button;
  exports.ButtonEditor = __vue_component__$f;
  exports.ButtonGroup = __vue_component__$6;
  exports.Calendar = __vue_component__$i;
  exports.CloseButton = __vue_component__$5;
  exports.ColorEditor = __vue_component__$g;
  exports.ComboBox = __vue_component__$l;
  exports.DateEditor = __vue_component__$j;
  exports.Dialog = __vue_component__$z;
  exports.DialogWrapper = __vue_component__$w;
  exports.Dropdown = __vue_component__$9;
  exports.DropdownButton = __vue_component__$a;
  exports.DropdownItem = DropdownItem;
  exports.DropdownPanel = __vue_component__$8;
  exports.Editor = __vue_component__$d;
  exports.Expander = __vue_component__$u;
  exports.FlexBox = __vue_component__$1;
  exports.FlexItem = __vue_component__;
  exports.Form = __vue_component__$m;
  exports.FormField = __vue_component__$n;
  exports.HBox = HBox;
  exports.Icon = __vue_component__$4;
  exports.IconButton = IconButton;
  exports.Input = __vue_component__$b;
  exports.ListDivider = __vue_component__$p;
  exports.ListItem = __vue_component__$k;
  exports.MenuGroup = __vue_component__$E;
  exports.MenuItem = __vue_component__$F;
  exports.Modal = __vue_component__$y;
  exports.Option = Option;
  exports.PopupEditor = __vue_component__$h;
  exports.PopupGroupMixin = PopupGroupMixin;
  exports.SidebarMenu = __vue_component__$D;
  exports.Space = __vue_component__$2;
  exports.SplitButton = __vue_component__$7;
  exports.Splitter = __vue_component__$3;
  exports.TabPanel = __vue_component__$t;
  exports.Tabs = __vue_component__$s;
  exports.TabsHeader = __vue_component__$r;
  exports.Toggle = __vue_component__$o;
  exports.VBox = VBox;
  exports.alert = alert$1;
  exports.confirm = confirm$1;
  exports.error = error$1;
  exports.install = install;
  exports.notify = notify$1;
  exports.registerIcons = register;
  exports.showMessage = showMessage$1;
  exports.warn = warn$1;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
