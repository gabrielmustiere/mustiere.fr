export const SITE = {
  url: 'https://mustiere.fr',
  name: 'Gabriel Mustiere',
  title: 'Gabriel Mustiere — CTO freelance à Nantes',
  description:
    'CTO freelance basé à Nantes. 14 ans dans la tech, CTO depuis 2017. Architecture, leadership technique, SaaS & e-commerce.',
  locale: 'fr-FR',
  author: {
    name: 'Gabriel Mustiere',
    email: 'mustiere.gabriel@gmail.com',
    city: 'Nantes',
    country: 'France',
    jobTitle: 'CTO freelance',
    github: 'https://github.com/gabrielmustiere',
    linkedin: 'https://www.linkedin.com/in/gabrielmustiere/',
  },
  nav: [
    { href: '/', label: 'Accueil' },
    { href: '/blog', label: 'Blog' },
  ],
  ogImage: '/og-default.png',
} as const;

export type Site = typeof SITE;
