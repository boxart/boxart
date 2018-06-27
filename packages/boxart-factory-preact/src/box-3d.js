import {h, Component} from 'preact';

class Box3d extends Component {
  render() {
    const {props} = this;
    const {rect, children} = props;
    // const props = Object.assign({}, this.props);
    // delete props.rect;
    const values = rect.values || {};
    return (
      <div
        {...props.dom}
        className={rect.name}
        style={Object.assign({
          position: 'absolute',
          top: `${rect.y * 100 - rect.height / 2 * 100}%`,
          right: `${(1 - rect.x) * 100 - rect.width / 2 * 100}%`,
          bottom: `${(1 - rect.y) * 100 - rect.height / 2 * 100}%`,
          left: `${rect.x * 100 - rect.width / 2 * 100}%`,
          transform:
            `perspective(${values.perspective || 0}px) ` +
            `translate3d(${values.translateX || 0}%, ${values.translateY || 0}%, ${values.translateZ || 0}px) ` +
            `rotateX(${values.rotateX || 0}deg) ` +
            `rotateY(${values.rotateY || 0}deg) ` +
            `rotateZ(${values.rotateZ || 0}deg) ` +
            `scale(${typeof values.scaleX === 'undefined' ? values.scaleX : 1}, ${typeof values.scaleY === 'undefined' ? values.scaleY : 1})`,
        }, props.dom && props.dom.style)}>
        {children}
      </div>
    );
  }
}

Box3d.rectTypes = {
  perspective: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  translateX: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  translateY: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  translateZ: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  rotateX: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  rotateY: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  rotateZ: {
    edit(source) {return source || 0;},
    filter(source) {return Number(source);},
  },
  scaleX: {
    edit(source) {return typeof source === 'undefined' ? 1 : source;},
    filter(source) {return Number(source);},
  },
  scaleY: {
    edit(source) {return typeof source === 'undefined' ? 1 : source;},
    filter(source) {return Number(source);},
  },
};

export default Box3d;
