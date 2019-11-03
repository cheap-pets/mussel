# Dialog

Popup window, within a modal mask.



### Examples

-




### API

#### Name

* Export Name:  `Dialog`
* Component Name:  `MusselDialog`
* Element Tag Name:  `mu-dialog`



#### Extend & Mixins

* extends: `BaseDialog`



#### Attributes

| name           | description                | type    | accepted values | default |
| -------------- | -------------------------- | ------- | --------------- | ------- |
| buttons        | buttons in footer          | Array   |                 | []      |
| danger         | danger style               | Boolean |                 | false   |
| height         | height value               | String  |                 | -       |
| primary-button | name of the primary button | String  |                 | String  |
| title          | caption in header          | String  |                 | -       |
| visible        | hidden or visible          | Boolean |                 | false   |
| width          | width value                | String  |                 | -       |



#### Model

| prop    | event  |
| ------- | ------ |
| visible | change |



#### Provide

| name   | description |
| ------ | ----------- |
| dialog | this dialog |



#### Methods

| name | description            | arguments |
| ---- | ---------------------- | --------- |
| show | make the modal visible | -         |
| hide | make the modal hidden  | -         |



#### Events

| name        | description                          | arguments      |
| ----------- | ------------------------------------ | -------------- |
| buttonclick | emitted after button click           | button, dialog |
| change      | emitted after visible status changed | visible        |
| show        | emitted after show                   |                |
| hide        | emitted after hide                   |                |



#### Slots

| name      | description            | accepted content |
| --------- | ---------------------- | ---------------- |
| (default) | slot for modal content | Any              |



