# Expander

Component with folding content.



### Examples

-




### API

#### Name

* Export Name:  `Expander`
* Component Name:  `MusselExpander`
* Element Tag Name:  `mu-expander





#### Attributes

| name     | description                   | type    | accepted values | default |
| -------- | ----------------------------- | ------- | --------------- | ------- |
| disabled | disabled                      | Boolean |                 | false   |
| expanded | visibility of folding content | Boolean |                 | false   |
| title    | caption of default header     | String  |                 | -       |



#### Model

| prop     | event  |
| -------- | ------ |
| expanded | change |




#### Events

| name   | description                         | arguments |
| ------ | ----------------------------------- | --------- |
| change | emitted after expanded or collapsed | expanded  |



#### Slots

| name      | description              | accepted content |
| --------- | ------------------------ | ---------------- |
| (default) | slot for folding content | Any              |
| dropdown  | slot for trigger content | Any              |

