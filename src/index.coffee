'use strict'

module.exports = (->
  evalInContext = (str, context) ->
    (new Function("with(this) {return #{str}}"))
    .call context
  validationFns =
    $or: ->
      myargs = arguments
      new Promise (resolve) ->
        result = false
        for arg in myargs
          result = result or (await arg)
        resolve result
    $number: (min, max) ->
      if typeof @.item is 'number'
        result = true
        if typeof min is 'number'
          result = result and (min <= @.item)
        if typeof max is 'number'
          result = result and (max >= @.item)
        return result
      return false
    $string: (min, max) ->
      if typeof @.item is 'string'
        result = true
        if typeof min is 'number'
          result = result and (min <= @.item.length)
        if typeof max is 'number'
          result = result and (max >= @.item.length)
        return result
      return false
    $min: (val) ->
      val <= @.item
    $max: (val) ->
      val >= @.item
    $notEmpty: ->
      @.item.length
    $empty: ->
      @.item.length is 0
    $exists: ->
      @.item or @.item is 0 or @.item is false
    $email: ->
      /^[a-z0-9\-_\.]+@[a-z0-9\-_]+(\.[a-z0-9\-_]+)+$/i.test @.item
    $emailList: ->
      allGood = true
      if @.item
        emails = @.item.split /[;,\s]+/g
        for email in emails
          if email
            allGood = allGood && /^[a-z0-9\-_\.]+@[a-z0-9\-_]+(\.[a-z0-9\-_]+)+$/i.test email
      return allGood
  validations = {}
  validate = (validations, obj, root) ->
    validationType = Object.prototype.toString.call(validations)
    if validations and validationType isnt '[object Array]' and validationType isnt '[object String]' and validationType isnt '[object Function]'
      for key of validations
        if key.indexOf('$') is 0
          continue
        if myvalidations = validations[key]?.$validations or validations[key]
          validationFns.item = obj[key]
          if typeof myvalidations is 'string' or typeof myvalidations is 'function'
            myvalidations = [myvalidations]
          for validation in myvalidations
            if typeof validation is 'function'
              if not await validation.call(validationFns)
                return 
                  result: false
                  validation: validation
                  obj: obj
                  root: root
                  key: key
                  value: obj[key]
            else
              if not await evalInContext validation, validationFns
                return 
                  result: false
                  validation: validation
                  obj: obj
                  root: root
                  key: key
                  value: obj[key]
        type = Object.prototype.toString.call obj[key]
        if validations[key]
          if type is '[object Object]'
            if Object.keys(validations[key]).length is 1 and validations[key].$validations
              return result: true
            if not (failedValidation = await validate validations[key], obj[key], root).result
              return failedValidation
          else if type is '[object Array]'
            if Object.keys(validations[key]).length is 1 and validations[key].$validations
              return result: true
            for myobj in obj[key]
              if not (failedValidation = await validate validations[key], myobj, root).result
                return failedValidation
    result: true
  setValidations: (_validations) ->
    validations = _validations
  validate: (table, obj) ->
    return await validate validations[table], obj, obj
)()