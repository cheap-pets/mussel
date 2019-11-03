# Input & Editor



## Input

Base input component, for building complex editors.



### Examples

-




### API

#### Name

* Export Name:  `Input`
* Component Name:  `MusselInput`
* Element Tag Name:  `mu-input`



#### Attributes

| name        | description           | type            | accepted values            | default |
| ----------- | --------------------- | --------------- | -------------------------- | ------- |
| disabled    | disabled status       | Boolean         |                            | false   |
| input-shape | input shape           | String          | round / -                  | -       |
| invalid     | verify failure status | Boolean         |                            | false   |
| placeholder | placeholder text      | String          |                            | -       |
| readonly    | readonly status       | Boolean         |                            | false   |
| type        | input (value) type    | String          | text / number / date / ... | text    |
| value       | input value           | String / Number |                            | -       |



#### Model

| prop  | event  |
| ----- | ------ |
| value | change |



#### Events

| name     | description                | arguments               |
| -------- | -------------------------- | ----------------------- |
| change   | emitted when value changed | value                   |
| enterkey | emitted when enter pressed | this input (vue object) |
| esckey   | emitted when esc pressed   | this input (vue object) |
| input    | emitted when input         | value                   |



## Editor

Input component, with extra icon and clearable.



### API

#### Name

* Export Name:  `Editor`
* Component Name:  `MusselEditor`
* Element Tag Name:  `mu-editor`



#### Attributes

| name          | description               | type            | accepted values            | default  |
| ------------- | ------------------------- | --------------- | -------------------------- | -------- |
| clearable     | display clear button      | Boolean         |                            | true     |
| disabled      | disabled status           | Boolean         |                            | false    |
| editable      | can input by keyboard     | Boolean         |                            | true     |
| icon          | input button icon         |                 |                            |          |
| icon-class    | input button icon class   |                 |                            |          |
| icon-position | input button position     | String          | left / right               | left     |
| input-shape   | input shape               | String          | round / -                  | -        |
| invalid       | verify failure status     | Boolean         |                            | false    |
| placeholder   | placeholder text          | String          |                            | -        |
| readonly      | readonly status           | Boolean         |                            | false    |
| trigger-type  | input button trigger type | String          |                            | ellipsis |
| type          | input (value) type        | String          | text / number / date / ... | text     |
| value         | input value               | String / Number |                            | -        |



#### Model

| prop  | event  |
| ----- | ------ |
| value | change |



#### Events

| name     | description                  | arguments                     |
| -------- | ---------------------------- | ----------------------------- |
| change   | emitted when value changed   | value                         |
| enterkey | emitted when enter pressed   | this input (vue object)       |
| esckey   | emitted when esc pressed     | this input (vue object)       |
| input    | emitted when input           | value                         |
| keypress | emitted when any key pressed | event (native keypress event) |



## Button Editor

Input component, with extra button and clearable.



### API

#### Name

* Export Name:  `ButtonEditor`
* Component Name:  `MusselButtonEditor`
* Element Tag Name:  `mu-button-editor`



#### Attributes

same as `MusselEditor`



#### Events

same as `MusselEditor`

