const {
  factory
} = require('boxart-factory');

module.exports = factory({
  "boxes": [{
    "name": "",
    "properties": [{
      "name": "x",
      "keyframes": [{
        "time": 0,
        "value": 0,
        "easing": "linear",
        "format": "animation"
      }, {
        "time": 14,
        "value": -100,
        "easing": "linear",
        "format": "animation"
      }]
    }]
  }],
  "duration": 15
});
