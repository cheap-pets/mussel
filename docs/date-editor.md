## Date Editor

Date picker



### Examples

-



### API

#### Name

* Component Name:  `MusselDateEditor`
* Element Tag Name:  `mu-date-editor`

#### Attributes

| name                 | description                        | type    | accepted values             | default                                |
| -------------------- | ---------------------------------- | ------- | --------------------------- | -------------------------------------- |
| value                | input value                        | Date    | String, Date                | -                                      |
| readonly             | readonly status                    | Boolean |                             | false                                  |
| disabled             | disabled status                    | Boolean |                             | false                                  |
| input-shape          | input shape                        | String  | round / -                   | -                                      |
| placeholder          | placeholder text                   | String  |                             | -                                      |
| icon-position        | input button position              | String  | left / right                | left                                   |
| editable             | can input by keyboard              | Boolean |                             | false                                  |
| clearable            | display clear button               | Boolean |                             | true                                   |
| invalid              | verify failure status              | Boolean |                             | false                                  |
| popup-width          | width of popup panel               | String  | size value / auto / inherit | auto                                   |
| popup-height         | height of popup panel              | String  | size value                  | -                                      |
| popup-render-to-body | render popup panel as root element | Boolean |                             | true                                   |
| select-mode          | pick date, month, or year          | String  | year / month / date         | date                                   |
| format               | date display format                | String  |                             | yyyy-MM-dd <br>(depend on select-mode) |
| range-start          | latest date that can be selected   | Date    |                             | -                                      |
| range-end            | earliest date that can be selected | Date    |                             | -                                      |
| marked-dates         | date that marked with a small flag | Array   |                             | []                                     |



#### Events

| name     | description                  | arguments                     |
| -------- | ---------------------------- | ----------------------------- |
| input    | emitted when input           | value                         |
| change   | emitted when value changed   | value                         |
| enterkey | emitted when enter pressed   | this input (vue object)       |
| esckey   | emitted when esc pressed     | this input (vue object)       |
| keypress | emitted when any key pressed | event (native keypress event) |


