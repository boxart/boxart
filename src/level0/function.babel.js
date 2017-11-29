// function gen() {
//   return (function(fn) {
//     const f = function(t, state, begin, end) {
//       var b = {b: 1};
//       var c = {f2: function(t) {return t;}};
//       state.left = c.f2(b.b, state, begin, end) * 2;
//       return state;
//     };
//     return f;
//   })((function(fn) {
//     const f = function(t) {return fn(t * 2) * 2;};
//     return f;
//   })((function(fn) {
//     const f = function(t) {return fn(t * 2) * 2;};
//     return f;
//   })((function(fn) {
//     const f = function(t) {return fn(t * 2) * 2;};
//     return f;
//   })((function(c) {
//     const f = function(t) {return t * c;};
//     return f;
//   })(3)))));
// }

// function gen3() {
//   return (function(obj) {
//     const f = function(element, state) {
//       state = state || {};
//       state.ary = state.ary || [];
//       state.ary[0] = {};
//       for (const [k, v] of Object.entries(obj)) {
//         state[k] = v(element[k], state, {});
//       }
//       return state;
//     };
//     return f;
//   })(function() {
//       const g = (function() {
//         const f = function(element, state) {
//           return element;
//         };
//         return f;
//       })();
//     return {
//       a: g,
//     b: (function() {
//         const f = function(element, state) {
//           return element;
//         };
//         return f;
//       })(),
//     };
//   }());
// }
//
// function gen2() {
//   return (function(fn) {
//     const f = function(element, state, animated) {
//       state = state || {};
//       for (const k of ['a', 'b', 'c']) {
//       state[k] = fn(element, state[k], animated);
//       }
//       return state;
//     };
//     return f;
//   })((function() {
//     const f = function(element, state, animated) {
//       state = state || {};
//       state.b = 1;
//       return state;
//     };
//     return f;
//   })());
// }
//
// function gen() {
//   return (function(fn) {
//   const f = function(t, state, begin, end) {
//       state = state || {};
//       let b = 0;
//       // comment
//       let a = 2;
//       let d = [a];
//       let e = {a: 1};
//       while (0) {
//         for (const j of ['d', 'e']) {
//           for (const k of ['f', 'g']) {
//           state[j][k] = end[j][k] ;
//           }
//         }
//       }
//       for (const m of [function() {return 1;}, function() {return 2;}]) {
//         b = m();
//       }
//       let i;
//       for (const [n, o] of Object.entries({p: ['q', 'r'], q: ['r', 's']})) {
//         i = 1;
//         for (const p of o) {
//           i = i + 2;
//           state[n][i] = p;
//         }
//       }
//       for (const c of ['a', 'b']) {
//         state[c] = (end[c] - begin[c]) * t + begin[c];
//       }
//       if (0) {
//     b = 1;
//       }
//       else if (0) {
//         b = 2;
//       }
//       else if (0) {
//         b = 3;
//       }
//       a = b;
//       return 'translate(' + fn.fn(a) + ',' + 0 + 'px' + ')';
//     };
//     return f;
//   })((function() {
//     const f = function() {return 1;};
//     f.fn = function(t) {
//       return t * 2;
//     };
//     return f;
//   })());
//   const f = function(t, state, begin, end) {
//     let b = begin.left;
//     let e = end.left;
//     state.left = (e - b) * t + b;
//     return state;
//   };
//   f.eq = function(t) {return t >= 1;}
//   return f;
// }

export default function(babel) {
  const { types: t, traverse } = babel;

  function logString(path, str) {
    path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(str)));
  }

  function isStatic(node, state) {
    if (t.isLiteral(node)) {
      return true;
    }
    else if (t.isIdentifier(node) && isStatic(state[node.name], state)) {
      return true;
    }
    else if (t.isArrayExpression(node)) {
      const length = node.elements.length;
      for (let i = 0; i < length; i++) {
        if (!isStatic(node.elements[i], state)) {
          return false;
        }
      }
      return true;
    }
    else if (t.isObjectExpression(node)) {
      const length = node.properties.length;
      for (let i = 0; i < length; i++) {
        if (!t.isIdentifier(node.properties[i].key)) {
          return false;
        }
        if (!isStatic(node.properties[i].value, state)) {
          return false;
        }
      }
      return true;
    }
    else if (t.isFunction(node)) {
      return true;
    }
    return false;
  }

  function isStaticPath(path, state) {
    if (path.isLiteral()) {
      return true;
    }
    else if (path.isIdentifier() && isStatic(state[path.node.name], state)) {
      return true;
    }
    else if (path.isArrayExpression()) {
      const length = path.node.elements.length;
      for (let i = 0; i < length; i++) {
        if (!isStaticPath(path.get(`elements.${i}`), state)) {
          return false;
        }
      }
      return true;
    }
    else if (path.isObjectExpression()) {
      const length = path.node.properties.length;
      for (let i = 0; i < length; i++) {
        if (!path.get(`properties.${i}.key`).isIdentifier()) {
          return false;
        }
        if (!isStaticPath(path.get(`properties.${i}.value`), state)) {
          return false;
        }
      }
      return true;
    }
    else if (path.isFunction()) {
      return true;
    }
    else if (
      path.isCallExpression() &&
      path.get('callee').isMemberExpression() &&
      path.get('callee.object').isIdentifier() &&
      path.get('callee.object').node.name === 'Object' &&
      path.get('callee.property').node.name === 'entries'
    ) {
      return isStaticPath(path.get('arguments.0'), state);
    }
    return false;
  }

  let values = {};

  const memberLookup = (path, state) => {
    let stack = [];
    let node = path.node;
    while (t.isMemberExpression(node)) {
      if (node.computed) {
        if (!t.isIdentifier(node.property)) {return;}
        if (!t.isLiteral(state[node.property.name])) {return;}
        stack.unshift(state[node.property.name].value);
      }
      else {
        if (!t.isIdentifier(node.property)) {return;}
        stack.unshift(node.property.name);
      }
      node = node.object;
    }
    if (!t.isIdentifier(node)) {return;}
    let value = state[node.name];
    // logString(path, JSON.stringify([node.name].concat(stack)));
    // logString(path, JSON.stringify([node.name, value]));
    while (value && value.properties && stack.length > 0) {
      const name = stack.shift();
      value = value.properties.find(prop => prop.key.name === name);
      // logString(path, JSON.stringify([name, value && value.type]));
      if (t.isObjectProperty(value)) {
        value = value.value;
      }
      if (t.isIdentifier(value) && state[value.name]) {
        value = state[value.name];
      }
    }
    if (stack.length === 0) {
      return value;
    }
  };

  const memberReplace = (path, state) => {
    const value = memberLookup(path, state);
    if (
      t.isLiteral(value) ||
      t.isIdentifier(value) ||
      // t.isMemberExpression(value) ||
      t.isFunctionExpression(value)
    ) {
      path.replaceWith(t.cloneDeep(value));
    }
  };

  const memberStore = (path, state, rhs) => {
    let stack = [];
    let node = path.node;
    while (t.isMemberExpression(node)) {
      if (node.computed) {return;}
      if (!t.isIdentifier(node.property)) {return;}
      stack.unshift(node.property.name);
      node = node.object;
    }
    if (!t.isIdentifier(node)) {return;}
    let value = state[node.name];
    while (value && stack.length > 0) {
      if (!value.properties) {
        value.properties = [];
      }
      const name = stack.shift();
      if (stack.length > 0) {
        if (value.properties.find(prop => prop.key.name === name)) {
          value = value.properties.find(prop => prop.key.name === name);
        }
        else {
          value.properties.push(t.objectProperty(t.identifier(name), t.objectExpression()));
          value = value.properties[value.properties.length - 1];
        }
      }
      else {
        if (value.properties.find(prop => prop.key.name === name)) {
          value.properties.find(prop => prop.key.name === name).value = rhs;
          value = null;
        }
        else {
          value.properties.push(t.objectProperty(t.identifier(name), rhs));
          value = value.properties[value.properties.length - 1];
        }
      }
    }
  };

  const matchesMember = function(a, b, partial) {
    if (t.isMemberExpression(a) && t.isMemberExpression(b)) {
      return (
        (
          partial ||
          (a.computed === b.computed && matchesMember(a.property, b.property))
        ) &&
        matchesMember(a.object, b.object)
      );
    }
    else if (t.isIdentifier(a) && t.isIdentifier(b)) {
      return a.name === b.name;
    }
    return false;
  };

  const renameAll = {
    Identifier(path, state) {
      if (
        path.node.name.startsWith('_') &&
        path.scope.getBinding(path.node.name) &&
        path.scope.getBinding(path.node.name).path.node === path.node
        // path.parent.left === path.node ||
        // path.parent.id === path.node ||
        // path.parentPath.isArrayPattern()
      ) {
        path.scope.rename(path.node.name);
      }
    }
  };

  const inlineFunctions = {
    FunctionExpression(path, state) {},
    Identifier(path, state) {
      // if (
      //   path.parent.object !== path.node &&
      //   (
      //     path.parent.property !== path.node ||
      //     path.parent.property === path.node &&
      //     path.parent.computed
      //   ) &&
      //   !path.parentPath.isMemberExpression() &&
      //   path.parent.left !== path.node &&
      //   path.parent.id !== path.node
      // ) {
      //   if (isStatic(state[path.node.name])) {
      //     path.replaceWith(t.cloneDeep(state[path.node.name]));
      //   }
      // }
    },
    BlockStatement: {
      exit(path, state) {
        if (
          (
            path.parentPath.isConditional() ||
            path.parentPath.isLoop()
          ) &&
          path.scope.__names
        ) {
          // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${JSON.stringify(path.scope.__names)}`)));
          for (let name of path.scope.__names) {
            if (state[name]) {
              state[name] = null;
            }
          }
        }
      },
    },
    VariableDeclarator: {
      enter(path, state) {
        path.scope.rename(path.node.id.name);
        if (path.getStatementParent().isLoop()) {
          state[path.node.id.name] = null;
          path.skip();
        }
      },
      exit(path, state) {
        if (path.getStatementParent().isLoop()) {
          state[path.node.id.name] = null;
          return;
        }
        if (
          path.get('init').isIdentifier() &&
          state[path.node.init.name] &&
          t.isLiteral(state[path.node.init.name])
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.get('init').replaceWith(t.cloneDeep(state[path.node.init.name]));
        }
        if (
          path.get('init').isIdentifier() &&
          t.isFunctionExpression(state[path.node.init.name])
        ) {
          state[path.node.id.name] = state[path.node.init.name];
        }
        if (
          path.get('init').isMemberExpression() &&
          t.isFunctionExpression(memberLookup(path.get('init'), state))
        ) {
          state[path.node.id.name] = memberLookup(path.get('init'), state);
        }
        if (path.get('init').isFunctionExpression()) {
          state[path.node.id.name] = path.node.init;
        }
        if (path.get('init').isNumericLiteral()) {
          state[path.node.id.name] = path.node.init;
        }
        if (path.get('init').isArrayExpression()) {
          state[path.node.id.name] = path.node.init;
        }
        if (path.get('init').isObjectExpression()) {
          state[path.node.id.name] = path.node.init;
        }
      }
    },
    AssignmentExpression: {
      // enter(path, state) {
      // },
      exit(path, state) {
        if (
          path.get('left').isIdentifier() &&
          path.getStatementParent().isLoop()
        ) {
          state[path.node.id.name] = null;
          return;
        }
        for (const key in state) {
          if (matchesMember(path.node.left, state[key])) {
            state[key] = null;
          }
        }
        if (
          path.get('right').isFunctionExpression() ||
          path.get('right').isObjectExpression() ||
          path.get('right').isArrayExpression()
        ) {
          memberStore(path.get('left'), state, path.node.right);
        }
        if (path.get('left').isIdentifier()) {
          const name = path.node.left.name;
          if (
            path.get('right').isIdentifier() &&
            t.isLiteral(state[path.node.right.name])
          ) {
            state.__changed = (state.__changed || 0) + 1;
            path.get('right')
            .replaceWith(t.cloneDeep(state[path.node.right.name]));
          }
          if (path.get('right').isFunctionExpression()) {
            state[name] = path.node.right;
          }
          else if (
            path.get('right').isNumericLiteral() ||
            path.get('right').isObjectExpression() ||
            path.get('right').isArrayExpression()
          ) {
            state[name] = path.node.right;
          }
          else {
            state[name] = null;
          }

          if (!path.scope.__names) {
            path.scope.__names = [];
          }
          if (!path.scope.__names.find(n => n === name)) {
            path.scope.__names.push(name);
          }
        }
      }
    },
    ForStatement: {},
    ForOfStatement: {
      enter(path, state) {
        if (memberLookup(path.get('right'), state)) {
          state.__changed = (state.__changed || 0) + 1;
          memberReplace(path.get('right'), state);
        }
      },
      exit(path, state) {
        if (isStaticPath(path.get('right'), state)) {
          if (
            path.get('right').isArrayExpression() &&
            path.get('left.declarations.0.id').isIdentifier()
          ) {
            state.__changed = (state.__changed || 0) + 1;
            let block = [];
            // const originalName = path.get(`left.declarations.0.id`).node.name;
            // path.scope.rename(path.get(`left.declarations.0.id`).node.name);
            // path.scope.rename(path.get(`left.declarations.0.id`).node.name);
            path.get('right').node.elements.forEach(expr => {
              path.scope.rename(path.get(`left.declarations.0.id`).node.name);
              const name = path.get(`left.declarations.0.id`).node.name;
              block.push(
                t.variableDeclaration(
                  "const",
                  [t.variableDeclarator(t.identifier(name), t.cloneDeep(expr))]
                )
              );
              path.get(`body`).node.body.forEach(expr => {
                block.push(t.cloneDeep(expr));
              });
              // path.scope.rename(path.get(`left.declarations.0.id`).node.name);
              // path.scope.rename(path.get(`left.declarations.0.id`).node.name);
            });
            // path.getStatementParent().insertBefore(t.blockStatement(block));
            // path.scope.rename(path.get(`left.declarations.0.id`).node.name, '_' + Math.random().toString(16).substring(2));
            // block.forEach(n => path.insertBefore(n));
            path.replaceWith(t.blockStatement(block));
          }
          if (
            path.isForOfStatement() &&
            path.get('left.declarations.0.id').isArrayPattern() &&
            path.get('left.declarations.0.id').node.elements.length === 2 &&
            path.get('right').isArrayExpression()
          ) {
            state.__changed = (state.__changed || 0) + 1;
            const block = [];
            path.scope.rename(path.get(`left.declarations.0.id.elements.0`).node.name);
            path.scope.rename(path.get(`left.declarations.0.id.elements.1`).node.name);
            path.get('right').node.elements.forEach(expr => {
              const name1 = path.get(`left.declarations.0.id.elements.0`).node.name;
              const name2 = path.get(`left.declarations.0.id.elements.1`).node.name;
              block.push(
                t.variableDeclaration(
                  "const",
                  [t.variableDeclarator(t.identifier(name1), t.cloneDeep(expr.elements[0]))]
                )
              );
              block.push(
                t.variableDeclaration(
                  "const",
                  [t.variableDeclarator(t.identifier(name2), t.cloneDeep(expr.elements[1]))]
                )
              );
              path.get(`body`).node.body.forEach(expr => {
                block.push(t.cloneDeep(expr));
              });
              path.scope.rename(path.get(`left.declarations.0.id.elements.0`).node.name);
              path.scope.rename(path.get(`left.declarations.0.id.elements.1`).node.name);
            });
            // path.insertBefore(t.blockStatement(block));
            // path.getStatementParent().insertBefore(t.blockStatement(block));
            block.forEach(n => path.insertBefore(n));
            path.remove();
          }
        }
      },
    },
    // BlockStatement: {
    //   exit(path, state) {
    //     if (path.parentPath.isBlockStatement()) {
    //       path.node.body.forEach(node => path.insertBefore(t.cloneDeep(node)));
    //       path.remove();
    //     }
    //     // if (!path.parentPath.isConditional() && path.parentPath.is)
    //   },
    // },
    ConditionalExpression: {
      exit(path, state) {
        const maybeMember = memberLookup(path.get('test'), state);
        // logString(path, `${JSON.stringify(path.node.test)} = ${JSON.stringify(maybeMember)}`);
        if (
          t.isFunctionExpression(maybeMember) ||
          t.isLiteral(maybeMember) && maybeMember.value
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(path.node.consequent);
        }
        if (
          t.isConditionalExpression(path.node) &&
          t.isMemberExpression(path.node.test) &&
          (
            t.isIdentifier(path.node.test.object) &&
            t.isFunctionExpression(state[path.node.test.object.name]) ||
            t.isMemberExpression(path.node.test.object) &&
            t.isIdentifier(path.node.test.object.object) &&
            t.isFunctionExpression(state[path.node.test.object.object.name])
          )
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(path.node.alternate);
        }
      },
    },
    CallExpression: {
      enter(path, state) {
        if (memberLookup(path.get('callee'), state)) {
          state.__changed = (state.__changed || 0) + 1;
          memberReplace(path.get('callee'), state);
        }
        if (path.get("callee").isFunctionExpression()) {
          // state = Object.assign({}, state, { __parentstate: state });
          const args = path.node.arguments;
          const params = path.node.callee.params;
          params.forEach((p, i) => {
          });
        }
      },
      exit(path, state) {
        if (memberLookup(path.get('callee'), state)) {
          state.__changed = (state.__changed || 0) + 1;
          memberReplace(path.get('callee'), state);
        }
        if (path.get("callee").isFunctionExpression()) {
          state.__changed = (state.__changed || 0) + 1;
          const args = path.node.arguments;
          const params = path.node.callee.params;
          params.forEach((p, i) => {
            path.get("callee").scope.rename(p.name);
            path
              .getStatementParent()
              .insertBefore(
                t.variableDeclaration(
                  "const",
                  [t.variableDeclarator(p, args[i])]
                )
              );
            if (
              path.get(`arguments.${i}`).isIdentifier() &&
              t.isFunctionExpression(state[args[i].name])
            ) {
              state[p.name] = state[args[i].name];
            }
            if (path.get(`arguments.${i}`).isLiteral()) {
              state[p.name] = args[i];
            }
          });
          path.getStatementParent().scope.crawl();
        }
        if (path.get("callee").isFunctionExpression()) {
          state.__changed = (state.__changed || 0) + 1;
          let hasReturn = false;
          path.get("callee.body").node.body.forEach(expr => {
            if (t.isReturnStatement(expr)) {
              hasReturn = true;
              path.replaceWith(t.cloneDeep(expr.argument));
            } else {
              path.getStatementParent().insertBefore(t.cloneDeep(expr));
            }
          });
          if (!hasReturn) {
            path.remove();
          }
        }
        if (path.isCallExpression()) {
          path.node.arguments.forEach(arg => {
            for (const key in state) {
              if (matchesMember(state[key], arg, true)) {
                state[key] = null;
              }
            }
          });
        }
      }
    }
  };

  const lookupAndOps = {
    VariableDeclarator: {
      exit(path, state) {
        if (
          path.get('init').isIdentifier() &&
          (
            t.isIdentifier(state[path.node.init.name]) ||
            t.isMemberExpression(state[path.node.init.name])
          )
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.get('init').replaceWith(t.cloneDeep(state[path.node.init.name]));
        }
        if (path.getStatementParent().isLoop()) {
          state[path.node.id.name] = null;
          return;
        }
        if (
          path.get('init').isLiteral() ||
          path.get('init').isObjectExpression() ||
          path.get('init').isArrayExpression() ||
          path.get('init').isIdentifier() ||
          path.get('init').isMemberExpression() ||
          path.get('init').isFunction()
        ) {
          state[path.node.id.name] = path.node.init;
        }
      },
    },
    ConditionalExpression: {
      exit(path, state) {
        const maybeMember = memberLookup(path.get('test'), state);
        // logString(path, `${JSON.stringify(path.node.test)} = ${JSON.stringify(maybeMember)}`);
        if (
          t.isFunctionExpression(maybeMember) ||
          t.isLiteral(maybeMember) && maybeMember.value
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(path.node.consequent);
        }
        if (
          t.isConditionalExpression(path.node) &&
          t.isMemberExpression(path.node.test) &&
          t.isIdentifier(path.node.test.object) &&
          t.isFunctionExpression(state[path.node.test.object.name])
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(path.node.alternate);
        }
      },
    },
    CallExpression: {
      exit(path, state) {
        if (
          path.get('callee').isMemberExpression() &&
          path.get('callee.object').isIdentifier() &&
          path.get('callee.object').node.name === 'Object' &&
          path.get('callee.property').node.name === 'entries' &&
          path.get('arguments.0').isObjectExpression()
        ) {
          const ary = t.arrayExpression([]);
          path.get('arguments.0').node.properties.forEach(property => {
            ary.elements.push(t.arrayExpression([
              t.stringLiteral(property.key.name),
              property.value,
            ]));
          });
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(ary);
        }
        if (
          path.get('callee').isMemberExpression() &&
          path.get('callee.object').isIdentifier() &&
          path.get('callee.object').node.name === 'Object' &&
          path.get('callee.property').node.name === 'keys' &&
          path.get('arguments.0').isObjectExpression()
        ) {
          const ary = t.arrayExpression([]);
          path.get('arguments.0').node.properties.forEach(property => {
            ary.elements.push(t.stringLiteral(property.key.name));
          });
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(ary);
        }
        if (
          path.isCallExpression() &&
          path.get('callee').isMemberExpression() &&
          path.get('callee.object').isIdentifier() &&
          path.get('callee.object').node.name === 'Object' &&
          path.get('callee.property').node.name === 'entries' &&
          path.get('arguments.0').isIdentifier() &&
          !(
            path.getStatementParent().isVariableDeclaration() ||
            path.getStatementParent().isExpressionStatement() &&
            path.getStatementParent().get('expression').isAssignmentExpression()
          ) &&
          path.scope.getBinding(path.node.arguments[0].name)
        ) {
          const binding = path.scope.getBinding(path.node.arguments[0].name);
          const name = `__Object_entries_${path.node.arguments[0].name}`;
          if (
            binding.path.parentPath.isFunctionExpression() &&
            !binding.path.parent.body.body.find(node => (
              t.isVariableDeclaration(node) &&
              node.declarations[0].id.name === name
            ))
          ) {
            const id = t.identifier(name);
            binding.path.parent.body.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(id, t.cloneDeep(path.node))
              ])
            );
            state.__changed = (state.__changed || 0) + 1;
            path.replaceWith(t.cloneDeep(id));
          }
          if (
            binding.path.parentPath.isFunctionExpression() &&
            binding.path.parent.body.body.find(node => (
              t.isVariableDeclaration(node) &&
              node.declarations[0].id.name === name
            ))
          ) {
            const id = t.identifier(name);
            state.__changed = (state.__changed || 0) + 1;
            path.replaceWith(t.cloneDeep(id));
          }
          if (path.isCallExpression()) {
            path.node.arguments.forEach(arg => {
              for (const key in state) {
                if (matchesMember(state[key], arg, true)) {
                  state[key] = null;
                }
              }
            });
          }
        }
        if (
          path.isCallExpression() &&
          path.get('callee').isMemberExpression() &&
          path.get('callee.object').isIdentifier() &&
          path.get('callee.object').node.name === 'Object' &&
          path.get('callee.property').node.name === 'keys' &&
          path.get('arguments.0').isIdentifier() &&
          !(
            path.getStatementParent().isVariableDeclaration() ||
            path.getStatementParent().isExpressionStatement() &&
            path.getStatementParent().get('expression').isAssignmentExpression()
          ) &&
          path.scope.getBinding(path.node.arguments[0].name)
        ) {
          const binding = path.scope.getBinding(path.node.arguments[0].name);
          const name = `__Object_keys_${path.node.arguments[0].name}`;
          if (
            binding.path.parentPath.isFunctionExpression() &&
            !binding.path.parent.body.body.find(node => (
              t.isVariableDeclaration(node) &&
              node.declarations[0].id.name === name
            ))
          ) {
            const id = t.identifier(name);
            binding.path.parent.body.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(id, t.cloneDeep(path.node))
              ])
            );
            state.__changed = (state.__changed || 0) + 1;
            path.replaceWith(t.cloneDeep(id));
          }
          if (
            binding.path.parentPath.isFunctionExpression() &&
            binding.path.parent.body.body.find(node => (
              t.isVariableDeclaration(node) &&
              node.declarations[0].id.name === name
            ))
          ) {
            const id = t.identifier(name);
            state.__changed = (state.__changed || 0) + 1;
            path.replaceWith(t.cloneDeep(id));
          }
        }
      },
    },
    AssignmentExpression: {
      enter(path, state) {
        if (
          path.get('left').isIdentifier()
        ) {
          const binding = path.scope.getBinding(path.node.left.name);
          if (
            binding &&
            t.isVariableDeclaration(binding.path.parent) &&
            binding.path.parent.kind === 'const'
          ) {
            state.__changed = (state.__changed || 0) + 1;
            binding.path.parent.kind = 'let';
          }
        }
        if (
          path.get('left').isIdentifier() &&
          path.getStatementParent().isLoop()
        ) {
          state[path.node.id.name] = null;
          return;
        }
      },
      // enter(path, state) {
      // },
      exit(path, state) {
        if (
          path.get('left').isIdentifier() &&
          path.getStatementParent().isLoop()
        ) {
          state[path.node.id.name] = null;
          return;
        }
        for (const key in state) {
          if (matchesMember(path.node.left, state[key])) {
            state[key] = null;
          }
        }
        if (
          path.get('right').isIdentifier() &&
          (
            t.isIdentifier(state[path.node.right.name])
            // t.isMemberExpression(state[path.node.right.name])
          )
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.get('right')
          .replaceWith(t.cloneDeep(state[path.node.right.name]));
        }
        if (path.get('left').isIdentifier()) {
          const name = path.node.left.name;
          if (
            path.get('right').isIdentifier() &&
            t.isLiteral(state[path.node.right.name])
          ) {
            state.__changed = (state.__changed || 0) + 1;
            path.get('right')
            .replaceWith(t.cloneDeep(state[path.node.right.name]));
          }
          if (
            path.get('right').isNumericLiteral() ||
            path.get('right').isObjectExpression() ||
            path.get('right').isArrayExpression()
          ) {
            state[name] = path.node.right;
          }
          else {
            state[name] = null;
          }

          if (!path.scope.__names) {
            path.scope.__names = [];
          }
          if (!path.scope.__names.find(n => n === name)) {
            path.scope.__names.push(name);
          }
        }
      }
    },
    IfStatement: {
      exit(path, state) {
        const r = path.get('test').evaluate();
        if (
          r.confident && r.value ||
          t.isLiteral(path.node.test) && path.node.test.value ||
          t.isFunctionExpression(path.node.test) ||
          t.isObjectExpression(path.node.test) ||
          t.isArrayExpression(path.node.test)
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(path.node.consequent);
        }
        else if (
          path.node.alternate && (
            r.confident ||
            t.isLiteral(path.node.test) && !path.node.test.value
          )
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(path.node.alternate);
        }
        else if (
          r.confident ||
          t.isLiteral(path.node.test) && !path.node.test.value
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.remove();
        }
      },
    },
    BlockStatement: {
      exit(path, state) {
        if (
          (
            path.parentPath.isConditional() ||
            path.parentPath.isLoop()
          ) &&
          path.scope.__names
        ) {
          for (let name of path.scope.__names) {
            if (state[name]) {
              state[name] = null;
            }
          }
        }
      },
    },
    MemberExpression: {
      exit(path, state) {
        if (
          path.node.computed &&
          path.get('property').isStringLiteral()
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(
            t.memberExpression(
              path.node.object,
              t.identifier(path.node.property.value)
            )
          );
        }

        if (path.parentPath.isMemberExpression()) {
          return;
        }

        if (
          path.parentPath.isAssignmentExpression() &&
          path.parent.left === path.node
        ) {
          return;
        }

        // let stack = [];
        // let node = path.node;
        // while (t.isMemberExpression(node)) {
        //   if (node.computed) {return;}
        //   if (!t.isIdentifier(node.property)) {return;}
        //   stack.unshift(node.property.name);
        //   node = node.object;
        // }
        // // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${String(stack)}`)));
        // if (!t.isIdentifier(node)) {return;}
        // let value = state[node.name];
        // // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${JSON.stringify(node.name)}`)));
        // // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${JSON.stringify(value)}`)));
        // while (t.isObjectExpression(value) && stack.length > 0) {
        //   const name = stack.shift();
        //   // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${name}`)));
        //   value = value.properties.find(prop => prop.key.name === name);
        //   if (value) {
        //     value = value.value;
        //   }
        // }
        // // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${stack.length} ${JSON.stringify(value)}`)));
        // if (t.isLiteral(value)) {
        //   state.__changed = (state.__changed || 0) + 1;
        //   path.replaceWith(t.cloneDeep(value));
        // }
        let value = memberLookup(path, state);
        if (
          t.isLiteral(value) ||
          t.isIdentifier(value)
          // t.isMemberExpression(value) ||
          // t.isFunctionExpression(value)
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(t.cloneDeep(value));
        }
      },
    },
    Identifier(path, state) {
      if (
        // !path.findParent(n => t.isLoop(n)) &&
        path.parent.id !== path.node &&
        (
          path.parentPath.isAssignmentExpression() &&
          path.parent.left !== path.node ||
          !path.parentPath.isAssignmentExpression()
        ) &&
        path.parent.object !== path.node &&
        (
          path.parent.property !== path.node ||
          path.parent.property === path.node &&
          path.parent.computed
        )
      ) {
        if (
          t.isFunctionExpression(state[path.node.name]) &&
          (
            !path.parentPath.isArrayExpression() ||
            !path.parentPath.isObjectExpression()
          )
        ) {
          return;
        }
        if (
          (
            t.isArrayExpression(state[path.node.name]) ||
            t.isObjectExpression(state[path.node.name]) ||
            t.isFunctionExpression(state[path.node.name])
          ) &&
          path.findParent(n => t.isForOfStatement(n)) &&
          !path
          .findParent(n => t.isForOfStatement(n))
          .get('right').find(n => path.findParent(n2 => n === n2))
        ) {
          return;
        }
        if (state[path.node.name] && isStatic(state[path.node.name], state)) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(t.cloneDeep(state[path.node.name]));
        }
      }
    },
    BinaryExpression: {
      exit(path, state) {
        // const e = path.evaluate();
        // if (e.confident) {
        // }
        if (
          path.get('left').isLiteral() && path.get('right').isLiteral() &&
          (path.node.operator === '*' || path.node.operator === '+')
        ) {
          const e = path.evaluate();
          if (e.confident && typeof e.value === 'number') {
            state.__changed = (state.__changed || 0) + 1;
            path.replaceWith(t.numericLiteral(e.value));
          }
          if (e.confident && typeof e.value === 'string') {
            state.__changed = (state.__changed || 0) + 1;
            path.replaceWith(t.stringLiteral(e.value));
          }
        }
        if (
          path.get('left').isBinaryExpression() &&
          path.node.left.operator === '*' && path.node.operator === '*' &&
          path.get('left.right').isLiteral() && path.get('right').isLiteral()
        ) {
          state.__changed = (state.__changed || 0) + 1;
          path.replaceWith(
            t.binaryExpression(
              '*',
              path.node.left.left,
              t.binaryExpression('*', path.node.left.right, path.node.right)
            )
          );
          const e = path.get('right').evaluate();
          if (e.confident && typeof e.value === 'number') {
            state.__changed = (state.__changed || 0) + 1;
            path.get('right').replaceWith(t.numericLiteral(e.value));
          }
        }
      },
    },
  };

  const refCount = {
    Identifier(path, state) {
      if (path.getStatementParent().parentPath.isProgram()) {
        return;
      }
      if (path.parent.id === path.node) {
        if (!(state[path.node.name] || {}).node) {
          // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(path.node.name)));
          state[path.node.name] = {node: path.node, refs: [], refsFrom: []};
        }
      }
      if (
        path.findParent(parentPath => parentPath.isVariableDeclarator()) &&
        path.findParent(parentPath => parentPath.isVariableDeclarator())
        .node.id.name !== path.node.name
      ) {
        const declId = path.findParent(parentPath => parentPath.isVariableDeclarator()).node.id.name;
        const id = path.node.name;
        if ((state[id] || {}).node) {
          if (!(state[declId] || {}).node) {
            state[declId] = {node: path.parent.id, refs: [], refsFrom: []};
          }
          state[declId].refs.push(id);
          if (!(state[id] || {}).node) {
            state[id] = {node: path.node, refs: [], refsFrom: []};
          }
          state[id].refsFrom.push(declId);
        }
      }
      // otherId = ... id ...
      if (
        path.getStatementParent().isExpressionStatement() &&
        path.getStatementParent().get('expression').isAssignmentExpression() &&
        path.findParent(t.isAssignmentExpression).get('left').isIdentifier() &&
        path.findParent(t.isAssignmentExpression).node.left.name !== path.node.name
      ) {
        const declId = path.findParent(t.isAssignmentExpression).node.left.name;
        const id = path.node.name;
        if ((state[id] || {}).node) {
          if (!(state[declId] || {}).node) {
            state[declId] = {node: path.parent.id, refs: [], refsFrom: []};
          }
          state[declId].refs.push(id);
          if (!(state[id] || {}).node) {
            state[id] = {node: path.node, refs: [], refsFrom: []};
          }
          state[id].refsFrom.push(declId);
        }
      }
      // otherId.b.c = ... id ...
      if (
        path.getStatementParent().isExpressionStatement() &&
        path.getStatementParent().get('expression').isAssignmentExpression() &&
        path.findParent(t.isAssignmentExpression).get('left').isMemberExpression() &&
        !path.findParent(parent => parent.node === path.findParent(t.isAssignmentExpression).node.left)
      ) {
        // if (!path.findParent(t.isAssignmentExpression).get('right').isFunctionExpression()) {
          const id = path.node.name;
          if (!(state[id] || {}).node) {
            state[id] = {node: path.node, refs: [], refsFrom: []};
          }
          state[id].refsFrom.push('__member_expression__');
        // }
      }
      if (path.getStatementParent().isReturnStatement()) {
        const id = path.node.name;
        if (!(state[id] || {}).node) {
          state[id] = {node: path.node, refs: [], refsFrom: []};
        }
        state[id].refsFrom.push('__return__');
      }
    },
  };

  const deadCode = {
    Identifier(path, state) {
      if (
        path.parent.id === path.node
      ) {
        // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${path.node.nodeame}: ${String((state[path.node.name] || {refsFrom: []}).refsFrom.length)}`)));
      }
      if (
        (
          path.parent.id === path.node ||
          path.parent.left === path.node ||
          path.parent.object === path.node
        ) &&
        state[path.node.name] &&
        state[path.node.name].refsFrom.length === 0
      ) {
        if (!path.getStatementParent().parentPath.isProgram()) {
          path.getStatementParent().remove();
        }
      }
    },
  };

  const renameStateToDest = {
    Identifier(path, state) {
      for (const item of state) {
        if (path.node.name === item.state) {
          path.node.name = item.dest;
        }
      }
    },
  };

  const fastRenameTo = (state, node, idMember, idNew) => {
    t.traverseFast(node, node => {
      for (const item of state) {
        if (node.name === item[idMember]) {
          node.name = item[idNew];
        }
      }
    });
  };
  

  const fastRenameStateToDest = (state, node) => {
    t.traverseFast(node, node => {
      for (const item of state) {
        if (node.name === item.state) {
          node.name = item.dest;
        }
      }
    });
  };

  const renameStateToSrc = {
    Identifier(path, state) {
      for (const item of state) {
        if (path.node.name === item.state) {
          path.node.name = item.src;
        }
      }
    },
  };

  const fastRenameStateToSrc = (state, node) => {
    t.traverseFast(node, node => {
      for (const item of state) {
        if (node.name === item.state) {
          node.name = item.src;
        }
      }
    });
  };

  const findStateId = (state, node) => (
    state.varStack.find(item => item.state === node.name)
  );

  const findIdItem = (idMember, state, node) => (
    state.varStack.find(item => item[idMember] === node.name)
  );

  const isId = (idMember, state, node) => {
    state.varStack.find(item => item[idMember] === node.name)
  };

  const isStateId = (state, node) => (
    state.varStack.find(item => item.state === node.name)
  );

  const isDestId = (state, node) => (
    state.varStack.find(item => item.dest === node.name)
  );

  const isSrcId = (state, node) => (
    state.varStack.find(item => item.src === node.name)
  );

  const memberOfState = (state, node, isId = isStateId) => (
    t.isMemberExpression(node) ?
      memberOfState(state, node.object) :
      isId(state, node)
  );

  const isStateExpression = (state, node, isId = isStateId) => {
    let is = false;
    let na = false;
    t.traverseFast(node, node => {
      if (t.isFunction(node)) {
        na = true;
      }
      if (isId(state, node)) {
        is = true;
      }
    });
    return !na && is;
  };

  let toBResult = 0;

  const toBOrLerp = {
    CallExpression: {
      exit(path, state) {
        if (
          path.findParent(parent => (
            path.getStatementParent() || path.isCallExpression()
          )).isCallExpression() ||
          path.getStatementParent().isVariableDeclaration()
        ) {
          return;
        }
        state.callExpressions = (state.callExpressions || 0) + 1;
        if (
          path.get('callee').isMemberExpression() &&
          path.get('callee.property').isIdentifier() &&
          path.node.callee.property.name === 'toB'
        ) {
          return;
        }
        if (
          !path.get('callee').isMemberExpression() &&
          !path.get('callee').isIdentifier()
        ) {
          return;
        }
        let aObject = path.node.callee;
        traverse.cheap(path.node.callee, node => {
          if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
            aObject = node.object;
          }
        });
        if (
          !state.parent.params
          .find(p => t.isIdentifier(p) && p.name === aObject.name) &&
          aObject.name !== state.aId.name
        ) {
          return;
        }
        const bMember = t.cloneDeep(path.node.callee);
        traverse.cheap(bMember, node => {
          if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
            node.object = state.bId;
          }
        });
        const toB = t.memberExpression(path.node.callee, t.identifier('toB'));
        const resultId = '_result' + (toBResult++);
        const cond = t.callExpression(
          t.functionExpression(
            null,
            [],
            t.blockStatement([
              t.variableDeclaration(
                'let',
                [
                  t.variableDeclarator(t.identifier(resultId)),
                ]
              ),
              t.ifStatement(
                toB,
                t.blockStatement([
                  t.expressionStatement(
                    t.assignmentExpression(
                      '=',
                      t.identifier(resultId),
                      t.callExpression(
                        toB,
                        [bMember].concat(t.cloneDeep(path.node).arguments)
                      )
                    )
                  ),
                ]),
                t.blockStatement([
                  t.expressionStatement(
                    t.assignmentExpression(
                      '=',
                      t.identifier(resultId),
                      path.node.arguments.length > 0 ?
                        t.callExpression(state.lerpId, [
                          t.cloneDeep(path.node.arguments[0]),
                          t.cloneDeep(path.node),
                          t.callExpression(bMember, t.cloneDeep(path.node).arguments)
                        ]) :
                        t.cloneDeep(path.node)
                    )
                  ),
                ])
              ),
              t.returnStatement(t.identifier(resultId)),
            ])
          ),
          []
        );
        // const cond = t.conditionalExpression(
        //   toB,
        //   t.callExpression(toB, t.cloneDeep(path.node).arguments),
        //   path.node.arguments.length > 0 ?
        //     t.callExpression(state.lerpId, [
        //       t.cloneDeep(path.node.arguments[0]),
        //       t.cloneDeep(path.node),
        //       t.callExpression(bMember, t.cloneDeep(path.node).arguments)
        //     ]) :
        //     t.cloneDeep(path.node)
        // );
        path.replaceWith(cond);
        path.skip();
      },
    },
    ReturnStatement: {
      exit(path, state) {
        if (state.callExpressions) {
          return;
        }
        path.get('argument').replaceWith(t.callExpression(state.lerpId, [
          t.identifier('t'),
          t.callExpression(state.aId, t.cloneDeep(state.original).params),
          t.callExpression(state.bId, t.cloneDeep(state.original).params)
        ]));
      },
    },
  };

  const copyGen = {
    VariableDeclarator: {
      enter(path, state) {
        // const f = function(state, element, ...
        if (
          path.get('init').isFunctionExpression() &&
          path.get('init').node.params.length > 1 &&
          // Only create copy for update functions with the param signature
          // state, element
          path.node.init.params[0].name === 'state' &&
          path.node.init.params[1].name === 'element'
        ) {
          state.varStack = [
            {
              state: path.get('init.params.0').node.name,
              dest: 'dest',
              src: 'src',
            },
          ];
          state.blockStack = state.blockStack || [];
          state.block = t.blockStatement([]);
          state[path.get('id').node.name + '_copy'] = t.functionExpression(
            // id
            null,
            // parameters
            [t.identifier('dest'), t.identifier('src')],
            // body
            state.block
          );
        }
        // const f = function(t, ...
        if (
          path.get('init').isFunctionExpression() &&
          path.get('init').node.params.length > 0 &&
          // Only create toB for animate functions with the param signature
          // t, ...
          path.node.init.params[0].name === 't'
        ) {
          state[path.node.id.name] = path.node.init;
          // state[path.node.id.name] = path.node.init.params;

          const toB = state[path.get('id').node.name + '_toB'] = t.cloneDeep(path.node.init);
          toB.params.unshift(t.identifier('b'));

          let statement = t.binaryExpression('>=', t.identifier('t'), t.numericLiteral(1));
          const parentFunction = path.getFunctionParent().node;
          for (const param of parentFunction.params.reverse()) {
            if (t.isIdentifier(param)) {
              statement =
                t.logicalExpression(
                  '&&',
                  t.conditionalExpression(
                    t.memberExpression(param, t.identifier('done')),
                    t.callExpression(
                      t.memberExpression(param, t.identifier('done')),
                      t.cloneDeep(path.node.init).params
                    ),
                    t.booleanLiteral(true)
                  ),
                  statement
                );
            }
          }

          state[path.node.id.name + '_done'] = t.functionExpression(
            null,
            [t.identifier('t')],
            t.blockStatement([
              t.returnStatement(statement)
            ])
          );
        }
        // const _state = state.b.c
        if (
          state.block &&
          isStateExpression(state, path.node.init)
        ) {
          const varState = {
            state: path.node.id.name,
            dest: `_dest${state.varStack.length}`,
            src: `_src${state.varStack.length}`,
          };
          state.varStack.push(varState);
          // const _dest = dest.b.c
          let statement = t.variableDeclaration(
            path.parent.kind, [t.cloneDeep(t.cloneDeep(path.node))]
          );
          fastRenameStateToDest(state.varStack, statement);
          state.block.body.push(statement);
          // const _src = src.b.c
          statement = t.variableDeclaration(
            path.parent.kind, [t.cloneDeep(t.cloneDeep(path.node))]
          );
          fastRenameStateToSrc(state.varStack, statement);
          state.block.body.push(statement);
        }
      },
      exit(path, state) {
        if (
          state.block &&
          path.get('init').isFunctionExpression() &&
          state[path.get('id').node.name + '_copy']
        ) {
          state.block = null;
        }
        if (
          state.toBBlock &&
          path.get('init').isFunctionExpression() &&
          state[path.get('id').node.name + '_toB']
        ) {
          state.toBBlock = null;
          state.doneBlock = null;
        }
      },
    },
    AssignmentExpression(path, state) {
      if (state.block) {
        // state = ...
        if (
          path.get('left').isIdentifier() &&
          isStateId(state, path.get('left').node)
        ) {
          let right = t.cloneDeep(path.node.right);
          if (path.get('right').isCallExpression()) {
            const copyFn = t.memberExpression(t.cloneDeep(path.node.right.callee), t.identifier('copy'));
            right = t.conditionalExpression(
              copyFn,
              t.callExpression(t.cloneDeep(copyFn), [
                t.cloneDeep(path.node.left),
                t.cloneDeep(path.node.left)
              ]),
              t.cloneDeep(path.node.left)
            );
            fastRenameStateToDest(state.varStack, right.consequent.arguments[0]);
            fastRenameStateToSrc(state.varStack, right.consequent.arguments[1]);
            fastRenameStateToSrc(state.varStack, right);
          }
          const statement = t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier(findStateId(state, path.node.left).dest),
              right
            )
          );
          traverse(statement, renameStateToDest, path.scope, state.varStack);
          state.block.body.push(statement);
        }
        // state.b.c = _state
        // dest.b.c = _dest
        if (
          path.get('left').isMemberExpression() &&
          path.get('right').isIdentifier() &&
          isStateId(state, path.node.right)
        ) {
          const statement = t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.cloneDeep(path.node.left),
              t.identifier(findStateId(state, path.node.right).dest)
            )
          );
          traverse(statement.expression.left, renameStateToDest, path.scope, state.varStack);
          state.block.body.push(statement);
        }
        // state.a.b = ...
        // dest.a.b = src.a.b
        else if (
          path.get('left').isMemberExpression() &&
          memberOfState(state, path.node.left)
        ) {
          const left = t.cloneDeep(path.node.left);
          traverse(left, renameStateToDest, path.scope, state.varStack);
          let right = t.cloneDeep(path.node.left);
          if (path.get('right').isCallExpression()) {
            const copyFn = t.memberExpression(t.cloneDeep(path.node.right.callee), t.identifier('copy'));
            right = t.conditionalExpression(
              copyFn,
              t.callExpression(t.cloneDeep(copyFn), [
                t.cloneDeep(right),
                t.cloneDeep(right)
              ]),
              right
            );
            traverse(right.consequent.arguments[0], renameStateToDest, path.scope, state.varStack);
            traverse(right.consequent.arguments[1], renameStateToSrc, path.scope, state.varStack);
          }
          traverse(right, renameStateToSrc, path.scope, state.varStack);
          const statement = t.expressionStatement(
            t.assignmentExpression('=', left, right)
          );
          state.block.body.push(statement);
        }
      }
      else if (
        t.isMemberExpression(path.node.left) &&
        t.isIdentifier(path.node.left.object) &&
        t.isIdentifier(path.node.left.property) &&
        path.node.left.property.name === 'copy' &&
        state[path.node.left.object.name + '_copy']
      ) {
        state[path.node.left.object.name + '_copy'] = null;
      }
      else if (
        t.isMemberExpression(path.node.left) &&
        t.isIdentifier(path.node.left.object) &&
        t.isIdentifier(path.node.left.property) &&
        path.node.left.property.name === 'toB' &&
        state[path.node.left.object.name + '_toB']
      ) {
        state[path.node.left.object.name + '_toB'] = null;
      }
      else if (
        t.isMemberExpression(path.node.left) &&
        t.isIdentifier(path.node.left.object) &&
        t.isIdentifier(path.node.left.property) &&
        path.node.left.property.name === 'done' &&
        state[path.node.left.object.name + '_done']
      ) {
        state[path.node.left.object.name + '_done'] = null;
      }
    },
    Loop: {
      enter(path, state) {
        if (state.block) {
          const block = t.blockStatement([]);
          const statement = t.cloneDeep(path.node);
          statement.body = block;
          state.block.body.push(statement);
          state.blockStack.push(state.block);
          fastRenameStateToSrc(state.varStack, statement);
          state.block = block;
        }
      },
      exit(path, state) {
        if (state.block) {
          state.block = state.blockStack.pop();
        }
      },
    },
    ReturnStatement(path, state) {
      if (state.block) {
        if (path.get('argument').isCallExpression()) {
          const copyFn = t.memberExpression(t.cloneDeep(path.node.argument.callee), t.identifier('copy'));
          const statement = t.conditionalExpression(
            copyFn,
            t.callExpression(t.cloneDeep(copyFn), [
              t.cloneDeep(path.node.argument.arguments[0]),
              t.cloneDeep(path.node.argument.arguments[0])
            ]),
            t.cloneDeep(path.node.argument.arguments[0])
          );
          fastRenameStateToDest(state.varStack, statement.consequent.arguments[0]);
          fastRenameStateToSrc(state.varStack, statement.consequent.arguments[1]);
          fastRenameStateToSrc(state.varStack, statement);
          state.block.body.push(t.returnStatement(statement));
        }
        else if (isStateId(state, path.node.argument)) {
          const statement = t.cloneDeep(path.node);
          traverse(statement, renameStateToDest, path.scope, state.varStack);
          state.block.body.push(statement);
        }
        else {
          const statement = t.returnStatement(t.identifier('src'));
          state.block.body.push(statement);
        }
      }
      else if (
        t.isIdentifier(path.node.argument) &&
        state[path.node.argument.name + '_copy']
      ) {
        path.getStatementParent().insertBefore(t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(path.node.argument, t.identifier('copy')),
            state[path.node.argument.name + '_copy']
          )
        ));
      }
      if (
        t.isIdentifier(path.node.argument) &&
        state[path.node.argument.name + '_toB']
      ) {
        // const lerp = function(t, b, e) {
        //   return (e - b) * Math.min(1, t) + b;
        // };
        path.getStatementParent().insertBefore(
          t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier('lerp'), t.functionExpression(
              null,
              [t.identifier('t'), t.identifier('b'), t.identifier('e')],
              t.blockStatement([
                t.returnStatement(
                  t.binaryExpression(
                    '+',
                    t.binaryExpression(
                      '*',
                      t.binaryExpression(
                        '-',
                        t.identifier('e'),
                        t.identifier('b')
                      ),
                      t.callExpression(
                        t.memberExpression(t.identifier('Math'), t.identifier('min')),
                        [t.numericLiteral(1), t.identifier('t')],
                      )
                    ),
                    t.identifier('b')
                  )
                )
              ])
            ))
          ])
        );
        path.insertBefore(t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(path.node.argument, t.identifier('toB')),
            state[path.node.argument.name + '_toB']
          )
        ));
        const toBPath = path.getPrevSibling();
        toBPath.traverse(toBOrLerp, {
          aId: path.node.argument,
          bId: t.identifier('b'),
          lerpId: t.identifier('lerp'),
          original: state[path.node.argument.name],
          parent: path.getFunctionParent().node,
        });
      }
      if (
        t.isIdentifier(path.node.argument) &&
        state[path.node.argument.name + '_done']
      ) {
        path.insertBefore(t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(path.node.argument, t.identifier('done')),
            state[path.node.argument.name + '_done']
          )
        ));
      }
    },
  };

  return {
    visitor: {
      Program(path) {
        let n = 10;

        path.traverse(copyGen, {});
        // return;

        let changed = 1;
        while (n-- && changed) {
          changed = 0;
          let state = {};
          path.traverse(inlineFunctions, state);
          changed += state.__changed || 0;
          state = {};
          path.traverse(lookupAndOps, state);
          changed += state.__changed || 0;
        }
        // return;

        let refs = {};
        path.traverse(refCount, refs);
        let lastRefs = refs;
        let removed = Infinity;
        while (removed > 0) {
          removed = 0;
          refs = {};
          path.traverse(deadCode, lastRefs);
          path.traverse(refCount, refs);
          if (Object.keys(refs).length < Object.keys(lastRefs).length) {
            removed = 1;
          }
          lastRefs = refs;
        }

        path.skip();
      },
    }
  };
}
