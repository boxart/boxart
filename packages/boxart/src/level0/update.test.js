import update from './update';

it('property("left")', () => {
  expect(update.property('left')({left: 1}, {}, {})).toBe(1);
});

it('property(element => element.left)', () => {
  expect(update.property(element => element.left)({left: 1}, {}, {})).toBe(1);
});

it('rect(element => element.left)', () => {
  expect(update.rect(element => element.left)({getClientBoundingRect() {return {left: 1};}}, {}, {})).toBe(1);
});

it('object({left: element => element.left})', () => {
  expect(update.object({left: element => element.left})({left: 1}, {}, {}).left).toBe(1);
});

it('properties({styles: object({left: styles => styles.left})})', () => {
  expect(update.properties({styles: update.object({left: styles => styles.left})})({styles: {left: 1}}, {}, {}).left).toBe(1);
});

it('elements({leg: object({id: property("id")})})', () => {
  expect(update.elements({leg: update.object({id: update.property('id')})})({}, {}, {elements: {leg: {element: {id: 1}}}}).id).toBe(1);
});
