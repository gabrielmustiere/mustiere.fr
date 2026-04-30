import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { parse as parseYaml } from 'yaml';

// Helpers pour les "sections SEO" injectées par le loader chaptered-glob
// dans les entrées blog/projects (cf. plan 005-f-sections-seo-articles).
//
// Trois fichiers sont reconnus dans la forme dossier d'une entrée :
//   - resume.mdx     : OBLIGATOIRE, body markdown léger rendu par `marked`.
//   - faq.mdx        : OPTIONNEL, frontmatter YAML `questions: [{q, r}]`.
//   - sources.mdx    : OPTIONNEL, frontmatter YAML `sources: [{titre, url, ...}]`.
//
// Les helpers sont synchrones et purs (lecture de fichier + parsing). Ils
// lèvent une erreur explicite incluant le chemin du fichier en cas de
// frontmatter invalide ou de contraintes non respectées, pour que le build
// pointe directement vers la cause.

export const RESERVED_SECTION_FILES = new Set([
  'resume.mdx',
  'faq.mdx',
  'sources.mdx',
]);

export interface ResumeSection {
  markdown: string;
  html: string;
  plain: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface SourceEntry {
  title: string;
  url: string;
  author?: string;
  date?: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function splitFrontmatter(raw: string): { fm: string | null; body: string } {
  const m = raw.match(FRONTMATTER_RE);
  if (!m) return { fm: null, body: raw };
  return { fm: m[1], body: raw.slice(m[0].length) };
}

function parseFrontmatter(
  filePath: string,
  fm: string
): Record<string, unknown> {
  try {
    const data = parseYaml(fm);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('frontmatter doit être un objet YAML');
    }
    return data as Record<string, unknown>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[seo-sections] frontmatter YAML invalide dans "${filePath}" : ${msg}`,
      { cause: err }
    );
  }
}

function stripMarkdown(md: string): string {
  // Conversion minimaliste markdown → texte pour la version `plain`. On
  // s'appuie sur marked pour générer du HTML, puis on strippe les balises.
  // Suffisant pour les meta descriptions et le passage en llms.txt.
  const html = marked.parse(md, { async: false }) as string;
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseResume(filePath: string): ResumeSection {
  const raw = readFileSync(filePath, 'utf-8');
  const { body } = splitFrontmatter(raw);
  const markdown = body.trim();
  if (!markdown) {
    throw new Error(
      `[seo-sections] "${filePath}" est vide. Le résumé est obligatoire.`
    );
  }
  const html = (marked.parse(markdown, { async: false }) as string).trim();
  const plain = stripMarkdown(markdown);
  if (plain.length < 60) {
    throw new Error(
      `[seo-sections] "${filePath}" : le résumé fait ${plain.length} caractères (texte plein), minimum 60.`
    );
  }
  return { markdown, html, plain };
}

export function parseFaq(filePath: string): FaqEntry[] {
  const raw = readFileSync(filePath, 'utf-8');
  const { fm } = splitFrontmatter(raw);
  if (!fm) {
    throw new Error(
      `[seo-sections] "${filePath}" : frontmatter YAML obligatoire (clé \`questions\`).`
    );
  }
  const data = parseFrontmatter(filePath, fm);
  const questions = data.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(
      `[seo-sections] "${filePath}" : \`questions\` doit être une liste non vide.`
    );
  }
  if (questions.length > 10) {
    throw new Error(
      `[seo-sections] "${filePath}" : ${questions.length} questions, maximum 10 (au-delà, c'est plus une FAQ).`
    );
  }
  return questions.map((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(
        `[seo-sections] "${filePath}" question #${i + 1} : doit être un objet \`{q, r}\`.`
      );
    }
    const obj = item as Record<string, unknown>;
    const q = obj.q;
    const r = obj.r;
    if (typeof q !== 'string' || q.trim().length === 0) {
      throw new Error(
        `[seo-sections] "${filePath}" question #${i + 1} : champ \`q\` (string) manquant ou vide.`
      );
    }
    if (q.length > 200) {
      throw new Error(
        `[seo-sections] "${filePath}" question #${i + 1} : \`q\` fait ${q.length} caractères, maximum 200.`
      );
    }
    if (typeof r !== 'string' || r.trim().length === 0) {
      throw new Error(
        `[seo-sections] "${filePath}" question #${i + 1} : champ \`r\` (string) manquant ou vide.`
      );
    }
    return { question: q.trim(), answer: r.trim() };
  });
}

export function parseSources(filePath: string): SourceEntry[] {
  const raw = readFileSync(filePath, 'utf-8');
  const { fm } = splitFrontmatter(raw);
  if (!fm) {
    throw new Error(
      `[seo-sections] "${filePath}" : frontmatter YAML obligatoire (clé \`sources\`).`
    );
  }
  const data = parseFrontmatter(filePath, fm);
  const sources = data.sources;
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(
      `[seo-sections] "${filePath}" : \`sources\` doit être une liste non vide.`
    );
  }
  return sources.map((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(
        `[seo-sections] "${filePath}" source #${i + 1} : doit être un objet.`
      );
    }
    const obj = item as Record<string, unknown>;
    const title = obj.titre ?? obj.title;
    const url = obj.url;
    const author = obj.auteur ?? obj.author;
    const date = obj.date;

    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new Error(
        `[seo-sections] "${filePath}" source #${i + 1} : \`titre\` manquant ou vide.`
      );
    }
    if (typeof url !== 'string') {
      throw new Error(
        `[seo-sections] "${filePath}" source #${i + 1} : \`url\` manquant.`
      );
    }
    try {
      new URL(url);
    } catch {
      throw new Error(
        `[seo-sections] "${filePath}" source #${i + 1} : URL invalide "${url}".`
      );
    }
    const out: SourceEntry = { title: title.trim(), url };
    if (author !== undefined) {
      if (typeof author !== 'string') {
        throw new Error(
          `[seo-sections] "${filePath}" source #${i + 1} : \`auteur\` doit être une string.`
        );
      }
      out.author = author.trim();
    }
    if (date !== undefined) {
      // YAML coerce les dates ISO en Date — on accepte les deux formes.
      let dateStr: string;
      if (date instanceof Date) {
        dateStr = date.toISOString().slice(0, 10);
      } else if (typeof date === 'string') {
        dateStr = date.trim();
      } else {
        throw new Error(
          `[seo-sections] "${filePath}" source #${i + 1} : \`date\` invalide.`
        );
      }
      if (!ISO_DATE_RE.test(dateStr)) {
        throw new Error(
          `[seo-sections] "${filePath}" source #${i + 1} : \`date\` doit être au format YYYY-MM-DD (reçu "${dateStr}").`
        );
      }
      out.date = dateStr;
    }
    return out;
  });
}

export interface SectionFiles {
  resume?: string;
  faq?: string;
  sources?: string;
}

export function discoverSectionFiles(dirPath: string): SectionFiles {
  const out: SectionFiles = {};
  for (const name of RESERVED_SECTION_FILES) {
    const p = join(dirPath, name);
    if (existsSync(p)) {
      const key = name.replace(/\.mdx$/, '') as keyof SectionFiles;
      out[key] = p;
    }
  }
  return out;
}
