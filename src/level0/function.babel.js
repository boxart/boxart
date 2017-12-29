const OUTER_ITERATIONS = 100;
const INNER_ITERATIONS = 100;

export default function(babel) {
  const { types: t, traverse } = babel;

  const countChange = state => {
    state.__changed = (state.__changed || 0) + 1;
  };

  const store = (id, state, path) => {
    if (typeof id === 'string') {
      state[id] = path && path.node || path;
    }
    else if (id.node) {
      state[id.node.name] = path && path.node || path;
    }
    else {
      state[id.name] = path && path.node || path;
    }
    return path;
  };

  const load = (id, state) => {
    if (typeof id === 'string') {
      return state[id];
    }
    else if (id.node) {
      return state[id.node.name];
    }
    else {
      return state[id.name];
    }
  };

  function stringifyMember(node) {
    if (t.isIdentifier(node)) {
      return node.name;
    }
    else if (t.isLiteral(node)) {
      return node.value;
    }
    else if (t.isMemberExpression(node)) {
      if (t.computed) {
        return `${stringifyMember(node.object)}[${stringifyMember(node.property)}]`;
      }
      else {
        return `${stringifyMember(node.object)}.${stringifyMember(node.property)}`;
      }
    }
    return '';
  }

  function logString(path, str) {
    path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(str)));
  }

  function isStatic(node, state) {
    if (t.isLiteral(node)) {
      return true;
    }
    else if (t.isIdentifier(node) && isStatic(load(node, state), state)) {
      return true;
    }
    else if (t.isMemberExpression(node) && isStatic(memberLookup(node, state), state)) {
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
    else if (path.isIdentifier() && isStatic(load(path.node, state), state)) {
      return true;
    }
    else if (path.isMemberExpression() && isStatic(memberLookup(path.node, state), state)) {
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
    // console.log('lookup', stringifyMember(path.node || path));
    let stack = [];
    let node = path.node || path;
    while (t.isMemberExpression(node)) {
      if (node.computed) {
        if (t.isIdentifier(node.property)) {
          if (!t.isLiteral(load(node.property, state))) {return;}
          stack.unshift(load(node.property, state).value);
        }
        else if (t.isLiteral(node.property)) {
          stack.unshift(node.property.value);
        }
        else {
          return;
        }
      }
      else {
        if (!t.isIdentifier(node.property)) {return;}
        stack.unshift(node.property.name);
      }
      node = node.object;
    }
    if (!t.isIdentifier(node)) {return;}

    let value = load(node, state);

    if (
      (t.isIdentifier(value) || t.isMemberExpression(value)) &&
      !matchesMember(path.node || path, value)
    ) {
      value = memberLookup(value, state);
    }

    // console.log(JSON.stringify([node.name].concat(stack)));
    // logString(path, JSON.stringify([node.name, value]));
    while (value && (value.properties || value.elements) && stack.length > 0) {
      const name = stack.shift();
      if (value.properties) {
        value = value.properties.find(prop => prop.key.name === name);
      }
      else if (value.elements) {
        value = value.elements[Number(name)];
      }
      // logString(path, JSON.stringify([name, value && value.type]));
      if (t.isObjectProperty(value)) {
        value = value.value;
      }

      if (
        (t.isIdentifier(value) || t.isMemberExpression(value)) &&
        !matchesMember(path.node || path, value)
      ) {
        value = memberLookup(value, state);
      }
    }
    if (stack.length === 0) {
      // t.isMemberExpression(path.node || path) && console.log(JSON.stringify(path.node || path), JSON.stringify(value))
      if (
        (t.isIdentifier(value) || t.isMemberExpression(value)) &&
        !matchesMember(path.node || path, value)
      ) {
        return memberLookup(value, state);
      }
      return value;
    }
  };

  const memberReplace = (path, state) => {
    const value = memberLookup(path, state);
    if (
      t.isLiteral(value) ||
      t.isIdentifier(value) ||
      // t.isMemberExpression(value) ||
      // t.isArrayExpression(value) ||
      t.isFunctionExpression(value)
    ) {
      // console.log(`replace ${stringifyMember(path.node)} ${value.type}`);
      path.replaceWith(t.cloneDeep(value));
    }
    if (t.isFunctionDeclaration(value)) {
      const node = t.cloneDeep(value);
      node.type = 'FunctionExpression';
      path.replaceWith(node);
      // console.log(value);
      // path.replaceWith(t.functionExpression(
      //   null,
      //   value.params.slice(),
      //   t.cloneDeep(value.body)
      // ));
    }
  };

  const memberStore = (path, state, rhs) => {
    let stack = [];
    let node = path.node || path;
    while (t.isMemberExpression(node)) {
      if (node.computed) {return;}
      if (!t.isIdentifier(node.property)) {return;}
      stack.unshift(node.property.name);
      node = node.object;
    }
    if (!t.isIdentifier(node)) {return;}
    let value = load(node, state);
    if (!value) {
      value = store(node, state, {});
    }
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
          // console.log(`${value.properties.find(prop => prop.key.name === name).value}, ${stringifyMember(rhs)}`)
          value.properties.find(prop => prop.key.name === name).value = rhs;
          value = null;
        }
        else if (rhs) {
          value.properties.push(t.objectProperty(t.identifier(name), rhs));
          value = value.properties[value.properties.length - 1];
        }
      }
    }
  };

  const matchesMember = function(a, b, partial) {
    const aList = [];
    const bList = [];

    let _a = a;
    while (t.isMemberExpression(_a)) {
      aList.unshift(_a);
      _a = _a.object;
    }

    let _b = b;
    while (t.isMemberExpression(_b)) {
      bList.unshift(_b);
      _b = _b.object;
    }

    if (!t.isIdentifier(_a) || !t.isIdentifier(_b)) {
      return false;
    }
    else if (_a.name !== _b.name) {
      return false;
    }

    if (partial && aList.length <= bList.length) {
      return false;
    }
    else if (!partial && aList.length !== bList.length) {
      return false;
    }

    const length = Math.min(aList.length, bList.length);
    for (let i = 0; i < length; i++) {
      if (
        aList[i].computed !== bList[i].computed ||
        !matchesMember(aList[i].property, bList[i].property)
      ) {
        return false;
      }
    }

    return true;
  };

  let _renameUid = 0;
  const renameAll = {
    Identifier(path, state) {
      if (
        t.isFunction(path.parent) ||
        t.isVariableDeclarator(path.parent) && path.parent.id === path.node ||
        t.isArrayPattern(path.parent)
      ) {
        // console.log(`_uid_${path.node.name.split(/^(?:_|uid_|_uid_)|\d+$/g).join('')}${_renameUid}`);
        path.scope.rename(path.node.name, `_uid_${path.node.name.split(/^(?:_|uid_|_uid_)|\d+$/g).join('')}${_renameUid++}`);
      }
      if (!path.node._replaced) {
        path.replaceWith(t.identifier(path.node.name));
        path.node._replaced = true;
        path.skip();
      }
    },
  };

  const crawlNames = {
    Identifier(path, state) {
      if (
        t.isFunction(path.parent) ||
        t.isVariableDeclarator(path.parent) && path.parent.id === path.node ||
        t.isArrayPattern(path.parent)
      ) {
        store(path, state, path);
      }
    }
  };

  const setNames = {
    Identifier(path, state) {
      if (load(path, state)) {
        path.node.name = load(path, state);
      }
    },
  };

  const inlineNames = {};

  const inlineFunctions = {
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
            if (load(name, state)) {
              store(name, state, null);
            }
          }
          path.scope.__names = [];
        }
      },
    },
    FunctionDeclaration: {
      enter(path, state) {
        const id = path.node.id;
        if (!id || !id.name) {return;}

        path.scope.rename(id.name);
        inlineNames[id.name] = true;
        if (path.getStatementParent().isLoop()) {
          store(id, state, null);
          path.skip();
        }
      },
      exit(path, state) {
        const id = path.node.id;
        if (!id || !id.name) {return;}

        const value = path.node;
        const valuePath = path;
        if (path.getStatementParent().isLoop()) {
          store(id, state, null);
          return;
        }

        store(id, state, valuePath);
      }
    },
    VariableDeclarator: {
      enter(path, state) {
        const id = path.node.id;
        if (!id.name) {return;}
        path.scope.rename(id.name);
        inlineNames[id.name] = true;
        if (path.getStatementParent().isLoop()) {
          store(id, state, null);
          path.skip();
        }
      },
      exit(path, state) {
        const id = path.node.id;
        const init = path.node.init;
        const initPath = path.get('init');
        if (path.getStatementParent().isLoop()) {
          store(id, state, null);
          return;
        }
        if (
          t.isIdentifier(initPath) &&
          load(initPath, state) &&
          t.isLiteral(load(initPath, state))
        ) {
          countChange(state);
          // Pass the node init so load returns a node instead of an optional
          // path, if the path is available.
          initPath.replaceWith(t.cloneDeep(load(init, state)));
        }
        if (
          t.isIdentifier(initPath) &&
          t.isFunctionExpression(load(initPath, state))
        ) {
          store(id, state, load(initPath, state));
        }
        if (
          t.isMemberExpression(initPath) &&
          t.isFunctionExpression(memberLookup(initPath, state))
        ) {
          store(id, state, memberLookup(initPath, state));
        }
        if (
          t.isFunctionExpression(initPath) ||
          t.isNumericLiteral(initPath) ||
          t.isArrayExpression(initPath) ||
          t.isObjectExpression(initPath)
        ) {
          store(id, state, initPath);
        }
      }
    },
    AssignmentExpression: {
      // enter(path, state) {
      // },
      exit(path, state) {
        const leftPath = path.get('left');
        const rightPath = path.get('right');
        if (matchesMember(path.node.left, path.node.right)) {
          countChange(state);
          path.remove();
          return;
        }
        if (
          leftPath.isIdentifier() &&
          path.getStatementParent().isLoop()
        ) {
          store(path.node.id, state, null);
          return;
        }
        for (const key in state) {
          if (matchesMember(path.node.left, load(key, state))) {
            store(key, state, null);
          }
        }
        if (
          rightPath.isFunctionExpression() ||
          rightPath.isObjectExpression() ||
          rightPath.isArrayExpression()
        ) {
          memberStore(leftPath, state, path.node.right);
        }
        if (leftPath.isIdentifier()) {
          const name = path.node.left.name;
          if (
            rightPath.isIdentifier() &&
            t.isLiteral(load(rightPath, state))
          ) {
            countChange(state);
            rightPath.replaceWith(t.cloneDeep(load(rightPath, state)));
          }
          if (rightPath.isFunctionExpression()) {
            store(name, state, rightPath);
          }
          else if (
            rightPath.isLiteral() ||
            rightPath.isObjectExpression() ||
            rightPath.isArrayExpression()
          ) {
            store(name, state, rightPath);
          }
          else {
            store(name, state, null);
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
        const rightPath = path.get('right');
        const value = memberLookup(rightPath, state);
        if (
          t.isIdentifier(value) ||
          t.isMemberExpression(value) ||
          t.isFunctionExpression(value) ||
          t.isArrayExpression(value)
        ) {
          countChange(state);
          rightPath.replaceWith(t.cloneDeep(value));
        }
      },
      exit(path, state) {
        const rightPath = path.get('right');
        if (isStaticPath(rightPath, state)) {
          const declareNameExpr = (name, expr) => (
            t.variableDeclaration(
              "const",
              [t.variableDeclarator(t.identifier(name), t.cloneDeep(expr))]
            )
          );

          if (
            rightPath.isArrayExpression() &&
            t.isIdentifier(path.node.left.declarations[0].id)
          ) {
            countChange(state);
            let block = [];
            const left0Id = path.get(`left.declarations.0.id`);
            rightPath.node.elements.forEach(expr => {
              path.scope.rename(left0Id.node.name);
              const name = left0Id.node.name;
              block.push(declareNameExpr(name, expr));
              path.node.body.body.forEach(expr => {
                block.push(t.cloneDeep(expr));
              });
              path.scope.rename(left0Id.node.name);
            });
            block.forEach(n => path.insertBefore(n));
            path.remove();
          }
          if (
            path.isForOfStatement() &&
            t.isArrayPattern(path.node.left.declarations[0].id) &&
            path.node.left.declarations[0].id.elements.length === 2 &&
            rightPath.isArrayExpression()
          ) {
            countChange(state);
            let block = [];
            const left0Id = path.get(`left.declarations.0.id`);
            const pattern0Id = left0Id.get('elements.0');
            const pattern1Id = left0Id.get('elements.1');
            path.scope.rename(pattern0Id.node.name);
            path.scope.rename(pattern1Id.node.name);
            rightPath.node.elements.forEach(expr => {
              const name1 = pattern0Id.node.name;
              const name2 = pattern1Id.node.name;
              block.push(declareNameExpr(name1, expr.elements[0]));
              block.push(declareNameExpr(name2, expr.elements[1]));
              path.node.body.body.forEach(expr => {
                block.push(t.cloneDeep(expr));
              });
              path.scope.rename(pattern0Id.node.name);
              path.scope.rename(pattern1Id.node.name);
            });
            block.forEach(n => path.insertBefore(n));
            path.remove();
          }
        }
      },
    },
    ConditionalExpression: {
      exit(path, state) {
        const testPath = path.get('test');
        const testObjectPath = testPath.get('object');
        const testObjectObjectPath = testObjectPath.get('object');
        const maybeMember = memberLookup(testPath, state);
        if (
          t.isFunctionExpression(maybeMember) ||
          t.isLiteral(maybeMember) && maybeMember.value
        ) {
          countChange(state);
          path.replaceWith(path.node.consequent);
        }
        if (
          t.isConditionalExpression(path) &&
          t.isMemberExpression(testPath) &&
          (
            t.isIdentifier(testObjectPath) &&
            t.isFunctionExpression(load(testObjectPath, state)) ||
            t.isIdentifier(testObjectPath) &&
            t.isLiteral(load(testObjectPath, state)) ||
            t.isIdentifier(testObjectPath) &&
            t.isArrayExpression(load(testObjectPath, state)) ||
            t.isMemberExpression(testObjectPath) &&
            t.isIdentifier(testObjectObjectPath) &&
            t.isFunctionExpression(load(testObjectObjectPath, state))
          )
        ) {
          countChange(state);
          path.replaceWith(path.node.alternate);
        }
      },
    },
    CallExpression: {
      enter(path, state) {
        if (memberLookup(path.get('callee'), state)) {
          countChange(state);
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
          countChange(state);
          memberReplace(path.get('callee'), state);
        }
        if (path.get("callee").isFunctionExpression()) {
          countChange(state);
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
            const argPath = path.get(`arguments.${i}`);
            if (
              t.isIdentifier(argPath) &&
              t.isFunctionExpression(load(argPath, state))
            ) {
              store(p, state, load(argPath, state));
            }
            if (argPath.isLiteral()) {
              store(p, state, argPath);
            }
          });
          path.getStatementParent().scope.crawl();
        }
        if (path.get("callee").isFunctionExpression()) {
          countChange(state);
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
              if (matchesMember(load(key, state), arg, true)) {
                store(key, state, null);
              }
            }
          });
        }
      }
    }
  };

  const objectEntriesExpression = t.memberExpression(
    t.identifier('Object'), t.identifier('entries')
  );
  const objectKeysExpression = t.memberExpression(
    t.identifier('Object'), t.identifier('keys')
  );

  const isObjectEntriesExpression = node => (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.object) &&
    t.isIdentifier(node.property) &&
    node.object.name === 'Object' &&
    node.property.name === 'entries'
  );
  const isObjectKeysExpression = node => (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.object) &&
    t.isIdentifier(node.property) &&
    node.object.name === 'Object' &&
    node.property.name === 'keys'
  );

  const findBindingInBlock = (name, body) => (
    body.body.find(node => (
      t.isVariableDeclaration(node) &&
      node.declarations[0].id.name === name
    ))
  );

  const evaluateToLiteral = (path, state) => {
    const e = path.evaluate();
    if (e.confident && typeof e.value === 'number') {
      countChange(state);
      path.replaceWith(t.numericLiteral(e.value));
    }
    if (e.confident && typeof e.value === 'string') {
      countChange(state);
      path.replaceWith(t.stringLiteral(e.value));
    }
  };

  const memberAssign = (state, path) => {
    state.__assignedMembers = state.__assignedMembers || new Map();
    state.__assignedMembers.set(path.node.left, path);
  };

  const forEachMemberAssigns = (state, pathNode, fn) => {
    state.__assignedMembers = state.__assignedMembers || new Map();
    for (const [key, _path] of state.__assignedMembers.entries()) {
      if (
        _path &&
        (
          matchesMember(key, pathNode, true) ||
          matchesMember(key, pathNode) ||
          matchesMember(_path.node.right, pathNode, true) ||
          matchesMember(_path.node.right, pathNode)
        )
      ) {
        fn(key, _path);
      }
    }
  };

  const removeRedundantMemberAssign = (state, path) => {
    forEachMemberAssigns(state, path.node.left, (key, _path) => {
      if (
        key !== path.node.left &&
        matchesMember(key, path.node.left) &&
        (() => {
          let noCall = true;
          traverse.cheap(_path.node.right, node => {
            if (t.isCallExpression(node) && node.arguments.length > 0) {
              noCall = false;
            }
          });
          return noCall;
        })() &&
        path.findParent(t.isBlockStatement).node === traverse.NodePath.get(_path).findParent(t.isBlockStatement).node
      ) {
        countChange(state);
        traverse.NodePath.get(_path).remove();
      }
      state.__assignedMembers.set(key, null);
    });
  };

  const clearMemberAssign = (state, pathNode) => {
    forEachMemberAssigns(state, pathNode, (key, _path) => {
      state.__assignedMembers.set(key, null);
    });
  };

  const lookupAndOps = {
    VariableDeclarator: {
      exit(path, state) {
        const id = path.node.id;
        const initPath = path.get('init');
        if (
          t.isIdentifier(initPath) &&
          (
            t.isIdentifier(load(initPath, state)) ||
            t.isMemberExpression(load(initPath, state))
          )
        ) {
          countChange(state);
          initPath.replaceWith(t.cloneDeep(load(initPath, state)));
        }
        if (path.getStatementParent().isLoop()) {
          store(id, state, null);
        }
        if (
          t.isLiteral(initPath) ||
          t.isObjectExpression(initPath) ||
          t.isArrayExpression(initPath) ||
          t.isIdentifier(initPath) ||
          t.isMemberExpression(initPath) ||
          t.isFunction(initPath)
        ) {
          store(id, state, initPath);
        }
      },
    },
    ConditionalExpression: {
      exit(path, state) {
        const maybeMember = memberLookup(path.get('test'), state);
        if (
          t.isFunctionExpression(maybeMember) ||
          t.isLiteral(maybeMember) && maybeMember.value
        ) {
          countChange(state);
          path.replaceWith(path.node.consequent);
        }
        if (
          t.isConditionalExpression(path.node) &&
          t.isMemberExpression(path.node.test) &&
          t.isIdentifier(path.node.test.object) &&
          t.isFunctionExpression(load(path.node.test.object, state))
        ) {
          countChange(state);
          path.replaceWith(path.node.alternate);
        }
      },
    },
    CallExpression: {
      exit(path, state) {
        // // Evaluate static Math.* methods
        // if (
        //   t.isMemberExpression(path.node.callee) &&
        //   t.isIdentifier(path.node.callee.object) &&
        //   t.isIdentifier(path.node.callee.property) &&
        //   path.node.callee.object.name === 'Math'
        // ) {
        //   evaluateToLiteral(path, state);
        // }

        // Turn a entries call on a static object expression into an array of
        // key value pairs.
        if (
          isObjectEntriesExpression(path.node.callee) &&
          t.isObjectExpression(path.node.arguments[0])
        ) {
          const ary = t.arrayExpression([]);
          path.node.arguments[0].properties.forEach(property => {
            ary.elements.push(t.arrayExpression([
              t.stringLiteral(property.key.name),
              property.value,
            ]));
          });
          countChange(state);
          path.replaceWith(ary);
        }

        // Turn a keys call on a static object expression into an array of keys.
        if (
          isObjectKeysExpression(path.node.callee) &&
          t.isObjectExpression(path.node.arguments[0])
        ) {
          const ary = t.arrayExpression([]);
          path.node.arguments[0].properties.forEach(property => {
            ary.elements.push(t.stringLiteral(property.key.name));
          });
          countChange(state);
          path.replaceWith(ary);
        }

        // Save a static call to Object.entries or Object.keys on an identifier.
        if (
          path.isCallExpression() &&
          (
            isObjectEntriesExpression(path.node.callee) ||
            isObjectKeysExpression(path.node.callee)
          ) &&
          t.isIdentifier(path.node.arguments[0])
        ) {
          const statementPath = path.getStatementParent();
          if (
            !(
              statementPath.isVariableDeclaration() ||
              statementPath.isExpressionStatement() &&
              t.isAssignmentExpression(statementPath.node.expression)
            ) &&
            path.scope.getBinding(path.node.arguments[0].name)
          ) {
            const binding = path.scope.getBinding(path.node.arguments[0].name);
            if (t.isFunctionExpression(binding.path.parent)) {
              let name;
              if (isObjectEntriesExpression(path.node.callee)) {
                name = `__Object_entries_${path.node.arguments[0].name}`;
              }
              else if (isObjectKeysExpression(path.node.callee)) {
                name = `__Object_keys_${path.node.arguments[0].name}`;
              }
              const id = t.identifier(name);

              if (!findBindingInBlock(name, binding.path.parent.body)) {
                binding.path.parent.body.body.unshift(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(id, t.cloneDeep(path.node))
                  ])
                );
              }
              countChange(state);
              path.replaceWith(t.cloneDeep(id));
            }
          }
        }
        // As it still is a call, unset known values to that only partially
        // match member expression arguments in the call.
        if (path.isCallExpression()) {
          path.node.arguments.forEach(arg => {
            for (const key in state) {
              if (matchesMember(load(key, state), arg, true)) {
                store(key, state, null);
              }
            }
          });
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
            countChange(state);
            binding.path.parent.kind = 'let';
          }
        }
        if (
          path.get('left').isIdentifier() &&
          path.getStatementParent().isLoop()
        ) {
          store(path, state, null);
          return;
        }
      },
      exit(path, state) {
        const leftPath = path.get('left');
        const rightPath = path.get('right');
        if (
          leftPath.isIdentifier() &&
          path.getStatementParent().isLoop()
        ) {
          store(path, state, null);
        }
        for (const key in state) {
          if (
            matchesMember(path.node.left, load(key, state)) ||
            (
              t.isObjectExpression(load(key, state))
            ) && matchesMember(path.node.left, t.identifier(key), true)
          ) {
            store(key, state, null);
          }
        }
        if (
          t.isIdentifier(rightPath) &&
          (
            t.isIdentifier(load(rightPath, state)) ||
            t.isMemberExpression(load(rightPath, state))
          )
        ) {
          countChange(state);
          rightPath.replaceWith(t.cloneDeep(load(rightPath, state)));
        }
        if (leftPath.isIdentifier()) {
          const name = path.node.left.name;
          if (
            rightPath.isIdentifier() &&
            t.isLiteral(load(rightPath, state))
          ) {
            countChange(state);
            rightPath.replaceWith(t.cloneDeep(load(rightPath, state)));
          }
          if (
            rightPath.isLiteral() ||
            rightPath.isMemberExpression() ||
            rightPath.isObjectExpression() ||
            rightPath.isArrayExpression()
          ) {
            store(name, state, rightPath);
          }
          else {
            store(name, state, null);
          }

          if (!path.scope.__names) {
            path.scope.__names = [];
          }
          if (!path.scope.__names.find(n => n === name)) {
            path.scope.__names.push(name);
          }
        }

        if (
          rightPath.isFunctionExpression() ||
          rightPath.isObjectExpression() ||
          rightPath.isArrayExpression()
        ) {
          memberStore(leftPath, state, path.node.right);
        }

        if (
          t.isAssignmentExpression(path.node) &&
          (
            t.isIdentifier(path.node.left) ||
            t.isMemberExpression(path.node.left)
          )
        ) {
          removeRedundantMemberAssign(state, path);
          memberAssign(state, path);
        }
      }
    },
    IfStatement: {
      exit(path, state) {
        const r = path.get('test').evaluate();
        const maybeMember = memberLookup(path.node.test, state);
        if (
          r.confident && r.value ||
          t.isLiteral(path.node.test) && path.node.test.value ||
          t.isFunctionExpression(path.node.test) ||
          t.isObjectExpression(path.node.test) ||
          t.isArrayExpression(path.node.test) ||
          t.isLiteral(maybeMember) && maybeMember.value ||
          t.isFunctionExpression(maybeMember) ||
          t.isObjectExpression(maybeMember) ||
          t.isArrayExpression(maybeMember)
        ) {
          countChange(state);
          path.replaceWith(path.node.consequent);
        }
        else if (
          path.node.alternate && (
            r.confident ||
            t.isLiteral(path.node.test) && !path.node.test.value ||
            t.isLiteral(maybeMember) && !maybeMember.value ||
            t.isMemberExpression(path.node.test) &&
              t.isFunctionExpression(memberLookup(path.node.test.object, state))
          )
        ) {
          countChange(state);
          path.replaceWith(path.node.alternate);
        }
        else if (
          r.confident ||
          t.isLiteral(path.node.test) && !path.node.test.value ||
          t.isLiteral(maybeMember) && !maybeMember.value ||
          t.isMemberExpression(path.node.test) &&
            t.isFunctionExpression(memberLookup(path.node.test.object, state))
        ) {
          countChange(state);
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
            if (load(name, state)) {
              store(name, state, null);
            }
          }
          path.scope.__names = [];
        }
      },
    },
    MemberExpression: {
      exit(path, state) {
        if (
          path.node.computed &&
          path.get('property').isStringLiteral()
        ) {
          countChange(state);
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

        let value = memberLookup(path, state);
        if (
          t.isLiteral(value) ||
          t.isIdentifier(value) ||
          t.isMemberExpression(value)
        ) {
          countChange(state);
          path.replaceWith(t.cloneDeep(value));
        }

        clearMemberAssign(state, path.node);
      },
    },
    Identifier(path, state) {
      if (
        (
          !path.findParent(n => t.isLoop(n)) ||
          path.findParent(t.isForOfStatement) &&
          path.find(p => (
            t.isForOfStatement(p.parent) && p.node === p.parent.right
          ))
        ) &&
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
        ) &&
        path.parent.key !== path.node
      ) {
        if (
          t.isFunctionExpression(load(path, state)) &&
          (
            !path.parentPath.isArrayExpression() ||
            !path.parentPath.isObjectExpression()
          )
        ) {
          return;
        }
        if (
          (
            t.isArrayExpression(load(path, state)) ||
            t.isObjectExpression(load(path, state)) ||
            t.isFunctionExpression(load(path, state))
          ) &&
          path.findParent(n => t.isForOfStatement(n)) &&
          !path
          .findParent(n => t.isForOfStatement(n))
          .get('right').find(n => path.findParent(n2 => n === n2))
        ) {
          return;
        }
        if (load(path, state) && isStatic(load(path, state), state)) {
          countChange(state);
          path.replaceWith(t.cloneDeep(load(path.node, state)));
        }
        if (
          load(path, state) &&
          (
            t.isIdentifier(load(path, state)) ||
            t.isMemberExpression(load(path, state))
          )
        ) {
          countChange(state);
          path.replaceWith(t.cloneDeep(load(path.node, state)));
        }
        else if (
          memberLookup(path.node, state) &&
          (
            t.isIdentifier(memberLookup(path.node, state)) ||
            t.isMemberExpression(memberLookup(path.node, state))
          )
        ) {
          countChange(state);
          path.replaceWith(t.cloneDeep(memberLookup(path.node, state)));
        }
      }

      if (path.parent.object === path.node) {
        if (
          load(path, state) &&
          (
            t.isIdentifier(load(path, state)) ||
            t.isMemberExpression(load(path, state))
          )
        ) {
          countChange(state);
          path.replaceWith(t.cloneDeep(load(path.node, state)));
        }
        else if (
          memberLookup(path.node, state) &&
          (
            t.isIdentifier(memberLookup(path.node, state)) ||
            t.isMemberExpression(memberLookup(path.node, state))
          )
        ) {
          countChange(state);
          path.replaceWith(t.cloneDeep(memberLookup(path.node, state)));
        }
      }

      if (
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
        ) &&
        path.parent.key !== path.node
      ) {
        clearMemberAssign(state, path.node);
      }
    },
    BinaryExpression: {
      exit(path, state) {
        if (
          path.get('left').isLiteral() && path.get('right').isLiteral() &&
          (
            path.node.operator === '*' ||
            path.node.operator === '+' ||
            path.node.operator === '-' ||
            path.node.operator === '/' ||
            path.node.operator === '%'
          )
        ) {
          evaluateToLiteral(path, state);
        }

        if (
          path.get('left').isBinaryExpression() &&
          path.get('left.right').isLiteral() && path.get('right').isLiteral() &&
          (
            path.node.left.operator === '*' && path.node.operator === '*' ||
            path.node.left.operator === '+' && path.node.operator === '+'
          )
        ) {
          countChange(state);
          const node = path.node;
          const left = node.left;
          const right = node.right;
          const operator = left.operator;
          const rightExpr = t.binaryExpression(operator, left.right, right);
          path.replaceWith(t.binaryExpression(operator, left.left, rightExpr));
        }
      },
    },
  };

  const refCount = {
    Identifier(path, state) {
      if (path.getStatementParent().parentPath.isProgram()) {
        return;
      }
      // let id = ...
      if (path.parent.id === path.node) {
        if (!(state[path.node.name] || {}).node) {
          // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(path.node.name)));
          state[path.node.name] = {node: path.node, refs: [], refsFrom: []};
        }
      }
      // for (const ... of id)
      if (
        path.findParent(t.isForOfStatement) &&
        path.find(p => (
          t.isForOfStatement(p.parent) && p.node === p.parent.right
        ))
      ) {
        const id = path.node.name;
        if (!(state[id] || {}).node) {
          state[id] = {node: path.node, refs: [], refsFrom: []};
        }
        state[id].refsFrom.push('__for_of_statement__');
      }
      // id = ...
      if (
        t.isAssignmentExpression(path.parent) &&
        path.parent.left === path.node
      ) {
        const id = path.node.name;
        if (!(state[id] || {}).node) {
          state[id] = {node: path.node, refs: [], refsFrom: []};
        }
      }
      if (
        path.getStatementParent().isVariableDeclaration() &&
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
    BlockStatement: {
      exit(path) {
        if (t.isBlockStatement(path.parent) && path.node.body.length === 0) {
          path.remove();
        }
      },
    },
    Identifier(path, state) {
      if (
        path.parent.id === path.node
      ) {
        // path.getStatementParent().insertBefore(t.expressionStatement(t.stringLiteral(`${path.node.nodeame}: ${String((state[path.node.name] || {refsFrom: []}).refsFrom.length)}`)));
      }
      if (
        (
          path.parent.id === path.node ||
          t.isAssignmentExpression(path.parent) &&
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

  const isElementId = (state, node) => (
    state.varStack.find(item => item.element === node.name)
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
          for (const param of parentFunction.params.slice().reverse()) {
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
        // const f = function(element, state, ...
        if (
          path.get('init').isFunctionExpression() &&
          path.get('init').node.params.length > 1 &&
          // Only create copy for update functions with the param signature
          // state, element
          path.node.init.params[0].name === 'element' &&
          path.node.init.params[1].name === 'state'
        ) {
          const parentFunction = path.getFunctionParent().node;

          let statement = t.identifier('element');
          for (const param of parentFunction.params.slice().reverse()) {
            if (t.isIdentifier(param)) {
              statement =
                t.conditionalExpression(
                  t.memberExpression(param, t.identifier('store')),
                  t.callExpression(
                    t.memberExpression(param, t.identifier('store')),
                    [t.identifier('store'), t.identifier('element'), t.identifier('data')]
                  ),
                  statement
                );
            }
          }
          state[path.get('id').node.name + '_store'] = t.functionExpression(
            // id
            null,
            // parameters
            [t.identifier('store'), t.identifier('element'), t.identifier('data')],
            // body
            t.blockStatement([
              
              t.returnStatement(statement),
            ])
          );

          statement = t.identifier('store');
          for (const param of parentFunction.params.slice().reverse()) {
            if (t.isIdentifier(param)) {
              statement =
              t.conditionalExpression(
                t.memberExpression(param, t.identifier('restore')),
                t.callExpression(
                  t.memberExpression(param, t.identifier('restore')),
                  [t.identifier('element'), t.identifier('store'), t.identifier('data')]
                ),
                statement
              );
            }
          }
          state[path.get('id').node.name + '_restore'] = t.functionExpression(
            // id
            null,
            // parameters
            [t.identifier('element'), t.identifier('store'), t.identifier('data')],
            // body
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
      else if (
        t.isMemberExpression(path.node.left) &&
        t.isIdentifier(path.node.left.object) &&
        t.isIdentifier(path.node.left.property) &&
        path.node.left.property.name === 'store' &&
        state[path.node.left.object.name + '_store']
      ) {
        state[path.node.left.object.name + '_store'] = null;
      }
      else if (
        t.isMemberExpression(path.node.left) &&
        t.isIdentifier(path.node.left.object) &&
        t.isIdentifier(path.node.left.property) &&
        path.node.left.property.name === 'restore' &&
        state[path.node.left.object.name + '_restore']
      ) {
        state[path.node.left.object.name + '_restore'] = null;
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
      if (
        t.isIdentifier(path.node.argument) &&
        state[path.node.argument.name + '_store']
      ) {
        path.insertBefore(t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(path.node.argument, t.identifier('store')),
            state[path.node.argument.name + '_store']
          )
        ));
      }
      if (
        t.isIdentifier(path.node.argument) &&
        state[path.node.argument.name + '_restore']
      ) {
        path.insertBefore(t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(path.node.argument, t.identifier('restore')),
            state[path.node.argument.name + '_restore']
          )
        ));
      }
    },
  };

  return {
    visitor: {
      Program(path) {
        let n = INNER_ITERATIONS;
        let n2 = OUTER_ITERATIONS;

        // path.traverse(renameAll);

        path.traverse(copyGen, {});
        // return;

        let changed = 1;
        let removed = Infinity;
        let grossRemoved = 0;
        do {
          n = INNER_ITERATIONS;
          changed = 1;
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
          // break;

          let refs = {};
          path.traverse(refCount, refs);
          let lastRefs = refs;
          grossRemoved = 0;
          removed = Infinity;
          while (removed > 0) {
            removed = 0;
            refs = {};
            path.traverse(deadCode, lastRefs);
            path.traverse(refCount, refs);
            if (Object.keys(refs).length < Object.keys(lastRefs).length) {
              removed = 1;
            }
            lastRefs = refs;

            grossRemoved += removed;
          }
        } while (n2-- && grossRemoved > 0);
        // console.log(n, n2, changed, removed, grossRemoved);

        path.traverse({
          ['Program|Function'](path) {
            const names = {};
            path.traverse(crawlNames, names);
            const newNames = {};
            const reverseNames = {};
            for (const key in names) {
              const reverse = key.split(/^_|\d+$/).join('');
              reverseNames[reverse] = reverseNames[reverse] || [];
              newNames[key] = `${
                reverseNames[reverse].length ? '_' : ''
              }${
                reverse
              }${
                reverseNames[reverse].length ? reverseNames[reverse].length : ''
              }`;
              reverseNames[reverse].push(key);
            }
            path.traverse(setNames, newNames);
          },
        });

        path.skip();
      },
    }
  };
}
