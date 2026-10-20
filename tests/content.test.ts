import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cvSchema, formatDate } from '../src/cv.ts';

const cv = () => ({
  name: 'Example Person', language: 'en', email: 'example@example.org',
  photo: '/uploads/portrait.jpg',
  links: [{ label: 'Portfolio', url: 'https://example.org', icon: 'website' }],
  experience: [{ organization: 'Studio', title: 'Engineer', start_year: '2020', start_month: '01' }],
  education: [], theme: { dark: '#123456' },
});

test('accepts year and optional month dates without coercion', () => {
  const result = cvSchema.parse(cv());
  assert.equal(result.experience[0]?.start_month, '01');
});

test('formats month/year and year-only dates', () => {
  assert.equal(formatDate('03', '2023'), '03/2023');
  assert.equal(formatDate('', '2023'), '2023');
  assert.equal(formatDate('', ''), '');
});

for (const [label, mutate] of [
  ['numeric years', (value: any) => { value.experience[0].start_year = 2020; }],
  ['invalid months', (value: any) => { value.experience[0].start_month = '13'; }],
  ['month without year', (value: any) => { delete value.experience[0].start_year; }],
  ['backwards dates', (value: any) => { value.experience[0].end_year = '2019'; }],
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
  const value = { ...cv(), title_before_name: '', phone: '', photo: '', description: '', interests: [], links: [], theme: {} };
  assert.equal(cvSchema.safeParse(value).success, true);
});

test('clearing CMS theme colors restores stylesheet defaults', () => {
  const value = { ...cv(), theme: { dark: '', light: '' } };
  assert.equal(cvSchema.safeParse(value).success, true);
});

test('accepts three and six digit CMS colors', () => {
  assert.equal(cvSchema.safeParse({ ...cv(), theme: { dark: '#abc', light: '#AABBCC' } }).success, true);
});

test('ignores untouched CMS object rows without discarding partial entries', () => {
  const value = cv();
  const blank = { organization: '', title: '', department: '', start_year: '', start_month: '', end_year: '', end_month: '', description: '', badges: [] };
  const normalized = cvSchema.parse({ ...value, experience: [{}, blank, ...value.experience], education: [{}], links: [{}, { label: '', url: '', icon: '' }, ...value.links] });
  assert.equal(normalized.experience.length, 1);
  assert.equal(normalized.education.length, 0);
  assert.equal(normalized.links.length, 1);
  assert.equal(cvSchema.safeParse({ ...value, experience: [{ title: 'Engineer' }] }).success, false);
  assert.equal(cvSchema.safeParse({ ...value, links: [{ label: 'Portfolio', url: '' }] }).success, false);
});

test('ignores blank CMS string rows in interests and skills', () => {
  const value = cv();
  const normalized = cvSchema.parse({ ...value, interests: ['', ' ', 'Hiking'], experience: [{ ...value.experience[0], badges: ['', ' ', 'TypeScript'] }] });
  assert.deepEqual(normalized.interests, ['Hiking']);
  assert.deepEqual(normalized.experience[0]?.badges, ['TypeScript']);
});
