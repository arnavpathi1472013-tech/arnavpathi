'use strict';

const DATA_URL = './projects.json';

const $ = (id) => document.getElementById(id);

const SEVERITY_LABELS = { 1: 'Low', 2: 'Medium', 3: 'High' };
const STATUS_CLASS_MAP = {
  live:      'ws--live',
  building:  'ws--building',
};
const IOT_STATUS_CLASS_MAP = {
  deployed: 'ib--deployed',
  building: 'ib--building',
};
const SEC_STATUS_CLASS_MAP = {
  disclosed: 'ss--disclosed',
  triaged:   'ss--triaged',
  ctf:       'ss--ctf',
};

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWebCard(project, index) {
  const statusClass = STATUS_CLASS_MAP[project.status] ?? 'ws--live';
  const stripClass  = project.accent === 'amber' ? 'strip--amber' : 'strip--emerald';
  const tags        = project.tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

  return `
    <article class="web-card" role="listitem" data-index="${index}" tabindex="0" aria-label="${escapeHTML(project.title)}">
      <div class="web-card__top-strip ${stripClass}"></div>
      <div class="web-card__body">
        <div class="web-card__header">
          <span class="web-card__icon" aria-hidden="true">${escapeHTML(project.icon)}</span>
          <span class="web-card__status ${statusClass}">${escapeHTML(project.statusLabel)}</span>
        </div>
        <h3 class="web-card__title">${escapeHTML(project.title)}</h3>
        <p class="web-card__desc">${escapeHTML(project.description)}</p>
        <div class="web-card__tags" aria-label="Technologies">${tags}</div>
        <div class="web-card__footer">
          <span class="web-card__year mono">${escapeHTML(project.year)}</span>
          <a class="web-card__link" href="${escapeHTML(project.link)}" target="_blank" rel="noopener noreferrer" aria-label="View ${escapeHTML(project.title)}">
            View Project <span class="web-card__link-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>`;
}

function buildIoTCard(project, index) {
  const badgeClass    = IOT_STATUS_CLASS_MAP[project.status] ?? 'ib--deployed';
  const cardModifier  = project.status === 'building' ? 'iot-card--building' : '';
  const hwTags        = project.hardware.map(h => `<span class="hw-tag">${escapeHTML(h)}</span>`).join('');
  const protoTags     = project.protocols.map(p => `<span class="proto-tag">${escapeHTML(p)}</span>`).join('');

  return `
    <article class="iot-card ${cardModifier}" role="listitem" data-index="${index}" tabindex="0" aria-label="${escapeHTML(project.title)}">
      <div class="iot-card__sidebar">
        <div class="iot-card__icon-wrap" aria-hidden="true">${escapeHTML(project.icon)}</div>
        <div class="iot-card__status-track" aria-hidden="true">
          <div class="iot-card__status-fill" style="height:${project.status === 'deployed' ? '100' : '50'}%"></div>
        </div>
      </div>
      <div class="iot-card__body">
        <div class="iot-card__meta">
          <span class="iot-card__firmware mono">${escapeHTML(project.firmware)}</span>
          <span class="iot-card__badge ${badgeClass}">${escapeHTML(project.statusLabel)}</span>
        </div>
        <h3 class="iot-card__title">${escapeHTML(project.title)}</h3>
        <p class="iot-card__desc">${escapeHTML(project.description)}</p>
        <div class="iot-card__hw" aria-label="Hardware components">${hwTags}</div>
        <div class="iot-card__protocols" aria-label="Protocols">${protoTags}</div>
        <div class="iot-card__metric">
          <span class="iot-card__metric-label">${escapeHTML(project.metrics.label)}</span>
          <span class="iot-card__metric-value">${escapeHTML(project.metrics.value)}</span>
        </div>
      </div>
    </article>`;
}

function buildSecCard(project, index) {
  const statusClass   = SEC_STATUS_CLASS_MAP[project.status] ?? 'ss--ctf';
  const sevClass      = `sev--${project.severityLevel}`;
  const sevLabel      = SEVERITY_LABELS[project.severityLevel] ?? 'Info';

  return `
    <article class="sec-card" role="listitem" data-index="${index}" tabindex="0" aria-label="${escapeHTML(project.title)}">
      <div class="sec-card__top">
        <span class="sec-card__platform mono">${escapeHTML(project.platform)}</span>
        <span class="sec-card__status ${statusClass}">${escapeHTML(project.statusLabel)}</span>
      </div>
      <div class="sec-card__body">
        <h3 class="sec-card__title">${escapeHTML(project.title)}</h3>
        <p class="sec-card__desc">${escapeHTML(project.description)}</p>
        <div class="sec-card__footer">
          <span class="severity-pill ${sevClass}" aria-label="Severity: ${sevLabel}">
            <span class="sev-dot" aria-hidden="true"></span>
            ${sevLabel}
          </span>
          <span class="sec-card__method mono">${escapeHTML(project.method)}</span>
        </div>
      </div>
    </article>`;
}

function renderGrid(containerEl, htmlString) {
  containerEl.setAttribute('aria-busy', 'false');
  containerEl.innerHTML = htmlString;
}

function renderError(containerEl, message) {
  containerEl.setAttribute('aria-busy', 'false');
  containerEl.innerHTML = `
    <div class="error-state" role="alert" aria-live="assertive">
      <span class="error-state__icon" aria-hidden="true">⚠</span>
      <p>${escapeHTML(message)}</p>
      <p class="error-state__msg mono">Check that projects.json exists and is valid JSON.</p>
    </div>`;
}

function animateCards(containerEl) {
  const cards = containerEl.querySelectorAll('[data-index]');
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 70}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => card.classList.add('visible'));
    });
  });
}

function hydrateFooter(meta) {
  const githubEl = $('footer-github');
  const h1El     = $('footer-h1');
  const emailEl  = $('footer-email');
  const locEl    = $('footer-location');
  const nameEl   = $('footer-name');

  if (githubEl) { githubEl.href = meta.github; githubEl.textContent = meta.github.replace('https://', ''); }
  if (h1El)     { h1El.href = meta.hackerone; h1El.textContent = meta.hackerone.replace('https://', ''); }
  if (emailEl)  { emailEl.href = `mailto:${meta.email}`; emailEl.textContent = meta.email; }
  if (locEl)    { locEl.textContent = meta.location; }
  if (nameEl)   { nameEl.textContent = meta.owner; }
}

function hydrateHero(data) {
  const statProjects = $('stat-projects');
  const statFindings = $('stat-findings');
  const statusText   = $('nav-status-text');

  const totalProjects = (data.web?.length ?? 0) + (data.iot?.length ?? 0);
  const totalFindings = data.security?.length ?? 0;

  if (statProjects) statProjects.textContent = totalProjects;
  if (statFindings) statFindings.textContent = totalFindings;
  if (statusText)   statusText.textContent   = 'System Online';
}

function setupScrollNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

function setupIntersectionReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -32px 0px' }
  );

  document.querySelectorAll('.section__head').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          io.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
  });
}

async function bootstrap() {
  setupScrollNav();

  const webGrid = $('web-grid');
  const iotGrid = $('iot-grid');
  const secGrid = $('sec-grid');

  let data;

  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    data = await response.json();

  } catch (err) {
    [webGrid, iotGrid, secGrid].forEach((el) => {
      if (el) renderError(el, `Failed to load data — ${err.message}`);
    });

    const statusText = $('nav-status-text');
    if (statusText) statusText.textContent = 'Data Error';
    return;
  }

  if (data.meta) hydrateFooter(data.meta);
  hydrateHero(data);

  if (webGrid && Array.isArray(data.web)) {
    const html = data.web.map((p, i) => buildWebCard(p, i)).join('');
    renderGrid(webGrid, html);
    animateCards(webGrid);
  }

  if (iotGrid && Array.isArray(data.iot)) {
    const html = data.iot.map((p, i) => buildIoTCard(p, i)).join('');
    renderGrid(iotGrid, html);
    animateCards(iotGrid);
  }

  if (secGrid && Array.isArray(data.security)) {
    const html = data.security.map((p, i) => buildSecCard(p, i)).join('');
    renderGrid(secGrid, html);
    animateCards(secGrid);
  }

  setupIntersectionReveal();
}

document.addEventListener('DOMContentLoaded', bootstrap);
