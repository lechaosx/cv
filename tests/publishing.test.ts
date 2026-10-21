import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cvSchema } from '../src/cv.ts';
import { cvMarkdown, llmsIndex, fullExport, pageMetadata, structuredData } from '../src/publishing.ts';
import { cv } from './fixtures/cv.ts';

const site = new URL('https://cv.example.org');

test('Markdown exports source facts in displayed order and language, including open and completion dates', () => {
  const en = cvMarkdown(cv, 'en', site);
  const cs = cvMarkdown(cv, 'cs', site);
  assert.ok(en.startsWith('# Ing. Example Person\n'));
  assert.ok(en.includes(cv.description_en));
  assert.ok(en.includes('03/2023 – present'));
  assert.ok(cs.includes('03/2023 – současnost'));
  assert.ok(en.indexOf('Current Studio') < en.indexOf('Previous Studio'));
  assert.ok(en.includes("Master's Degree"));
  assert.ok(en.includes('2020'));
  assert.ok(!en.includes('2020 – present'));
  assert.ok(en.includes('[+420 123 456 789](tel:+420123456789)'));
  assert.ok(en.includes('[person@example.org](mailto:person@example.org)'));
  assert.ok(en.includes('[github.com/example](https://github.com/example)'));
  assert.ok(cs.includes('## Pracovní zkušenosti'));
  assert.ok(!cs.includes('Current Studio'));
  assert.ok(!cs.includes('\u00a0'));
});

test('Markdown preserves authored prose formatting while escaping plain factual fields', () => {
  const special = cvSchema.parse({ name: '[Name] <script>', description_en: '# heading *text*', description_cs: '# nadpis *text*', links: [{ label: 'A [link]', url: 'https://example.org/project)notes' }] });
  const text = cvMarkdown(special, 'en', site);
  assert.ok(text.includes('\\[Name\\] &lt;script&gt;'));
  assert.ok(text.includes('# heading *text*'));
  assert.ok(text.includes('[A \\[link\\]](https://example.org/project%29notes)'));
});

test('Markdown link destinations preserve UTF-8 encoding of Unicode whitespace', () => {
  const data = cvSchema.parse({ name: 'Person', links: [{ label: 'Website', url: 'https://example.org/space\u00a0here' }] });
  assert.ok(cvMarkdown(data, 'en', site).includes('[Website](https://example.org/space%C2%A0here)'));
});

test('LLM discovery links both canonical languages and clean Markdown, with a full bilingual export', () => {
  const index = llmsIndex(cv, site);
  for (const language of ['en', 'cs']) {
    assert.ok(index.includes(`https://cv.example.org/${language}/`));
    assert.ok(index.includes(`https://cv.example.org/${language}/index.md`));
  }
  assert.ok(index.includes('https://cv.example.org/llms-full.txt'));
  const full = fullExport(cv, site);
  assert.ok(full.includes('English (en)'));
  assert.ok(full.includes('Čeština (cs)'));
  assert.ok(full.includes(cv.description_en));
  assert.ok(full.includes(cv.description_cs));
});

test('localized search and share metadata uses existing content and the configured origin', () => {
  const en = pageMetadata(cv, 'en', site);
  const cs = pageMetadata(cv, 'cs', site);
  assert.equal(en.title, 'Ing. Example Person | CV');
  assert.equal(cs.title, 'Ing. Example Person | Životopis');
  assert.equal(en.description, 'An engineer who builds useful software and helps teams solve difficult problems.');
  assert.equal(cs.description, cv.description_cs);
  assert.equal(en.url, 'https://cv.example.org/en/');
  assert.equal(en.image, undefined);
  assert.equal(pageMetadata(cvSchema.parse({ name: 'Person', photo: '/uploads/photo.jpg' }), 'cs', site).image, 'https://cv.example.org/uploads/photo.jpg');
});

test('structured identity stays stable across locales and does not infer employers, languages or credentials', () => {
  const en = JSON.parse(structuredData(cv, 'en', site));
  const cs = JSON.parse(structuredData(cv, 'cs', site));
  const person = en['@graph'].find((node: any) => node['@type'] === 'Person');
  const translated = cs['@graph'].find((node: any) => node['@type'] === 'Person');
  const page = cs['@graph'].find((node: any) => node['@type'] === 'ProfilePage');
  assert.equal(person['@id'], 'https://cv.example.org/#person');
  assert.equal(translated['@id'], person['@id']);
  assert.equal(page.mainEntity['@id'], person['@id']);
  assert.equal(page.inLanguage, 'cs');
  assert.equal(person.honorificPrefix, 'Ing.');
  assert.equal(person.email, cv.email);
  assert.equal(person.telephone, cv.phone);
  assert.deepEqual(person.sameAs, cv.links.map(link => link.url));
  for (const key of ['worksFor', 'knowsLanguage', 'hasCredential', 'alumniOf']) assert.equal(person[key], undefined);
  const empty = JSON.parse(structuredData(cvSchema.parse({ name: 'Name </script><script>alert(1)</script>' }), 'en', site));
  assert.equal(empty['@graph'][0].name, 'Name </script><script>alert(1)</script>');
  assert.equal(empty['@graph'][0].telephone, undefined);
  assert.equal(empty['@graph'][0].honorificPrefix, undefined);
  assert.ok(!structuredData(cvSchema.parse({ name: '</script>' }), 'en', site).includes('<'));
});

test('prose exports preserve paragraphs, achievement lists, emphasis and links', () => {
  const description = 'Building **useful** software.\n\n- Delivered a migration.\n- Read the [publication](https://example.org/research).';
  const data = cvSchema.parse({ ...cv, description_en: description, description_cs: description,
    experience: [{ ...cv.experience[0], description_en: description, description_cs: description }] });
  const exported = cvMarkdown(data, 'en', site);
  assert.equal(exported.split(description).length - 1, 2);
  assert.ok(fullExport(data, site).includes(description));
});

test('search and structured descriptions use a plain first paragraph of Markdown', () => {
  const data = cvSchema.parse({ ...cv, description_en: 'Building **useful** software with [teams](https://example.org).\n\nMy longer approach.\n\n- An achievement.', description_cs: 'Vývoj **užitečného** softwaru.\n\nDalší odstavec.' });
  assert.equal(pageMetadata(data, 'en', site).description, 'Building useful software with teams.');
  assert.equal(JSON.parse(structuredData(data, 'en', site))['@graph'][0].description, 'Building useful software with teams.');
  assert.equal(pageMetadata(data, 'cs', site).description, 'Vývoj užitečného softwaru.');
});
