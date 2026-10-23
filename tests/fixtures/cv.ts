import { cvSchema } from '../../src/cv.ts';

export const cv = cvSchema.parse({
  name: 'Example Person', title_before_name: 'Ing.',
  position_en: 'Software Engineer', position_cs: 'Softwarový inženýr',
  headline_en: 'Making complex software understandable', headline_cs: 'Srozumitelný složitý software',
  phone: '+420 123 456 789', email: 'person@example.org', location: 'Brno',
  description_en: 'An engineer who builds **useful software** and helps teams solve difficult problems.\n\nClear communication and thoughtful decisions keep work focused on what people need.',
  description_cs: 'Vývojář, který vytváří užitečný software a pomáhá týmům řešit složité problémy. Jasná komunikace a promyšlená technická rozhodnutí udržují práci zaměřenou na potřeby lidí.',
  interests: [{ label_en: 'Learning', label_cs: 'Vzdělávání' }, { label_en: 'Running', label_cs: 'Běh' }],
  projects: [
    { title: 'Example Editor', url: 'https://example.org/editor', description_en: 'A browser editor for example charts.', description_cs: 'Prohlížečový editor ukázkových grafů.' },
    { title: 'Example Library', description_en: 'A small C++ library.', description_cs: 'Malá knihovna v C++.' },
  ],
  publications: [
    { title: 'A Study of Examples', url: 'https://doi.org/10.1000/example', description_en: 'Example Journal, 2022, coauthor', description_cs: 'Example Journal, 2022, spoluautor' },
  ],
  links: [
    { label: 'Portfolio', url: 'https://example.org', icon: 'website' },
    { label: 'github.com/example', url: 'https://github.com/example', icon: 'github' },
  ],
  experience: [
    { organization_en: 'Current Studio', organization_cs: 'Současné studio', title_en: 'Engineer', title_cs: 'Vývojář', from: '03/2023', description_en: 'Designing and maintaining software with a small team.\n\n- Investigating **difficult problems**.\n- Read the [research](https://example.org/research).\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n![remote image](https://example.org/image.png)', description_cs: 'Návrh a údržba softwaru v malém týmu.\n\n- Práce **s kolegy**.\n- Podklady [k výzkumu](https://example.org/a/b).', badges: ['TypeScript', 'Linux', 'C++', 'Git'] },
    { organization_en: 'Previous Studio', organization_cs: 'Předchozí studio', title_en: 'Developer', title_cs: 'Programátor', from: '2020', to: '2022', description_en: 'Built applications and worked with customers to understand their needs.', description_cs: 'Vývoj aplikací a spolupráce se zákazníky při zjišťování jejich potřeb.' },
  ],
  education: [{ organization_en: 'Example University', organization_cs: 'Ukázková univerzita', department_en: 'Faculty of Engineering', department_cs: 'Technická fakulta', title_en: "Master's Degree", title_cs: 'Magisterský titul', to: '2020', description_en: 'Research into practical algorithms and data structures.', description_cs: 'Výzkum praktických algoritmů a datových struktur.' }],
});
