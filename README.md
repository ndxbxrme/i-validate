# i-validate  
`npm install --save i-validate`
```coffeescript
  validator = require 'i-validate'
  validator.setValidations
    users:
      name: ->
        new Promise (resolve) =>
          window.setTimeout =>
            resolve @.item
          , 4000
      age: ['$number()', '$min(10)', '$max(40)']
      cats: 
        $validations: '$notEmpty()'
        name: '$exists()'
      email: ['$exists()', '$emailList()']
  data =
    name: 'jimbo'
    age: 18
    email: 'test.bam@test.com;borange@orange.co.uk'
    cats: [
      name: 'hope'
      age: 6
    ,
      name: 'bobby'
      age: 12
    ]
  validator.validate 'users', data
  .then (result) ->
    console.log 'result', result
```
#### add your own validation functions
```coffeescript
  validator.addValidationFns
    $big: ->
      @.item > 1000
    $small: ->
      @.item < 0.1
```