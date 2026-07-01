/* =========================================================
   COFRE — charts.js
   Gráficos desenhados em <canvas> puro, sem bibliotecas externas.
   ========================================================= */

const ChartColors = {
  brass: '#C9A24B',
  brassLight: '#E4C97A',
  positive: '#6FA97C',
  negative: '#D4776A',
  grid: 'rgba(243, 237, 224, 0.08)',
  text: 'rgba(243, 237, 224, 0.55)',
  palette: ['#C9A24B', '#6FA97C', '#D4776A', '#8FB8D4', '#D4A2E4', '#E4C97A', '#7FA88F', '#B48ED4']
};

function setupCanvasDPI(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssHeight = canvas.height; // valor definido via atributo height é usado como CSS px alvo
  const width = rect.width || canvas.parentElement.clientWidth;
  const height = cssHeight;

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width, height };
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ---------------- DONUT: Gastos por categoria ---------------- */
function drawCategoryDonut(canvas, dataMap) {
  const entries = Object.entries(dataMap).filter(([, v]) => v > 0);
  const noDataEl = document.getElementById('noCategoryData');

  if (entries.length === 0) {
    canvas.style.display = 'none';
    if (noDataEl) noDataEl.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  if (noDataEl) noDataEl.style.display = 'none';

  const { ctx, width, height } = setupCanvasDPI(canvas);
  ctx.clearRect(0, 0, width, height);

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const cx = width / 2 - 70;
  const cy = height / 2;
  const rOuter = Math.min(height / 2 - 10, 80);
  const rInner = rOuter * 0.6;

  let startAngle = -Math.PI / 2;

  entries.forEach(([cat, val], i) => {
    const angle = (val / total) * Math.PI * 2;
    const color = ChartColors.palette[i % ChartColors.palette.length];

    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, startAngle, startAngle + angle);
    ctx.arc(cx, cy, rInner, startAngle + angle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += angle;
  });

  // Legenda
  const legendX = width - 130;
  let legendY = 20;
  ctx.font = '12px "Space Grotesk", sans-serif';
  ctx.textBaseline = 'middle';

  entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .forEach(([cat, val], i) => {
      const color = ChartColors.palette[entries.findIndex(e => e[0] === cat) % ChartColors.palette.length];
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 5, 10, 10);
      ctx.fillStyle = ChartColors.text;
      const pct = ((val / total) * 100).toFixed(0);
      ctx.fillText(`${cat} (${pct}%)`, legendX + 16, legendY);
      legendY += 20;
    });
}

/* ---------------- LINHA: Fluxo mensal ---------------- */
function drawFlowChart(canvas, months, incomes, expenses) {
  const { ctx, width, height } = setupCanvasDPI(canvas);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(1, ...incomes, ...expenses);
  const stepX = chartW / (months.length - 1 || 1);

  // grid horizontal
  ctx.strokeStyle = ChartColors.grid;
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxVal - (maxVal / gridLines) * i;
    ctx.fillStyle = ChartColors.text;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0), padding.left - 8, y);
  }

  function plotLine(values, color) {
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = padding.left + stepX * i;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // pontos
    values.forEach((v, i) => {
      const x = padding.left + stepX * i;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  plotLine(incomes, ChartColors.positive);
  plotLine(expenses, ChartColors.negative);

  // labels eixo X
  ctx.fillStyle = ChartColors.text;
  ctx.font = '10.5px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  months.forEach((m, i) => {
    const x = padding.left + stepX * i;
    ctx.fillText(m, x, height - padding.bottom + 8);
  });
}

/* ---------------- BARRA HORIZONTAL: Investimentos por tipo ---------------- */
function drawInvestmentChart(canvas, dataMap) {
  const entries = Object.entries(dataMap).filter(([, v]) => v > 0);
  const noDataEl = document.getElementById('noInvData');

  if (entries.length === 0) {
    canvas.style.display = 'none';
    if (noDataEl) noDataEl.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  if (noDataEl) noDataEl.style.display = 'none';

  const { ctx, width, height } = setupCanvasDPI(canvas);
  ctx.clearRect(0, 0, width, height);

  const maxVal = Math.max(...entries.map(([, v]) => v));
  const barHeight = Math.min(28, (height - 20) / entries.length - 10);
  const gap = (height - entries.length * barHeight) / (entries.length + 1);
  const leftPad = 130;
  const rightPad = 80;

  entries.forEach(([label, val], i) => {
    const y = gap + i * (barHeight + gap);
    const barW = ((width - leftPad - rightPad) * val) / maxVal;
    const color = ChartColors.palette[i % ChartColors.palette.length];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(leftPad, y, Math.max(barW, 2), barHeight, 6);
    ctx.fill();

    ctx.fillStyle = ChartColors.text;
    ctx.font = '12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, leftPad - 10, y + barHeight / 2);

    ctx.textAlign = 'left';
    ctx.font = '11.5px "JetBrains Mono", monospace';
    ctx.fillStyle = ChartColors.brassLight;
    ctx.fillText(formatBRL(val), leftPad + barW + 8, y + barHeight / 2);
  });
}
