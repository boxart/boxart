import {h} from 'preact';
import Box from './box';
import RenderBox from './render-box';

class BoxInsert extends Box {
  render() {
    const {props} = this;
    const {rect, children} = props;
    // const props = Object.assign({}, this.props);
    // delete props.rect;
    // const {rect, children} = this.props;
    const values = rect.values === null ? {} : rect.values;
    // console.log(values);
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
        }, props.dom && props.dom.style)}>
        <RenderBox rect={values.box} replace={values.replace} insert={values.insert} />
      </div>
    );
  }
}

BoxInsert.rectTypes = {
  box: {
    edit(source) {return JSON.stringify(source);},
    filter(source) {return JSON.parse(source);},
  },
  replace: {
    edit(source) {return JSON.stringify(source);},
    filter(source) {return JSON.parse(source);},
  },
  insert: {
    edit(source) {return JSON.stringify(source);},
    filter(source) {return JSON.parse(source);},
  },
};

export default BoxInsert;
