import AnimatedTimer from '../src/animated-timer';

describe('AnimatedTimer', function() {

  class FakeAgent {
    frame() {
      return new Promise(requestAnimationFrame);
    }

    timer(fn) {
      const timer = new AnimatedTimer(this);
      return timer._init(fn);
    }
  }

  let agent;
  let fakeTimers;

  beforeEach(function() {
    agent = new FakeAgent();
    fakeTimers = sinon.useFakeTimers();
  });

  afterEach(function() {
    fakeTimers.restore();
  });

  it('creates a timer', function() {
    const timer = agent.timer();
    expect(timer).to.be.an.instanceOf(AnimatedTimer);
  });

  it('can be canceled', function() {
    const timer = agent.timer();
    expect(timer.cancel).to.be.a('function');
    timer.cancel();
    return timer.then().catch(error => {
      expect(error.message).to.equal('Timer canceled');
    });
  });

  it('returns a value from the cancel handler', function() {
    const timer = agent.timer();
    timer.cancelable(() => 1);
    expect(timer.cancel()).to.equal(1);
    return timer.then().catch(error => {
      expect(error.message).to.equal('Timer canceled');
    });
  });

  it('can be reinitialized after being fulfilled', function() {
    const timer = agent.timer();
    return timer
    .then(() => {
      timer._init();
      return timer.then();
    });
  });

  it('can be reinitialized after being canceled', function() {
    const timer = agent.timer();
    timer.cancel();
    const promise = timer.then().catch(error => {
      expect(error.message).to.equal('Timer canceled');
    });
    timer._init();
    return promise;
  });

  it('joins after all arbitrary promises', function() {
    const timer = agent.timer();
    Promise.resolve().then(() => fakeTimers.tick(10));
    const promises = [
      Promise.resolve(),
      new Promise(requestAnimationFrame),
      new Promise(resolve => setTimeout(resolve, 10))
    ];
    let allJoined = false;
    const all = Promise.all(promises)
    .then(() => {allJoined = true;})
    promises.forEach(timer.join, timer);
    return timer
    .then(() => {
      expect(allJoined).to.be.ok;
    });
  });

  it('waits until next animation frame', function() {
    const timer = agent.timer();
    return timer.frame();
  });

  it('joins after the last frame', function() {
    const timer = agent.timer();
    let frameResolved = 0;
    timer.frame()
    .then(() => {frameResolved = 1; return timer.frame();})
    .then(() => {frameResolved = 2; return timer.frame();})
    .then(() => {frameResolved = 3;});
    return timer
    .then(() => {
      expect(frameResolved).to.equal(3);
    });
  });

  it('joins after the last frame in timer callback', function() {
    let frameResolved = 0;
    return agent.timer(timer => {
      return timer.frame()
      .then(() => {frameResolved = 1; return timer.frame();})
      .then(() => {frameResolved = 2; return timer.frame();})
      .then(() => {frameResolved = 3;});
    })
    .then(() => {
      expect(frameResolved).to.equal(3);
    });
  });

  it('throws after being fulfilled instead of waiting for frame', function() {
    const timer = agent.timer();
    let frameResolved = 0;
    return timer.frame()
    .then(() => {frameResolved = 1; return timer.frame();})
    .then(() => {return Promise.resolve();})
    .then(() => {frameResolved = 2; return timer.frame()})
    .then(() => {frameResolved = 3; return timer.frame()})
    .then(() => {throw new Error();})
    .catch(error => {
      expect(frameResolved).to.equal(2);
      expect(error.message).to.equal('Timer fulfilled');
    });
  });

  it('throws when canceled while waiting for frame', function() {
    const timer = agent.timer();
    let frameResolved = 0;
    const promise = timer.frame()
    .then(() => {frameResolved = 1; return timer.frame();});
    promise.then(() => Promise.resolve().then(() => timer.cancel()));
    return promise
    .then(() => {frameResolved = 2; return timer.frame();})
    .then(() => {frameResolved = 3; return timer.frame();})
    .then(() => {throw new Error();})
    .catch(error => {
      expect(frameResolved).to.equal(2);
      expect(error.message).to.equal('Timer canceled');
    });
  });

  it('times out for a given number of milliseconds', function() {
    const start = Date.now();
    const timer = agent.timer();
    Promise.resolve().then(() => fakeTimers.tick(10));
    return timer.timeout(10)
    .then(() => {expect(Date.now() - start).to.be.gte(10);});
  });

  it('joins after the last timeout', function() {
    const timer = agent.timer();
    let timeoutResolved = 0;
    Promise.resolve()
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10));
    timer.timeout(10)
    .then(() => {timeoutResolved = 1; return timer.timeout(10);})
    .then(() => {timeoutResolved = 2; return timer.timeout(10);})
    .then(() => {timeoutResolved = 3;});
    return timer
    .then(() => {
      expect(timeoutResolved).to.equal(3);
    });
  });

  it('joins after the last timeout in timer callback', function() {
    let timeoutResolved = 0;
    Promise.resolve()
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10));
    return agent.timer(timer => {
      return timer.timeout(10)
      .then(() => {timeoutResolved = 1; return timer.timeout(10);})
      .then(() => {timeoutResolved = 2; return timer.timeout(10);})
      .then(() => {timeoutResolved = 3;});
    })
    .then(() => {
      expect(timeoutResolved).to.equal(3);
    });
  });

  it('throws after being fulfilled instead of waiting for timeout', function() {
    const timer = agent.timer();
    let timeoutResolved = 0;
    Promise.resolve()
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10));
    return timer.timeout(10)
    .then(() => {timeoutResolved = 1; return timer.timeout(10);})
    .then(() => {return Promise.resolve();})
    .then(() => {timeoutResolved = 2; return timer.timeout(10)})
    .then(() => {timeoutResolved = 3; return timer.timeout(10)})
    .then(() => {throw new Error();})
    .catch(error => {
      expect(timeoutResolved).to.equal(2);
      expect(error.message).to.equal('Timer fulfilled');
    });
  });

  it('throws when canceled while waiting for timeout', function() {
    const timer = agent.timer();
    let timeoutResolved = 0;
    Promise.resolve()
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10))
    .then(() => Promise.resolve())
    .then(() => fakeTimers.tick(10));
    const promise = timer.timeout(10)
    .then(() => {timeoutResolved = 1; return timer.timeout(10);});
    promise.then(() => Promise.resolve().then(() => timer.cancel()));
    return promise
    .then(() => {timeoutResolved = 2; return timer.timeout(10);})
    .then(() => {timeoutResolved = 3; return timer.timeout(10);})
    .then(() => {throw new Error();})
    .catch(error => {
      expect(timeoutResolved).to.equal(2);
      expect(error.message).to.equal('Timer canceled');
    });
  });

  it('loops until the loop handler returns 1', function() {
    const timer = agent.timer();
    let t = 0;
    return timer
    .loop(() => {
      t += 0.25;
      return t;
    })
    .then(() => {
      expect(t).to.be.gte(1);
    });
  });

  it('joins after the last loop', function() {
    const timer = agent.timer();
    let loopResolved = 0;
    let t = 0;
    let loopfn = () => {t += 0.5; return t;};
    timer.loop(loopfn)
    .then(() => {loopResolved = 1; t = 0; return timer.loop(loopfn);})
    .then(() => {loopResolved = 2; t = 0; return timer.loop(loopfn);})
    .then(() => {loopResolved = 3;});
    return timer
    .then(() => {
      expect(loopResolved).to.equal(3);
    });
  });

  it('joins after the last loop in timer callback', function() {
    let loopResolved = 0;
    let t = 0;
    let loopfn = () => {t += 0.5; return t;};
    return agent.timer(timer => {
      return timer.loop(loopfn)
      .then(() => {loopResolved = 1; t = 0; return timer.loop(loopfn);})
      .then(() => {loopResolved = 2; t = 0; return timer.loop(loopfn);})
      .then(() => {loopResolved = 3;});
    })
    .then(() => {
      expect(loopResolved).to.equal(3);
    });
  });

  it('throws after being fulfilled instead of starting a loop', function() {
    const timer = agent.timer();
    let loopResolved = 0;
    let t = 0;
    let loopfn = () => {t += 0.5; return t;};
    return timer.loop(loopfn)
    .then(() => {loopResolved = 1; return timer.loop(loopfn);})
    .then(() => {return Promise.resolve();})
    .then(() => {loopResolved = 2; return timer.loop(loopfn)})
    .then(() => {loopResolved = 3; return timer.loop(loopfn)})
    .then(() => {throw new Error();})
    .catch(error => {
      expect(loopResolved).to.equal(2);
      expect(error.message).to.equal('Timer fulfilled');
    });
  });

  it('throws when canceled while waiting for loop', function() {
    const timer = agent.timer();
    let loopResolved = 0;
    let t = 0;
    let loopfn = () => {t += 0.5; return t;};
    const promise = timer.loop(loopfn)
    .then(() => {loopResolved = 1; return timer.loop(loopfn);});
    promise.then(() => Promise.resolve().then(() => timer.cancel()));
    return promise
    .then(() => {loopResolved = 2; return timer.loop(loopfn);})
    .then(() => {loopResolved = 3; return timer.loop(loopfn);})
    .then(() => {throw new Error();})
    .catch(error => {
      expect(loopResolved).to.equal(2);
      expect(error.message).to.equal('Timer canceled');
    });
  });

});
