import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ICP_TRIGGER = 5;
const MODEL = 'claude-sonnet-4-6';
const CRITERIA_PATH = path.join(__dirname, '../docs/campaign/icp-criteria-v2.json');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: replies, error } = await supabase
    .from('dm_tracking')
    .select('prospect_name, prospect_store, reply_tone, notes, created_at')
    .order('created_at', { ascending: true });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  const count = replies?.length ?? 0;
  console.log(`ICP monitor: ${count}/${ICP_TRIGGER} replies logged.`);

  if (count < ICP_TRIGGER) {
    console.log(`Parked — ${ICP_TRIGGER - count} more repl${ICP_TRIGGER - count === 1 ? 'y' : 'ies'} needed.`);
    return;
  }

  console.log(`Trigger reached. Generating ICP criteria from ${count} replies...`);

  const client = new Anthropic();
  const list = replies!
    .map((r, i) =>
      `Reply ${i + 1}: ${r.prospect_name}${r.prospect_store ? ` (${r.prospect_store})` : ''} — tone: ${r.reply_tone ?? 'unknown'}${r.notes ? ` — notes: ${r.notes}` : ''}`
    )
    .join('\n');

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an ICP analyst for ShippingCow, a freight service for Shopify/TikTok Shop sellers shipping 50–149lb furniture. Analyze reply data and tighten ICP search criteria.`,
    messages: [{
      role: 'user',
      content: `Analyze these ${count} DM replies and output tightened ICP criteria. JSON only:\n{\n  "hypothesis": "one sentence about the real customer",\n  "tightened_criteria": {\n    "product_categories": ["..."],\n    "platform": ["..."],\n    "geo": ["..."],\n    "engagement_patterns": ["..."]\n  },\n  "linkedin_search_string": "...",\n  "next_action": "..."\n}\n\nReplies:\n${list}`,
    }],
  });

  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m?.[0] ?? '{}');
    parsed.generated_at = new Date().toISOString().slice(0, 10);
    parsed.based_on_replies = count;
    fs.writeFileSync(CRITERIA_PATH, JSON.stringify(parsed, null, 2));
    console.log(`Criteria written to ${CRITERIA_PATH}`);
    console.log(`Hypothesis: ${parsed.hypothesis}`);
  } catch (e) {
    console.error('Parse error:', e);
    process.exit(1);
  }
}

main().catch(console.error);
