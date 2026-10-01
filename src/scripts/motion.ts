import {
  Chart, BarController, BarElement, LineController, LineElement, PointElement,
  DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js';

Chart.register(
  BarController, BarElement, LineController, LineElement, PointElement,
  DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rootStyle = getComputedStyle(document.documentElement);
const accent = rootStyle.getPropertyValue('--brand').trim() || '#785DA8';

/* Header: shrink on scroll + mobile menu */
const header = document.querySelector<HTMLElement>('[data-header]');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  nav?.classList.toggle('open', open);
});
nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

/* Count-up numbers */
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  if (reduce || !isFinite(target)) { el.textContent = target.toFixed(decimals); return; }
  const start = performance.now();
  const dur = 1600;
  const tick = (t: number) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Charts (drawn when scrolled into view so the animation is seen) */
function drawChart(canvas: HTMLCanvasElement) {
  const cfg = JSON.parse(canvas.dataset.chart || '{}');
  const isDoughnut = cfg.type === 'doughnut';
  const palette = [accent, '#50C8EC', '#D78BBB', '#9D8BC9', '#5650A2', '#A7E3F5'];
  const grid = 'rgba(255,255,255,0.08)';
  const ink = 'rgba(255,255,255,0.72)';
  new Chart(canvas, {
    type: cfg.type,
    data: {
      labels: cfg.labels,
      datasets: [{
        label: cfg.label,
        data: cfg.values,
        backgroundColor: isDoughnut ? palette : cfg.type === 'line' ? 'rgba(157,139,201,0.2)' : (ctx: any) => {
          const { chartArea, ctx: c } = ctx.chart;
          if (!chartArea) return accent;
          const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, '#5650A2'); g.addColorStop(1, '#9D8BC9');
          return g;
        },
        borderColor: isDoughnut ? '#051440' : cfg.type === 'line' ? '#9D8BC9' : 'transparent',
        borderWidth: isDoughnut ? 3 : 2,
        borderRadius: cfg.type === 'bar' ? 8 : 0,
        hoverBackgroundColor: isDoughnut ? palette : '#50C8EC',
        fill: cfg.type === 'line',
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#50C8EC',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduce ? false : { duration: 1400, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: isDoughnut, labels: { color: ink, font: { family: 'Ubuntu' } } },
        tooltip: { backgroundColor: '#ffffff', titleColor: '#051440', bodyColor: '#5650A2', padding: 12, cornerRadius: 10, titleFont: { family: 'Ubuntu', weight: 'bold' }, bodyFont: { family: 'Ubuntu' } },
      },
      scales: isDoughnut ? {} : {
        x: { grid: { display: false }, ticks: { color: ink, font: { family: 'Ubuntu', size: 13 } } },
        y: { grid: { color: grid }, border: { display: false }, ticks: { color: ink, font: { family: 'Ubuntu' } }, beginAtZero: true },
      },
    },
  });
}

/* One observer for reveal-on-scroll, counters and charts */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target as HTMLElement;
    if (el.classList.contains('reveal')) el.classList.add('in');
    if (el.dataset.count !== undefined) countUp(el);
    if (el.dataset.chart !== undefined) drawChart(el as HTMLCanvasElement);
    io.unobserve(el);
  }
}, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll<HTMLElement>('.reveal, [data-count], [data-chart]').forEach((el) => {
  if (reduce && el.classList.contains('reveal')) el.classList.add('in');
  io.observe(el);
});

/* Hero graphic follows the mouse */
const art = document.querySelector<HTMLElement>('[data-parallax]');
if (art && !reduce && window.matchMedia('(pointer: fine)').matches) {
  const hero = art.closest('section')!;
  hero.addEventListener('mousemove', (ev) => {
    const r = hero.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    art.style.transform = `translate3d(${x * -24}px, ${y * -18}px, 0) rotateY(${x * 6}deg) rotateX(${y * -6}deg)`;
  });
  hero.addEventListener('mouseleave', () => { art.style.transform = ''; });
}

/* Service cards: light follows the cursor */
document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
  card.addEventListener('mousemove', (ev) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${ev.clientX - r.left}px`);
    card.style.setProperty('--my', `${ev.clientY - r.top}px`);
  });
});

/* Testimonial slider */
document.querySelectorAll<HTMLElement>('[data-slider]').forEach((slider) => {
  const slides = [...slider.querySelectorAll<HTMLElement>('[data-slide]')];
  const dots = [...slider.querySelectorAll<HTMLButtonElement>('[data-dot]')];
  if (slides.length < 2) return;
  let i = 0;
  const show = (n: number) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
  };
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  if (!reduce) {
    let timer = setInterval(() => show(i + 1), 6000);
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', () => { timer = setInterval(() => show(i + 1), 6000); });
  }
});
