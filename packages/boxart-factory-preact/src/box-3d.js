import {h, Component} from 'preact';

class Box extends Component {
  render() {
    const {props} = this;
    const {rect, children} = props;
    // const props = Object.assign({}, this.props);
    // delete props.rect;
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
          transform: `perspective(${rect.values.perspective}px) translate3d(${rect.values.translateX}, ${rect.values.translateY}, ${rect.values.translateZ}) rotateX(${rect.values.rotateX}) rotateY(${rect.values.rotateY}) rotateZ(${rect.values.rotateZ}) scale(${rect.values.scaleX}, ${rect.values.scaleY})`,
        }, props.dom && props.dom.style)}>
        {children}
      </div>
    );
  }
}

BoxText.rectTypes = {
  perspective: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  translateX: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  translateY: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  translateZ: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  rotateX: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  rotateY: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  rotateZ: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  scaleX: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
  scaleY: {
    edit(source) {return source;},
    filter(source) {return Number(source);},
  },
};

export default Box;
