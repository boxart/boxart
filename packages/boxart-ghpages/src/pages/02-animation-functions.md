## Animation Functions

BoxArt provides a family of functions as shorthand for creating its animation functions. They fall into three families: `update`, `animate`, and `present`.

As mentioned `update` functions update the state objects BoxArt uses. `animate` functions animate a third state object between the first two. `present` functions present the third state on the animated element.

<a name="update"><a href="#update">
### update
</a></a>

```js
update: update.rect().asElement(update.object({
  left: update.property('left'),
  top: update.property('top'),
})),
```

BoxArt's function shorthand allows for some chaining but this can also be written:

```js
update: update.asElement(update.rect(), update.object({
  left: update.property('left'),
  top: update.property('top'),
})),
```

Lets break down what this function is doing.

The returned function takes three arguments `state`, `element`, and `data` and returns its final `state`.

Written out the above might look like:

```js
update: (function() {
  return function(state, element, data) {
    element = element.getBoundingClientRect();
    state = state || {};
    state.left = element.left;
    state.top = element.top;
    return state;
  };
}()),
```

This function is using the element's client rectangle to build a left and top state. In addition to the main function, update has a few helper functions `copy`, `merge` and `should`. `copy` and `merge` are used to update the animation states without querying the element when it isn't necessary or desired. `should` if given shortcuts animations if it returns false.

Our update written with its helpers would be:

```js
update: (function() {
  const func = function(state, element, data) {
    element = element.getBoundingClientRect();
    state = state || {};
    state.left = element.left;
    state.top = element.top;
    return state;
  };
  func.copy = function(dest, src) {
    dest = dest || {};
    dest.left = src.left;
    dest.top = src.top;
    return dest;
  };
  // This example creates a merge that is the same as copy.
  func.merge = function(dest, src) {
    dest = dest || {};
    dest.left = src.left;
    dest.top = src.top;
    return dest;
  };
  // This example normally does not have a should but here is a barebones
  // example.
  func.should = function(stateA, stateB) {
    return true;
  };
  return func;
}()),
```

### animate

```js
animate: animate.object({
  left: animate.begin().to(animate.end()),
  top: animate.top().to(animate.end()),
}),
```

`animate` functions like `update`'s may chain. This function expands to:

```js
animate: animate.object({
  left: animate.to(animate.begin(), animate.end()),
  top: animate.to(animate.begin(), animate.end()),
}),
```

`animate` functions slightly break a rule in the order of arguments to BoxArt animation functions. The first argument in most BoxArt functions is the destination for values. Animation functions instead pass a time value `t`. `t` starts as the number of seconds since the start of the animation but normally is transformed by easing functions into a value between 0 and 1. The other arguments are `state`, `begin`, `end` and `data`.

With its `done` helper function that by its namesake determines when the animation is done, the example `animate` function handwritten may look like:

```js
animate: (function() {
  const func = function(t, state, begin, end, data) {
    state.left = (end.left - begin.left) * t + begin.left;
    state.top = (end.top - begin.top) * t + begin.top;
  };
  func.done = function(t) {
    return t >= 1;
  };
  return func;
}()),
```

### present

`update` and `animate` functions share their shape around the defined data structure for an animation. `present` will use that data structure to change how the animated element is presented.

```js
present: present.style({
  transform: present.translate([
    present.key('left').to(present.end).px(),
    present.key('top').to(present.end).px(),
  ]),
}),
```

`present` functions commonly expand more than `update` and `animate`.

```js
present: present.style({
  transform: present.translate([
    present.px(present.sub(present.key('left'), present.end(present.key('left')))),
    present.px(present.sub(present.key('top'), present.end(present.key('top')))),
  ]),
}),
```

This `present` function is creating a difference on the `left` and `top` keys so that the transform is relative to where the element should current render.

Since `present` functions may overwrite the current presentation of an element, the helpers create some functions used to `store` and `restore` the original values that may be overwritten. Together these functions follow `update`'s argument layout where the value being modified is the first.

`present` takes 3 arguments: `element`, `state`, and `data`. Our example might look like:

```js
present: (function() {
  return function(element, state, data) {
    const end = data.end;
    element.style.transform =
      `translate(${state.left - end.left}px, ${state.top - end.top}px)`;
  };
}()),
```

`store` like `update` initializes and stores its target data with arguments `store`, `element`, and `data`. `restore` swaps the first two arguments and takes `element`, `store`, and `data`.

```js
present: (function() {
  const func = function(element, state, data) {
    const end = data.end;
    element.style.transform =
      `translate(${state.left - end.left}px, ${state.top - end.top}px)`;
  };
  func.store = function(store, element, data) {
    store = store || {};
    const style = store.style = store.style || {};
    style.transform = element.style.transform;
    return store;
  };
  func.restore = function(element, store, data) {
    element.style.transform = store.style.transform;
  };
  return func;
}()),
```
