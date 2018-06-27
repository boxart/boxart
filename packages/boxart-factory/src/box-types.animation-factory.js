import {update, animate, present} from 'boxart-functions';

import Box from './box.animation-factory';
import Box3d from './box-3d.animation-factory';

const factories = {
  Box,
  Box3d,
};

export const animation = _animation => {
  const updateElements = {};
  const animateElements = {};
  const presentElements = {};

  for (const box of _animation.boxes) {
    updateElements[box.name || 'root'] = ((factories[box.type] || factories.Box).update || factories.Box.update)(box);
    animateElements[box.name || 'root'] = ((factories[box.type] || factories.Box).animate || factories.Box.animate)(box, _animation.duration);
    presentElements[box.name || 'root'] = ((factories[box.type] || factories.Box).present || factories.Box.present)(box);
  }

  return {
    update: update.elements(updateElements),
    animate: animate.object(animateElements).duration(_animation.duration / 30),
    present: present.elements(presentElements),
  };
};

export default factories;
