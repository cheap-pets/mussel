# Dropdown



## Dropdown

Tap or hover the trigger, and make something popup



### Examples

-




### API

#### Name

* Export Name:  `Dropdown`
* Component Name:  `MusselDropdown`
* Element Tag Name:  `mu-dropdown`



#### Extend & Mixins

* Mixins: `PopupGroupMixin`



#### Attributes

| name                 | description                        | type    | accepted values                     | default       |
| -------------------- | ---------------------------------- | ------- | ----------------------------------- | ------------- |
| disabled             | disabled                           | Boolean |                                     | false         |
| popup-height         | height of popup panel              | String  | size value                          | -             |
| popup-render-to-body | render popup panel as root element | Boolean |                                     | true          |
| popup-style          | attribute added to dropdown panel  | String  | dropdown-list / dropdown-menu / ... | dropdown-list |
| popup-width          | width of popup panel               | String  | size value / auto / inherit         | auto          |
| trigger-action       | operation to make drop             | String  | click / hover                       | hover         |



#### Events

| name      | description                           | arguments |
| --------- | ------------------------------------- | --------- |
| itemclick | emitted when dropdown item be clicked | item      |



#### Slots

| name      | description                              | accepted content |
| --------- | ---------------------------------------- | ---------------- |
| (default) | slot for trigger content                 | Any              |
| dropdown  | slot for dropdown items or other content | Any              |





## Dropdown Panel

Container of popup content, is part of Dropdown and PopupEditor.



### API

#### Name

* Export Name:  `DropdownPanel`
* Component Name:  `MusselDropdownPanel`
* Element Tag Name:  `mu-dropdown-panel`



#### Extend & Mixins

* Mixins: `RenderToBodyMixin`, `PopupVisibleMixin`



#### Attributes

| name           | description              | type    | accepted values                     | default       |
| -------------- | ------------------------ | ------- | ----------------------------------- | ------------- |
| disabled       | disabled                 | Boolean |                                     | false         |
| height         | height of popup panel    | String  | size value                          | -             |
| popup-style    | an extra style attribute | String  | dropdown-list / dropdown-menu / ... | dropdown-list |
| render-to-body | render  as root element  | Boolean |                                     | true          |
| width          | width of popup panel     | String  | size value / auto / inherit         | auto          |
| visible        | hidden or visible        | Boolean |                                     | false         |



#### Model

| prop    | event  |
| ------- | ------ |
| visible | change |



#### Events

| name   | description                        | arguments |
| ------ | ---------------------------------- | --------- |
| change | emitted when visible status change | value     |



#### Slots

| name      | description                              | accepted content |
| --------- | ---------------------------------------- | ---------------- |
| (default) | slot for dropdown items or other content | Any              |




## Dropdown Item

List item in dropdown panel



### API

#### Extend & Mixins

* Extend: `MusselListItem`



#### Name

* Export Name:  `DropdownItem`

* Component Name:  `MusselDropdownItem`
* Element Tag Name:  `mu-dropdown-item`



#### Attributes

| name        | description                              | type    | accepted values | default |
| ----------- | ---------------------------------------- | ------- | --------------- | ------- |
| active      | active status                            | Boolean |                 | false   |
| disabled    | unclickable when disabled                | Boolean |                 | false   |
| icon        | option icon                              |         |                 |         |
| icon-class  | option icon class                        |         |                 |         |
| icon-indent | keep icon indent                         | Boolean |                 | -       |
| label       | option label text                        | String  |                 | -       |
| option      | option data, including value, label, ... | Object  |                 | -       |
| selected    | selected status                          | Boolean |                 | false   |



#### Events

| name  | description               | arguments |
| ----- | ------------------------- | --------- |
| click | emitted when item clicked | -         |



#### Slots

| name      | description           | accepted content |
| --------- | --------------------- | ---------------- |
| (default) | slot for item content | Any              |

