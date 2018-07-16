## Animated State Machine

The animation functions are used by an animated state machine. The object tracks the current `animation` class name of an animated element. When the element is updated to the current `animation` class name, it updates end, stores the presentation and starts animating and presenting the updated modifiable state. The first animation also copies the `end` state into the `begin` and `state` state. These values, the element being animated and the time `t` make up the `data` argument stored by the animated state machine and passed to most of the animation functions. 

```js
this.data = {
  animated: {
    root: {
      element: // HTMLElement
    },
  },
  t: // Time in seconds
  state: // The modifiable state
  begin: // The beginning state
  end: // The target end state
  store: // The stored possibly overwritten presentation
};
```

With a reference to an `AnimatedManager` the state machine for an element by its `type` and `id`.
