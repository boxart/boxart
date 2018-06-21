import {h} from 'preact';
import Box from './box';
import RenderBox from './render-box';

class BoxReplace extends Box {
  render() {
    const {props} = this;
    const {rect, children} = props;
    const values = rect.values === null ? {} : rect.values;
    return (
      <RenderBox rect={values.box} replace={values.replace} insert={values.insert} />
    );
  }
}

BoxReplace.rectTypes = {
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

export default BoxReplace;
