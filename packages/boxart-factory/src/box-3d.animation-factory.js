import {update, animate, present} from 'boxart-functions';

class Box3d {
  static update() {
    return update.object({
      x: update.constant(0),
      y: update.constant(0),
      width: update.constant(100),
      height: update.constant(100),
      perspective: update.constant(0),
      translateX: update.constant(0),
      translateY: update.constant(0),
      translateZ: update.constant(0),
      rotateX: update.constant(0),
      rotateY: update.constant(0),
      rotateZ: update.constant(0),
      scaleX: update.constant(1),
      scaleY: update.constant(1),
    });
  }

  static animate(box, duration) {
    const object = {};
    for (const property of box.properties) {
      const keyframes = property.keyframes;
      const firstFrame = (keyframes.length > 0) ? keyframes[0] : {time: 0, value: property.default || 0};
      const lastFrame = (keyframes.length > 0) ? keyframes[keyframes.length - 1] : {time: 0, value: property.default || 0};
      object[property.name] = [
        animate.seconds((firstFrame.time + 1) / 30)
          .frame(animate.value(() => firstFrame.value)),
        ...keyframes.slice(0, keyframes.length - 1).map((frame, index) => (
          animate.seconds((keyframes[index + 1].time - frame.time) / 30)
            .frame(animate.value(() => frame.value))
        )),
        animate.seconds((duration - lastFrame.time) / 30)
          .frame(animate.value(() => lastFrame.value)),
        animate.seconds(0.001).frame(animate.value(() => lastFrame.value)),
      ];
      object[property.name] = animate.keyframes(object[property.name]);
    }
    return animate.object(object);
  }

  static present(box) {
    return present.style({
      transform: present.concat([
        present.translate([present.key('x').percent(), present.key('y').percent()]),
        present.scale([present.key('width').div(present.constant(100)), present.key('height').div(present.constant(100))]),
        present.func('perspective', ', ', [present.key('perspective').px()]),
        present.translate3d([
          present.key('translateX').percent(),
          present.key('translateY').percent(),
          present.key('translateZ').px()
        ]),
        present.rotatex([present.key('rotateX').deg()]),
        present.rotatey([present.key('rotateY').deg()]),
        present.rotatez([present.key('rotateZ').deg()]),
        present.scale([present.key('scaleX'), present.key('scaleY')]),
      ]),
      visibility: present.constant('initial'),
    });
  }
}

export default Box3d;
