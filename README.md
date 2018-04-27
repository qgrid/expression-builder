# Expression Builder
Simple extensible framework for compact markup building with fluent interface.
This is a rewritten version of [angularjs expression builder](https://github.com/vkorolev/expression-builder).

`Expression builder` tries to encapsulate the most of logic that can be happen while building complex tree based UI. 
It tries to collect imperative instructrion under the declarative containers. Tries to be pretty, but extensible, powerfull, but not sophisticated.We believe that expression builder can dramatically help to connect UI and hierarchical structures. 
* On the first step you say what elements you want to use in yours UI(buttons, lists etc.)
* On the second step you tell about instuctions that should be applied in your UI(add button and list, add element, remove element etc.). 
* On the third step you just bind your instructions to UI, thats it!

## How it can look like
![alt tag](https://github.com/vkorolev/expression-builder/blob/master/assets/example.png?raw=true)

## Example
link to stackblitz

## Licence
Code licensed under MIT license.

## Installing
`npm i --save ng2-q-expression-builder`

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.