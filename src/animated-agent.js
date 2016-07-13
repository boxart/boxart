import 'core-js/modules/es6.object.assign';

import React, {Children} from 'react';
import {findDOMNode} from 'react-dom';

import Component from './ancestor-auto-bind';

import AnimatedAgentBase from './animated-agent-base';

/**
 * AnimatedAgent
 *
 * Work with Animated wrapped React components to animate around the screen.
 *
 * AnimatedAgent and Animated can be used very simply to have a React component
 * animate from one area of the window to another area. By default an Animated
 * triggers an animation with the agent any time it goes through its render
 * lifecycle. For easy use the default animation will animate linearly from its
 * last location to the current location.
 *
 * Animateds can animate a React component from a previous hierarchy to a new
 * hierarchy. Say you have two lists and want to animate one of the list items
 * from one list to the other. As long as the old React element and the new one
 * in the new list has an Animated wrapping element with the same animateKey,
 * the agent will use the last remembered position and start an animation with
 * that last position and the new one.
 */
export default class AnimatedAgent extends Component {
  constructor(...args) {
    super(...args);
    this.base = new AnimatedAgentBase();
    this.rect = this.base.rect;
  }

  getChildContext() {
    return {animationAgent: this};
  }

  componentDidMount() {
    this.base.didMount(findDOMNode(this));
  }

  componentDidUpdate() {
    this.base.didUpdate();
  }

  componentWillUnmount() {
    this.base.willUnmount();
  }

  setReplaceStyle(animated, animatedEl, style) {
    return this.base.setReplaceStyle(animated, animatedEl, style);
  }

  setAnimatedStyle(animated, animatedEl, style) {
    return this.base.setAnimatedStyle(animated, animatedEl, style);
  }

  restoreAnimatedStyle(animated, animatedEl) {
    return this.base.restoreAnimatedStyle(animated, animatedEl);
  }

  removeAnimatedStyle(animated, animatedEl) {
    return this.base.removeAnimatedStyle(animated, animatedEl);
  }

  animateFrom(animated, animatedEl, lastRect, rect, duration) {
    return this.base.animateFrom(animated, animatedEl, lastRect, rect, duration);
  }

  transitionFrom(animated, animatedEl, lastRect, rect, duration) {
    return this.base.transitionFrom(animated, animatedEl, lastRect, rect, duration);
  }

  mountAnimated(animated) {
    return this.base.mountAnimated(animated);
  }

  unmountAnimated(animated) {
    return this.base.unmountAnimated(animated);
  }

  willUpdateAnimated(animated) {
    return this.base.willUpdateAnimated(animated);
  }

  updateAnimated(animated) {
    return this.base.updateAnimated(animated);
  }

  timer(fn) {
    return this.base.timer(fn);
  }

  frame() {
    return this.base.frame();
  }

  soon() {
    return this.base.soon();
  }

  handleResize() {
    return this.base.handleResize();
  }

  render() {
    return Children.only(this.props.children);
  }
}

AnimatedAgent.childContextTypes = {
  animationAgent: React.PropTypes.any,
};

AnimatedAgent.propTypes = {
  children: React.PropTypes.any,
};
