import update from './update';

it('property("left")', () => {
  expect(update.property('left')({}, {left: 1}, {})).toBe(1);
});

it.skip('property((state, element) => element.left)', () => {
  expect(update.property((state, element) => element.left)({}, {left: 1}, {})).toBe(1);
});

it('rect((state, element) => element.left)', () => {
  expect(
    update.rect()
    .asElement(
      (state, element) => element.left
    )(
      {},
      {
        scrollLeft: 1,
        getBoundingClientRect() {
          return {
            left: 1
          };
        }
      },
      {}
    )
  ).toBe(2);
});

it('object({left: (state, element) => element.left})', () => {
  expect(update.object({left: (state, element) => element.left})({}, {left: 1}, {}).left).toBe(1);
});

it('properties({styles: object({left: (state, styles) => styles.left})})', () => {
  expect(update.properties({styles: update.object({left: (state, styles) => styles.left})})({}, {styles: {left: 1}}, {}).left).toBe(1);
});

it('elements({leg: object({id: property("id")})})', () => {
  expect(
    update.elements({
      leg: update.object({
        id: update.property('id')
      })
    })(
      {},
      {},
      {
        animated: {
          root: {
            element: {
              getElementsByClassName() {
                return [{id: 1}];
              }
            }
          }
        }
      }
    ).leg.id
  ).toBe(1);
});
