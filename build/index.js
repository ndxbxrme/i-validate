(function() {
  'use strict';
  module.exports = (function() {
    var evalInContext, validate, validationFns, validations;
    evalInContext = function(str, context) {
      return (new Function(`with(this) {return ${str}}`)).call(context);
    };
    validationFns = {
      $or: function() {
        var myargs;
        myargs = arguments;
        return new Promise(async function(resolve) {
          var arg, j, len, result;
          result = false;
          for (j = 0, len = myargs.length; j < len; j++) {
            arg = myargs[j];
            result = result || ((await arg));
          }
          return resolve(result);
        });
      },
      $number: function(min, max) {
        var result;
        if (typeof this.$item === 'number') {
          result = true;
          if (typeof min === 'number') {
            result = result && (min <= this.$item);
          }
          if (typeof max === 'number') {
            result = result && (max >= this.$item);
          }
          return result;
        }
        return false;
      },
      $string: function(min, max) {
        var result;
        if (typeof this.$item === 'string') {
          result = true;
          if (typeof min === 'number') {
            result = result && (min <= this.$item.length);
          }
          if (typeof max === 'number') {
            result = result && (max >= this.$item.length);
          }
          return result;
        }
        return false;
      },
      $min: function(min) {
        return min <= this.$item;
      },
      $max: function(max) {
        return max >= this.$item;
      },
      $notEmpty: function() {
        return this.$item.length;
      },
      $empty: function() {
        return this.$item.length === 0;
      },
      $exists: function() {
        return this.$item || this.$item === 0 || this.$item === false;
      },
      $email: function() {
        return /^[a-z0-9\-_\.]+@[a-z0-9\-_]+(\.[a-z0-9\-_]+)+$/i.test(this.$item);
      },
      $emailList: function() {
        var allGood, email, emails, j, len;
        allGood = true;
        if (this.$item) {
          emails = this.$item.split(/[;,\s]+/g);
          for (j = 0, len = emails.length; j < len; j++) {
            email = emails[j];
            if (email) {
              allGood = allGood && /^[a-z0-9\-_\.]+@[a-z0-9\-_]+(\.[a-z0-9\-_]+)+$/i.test(email);
            }
          }
        }
        return allGood;
      }
    };
    validations = {};
    validate = async function(validations, obj, root) {
      var failedValidation, j, k, key, len, len1, myobj, myvalidations, ref, ref1, type, validation, validationType;
      validationType = Object.prototype.toString.call(validations);
      if (validations && validationType !== '[object Array]' && validationType !== '[object String]' && validationType !== '[object Function]') {
        for (key in validations) {
          if (key.indexOf('$') === 0) {
            continue;
          }
          if (myvalidations = ((ref = validations[key]) != null ? ref.$validations : void 0) || validations[key]) {
            validationFns.$item = obj[key];
            if (typeof myvalidations === 'string' || typeof myvalidations === 'function') {
              myvalidations = [myvalidations];
            }
            for (j = 0, len = myvalidations.length; j < len; j++) {
              validation = myvalidations[j];
              if (typeof validation === 'function') {
                if (!(await validation.call(validationFns))) {
                  return {
                    result: false,
                    validation: validation,
                    obj: obj,
                    root: root,
                    key: key,
                    value: obj[key]
                  };
                }
              } else {
                if (!(await evalInContext(validation, validationFns))) {
                  return {
                    result: false,
                    validation: validation,
                    obj: obj,
                    root: root,
                    key: key,
                    value: obj[key]
                  };
                }
              }
            }
          }
          type = Object.prototype.toString.call(obj[key]);
          if (validations[key]) {
            if (type === '[object Object]') {
              if (Object.keys(validations[key]).length === 1 && validations[key].$validations) {
                return {
                  result: true
                };
              }
              if (!(failedValidation = (await validate(validations[key], obj[key], root))).result) {
                return failedValidation;
              }
            } else if (type === '[object Array]') {
              if (Object.keys(validations[key]).length === 1 && validations[key].$validations) {
                return {
                  result: true
                };
              }
              ref1 = obj[key];
              for (k = 0, len1 = ref1.length; k < len1; k++) {
                myobj = ref1[k];
                if (!(failedValidation = (await validate(validations[key], myobj, root))).result) {
                  return failedValidation;
                }
              }
            }
          }
        }
      }
      return {
        result: true
      };
    };
    return {
      setValidations: function(_validations) {
        var doExpand, expandFns;
        validations = _validations;
        doExpand = function(validation) {
          if (typeof validation === 'string') {
            return validation.replace(/(\$\w+)(?!\()[^\w]|^\s*(\$\w+)\s*$/g, function(a, b, c) {
              return (b || c) + '()' + (b ? a.substr(a.length - 1) : '');
            });
          } else {
            return validation;
          }
        };
        expandFns = function(obj) {
          var i, key, results, type, validation, vitem;
          results = [];
          for (key in obj) {
            validation = obj[key];
            type = Object.prototype.toString.call(validation);
            switch (type) {
              case '[object String]':
                results.push(validation = doExpand(validation));
                break;
              case '[object Array]':
                results.push((function() {
                  var j, len, results1;
                  results1 = [];
                  for (i = j = 0, len = validation.length; j < len; i = ++j) {
                    vitem = validation[i];
                    results1.push(validation[i] = doExpand(vitem));
                  }
                  return results1;
                })());
                break;
              case '[object Object]':
                results.push(expandFns(validation));
                break;
              default:
                results.push(void 0);
            }
          }
          return results;
        };
        return expandFns(validations);
      },
      addValidationFns: function(fnsObj) {
        var fn, key, results;
        results = [];
        for (key in fnsObj) {
          fn = fnsObj[key];
          if (typeof fn === 'function') {
            results.push(validationFns[key] = fn);
          } else {
            results.push(void 0);
          }
        }
        return results;
      },
      validate: async function(table, obj) {
        return (await validate(validations[table], obj, obj));
      }
    };
  })();

}).call(this);

//# sourceMappingURL=index.js.map
