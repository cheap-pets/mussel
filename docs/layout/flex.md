# Flex Layout Components



## Flex Item

Items of flex container.



### Examples

-



### API

#### Name

* Export Name:  `FlexItem`
* Component Name:  `MusselFlexItem`
* Element Tag Name:  `mu-flex-item`



#### Attributes

| name        | description                              | type           | accepted values                                  | default |
| ----------- | ---------------------------------------- | -------------- | ------------------------------------------------ | ------- |
| cellpadding | set standard padding of this item        | Boolean        |                                                  | false   |
| cellspacing | set standard margin of this item         | Boolean        |                                                  | false   |
| size        | size of the item at the layout direction | Number, String | px value / percent value / grow multiples / auto | -       |



#### Injection

| name         | description                   | default |
| ------------ | ----------------------------- | ------- |
| parentLayout | layout mode of parent FlexBox | row     |



#### Slots

| name      | description  | accepted content |
| --------- | ------------ | ---------------- |
| (default) | cell content | Any              |





## Flex Box

Basic flex container



### Examples

-



### API

#### Name

* Export Name:  `FlexBox`
* Component Name:  `MusselFlexBox`
* Element Tag Name:  `mu-flex-box`



#### Extend & Mixins

* Extend: `MusselFlexItem`



#### Attributes

| name            | description                                                  | type    | accepted values     | default             |
| --------------- | ------------------------------------------------------------ | ------- | ------------------- | ------------------- |
| align-items     | flex align-items                                             | String  |                     | stretch             |
| content-spacing | auto set standard padding with container, and margin of items | Boolean |                     | false               |
| flex-wrap       | whether items can be multiple lines                          | Boolean |                     | flow ? true : false |
| inline          | inline flex box                                              | Boolean |                     | false               |
| justify-content | flex justify-content                                         | String  |                     | center              |
| layout          | layout mode                                                  | String  | flow / column / row | row                 |



#### Slots

| name      | description | accepted content |
| --------- | ----------- | ---------------- |
| (default) | flex items  | Any              |





## Flex H Box

Flex box with 'row' direction.



### Examples

-



### API

#### Name

* Export Name:  `HBox`
* Component Name:  `MusselHBox`
* Element Tag Name:  `mu-h-box`



#### Extend & Mixins

* Extend: `MusselFlexBox`



#### Attributes

-



#### Slots

| name      | description | accepted content |
| --------- | ----------- | ---------------- |
| (default) | flex items  | Any              |





## Flex V Box

Flex box with  the direction of row.



### Examples

-



### API

#### Name

* Export Name:  `VBox`
* Component Name:  `MusselVBox`
* Element Tag Name:  `mu-v-box`



#### Extend & Mixins

* Extend: `MusselFlexBox`



#### Attributes

-



#### Slots

| name      | description | accepted content |
| --------- | ----------- | ---------------- |
| (default) | flex items  | Any              |



