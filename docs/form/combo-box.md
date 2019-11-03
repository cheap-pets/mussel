## Combo Box

Input component, with dropdown options.



### Examples

-



### API

#### Extend & Mixins

* Extend: `MusselBasePopupEditor`



#### Name

* Export Name:  `ComboBox`
* Component Name:  `MusselComboBox`
* Element Tag Name:  `mu-combo-box`



#### Attributes

| name                 | description                        | type        | accepted values             | default |
| -------------------- | ---------------------------------- | ----------- | --------------------------- | ------- |
| clearable            | display clear button               | Boolean     |                             | true    |
| disabled             | disabled status                    | Boolean     |                             | false   |
| editable             | can input by keyboard              | Boolean     |                             | false   |
| fields               | option fields definition           | Object      |                             | -       |
| icon-position        | input button position              | String      | left / right                | left    |
| input-shape          | input shape                        | String      | round / -                   | -       |
| invalid              | verify failure status              | Boolean     |                             | false   |
| multiple             | multiple select                    | Boolean     |                             | false   |
| options              | combo options                      | Array       |                             | -       |
| placeholder          | placeholder text                   | String      |                             | -       |
| popup-width          | width of popup panel               | String      | size value / auto / inherit | inherit |
| popup-height         | height of popup panel              | String      | size value                  | -       |
| popup-render-to-body | render popup panel as root element | Boolean     |                             | true    |
| readonly             | readonly status                    | Boolean     |                             | false   |
| type                 | input (value) type                 | String      | text / number / date / ...  | text    |
| value                | input value                        | Any / Array |                             | -       |



#### Events

| name        | description                  | arguments                     |
| ----------- | ---------------------------- | ----------------------------- |
| change      | emitted when value changed   | value                         |
| enterkey    | emitted when enter pressed   | this input (vue object)       |
| esckey      | emitted when esc pressed     | this input (vue object)       |
| input       | emitted when input           | value                         |
| keypress    | emitted when any key pressed | event (native keypress event) |
| optionclick | emitted when option clicked  | value, option                 |



#### Slots

| name      | description      | accepted content |
| --------- | ---------------- | ---------------- |
| (default) | slot for options | mu-option        |



## Combo Box Option

Option item within Combo Box



### API

#### Extend & Mixins

* Extend: `MusselListItem`



#### Name

* Export Name:  `Option`
* Component Name:  `MusselOption`
* Element Tag Name:  `mu-option`



#### Attributes

| name        | description                              | type    | accepted values | default |
| ----------- | ---------------------------------------- | ------- | --------------- | ------- |
| disabled    | disabled status                          | Boolean |                 | false   |
| fields      | option fields definition                 | Object  |                 | -       |
| icon        | option icon                              |         |                 |         |
| icon-class  | option icon class                        |         |                 |         |
| icon-indent | keep icon indent                         | Boolean |                 | -       |
| label       | option label text                        | String  |                 | -       |
| option      | option data, including value, label, ... | Object  |                 | -       |
| selected    | selected status                          | Boolean |                 | false   |
| value       | option value                             | Any     |                 | -       |



#### Injection

| name     | description                       | default |
| -------- | --------------------------------- | ------- |
| editor   | owner editor                      | null    |
| multiple | owner editor's multiple attribute | false   |



#### Events

| name  | description                 | arguments |
| ----- | --------------------------- | --------- |
| click | emitted when option clicked | -         |



#### Slots

| name      | description             | accepted content |
| --------- | ----------------------- | ---------------- |
| (default) | slot for option content | Any              |

