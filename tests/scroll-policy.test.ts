import test from 'node:test';
import assert from 'node:assert/strict';
import { settleDelta } from '../src/scripts/scroll-policy.ts';

test('nearby compositions settle within a small proximity only', () => {
  assert.equal(settleDelta(120, 600, 800), 24);
  assert.equal(settleDelta(400, 600, 800), null);
});
test('tall compositions and tiny corrections remain native', () => {
  assert.equal(settleDelta(120, 1300, 800), null);
  assert.equal(settleDelta(98, 600, 800), null);
});
test('can settle gently upward as well as downward', () => {
  assert.equal(settleDelta(60, 600, 800), -36);
});
