import type { Lang } from './config';

export const ui = {
  fr: {
    site: {
      title: 'Gabriel Mustiere — CTO freelance à Nantes',
      description:
        'CTO freelance basé à Nantes. 14 ans dans la tech, CTO depuis 2017. Architecture, leadership technique, SaaS & e-commerce.',
      tagline: 'Tech · Business · IA.',
      taglineLocation: 'Nantes — remote.',
      role: 'CTO',
      roleSuffix: 'freelance',
    },
    nav: {
      ariaSidebar: 'Navigation du site',
      ariaMobile: 'Navigation mobile',
      ariaSections: 'Sections',
      ariaMainMenu: 'Menu principal',
      ariaBackHome: "Retour à l'accueil",
      index: 'Index',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      menuLabel: 'Menu',
      items: {
        blog: 'Blog',
        about: 'Parcours',
        projects: 'Projets',
        contact: 'Contact',
        cv: 'CV',
      },
    },
    portrait: 'Portrait de Gabriel Mustiere',
    availability: 'Disponible Q3 2026',
    version: 'v. 2026.04 — Nantes',
    home: {
      blog: {
        title: 'Blog',
        intro:
          "Notes sur la tech, le business et l'IA. Pas de fréquence, juste quand j'ai quelque chose à dire.",
        seeAll: 'Tous les articles',
        readMore: 'Lire',
      },
      about: {
        title: 'À propos',
        experience: '14 ans',
        experienceLabel: 'Expérience',
        rolesLabel: 'Rôles',
        locationLabel: 'Basé à',
        availabilityLabel: 'Disponibilité',
        availability: 'Q3 2026',
        location: 'Nantes · remote',
        roles: 'CTO, Tech Lead, Architecte',
        moreCta: 'Voir le parcours détaillé',
      },
      projects: {
        title: 'Side projects',
        readDetail: 'Lire le détail',
      },
      contact: {
        title: 'Contact',
        intro:
          'Missions, audits, sparring : un mail suffit. Je réponds sous 48h, jamais aux sollicitations commerciales.',
        emailLabel: 'Email',
        linkedinLabel: 'LinkedIn',
        githubLabel: 'GitHub',
      },
      cv: {
        title: 'CV en PDF',
        meta: 'Dernière mise à jour : avril 2026 · 2 pages · 180 ko',
        cta: 'Télécharger',
      },
    },
    blogIndex: {
      title: 'Blog',
      description:
        "Notes sur la tech, le business et l'IA. Pas de fréquence, juste quand j'ai quelque chose à dire.",
      allCategories: 'Toutes',
      empty: 'Rien dans cette catégorie pour le moment.',
      filterLabel: 'Filtrer par catégorie',
    },
    article: {
      backToBlog: '← Tous les articles de blog',
      publishedOn: 'Publié le',
      updatedOn: 'Mis à jour le',
      readingTime: 'min de lecture',
      tldrLabel: 'TL;DR',
      share: 'Partager',
      shareTwitter: 'Partager sur Twitter',
      shareLinkedIn: 'Partager sur LinkedIn',
      shareCopy: 'Copier le lien',
      shareCopied: 'Lien copié',
      nextArticle: 'Article suivant',
      previousArticle: 'Article précédent',
      readingProgress: 'Progression de lecture',
      by: 'Par',
    },
    project: {
      backToProjects: '← Tous les projets',
      status: 'Statut',
      year: 'Année',
      kind: 'Type',
      visit: 'Voir en ligne',
      faqTitle: 'Questions fréquentes',
      otherProjects: 'Autres projets',
      statusLabels: {
        actif: 'actif',
        archivé: 'archivé',
        beta: 'beta',
      },
    },
    footer: {
      copyright: '© {year} Gabriel Mustiere',
      handmade: 'Fait <s>main</s> avec Claude · Nantes',
      backHome: "← Retour à l'accueil",
    },
    toggle: {
      ariaLabel: 'Changer de langue',
      switchToFrench: 'Passer en français',
      switchToEnglish: 'Switch to English',
    },
    error404: {
      eyebrow: 'Erreur 404',
      title: 'Cette page n’existe pas',
      description:
        "Soit elle a été déplacée, soit elle n'a jamais existé. Ça arrive.",
      backHome: "Retour à l'accueil",
      goToBlog: 'Voir le blog',
    },
    rss: {
      title: 'Gabriel Mustiere — Blog',
      description:
        "Notes sur la tech, le business et l'IA par Gabriel Mustiere, CTO freelance à Nantes.",
    },
  },
  en: {
    site: {
      title: 'Gabriel Mustiere — Freelance CTO in Nantes',
      description:
        'Freelance CTO based in Nantes. 14 years in tech, CTO since 2017. Architecture, technical leadership, SaaS & e-commerce.',
      tagline: 'Tech · Business · AI.',
      taglineLocation: 'Nantes — remote.',
      role: 'Freelance',
      roleSuffix: 'CTO',
    },
    nav: {
      ariaSidebar: 'Site navigation',
      ariaMobile: 'Mobile navigation',
      ariaSections: 'Sections',
      ariaMainMenu: 'Main menu',
      ariaBackHome: 'Back to home',
      index: 'Index',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      menuLabel: 'Menu',
      items: {
        blog: 'Blog posts',
        about: 'Background',
        projects: 'Projects',
        contact: 'Contact',
        cv: 'Résumé',
      },
    },
    portrait: 'Portrait of Gabriel Mustiere',
    availability: 'Available Q3 2026',
    version: 'v. 2026.04 — Nantes',
    home: {
      blog: {
        title: 'Blog posts',
        intro:
          'Notes on tech, business and AI. No schedule — only when I have something to say.',
        seeAll: 'All posts',
        readMore: 'Read',
      },
      about: {
        title: 'About',
        experience: '14 years',
        experienceLabel: 'Experience',
        rolesLabel: 'Roles',
        locationLabel: 'Based in',
        availabilityLabel: 'Availability',
        availability: 'Q3 2026',
        location: 'Nantes · remote',
        roles: 'CTO, Tech Lead, Architect',
        moreCta: 'See the full background',
      },
      projects: {
        title: 'Side projects',
        readDetail: 'Read details',
      },
      contact: {
        title: 'Contact',
        intro:
          'Missions, audits, sparring: a single email is enough. I reply within 48h, never to cold sales.',
        emailLabel: 'Email',
        linkedinLabel: 'LinkedIn',
        githubLabel: 'GitHub',
      },
      cv: {
        title: 'Résumé (PDF)',
        meta: 'Last updated: April 2026 · 2 pages · 180 kB',
        cta: 'Download',
      },
    },
    blogIndex: {
      title: 'Blog posts',
      description:
        'Notes on tech, business and AI. No schedule — only when I have something to say.',
      allCategories: 'All',
      empty: 'Nothing in this category yet.',
      filterLabel: 'Filter by category',
    },
    article: {
      backToBlog: '← All blog posts',
      publishedOn: 'Published on',
      updatedOn: 'Updated on',
      readingTime: 'min read',
      tldrLabel: 'TL;DR',
      share: 'Share',
      shareTwitter: 'Share on Twitter',
      shareLinkedIn: 'Share on LinkedIn',
      shareCopy: 'Copy link',
      shareCopied: 'Link copied',
      nextArticle: 'Next post',
      previousArticle: 'Previous post',
      readingProgress: 'Reading progress',
      by: 'By',
    },
    project: {
      backToProjects: '← All projects',
      status: 'Status',
      year: 'Year',
      kind: 'Type',
      visit: 'View online',
      faqTitle: 'Frequently asked questions',
      otherProjects: 'Other projects',
      statusLabels: {
        actif: 'active',
        archivé: 'archived',
        beta: 'beta',
      },
    },
    footer: {
      copyright: '© {year} Gabriel Mustiere',
      handmade: '<s>Hand</s>made with Claude · Nantes',
      backHome: '← Back to home',
    },
    toggle: {
      ariaLabel: 'Change language',
      switchToFrench: 'Passer en français',
      switchToEnglish: 'Switch to English',
    },
    error404: {
      eyebrow: 'Error 404',
      title: "This page doesn't exist",
      description:
        'It was either moved, or it never existed. These things happen.',
      backHome: 'Back to home',
      goToBlog: 'Go to blog',
    },
    rss: {
      title: 'Gabriel Mustiere — Blog posts',
      description:
        'Notes on tech, business and AI by Gabriel Mustiere, freelance CTO in Nantes.',
    },
  },
} as const;

export type UiDict = (typeof ui)['fr'];

export function t(lang: Lang): UiDict {
  return ui[lang] as UiDict;
}

export const BLOG_CATEGORIES = {
  fr: {
    IA: 'IA',
    Tech: 'Tech',
    Lead: 'Lead',
    Business: 'Business',
  },
  en: {
    IA: 'AI',
    Tech: 'Tech',
    Lead: 'Leadership',
    Business: 'Business',
  },
} as const;
