import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { Lang } from './config';

// Centralise l'import du type `AstroComponentFactory` (chemin interne Astro)
// pour les composants `src/components/i18n/*` indexés par langue.
// Usage : `const HERO: LangComponents = { fr: HeroFR, en: HeroEN }; const Hero = HERO[lang];`
export type LangComponents = Record<Lang, AstroComponentFactory>;
