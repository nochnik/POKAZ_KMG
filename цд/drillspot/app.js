'use strict';

(() => {
  const query = (selector, parent = document) => parent.querySelector(selector);
  const queryAll = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const app = query('#app');
  const menu = query('#popup-menu');
  const state = { domain: 'Time', window: 'Demo', well: '2793', metric: 'Hole Depth', onlyOpen: false, hiddenTraces: new Set(), openWindows: ['Demo', '3D 4 Nurlan'] };
  let notificationTimer;
  let lastMenuTrigger;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createIcon(title, className = '') {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', `icon ${className}`);
    icon.setAttribute('aria-hidden', 'true');
    const reference = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    reference.setAttribute('href', `#${title}`);
    icon.append(reference);
    return icon;
  }

  function populateTrees() {
    const windows = query('#project-windows');
    screenData.windows.forEach((title, index) => {
      const button = createElement('button', 'tree-row window-row');
      button.dataset.window = title;
      button.title = title;
      button.append(createIcon('window'), createElement('span', 'name', title));
      if (index < 5 || index > 8) button.append(createIcon('users', 'shared'));
      windows.append(button);
    });

    screenData.wells.forEach((title, index) => {
      const button = createElement('button', 'tree-row well-row');
      button.dataset.well = title;
      button.title = title;
      button.setAttribute('aria-pressed', 'false');
      button.append(createIcon('chevron', 'branch-chevron'), createElement('span', 'well-selector'), createIcon(index === 0 ? 'folder' : 'well'), createElement('span', 'name', title));
      query('#project-wells').append(button);
    });

    screenData.groups.forEach((title) => {
      const row = createElement('label', 'tree-row group-row');
      const checkbox = createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.group = title;
      checkbox.setAttribute('aria-label', title);
      row.title = title;
      row.append(checkbox, createElement('span', 'trace-symbol', title === 'Erratic Torque' ? '⚠' : 'ξ'), createElement('span', 'name', title), createElement('span', 'group-badges', 'TD'));
      query('#group-list').append(row);
    });
  }

  function populateTracks() {
    const headers = query('#track-headers');
    const activities = createElement('div', 'track-heading');
    screenData.activities.forEach((name) => activities.append(createElement('span', 'activity-label', name)));
    headers.append(activities);

    screenData.tracks.forEach((traces) => {
      const header = createElement('div', 'track-heading');
      traces.forEach((trace) => {
        const button = createElement('button', `trace-label${trace.line === 'none' && trace.light ? ' dark' : ''}`, trace.label);
        button.style.backgroundColor = trace.color;
        if (trace.light) button.style.color = '#e0e5ea';
        button.dataset.trace = trace.name;
        button.title = trace.name;
        button.setAttribute('aria-pressed', 'true');
        button.append(createElement('small', '', trace.name === 'Total Gas' ? '0 — 0' : '—'));
        header.append(button);
      });
      headers.append(header);
    });
  }

  function drawSpatialGrid() {
    const grid = query('#spatial-grid');
    const addLine = (coordinates, primary = false) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', coordinates);
      line.setAttribute('stroke', primary ? '#3d5060' : '#304453');
      line.setAttribute('stroke-width', primary ? '3' : '1');
      line.setAttribute('opacity', primary ? '.55' : '.35');
      line.setAttribute('fill', 'none');
      grid.append(line);
    };
    // Только плоская сетка места под будущий 3D-виджет; сцена здесь не создаётся.
    for (let step = -6; step < 15; step += 1) {
      const height = step * 85;
      addLine(`M70 ${height + 275} 420 ${height + 25} 1025 ${height + 455}`);
    }
    for (let step = 0; step <= 11; step += 1) {
      const x = 70 + step * 86.8;
      const top = x < 420 ? 25 + (420 - x) * .715 : 25 + (x - 420) * .711;
      addLine(`M${x} ${top - 200}V955`);
    }
    addLine('M70 275 420 25 1025 455', true);
    addLine('M420 25V720');
    addLine('M70 955 420 720 750 955');
  }

  function prepareCanvas(canvas) {
    const { width: width, height: height } = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext('2d');
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    return { context, width, height };
  }

  function drawOverview() {
    const { context, width, height } = prepareCanvas(query('#overview'));
    if (!width || !height) return;
    const controlPoints = [[.03, 0], [.39, .09], [.41, .31], [.03, .31], [.03, .43], [.64, .82], [.92, .90], [.06, .915], [.1, .93], [.92, .94], [.12, .96], [.72, .97], [.16, .99]];
    context.beginPath();
    context.moveTo(0, 0);
    controlPoints.forEach(([widthRatio, heightRatio], index) => {
      const previous = controlPoints[Math.max(0, index - 1)];
      for (let step = 1; step <= 18; step += 1) {
        const ratio = step / 18;
        const noise = Math.sin((index * 18 + step) * 7.3) * .009;
        context.lineTo((previous[0] + (widthRatio - previous[0]) * ratio + noise) * width, (previous[1] + (heightRatio - previous[1]) * ratio) * height);
      }
    });
    context.lineTo(0, height);
    context.closePath();
    context.fillStyle = '#71809250';
    context.fill();
    context.strokeStyle = '#8298a8';
    context.lineWidth = .8;
    context.stroke();
    context.fillStyle = '#263a4bb0';
    context.fillRect(0, height - 7, width, 7);
    context.fillStyle = '#668197';
    context.fillRect(width * .15, height - 5, width * .6, 3);
  }

  function getTraceOffset(view, step) {
    const noise = Math.sin(step * 15.71) * .005 + Math.cos(step * 4.23) * .007;
    switch (view) {
      case 'steps': return .3 + (Math.sin(step * .19) > .75 ? -.25 : .13) + (Math.floor(step / 120) % 2 ? -.06 : .03) + noise;
      case 'load': return .28 + Math.sin(step * .012) * .03 + (Math.sin(step * .19) > .9 ? .19 : 0) + noise;
      case 'zero': return .01;
      case 'speed': return .20;
      case 'torque': return .005;
      case 'flow': return .005;
      case 'pressure': return .36 + noise * .06;
      case 'gamma': return .015;
      case 'gas': return .02 + noise * .22;
      case 'volume': return .5 + noise * .12;
      default: return 0;
    }
  }

  function drawCharts() {
    const { context, width, height } = prepareCanvas(query('#charts'));
    if (!width || !height) return;
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const trackWidth = width / 7;
    const gridStep = 1.25 * fontSize;
    context.fillStyle = '#192b39';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#bb8c1c';
    context.fillRect(0, 0, trackWidth - fontSize * .3, height);
    context.fillStyle = '#c79525';
    context.fillRect(0, height * .075, trackWidth - fontSize * .3, height * .075);
    context.fillRect(0, height * .245, trackWidth - fontSize * .3, height * .24);
    for (let row = 0; row <= height / gridStep; row += 1) {
      context.beginPath();
      context.strokeStyle = row % 5 === 3 ? '#62748790' : '#53647765';
      context.lineWidth = row % 5 === 3 ? 2 : .8;
      context.moveTo(trackWidth, row * gridStep);
      context.lineTo(width, row * gridStep);
      context.stroke();
    }
    for (let column = 1; column <= 7; column += 1) {
      context.strokeStyle = '#7791a34d';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(column * trackWidth, 0);
      context.lineTo(column * trackWidth, height);
      context.stroke();
      context.strokeStyle = '#53647742';
      context.beginPath();
      context.moveTo((column + .5) * trackWidth, 0);
      context.lineTo((column + .5) * trackWidth, height);
      context.stroke();
    }
    screenData.tracks.forEach((traces, trackIndex) => {
      traces.forEach((trace) => {
        if (trace.line === 'none' || state.hiddenTraces.has(trace.name)) return;
        context.beginPath();
        context.strokeStyle = trace.color;
        context.lineWidth = Math.max(.8, fontSize * .09);
        for (let step = 0; step <= 900; step += 1) {
          const ratio = step / 900;
          const x = (trackIndex + 1 + getTraceOffset(trace.line, step)) * trackWidth + fontSize * .12;
          const y = ratio * height;
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      });
    });
    updateScale();
  }

  function updateScale() {
    const labels = query('#time-labels');
    labels.replaceChildren();
    for (let index = 0; index < 7; index += 1) {
      const minutes = 45 + index * 15;
      const label = state.domain === 'Time' ? `${16 + Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}` : (696.6 + index * 3.5).toFixed(1);
      const marker = createElement('span', 'time-marker', label);
      marker.style.top = `${8 + index * 13.8}%`;
      labels.append(marker);
    }
  }

  function selectWindow(title) {
    if (!state.openWindows.includes(title)) {
      state.openWindows.push(title);
      const tab = createElement('button', 'tab');
      tab.dataset.window = title;
      tab.setAttribute('role', 'tab');
      tab.append(createIcon('users'), createElement('span', '', title));
      query('#tabs').insertBefore(tab, query('.add-window'));
    }
    state.window = title;
    queryAll('.tab').forEach((tab) => {
      const selected = tab.dataset.window === title;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    queryAll('.window-row').forEach((row) => row.classList.toggle('selected', row.dataset.window === title));
    query('#workspace-window').setAttribute('aria-label', title);
    filterTrees();
    closeMenu();
    if (title !== 'Demo') showNotification(`${title} · демонстрационная компоновка`);
  }

  function selectWell(wellNumber) {
    state.well = wellNumber;
    queryAll('.well-number').forEach((element) => { element.textContent = wellNumber; });
    queryAll('.well-row').forEach((element) => {
      const selected = element.dataset.well === wellNumber;
      element.classList.toggle('selected', selected);
      element.setAttribute('aria-pressed', String(selected));
    });
    document.title = `${wellNumber} · DrillSpot`;
    closeMenu();
    if (wellNumber !== '2793') showNotification('Скважина выбрана. Показатели сохранены из демонстрационного экрана 2793.');
  }

  function selectMetric(title) {
    state.metric = title;
    query('#trace-title').textContent = title;
    queryAll('[data-metric]').forEach((card) => {
      const selected = card.dataset.metric === title;
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-pressed', String(selected));
      if (selected) card.prepend(query('.widget-label'));
    });
    closeMenu();
  }

  function filterTrees() {
    const searchTerm = query('#search').value.trim().toLocaleLowerCase();
    queryAll('.tree-row').forEach((row) => {
      const matches = row.textContent.toLocaleLowerCase().includes(searchTerm);
      const allowed = !state.onlyOpen || !row.dataset.window || state.openWindows.includes(row.dataset.window);
      row.hidden = !matches || !allowed;
    });
  }

  function showNotification(text) {
    const notification = query('#notification');
    clearTimeout(notificationTimer);
    notification.textContent = text;
    notification.hidden = false;
    notificationTimer = setTimeout(() => { notification.hidden = true; }, 3500);
  }

  function closeMenu() {
    menu.hidden = true;
    lastMenuTrigger?.setAttribute('aria-expanded', 'false');
  }

  function openMenu(button) {
    if (!menu.hidden && lastMenuTrigger === button) return closeMenu();
    closeMenu();
    lastMenuTrigger = button;
    button.setAttribute('aria-expanded', 'true');
    menu.replaceChildren();
    const addMenuItem = (label, action) => {
      const item = createElement('button', '', label);
      item.addEventListener('click', action);
      menu.append(item);
    };
    switch (button.dataset.menu) {
      case 'windows': screenData.windows.forEach((name) => addMenuItem(name, () => selectWindow(name))); break;
      case 'wells': [...new Set(screenData.wells)].forEach((name) => addMenuItem(name, () => selectWell(name))); break;
      case 'traces': ['Hole Depth', 'Total Gas', 'WOB'].forEach((name) => addMenuItem(name, () => selectMetric(name))); break;
      case 'projects': addMenuItem('✓ East Moldabek', closeMenu); break;
      case 'rigs': addMenuItem('✓ No assigned Rig', closeMenu); break;
      case 'settings': addMenuItem('Reset layout', () => {
        app.classList.remove('ribbon-collapsed', 'sidebar-collapsed');
        query('#collapse-sidebar').setAttribute('aria-expanded', 'true');
        query('#collapse-ribbon').setAttribute('aria-expanded', 'true');
        query('#collapse-ribbon').firstChild.textContent = 'Collapse menu ';
        closeMenu();
      }); break;
      default: menu.append(createElement('p', '', 'Локальная копия интерфейса DrillSpot. Внешние сервисы не подключены.'));
    }
    menu.hidden = false;
    const bounds = button.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(bounds.left, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.min(bounds.bottom + 4, innerHeight - menu.offsetHeight - 8)}px`;
  }

  function selectSection(title) {
    queryAll('[data-section]').forEach((button) => {
      button.classList.toggle('active', button.dataset.section === title);
      button.setAttribute('aria-pressed', String(button.dataset.section === title));
    });
    query('#numeral-settings').hidden = title !== 'NUMERAL';
    const tools = query('#other-tools');
    tools.hidden = title === 'NUMERAL';
    tools.replaceChildren();
    if (title === 'NUMERAL') return;
    const options = title === 'WINDOW' ? ['Add window', 'Reset layout'] : title === 'WELL FORMAT' ? ['Well color', 'Line width', 'Show labels'] : ['Calculator'];
    options.forEach((label) => {
      const button = createElement('button', '', label);
      button.addEventListener('click', () => {
        if (label === 'Add window') { button.dataset.menu = 'windows'; openMenu(button); }
        else if (label === 'Reset layout') { button.dataset.menu = 'settings'; openMenu(button); }
        else showNotification('Этот инструмент будет подключён на следующем этапе.');
      });
      tools.append(button);
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!menu.contains(event.target) && !button?.hasAttribute('data-menu')) closeMenu();
    if (!button) return;
    if (button.dataset.menu) openMenu(button);
    if (button.dataset.window) selectWindow(button.dataset.window);
    if (button.dataset.well) selectWell(button.dataset.well);
    if (button.dataset.metric) selectMetric(button.dataset.metric);
    if (button.dataset.section) selectSection(button.dataset.section);
    if (button.dataset.tree) {
      const content = document.getElementById(button.dataset.tree);
      content.hidden = !content.hidden;
      button.setAttribute('aria-expanded', String(!content.hidden));
      if (button.closest('.tree-heading')) button.closest('.tree-section').classList.toggle('collapsed', content.hidden);
    }
    if (button.dataset.domain) {
      state.domain = button.dataset.domain;
      queryAll('[data-domain]').forEach((element) => {
        const selected = element.dataset.domain === state.domain;
        element.classList.toggle('selected', selected);
        element.setAttribute('aria-pressed', String(selected));
      });
      updateScale();
    }
    if (button.dataset.trace) {
      const name = button.dataset.trace;
      if (state.hiddenTraces.has(name)) state.hiddenTraces.delete(name);
      else state.hiddenTraces.add(name);
      button.style.opacity = state.hiddenTraces.has(name) ? '.4' : '1';
      button.setAttribute('aria-pressed', String(!state.hiddenTraces.has(name)));
      drawCharts();
    }
  });

  query('#collapse-ribbon').addEventListener('click', (event) => {
    const isCollapsed = app.classList.toggle('ribbon-collapsed');
    event.currentTarget.setAttribute('aria-expanded', String(!isCollapsed));
    event.currentTarget.firstChild.textContent = isCollapsed ? 'Expand menu ' : 'Collapse menu ';
  });
  query('#collapse-sidebar').addEventListener('click', (event) => {
    const isCollapsed = app.classList.toggle('sidebar-collapsed');
    event.currentTarget.setAttribute('aria-expanded', String(!isCollapsed));
    event.currentTarget.setAttribute('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  });
  query('#window-filter').addEventListener('click', (event) => {
    state.onlyOpen = !state.onlyOpen;
    event.currentTarget.setAttribute('aria-pressed', String(state.onlyOpen));
    filterTrees();
  });
  query('#search').addEventListener('input', filterTrees);
  query('#last-points').addEventListener('input', (event) => {
    const count = Number(event.target.value);
    event.target.setAttribute('aria-valuetext', `${count} last points`);
    query('#depth-value').textContent = count === 1 ? '721.1' : ['721.1', '706.0', '696.6'].slice(0, Math.min(count, 3)).join('\n');
    query('#depth-value').style.whiteSpace = 'pre-line';
  });
  query('#group-list').addEventListener('change', (event) => {
    if (!event.target.matches('input')) return;
    const name = event.target.dataset.group;
    event.target.closest('label').classList.toggle('selected', event.target.checked);
    showNotification(`${name} ${event.target.checked ? 'selected' : 'unselected'}`);
  });
  query('#chart-area').addEventListener('pointermove', (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    const cursor = query('#chart-cursor');
    const minutes = Math.round(16 * 60 + 36 + ratio * 110);
    cursor.hidden = false;
    cursor.style.top = `${ratio * 100}%`;
    query('span', cursor).textContent = state.domain === 'Time' ? `30 Apr · ${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}` : `${(696.6 + ratio * 24.5).toFixed(1)} m`;
  });
  query('#chart-area').addEventListener('pointerleave', () => { query('#chart-cursor').hidden = true; });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeMenu(); lastMenuTrigger?.focus(); }
    if (event.target.matches('.tab') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const tabs = queryAll('.tab');
      const index = tabs.indexOf(event.target);
      const nextTab = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectWindow(nextTab.dataset.window);
      nextTab.focus();
    }
  });
  window.addEventListener('resize', closeMenu);

  populateTrees();
  populateTracks();
  drawSpatialGrid();
  // Размеры холстов зависят от доступного места, в том числе после сворачивания панелей.
  const resizeObserver = new ResizeObserver(() => { drawCharts(); drawOverview(); });
  resizeObserver.observe(query('#chart-area'));
  resizeObserver.observe(query('.mini-chart'));
})();
