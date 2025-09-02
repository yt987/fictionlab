async function loadExperiments() {
  const data = await fetch('data/experiments.json').then(r => r.json());
  window._EXP = data;
  renderCards(data);
  buildTags(data);
  setupSearch(data);
}

function buildTags(list) {
  const tagset = new Set();
  list.forEach(e => (e.tags||[]).forEach(t => tagset.add(t)));
  const tagbar = document.getElementById('tagbar');
  tagset.forEach(t => {
    const b = document.createElement('button');
    b.className = 'button small';
    b.textContent = t;
    b.addEventListener('click', () => {
      renderCards(_EXP.filter(e => e.tags && e.tags.includes(t)));
    });
    tagbar.appendChild(b);
  });
  const all = document.createElement('button');
  all.className = 'button small';
  all.textContent = 'All';
  all.addEventListener('click', () => renderCards(_EXP));
  tagbar.appendChild(all);
}

function setupSearch(data) {
  const input = document.getElementById('search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const f = data.filter(e =>
      (e.title||'').toLowerCase().includes(q) ||
      (e.tags||[]).some(t => t.toLowerCase().includes(q)));
    renderCards(f);
  });
}

function renderCards(list) {
  const cards = document.getElementById('cards');
  const tpl = document.getElementById('card-tpl');
  cards.innerHTML = '';
  list.forEach(e => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.card-title').textContent = e.title;
    node.querySelector('.meta').textContent = `${e.model} — ${e.pipeline.join(', ')}`;
    const tags = node.querySelector('.tags');
    (e.tags||[]).forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tags.appendChild(span);
    });
    node.querySelector('.view-btn').addEventListener('click', () => openViewer(e));
    cards.appendChild(node);
  });
}

async function openViewer(exp) {
  const baseline = await fetch(`data/experiments/${exp.baseline_file}`).then(r => r.text());
  const pipeline = await fetch(`data/experiments/${exp.pipeline_file}`).then(r => r.text());
  document.getElementById('v-title').textContent = exp.title;
  document.getElementById('v-meta').textContent = `${exp.model} — ${exp.pipeline.join(' · ')}`;
  document.getElementById('v-baseline').textContent = baseline;
  document.getElementById('v-pipeline').textContent = pipeline;
  document.getElementById('v-notes').textContent = exp.notes || '';

  // charts
  const d2 = document.getElementById('chart-distinct').getContext('2d');
  const h1 = document.getElementById('chart-human').getContext('2d');
  if (window._chart1) window._chart1.destroy();
  if (window._chart2) window._chart2.destroy();

  const mA = exp.metrics || {};
  const mB = exp.baseline_metrics || {};
  window._chart1 = new Chart(d2, {
    type: 'bar',
    data: {
      labels: ['distinct-2','distinct-3','repetition','beat coverage'],
      datasets: [
        { label: 'Baseline', data: [mB.distinct2||0, mB.distinct3||0, mB.repetition_rate||0, mB.beat_coverage||0] },
        { label: 'Pipeline', data: [mA.distinct2||0, mA.distinct3||0, mA.repetition_rate||0, mA.beat_coverage||0] }
      ]
    },
    options: { responsive: true }
  });

  window._chart2 = new Chart(h1, {
    type: 'bar',
    data: {
      labels: ['Voice','Coherence','Humor'],
      datasets: [
        { label: 'Baseline', data: [mB.human_voice||0, mB.human_coherence||0, mB.human_humor||0] },
        { label: 'Pipeline', data: [mA.human_voice||0, mA.human_coherence||0, mA.human_humor||0] }
      ]
    },
    options: { responsive: true, scales: { y: { suggestedMax: 5 } } }
  });

  const dlg = document.getElementById('viewer');
  dlg.showModal();
}

document.addEventListener('DOMContentLoaded', loadExperiments);
