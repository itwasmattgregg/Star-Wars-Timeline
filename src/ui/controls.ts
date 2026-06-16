import {
  TIMELINE_EVENTS,
  TYPE_LABELS,
  TYPE_COLORS,
  ERA_CONFIG,
  formatYear,
  getSortedEvents,
  type TimelineEvent,
  type MediaType,
  type Era,
} from '../data/timeline';
import type { TimelineScene } from '../scene/TimelineScene';

export function initUI(scene: TimelineScene): void {
  const panel = document.getElementById('detail-panel')!;
  const panelContent = document.getElementById('panel-content')!;
  const closeBtn = document.getElementById('close-panel')!;
  const searchInput = document.getElementById('search') as HTMLInputElement;
  const searchResults = document.getElementById('search-results')!;
  const typeFilters = document.getElementById('type-filters')!;
  const eraLegend = document.getElementById('era-legend')!;
  const currentEra = document.getElementById('current-era')!;
  const currentYear = document.getElementById('current-year')!;
  const rulerMarker = document.getElementById('ruler-marker')!;
  const rulerLabels = document.getElementById('ruler-labels')!;
  const loading = document.getElementById('loading')!;
  const hoverTooltip = document.getElementById('hover-tooltip')!;
  const controlsLegend = document.getElementById('controls-legend')!;

  const activeTypes = new Set<MediaType>([
    'film',
    'series',
    'game',
    'lore',
    'comic',
    'book',
  ]);

  // Hide loading
  setTimeout(() => loading.classList.add('hidden'), 800);

  initControlsLegend(controlsLegend);

  // Era legend — click to focus
  for (const [eraKey, config] of Object.entries(ERA_CONFIG)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'era-chip';
    chip.dataset.era = eraKey;
    chip.style.setProperty('--era-color', config.color);
    chip.textContent = config.label;
    chip.title = `Focus ${config.label}`;
    chip.addEventListener('click', () => {
      scene.focusEra(eraKey as Era);
      eraLegend.querySelectorAll('.era-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
    eraLegend.appendChild(chip);
  }

  eraLegend.querySelector('[data-era="empire"]')?.classList.add('active');

  // Type filters
  const types: MediaType[] = ['film', 'series', 'game', 'lore', 'comic', 'book'];
  for (const type of types) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn active';
    btn.dataset.type = type;
    btn.style.setProperty('--type-color', TYPE_COLORS[type]);
    btn.innerHTML = `<span class="filter-dot"></span>${TYPE_LABELS[type]}`;
    btn.addEventListener('click', () => {
      if (activeTypes.has(type)) {
        if (activeTypes.size > 1) {
          activeTypes.delete(type);
          btn.classList.remove('active');
        }
      } else {
        activeTypes.add(type);
        btn.classList.add('active');
      }
      scene.setTypeFilter(new Set(activeTypes));
    });
    typeFilters.appendChild(btn);
  }

  // Ruler labels
  const rulerYears = [-25000, -5000, -1000, -32, -19, 0, 4, 34];
  for (const year of rulerYears) {
    const label = document.createElement('span');
    label.textContent = formatYear(year).replace(' (Battle of Yavin)', '');
    rulerLabels.appendChild(label);
  }

  function showPanel(event: TimelineEvent): void {
    const eraConfig = ERA_CONFIG[event.era as Era];
    const connections = event.connections
      ?.map((id) => TIMELINE_EVENTS.find((e) => e.id === id))
      .filter(Boolean) as TimelineEvent[] | undefined;

    panelContent.innerHTML = `
      <div class="panel-type" style="--accent: ${event.color}">
        ${TYPE_LABELS[event.type]}${event.canon ? ` · ${event.canon === 'legends' ? 'Legends' : event.canon === 'both' ? 'Canon & Legends' : 'Canon'}` : ''}
      </div>
      <h2>${event.title}</h2>
      <p class="panel-tagline">"${event.tagline}"</p>
      <div class="panel-meta">
        <span class="meta-year">${formatYear(event.year)}</span>
        <span class="meta-era" style="color: ${eraConfig?.color ?? '#fff'}">${eraConfig?.label ?? event.era}</span>
        ${event.releaseYear ? `<span class="meta-release">Released ${event.releaseYear}</span>` : ''}
      </div>
      <div class="panel-section">
        <h3>Overview</h3>
        <p>${event.description}</p>
      </div>
      <div class="panel-section lore-section">
        <h3>Deep Lore</h3>
        <p>${event.lore}</p>
      </div>
      ${
        connections && connections.length > 0
          ? `<div class="panel-section">
        <h3>Connected Events</h3>
        <div class="connections">
          ${connections
            .map(
              (c) =>
                `<button class="connection-btn" data-id="${c.id}" style="--accent: ${c.color}">${c.title}</button>`
            )
            .join('')}
        </div>
      </div>`
          : ''
      }
    `;

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');

    panelContent.querySelectorAll('.connection-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        scene.selectById(id);
      });
    });
  }

  function hidePanel(): void {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  closeBtn.addEventListener('click', hidePanel);

  scene.onSelect = (event: TimelineEvent | null) => {
    if (event) showPanel(event);
    else hidePanel();
  };

  scene.onHover = (event: TimelineEvent | null) => {
    if (event) {
      hoverTooltip.hidden = false;
      hoverTooltip.innerHTML = `<span class="tt-year">${formatYear(event.year)}</span> ${event.title}`;
    } else {
      hoverTooltip.hidden = true;
    }
  };

  document.addEventListener('mousemove', (e) => {
    if (hoverTooltip.hidden) return;
    hoverTooltip.style.left = `${e.clientX + 16}px`;
    hoverTooltip.style.top = `${e.clientY - 10}px`;
  });

  scene.onYearChange = (year: number, era: string) => {
    currentEra.textContent = era;
    currentYear.textContent = formatYear(year);

    // Update ruler marker position
    const sorted = getSortedEvents();
    const minYear = sorted[0].year;
    const maxYear = sorted[sorted.length - 1].year;
    const t = (year - minYear) / (maxYear - minYear);
    rulerMarker.style.left = `${Math.max(0, Math.min(100, t * 100))}%`;
  };

  // Search
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) {
      searchResults.hidden = true;
      return;
    }

    const matches = TIMELINE_EVENTS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.tagline.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.lore.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No entries in the archives</p>';
    } else {
      searchResults.innerHTML = matches
        .map(
          (e) =>
            `<button class="search-item" data-id="${e.id}">
          <span class="search-type" style="color: ${e.color}">${TYPE_LABELS[e.type]}</span>
          <span class="search-title">${e.title}</span>
          <span class="search-year">${formatYear(e.year)}</span>
        </button>`
        )
        .join('');
    }
    searchResults.hidden = false;

    searchResults.querySelectorAll('.search-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        scene.selectById(id);
        searchInput.value = '';
        searchResults.hidden = true;
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.search-wrap')) {
      searchResults.hidden = true;
    }
  });

  // Nav controls
  document.getElementById('btn-play')!.addEventListener('click', () => {
    scene.toggleFly();
  });

  scene.onFlyActiveChange = (active) => {
    document.getElementById('btn-play')!.classList.toggle('active-fly', active);
  };
  document.getElementById('btn-next')!.addEventListener('click', () => scene.flyNext());
  document.getElementById('btn-prev')!.addEventListener('click', () => scene.flyPrev());
  document.getElementById('btn-reset')!.addEventListener('click', () => scene.resetCamera());

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    switch (e.key) {
      case 'ArrowRight':
        scene.flyNext();
        break;
      case 'ArrowLeft':
        scene.flyPrev();
        break;
      case ' ':
        e.preventDefault();
        scene.toggleFly();
        break;
      case 'Escape':
        hidePanel();
        scene.resetCamera();
        break;
    }
  });
}

function initControlsLegend(container: HTMLElement): void {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const modKey = isMac ? '⌘' : 'Ctrl';

  const items = [
    { keys: 'Scroll', action: 'Zoom' },
    { keys: 'Drag', action: 'Orbit' },
    { keys: `${modKey} + Drag`, action: 'Strafe' },
    { keys: 'Click', action: 'Select event' },
    { keys: '← →', action: 'Navigate' },
    { keys: 'Space', action: 'Fly mode' },
  ];

  container.innerHTML = items
    .map(
      ({ keys, action }) =>
        `<span class="legend-item"><kbd>${keys}</kbd> ${action}</span>`
    )
    .join('');
}
