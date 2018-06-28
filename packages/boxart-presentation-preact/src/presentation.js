import {h, Component} from 'preact';

import Slide from './slide';

class Presentation extends Component {
  constructor(...args) {
    super(...args);

    this.state = this.hashState();

    this.hashChange = this.hashChange.bind(this);
    this.keyup = this.keyup.bind(this);
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.hashChange);
    window.addEventListener('keyup', this.keyup);
  }

  hashState() {
    return {
      slide: Number(location.hash.substring(1)) || 0,
    };
  }

  hashChange() {
    this.setState(this.hashState());
  }

  keyup(event) {
    if (event.key === 'ArrowRight') {
      this.nextSlide();
    }
    else if (event.key === 'ArrowLeft') {
      this.prevSlide();
    }
  }

  gotoSlide(slide) {
    this.setState({
      slide: Math.min(Math.max(slide, 0), this.props.children.length - 1),
    });
    history.pushState({}, '', `#${slide}`);
  }

  prevSlide() {
    this.gotoSlide(this.state.slide - 1);
  }

  nextSlide() {
    this.gotoSlide(this.state.slide + 1);
  }

  render({children}, {slide}) {
    console.log(children);
    return (
      <div>
        <Slide key={slide - 1} class="previous">{children[slide - 1] || <span />}</Slide>
        <Slide key={slide} class="active">{children[slide] || <span />}</Slide>
        <Slide key={slide + 1} class="next">{children[slide + 1] || <span />}</Slide>
      </div>
    );
  }
}

export default Presentation;
