import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse, stringify } from 'yaml';
import { cvSchema } from '../src/cv.ts';

type Field = { name: string; type: string; list?: boolean; fields?: Field[]; options?: { values: string[] }; pattern?: { regex: string } };
const config = parse(readFileSync('.pages.yml', 'utf8'));
const form = config.content[0];
const content = parse(readFileSync(form.path, 'utf8'));

function formValues(fields: Field[], value: Record<string, any>): Record<string, any> {
  return Object.fromEntries(fields.filter(field => field.name in value).map(field => {
    const current = value[field.name];
    return [field.name, field.fields
      ? field.list ? current.map((row: Record<string, any>) => formValues(field.fields!, row)) : formValues(field.fields, current)
      : current];
  }));
}

function completeForm(fields: Field[]): Record<string, any> {
  return Object.fromEntries(fields.map(field => {
    let value: any;
    if (field.fields) value = completeForm(field.fields);
    else if (field.type === 'select') value = field.options!.values[0];
    else if (field.name.endsWith('_month')) value = '03';
    else if (field.name.endsWith('_year')) value = '2023';
    else if (field.name === 'email') value = 'person@example.org';
    else if (field.name === 'phone') value = '+420 123 456 789';
    else if (field.type === 'image') value = `${config.media.output}/portrait.jpg`;
    else if (field.name === 'url') value = 'https://example.org';
    else if (field.pattern?.regex.includes('#')) value = '#123456';
    else value = 'Example';
    return [field.name, field.list ? [value] : value];
  }));
}

test('CMS form preserves all published content through YAML saving', () => {
  const saved = parse(stringify(formValues(form.fields, content)));
  assert.deepEqual(cvSchema.parse(saved), cvSchema.parse(content));
});

test('a fully populated CMS form produces valid content', () => {
  assert.equal(cvSchema.safeParse(parse(stringify(completeForm(form.fields)))).success, true);
});

test('all CMS select choices are accepted by the content schema', () => {
  const fields = form.fields as Field[];
  for (const field of fields.filter(field => field.type === 'select')) {
    for (const option of field.options!.values) {
      assert.equal(cvSchema.safeParse({ ...completeForm(fields), [field.name]: option }).success, true);
    }
  }
  const links = fields.find(field => field.name === 'links')!.fields!;
  for (const icon of links.find(field => field.name === 'icon')!.options!.values) {
    assert.equal(cvSchema.safeParse({ ...completeForm(fields), links: [{ label: 'Portfolio', url: 'https://example.org', icon }] }).success, true);
  }
});
