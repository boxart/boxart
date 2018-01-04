const AnimatedElement = require('boxart-element').default;

const animations = require('./animations');
console.log(animations);

new AnimatedElement({
  element: document.getElementsByTagName('svg')[0],
  initialState: 'default',
  animations: animations.spin,
});
