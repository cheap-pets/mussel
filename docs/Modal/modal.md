# Modal

Modal container, with mask layer cover the window.



### Examples

-




### API

#### Name

* Export Name:  `Modal`
* Component Name:  `MusselModal`
* Element Tag Name:  `mu-modal`



#### Extend & Mixins

* extends: `BaseModal`



#### Attributes

| name                 | description                  | type    | accepted values | default |
| -------------------- | ---------------------------- | ------- | --------------- | ------- |
| mask-action          | effect of tapping the mask   | String  | none, close     | close   |
| popup-render-to-body | render modal as root element | Boolean |                 | true    |
| visible              | hidden or visible            | Boolean |                 | false   |



#### Model

| prop    | event  |
| ------- | ------ |
| visible | change |



#### Methods

| name | description            | arguments |
| ---- | ---------------------- | --------- |
| show | make the modal visible | -         |
| hide | make the modal hidden  | -         |



#### Events

| name | description        | arguments |
| ---- | ------------------ | --------- |
| show | emitted after show |           |
| hide | emitted after hide |           |



#### Slots

| name      | description            | accepted content |
| --------- | ---------------------- | ---------------- |
| (default) | slot for modal content | Any              |



