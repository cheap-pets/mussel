## Popup Editor

Input component, with a popup panel.



### Examples

-



### API

#### Name

* Component Name:  `MusselPopupEditor`
* Element Tag Name:  `mu-popup-editor`



#### Attributes

| name                 | description                        | type            | accepted values             | default  |
| -------------------- | ---------------------------------- | --------------- | --------------------------- | -------- |
| type                 | input (value) type                 | String          | text / number / date / ...  | text     |
| value                | input value                        | String / Number |                             | -        |
| readonly             | readonly status                    | Boolean         |                             | false    |
| disabled             | disabled status                    | Boolean         |                             | false    |
| input-shape          | input shape                        | String          | round / -                   | -        |
| placeholder          | placeholder text                   | String          |                             | -        |
| icon                 | input button icon                  |                 |                             |          |
| icon-class           | input button icon class            |                 |                             |          |
| icon-position        | input button position              | String          | left / right                | left     |
| trigger-type         | input button trigger type          | String          |                             | dropdown |
| editable             | can input by keyboard              | Boolean         |                             | false    |
| clearable            | display clear button               | Boolean         |                             | true     |
| invalid              | verify failure status              | Boolean         |                             | false    |
| popup-width          | width of popup panel               | String          | size value / auto / inherit | inherit  |
| popup-height         | height of popup panel              | String          | size value                  | -        |
| popup-render-to-body | render popup panel as root element | Boolean         |                             | true     |



#### Events

| name     | description                  | arguments                     |
| -------- | ---------------------------- | ----------------------------- |
| input    | emitted when input           | value                         |
| change   | emitted when value changed   | value                         |
| enterkey | emitted when enter pressed   | this input (vue object)       |
| esckey   | emitted when esc pressed     | this input (vue object)       |
| keypress | emitted when any key pressed | event (native keypress event) |



#### Slots

| name      | description            | accepted content |
| --------- | ---------------------- | ---------------- |
| (default) | slot for popup content | Any              |

