/**
 * @file Auto-binds class methods to an object
 * @module utilBindMethods
 */

/**
 * Auto-bind methods to the passed-in object
 * @alias bindMethods
 * @param {object} thisValue - The object to bind as method context
 * @param {array} [methodNames] - The list of methods to bind. Defaults to all.
 * @returns {void}
 */
export default function(thisValue, methodNames, RootClass = Object.prototype) {
  const protoObj = Object.getPrototypeOf(thisValue);
  let methods = methodNames;

  if (!methods) {
    methods = [];
    let nextProtoObj = protoObj;
    const filterBound = name => (
          typeof protoObj[name] === 'function' &&
          // Don't rebind already bound methods
          !thisValue.hasOwnProperty(name)
    );
    do {
      methods = methods.concat(Object.getOwnPropertyNames(nextProtoObj).filter(filterBound));
      // Climb the hierarchy to bind methods listed by parents
      nextProtoObj = Object.getPrototypeOf(nextProtoObj);
    } while (nextProtoObj !== RootClass);
  }

  methods.forEach(name => {
    thisValue[name] = protoObj[name].bind(thisValue);
  });
}
