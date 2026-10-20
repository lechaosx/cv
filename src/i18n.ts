import type { Language } from './cv';

export const labels = {
  en: { cv: 'CV', about: 'About Me', interests: 'Interests', connect: 'Connect', experience: 'Work Experience', education: 'Education', present: 'present', language: 'Language', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark', controls: 'Page settings' },
  cs: { cv: 'Životopis', about: 'O mně', interests: 'Zájmy', connect: 'Kontakty', experience: 'Pracovní zkušenosti', education: 'Vzdělání', present: 'současnost', language: 'Jazyk', theme: 'Vzhled', system: 'Podle systému', light: 'Světlý', dark: 'Tmavý', controls: 'Nastavení stránky' },
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
