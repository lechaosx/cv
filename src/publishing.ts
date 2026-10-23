import { dateRange, localizeCV, type CV, type Language } from './cv.ts';
import { proseSummary } from './prose.ts';
import { labels } from './i18n.ts';

const fullName = (cv: CV) => [cv.title_before_name, cv.name, cv.title_after_name].filter(Boolean).join(' ');
const markdown = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/[\\`*_{}\[\]()#!|]/g, '\\$&').replace(/^(\s*)([-+]|\d+[.)])(?=\s)/gm, '$1\\$2');
const link = (label: string, url: string) => `[${markdown(label)}](${url.replace(/[()<>\s]/g, character => encodeURIComponent(character).replace(/\(/g, '%28').replace(/\)/g, '%29'))})`;

export function pageMetadata(cv: CV, language: Language, site: URL) {
  const data = localizeCV(cv, language);
  return {
    title: `${fullName(cv)} | ${labels[language].cv}`,
    description: proseSummary(data.description) || [fullName(cv), data.position].filter(Boolean).join(' — '),
    url: new URL(`/${language}/`, site).href,
    image: cv.photo && !cv.photo.toLowerCase().endsWith('.svg') ? new URL(cv.photo, site).href : undefined,
  };
}

export function structuredData(cv: CV, language: Language, site: URL) {
  const meta = pageMetadata(cv, language, site);
  const personId = new URL('/#person', site).href;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'Person', '@id': personId,
      name: cv.name, url: new URL('/', site).href,
      honorificPrefix: cv.title_before_name || undefined,
      honorificSuffix: cv.title_after_name || undefined,
      jobTitle: cv[`position_${language}`] || undefined,
      description: proseSummary(cv[`description_${language}`]) || undefined,
      email: cv.email || undefined, telephone: cv.phone || undefined,
      image: cv.photo ? new URL(cv.photo, site).href : undefined,
      sameAs: cv.links.length ? cv.links.map(link => link.url) : undefined,
    }, {
      '@type': 'ProfilePage', '@id': `${meta.url}#profile`, url: meta.url,
      name: meta.title, description: meta.description, inLanguage: language,
      mainEntity: { '@id': personId },
    }],
  }).replace(/</g, '\\u003c');
}

export function cvMarkdown(cv: CV, language: Language, site: URL): string {
  const data = localizeCV(cv, language);
  const ui = labels[language];
  const lines = [`# ${markdown(fullName(cv))}`, '', data.position && markdown(data.position), '', data.headline && markdown(data.headline), '',
    link(ui.cv, new URL(`/${language}/`, site).href), '',
    data.location && markdown(data.location),
    data.phone && link(data.phone, `tel:${data.phone.replace(/[ ()-]/g, '')}`),
    data.email && link(data.email, `mailto:${data.email}`),
  ];
  if (data.description) lines.push('', `## ${ui.about}`, '', data.description);
  if (data.interests.length) lines.push('', `## ${ui.interests}`, '', ...data.interests.map(interest => `- ${markdown(interest)}`));
  for (const [heading, entries] of [[ui.experience, data.experience], [ui.education, data.education]] as const) {
    if (!entries.length) continue;
    lines.push('', `## ${heading}`);
    for (const entry of entries) {
      lines.push('', `### ${markdown(entry.organization)} — ${markdown(entry.title)}`);
      if (entry.department) lines.push('', markdown(entry.department));
      const period = dateRange(entry.from, entry.to, ui.present);
      if (period) lines.push('', period);
      if (entry.badges.length) lines.push('', entry.badges.map(markdown).join(', '));
      if (entry.description) lines.push('', entry.description);
    }
  }
  for (const [heading, entries] of [[ui.projects, data.projects], [ui.publications, data.publications]] as const) {
    if (entries.length) lines.push('', `## ${heading}`, '', ...entries.map(entry =>
      `- ${entry.url ? link(entry.title, entry.url) : markdown(entry.title)}${entry.description ? ` — ${markdown(entry.description)}` : ''}`));
  }
  if (data.links.length) lines.push('', `## ${ui.connect}`, '', ...data.links.map(item => `- ${link(item.label, item.url)}`));
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

export function llmsIndex(cv: CV, site: URL): string {
  return `# ${markdown(fullName(cv))}\n\n> English and Czech CV / Životopis v češtině a angličtině.\n\n## CV\n\n${(['en', 'cs'] as const).map(language => {
    const name = language === 'en' ? 'English (en)' : 'Čeština (cs)';
    return `- ${link(name, new URL(`/${language}/`, site).href)}\n- ${link(`${name} — Markdown`, new URL(`/${language}/index.md`, site).href)}`;
  }).join('\n')}\n\n## Full text\n\n- ${link('Full bilingual CV', new URL('/llms-full.txt', site).href)}\n`;
}

export function fullExport(cv: CV, site: URL): string {
  return `# English (en)\n\n${cvMarkdown(cv, 'en', site)}\n---\n\n# Čeština (cs)\n\n${cvMarkdown(cv, 'cs', site)}`;
}
