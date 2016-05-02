import React, {Children, Component} from 'react';

import TransitionGroup from 'react-addons-transition-group';

export default class Scene extends Component {
  constructor(props) {
    super(props);

    this.handleShouldLeave = this.handleShouldLeave.bind(this);
    this.state = this.handleProps(props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props !== newProps) {
      this.setState(this.handleProps(newProps));
    }
  }

  shouldComponentUpdate(newProps, newState) {
    return this.state !== newState;
  }

  handleProps(props) {
    const index = this.props.index || 0;
    const children = Children.toArray(props.children)
    .slice(index, index + 1)
    .map(child => {
      let childClone;
      if (typeof child === 'function') {
        childClone = child({
          shouldLeave: this.handleShouldLeave,
        });
      }
      else {
        childClone = React.cloneElement(child, {
          shouldLeave: this.handleShouldLeave,
        });
      }
      return childClone;
    });
    return {children};
  }

  handleShouldLeave() {
    if (this.props.childShouldLeave) {
      const index = this.props.index || 0;
      this.props.childShouldLeave(
        this.props.children[index],
        index,
        this.props.children
      );
    }
  }

  render() {
    return (<TransitionGroup>
      {this.state.children}
    </TransitionGroup>);
  }
}
