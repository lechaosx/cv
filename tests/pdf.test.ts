import assert from 'node:assert/strict';
import { test } from 'node:test';
import { smallTextWarning } from '../scripts/render-pdf.ts';

test('PDF text warnings use the resulting body size in points', () => {
  assert.equal(smallTextWarning('en', 74, 16), 'EN PDF body text is 8.88pt at 74% scale, below the 9pt minimum; shorten the content to enlarge it.');
  assert.equal(smallTextWarning('cs', 70, 16), 'CS PDF body text is 8.4pt at 70% scale, below the 9pt minimum; shorten the content to enlarge it.');
  assert.equal(smallTextWarning('en', 75, 16), undefined);
  assert.equal(smallTextWarning('en', 100, 16), undefined);
});
