import {update, animate, present} from 'boxart-functions';

class BoxTransition extends Component {
  static update() {
    return update.object({
      x: update.rect().asElement(update.value((state, rect) => (rect.left + rect.right) / 2)),
      y: update.rect().asElement(update.value((state, rect) => (rect.top + rect.bottom) / 2)),
      width: update.rect().asElement(update.property('width')),
      height: update.rect().asElement(update.property('height')),
    });
  }

  static animate(box) {
    return animate.object({
      x: animate.begin().to(animate.end()),
      y: animate.begin().to(animate.end()),
      width: animate.begin().to(animate.end()),
      height: animate.begin().to(animate.end()),
    });
  }

  static present(box) {
    return present.style({
      transform: present.concat([
        present.translate([present.key('x').to(present.end).px(), present.key('y').to(present.end).px()]),
        present.scale([present.key('width').over(present.end), present.key('height').over(present.end)]),
      ]),
    });
  }
}

export default Box;
