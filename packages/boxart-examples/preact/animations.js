import {update, animate, present} from 'boxart-functions';

export default {
  box: {
    default: {
      update: update.rect(),
      animate: animate.object({
        left: animate.begin().to(animate.end()),
      }),
      present: present.style({
        transform: present.translatex([
          present.key('left').to(present.end).px(),
        ]),
      }),
    },
  },
};
