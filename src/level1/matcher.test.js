import Matcher from './matcher';

let matcher;

beforeEach(() => {
  matcher = new Matcher();
});

it('matches type then animation and id', () => {
  matcher.add('type', ['enter', '{type}spin']);

  expect(matcher.match('type')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toBeFalsy();
  expect(matcher.matchId()).toBe('type');

  expect(matcher.match('type enter')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('enter');
  expect(matcher.matchId()).toBe('type');

  expect(matcher.match('enter type')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('enter');
  expect(matcher.matchId()).toBe('type');

  expect(matcher.match('type typespin')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('typespin');
  expect(matcher.matchId()).toBe('type');

  expect(matcher.match('typespin type')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('typespin');
  expect(matcher.matchId()).toBe('type');

  expect(matcher.match('type typeid typespin')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('typespin');
  expect(matcher.matchId()).toBe('typeid');

  expect(matcher.match('type idtype typespin')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('typespin');
  expect(matcher.matchId()).toBe('type');

  expect(matcher.match('type typespin typeid')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('typespin');
  expect(matcher.matchId()).toBe('typeid');

  expect(matcher.match('typeid')).toBe(false);
  expect(matcher.matchType()).toBeFalsy();
  expect(matcher.matchAnimation()).toBeFalsy();
  expect(matcher.matchId()).toBeFalsy();

  expect(matcher.match('typespin')).toBe(false);
  expect(matcher.matchType()).toBeFalsy();
  expect(matcher.matchAnimation()).toBeFalsy();
  expect(matcher.matchId()).toBeFalsy();

  expect(matcher.match('typo')).toBe(false);
  expect(matcher.matchType()).toBeFalsy();
  expect(matcher.matchAnimation()).toBeFalsy();
  expect(matcher.matchId()).toBeFalsy();
});

it('matches between different types', () => {
  matcher.add('type', ['enter', '{type}spin']);
  matcher.add('loader', ['leave', '{type}spin']);
  matcher.add('char {type}{id}', ['glide', 'idle']);

  expect(matcher.match('type typeid typespin')).toBe(true);
  expect(matcher.matchType()).toBe('type');
  expect(matcher.matchAnimation()).toEqual('typespin');
  expect(matcher.matchId()).toBe('typeid');

  expect(matcher.match('loader loaderspin loaderable')).toBe(true);
  expect(matcher.matchType()).toBe('loader');
  expect(matcher.matchAnimation()).toEqual('loaderspin');
  expect(matcher.matchId()).toBe('loaderable');

  expect(matcher.match('char charcoal idle')).toBe(true);
  expect(matcher.matchType()).toBe('char');
  expect(matcher.matchAnimation()).toBe('idle');
  expect(matcher.matchId()).toBe('charcoal');

  expect(matcher.match('typo')).toBe(false);
  expect(matcher.matchType()).toBeFalsy();
  expect(matcher.matchAnimation()).toBeFalsy();
  expect(matcher.matchId()).toBeFalsy();
});
