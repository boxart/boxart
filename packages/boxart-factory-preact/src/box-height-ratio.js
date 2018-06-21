import {h} from 'preact';
import Box from './box';

class BoxHeightRatio extends Box {
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
          left: `${rect.x * 100 - rect.width / 2 * 100}%`,
          paddingBottom: `${rect.height * 100}%`,
        }, props.dom && props.dom.style)}>
        {children}
      </div>
    );
  }
}

export default BoxHeightRatio;
