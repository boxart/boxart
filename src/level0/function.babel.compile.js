import {transform} from 'babel-standalone';

import plugin from './function.babel';

function _arrowToFunction() {
  return {
    visitor: {
      ArrowFunctionExpression(path) {
        path.arrowFunctionToShadowed();
      },
    },
  };
}

function _fillInFunctions(registry) {
  const asts = {};
  return function({types: t}) {
    return {
      visitor: {
        CallExpression(path) {
          if (
            t.isIdentifier(path.node.callee) &&
            !path.scope.getBinding(path.node.callee.name)
          ) {
            if (registry[path.node.callee.name]) {
              let ast = asts[path.node.callee.name];
              if (!ast) {
                const code = registry[path.node.callee.name].toString();
                ast = transform(code, {}).ast;
                asts[path.node.callee.name] = ast;
              }
              if (t.isFunctionDeclaration(ast.program.body[0])) {
                path.getStatementParent()
                .insertBefore(t.cloneDeep(ast.program.body[0]));
              }
            }
          }
        },
      },
    };
  };
}

function _stringifyPreludeArgs(args) {
  try {
    return args
      .map(function(arg) {
        if (arg && arg.meta) {
          return [
            _stringifyPrelude(arg.meta.origin),
            _stringifyPreludeArgs(arg.meta.args),
            String(arg.meta.origin),
          ]
          .filter(Boolean)
          .join(';');
        }
        return _stringifyPrelude(arg);
      })
      .filter(Boolean)
      .join(';')
  }
  catch (e) {}
  return '';
}

function _stringifyPrelude(fn) {
  if (typeof fn === 'function') {
    try {
      const result = fn();
      if (typeof result === 'function' && result.meta) {
        return `${_stringifyPrelude(result.meta.origin)};
          ${_stringifyPreludeArgs(result.meta.args)};
          ${String(result.meta.origin)};`;
      }
    }
    catch (e) {}
  }
  if (fn && typeof fn === 'object') {
    if (Array.isArray(fn)) {
      return _stringifyPreludeArgs(fn);
    }
    else if (fn.constructor.name === 'Object') {
      return _stringifyPreludeArgs(Object.values(fn));
    }
  }
  return '';
}

function _stringify(fn) {
  if (typeof fn === 'function') {
    if (fn.meta) {
      return `${_stringify(fn.meta.origin)}(${
        fn.meta.args.map(_stringify).join(', ')
      })`;
    }

    return fn.toString();
  }
  else if (fn && typeof fn === 'object') {
    if (Array.isArray(fn)) {
      return `[${fn.map(_stringify).join(', ')}]`;
    }
    return `{${
      Object.entries(fn)
      .map(([key, value]) => (
        `${JSON.stringify(key)}: ${_stringify(value)}`
      ))
      .join(', ')
    }}`;
  }
  else if (typeof fn === 'undefined') {
    return 'null';
  }
  return JSON.stringify(fn);
}

export default function compile(fn, registry) {
  // Build the factory factory for what fn can do. Given the meta information
  // stored by compile-registry, write all the functions used to build up fn.
  // And finally call the top function with all its arguments and the arguments
  // arguments.
  const body = `function compiled() {${_stringifyPrelude(fn)}; return ${_stringify(fn)}}`;
  // "Safety" pass.
  const result1 = transform(body, {
    plugins: [
      _arrowToFunction,
      // Back up in case functions were not wrapped with `inlined`. They may be
      // available in the registry for the top function.
      _fillInFunctions(registry),
    ],
  });
  // "Real" pass. Inline functions and try to statically remove unnecessary
  // operations.
  const result = transform(result1.code, {
    plugins: [plugin]
  });
  // Return a function that instantiates the compiled instance. If it cannot be
  // instantiated, the original will be used in its stead and writing the
  // compiled version to a string will throw an Error.
  return function() {
    let f;
    try {
      f = new Function(`return ${result.code}`)()();
      if (!fn.meta) {
        // Functions with meta are the result of a boxart function factory.
        // Without meta, we know we are given a factory. Try calling the
        // factory. If there is an error we shall assume it is not safe to
        // stringify it.
        f();
      }
    }
    catch (e) {
      // Errors other than ReferenceError's are fine if f was able to be
      // generated.
      if (f && !/(\w+) is not defined/.test(e.message)) {
        return f;
      }
      // An error occured testing the compiled source. The original function can
      // be safely called.
      f = function(...args) {
        return fn(...args);
      };
      // Stringify'ing the original function wouldn't be tremendously useful.
      // It'd only be a part of the function set for a given animation
      // component.
      f.toString = function() {
        throw new Error(
          `Could not compile a boxart function. A function may not have been ` +
          `able to be inlined.\nOriginal Error:\n${e.stack || e}`
        );
      };
    }
    return f;
  };
};
