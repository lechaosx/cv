import assert from 'node:assert/strict';
import { test } from 'node:test';
import { preferredLanguage, renderedText } from '../src/i18n.ts';

test('language preference chooses a saved supported language before the first supported browser language', () => {
  assert.equal(preferredLanguage('en', ['cs-CZ']), 'en');
  assert.equal(preferredLanguage(null, ['de-DE', 'CS-cz', 'en-US']), 'cs');
  assert.equal(preferredLanguage('fr', ['en-US', 'cs']), 'en');
  assert.equal(preferredLanguage(null, ['fr']), 'en');
});

test('Czech typography binds standalone one-letter words without changing other languages, words or URLs', () => {
  const text = 'V Brně a v Praze, s kolegy. www.example.org/v cestě. C++ i C#. Open-source a\nvývoj.';
  assert.equal(renderedText(text, 'cs'), 'V\u00a0Brně a\u00a0v\u00a0Praze, s\u00a0kolegy. www.example.org/v cestě. C++ i\u00a0C#. Open-source a\u00a0vývoj.');
  assert.equal(renderedText(text, 'en'), text);
});
