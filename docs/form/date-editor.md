# Date Editor

Date picker



### Examples

-


### API

#### Name

* Export Name:  `DateEditor`
* Component Name:  `MusselDateEditor`
* Element Tag Name:  `mu-date-editor`

#### Attributes

| name                 | description                        | type    | accepted values             | default                                |
| -------------------- | ---------------------------------- | ------- | --------------------------- | -------------------------------------- |
| clearable            | display clear button               | Boolean |                             | true                                   |
| disabled             | disabled status                    | Boolean |                             | false                                  |
| editable             | can input by keyboard              | Boolean |                             | false                                  |
| format               | date display format                | String  |                             | yyyy-MM-dd <br>(depend on select-mode) |
| icon-position        | input button position              | String  | left / right                | left                                   |
| input-shape          | input shape                        | String  | round / -                   | -                                      |
| invalid              | verify failure status              | Boolean |                             | false                                  |
| marked-dates         | date that marked with a small flag | Array   |                             | []                                     |
| placeholder          | placeholder text                   | String  |                             | -                                      |
| popup-width          | width of popup panel               | String  | size value / auto / inherit | auto                                   |
| popup-height         | height of popup panel              | String  | size value                  | -                                      |
| popup-render-to-body | render popup panel as root element | Boolean |                             | true                                   |
| readonly             | readonly status                    | Boolean |                             | false                                  |
| range-end            | earliest date that can be selected | Date    |                             | -                                      |
| range-start          | latest date that can be selected   | Date    |                             | -                                      |
| select-mode          | pick date, month, or year          | String  | year / month / date         | date                                   |
| value                | input value                        | Date    | String, Date                | -                                      |



#### Events

| name     | description                  | arguments                     |
| -------- | ---------------------------- | ----------------------------- |
| change   | emitted when value changed   | value                         |
| enterkey | emitted when enter pressed   | this input (vue object)       |
| esckey   | emitted when esc pressed     | this input (vue object)       |
| input    | emitted when input           | value                         |
| keypress | emitted when any key pressed | event (native keypress event) |

