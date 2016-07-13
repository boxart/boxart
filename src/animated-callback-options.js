export default class AnimatedCallbackOptions {
  constructor() {
    this.agent = null;
    this.animated = null;
    this.animatedEl = null;
    this.lastRect = null;
    this.rect = null;
  }

  set(agent, animated, animatedEl, lastRect, rect) {
    this.agent = agent;
    this.animated = animated;
    this.animatedEl = animatedEl;
    this.lastRect = lastRect;
    this.rect = rect;
    return this;
  }

  transitionFromLast(duration) {
    return this.transitionFrom(this.lastRect, this.rect, duration);
  }

  animateFromLast(duration) {
    return this.animateFrom(this.lastRect, this.rect, duration);
  }

  transitionFrom(lastRect, rect, duration) {
    return this.agent.transitionFrom(this.animated, this.animatedEl, lastRect, rect, duration);
  }

  animateFrom(lastRect, rect, duration) {
    return this.agent.animateFrom(this.animated, this.animatedEl, lastRect, rect, duration);
  }

  replaceStyle(style) {
    this.animated.replaceStyle(style);
  }

  setStyle(style) {
    this.animated.setStyle(style);
  }

  /* deprecated */
  removeStyle() {
    this.animated.restoreStyle();
  }

  restoreStyle() {
    this.animated.restoreStyle();
  }

  timer(fn) {
    const timer = this.agent.timer(fn);
    return timer;
  }
}
