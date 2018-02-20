import {update, animate, present} from 'boxart-functions';

export default {
  box: {
    default: {
      update: update.rect(),
      animate: animate.object({
        top: animate.begin().to(animate.end()),
        left: animate.begin().to(animate.end()),
        height: animate.begin().to(animate.end()),
      }),
      present: present.style({
        transform: present.concat([
          present.translate([
            present.key('left').to(present.end).px(),
            present.key('top').to(present.end).px(),
          ]),
          present.scaley([
            present.key('height').over(present.end),
          ]),
        ]),
      }),
    },
    enter: {
      animate: animate.object({
        top: animate.begin().to(animate.end()),
        left: animate.begin().to(animate.end()),
        height: animate.constant(0).to(animate.end()),
      }),
    },
    leave: {
      animate: animate.object({
        top: animate.begin().to(animate.end()),
        left: animate.begin().to(animate.end()),
        height: animate.begin().to(animate.constant(0)),
      }),
      present: present.style({
        transform: present.concat([
          present.translate([
            present.key('left').to(present.end).px(),
            present.key('top').to(present.end).px(),
          ]),
          present.scaley([
            present.key('height').over(present.begin),
          ]),
        ]),
      }),
    },
  },
};
