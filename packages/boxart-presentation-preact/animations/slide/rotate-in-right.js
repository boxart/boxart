const {
  factory
} = require('boxart-factory');

module.exports = factory({
  "boxes": [{
    "name": "root2",
    "type": "Box3d",
    "properties": [{
      "name": "rotateZ",
      "keyframes": [{
        "time": 0,
        "value": 90,
        "easing": "linear",
        "format": "animation"
      }, {
        "time": 14,
        "value": 0,
        "easing": "linear",
        "format": "animation"
      }]
    }, {
      "name": "translateY",
      "keyframes": [{
        "time": 0,
        "value": 200,
        "easing": "linear",
        "format": "animation"
      }, {
        "time": 14,
        "value": 100,
        "easing": "linear",
        "format": "animation"
      }]
    }]
  }],
  "duration": 15
});
