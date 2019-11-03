
# List

Basic data component, for rendering array-like data.



## List Item

Item of list



### API

#### Name

* Export Name:  `ListItem`

* Component Name:  `MusselListItem`
* Element Tag Name:  `mu-list-item`



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





## List Divider

Separate items from groups



### API

#### Name

* Export Name:  `ListDivider`

* Component Name:  `MusselListDivider`
* Element Tag Name:  `mu-list-divider`

