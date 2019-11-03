# Calendar

Date panel for picking date or display events



### Examples

-


### API

#### Name

* Export Name:  `Calendar`
* Component Name:  `MusselCalendar`
* Element Tag Name:  `mu-calendar`



#### Attributes

| name         | description                        | type    | accepted values     | default |
| ------------ | ---------------------------------- | ------- | ------------------- | ------- |
| marked-dates | date that marked with a small flag | Array   |                     | []      |
| readonly     | readonly status                    | Boolean |                     | false   |
| range-end    | earliest date that can be selected | Date    |                     | -       |
| range-start  | latest date that can be selected   | Date    |                     | -       |
| select-mode  | pick date, month, or year          | String  | year / month / date | date    |
| value        | input value                        | Date    | String, Date        | -       |



#### Model

| prop  | event  |
| ----- | ------ |
| value | change |



#### Events

| name        | description                         | arguments   |
| ----------- | ----------------------------------- | ----------- |
| change      | emitted when value changed          | value       |
| navigate    | emitted after year or month changed | year, month |
| updatecells | emitted after cells data updated    | year, month |

