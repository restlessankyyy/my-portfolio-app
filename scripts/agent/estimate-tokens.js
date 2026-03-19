#!/usr/bin/env node
/**
 * Token usage & cost estimator for the agentic resume pipeline.
 */
const fs = require('fs');
const path = require('path');

function estimateTokens(text) { return Math.ceil(text.length / 4); }

const jd = fs.readFileSync(path.resolve(__dirname, 'jds/microsoft-csa.txt'), 'utf-8');
const profile = fs.readFileSync(path.resolve(__dirname, 'candidate-profile.yaml'), 'utf-8');

// Read agent files to extract system prompts
const agents = ['jd-analyzer', 'experience-mapper', 'resume-writer', 'ats-scorer'];
const sysPrompts = {};
agents.forEach(a => {
  const src = fs.readFileSync(path.resolve(__dirname, a + '.js'), 'utf-8');
  const match = src.match(/SYSTEM_PROMPT = `([\s\S]*?)`;/);
  sysPrompts[a] = match ? match[1] : '';
});

console.log('=== RAW INPUT SIZES ===');
console.log(`JD text:           ${jd.length} chars  ~${estimateTokens(jd)} tokens`);
console.log(`Candidate YAML:    ${profile.length} chars  ~${estimateTokens(profile)} tokens`);
console.log();

console.log('=== SYSTEM PROMPTS ===');
Object.entries(sysPrompts).forEach(([k, v]) =>
  console.log(`  ${k}: ${v.length} chars  ~${estimateTokens(v)} tokens`)
);
console.log();

// --- Per-agent estimates ---
const a1_in = estimateTokens(sysPrompts['jd-analyzer']) + estimateTokens(jd) + 20;
const a1_out = 2000;

const a2_in = estimateTokens(sysPrompts['experience-mapper']) + 2000 + estimateTokens(profile) + 50;
const a2_out = 2000;

const a3_in = estimateTokens(sysPrompts['resume-writer']) + 2000 + 2000 + estimateTokens(profile) + 80;
const a3_out = 3000;

const a4_in = estimateTokens(sysPrompts['ats-scorer']) + 2000 + 3000 + 50;
const a4_out = 1500;

console.log('=== PER-AGENT TOKEN ESTIMATES (single call) ===');
console.log(`  Agent 1 (JD Analyzer):      IN ${a1_in}  OUT ${a1_out}  TOTAL ${a1_in + a1_out}`);
console.log(`  Agent 2 (Experience Mapper): IN ${a2_in}  OUT ${a2_out}  TOTAL ${a2_in + a2_out}`);
console.log(`  Agent 3 (Resume Writer):     IN ${a3_in}  OUT ${a3_out}  TOTAL ${a3_in + a3_out}`);
console.log(`  Agent 4 (ATS Scorer):        IN ${a4_in}  OUT ${a4_out}  TOTAL ${a4_in + a4_out}`);
console.log();

// --- Pipeline totals ---
const in1  = a1_in + a2_in + a3_in + a4_in;
const out1 = a1_out + a2_out + a3_out + a4_out;
const in2  = in1 + a3_in + a4_in;       // 2nd loop adds another Writer + Scorer
const out2 = out1 + a3_out + a4_out;

console.log('=== PIPELINE TOTALS ===');
console.log(`  1 loop (pass first try):  IN ${in1}  OUT ${out1}  TOTAL ${in1 + out1}`);
console.log(`  2 loops (1 feedback):     IN ${in2}  OUT ${out2}  TOTAL ${in2 + out2}`);
console.log();

// --- Cost ---
const models = [
  { name: 'Claude Sonnet 4',      in_price: 3,   out_price: 15 },
  { name: 'Claude Haiku 3.5',     in_price: 0.8, out_price: 4 },
  { name: 'GPT-4o (GitHub free)', in_price: 0,   out_price: 0 },
  { name: 'GPT-4.1 (GitHub free)',in_price: 0,   out_price: 0 },
];

console.log('=== COST PER RUN ($/M tokens) ===');
models.forEach(m => {
  const cost1 = (in1 * m.in_price / 1e6) + (out1 * m.out_price / 1e6);
  const cost2 = (in2 * m.in_price / 1e6) + (out2 * m.out_price / 1e6);
  const avg = (cost1 + cost2) / 2;
  console.log(`  ${m.name}:`);
  console.log(`    1 loop: $${cost1.toFixed(4)}  |  2 loops: $${cost2.toFixed(4)}  |  avg: $${avg.toFixed(4)}`);
  if (avg > 0) {
    console.log(`    $5 budget → ~${Math.floor(5 / avg)} resumes`);
  } else {
    console.log(`    Free with GitHub token — unlimited`);
  }
});
