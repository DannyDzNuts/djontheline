import test from 'node:test';
import assert from 'node:assert/strict';
import { settleDelta, wheelLooksDiscrete } from '../src/scripts/scroll-policy.ts';
test('proximity allows portrait media, rejects tiny or distant corrections', () => {
  assert.equal(settleDelta(120, 1300, 800), 24);
  assert.equal(settleDelta(400, 600, 800), null);
  assert.equal(settleDelta(98, 600, 800), null);
  assert.equal(settleDelta(60, 600, 800), -36);
});
test('wheel inference favors native unless there is evidence of discrete detents', () => {
  assert.equal(wheelLooksDiscrete(120, 0, 80, 120), true);
  assert.equal(wheelLooksDiscrete(120, 0, 8, 120), false);
  assert.equal(wheelLooksDiscrete(120, 0, 800, 120), false);
  assert.equal(wheelLooksDiscrete(12.5, 0, 16, 12.5), false);
  assert.equal(wheelLooksDiscrete(120, 0, 100, 0), false);
  assert.equal(wheelLooksDiscrete(3, 1, 0, 0), true);
});
