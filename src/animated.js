import React, {Children, Component} from 'react';

/**
 * Animated
 *
 * Animated wraps React elements and provides a hook to overwrite a simple
 * transition animation for whenever a React element is updated or rerendered.
 *
 * ```js
 * <AnimatedAgent>
 *   <ol>
 *     {list.map(item => <Animated
 *       key={item.key}
 *       animateKey={item.key}>
 *       <li>{item.name}</li>
 *     </Animated>)}
 *   </ol>
 * </AnimatedAgent>
 * ```
 *
 * Animated and Agent rely on animateKey to determine where an Animated element
 * was last on the screen and animate from that position. As such animateKey is
 * required and unlike key should be unique in all Animated elements under an
 * Agent. In the given above example if an the list was sorted or an item added
 * or removed. The items in the list would animate from their previous position
 * to the new position. Animated doesn't directly support animating removed
 * items, for that you'd need to combine Animated with ReactTransitionGroup to
 * persist the removed item until its removal animation completes.
 *
 * Since the animateKey is unique on the page, an Animated can be removed from
 * one part of the DOM's hierarchy and added to another. A simple example is
 * moving an animated from one list to another.
 *
 * ```js
 * <AnimatedAgent>
 *   <ol>
 *     {list1.map(item => <Animated
 *       key={item.key}
 *       animateKey={item.key}>
 *       <li>{item.name}</li>
 *     </Animated>)}
 *   </ol>
 *   <ol>
 *     {list2.map(item => <Animated
 *       key={item.key}
 *       animateKey={item.key}>
 *       <li>{item.name}</li>
 *     </Animated>)}
 *   </ol>
 * </AnimatedAgent>
 * ```
 *
 * Animated takes an animate property to define custom animations.
 *
 * ```js
 * <Animated animateKey={uniqueKey} animate={options => {
 *   const {rect, lastRect} = options;
 *   if (this.justAddedItem(item)) {
 *     lastRect.height = 0;
 *   }
 *   if (this.justRemovedItem(item)) {
 *     rect.height = 0;
 *   }
 *   return options.animateFrom(lastRect, rect, 0.3);
 * }}><li>{item.name}</li></Animated>
 * ```
 *
 * `animate` is given an options object that holds members to build animations with. `animateFrom` and `animateFromLast` let you build simple linear animations from where the Animated was last to where it is now. `lastRect` and `rect` are those values. `rect` is a little special, while `lastRect` is a unique copy of the last state for the Animated `rect` is the current state and will be updated if for example the window resized.
 */
export default class Animated extends Component {
  componentDidMount() {
    this.context.animationAgent.mountAnimated(this);
    this.context.animationAgent.updateAnimated(this);
  }

  componentWillUpdate() {
    this.context.animationAgent.willUpdateAnimated(this);
  }

  componentDidUpdate() {
    this.context.animationAgent.updateAnimated(this);
  }

  componentWillUnmount() {
    this.context.animationAgent.unmountAnimated(this);
  }

  getAnimateKey() {
    return this.props.animateKey;
  }

  animate(options) {
    if (this.props.animate) {
      return this.props.animate(options);
    }
    return options.animateFromLast(0.3);
  }

  render() {
    return Children.only(this.props.children);
  }
}

Animated.contextTypes = {
  animationAgent: React.PropTypes.any,
};

Animated.propTypes = {
  children: React.PropTypes.any,
  animateKey: React.PropTypes.any.isRequired,
  animate: React.PropTypes.any,
};
