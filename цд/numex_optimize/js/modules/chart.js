// Модуль отрисовки и интерактивности SVG-графика сходимости целевой функции
(function(window) {
  'use strict';

  let chartObserver = null;
  let currentPoints = [];
  let chartContainer = null;
  let chartSvg = null;

  function initChart(container, svg, points) {
    chartContainer = typeof container === 'string' ? document.getElementById(container) : container;
    chartSvg = typeof svg === 'string' ? document.getElementById(svg) : svg;
    currentPoints = points || (typeof window !== 'undefined' ? window.POINTS_DATA : []) || [];

  if (!chartContainer || !chartSvg) return;

  redrawChart();

  // Ресайз-обсервер для плавной перерисовки под любой размер экрана
  if (window.ResizeObserver && !chartObserver) {
    let rafId = null;
    chartObserver = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (chartContainer && chartContainer.clientWidth > 0 && chartContainer.clientHeight > 0) {
          redrawChart();
        }
      });
    });
    chartObserver.observe(chartContainer);
  }

  // Кнопка «Домой» (сброс масштаба к исходному виду)
  const btnHome = document.getElementById('нумекс-сброс-масштаба');
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      redrawChart();
      btnHome.style.transform = 'scale(0.92)';
      setTimeout(() => { btnHome.style.transform = ''; }, 150);
    });
  }
}

function redrawChart() {
  if (!chartContainer || !chartSvg) {
    chartContainer = document.getElementById('нумекс-график-контейнер');
    chartSvg = document.getElementById('нумекс-svg-график');
  }
  if (!chartContainer || !chartSvg) return;
  if (!currentPoints || currentPoints.length === 0) {
    if (typeof window !== 'undefined' && window.POINTS_DATA) {
      currentPoints = window.POINTS_DATA;
    }
  }

  const w = chartContainer.clientWidth;
  const h = chartContainer.clientHeight;
  if (w < 100 || h < 100) return;

  chartSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  while (chartSvg.firstChild) chartSvg.removeChild(chartSvg.firstChild);

  // Маркер наконечника стрелки для тултипа
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'нумекс-стрелка-наконечник');
  marker.setAttribute('viewBox', '0 0 8 8');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '4');
  marker.setAttribute('markerWidth', '5');
  marker.setAttribute('markerHeight', '5');
  marker.setAttribute('orient', 'auto-start-reverse');
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M0 1L7 4L0 7Z');
  arrowPath.setAttribute('fill', '#1c1917');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  chartSvg.appendChild(defs);

  // Точные отступы области графика внутри белого полотна 1-в-1 по референсу
  const padT = 24;
  const padB = 38;
  const padL = 72;
  const padR = 36;
  
  const plotW = Math.max(50, w - padL - padR);
  const plotH = Math.max(50, h - padT - padB);

  // Точные границы осей 1-в-1 с графиком Nedra.NUMEX Optimize:
  const xMin = -10.82, xMax = 207.81;
  const yMin = 175000, yMax = 222000;
  const xК = x => padL + ((x - xMin) / (xMax - xMin)) * plotW;
  const yК = y => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  // Фон под графиком с четкой рамкой
  chartSvg.appendChild(el('rect', { x: padL, y: padT, width: plotW, height: plotH, fill: '#ffffff', stroke: '#555555', 'stroke-width': '1.0' }));

  // Сетка Y, засечки и подписи осей (четкие деления с шагом 5000: 180000..220000)
  const yМетки = [180000, 185000, 190000, 195000, 200000, 205000, 210000, 215000, 220000];
  yМетки.forEach(yVal => {
    const py = yК(yVal);
    // Линия сетки: более контрастная и заметная как на референсе (#c8c8c8)
    chartSvg.appendChild(el('line', { x1: padL, y1: py, x2: padL + plotW, y2: py, stroke: '#c8c8c8', 'stroke-width': '0.9' }));
    // Засечка
    chartSvg.appendChild(el('line', { x1: padL - 4, y1: py, x2: padL, y2: py, stroke: '#000000', 'stroke-width': '0.9' }));
    // Текст значения оси Y
    const t = el('text', { x: padL - 7, y: py + 3.5, 'text-anchor': 'end', 'font-family': 'Arial, sans-serif', 'font-size': '10px', fill: '#000000' });
    t.textContent = yVal;
    chartSvg.appendChild(t);
  });

  // Сетка X, засечки и подписи осей (0..200)
  const xМетки = [0, 25, 50, 75, 100, 125, 150, 175, 200];
  xМетки.forEach(xVal => {
    const px = xК(xVal);
    // Линия сетки: более контрастная как на референсе (#c8c8c8)
    chartSvg.appendChild(el('line', { x1: px, y1: padT, x2: px, y2: padT + plotH, stroke: '#c8c8c8', 'stroke-width': '0.9' }));
    // Засечка
    chartSvg.appendChild(el('line', { x1: px, y1: padT + plotH, x2: px, y2: padT + plotH + 4, stroke: '#000000', 'stroke-width': '0.9' }));
    // Текст значения оси X
    const t = el('text', { x: px, y: padT + plotH + 16, 'text-anchor': 'middle', 'font-family': 'Arial, sans-serif', 'font-size': '10px', fill: '#000000' });
    t.textContent = xVal;
    chartSvg.appendChild(t);
  });

  // Заголовок графика (центрирован строго над графиком)
  const tTitle = el('text', { x: padL + plotW / 2, y: 19, 'text-anchor': 'middle', 'font-family': 'Arial, sans-serif', 'font-size': '12px', 'font-weight': 'normal', fill: '#000000' });
  tTitle.textContent = 'Ход оптимизации';
  chartSvg.appendChild(tTitle);

  // Подписи осей X и Y
  const tY = el('text', { x: -(padT + plotH / 2), y: padL - 56, transform: 'rotate(-90)', 'text-anchor': 'middle', 'font-family': 'Arial, sans-serif', 'font-size': '11px', 'font-weight': 'normal', fill: '#000000' });
  tY.textContent = 'Целевая функция';
  chartSvg.appendChild(tY);

  const tX = el('text', { x: padL + plotW / 2, y: padT + plotH + 31, 'text-anchor': 'middle', 'font-family': 'Arial, sans-serif', 'font-size': '11px', 'font-weight': 'normal', fill: '#000000' });
  tX.textContent = 'Расчет';
  chartSvg.appendChild(tX);

  // Легенда (внутри графика слева вверху)
  const legX = padL + 12, legY = padT + 12, legW = 76, legH = 58;
  chartSvg.appendChild(el('rect', { x: legX, y: legY, width: legW, height: legH, fill: '#ffffff', stroke: '#d1d5da', 'stroke-width': '0.8', rx: '2' }));

  // Элемент e0 (желтый ромб)
  chartSvg.appendChild(el('polygon', {
    points: `${legX + 12},${legY + 12 - 4.5} ${legX + 12 + 4.5},${legY + 12} ${legX + 12},${legY + 12 + 4.5} ${legX + 12 - 4.5},${legY + 12}`,
    fill: '#fcf200', stroke: 'none'
  }));
  const lt1 = el('text', { x: legX + 22, y: legY + 15, 'font-family': 'Arial, sans-serif', 'font-size': '9px', fill: '#000000' });
  lt1.textContent = 'e0';
  chartSvg.appendChild(lt1);

  // Элемент Лучший (зеленый ромб)
  chartSvg.appendChild(el('polygon', {
    points: `${legX + 12},${legY + 28 - 4.5} ${legX + 12 + 4.5},${legY + 28} ${legX + 12},${legY + 28 + 4.5} ${legX + 12 - 4.5},${legY + 28}`,
    fill: '#23935e', stroke: 'none'
  }));
  const lt2 = el('text', { x: legX + 22, y: legY + 31, 'font-family': 'Arial, sans-serif', 'font-size': '9px', fill: '#000000' });
  lt2.textContent = 'Лучший';
  chartSvg.appendChild(lt2);

  // Элемент Базовый (оранжевый ромб)
  chartSvg.appendChild(el('polygon', {
    points: `${legX + 12},${legY + 44 - 4.5} ${legX + 12 + 4.5},${legY + 44} ${legX + 12},${legY + 44 + 4.5} ${legX + 12 - 4.5},${legY + 44}`,
    fill: '#e7a117', stroke: 'none'
  }));
  const lt3 = el('text', { x: legX + 22, y: legY + 47, 'font-family': 'Arial, sans-serif', 'font-size': '9px', fill: '#000000' });
  lt3.textContent = 'Базовый';
  chartSvg.appendChild(lt3);

  // Группа точек и тултипа со стрелкой
  const gТочки = el('g', {});
  const gПодсветка = el('g', {});
  const gТултипСтрелка = el('g', { 'pointer-events': 'none' });
  chartSvg.appendChild(gТочки);
  chartSvg.appendChild(gПодсветка);
  chartSvg.appendChild(gТултипСтрелка);

  // Функция показа подсказки с аутентичной стрелкой 1-в-1 из видео
  const показатьТултип = (точка, px, py) => {
    while (gПодсветка.firstChild) gПодсветка.removeChild(gПодсветка.firstChild);
    while (gТултипСтрелка.firstChild) gТултипСтрелка.removeChild(gТултипСтрелка.firstChild);

    const textStr = точка.подпись;
    const tw = Math.max(136, textStr.length * 6.8 + 18);
    const th = 21;

    let bx, by, ax, ay;
    if (px > padL + plotW * 0.62) {
      bx = px - tw - 16;
      by = Math.max(padT + 4, Math.min(padT + plotH - th - 4, py - 30));
      ax = bx + tw - 16;
      ay = by + th;
    } else {
      bx = px + 20;
      by = Math.max(padT + 4, Math.min(padT + plotH - th - 4, py - 30));
      ax = bx + 16;
      ay = by + th;
    }

    const isDiamond = точка.тип !== 'расчет';
    const offset = isDiamond ? 3.2 : 2.0;
    const x2 = ax > px ? px + offset : px - offset;
    const y2 = py;

    // Стрелка от нижней стороны рамки тултипа прямо к контуру точки
    const line = el('line', {
      x1: ax,
      y1: ay,
      x2: x2,
      y2: y2,
      stroke: '#1c1917',
      'stroke-width': '1.0',
      'marker-end': 'url(#нумекс-стрелка-наконечник)'
    });
    gТултипСтрелка.appendChild(line);

    // Желтая скругленная плашка тултипа (#fef984) с рамкой (#877e26)
    const box = el('rect', {
      x: bx,
      y: by,
      width: tw,
      height: th,
      rx: '5',
      ry: '5',
      fill: '#fef984',
      stroke: '#877e26',
      'stroke-width': '0.9'
    });
    gТултипСтрелка.appendChild(box);

    // Текст внутри тултипа
    const txt = el('text', {
      x: bx + tw / 2,
      y: by + 14.5,
      'text-anchor': 'middle',
      'font-family': 'Arial, sans-serif',
      'font-size': '11px',
      'font-weight': 'normal',
      fill: '#000000'
    });
    txt.textContent = textStr;
    gТултипСтрелка.appendChild(txt);
  };

  const скрытьТултип = () => {
    while (gПодсветка.firstChild) gПодсветка.removeChild(gПодсветка.firstChild);
    while (gТултипСтрелка.firstChild) gТултипСтрелка.removeChild(gТултипСтрелка.firstChild);
  };

  // Отрисовка всех точек
  currentPoints.forEach(точка => {
    const px = xК(точка.x);
    const py = yК(точка.y);

    if (точка.тип === 'расчет') {
      gТочки.appendChild(el('circle', { cx: px, cy: py, r: 2.0, fill: '#3d6c99' }));
    } else {
      const color = точка.тип === 'e0' ? '#fcf200' : (точка.тип === 'лучший' ? '#23935e' : '#e7a117');
      const d = 5.0;
      chartSvg.appendChild(el('polygon', {
        points: `${px},${py - d} ${px + d},${py} ${px},${py + d} ${px - d},${py}`,
        fill: color, stroke: 'none'
      }));
    }

    // Хитбокс для удобного наведения
    const hit = el('circle', { cx: px, cy: py, r: 7.5, fill: 'transparent', style: 'cursor:pointer;' });
    hit.addEventListener('mouseenter', () => показатьТултип(точка, px, py));
    hit.addEventListener('mouseleave', скрытьТултип);
    gТочки.appendChild(hit);

    // Поддержка отображения тултипа через URL query param (?hover=e2) для верификации
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const hoverTarget = urlParams.get('hover');
        if (hoverTarget && (hoverTarget === 'e2' || hoverTarget === '2') && точка.номер === 2) {
          показатьТултип(точка, px, py);
        }
      }
    } catch(e) {}
  });
}

  window.initChart = initChart;
  window.redrawChart = redrawChart;
  window.перерисоватьГрафикНумекс = redrawChart;

})(typeof window !== 'undefined' ? window : this);

