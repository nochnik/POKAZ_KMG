// Модуль интерактивных элементов UI: выпадающие меню, выбор ячеек, таблицы, тултипы
(function(window) {
  'use strict';

  let activeOpenMenu = null;

  function initUiControls() {
    initDropdownMenus();
    initTableInteractions();
    initSidebarTooltips();
    initWindowButtons();
    initSidebarSync();
    initChartSelectors();
  }

// 1. Верхнее меню Windows (Файл, Проект, Стоимости, Экономика, Помощь)
function initDropdownMenus() {
  const menuButtons = document.querySelectorAll('.нумекс-меню-пункт');
  const allDropdowns = document.querySelectorAll('.нумекс-выпадающее-меню');

  const closeAllMenus = () => {
    menuButtons.forEach(btn => btn.classList.remove('активен'));
    allDropdowns.forEach(menu => menu.classList.remove('показано'));
    activeOpenMenu = null;
  };

  menuButtons.forEach(btn => {
    const parent = btn.closest('.нумекс-меню-контейнер');
    const dropdown = parent ? parent.querySelector('.нумекс-выпадающее-меню') : null;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeOpenMenu === dropdown) {
        closeAllMenus();
      } else {
        closeAllMenus();
        if (dropdown) {
          btn.classList.add('активен');
          dropdown.classList.add('показано');
          activeOpenMenu = dropdown;
        }
      }
    });

    btn.addEventListener('mouseenter', () => {
      if (activeOpenMenu && activeOpenMenu !== dropdown && dropdown) {
        closeAllMenus();
        btn.classList.add('активен');
        dropdown.classList.add('показано');
        activeOpenMenu = dropdown;
      }
    });
  });

  // Закрытие меню при клике в любое место документа
  document.addEventListener('click', () => {
    if (activeOpenMenu) {
      closeAllMenus();
    }
  });

  // Обработка кликов внутри выпадающих меню
  document.querySelectorAll('.нумекс-меню-строка').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.classList.contains('disabled')) return;

      const action = item.getAttribute('data-action');
      handleMenuAction(action);
      closeAllMenus();
    });
  });

  // Поддержка прямого открытия меню через URL query param (?menu=file / ?menu=project / ?menu=costs / etc.)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const openParam = urlParams.get('menu');
    if (openParam) {
      const matchMap = {
        file: 'файл',
        project: 'проект',
        cost: 'стоимост',
        costs: 'стоимост',
        econ: 'эконом',
        help: 'помощ'
      };
      const query = (matchMap[openParam.toLowerCase()] || openParam).toLowerCase();
      menuButtons.forEach(btn => {
        if (btn.textContent.trim().toLowerCase().includes(query)) {
          const parent = btn.closest('.нумекс-меню-контейнер');
          const dropdown = parent ? parent.querySelector('.нумекс-выпадающее-меню') : null;
          if (dropdown) {
            btn.classList.add('активен');
            dropdown.classList.add('показано');
            activeOpenMenu = dropdown;
          }
        }
      });
    }
  } catch (e) {
    // Игнорируем ошибки URL
  }
}

function handleMenuAction(action) {
  const logContent = document.getElementById('лог-панель-контент');
  const timestamp = new Date().toLocaleTimeString();
  const doSwitch = (id) => {
    if (typeof window !== 'undefined' && typeof window.switchTab === 'function') {
      window.switchTab(id);
    }
  };

  switch (action) {
    case 'recalc-econ':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Выполняется пересчет экономических параметров модели (NPV, IRR, PI)...</div>`;
        logContent.innerHTML += `<div style="color:#16a34a;">[${timestamp}] Экономические параметры успешно актуализированы.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'revert-econ':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Возврат исходных экономических параметров выполнен.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'export-econ':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Экспорт экономических показателей в XLSX выполнен.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'import-econ':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Импорт профиля цен и затрат завершен.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'project-folder':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Папка проекта: C:\\Users\\testus1\\NUMEX\\5 объект КМГИ\\OptimA\\EMG_V2</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'clear-history':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] История расчетов оптимизации очищена. Текущие параметры сохранены.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'calc-base':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Запущен расчет базового варианта (base_5_OBJ)...</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'export-calc-info':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Экспортирована информация по 180 расчетным точкам в CSV.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'report-builder':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Запущен конструктор инженерных отчетов Nedra.NUMEX Report Builder.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'export-smspec':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Экспорт спецификации SMSPEC для гидродинамического симулятора завершен.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'export-results':
      doSwitch('results');
      break;
    case 'export-well-results':
      doSwitch('wells');
      break;
    case 'export-control':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Экспорт файла управления скважинами завершен.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'import-control':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Импорт технологических ограничений и режимов работы выполнен.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'export-detail-control':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Детальные параметры управления успешно выгружены.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'result-charts':
      doSwitch('dashboard');
      break;
    case 'cost-file':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Загружен файл стоимостей проекта (CAPEX/OPEX).</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'save-project':
      if (logContent) {
        logContent.innerHTML += `<div style="color:#16a34a;">[${timestamp}] Проект успешно сохранен в C:\\Users\\testus1\\NUMEX\\5 объект КМГИ\\OptimA\\EMG_V2</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'save-as':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Сохранение копии проекта...</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'close-project':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Закрытие проекта 5 объект КМГИ / EMG_V2...</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'license':
      alert('Лицензия: Nedra.NUMEX Optimize v2.4 Enterprise Edition\nВладелец: КМГИ (АО "КазМунайГаз")\nСрок действия: бессрочно.');
      break;
    case 'exit':
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Завершение работы с расчетным комплексом Nedra.NUMEX Optimize.</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
    case 'open-docs':
      alert('Nedra.NUMEX Optimize v2.4\nРуководство пользователя и инженерная документация модуля оптимизации разработки.');
      break;
    case 'feedback':
      alert('Служба технической поддержки: support@nedra.digital\nТелефон: +7 (7172) 78-60-00');
      break;
    case 'portal':
      alert('Портал самообслуживания и документации: https://portal.nedra.digital');
      break;
    default:
      if (logContent) {
        logContent.innerHTML += `<div>[${timestamp}] Выбрано действие: ${action || 'Действие'}</div>`;
        logContent.scrollTop = logContent.scrollHeight;
      }
      break;
  }
}

// 2. Интерактивность таблиц (выделение ячеек, выбор строк, раскрытие дерева)
function initTableInteractions() {
  // Выделение ячеек и строк в таблице Результатов
  const resultsTable = document.querySelector('#экран-results .нумекс-таблица');
  if (resultsTable) {
    resultsTable.addEventListener('click', (e) => {
      const td = e.target.closest('td');
      const tr = e.target.closest('tr');
      if (!td || !tr || td.tagName === 'TH') return;

      // Снимаем предыдущее выделение ячейки
      resultsTable.querySelectorAll('td.ячейка-выбрана').forEach(cell => cell.classList.remove('ячейка-выбрана'));
      // Выделяем кликнутую ячейку синим цветом как на видео
      td.classList.add('ячейка-выбрана');

      // Подсвечиваем строку
      resultsTable.querySelectorAll('tr.выбрана').forEach(row => row.classList.remove('выбрана'));
      tr.classList.add('выбрана');

      // Логируем в нижнюю панель
      const firstCol = tr.querySelector('td:first-child')?.textContent || '';
      updateBottomPanel('Результаты расчета', `Выбран вариант расчета: ${firstCol}\nЗначение параметра: ${td.textContent.trim()}`);
    });
  }

  // Таблица очереди расчетов
  const queueTable = document.querySelector('#экран-queue .нумекс-таблица');
  if (queueTable) {
    queueTable.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || tr.closest('thead')) return;

      queueTable.querySelectorAll('tr.выбрана').forEach(row => row.classList.remove('выбрана'));
      tr.classList.add('выбрана');

      const cells = tr.querySelectorAll('td');
      const id = cells[0]?.textContent || '';
      const status = cells[2]?.textContent || '';
      const time = cells[3]?.textContent || '';
      const node = cells[4]?.textContent || '';
      const res = cells[5]?.textContent || '';

      updateBottomPanel('Состояние расчета в очереди', `ID: ${id}\nСтатус: ${status}\nВремя расчета: ${time}\nВычислительный узел: ${node}\nРезультат целевой функции: ${res}`);
    });
  }

  // Таблица скважин
  const wellsTable = document.querySelector('#экран-wells .нумекс-таблица');
  if (wellsTable) {
    wellsTable.addEventListener('click', (e) => {
      const arrow = e.target.closest('.нумекс-дерево-стрелка');
      const tr = e.target.closest('tr');
      if (!tr || tr.closest('thead')) return;

      // Раскрытие дерева скважины
      if (arrow) {
        arrow.classList.toggle('раскрыто');
        const wellName = tr.querySelector('.нумекс-скв-номер')?.textContent || '';
        updateBottomPanel('Дерево объекта скважины', `Скважина №${wellName}: раскрыты технологические режимы пласта и интервалы перфорации.`);
        return;
      }

      wellsTable.querySelectorAll('tr.выбрана').forEach(row => row.classList.remove('выбрана'));
      tr.classList.add('выбрана');

      const wellNum = tr.querySelector('.нумекс-скв-номер')?.textContent || '';
      const state = tr.querySelector('.нумекс-скв-состояние')?.textContent || '';
      const rate = tr.querySelector('.нумекс-скв-дебит')?.textContent || '';
      const pres = tr.querySelector('.нумекс-скв-давление')?.textContent || '';

      updateBottomPanel('Параметры скважины', `Скважина №${wellNum}\nСостояние режима: ${state}\nДебит/Приемистость: ${rate}\nЗабойное давление: ${pres} атм\nОптимизационное ограничение: активный режим`);
    });
  }

  // Кнопки правого тулбара скважин
  document.querySelectorAll('.нумекс-правая-кнопка').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.нумекс-правая-кнопка').forEach(b => b.classList.remove('активная'));
      btn.classList.add('активная');
      const title = btn.getAttribute('title') || 'Инструмент';
      updateBottomPanel('Инструмент фильтрации', `Активирован фильтр таблицы скважин: ${title}`);
    });
  });
}

function updateBottomPanel(title, text) {
  const titleEl = document.getElementById('лог-панель-заголовок');
  const contentEl = document.getElementById('лог-панель-контент');
  if (titleEl) titleEl.textContent = title;
  if (contentEl) contentEl.textContent = text;
}

// 3. Левый вертикальный тулбар: кнопки пока ничего не делают, при нажатии чуть высвечиваются серым (фото 3)
function initSidebarTooltips() {
  const sidebarButtons = document.querySelectorAll('.нумекс-боковая-кнопка');

  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const wasActive = btn.classList.contains('активная');
      sidebarButtons.forEach(b => b.classList.remove('активная'));
      if (!wasActive) {
        btn.classList.add('активная');
      }
    });
  });
}

// 4. Кнопки окон Windows и RDP
function initWindowButtons() {
  document.querySelectorAll('.нумекс-кнопка-окна.нумекс-закрыть, .нумекс-подокно-крестик, .нумекс-rdp-кнопка.закрыть').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.__закрытьКонтент) {
        window.__закрытьКонтент();
      } else {
        console.log('NUMEX Optimize: закрытие окна');
      }
    });
  });

  const rdpPin = document.querySelector('.нумекс-rdp-пин');
  const rdpBar = document.querySelector('.нумекс-rdp-бар');
  if (rdpPin && rdpBar) {
    let pinned = true;
    rdpPin.addEventListener('click', () => {
      pinned = !pinned;
      rdpPin.style.opacity = pinned ? '1' : '0.4';
      rdpBar.style.transform = pinned ? 'translateX(-50%)' : 'translateX(-50%) translateY(-18px)';
    });
  }
}

// 5. Синхронизация высоты левой панели кнопок и подокна графика (график строго до последней иконки)
function initSidebarSync() {
  const sync = () => {
    const activeScreen = document.querySelector('.нумекс-экран.активен');
    if (!activeScreen || activeScreen.id !== 'экран-dashboard') return;

    const subwin = activeScreen.querySelector('.нумекс-подокно');
    const group = document.querySelector('.нумекс-боковые-кнопки-группа');
    const lastBtn = document.querySelector('.нумекс-боковые-кнопки-список .нумекс-боковая-кнопка:last-child');

    if (subwin && group && group.parentElement) {
      // 1. Выравниваем верхний край кнопок по верхнему краю подокна графика
      const winRect = subwin.getBoundingClientRect();
      const toolbarRect = group.parentElement.getBoundingClientRect();
      const topOffset = winRect.top - toolbarRect.top;
      group.style.marginTop = `${Math.max(0, topOffset)}px`;
      group.style.height = 'auto';

      // 2. Уменьшаем график до последней иконки: нижний край подокна строго на одном уровне с нижней границей 7-й иконки
      if (lastBtn) {
        const lastTarget = lastBtn.querySelector('svg') || lastBtn;
        const lastRect = lastTarget.getBoundingClientRect();
        const currentWinRect = subwin.getBoundingClientRect();
        const targetHeight = Math.round(lastRect.bottom - currentWinRect.top);
        if (targetHeight > 100) {
          subwin.style.height = `${targetHeight}px`;
          subwin.style.flex = '0 0 auto';
        }
      }
    }
  };

  window.syncNumexSidebar = sync;
  window.addEventListener('resize', sync);
  window.addEventListener('load', sync);

  // Слушаем смену вкладок
  document.querySelectorAll('.нумекс-вкладка').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(sync, 10);
      setTimeout(sync, 100);
    });
  });

  sync();
  setTimeout(sync, 50);
  setTimeout(sync, 250);
}


// 6. Выпадающие селекторы осей X и Y («Расчет» и «Целевая функция») 1-в-1 по скриншотам
function initChartSelectors() {
  const selects = document.querySelectorAll('.нумекс-кастомный-селект');
  if (!selects || selects.length === 0) return;

  selects.forEach(selectContainer => {
    const btn = selectContainer.querySelector('.нумекс-селект-кнопка');
    const dropdown = selectContainer.querySelector('.нумекс-селект-выпадающий');
    const textSpan = selectContainer.querySelector('.нумекс-селект-текст');
    const items = selectContainer.querySelectorAll('.нумекс-селект-пункт');
    const axis = selectContainer.getAttribute('data-axis'); // 'x' or 'y'

    const scrollToSelected = () => {
      const selectedItem = selectContainer.querySelector('.нумекс-селект-пункт.выбран');
      if (selectedItem && dropdown) {
        // Если это первый элемент (Расчет), прокрутить строго на 0
        if (selectedItem.getAttribute('data-value') === 'Расчет') {
          dropdown.scrollTop = 0;
        } else if (selectedItem.getAttribute('data-value') === 'Целевая функция') {
          // Если это Целевая функция, прокрутить строго в самый низ как на скриншоте Y
          dropdown.scrollTop = dropdown.scrollHeight;
        } else {
          dropdown.scrollTop = selectedItem.offsetTop - (dropdown.clientHeight / 2) + (selectedItem.clientHeight / 2);
        }
      }
    };

    const openDropdown = () => {
      // Закрываем другие селекторы
      document.querySelectorAll('.нумекс-селект-выпадающий').forEach(d => {
        if (d !== dropdown) d.classList.remove('показан');
      });
      document.querySelectorAll('.нумекс-кастомный-селект').forEach(s => {
        if (s !== selectContainer) s.classList.remove('активен');
      });

      selectContainer.classList.add('активен');
      dropdown.classList.add('показан');
      scrollToSelected();
    };

    const closeDropdown = () => {
      selectContainer.classList.remove('активен');
      dropdown.classList.remove('показан');
    };

    // Открытие при наведении (hover)
    selectContainer.addEventListener('mouseenter', () => {
      openDropdown();
    });

    selectContainer.addEventListener('mouseleave', () => {
      closeDropdown();
    });

    // Открытие/закрытие по клику на кнопку
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('показан')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Выбор пункта
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.getAttribute('data-value') || item.textContent.trim();
        textSpan.textContent = val;

        items.forEach(i => i.classList.remove('выбран'));
        item.classList.add('выбран');

        // Обновляем подпись оси на графике SVG
        if (axis === 'x') {
          const allTexts = document.querySelectorAll('#нумекс-svg-график text');
          allTexts.forEach(t => {
            if (!t.getAttribute('transform') && t.getAttribute('text-anchor') === 'middle' && t.getAttribute('y') > 200) {
              t.textContent = val;
            }
          });
        } else if (axis === 'y') {
          const allTexts = document.querySelectorAll('#нумекс-svg-график text');
          allTexts.forEach(t => {
            if (t.getAttribute('transform') && t.getAttribute('transform').includes('rotate(-90)')) {
              t.textContent = val;
            }
          });
        }

        closeDropdown();
      });
    });
  });

  // Закрытие при клике мимо
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.нумекс-кастомный-селект')) {
      document.querySelectorAll('.нумекс-селект-выпадающий').forEach(d => d.classList.remove('показан'));
      document.querySelectorAll('.нумекс-кастомный-селект').forEach(s => s.classList.remove('активен'));
    }
  });

  // Поддержка открытия через URL query param (?select=x или ?select=y)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const selParam = urlParams.get('select');
    if (selParam === 'x' || selParam === 'X') {
      const selectX = document.querySelector('#нумекс-селект-х-контейнер');
      const dropX = document.querySelector('#нумекс-выпадающий-список-х');
      if (selectX && dropX) {
        selectX.classList.add('активен');
        dropX.classList.add('показан');
        dropX.scrollTop = 0;
      }
    } else if (selParam === 'y' || selParam === 'Y') {
      const selectY = document.querySelector('#нумекс-селект-у-контейнер');
      const dropY = document.querySelector('#нумекс-выпадающий-список-у');
      if (selectY && dropY) {
        selectY.classList.add('активен');
        dropY.classList.add('показан');
        dropY.scrollTop = dropY.scrollHeight;
      }
    }
  } catch (e) {}
}

  window.initUiControls = initUiControls;

})(typeof window !== 'undefined' ? window : this);

