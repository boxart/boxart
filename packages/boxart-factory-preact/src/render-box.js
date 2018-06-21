import {h, Component} from 'preact';

class RenderBox extends Component {
  constructor(...args) {
    super(...args);
  }

  render() {
    const {rect, replace, insert} = this.props;
    const render = rect => {
      if (!rect) {
        return <span />;
      }
      if (replace && replace[rect.name]) {
        return replace[rect.name];
      }
      const Box = require('./box-types').default[rect.type || 'Box'];
      return (
        <Box rect={rect}>
          {insert && insert[rect.name] || rect.children.map((child, index) => render(child))}
        </Box>
      );
    };
    return render(rect);
  }
}

export default RenderBox;
