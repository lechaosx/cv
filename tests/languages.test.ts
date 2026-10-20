import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cvSchema } from '../src/cv.ts';

const bilingual = () => ({
  name: 'Example Person', position_en: 'Engineer', position_cs: 'Vývojář',
  description_en: 'About me', description_cs: 'O mně',
  interests: [{ label_en: 'Learning', label_cs: 'Vzdělávání' }],
  experience: [{ organization_en: 'University', organization_cs: 'Univerzita', title_en: 'Engineer', title_cs: 'Vývojář', from: '3/2023', to: '2024' }],
});

test('accepts bilingual prose and year or month/year dates', () => {
  const result = cvSchema.safeParse(bilingual());
  assert.equal(result.success, true, JSON.stringify(result.error));
  if (result.success) assert.equal(result.data.experience[0]?.from, '03/2023');
});

test('requires both translations of filled optional prose', () => {
  assert.equal(cvSchema.safeParse({ ...bilingual(), description_cs: '' }).success, false);
  assert.equal(cvSchema.safeParse({ ...bilingual(), experience: [{ ...bilingual().experience[0], department_en: 'Faculty' }] }).success, false);
});

test('rejects incomplete interest translations and invalid date intervals', () => {
  assert.equal(cvSchema.safeParse({ ...bilingual(), interests: [{ label_en: 'Learning' }] }).success, false);
  for (const [from, to] of [['13/2023', '2024'], ['2025', '2024'], ['02/2024', '01/2024'], [2023, '2024']]) {
    assert.equal(cvSchema.safeParse({ ...bilingual(), experience: [{ ...bilingual().experience[0], from, to }] }).success, false);
  }
});

test('preserves end-only education dates without inferring a start', () => {
  const result = cvSchema.safeParse({ ...bilingual(), education: [{ organization_en: 'University', organization_cs: 'Univerzita', title_en: 'Degree', title_cs: 'Titul', to: '2022' }] });
  assert.equal(result.success, true, JSON.stringify(result.error));
  if (result.success) assert.equal(result.data.education[0]?.from, '');
});
