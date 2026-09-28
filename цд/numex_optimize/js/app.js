// Главная точка входа приложения Nedra.NUMEX Optimize v2.4
(function(window) {
  'use strict';

  function initApp() {
    const points = window.POINTS_DATA || [];
    const wells = window.WELLS_DATA || [];
    const queue = window.QUEUE_DATA || [];
    const results = window.RESULTS_DATA || [];
    const tornado = window.TORNADO_DATA || [];

    const fnInitChart = window.initChart;
    const fnInitTabsRouter = window.initTabsRouter;
    const fnInitUiControls = window.initUiControls;
    const fnSwitchTab = window.switchTab;

    // 1. Заполнение таблицы скважин
    renderWellsTable(wells);

    // 2. Заполнение таблицы очереди расчетов
    renderQueueTable(queue);

    // 3. Заполнение таблицы результатов
    renderResultsTable(results);

    // 4. Заполнение торнадо-диаграммы чувствительности
    renderTornadoView(tornado);

    // 5. Инициализация роутера вкладок
    if (typeof fnInitTabsRouter === 'function') {
      fnInitTabsRouter();
    }

    // 6. Инициализация интерактивных элементов UI
    if (typeof fnInitUiControls === 'function') {
      fnInitUiControls();
    }

    // 7. Инициализация графика сходимости (180 точек)
    if (typeof fnInitChart === 'function') {
      fnInitChart('нумекс-график-контейнер', 'нумекс-svg-график', points);
    }

    // Инициализация активной вкладки (по URL hash или по умолчанию dashboard)
    const initialHash = window.location.hash.replace('#', '');
    if (['wells', 'queue', 'results', 'dashboard', 'tornado'].includes(initialHash)) {
      if (typeof fnSwitchTab === 'function') fnSwitchTab(initialHash);
    } else {
      if (typeof fnSwitchTab === 'function') fnSwitchTab('dashboard');
    }

    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '');
      if (['wells', 'queue', 'results', 'dashboard', 'tornado'].includes(newHash)) {
        if (typeof fnSwitchTab === 'function') fnSwitchTab(newHash);
      }
    });
  }

function renderWellsTable(data) {
  const tbody = document.getElementById('таблица-скважин-тело');
  if (!tbody || !data) return;

  tbody.innerHTML = data.map((row, idx) => {
    const isFirst = idx === 0;
    const wellCell = isFirst
      ? `<span class="нумекс-дерево-стрелка">▸</span><span class="нумекс-скв-номер ячейка-фокус">${row.well}</span>`
      : `<span class="нумекс-дерево-стрелка">▸</span><span class="нумекс-скв-номер">${row.well}</span>`;

    return `
      <tr>
        <td>${wellCell}</td>
        <td>${row.date}</td>
        <td>
          <span class="нумекс-знач-базовое">${row.from}</span>
          <span class="нумекс-стрелка-перехода">→</span>
          <span class="нумекс-знач-целевое">${row.to}</span>
        </td>
        <td>
          <span class="нумекс-знач-базовое">${row.rateFrom}</span>
          <span class="нумекс-стрелка-перехода">→</span>
          <span class="нумекс-знач-целевое">${row.rateTo}</span>
        </td>
        <td>
          <span class="нумекс-знач-базовое">${row.pFrom}</span>
          <span class="нумекс-стрелка-перехода">→</span>
          <span class="нумекс-знач-целевое">${row.pTo}</span>
        </td>
        <td style="color:#64748b;">${row.dP || ''}</td>
        <td>
          <span class="нумекс-знач-базовое">${row.kFrom}</span>
          <span class="нумекс-стрелка-перехода">→</span>
          <span class="нумекс-знач-целевое">${row.kTo}</span>
        </td>
        <td>${row.action || ''}</td>
        <td>${row.event || ''}</td>
      </tr>
    `;
  }).join('');
}

function renderQueueTable(data) {
  const tbody = document.getElementById('таблица-очереди-тело');
  if (!tbody || !data) return;

  tbody.innerHTML = data.map((row, idx) => {
    const isIdFocused = idx === 0 ? ' class="ячейка-фокус-очередь"' : '';
    return `
      <tr>
        <td${isIdFocused}>${row.id}</td>
        <td>${row.startTime}</td>
        <td>${row.status}</td>
        <td>${row.duration}</td>
        <td>${row.node}</td>
        <td>${row.result}</td>
        <td></td>
      </tr>
    `;
  }).join('');
}

function renderResultsTable(data) {
  const tbody = document.getElementById('таблица-результатов-тело');
  if (!tbody || !data) return;

  tbody.innerHTML = data.map((row, idx) => {
    const isModelFocused = idx === 0 ? ' class="ячейка-фокус-результат"' : '';
    const isWaterSelected = idx === 1 ? ' class="ячейка-выбрана-результат"' : '';

    return `
      <tr>
        <td${isModelFocused}>${row.model}</td>
        <td>${row.result}</td>
        <td>${row.oil}</td>
        <td${isWaterSelected}>${row.water}</td>
        <td>${row.liquid}</td>
        <td>${row.gas}</td>
        <td>${row.injWater}</td>
        <td>${row.injGas}</td>
        <td>${row.actInj}</td>
        <td>${row.actGn}</td>
        <td>${row.actProd}</td>
        <td>${row.newWells}</td>
        <td>${row.bdToInj}</td>
        <td>${row.bdToProd}</td>
        <td>${row.transfers}</td>
        <td>${row.discOil}</td>
      </tr>
    `;
  }).join('');
}

function renderTornadoView(data) {
  const container = document.getElementById('торнадо-диаграмма-контент');
  if (!container || !data) return;

  const maxVal = 25; // шкала +/- 25%
  container.innerHTML = data.map(item => {
    const negWidth = (Math.abs(item.neg) / maxVal) * 50;
    const posWidth = (item.pos / maxVal) * 50;

    return `
      <div class="нумекс-торнадо-полоса">
        <div class="нумекс-торнадо-метка">${item.name}</div>
        <div class="нумекс-торнадо-график-бар">
          <div class="нумекс-торнадо-ось"></div>
          <div class="нумекс-торнадо-отриц" style="width: ${negWidth}%;"></div>
          <div class="нумекс-торнадо-полож" style="width: ${posWidth}%;"></div>
        </div>
        <div style="font-size:11px; width:90px; color:#64748b;">
          ${item.neg}% / +${item.pos}%
        </div>
      </div>
    `;
  }).join('');
}

  // Экспорт в глобальное окно
  window.initApp = initApp;

  // Надежный запуск: если DOM уже готов — запускаем сразу, иначе вешаем на DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})(typeof window !== 'undefined' ? window : this);

