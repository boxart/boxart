import React, {Component} from 'react';
import {render, unmountComponentAtNode} from 'react-dom';

import AnimatedAgent from '../src/animated-agent';
import Animated from '../src/animated';

describe('AnimatedAgent', function() {

  let root;

  before(function() {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  after(function() {
    document.body.removeChild(root);
  });

  afterEach(function() {
    unmountComponentAtNode(root);
  });

  it('has a rectangle for its dom element', function() {
    const agent = render(<AnimatedAgent><div></div></AnimatedAgent>, root);
    expect(agent.rect).to.be.ok;
  });

  it('starts animation when Animated did mount', function() {
    let agent = render(<AnimatedAgent><div></div></AnimatedAgent>, root);
    let spy = sinon.spy();
    return new Promise(requestAnimationFrame)
    .then(() => {
      agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(spy).to.be.called;
    });
  })
   
  it('starts animation when Animated did update', function() {
    let agent = render(<AnimatedAgent><div></div></AnimatedAgent>, root);
    let spy = sinon.spy();
    return new Promise(requestAnimationFrame)
    .then(() => {
      agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(spy).to.be.calledTwice;
    });
  });

  it('calls animate on Animated and not Animate.props.animate', function() {
    class AnimatedTest extends Animated {
      animate(options) {
        return this.props.animateTest(options);
      }
    }

    let dontSpy = sinon.spy();
    let doSpy = sinon.spy();
    let agent = render(<AnimatedAgent><div>
      <AnimatedTest
        key="key" animateKey="key" 
        animate={dontSpy} animateTest={doSpy}>
        <div></div>
      </AnimatedTest>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      expect(doSpy).to.be.called;
      expect(dontSpy).to.not.be.called;
    });
  });

  it('cancels animation when Animated did update', function() {
    let spy = sinon.spy();
    let stub = sinon.stub();
    stub.returns({cancel: spy});
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={stub}>
        <div></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      let agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={() => {}}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame)
    })
    .then(() => {
      expect(spy).to.be.called;
    });
  });

  it('restarts animation when Animated did update', function() {
    let spy = sinon.spy();
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={() => {}}>
        <div></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      let agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame)
    })
    .then(() => {
      expect(spy).to.be.called;
    });
  });

  it('removes style when Animated will update', function() {
    let spy = sinon.spy();
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={options => {
        options.replaceStyle({transform: 'translate(10px, 0)'});
      }}>
        <div className="animated-test"></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      let agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={() => {}}>
          <div className="animated-test"></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame)
    })
    .then(() => {
      expect(document.querySelector('.animated-test').style.transform)
      .to.equal('');
    });
  });

  it('reuses animation timers', function() {
    let timerA, timerB;
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={options => {
        timerA = options.timer();
        return timerA;
      }}>
        <div className="animated-test"></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => timerA)
    .then(() => new Promise(requestAnimationFrame))
    .then(() => {
      let agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={options => {
          timerB = options.timer();
          return timerB;
        }}>
          <div className="animated-test"></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(timerA).to.equal(timerB);
    });
  });

  it('reuses animation callback options', function() {
    let optionsA, optionsB;
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={options => {
        optionsA = options;
        return Promise.resolve();
      }}>
        <div className="animated-test"></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => new Promise(requestAnimationFrame))
    .then(() => {
      let agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={options => {
          optionsB = options;
          return Promise.resolve();
        }}>
          <div className="animated-test"></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(optionsA).to.equal(optionsB);
    });
  });

  it('animateFrom transforms Animated from one position to another', function() {
    let timerA, timerB;
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key">
        <div className="animated-test" style={{position: 'absolute', left: 0}}></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      let agent = render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key">
          <div className="animated-test" style={{position: 'absolute', left: 10}}></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(document.querySelector('.animated-test').style.transform)
      .to.not.equal('');
    });
  });

  it('updates rectangles when agent moves', function() {
    let timerA, timerB;
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key">
        <div className="animated-test" style={{position: 'absolute', left: 0}}></div>
      </Animated>
    </div></AnimatedAgent>, root);
    let rect = agent.rect.clone();
    return new Promise(requestAnimationFrame)
    .then(() => {
      agent = render(<AnimatedAgent><div style={{position: 'absolute', left: 10}}>
        <Animated key="key" animateKey="key">
          <div className="animated-test" style={{position: 'absolute', left: 10}}></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(agent.rect).to.not.eql(rect);
    });
  });

});
