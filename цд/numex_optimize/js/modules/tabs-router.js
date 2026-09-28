// Модуль роутера вкладок и представлений
(function(window) {
  'use strict';

  let activeTabId = 'dashboard';

  function initTabsRouter() {
    const tabs = document.querySelectorAll('.нумекс-вкладка');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        if (target) {
          switchTab(target);
        }
      });
    });

    // Активация вкладки по начальному URL hash (#wells, #queue, #results, #dashboard)
    try {
      const initialHash = window.location.hash.replace('#', '');
      if (initialHash && ['wells', 'queue', 'results', 'dashboard'].includes(initialHash)) {
        switchTab(initialHash);
      }
    } catch (e) {}
  }

  function switchTab(tabId) {
    activeTabId = tabId;

    // Обновление хэша URL
    try {
      if (window.location.hash !== '#' + tabId) {
        history.replaceState(null, '', '#' + tabId);
      }
    } catch (e) {}

    // Обновление состояния кнопок вкладок
    document.querySelectorAll('.нумекс-вкладка').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('активная', isTarget);
    });

    // Переключение видимости контейнеров экранов
    document.querySelectorAll('.нумекс-экран').forEach(screen => {
      const isTarget = screen.id === `экран-${tabId}`;
      screen.classList.toggle('активен', isTarget);
    });

    // Маркировка активной вкладки скважин для корректного завершения линий у тулбара
    const whiteWin = document.querySelector('.нумекс-белое-окно');
    if (whiteWin) {
      whiteWin.classList.toggle('вкладка-wells', tabId === 'wells');
    }

    // Левый вертикальный тулбар (7 кнопок) отображается только на дашборде
    const sidebar = document.querySelector('.нумекс-боковой-тулбар');
    if (sidebar) {
      sidebar.style.display = tabId === 'dashboard' ? 'flex' : 'none';
    }

    // Нижняя консоль и разделитель с точками отображаются только на дашборде по референсам
    const bottomPanel = document.querySelector('.нумекс-нижняя-панель');
    const panelDivider = document.querySelector('.нумекс-разделитель-панелей');
    if (bottomPanel && panelDivider) {
      const showBottom = tabId === 'dashboard';
      bottomPanel.style.display = showBottom ? 'flex' : 'none';
      panelDivider.style.display = showBottom ? 'flex' : 'none';
    }

    // Если открыт дашборд — синхронизируем высоту и вызываем перерисовку графика после применения раскладки
    if (tabId === 'dashboard') {
      if (typeof window.syncNumexSidebar === 'function') {
        window.syncNumexSidebar();
      }
      requestAnimationFrame(() => {
        if (typeof window.syncNumexSidebar === 'function') {
          window.syncNumexSidebar();
        }
        requestAnimationFrame(() => {
          if (typeof window.redrawChart === 'function') {
            window.redrawChart();
          }
        });
      });
    }
  }

  function getActiveTab() {
    return activeTabId;
  }

  window.initTabsRouter = initTabsRouter;
  window.switchTab = switchTab;
  window.switchNumexTab = switchTab;
  window.getActiveTab = getActiveTab;

})(typeof window !== 'undefined' ? window : this);

