import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.1.0';

// Try WebGPU first. If not available, it will fall back to WASM (slower).
env.useBrowserCache = true;

const el = (id) => document.getElementById(id);
el('gpu-check').textContent = navigator.gpu
  ? '✅ WebGPU detected.'
  : '⚠️ WebGPU not detected. It may still run via WASM but will be slow. Try Chrome/Edge desktop.';

let generator = null;

async function loadModel() {
  const modelId = el('model').value;
  setStatus(`Loading model: ${modelId} (first load is big; cached afterwards)…`);
  // text-generation pipeline (causal LM)
  generator = await pipeline('text-generation', modelId, {
    // quantized models are preferred where available
    quantized: true,
  });
  setStatus(`Model ready: ${modelId}`);
}

async function gen(prompt, max_new_tokens=220) {
  if (!generator) await loadModel();
  // Temperature/top_p encourage creativity; repetition_penalty discourages loops.
  const out = await generator(prompt, {
    max_new_tokens,
    do_sample: true,
    temperature: 0.95,
    top_p: 0.9,
    repetition_penalty: 1.12,
    // stop sequences can help truncate rambling (optional)
  });
  return out[0].generated_text;
}

function setStatus(msg) { el('status').textContent = 'Status: ' + msg; }

async function runPipeline() {
  try {
    const brief = el('brief').value.trim();
    const style = el('style').value.trim();
    const maxToks = Math.max(64, Math.min(512, parseInt(el('max-toks').value || '220', 10)));

    if (!brief) {
      alert('Please enter a scene brief.');
      return;
    }

    // 1) Baseline (one-pass)
    setStatus('Generating baseline…');
    const baselinePrompt = `You are a fiction model. Write a ~280-word scene based on this brief:
${brief}
Style hints: ${style}
Constraints: Keep it coherent and readable. Prefer dialogue over exposition.`;
    const baseline = await gen(baselinePrompt, maxToks);
    el('out-baseline').textContent = baseline;

    // 2) Beats (planner)
    setStatus('Planning beats…');
    const beatsPrompt = `Create 6 numbered, concrete beats for a scene.
Include: (1) goal (2) obstacle (3) rising pressure (4) an in-character surprise (5) fallout (6) next-scene hook.
Avoid clichés. Brief: ${brief}
Style: ${style}`;
    const beats = await gen(beatsPrompt, Math.min(200, maxToks));
    el('out-beats').textContent = beats;

    // 3) Scene draft following beats
    setStatus('Writing draft from beats…');
    const draftPrompt = `Write a ~300-word scene strictly following these beats:
${beats}

Constraints:
- Dialogue-forward; compress exposition into subtext.
- Maintain a distinct voice per the style notes.
- Avoid overused phrases and stock tropes.
- Include exactly one in-character surprise.
Style notes: ${style}`;
    const draft = await gen(draftPrompt, maxToks);
    el('out-draft').textContent = draft;

    // 4) Critic pass (surgical rewrite)
    setStatus('Critic pass: reduce repetition and clichés…');
    const criticPrompt = `Rewrite only what is needed in this scene to reduce repetition and remove clichés/stereotypes,
while preserving the same plot beats and one in-character surprise. Keep voice consistent with the style notes.
Return the revised scene only.

Style notes: ${style}

Scene:
${draft}`;
    const improved = await gen(criticPrompt, maxToks);
    el('out-final').textContent = improved;

    setStatus('Done ✅');
  } catch (e) {
    console.error(e);
    setStatus('Error: ' + (e?.message || e));
    alert('Error: ' + (e?.message || e));
  }
}

el('run').addEventListener('click', runPipeline);
el('load').addEventListener('click', loadModel);
