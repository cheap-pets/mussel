# Input & Editor



## Input

Base input component, for building complex editors.



### Examples

-



### API

#### Name

* Component Name:  `MusselInput`
* Element Tag Name:  `mu-input`



#### Attributes

| name        | description           | type            | accepted values            | default |
| ----------- | --------------------- | --------------- | -------------------------- | ------- |
| type        | input (value) type    | String          | text / number / date / ... | text    |
| value       | input value           | String / Number |                            | -       |
| readonly    | readonly status       | Boolean         |                            | false   |
| disabled    | disabled status       | Boolean         |                            | false   |
| input-shape | input shape           | String          | round / -                  | -       |
| placeholder | placeholder text      | String          |                            | -       |
| invalid     | verify failure status | Boolean         |                            | false   |



#### Events

| name     | description                | arguments               |
| -------- | -------------------------- | ----------------------- |
| input    | emitted when input         | value                   |
| change   | emitted when value changed | value                   |
| enterkey | emitted when enter pressed | this input (vue object) |
| esckey   | emitted when esc pressed   | this input (vue object) |



## Editor

Input component, with extra icon and clearable.



### API

#### Name

* Component Name:  `MusselEditor`
* Element Tag Name:  `mu-editor`



#### Attributes

| name          | description               | type            | accepted values            | default  |
| ------------- | ------------------------- | --------------- | -------------------------- | -------- |
| type          | input (value) type        | String          | text / number / date / ... | text     |
| value         | input value               | String / Number |                            | -        |
| readonly      | readonly status           | Boolean         |                            | false    |
| disabled      | disabled status           | Boolean         |                            | false    |
| input-shape   | input shape               | String          | round / -                  | -        |
| placeholder   | placeholder text          | String          |                            | -        |
| icon          | input button icon         |                 |                            |          |
| icon-class    | input button icon class   |                 |                            |          |
| icon-position | input button position     | String          | left / right               | left     |
| trigger-type  | input button trigger type | String          |                            | ellipsis |
| editable      | can input by keyboard     | Boolean         |                            | true     |
| clearable     | display clear button      | Boolean         |                            | true     |
| invalid       | verify failure status     | Boolean         |                            | false    |



#### Events

| name     | description                  | arguments                     |
| -------- | ---------------------------- | ----------------------------- |
| input    | emitted when input           | value                         |
| change   | emitted when value changed   | value                         |
| enterkey | emitted when enter pressed   | this input (vue object)       |
| esckey   | emitted when esc pressed     | this input (vue object)       |
| keypress | emitted when any key pressed | event (native keypress event) |



## Button Editor

Input component, with extra button and clearable.



### API

#### Name

* Component Name:  `MusselButtonEditor`
* Element Tag Name:  `mu-button-editor`



#### Attributes

same as `MusselEditor`



#### Events

same as `MusselEditor`

