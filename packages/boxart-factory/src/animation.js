const EASING = {
  LINEAR: 'linear',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE: 'ease',
};

const FORMAT = {
  BEGIN_TO_END: 'transition',
  TRANSITION: 'transition',
  ABSOLUTE: 'animation',
  ANIMATION: 'animation',
};

class Keyframe {
  constructor({time = 0, easing = EASING.LINEAR, format = FORMAT.ABSOLUTE, value = format === FORMAT.ABSOLUTE ? 0 : 0.5}) {
    // in 30 frames a second
    this.time = time;
    // ???
    this.value = value;
    // easing function from last frame to here: linear, easeIn, easeOut, ease
    this.easing = easing;
    // b2e, relative to end, absolute
    this.format = format;
  }

  assign(frame) {
    return new Keyframe(Object.assign({}, this, frame));
  }

  static fromJson(_keyframe) {
    return new Keyframe(_keyframe);
  }
}

class Property {
  constructor({name, keyframes = []} = {}) {
    this.name = name;
    this.keyframes = keyframes;
  }

  _changeKeyframes(time, newFrame) {
    return new Property(Object.assign({}, this, {
      keyframes: [
        ...this.keyframes.filter(key => key.time !== time),
        newFrame,
      ]
      .filter(Boolean)
      .sort((a, b) => a.time - b.time),
    }));
  }

  _findFrame(time) {
    return (this.keyframes.find(key => key.time === time) || new Keyframe({time}));
  }

  addFrame(frame) {
    return this._changeKeyframes(frame.time, this._findFrame(frame.time).assign(frame));
  }

  changeFrame(time, frame) {
    return this._changeKeyframes(time, this._findFrame(time).assign(frame));
  }

  removeFrame(time, frame) {
    return this._changeKeyframes(time, null);
  }

  static fromJson({name, keyframes}) {
    return new Property({name, keyframes: keyframes.map(Keyframe.fromJson)});
  }
}

class Box {
  constructor({name = '', properties = []} = {}) {
    this.name = name;
    this.properties = properties;
  }

  _changeProperties(propertyName, newProperty) {
    console.log('_changeProperties', propertyName, newProperty);
    return new Box(Object.assign({}, this, {
      properties: [
        ...this.properties.filter(prop => prop.name !== propertyName),
        newProperty,
      ].filter(Boolean),
    }));
  }

  _findProperty(propertyName) {
    return (this.properties.find(prop => prop.name === propertyName) || new Property({name: propertyName}));
  }

  addProperty(propertyName) {
    console.log(this._changeProperties(propertyName, this._findProperty(propertyName)));
    return this._changeProperties(propertyName, this._findProperty(propertyName));
  }

  removeProperty(propertyName) {
    return this._changeProperties(propertyName, null);
  }

  addFrame(propertyName, frame) {
    return this._changeProperties(propertyName, this._findProperty(propertyName).addFrame(frame));
  }

  changeFrame(propertyName, time, frame) {
    return this._changeProperties(propertyName, this._findProperty(propertyName).changeFrame(time, frame));
  }

  removeFrame(propertyName, time) {
    return this._changeProperties(propertyName, this._findProperty(propertyName).removeFrame(time));
  }

  static fromJson({name, properties}) {
    return new Box({name, properties: properties.map(Property.fromJson)});
  }
}

class Animation {
  constructor({boxes = [], duration = 30} = {}) {
    this.boxes = boxes;
    this.duration = duration;
  }

  assign(values) {
    console.log(new Animation(Object.assign({}, this, values)));
    return new Animation(Object.assign({}, this, values));
  }

  _changeBoxes(boxName, newBox) {
    console.log('_changeBoxes', boxName, newBox);
    return new Animation(Object.assign({}, this, {
      boxes: [
        ...this.boxes.filter(box => box.name !== boxName),
        newBox,
      ],
    }));
  }

  _findBox(boxName) {
    return (
      this.boxes.find(box => box.name === boxName) ||
      new Box({name: boxName})
    );
  }

  addProperty(boxName, propertyName) {
    console.log(this._changeBoxes(boxName, this._findBox(boxName).addProperty(propertyName)));
    return this._changeBoxes(boxName, this._findBox(boxName).addProperty(propertyName));
  }

  removeProperty(boxName, propertyName) {
    return this._changeBoxes(boxName, this._findBox(boxName).removeProperty(propertyName));
  }

  addFrame(boxName, propertyName, frame) {
    return this._changeBoxes(boxName, this._findBox(boxName).addFrame(propertyName, frame));
  }

  changeFrame(boxName, propertyName, time, frame) {
    return this._changeBoxes(boxName, this._findBox(boxName).changeFrame(propertyName, time, frame));
  }

  removeFrame(boxName, propertyName, time) {
    return this._changeBoxes(boxName, this._findBox(boxName).removeFrame(propertyName, time));
  }

  static fromJson({boxes, duration}) {
    return new Animation({boxes: boxes.map(Box.fromJson), duration});
  }
}

export default Animation;

export {
  Animation,
  Box,
  Property,
  Keyframe,
  EASING,
  FORMAT,
};
