# Tabs



## Tabs

Container for tab pages.



### Examples

-



### API

#### Name

* Export Name:  `Tabs`
* Component Name:  `MusselTabs`
* Element Tag Name:  `mu-tabs`



#### Attributes

| name          | description                      | type    | accepted values             | default |
| ------------- | -------------------------------- | ------- | --------------------------- | ------- |
| active-tab    | name of the active tab page      | String  |                             | -       |
| instant-state | switch tab page when tab clicked | Boolean |                             | true    |
| tab-items     | items of tabs header             | Array   |                             | -       |
| tab-position  | position of tabs header          | String  | top / bottom / left / right | top     |
| tab-style     | style of tabs                    | String  | simple / card               | simple  |



#### Model

| prop       | event  |
| ---------- | ------ |
| active-tab | change |



#### Provide

| name | description     |
| ---- | --------------- |
| tabs | this vue object |



#### Methods

| name   | description         | arguments |
| ------ | ------------------- | --------- |
| select | set active tab page | tab name  |



#### Events

| name   | description                    | arguments |
| ------ | ------------------------------ | --------- |
| change | emitted when tab page switched | tab name  |



#### Slots

| name          | description                  | accepted content |
| ------------- | ---------------------------- | ---------------- |
| (default)     | slot for tab pages           | mu-tab-panel     |
| header-prefix | prefix content of tab header | any              |
| header-suffix | header content of tab header | any              |





## Tab Header

Tabs Header.

Can be used standalone. 



### API

#### Name

* Export Name:  `TabHeader`
* Component Name:  `MusselTabHeader
* Element Tag Name:  `mu-tab-header



#### Attributes

| name          | description                      | type    | accepted values             | default |
| ------------- | -------------------------------- | ------- | --------------------------- | ------- |
| active-tab    | name of the active tab page      | String  |                             | -       |
| instant-state | switch tab page when tab clicked | Boolean |                             | true    |
| tab-items     | items of tabs header             | Array   |                             | -       |
| tab-position  | position of tabs header          | String  | top / bottom / left / right | top     |
| tab-style     | style of tabs                    | String  | simple / card               | simple  |



#### Model

| prop       | event  |
| ---------- | ------ |
| active-tab | change |



#### Injection

| name | description | default |
| ---- | ----------- | ------- |
| tabs | owner tabs  | null    |



#### Events

| name   | description                    | arguments |
| ------ | ------------------------------ | --------- |
| change | emitted when tab page switched | tab name  |



#### Slots

| name      | description           | accepted content |
| --------- | --------------------- | ---------------- |
| (default) | slot for page content | Any              |





## Tab Panel

Tab page, item of tabs.



### API

#### Name

* Export Name:  `TabPanel`
* Component Name:  `MusselTabPanel`
* Element Tag Name:  `mu-tab-panel`



#### Attributes

| name  | description         | type   | accepted values | default |
| ----- | ------------------- | ------ | --------------- | ------- |
| name  | name of tab item    | String | (not null)      | -       |
| label | label on the header | String |                 | -       |



#### Injection

| name | description | default |
| ---- | ----------- | ------- |
| tabs | owner tabs  | null    |



#### Slots

| name      | description           | accepted content |
| --------- | --------------------- | ---------------- |
| (default) | slot for page content | Any              |

