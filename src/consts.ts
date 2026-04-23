export const SITE = {
  url: 'https://mustiere.fr',
  name: 'Gabriel Mustière',
  title: 'Gabriel Mustière — CTO freelance à Nantes',
  description:
    'CTO freelance basé à Nantes. 15 ans d’expérience en architecture, IA, leadership technique et accompagnement de produits au long cours.',
  locale: 'fr-FR',
  author: {
    name: 'Gabriel Mustière',
    email: 'gmustiere@technao.net',
    city: 'Nantes',
    country: 'France',
    jobTitle: 'CTO freelance',
    github: 'https://github.com/gmustiere',
    linkedin: 'https://www.linkedin.com/in/gmustiere/',
  },
  nav: [
    { href: '/', label: 'Accueil' },
    { href: '/blog', label: 'Blog' },
  ],
  ogImage: '/og-default.png',
} as const;

export type Site = typeof SITE;
