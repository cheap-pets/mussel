## Combo Box

Input component, with a popup panel.



### Examples

-



### API

#### Name

* Component Name:  `MusselComboBox`
* Element Tag Name:  `mu-combo-box`



#### Attributes

| name                 | description                        | type        | accepted values             | default |
| -------------------- | ---------------------------------- | ----------- | --------------------------- | ------- |
| type                 | input (value) type                 | String      | text / number / date / ...  | text    |
| value                | input value                        | Any / Array |                             | -       |
| readonly             | readonly status                    | Boolean     |                             | false   |
| disabled             | disabled status                    | Boolean     |                             | false   |
| input-shape          | input shape                        | String      | round / -                   | -       |
| placeholder          | placeholder text                   | String      |                             | -       |
| icon-position        | input button position              | String      | left / right                | left    |
| editable             | can input by keyboard              | Boolean     |                             | false   |
| clearable            | display clear button               | Boolean     |                             | true    |
| invalid              | verify failure status              | Boolean     |                             | false   |
| popup-width          | width of popup panel               | String      | size value / auto / inherit | inherit |
| popup-height         | height of popup panel              | String      | size value                  | -       |
| popup-render-to-body | render popup panel as root element | Boolean     |                             | true    |
| fields               | option fields definition           | Object      |                             | -       |
| options              | combo options                      | Array       |                             | -       |
| multiple             | multiple select                    | Boolean     |                             | false   |



#### Events

| name        | description                  | arguments                     |
| ----------- | ---------------------------- | ----------------------------- |
| input       | emitted when input           | value                         |
| change      | emitted when value changed   | value                         |
| enterkey    | emitted when enter pressed   | this input (vue object)       |
| esckey      | emitted when esc pressed     | this input (vue object)       |
| keypress    | emitted when any key pressed | event (native keypress event) |
| optionclick | emitted when option clicked  | value, option                 |



#### Slots

| name      | description      | accepted content |
| --------- | ---------------- | ---------------- |
| (default) | slot for options | mu-option        |



## Combo Box Option

Option item within Combo Box



### API

#### Name

* Component Name:  `MusselOption`
* Element Tag Name:  `mu-option`

#### Attributes

| name        | description                              | type    | accepted values | default |
| ----------- | ---------------------------------------- | ------- | --------------- | ------- |
| value       | option value                             | Any     |                 | -       |
| label       | option label text                        | String  |                 | -       |
| disabled    | disabled status                          | Boolean |                 | false   |
| icon        | option icon                              |         |                 |         |
| icon-class  | option icon class                        |         |                 |         |
| icon-indent | keep icon indent                         | Boolean |                 | -       |
| fields      | option fields definition                 | Object  |                 | -       |
| selected    | selected status                          | Boolean |                 | false   |
| option      | option data, including value, label, ... | Object  |                 | -       |



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

