export default class AnimatedRect {
  constructor(left = 0, top = 0, width = 0, height = 0, angle = 0) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }

  relativeTo(rect) {
    this.left -= rect.left;
    this.top -= rect.top;
    this.angle -= rect.angle;
    return this;
  }

  set(left, top, width, height, angle = 0) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.angle = angle;
    return this;
  }

  clone(dst = new AnimatedRect()) {
    return dst.copy(this);
  }

  copy(src) {
    this.left = src.left;
    this.top = src.top;
    this.width = src.width;
    this.height = src.height;
    this.angle = src.angle || 0;
    return this;
  }

  interpolate(target, t, dst = new AnimatedRect()) {
    return dst.set(
      (target.left - this.left) * t + this.left,
      (target.top - this.top) * t + this.top,
      (target.width - this.width) * t + this.width,
      (target.height - this.height) * t + this.height,
      (target.angle - this.angle) * t + this.angle
    );
  }

  equal(other) {
    return (
      this.left === other.left &&
      this.top === other.top &&
      this.width === other.width &&
      this.height === other.height &&
      this.angle === other.angle
    );
  }

  transform(target) {
    let transform;
    const leftDiff = target.left - this.left;
    const topDiff = target.top - this.top;
    if (this.width !== target.width || this.height !== target.height) {
      const {width, height} = target;
      const widthScale = width / this.width;
      const heightScale = height / this.height;
      if (this.angle !== target.angle) {
        const angleDiff = target.angle - this.angle;
        transform = `translate3d(${leftDiff}px, ${topDiff}px, 0)` +
          ` scale(${widthScale}, ${heightScale}) rotateZ(${angleDiff}rad)`;
      }
      else {
        transform = `translate3d(${leftDiff}px, ${topDiff}px, 0) scale(${widthScale}, ${heightScale})`;
      }
    }
    else if (this.angle !== target.angle) {
      const angleDiff = target.angle - this.angle;
      transform = `translate3d(${leftDiff}px, ${topDiff}px, 0) rotateZ(${angleDiff}rad)`;
    }
    else {
      transform = `translate3d(${leftDiff}px, ${topDiff}px, 0)`;
    }
    return transform;
  }

  transformStyle(target, style) {
    const transform = this.transform(target);
    style.transform = transform;
    style.webkitTransform = transform;
    style.MozTransform = transform;
    style.MsTransform = transform;
    return style;
  }
}

AnimatedRect.getBoundingClientRect = function(
  element,
  dst = new AnimatedRect()
) {
  return dst.copy(element.getBoundingClientRect());
};
