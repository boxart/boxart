import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';

import AnimatedAgent from '../src/animated-agent';
import AnimatedAgentBase from '../src/animated-agent-base';
import Animated from '../src/animated';

describe('AnimatedAgent', function() {

  let root;

  const resolveThen = () => {
    const p = new Promise(requestAnimationFrame)
    .then(() => new Promise(requestAnimationFrame));
    return p.then.bind(p);
  };

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
    render(<AnimatedAgent><div></div></AnimatedAgent>, root);
    const spy = sinon.spy();
    return new Promise(requestAnimationFrame)
    .then(() => {
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(spy).to.be.called;
    });
  });

  it('starts animation when Animated did update', function() {
    render(<AnimatedAgent><div></div></AnimatedAgent>, root);
    const spy = sinon.spy();
    return new Promise(requestAnimationFrame)
    .then(() => {
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      render(<AnimatedAgent><div>
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

    const dontSpy = sinon.spy();
    const doSpy = sinon.spy();
    render(<AnimatedAgent><div>
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
    const spy = sinon.spy();
    const stub = sinon.stub();
    stub.returns({cancel: spy, then: resolveThen()});
    render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={stub}>
        <div></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={() => {}}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(spy).to.be.called;
    });
  });

  it('restarts animation when Animated did update', function() {
    const spy = sinon.spy();
    render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={() => {}}>
        <div></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={spy}>
          <div></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(spy).to.be.called;
    });
  });

  it('removes style when Animated will update', function() {
    render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key" animate={options => {
        options.replaceStyle({transform: 'translate(10px, 0)'});
      }}>
        <div className="animated-test"></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key" animate={() => {}}>
          <div className="animated-test"></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(document.querySelector('.animated-test').style.transform)
      .to.equal('');
    });
  });

  it('reuses animation timers', function() {
    let timerA, timerB;
    render(<AnimatedAgent><div>
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
      render(<AnimatedAgent><div>
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
    render(<AnimatedAgent><div>
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
      render(<AnimatedAgent><div>
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
    render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key">
        <div className="animated-test" style={{position: 'absolute', left: 0}}></div>
      </Animated>
    </div></AnimatedAgent>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      render(<AnimatedAgent><div>
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

  it('animateFrom transforms Animated from one position to another', function() {
    this.slow(1000);
    render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key">
        <div className="animated-test" style={{position: 'absolute', left: 0, top: 0}}></div>
      </Animated>
    </div></AnimatedAgent>, root);
    function getPosition() {
      const el = document.querySelector('.animated-test');
      const {left, top} = el.getBoundingClientRect();
      return [left, top];
    }
    let last = [0, 0];
    const expectMovement = () => {
      const current = getPosition();
      expect(last[0]).to.be.lt(current[0]);
      expect(last[1]).to.be.lt(current[1]);
      last = current;
      return new Promise(resolve => setTimeout(resolve, 100));
    };
    const expectEnd = () => {
      const current = getPosition();
      expect(last[0]).to.be.eq(current[0]);
      expect(last[1]).to.be.eq(current[1]);
    };

    return new Promise(requestAnimationFrame)
    .then(() => {
      last = getPosition();
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key">
          <div className="animated-test" style={{position: 'absolute', left: 10, top: 10}}></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame)
      .then(() => new Promise(requestAnimationFrame));
    })
    .then(expectMovement)
    .then(expectMovement)
    .then(expectMovement)
    .then(expectMovement)
    .then(expectEnd);
  });

  it('animateFrom transforms Animated from one position to another', function() {
    this.slow(2000);
    render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key">
        <div className="animated-test" style={{position: 'absolute', left: 0, top: 0}}></div>
      </Animated>
    </div></AnimatedAgent>, root);
    function getPosition() {
      const el = document.querySelector('.animated-test');
      const {left, top} = el.getBoundingClientRect();
      return [left, top];
    }
    let last = 0;
    const expectMovement = () => {
      const current = getPosition();
      expect(last[0]).to.be.lt(current[0]);
      expect(last[1]).to.be.lt(current[1]);
      last = current;
      return new Promise(resolve => setTimeout(resolve, 100));
    };
    const expectEnd = () => {
      const current = getPosition();
      expect(last[0]).to.be.eq(current[0]);
      expect(last[1]).to.be.eq(current[1]);
    };

    return new Promise(requestAnimationFrame)
    .then(() => {
      last = getPosition();
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key">
          <div className="animated-test" style={{position: 'absolute', left: 10, top: 10}}></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame)
      .then(() => new Promise(requestAnimationFrame));
    })
    .then(expectMovement)
    .then(expectMovement)
    .then(() => {
      last = getPosition();
      render(<AnimatedAgent><div>
        <Animated key="key" animateKey="key">
          <div className="animated-test" style={{position: 'absolute', left: 20, top: 20}}></div>
        </Animated>
      </div></AnimatedAgent>, root);
      return new Promise(requestAnimationFrame)
      .then(() => new Promise(requestAnimationFrame));
    })
    .then(expectMovement)
    .then(expectMovement)
    .then(expectMovement)
    .then(expectMovement)
    .then(expectEnd);
  });

  it('updates rectangles when agent moves', function() {
    let agent = render(<AnimatedAgent><div>
      <Animated key="key" animateKey="key">
        <div className="animated-test" style={{position: 'absolute', left: 0}}></div>
      </Animated>
    </div></AnimatedAgent>, root);
    const rect = agent.rect.clone();
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

  after(function() {
    AnimatedAgentBase.resetGlobalAgent();
  });

  it('uses a global agent when there is no agent context', function() {
    let animated = render(<Animated key="key" animateKey="key">
      <div style={{position: 'absolute', left: 0}}></div>
    </Animated>, root);
    return new Promise(requestAnimationFrame)
    .then(() => {
      animated = render(<Animated key="key" animateKey="key">
        <div style={{position: 'absolute', left: 10}}></div>
      </Animated>, root);
      return new Promise(requestAnimationFrame);
    })
    .then(() => {
      expect(animated.rect().left).to.not.eql(10);
    });
  });

});
