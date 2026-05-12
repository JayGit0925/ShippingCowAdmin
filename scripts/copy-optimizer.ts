import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic();
const MODEL = 'claude-haiku-4-5-20251001';
const CONVERGENCE_WINDOW = 10;

const VARIANTS_PATH = path.join(__dirname, '../docs/campaign/copy-variants.json');
const PROGRAM_PATH = path.join(__dirname, '../docs/campaign/copy-program.md');
const DMS_PATH = path.join(__dirname, '../docs/campaign/linkedin-dms.md');

interface CopyVariant {
  id: string;
  iteration: number;
  dm_index: number;
  run_date: string;
  variant_text: string;
  persona_score: number;
  rubric_score: number;
  is_top_candidate: boolean;
}

function load(): CopyVariant[] {
  try { return JSON.parse(fs.readFileSync(VARIANTS_PATH, 'utf-8')); }
  catch { return []; }
}

function save(variants: CopyVariant[]) {
  fs.writeFileSync(VARIANTS_PATH, JSON.stringify(variants, null, 2));
}

function findTargetDm(variants: CopyVariant[]): number {
  if (variants.length === 0) return 1;
  const best: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const v of variants) {
    if (v.is_top_candidate) {
      const combined = (v.persona_score + v.rubric_score) / 2;
      if (combined > best[v.dm_index]) best[v.dm_index] = combined;
    }
  }
  return (Object.entries(best).sort(([, a], [, b]) => a - b)[0][0] as unknown as number);
}

function extractDm(content: string, dmIndex: number): string {
  const sections = content.split(/^## DM \d+[^\n]*/m);
  return (sections[dmIndex] ?? sections[1] ?? '').replace(/\n---\s*$/, '').trim();
}

function recentHistory(variants: CopyVariant[], dmIndex: number): string {
  const recent = variants.filter((v) => v.dm_index === dmIndex).slice(-5);
  if (!recent.length) return 'No previous variants.';
  return recent
    .map((v) => `Score ${((v.persona_score + v.rubric_score) / 2).toFixed(1)}: ${v.variant_text.slice(0, 200)}...`)
    .join('\n\n---\n\n');
}

async function generateVariant(program: string, currentDm: string, history: string): Promise<string> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a copywriter for ShippingCow, a freight service for Shopify/TikTok Shop sellers shipping 50–149lb furniture (sofas, dining tables) from Manhattan. Tonight's direction:\n\n${program}`,
    messages: [{
      role: 'user',
      content: `Write an improved version of this LinkedIn DM. Rules: MOOOVY voice (punchy, ≤1 pun, at least one real $ or lb number, short sentences), one clear call to action, lead with their pain not our product.\n\nCurrent DM:\n${currentDm}\n\nRecent attempts (avoid repeating):\n${history}\n\nWrite only the DM text, no commentary.`,
    }],
  });
  const c = msg.content[0];
  return c.type === 'text' ? c.text.trim() : '';
}

async function scorePersona(variant: string): Promise<{ score: number; reasoning: string }> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You are a Manhattan furniture seller (Shopify, 50–149lb sofas and tables, $10K–$20K/mo). You get many cold LinkedIn DMs from freight brokers. You're busy and skeptical. You only reply when a DM genuinely addresses a real shipping cost problem.`,
    messages: [{
      role: 'user',
      content: `Rate this DM on reply likelihood (1–10). JSON only:\n{"score": N, "reasoning": "one sentence"}\n\nDM:\n${variant}`,
    }],
  });
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const p = JSON.parse(m?.[0] ?? '{}');
    return { score: Math.min(10, Math.max(1, Number(p.score) || 5)), reasoning: p.reasoning || '' };
  } catch { return { score: 5, reasoning: 'parse error' }; }
}

async function scoreRubric(variant: string): Promise<number> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You are a copywriting quality checker. MOOOVY voice: punchy, specific numbers, short sentences.`,
    messages: [{
      role: 'user',
      content: `Score this LinkedIn DM on 4 criteria (each 1–10). JSON only:\n{"hook":N,"specificity":N,"cta":N,"mooovy":N}\n\nhook: first line names a real pain?\nspecificity: uses a real number ($ or lbs)?\ncta: exactly one clear ask?\nmooovy: short sentences, punchy, no filler?\n\nDM:\n${variant}`,
    }],
  });
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const p = JSON.parse(m?.[0] ?? '{}');
    const vals = [p.hook, p.specificity, p.cta, p.mooovy].map(Number).filter((n) => n >= 1 && n <= 10);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
  } catch { return 5; }
}

async function main() {
  const variants = load();
  const program = fs.readFileSync(PROGRAM_PATH, 'utf-8');
  const dmsContent = fs.readFileSync(DMS_PATH, 'utf-8');

  const targetDm = Number(findTargetDm(variants));
  const currentDm = extractDm(dmsContent, targetDm);
  console.log(`Targeting DM ${targetDm} (lowest top-candidate score)`);

  let bestScore = Math.max(
    0,
    ...variants.filter((v) => v.dm_index === targetDm && v.is_top_candidate)
      .map((v) => (v.persona_score + v.rubric_score) / 2),
  );
  let noImprovement = 0;
  let iter = 1;
  const runDate = new Date().toISOString().slice(0, 10);
  const base = variants.length;

  while (noImprovement < CONVERGENCE_WINDOW) {
    const history = recentHistory(variants, targetDm);
    const variantText = await generateVariant(program, currentDm, history);
    const [persona, rubricScore] = await Promise.all([scorePersona(variantText), scoreRubric(variantText)]);
    const combined = (persona.score + rubricScore) / 2;
    const isTop = combined > bestScore;

    if (isTop) {
      for (const v of variants) {
        if (v.dm_index === targetDm) v.is_top_candidate = false;
      }
      bestScore = combined;
      noImprovement = 0;
    } else {
      noImprovement++;
    }

    variants.push({
      id: `v${String(base + iter).padStart(3, '0')}`,
      iteration: iter,
      dm_index: targetDm,
      run_date: runDate,
      variant_text: variantText,
      persona_score: persona.score,
      rubric_score: Math.round(rubricScore * 10) / 10,
      is_top_candidate: isTop,
    });
    save(variants);

    console.log(`  iter ${iter}: persona=${persona.score} rubric=${rubricScore.toFixed(1)} combined=${combined.toFixed(1)} ${isTop ? '⭐ NEW BEST' : `no-improvement ${noImprovement}/${CONVERGENCE_WINDOW}`}`);
    iter++;
  }

  const top = variants.filter((v) => v.dm_index === targetDm && v.is_top_candidate).at(-1);
  console.log(`\nConverged after ${iter - 1} iterations. Best: ${bestScore.toFixed(1)}/10`);
  if (top) { console.log(`\nTop variant for DM ${targetDm}:\n\n${top.variant_text}`); }
}

main().catch(console.error);
