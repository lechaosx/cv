import { z } from 'zod';

const withoutEmptyRows = (value: unknown) => Array.isArray(value)
  ? value.filter(row => row === null || typeof row !== 'object' || Array.isArray(row) || !Object.values(row).every(field =>
    field === null || field === undefined || (typeof field === 'string' && !field.trim()) || (Array.isArray(field) && field.length === 0)))
  : value;
const withoutEmptyStrings = (value: unknown) => Array.isArray(value)
  ? value.filter(item => typeof item !== 'string' || item.trim())
  : value;
const text = z.string().default('');
const requiredText = z.string().trim().min(1);
const date = z.string().regex(/^(?:[1-9][0-9]{3}|(?:0?[1-9]|1[0-2])\/[1-9][0-9]{3})?$/, 'Use YYYY or M/YYYY').default('')
  .transform(value => value.includes('/') ? value.padStart(7, '0') : value);

function paired(fields: string[]) {
  return (value: Record<string, unknown>, context: z.RefinementCtx) => {
    for (const field of fields) {
      const en = String(value[`${field}_en`] ?? '').trim();
      const cs = String(value[`${field}_cs`] ?? '').trim();
      if (Boolean(en) !== Boolean(cs)) context.addIssue({ code: 'custom', path: [`${field}_${en ? 'cs' : 'en'}`], message: 'Fill both English and Czech, or leave both empty' });
    }
  };
}

export const timelineSchema = z.strictObject({
  organization_en: requiredText, organization_cs: requiredText,
  department_en: text, department_cs: text,
  title_en: requiredText, title_cs: requiredText,
  from: date, to: date,
  description_en: text, description_cs: text,
  badges: z.preprocess(withoutEmptyStrings, z.array(requiredText).default([])),
}).superRefine(paired(['department', 'description'])).superRefine((entry, context) => {
  const parts = (value: string, end: boolean) => {
    const [first, second] = value.split('/');
    return second ? Number(second) * 12 + Number(first) : Number(first) * 12 + (end ? 12 : 1);
  };
  if (entry.from && entry.to && parts(entry.to, true) < parts(entry.from, false)) {
    context.addIssue({ code: 'custom', path: ['to'], message: 'End must follow start' });
  }
});
const color = z.union([z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use a hex color'), z.literal('')]);
export const cvSchema = z.strictObject({
  title_before_name: text,
  name: requiredText,
  title_after_name: text,
  position_en: text, position_cs: text,
  headline_en: text, headline_cs: text,
  phone: z.string().regex(/^[+0-9 ()-]*$/, 'Use an international telephone number').default(''),
  email: z.union([z.email(), z.literal('')]).default(''),
  location: text,
  photo: z.union([z.string().regex(/^\/uploads\/[^/\\?#%]+\.(?:avif|gif|jpe?g|png|webp|svg)$/i, 'Choose a local image from uploads'), z.literal('')]).default(''),
  description_en: text, description_cs: text,
  interests: z.preprocess(withoutEmptyRows, z.array(z.strictObject({ label_en: requiredText, label_cs: requiredText })).default([])),
  links: z.preprocess(withoutEmptyRows, z.array(z.strictObject({
    label: requiredText,
    url: z.url({ protocol: /^https?$/ }),
    icon: z.enum(['website', 'github', 'linkedin']).default('website'),
  })).default([])),
  experience: z.preprocess(withoutEmptyRows, z.array(timelineSchema).default([])),
  education: z.preprocess(withoutEmptyRows, z.array(timelineSchema).default([])),
  theme: z.strictObject({ dark: color.optional(), light: color.optional() }).default({}),
}).superRefine(paired(['position', 'headline', 'description']));

export type CV = z.infer<typeof cvSchema>;
export type TimelineEntry = z.infer<typeof timelineSchema>;
export type Language = 'en' | 'cs';
export const dateTime = (value: string) => value.includes('/') ? value.split('/').reverse().join('-') : value;
export const dateRange = (from: string, to: string, present: string) => !from ? to : from === to ? from : `${from} – ${to || present}`;
export function localizeCV(data: CV, language: Language) {
  const timeline = (entry: TimelineEntry) => ({ ...entry,
    organization: entry[`organization_${language}`], department: entry[`department_${language}`],
    title: entry[`title_${language}`], description: entry[`description_${language}`],
  });
  return { ...data, language, headline: data[`headline_${language}`], position: data[`position_${language}`], description: data[`description_${language}`],
    interests: data.interests.map(interest => interest[`label_${language}`]),
    experience: data.experience.map(timeline), education: data.education.map(timeline),
  };
}
export type LocalizedCV = ReturnType<typeof localizeCV>;
