import 'core-js/modules/es6.object.assign';

import React, {Children} from 'react';
import {findDOMNode} from 'react-dom';

import Component from './ancestor-auto-bind';

import AnimatedCallbackOptions from './animated-callback-options';
import AnimatedTimer from './animated-timer';
import AnimatedRect from './animated-rect';

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
    // The agent's rectangle in world space. Use to make transform world space
    // rectangles into agent space rectangles.
    this.rect = new AnimatedRect();
    // Dictionary of Animated property animateKey to Animated react components.
    this.animateds = {};
    // Dictionary of Animated property animateKey to AnimatedRect representing
    // the rectangular shape of the Animated's component in world space.
    this.rects = {};
    // Dictionary of Animated property animatedKey to an active animation.
    // Animations are a duck type object returned by the Animated's animate
    // property. Animations can have a `then` and `cancel` members. The then
    // member is called to help reuse internal AnimatedAgent objects to reduce
    // time spent collecting garbage and object creation. The cancel member is
    // used to stop an existing animation to remove race conditions from
    // multiple animations running on the same Animated.
    this.animations = {};
    // Dictionary of Animated property animatedKey to style applied by
    // AnimatedAgent. Used internally to reapply the style when its removed
    // when updating `this.rects` in cases like the window resizing.
    this.styles = {};
    // Dictionary of Animated property animatedKey to style replaced on an
    // element. Used internally to remove applied style when updating
    // `this.rects`.
    this.replacedStyles = {};
    // Pool of AnimatedTimer objects that can be reused. This helps reduce
    // object creation and garbage collection.
    this.timerPool = [];
    // Pool of AnimatedCallbackOptions objects that can be reused. This helps
    // reduce object creation and garbage collection.
    this.optionsPool = [];
    // Is this rendered in a browser or on the server as a string.
    this.clientRender = typeof window !== 'undefined';
    // Hold a promise that resolves soon. Used by soon() to group a set of calls
    // as soon as possible, not immediately but also not on the next javascript
    // tick caused by something like setTimeout. As its a promise it uses the
    // Promise spec's detail that a resolved promise calls its callbacks at the
    // end of the current javascript tick before the javascript engine hands off
    // to the browser to do rendering.
    this._soon = null;
  }

  getChildContext() {
    return {animationAgent: this};
  }

  componentDidMount() {
    if (this.clientRender) {
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('orientationchange', this.handleResize);

      // Determine the agent's starting rectangle.
      AnimatedRect.getBoundingClientRect(findDOMNode(this), this.rect);
    }
  }

  componentDidUpdate() {
    if (this.clientRender) {
      // Determine the agent's updated rectangle.
      const lastRect = this.rect.clone();
      AnimatedRect.getBoundingClientRect(findDOMNode(this), this.rect);
      if (!lastRect.equal(this.rect)) {
        this.resize(this.soon());
      }
    }
  }

  componentWillUnmount() {
    if (this.clientRender) {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('orientationchange', this.handleResize);
    }
  }

  removeAnimatedStyle(animated, animatedEl) {
    // Return an animated element to the style an animation replaced. This
    // should return the element to how it was before the animation was played.
    // This is used at times to return the element to the non animated state to
    // query the DOM's layout. After use, the style is returned to that of the
    // any current animation so a user never sees the change.
    const animatedKey = animated.getAnimateKey();
    if (!this.replacedStyles[animatedKey]) {
      return;
    }
    Object.assign(animatedEl.style, this.replacedStyles[animatedKey]);
    this.replacedStyles[animatedKey] = null;
  }

  setReplaceStyle(animated, animatedEl, style) {
    // Set the style of an animated element and store the style that was
    // replaced. When style has new keys, record the replaced style. When style
    // no longer has keys that have replaced values recorded, return those
    // replaced values.
    const animatedKey = animated.getAnimateKey();
    if (!this.replacedStyles[animatedKey]) {
      this.replacedStyles[animatedKey] = {};
    }
    const replaced = this.replacedStyles[animatedKey];
    this.styles[animatedKey] = style;
    for (const key in replaced) {
      if (!style || !style.hasOwnProperty(key)) {
        animatedEl.style[key] = replaced[key];
        delete replaced[key];
      }
    }
    // The end of an animation sets the style to a null object, removing any
    // styling the animation had previously applied.
    if (!style) {
      this.replacedStyles[animatedKey] = null;
      return;
    }
    for (const key in style) {
      if (!replaced.hasOwnProperty(key)) {
        replaced[key] = animatedEl.style[key];
      }
    }
    Object.assign(animatedEl.style, style);
    return replaced;
  }

  setAnimatedStyle(animated, animatedEl, style) {
    // Set the style of an animated element.
    const animatedKey = animated.getAnimateKey();
    this.styles[animatedKey] = style;
    Object.assign(animatedEl.style, style);
  }

  timer(fn) {
    // Create a timer that can create easily cancelable animations by throwing
    // an Error at any timed section when the animation is canceled.
    const timer = this.timerPool.shift() || new AnimatedTimer(this);
    timer._init(fn);
    // When the timer completes normally or abnormally (such as being canceled)
    // add it to the timer pool so that it can be reusued.
    timer.then(() => {
      this.timerPool.unshift(timer);
    }, () => {
      this.timerPool.unshift(timer);
    });
    return timer;
  }

  animateFrom(animated, animatedEl, lastRect, rect, duration) {
    if (lastRect.equal(rect)) {
      return Promise.resolve();
    }
    // Animate from one rect to another. The target is treated as the elements
    // origin so this animates from a relative position to (0, 0).
    const start = Date.now();
    const style = {
      zIndex: 1,
    };
    rect.transformStyle(rect, style);
    this.setReplaceStyle(animated, animatedEl, style);
    // A temporary storage value that can be reused to reduce memory churn
    // and very easily track the position in the animation in case its
    // canceled.
    const tRect = lastRect.clone();
    // Get a timer object to manage our animation over time.
    const timer = this.timer();
    // In case its canceled return the current location.
    timer.cancelable(() => tRect);
    // Loop animation frames until its done.
    timer.loop(() => {
      const now = Date.now();
      // A value from 0 to 1 representing the position in the animation.
      const t = Math.min((now - start) / 1000 / duration, 1);
      // Create a transform that is the difference from the position in the
      // animation to the origin of the element.
      rect.interpolate(lastRect, t, tRect).transformStyle(rect, style);
      this.setAnimatedStyle(animated, animatedEl, style);
      // Return a position in time, timer.loop will resolve the promise it
      // create when t is greater than or equal to 1.
      return t;
    })
    .then(() => this.setReplaceStyle(animated, animatedEl));
    return timer;
  }

  transitionFrom(animated, animatedEl, lastRect, rect, duration) {
    if (lastRect.equal(rect)) {
      return Promise.resolve();
    }
    // Perform a css transition from one rect to another. The target is treated
    // as the elements origin so this animates from a relative position to
    // (0, 0).
    const style = {
      transform: lastRect.transform(rect),
      transition: 'none',
      zIndex: 1,
    };
    const timer = this.timer();
    timer.cancelable(() => lastRect);
    // Set the initial point for the transition.
    this.setReplaceStyle(animated, animatedEl, style);
    timer.frame()
    .then(() => {
      const start = Date.now();
      // If canceled, try to represent where the animation currently has the
      // element.
      timer.cancelable(() => {
        const t = (Date.now() - start) / 1000 / duration;
        return rect.interpolate(lastRect, Math.min(t, 1));
      });
      // Set up the transition by setting the transition style.
      style.transition = `transform ${duration}s`;
      this.setAnimatedStyle(animated, animatedEl, style);
      // Start the transition to (0, 0).
      style.transform = 'translateZ(0)';
      this.setAnimatedStyle(animated, animatedEl, style);
      // Wait until the transition should have completed.
      return timer.timeout(duration * 1000);
    })
    // Return any style set by the animation to their original values.
    .then(() => this.setReplaceStyle(animated, animatedEl));
    return timer;
  }

  mountAnimated(animated) {
    // A component has been created with a given key.
    const key = animated.getAnimateKey();
    if (this.animateds[key] !== animated) {
      this.animateds[key] = animated;
    }
  }

  unmountAnimated(animated) {
    // A component will be destroy with a given key.
    const key = animated.getAnimateKey();
    if (this.animateds[key] === animated) {
      this.animateds[key] = null;
      // Cancel any existing animation. If another component is created with
      // the same key it'll need to restart the animation. The animation is left
      // so any such new component will "cancel" it again giving it the rect to
      // continue with.
      if (this.animations[key] && this.animations[key].cancel) {
        this.animations[key].cancel();
      }
    }
  }

  willUpdateAnimated(animated) {
    // Remove any animated style to reduce interference with react updating the
    // DOM. Animations that were running need to be managed by their Animated
    // in such a case as there isn't necessarily a general way to resume the
    // animation.
    if (this.clientRender) {
      this.removeAnimatedStyle(animated, findDOMNode(animated));
    }
  }

  _animate(key, animated, animatedEl, lastRect, rect) {
    const options = this.optionsPool.shift() || new AnimatedCallbackOptions();
    options.set(this, animated, animatedEl, lastRect, rect);
    const animation = this.animations[key] = animated.animate(options);
    // If the animation is a thenable, use it to add the used options object
    // into a pool so it can be reused.
    if (this.animations[key] && this.animations[key].then) {
      this.animations[key].then(() => {
        if (animation === this.animations[key]) {
          this.animations[key] = null;
        }
        this.optionsPool.unshift(options);
      }, error => {
        if (animation === this.animations[key]) {
          this.animations[key] = null;
        }
        this.optionsPool.unshift(options);

        // Handle the Timer canceled error. Any other errors should be handled
        // by the user and not AnimatedAgent.
        if (error.message !== 'Timer canceled') {
          throw error;
        }
      });
    }
  }

  frame() {
    if (!this._frame) {
      this._frame = new Promise(requestAnimationFrame)
      .then(() => {
        this._frame = null;
      });
    }
    return this._frame;
  }

  soon() {
    if (!this._soon) {
      this._soon = Promise.resolve()
      .then(() => {
        this._soon = null;
      });
    }
    return this._soon;
  }

  updateAnimated(animated) {
    // Cannot animate while server rendering.
    if (!this.clientRender) {return;}

    // Wait until the end of this JS frame so that all DOM changes can be
    // applied before we access the DOM to know where the Animated object is.
    this.soon()
    .then(() => {
      const key = animated.getAnimateKey();
      const animatedEl = findDOMNode(animated);

      if (this.rects[key]) {
        // Determine where this Animated was before either through the last
        // stored rect or by canceling a current animation and using its
        // returned value.
        let lastRect;
        if (this.animations[key] && this.animations[key].cancel) {
          lastRect = this.animations[key].cancel();
        }
        if (!lastRect) {
          lastRect = this.rects[key].clone();
        }
        // Make sure the element has been laid out to whereever it needs to be.
        (function() {})(animatedEl.offsetTop);
        // Get where the Animated element currently is.
        const rect = AnimatedRect.getBoundingClientRect(animatedEl, this.rects[key]);
        // Use the Animated's animate property or a default to animate from
        // where the object was to where it is now.
        this._animate(key, animated, animatedEl, lastRect, rect);
      }
      else {
        // No Animated has existed the moment before now with this key.
        this.rects[key] = AnimatedRect.getBoundingClientRect(animatedEl);
        const lastRect = this.rects[key].clone();
        const rect = this.rects[key];
        // Let the Animated "animate in" or in the best case do no animation.
        this._animate(key, animated, animatedEl, lastRect, rect);
      }
    });
  }

  handleResize() {
    this.resize();
  }

  resize(when) {
    // At the end of this JS frame query the DOM for the positions of all
    // Animated objects. Since we normally only query when an element has been
    // updated by React we can only know where the element is now, we need to
    // use a stored value to know where it was. So when the window resizes or
    // another event that would case children to reflow in the layout we need
    // to request that info again. We do this instead of querying before an
    // element is updated because that may trigger a layout or have been
    // effected by siblings updating and the lifecycle step for a specific
    // element happens in the middle of the whole set of React elements
    // updating.
    (when || this.frame())
    .then(() => {
      // Temporarily remove animation styling so we can get the new rects.
      for (const key in this.animateds) {
        const animated = this.animateds[key];
        if (animated) {
          this.removeAnimatedStyle(animated, findDOMNode(animated));
        }
      }
      // Get the new rects for all Animateds.
      AnimatedRect.getBoundingClientRect(findDOMNode(this), this.rect);
      for (const key in this.animateds) {
        const animated = this.animateds[key];
        if (animated) {
          const animatedEl = findDOMNode(animated);
          (function() {})(animatedEl.offsetTop);
          AnimatedRect.getBoundingClientRect(animatedEl, this.rects[key]);
        }
      }
      // Reapply any animation styles
      for (const key in this.animateds) {
        const animated = this.animateds[key];
        if (animated) {
          this.setAnimatedStyle(animated, findDOMNode(animated), this.styles[key]);
        }
      }
    });
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
