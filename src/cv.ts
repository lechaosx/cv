import { z } from 'zod';

const withoutEmptyRows = (value: unknown) => Array.isArray(value)
  ? value.filter(row => row === null || typeof row !== 'object' || Array.isArray(row) || !Object.values(row).every(field =>
    field === null || field === undefined || (typeof field === 'string' && !field.trim()) || (Array.isArray(field) && field.length === 0)))
  : value;
const withoutEmptyStrings = (value: unknown) => Array.isArray(value)
  ? value.filter(item => typeof item !== 'string' || item.trim())
  : value;

const text = z.string().default('');
const year = z.string().regex(/^(?:[1-9][0-9]{3})?$/, 'Use a four-digit year').default('');
const month = z.string().regex(/^(?:0[1-9]|1[0-2])?$/, 'Use 01–12').default('');

export const timelineSchema = z.strictObject({
  organization: z.string().trim().min(1),
  department: text,
  title: z.string().trim().min(1),
  start_month: month,
  start_year: year,
  end_month: month,
  end_year: year,
  description: text,
  badges: z.preprocess(withoutEmptyStrings, z.array(z.string().trim().min(1)).default([])),
}).superRefine((entry, context) => {
  for (const side of ['start', 'end'] as const) {
    if (entry[`${side}_month`] && !entry[`${side}_year`]) {
      context.addIssue({ code: 'custom', path: [`${side}_year`], message: 'A month needs a year' });
    }
  }
  if (entry.start_year && entry.end_year) {
    const earliestStart = Number(entry.start_year) * 12 + Number(entry.start_month || '01');
    const latestEnd = Number(entry.end_year) * 12 + Number(entry.end_month || '12');
    if (latestEnd < earliestStart) context.addIssue({ code: 'custom', path: ['end_year'], message: 'End must follow start' });
  }
});

const color = z.union([z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use a hex color'), z.literal('')]);

export const cvSchema = z.strictObject({
  language: z.enum(['en', 'cs']),
  title_before_name: text,
  name: z.string().trim().min(1),
  title_after_name: text,
  position: text,
  phone: z.string().regex(/^[+0-9 ()-]*$/, 'Use an international telephone number').default(''),
  email: z.union([z.email(), z.literal('')]).default(''),
  location: text,
  photo: z.union([z.string().regex(/^\/uploads\/[^/\\?#%]+\.(?:avif|gif|jpe?g|png|webp|svg)$/i, 'Choose a local image from uploads'), z.literal('')]).default(''),
  description: text,
  interests: z.preprocess(withoutEmptyStrings, z.array(z.string().trim().min(1)).default([])),
  links: z.preprocess(withoutEmptyRows, z.array(z.strictObject({
    label: z.string().trim().min(1),
    url: z.url({ protocol: /^https?$/ }),
    icon: z.enum(['website', 'github', 'linkedin']).default('website'),
  })).default([])),
  experience: z.preprocess(withoutEmptyRows, z.array(timelineSchema).default([])),
  education: z.preprocess(withoutEmptyRows, z.array(timelineSchema).default([])),
  theme: z.strictObject({ dark: color.optional(), light: color.optional() }).default({}),
});

export type CV = z.infer<typeof cvSchema>;
export type TimelineEntry = z.infer<typeof timelineSchema>;
export const formatDate = (month: string, year: string): string => year ? `${month ? `${month}/` : ''}${year}` : '';
