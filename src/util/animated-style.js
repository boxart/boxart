export default {
  replaceStyle(animated, animatedEl, style, replaced, styleCopy) {
    // Set the style of an animated element and store the style that was
    // replaced. When style has new keys, record the replaced style. When style
    // no longer has keys that have replaced values recorded, return those
    // replaced values.
    if (styleCopy) {
      Object.assign(styleCopy, style);
    }
    for (const key in replaced) {
      if (!style || !style.hasOwnProperty(key)) {
        animatedEl.style[key] = replaced[key];
        delete replaced[key];
      }
    }
    // The end of an animation sets the style to a null object, removing any
    // styling the animation had previously applied.
    if (!style) {
      return null;
    }
    for (const key in style) {
      if (!replaced.hasOwnProperty(key)) {
        replaced[key] = animatedEl.style[key];
      }
    }
    Object.assign(animatedEl.style, style);
    return replaced;
  },

  setStyle(animated, animatedEl, style, styleCopy) {
    // Set the style of an animated element.
    if (styleCopy) {
      Object.assign(styleCopy, style);
    }
    Object.assign(animatedEl.style, style);
  },

  restoreStyle(animated, animatedEl, replaced) {
    // Return an animated element to the style an animation replaced. This
    // should return the element to how it was before the animation was played.
    // This is used at times to return the element to the non animated state to
    // query the DOM's layout. After use, the style is returned to that of the
    // any current animation so a user never sees the change.
    this.replaceStyle(animated, animatedEl, null, replaced, null);
  },
};
