# i-validate  
`npm install --save i-validate`
```coffeescript
  validator = require 'i-validate'
  validator.setValidations
    user:
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
  validator.validate 'user', data
  .then (result) ->
    console.log 'result', result
```