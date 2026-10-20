import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cvSchema, dateTime, dateRange, localizeCV } from '../src/cv.ts';

const cv = () => ({
  name: 'Example Person', email: 'example@example.org', photo: '/uploads/portrait.jpg',
  position_en: 'Engineer', position_cs: 'Vývojář',
  links: [{ label: 'Portfolio', url: 'https://example.org', icon: 'website' }],
  experience: [{ organization_en: 'Studio', organization_cs: 'Studio', title_en: 'Engineer', title_cs: 'Vývojář', from: '1/2020' }],
  education: [], theme: { dark: '#123456' },
});

test('normalizes month/year dates without coercing types', () => {
  assert.equal(cvSchema.parse(cv()).experience[0]?.from, '01/2020');
});

test('formats dates and ranges without inventing education starts', () => {
  assert.equal(dateTime('03/2023'), '2023-03');
  assert.equal(dateTime('2023'), '2023');
  assert.equal(dateRange('03/2023', '03/2023', 'present'), '03/2023');
  assert.equal(dateRange('2023', '', 'present'), '2023 – present');
  assert.equal(dateRange('', '2022', 'present'), '2022');
  assert.equal(dateRange('', '', 'present'), '');
});

for (const [label, mutate] of [
  ['numeric dates', (value: any) => { value.experience[0].from = 2020; }],
  ['invalid months', (value: any) => { value.experience[0].from = '13/2020'; }],
  ['month without year', (value: any) => { value.experience[0].from = '03'; }],
  ['backwards dates', (value: any) => { value.experience[0].to = '2019'; }],
  ['script links', (value: any) => { value.links[0].url = 'javascript:alert(1)'; }],
  ['remote photos', (value: any) => { value.photo = 'https://example.org/portrait.jpg'; }],
  ['escaping photo paths', (value: any) => { value.photo = '/uploads/../secret.jpg'; }],
  ['CSS injection', (value: any) => { value.theme.dark = 'red; background:url(https://example.org)'; }],
  ['unknown theme keys', (value: any) => { value.theme.arbitrary = '#123456'; }],
  ['palette references', (value: any) => { value.theme.dark = '--dark'; }],
  ['invalid email', (value: any) => { value.email = 'not an email'; }],
] as const) {
  test(`rejects ${label}`, () => {
    const value = cv();
    mutate(value);
    assert.equal(cvSchema.safeParse(value).success, false);
  });
}

test('accepts optional form fields cleared to empty strings', () => {
  const value = { ...cv(), title_before_name: '', phone: '', photo: '', description_en: '', description_cs: '', interests: [], links: [], theme: {} };
  assert.equal(cvSchema.safeParse(value).success, true);
});

test('clearing CMS theme colors restores stylesheet defaults', () => {
  assert.equal(cvSchema.safeParse({ ...cv(), theme: { dark: '', light: '' } }).success, true);
});

test('accepts three and six digit CMS colors', () => {
  assert.equal(cvSchema.safeParse({ ...cv(), theme: { dark: '#abc', light: '#AABBCC' } }).success, true);
});

test('ignores untouched CMS object rows without discarding partial entries', () => {
  const value = cv();
  const blank = { organization_en: '', organization_cs: '', title_en: '', title_cs: '', from: '', to: '', badges: [] };
  const normalized = cvSchema.parse({ ...value, experience: [{}, blank, ...value.experience], education: [{}], interests: [{}, { label_en: '', label_cs: '' }], links: [{}, { label: '', url: '', icon: '' }, ...value.links] });
  assert.equal(normalized.experience.length, 1);
  assert.equal(normalized.education.length, 0);
  assert.equal(normalized.interests.length, 0);
  assert.equal(normalized.links.length, 1);
  assert.equal(cvSchema.safeParse({ ...value, experience: [{ title_en: 'Engineer' }] }).success, false);
  assert.equal(cvSchema.safeParse({ ...value, links: [{ label: 'Portfolio', url: '' }] }).success, false);
});

test('ignores blank CMS skill rows', () => {
  const normalized = cvSchema.parse({ ...cv(), experience: [{ ...cv().experience[0], badges: ['', ' ', 'TypeScript'] }] });
  assert.deepEqual(normalized.experience[0]?.badges, ['TypeScript']);
});

test('localizes prose while retaining shared facts and source text', () => {
  const data = cvSchema.parse(cv());
  const localized = localizeCV(data, 'cs');
  assert.equal(localized.position, 'Vývojář');
  assert.equal(localized.experience[0]?.title, 'Vývojář');
  assert.equal(localized.experience[0]?.from, '01/2020');
  assert.equal(localized.name, data.name);
  assert.equal(data.position_en, 'Engineer');
});
