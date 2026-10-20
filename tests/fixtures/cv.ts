import { cvSchema } from '../../src/cv.ts';

export const cv = cvSchema.parse({
  name: 'Example Person', title_before_name: 'Ing.',
  position_en: 'Software Engineer', position_cs: 'Softwarový inženýr',
  phone: '+420 123 456 789', email: 'person@example.org', location: 'Brno',
  description_en: 'An engineer who builds useful software and helps teams solve difficult problems. Clear communication and thoughtful technical decisions keep the work focused on what people need. '.repeat(2).trim(),
  description_cs: 'Vývojář, který vytváří užitečný software a pomáhá týmům řešit složité problémy. Jasná komunikace a promyšlená technická rozhodnutí udržují práci zaměřenou na potřeby lidí.',
  interests: [{ label_en: 'Learning', label_cs: 'Vzdělávání' }, { label_en: 'Running', label_cs: 'Běh' }],
  links: [
    { label: 'Portfolio', url: 'https://example.org', icon: 'website' },
    { label: 'Source code', url: 'https://github.com/example', icon: 'github' },
  ],
  experience: [
    { organization_en: 'Current Studio', organization_cs: 'Současné studio', title_en: 'Engineer', title_cs: 'Vývojář', from: '03/2023', description_en: 'Designing and maintaining software with a small team. Investigating difficult problems, improving everyday development practices, and explaining trade-offs to colleagues.', description_cs: 'Návrh a údržba softwaru v malém týmu. Řešení složitých problémů, zlepšování každodenních postupů vývoje a vysvětlování kompromisů kolegům.', badges: ['TypeScript', 'Linux', 'C++', 'Git'] },
    { organization_en: 'Previous Studio', organization_cs: 'Předchozí studio', title_en: 'Developer', title_cs: 'Programátor', from: '2020', to: '2022', description_en: 'Built applications and worked with customers to understand their needs.', description_cs: 'Vývoj aplikací a spolupráce se zákazníky při zjišťování jejich potřeb.' },
  ],
  education: [{ organization_en: 'Example University', organization_cs: 'Ukázková univerzita', department_en: 'Faculty of Engineering', department_cs: 'Technická fakulta', title_en: "Master's Degree", title_cs: 'Magisterský titul', to: '2020', description_en: 'Research into practical algorithms and data structures.', description_cs: 'Výzkum praktických algoritmů a datových struktur.' }],
});
