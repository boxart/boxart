import AnimatedCallbackOptions from '../src/animated-callback-options';

describe('AnimatedCallbackOptions', function() {

  it('has expected methods', function() {
    const proto = AnimatedCallbackOptions.prototype;
    expect(proto).to.have.property('transitionFrom');
    expect(proto).to.have.property('transitionFromLast');
    expect(proto).to.have.property('animateFrom');
    expect(proto).to.have.property('animateFromLast');
    expect(proto).to.have.property('removeStyle');
    expect(proto).to.have.property('replaceStyle');
    expect(proto).to.have.property('setStyle');
    expect(proto).to.have.property('timer');
  });

});
