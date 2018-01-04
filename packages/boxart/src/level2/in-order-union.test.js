import './source-map-support';

import inOrderUnion from './in-order-union';

const expectInOrder = (a, b, r) => {
  expect(inOrderUnion(a.split(''), b.split(''), [], [])).toEqual(r.split(''));
};

it('merges two sets of unique names respecting order in both', () => {
  expectInOrder('abcde', 'abcde', 'abcde');
  expectInOrder('abcde', 'bacde', 'bacde');
  expectInOrder('abcde', 'cabde', 'cabde');
  expectInOrder('abcde', 'dabce', 'dabce');
  expectInOrder('abcde', 'eabcd', 'eabcd');
  expectInOrder('abcde', 'bcdea', 'bcdea');
  expectInOrder('abcde', 'acdeb', 'acdeb');
  expectInOrder('abcde', 'abdec', 'abdec');
  expectInOrder('abcde', 'abced', 'abced');

  expectInOrder('abcde', 'a', 'bcdea');
  expectInOrder('abcde', 'b', 'acdeb');
  expectInOrder('abcde', 'c', 'abdec');
  expectInOrder('abcde', 'd', 'abced');
  expectInOrder('abcde', 'e', 'abcde');
  expectInOrder('abcde', 'f', 'abcdef');
  expectInOrder('abcde', 'g', 'abcdeg');
  expectInOrder('abcde', 'h', 'abcdeh');
  expectInOrder('abcde', 'i', 'abcdei');
  expectInOrder('abcde', 'j', 'abcdej');

  expectInOrder('abcde', 'ace', 'abcde');
  expectInOrder('abcde', 'aec', 'abdec');
  expectInOrder('abcde', 'cae', 'bcade');
  expectInOrder('abcde', 'cea', 'bcdea');
  expectInOrder('abcde', 'eac', 'bdeac');
  expectInOrder('abcde', 'eca', 'bdeca');

  expectInOrder('abcde', 'afcge', 'afbcgde');
  expectInOrder('abcde', 'afegc', 'afbdegc');
  expectInOrder('abcde', 'cfage', 'bcfagde');
  expectInOrder('abcde', 'cfega', 'bcfdega');
  expectInOrder('abcde', 'efagc', 'bdefagc');
  expectInOrder('abcde', 'efcga', 'bdefcga');
});
