# Button & Button Group



## Button

Basic button component, fire 'click' event when tapped.



### Examples

-



### API

#### Name

* Export Name:  `Button`
* Component Name:  `MusselButton`
* Element Tag Name:  `mu-button`



#### Attributes

| name             | description                           | type    | accepted values                    | default |
| ---------------- | ------------------------------------- | ------- | ---------------------------------- | ------- |
| active           | active status                         | Boolean |                                    | false   |
| caption          | button caption                        | String  |                                    | -       |
| disabled         | disabled status                       | Boolean |                                    | false   |
| button-style     | button style                          | String  | normal / outline / text / link     | normal  |
| button-shape     | button shape                          | String  | normal / round                     | normal  |
| button-type      | button type                           | String  | normal / primary / submit / danger | normal  |
| icon             | button icon name <br> (internal icon) | String  |                                    | -       |
| icon-class       | button icon class<br> (custom icon)   | String  |                                    | -       |
| icon-only        | only display icon                     | Boolean |                                    | false   |
| stop-propagation | stop propagation when click           | Boolean |                                    | false   |
| trigger-type     | button trigger type                   | String  |                                    | -       |



#### Events

| name  | description          | arguments                  |
| ----- | -------------------- | -------------------------- |
| click | emitted when clicked | event (native click event) |



#### Slots

| name      | description             | accepted content |
| --------- | ----------------------- | ---------------- |
| (default) | slot for button content | Any              |



## Icon Button

button only with a icon



### Examples

-


### API

#### Name

* Export Name:  `IconButton`
* Component Name:  `MusselIconButton`
* Element Tag Name:  `mu-icon-button`



#### Attributes

same as `MusselButton`



#### Events

same as `MusselButton`



#### Slots

| name      | description             | accepted content |
| --------- | ----------------------- | ---------------- |
| (default) | slot for button content | icon element     |



## Button Group

combine buttons that with relative function.



### Examples

-



### API

#### Name

* Export Name:  `ButtonGroup`
* Component Name:  `MusselButtonGroup`
* Element Tag Name:  `mu-button-group`



#### Attributes

| name     | description     | type    | accepted values | default |
| -------- | --------------- | ------- | --------------- | ------- |
| disabled | disabled status | Boolean |                 | false   |



#### Slots

| name      | description      | accepted content |
| --------- | ---------------- | ---------------- |
| (default) | slot for buttons | Mussel Buttons   |



## Split Button

button with a extra small trigger



### Examples

-



### API

#### Name

* Export Name:  `SplitButton`
* Component Name:  `MusselSplitButton`
* Element Tag Name:  `mu-split-button`



#### Attributes

| name               | description                        | type    | accepted values                    | default  |
| ------------------ | ---------------------------------- | ------- | ---------------------------------- | -------- |
| caption            | main button caption                | String  |                                    | -        |
| disabled           | disabled status                    | Boolean |                                    | false    |
| button-type        | button type                        | String  | normal / primary / submit / danger | normal   |
| button-style       | button style                       | String  | normal / outline / text / link     | normal   |
| button-shape       | button shape                       | String  | normal / round                     | normal   |
| split-icon         | icon name for the small button     | String  |                                    | -        |
| split-icon-class   | icon class for the small button    | String  |                                    | -        |
| split-svg-data     | icon svg data for the small button | Boolean |                                    | false    |
| split-trigger-type | trigger type for the small button  | String  |                                    | dropdown |
| stop-propagation   | stop propagation when click        | Boolean |                                    | false    |



#### Events

| name             | description                       | arguments                  |
| ---------------- | --------------------------------- | -------------------------- |
| click            | emitted when main button clicked  | event (native click event) |
| splitbuttonclick | emitted when small button clicked | event (native click event) |



#### Slots

| name      | description                  | accepted content |
| --------- | ---------------------------- | ---------------- |
| (default) | slot for main button content | Any              |

