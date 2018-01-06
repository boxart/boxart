const functions = require('boxart-functions');
const animate = functions.animate;
const present = functions.present;
const update = functions.update;

module.exports = {
  spin: {
    default: {
      update: update.context(({elementArrays, object, constant}) => (
        elementArrays({
          rect: object({
            angle: constant(0),
          }),
        })
      )),
      animate: animate.context(({object, keyframes, constant, seconds}) => (
        object({
          rect: object({
            angle: keyframes([
              seconds(0.5).frame(constant(0)),
              seconds(0.5).frame(constant(1)),
              seconds(0.001).frame(constant(0)),
            ]),
            // angle: constant(0).to(constant(1)),
          })
          .array(),
        })
        .duration(1)
      )),
      present: present.context(({elementArrays, style, rotate3d, key, constant, value}) => (
        elementArrays({
          rect: style({
            transform: rotate3d([
              constant(0),
              // value(function(element, state, data) {
              //   return data._end.angle;
              // }),
              constant(0),
              constant(1),
              key('angle').mul(constant(360)).deg(),
            ]),
          }),
        })
      )),
    }
  }
};
