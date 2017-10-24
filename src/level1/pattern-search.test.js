import PatternSearch from './pattern-search';

let search;

beforeEach(() => {
  search = new PatternSearch();
});

it('stores patterns', () => {
  search.add('type');
  search.add('typo');
});

it('matches patterns', () => {
  search.add('type');
  search.add('typo');
  search.rebuild();
  expect(search.search('type')).toBe('type');
  expect(search.search(' type')).toBe('type');
  expect(search.search('type ')).toBe('type');
  expect(search.search('word type')).toBe('type');
  expect(search.search('type word')).toBe('type');
  expect(search.search('torn type')).toBe('type');
  expect(search.search('typo')).toBe('typo');
  expect(search.search(' typo')).toBe('typo');
  expect(search.search('typo ')).toBe('typo');
  expect(search.search('word typo')).toBe('typo');
  expect(search.search('typo word')).toBe('typo');
  expect(search.search('torn typo')).toBe('typo');
});
