import React, {Children} from 'react';

import TransitionGroup from 'react-addons-transition-group';

export default class Scene extends Component {
  constructor(props) {
    super(props);

    this.handleFinishScene = this.handleFinishScene.bind(this);
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
    const children = Children.toArray(this.props.children)
    .slice(this.props.sceneIndex || 0, 1)
    .map(child => {
      const childClone = React.cloneElement(child);
      childClone.props.finishScene = this.handleFinishScene;
    });
    return {children};
  }

  handleFinishScene() {
    if (this.props.sceneComplete) {
      const index = this.props.sceneIndex || 0;
      this.props.sceneComplete(
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
