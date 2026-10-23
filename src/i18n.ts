import type { Language } from './cv';

export const labels = {
  en: { cv: 'CV', downloadPDF: 'Download PDF', about: 'About Me', interests: 'Interests', projects: 'Open Source', publications: 'Publications', connect: 'Connect', experience: 'Work Experience', education: 'Education', present: 'present', switchToLight: 'Switch to light theme', switchToDark: 'Switch to dark theme', controls: 'Page settings' },
  cs: { cv: 'Životopis', downloadPDF: 'Stáhnout PDF', about: 'O mně', interests: 'Zájmy', projects: 'Open source', publications: 'Publikace', connect: 'Kontakty', experience: 'Pracovní zkušenosti', education: 'Vzdělání', present: 'současnost', switchToLight: 'Přepnout na světlý vzhled', switchToDark: 'Přepnout na tmavý vzhled', controls: 'Nastavení stránky' },
};

export function preferredLanguage(saved: string | null, languages: readonly string[]): Language {
  if (saved === 'en' || saved === 'cs') return saved;
  for (const preference of languages) {
    const language = preference.toLowerCase().split('-')[0];
    if (language === 'en' || language === 'cs') return language;
  }
  return 'en';
}

export function renderedText(value: string, language: Language) {
  return language === 'cs' ? value.replace(/(?<![\p{L}\p{M}\p{N}/-])([vszkouai])\s+/giu, '$1\u00a0') : value;
}
