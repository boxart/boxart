import {transform} from 'babel-standalone';

import plugin from './function.babel';

function _fillInFunctions(registry) {
  return function({types: t}) {
    return {
      visitor: {
        ArrowFunctionExpression(path) {
          path.arrowFunctionToShadowed();
        },

        CallExpression(path) {
          if (
            t.isIdentifier(path.node.callee) &&
            !path.scope.getBinding(path.node.callee.name)
          ) {
            if (registry[path.node.callee.name]) {
              const code = registry[path.node.callee.name].toString();
              const {ast} = transform(code, {});
              if (t.isFunctionDeclaration(ast.program.body[0])) {
                path.getStatementParent().insertBefore(ast.program.body[0]);
              }
            }
          }
        },
      },
    };
  };
}

function _stringify(fn) {
  if (typeof fn === 'function') {
    if (fn.meta) {
      return `${fn.meta.origin.toString()}(${
        fn.meta.args.map(_stringify).join(', ')
      })`;
    }
    else {
      return fn.toString();
    }
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
  return JSON.stringify(fn);
}

export default function compile(fn, registry) {
  const body = `function compiled() {return ${_stringify(fn)}}`;
  const result1 = transform(body, {
    plugins: [_fillInFunctions(registry)]
  });
  const result = transform(result1.code, {
    plugins: [plugin]
  });
  return new Function(`return ${result.code}`)();
};
