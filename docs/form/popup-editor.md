# Popup Editor

Input component, with a popup panel.



### Examples

-



### API

#### Name

* Export Name:  `PopupEditor`
* Component Name:  `MusselPopupEditor`
* Element Tag Name:  `mu-popup-editor`



#### Attributes

| name                 | description                        | type            | accepted values             | default  |
| -------------------- | ---------------------------------- | --------------- | --------------------------- | -------- |
| clearable            | display clear button               | Boolean         |                             | true     |
| disabled             | disabled status                    | Boolean         |                             | false    |
| editable             | can input by keyboard              | Boolean         |                             | false    |
| icon                 | input button icon                  |                 |                             |          |
| icon-class           | input button icon class            |                 |                             |          |
| icon-position        | input button position              | String          | left / right                | left     |
| input-shape          | input shape                        | String          | round / -                   | -        |
| invalid              | verify failure status              | Boolean         |                             | false    |
| placeholder          | placeholder text                   | String          |                             | -        |
| popup-height         | height of popup panel              | String          | size value                  | -        |
| popup-render-to-body | render popup panel as root element | Boolean         |                             | true     |
| popup-width          | width of popup panel               | String          | size value / auto / inherit | inherit  |
| readonly             | readonly status                    | Boolean         |                             | false    |
| trigger-type         | input button trigger type          | String          |                             | dropdown |
| type                 | input (value) type                 | String          | text / number / date / ...  | text     |
| value                | input value                        | String / Number |                             | -        |



#### Events

| name     | description                  | arguments                     |
| -------- | ---------------------------- | ----------------------------- |
| change   | emitted when value changed   | value                         |
| enterkey | emitted when enter pressed   | this input (vue object)       |
| esckey   | emitted when esc pressed     | this input (vue object)       |
| input    | emitted when input           | value                         |
| keypress | emitted when any key pressed | event (native keypress event) |



#### Slots

| name      | description            | accepted content |
| --------- | ---------------------- | ---------------- |
| (default) | slot for popup content | Any              |

