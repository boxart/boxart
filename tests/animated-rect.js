import AnimatedRect from '../src/animated-rect';

describe('AnimatedRect', function() {

  function expectSquare(rect, left = 0, top = 0, width = 128, height = 128, angle = 0) {
    expect(rect).to.eql({
      left,
      top,
      width,
      height,
      angle,
    });
  }

  it('creates a Rectangle', function() {
    const rect = new AnimatedRect(0, 0, 128, 128, 0);
    expectSquare(rect);
  });

  it('sets values', function() {
    const rect = new AnimatedRect();
    rect.set(0, 0, 128, 128, 0);
    expectSquare(rect);
  });

  it('clones into a new Rectangle', function() {
    const rect = new AnimatedRect(0, 0, 128, 128, 0);
    const clone = rect.clone();
    expectSquare(rect);
    const cloneSrc = new AnimatedRect();
    const clone2 = rect.clone(cloneSrc);
    expectSquare(cloneSrc);
    expectSquare(clone2);
    expect(clone2).to.equal(cloneSrc);
  });

  it('copies another Rectangle', function() {
    const src = new AnimatedRect(0, 0, 128, 128, 0);
    const rect = new AnimatedRect();
    rect.copy(src);
    expectSquare(rect);
  });

  it('interpolates between Rectangles', function() {
    const a = new AnimatedRect(0, 0, 128, 128, 0);
    const b = new AnimatedRect(128, 128, 256, 256, Math.PI);
    const rect = a.interpolate(b, 0);
    expectSquare(a);
    a.interpolate(b, 0.5, a);
    expectSquare(a, 64, 64, 192, 192, Math.PI * 0.5);
  });

  it('equals another Rectangle', function() {
    const a = new AnimatedRect(0, 0, 128, 128, 0);
    const b = new AnimatedRect(0, 0, 128, 128, 0);
    expect(a.equal(b)).to.be.ok;
  });

  it('creates a 3d transform', function() {
    const a = new AnimatedRect(0, 0, 128, 128, 0);
    const b = new AnimatedRect(128, 128, 128, 128, 0);
    const c = new AnimatedRect(0, 0, 256, 256, 0);
    const d = new AnimatedRect(0, 0, 128, 128, Math.PI);
    const e = new AnimatedRect(128, 128, 128, 128, Math.PI);
    const f = new AnimatedRect(0, 0, 256, 256, Math.PI);
    const g = new AnimatedRect(128, 128, 256, 256, 0);
    const h = new AnimatedRect(128, 128, 256, 256, Math.PI);
    expect(a.transform(b)).to.equal('translate3d(128px, 128px, 0)');
    expect(a.transform(c)).to.equal(`translate3d(0px, 0px, 0) scale(2, 2)`);
    expect(a.transform(d)).to.equal(`translate3d(0px, 0px, 0) rotateZ(${Math.PI}rad)`);
    expect(a.transform(e)).to.equal(`translate3d(128px, 128px, 0) rotateZ(${Math.PI}rad)`);
    expect(a.transform(f)).to.equal(`translate3d(0px, 0px, 0) scale(2, 2) rotateZ(${Math.PI}rad)`);
    expect(a.transform(g)).to.equal(`translate3d(128px, 128px, 0) scale(2, 2)`);
    expect(a.transform(h)).to.equal(`translate3d(128px, 128px, 0) scale(2, 2) rotateZ(${Math.PI}rad)`);
  });

  it('sets browser prefixed transforms', function() {
    const a = new AnimatedRect(0, 0, 128, 128, 0);
    const b = new AnimatedRect(128, 128, 128, 128, 0);
    expect(a.transformStyle(b, {})).to.eql({
      transform: 'translate3d(128px, 128px, 0)',
      webkitTransform: 'translate3d(128px, 128px, 0)',
      MozTransform: 'translate3d(128px, 128px, 0)',
      MsTransform: 'translate3d(128px, 128px, 0)',
    });
  });

  let div;

  before(function() {
    div = document.createElement('div');
    document.body.appendChild(div);
    div.style.width = '128px';
    div.style.height = '128px';
  });

  after(function() {
    document.body.removeChild(div);
  });

  it('creates a rectangle from an element', function() {
    const rect = AnimatedRect.getBoundingClientRect(div);
    expectSquare(rect, 0, div.getBoundingClientRect().top);
  });

});
