let _ = Npm.require('underscore')

Services.utils.find = function (array, prop, value) {
  let result = _.find(array, (obj) => obj[prop] == value) 
  if (typeof result === 'undefined') {
    throw `Services Utils Find: invalid ${prop}: ${value}`
  }
  return result
}
