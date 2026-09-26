// Production Monitoring Offline Application Script
// Author: KMG Automated Offline Standalone Converter

(function() {
    'use strict';

    // --- Dynamic Height & Zoom Auto-Fit ---
    function updateZoom() {
        var targetHeight = 2160;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        if (vh && vh > 200) {
            var scale = vh / targetHeight;
            $('.dashboard').css({
                'transform': 'scale(' + scale + ')',
                'transform-origin': 'top left'
            });
        }
    }
    updateZoom();
    window.addEventListener('resize', updateZoom);
    window.addEventListener('load', updateZoom);
    [100, 300, 600, 1000].forEach(function(ms) { setTimeout(updateZoom, ms); });

    // --- Live Clock ---
    function updateClock() {
        var now = new Date();
        var d = String(now.getDate()).padStart(2, '0');
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var y = now.getFullYear();
        var h = String(now.getHours()).padStart(2, '0');
        var min = String(now.getMinutes()).padStart(2, '0');
        
        $('.date, .jqueryDate').text(d + '.' + m + '.' + y);
        $('.time, .jqueryTime').text(h + ':' + min);
    }
    updateClock();
    setInterval(updateClock, 1000);

    // --- AJAX Interceptor & Mock Responses ---
    var originalAjax = $.ajax;
    $.ajax = function(url, options) {
        if (typeof url === 'object') {
            options = url;
            url = options.url || '';
        } else {
            options = options || {};
            options.url = url;
        }
        var data = options.data || {};

        // 1. Notifications list
        if (url.indexOf('/notifications') !== -1) {
            setTimeout(function() {
                var html = generateNotificationsHtml();
                if (options.success) options.success(html);
            }, 30);
            return;
        }

        // 2. Line Chart Data (Widget A1)
        if (url.indexOf('/getLineChartData') !== -1) {
            setTimeout(function() {
                var chartData = generateChartData(data.flag, data.type);
                if (options.success) options.success(chartData);
            }, 30);
            return;
        }

        // 3. AGZU Wells Layout
        if (url.indexOf('/agzuCreate') !== -1) {
            setTimeout(function() {
                var agzuNum = data.agzu || 1;
                var html = generateAgzuHtml(agzuNum);
                if (options.success) options.success(html);
            }, 30);
            return;
        }

        // 4. AGZU Central Circle (Pressure, Time, Temp)
        if (url.indexOf('/agzuCircle') !== -1) {
            setTimeout(function() {
                var agzu = data.agzu || 1;
                var p = "0.31", t = "00:01", temp = "21.31";
                if (agzu == '1С' || agzu == '1C') { p = "0.28"; t = "00:02"; temp = "19.45"; }
                else if (agzu == 2) { p = "0.35"; t = "00:01"; temp = "22.10"; }
                else if (agzu == 3) { p = "0.29"; t = "00:04"; temp = "20.80"; }
                else if (agzu == 4) { p = "0.33"; t = "00:02"; temp = "21.90"; }
                else if (agzu == 5) { p = "0.30"; t = "00:03"; temp = "20.15"; }
                else if (agzu == 6) { p = "0.32"; t = "00:01"; temp = "21.60"; }

                var html = '<div class="agzu-circle">' +
                           '<div class="c1">' + p + ' МПа</div>' +
                           '<div class="c2">' + t + '</div>' +
                           '<div class="c3">' + temp + ' °C</div>' +
                           '</div>';
                if (options.success) options.success(html);
            }, 20);
            return;
        }

        // 5. AGZU Active Otvod Highlight
        if (url.indexOf('/agzuActive') !== -1) {
            setTimeout(function() {
                var agzu = data.agzu || 1;
                var activeOtvod = 9;
                if (agzu == '1С' || agzu == '1C') activeOtvod = 3;
                else if (agzu == 2) activeOtvod = 6;
                else if (agzu == 3) activeOtvod = 10;
                else if (agzu == 4) activeOtvod = 4;
                else if (agzu == 5) activeOtvod = 8;
                else if (agzu == 6) activeOtvod = 11;

                if (options.success) options.success(activeOtvod);
            }, 20);
            return;
        }

        // 6. Last 10 Interventions (ГТМ / ПРС / КРС)
        if (url.indexOf('/last10') !== -1) {
            setTimeout(function() {
                var typeV = data.v || 1;
                var html = generateLast10Html(typeV);
                if (options.success) options.success(html);
            }, 40);
            return;
        }

        // 7. Stock Wells Data
        if (url.indexOf('/stockWellsData') !== -1) {
            setTimeout(function() {
                var html = generateStockWellsHtml();
                if (options.success) options.success(html);
            }, 40);
            return;
        }

        // 7b. Legends (Equipment Passports)
        if (url.indexOf('/legends/') !== -1) {
            setTimeout(function() {
                var m = url.match(/\/legends\/(\d+)/);
                var num = m ? parseInt(m[1]) : 1;
                if (num < 1 || num > 9) num = 1;
                $.get('legends/legend_' + num + '.html', function(resp) {
                    if (options.success) options.success(resp);
                }).fail(function() {
                    if (options.success) options.success('<div class="own-table active">Паспорт оборудования</div>');
                });
            }, 20);
            return;
        }

        // 8. Widgets Update
        if (url.indexOf('/widget/') !== -1) {
            if (url.indexOf('normativeTable') !== -1) {
                if (options.success) options.success($('#normTable').parent().html());
                return;
            }

            var widgetType = data.type || (data.widget ? data.widget.type : 'fluid');
            var widgetName = url.indexOf('reverseTable') !== -1 ? 'reverseTable' : 'reverseMultiChart';
            var localUrl = 'widget/' + widgetName + '_' + widgetType + '.html';
            
            return originalAjax.call($, {
                url: localUrl,
                dataType: 'html',
                success: function(res) {
                    if (options.success) options.success(res);
                },
                error: function() {
                    if (options.success) options.success('<div style="padding:40px;font-size:32px;">Данные виджета ' + widgetName + ' (' + widgetType + ') загружены.</div>');
                }
            });
        }

        // 9. Generic OK endpoints
        if (url.indexOf('/system_auth') !== -1 || url.indexOf('/tracker/ping') !== -1 || 
            url.indexOf('/notificationClose') !== -1 || url.indexOf('/downloadWellsReport') !== -1) {
            setTimeout(function() {
                if (options.success) options.success({ status: "ok" });
            }, 20);
            return;
        }

        // Fallback to original ajax
        return originalAjax.apply($, arguments);
    };

    // --- Mock Data Generators ---
    function generateNotificationsHtml() {
        var items = [
            { zid: 101, well: 'UAZ_0011', text: 'Нулевой замер АГЗУ (дебит 0.00 м³/сут)', color: 'high', date: '26.09.2026 19:40' },
            { zid: 102, well: 'UAZ_0014', text: 'Остановка скважины: давление ниже нормы 0.08 МПа', color: 'high', date: '26.09.2026 18:15' },
            { zid: 103, well: 'UAZ_0065', text: 'Аварийное отключение ЭЦН по перегрузке', color: 'high', date: '26.09.2026 17:50' },
            { zid: 104, well: 'UAZ_0103', text: 'Снижение дебита > 15% (факт 0.03 при ТР 0.16)', color: 'high', date: '26.09.2026 16:30' },
            { zid: 105, well: 'UAZ_0031', text: 'Отклонение обводненности ТР: рост до 94.2%', color: 'low', date: '26.09.2026 15:10' },
            { zid: 106, well: 'UAZ_0109', text: 'Колебание линейного давления в коллекторе', color: 'low', date: '26.09.2026 14:05' },
            { zid: 107, well: 'UAZ_0071', text: 'Превышение температуры в трубопроводе > 42°C', color: 'low', date: '26.09.2026 12:20' },
            { zid: 108, well: 'UAZ_0121', text: 'Плановый пересчет тех.режима завершен', color: 'easy', date: '26.09.2026 10:00' },
            { zid: 109, well: 'UAZ_0052', text: 'Ввод после планового ремонта (ПРС-2)', color: 'easy', date: '26.09.2026 09:30' }
        ];

        for (var i = 110; i <= 138; i++) {
            var c = i % 3 === 0 ? 'high' : (i % 2 === 0 ? 'low' : 'easy');
            items.push({
                zid: i,
                well: 'UAZ_00' + (i % 80 + 10),
                text: 'Контроль параметров телеметрии узла №' + (i % 6 + 1),
                color: c,
                date: '26.09.2026 0' + (i % 9) + ':15'
            });
        }

        var html = '<ul>';
        items.forEach(function(it) {
            html += '<li color="' + it.color + '" zid="' + it.zid + '" email="dispatcher@emg.kmg.kz" data-field="1">' +
                    '<strong>' + it.well + '</strong> · ' + it.text +
                    '<span style="float:right;color:#888;font-size:20px;">' + it.date + '</span>' +
                    '</li>';
        });
        html += '</ul>';
        return html;
    }

    function generateChartData(isNakop, type) {
        var nakop = (isNakop === true || isNakop === 'true' || isNakop === 1 || isNakop === '1');
        var isOil = (type === 'oil');

        // Timestamps in seconds: 13 divisions for the 24h cycle
        // All on the same day (26.09.2026) so line_chart.js triggers the "by Days" branch
        var baseTime = 1790380800; // 2026-09-26 00:00:00 UTC
        var scaleH = [];
        for (var i = 0; i < 13; i++) {
            scaleH.push(baseTime + (i + 1) * 7200);
        }

        var vForecast, vRegime, vPrev;

        if (nakop) {
            if (!isOil) {
                // Cumulative Fluid: Targets 1804.7 (Forecast), 1591.2 (Regime), 1682.3 (Prev)
                vForecast = [14.2, 160.5, 310.8, 465.1, 625.4, 788.0, 955.3, 1125.6, 1300.2, 1475.8, 1610.4, 1720.5, 1804.7];
                vRegime   = [12.5, 144.1, 275.8, 407.5, 539.2, 670.8, 802.5, 934.2, 1065.9, 1197.6, 1329.2, 1460.9, 1591.2];
                vPrev     = [13.8, 152.0, 290.5, 430.2, 575.0, 725.1, 880.4, 1040.5, 1205.0, 1370.2, 1495.0, 1600.8, 1682.3];
            } else {
                // Cumulative Oil: Targets 452.1 (Forecast), 398.8 (Regime), 421.5 (Prev)
                vForecast = [3.6, 40.2, 78.0, 116.6, 156.8, 197.6, 239.5, 282.2, 326.0, 370.0, 403.7, 431.3, 452.1];
                vRegime   = [3.1, 36.1, 69.1, 102.1, 135.1, 168.1, 201.1, 234.1, 267.1, 300.1, 333.1, 366.1, 398.8];
                vPrev     = [3.5, 38.1, 72.8, 107.8, 144.1, 181.8, 220.7, 260.9, 302.1, 343.5, 374.8, 401.3, 421.5];
            }
        } else {
            if (!isOil) {
                // Hourly Fluid (non-cumulative)
                vForecast = [14.2, 146.3, 150.3, 154.3, 160.3, 162.6, 167.3, 170.3, 174.6, 175.6, 134.6, 110.1, 84.2];
                vRegime   = [122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4, 122.4];
                vPrev     = [13.8, 138.2, 138.5, 139.7, 144.8, 150.1, 155.3, 160.1, 164.5, 165.2, 124.8, 105.8, 81.5];
            } else {
                // Hourly Oil (non-cumulative)
                vForecast = [3.6, 36.6, 37.8, 38.6, 40.2, 40.8, 41.9, 42.7, 43.8, 44.0, 33.7, 27.6, 20.8];
                vRegime   = [30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7, 30.7];
                vPrev     = [3.5, 34.6, 34.7, 35.0, 36.3, 37.7, 38.9, 40.2, 41.2, 41.4, 31.3, 26.5, 20.2];
            }
        }

        return {
            scaleH: scaleH,
            values: [vForecast, vRegime, vPrev],
            colors: ['#33cc33', '#ff6464', '#cccccc'],
            fills: ['#33cc33', '#ff6464', '#cccccc'],
            types: [
                { solid: [0, 10], dashed: [9, 13] },
                { dashed: [0, 13] },
                { solid: [0, 13] }
            ],
            scaleV: 4,
            labels: [1, 1, 1],
            labelValues: [vForecast.slice(), vRegime.slice(), vPrev.slice()],
            round: 1,
            ratio: 1
        };
    }

    function generateAgzuHtml(agzuNum) {
        var wellsSets = {
            1: [
                { name: 'UAZ_0064', q: '22.68', color: 'bg1' },
                { name: 'UAZ_0062', q: '14.54', color: 'bg1' },
                { name: 'UAZ_0019', q: '16.45', color: 'bg1' },
                { name: 'UAZ_0012', q: '11.52', color: 'bg1' },
                { name: 'UAZ_0014', q: '0.00', color: 'bg1' },
                { name: 'UAZ_0004', q: '16.71', color: 'bg1' },
                { name: 'UAZ_0011', q: '0.00', color: 'bg1' },
                { name: 'UAZ_0015', q: '14.49', color: 'bg1' },
                { name: 'UAZ_0031', q: '12.82', color: 'bg2' }, // active
                { name: 'UAZ_0034', q: '24.94', color: 'bg1' },
                { name: 'UAZ_0060', q: '22.86', color: 'bg1' },
                { name: 'UAZ_0065', q: '0.00', color: 'bg1' },
                { name: 'UAZ_0066', q: '32.53', color: 'bg1' },
                { name: '', q: '', color: 'bg1' }
            ],
            2: [
                { name: 'UAZ_0121', q: '60.00', color: 'bg1' },
                { name: 'UAZ_0052', q: '49.24', color: 'bg1' },
                { name: 'UZV_0111', q: '30.00', color: 'bg1' },
                { name: 'UAZ_0066', q: '32.53', color: 'bg1' },
                { name: 'UZS_026U', q: '33.14', color: 'bg1' },
                { name: 'UZS_014US', q: '24.98', color: 'bg2' }, // active
                { name: 'UZS_11US', q: '28.93', color: 'bg1' },
                { name: 'UAZ_0103', q: '0.03', color: 'bg3' },
                { name: 'UAZ_0043', q: '0.00', color: 'bg3' },
                { name: 'UAZ_0059', q: '29.84', color: 'bg1' },
                { name: 'UZS_018US', q: '9.00', color: 'bg3' },
                { name: 'UZS_0US7', q: '20.20', color: 'bg1' },
                { name: 'UZV_008U', q: '33.34', color: 'bg1' },
                { name: 'UAZ_0101', q: '17.82', color: 'bg1' }
            ]
        };

        var set = wellsSets[agzuNum] || wellsSets[1];
        var html = '';
        var lefts = [3, 269, 535, 801, 1067, 1333, 1599, 3, 269, 535, 801, 1067, 1333, 1599];

        for (var i = 0; i < 14; i++) {
            var w = set[i] || { name: 'UAZ_00' + (i + 40), q: '18.50', color: 'bg1' };
            var num = i + 1;
            var isTop = i < 7;
            var yClass = isTop ? 'y0' : 'y3';
            var yNumClass = isTop ? 'y1' : 'y2';
            var left = lefts[i];

            if (w.name) {
                html += '<div class="i1 ' + yClass + ' ' + w.color + ' otvod" data-otvod="' + num + '" style="left:' + left + 'px">' +
                        '<div class="tt1">' + w.name + '</div>' +
                        '<div class="tt2">' + w.q + '</div>' +
                        '</div>';
            }
            html += '<div class="i2 ' + yNumClass + ' b1 otvod-b" data-otvod="' + num + '" style="left:' + left + 'px">' + num + '</div>';
        }
        return html;
    }

    // --- 1. Фонд скважин Modal Generator ---
    function generateStockWellsHtml() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Фонд скважин — Месторождение "Уаз" (Всего: <span style="color:#54b948;">82</span> скважины)</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.7;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Структура фонда скважин</div>' +
                    '<div><b>Общий фонд скважин:</b> <span style="font-size:32px;font-weight:bold;color:#fff;">82</span> скв.</div>' +
                    '<div><b>Действующий добывающий фонд:</b> <span style="color:#54b948;font-weight:bold;">71</span> скв. (86.6%)</div>' +
                    '<div>&nbsp;&nbsp;· В непрерывной работе: <b>68</b> скв.</div>' +
                    '<div>&nbsp;&nbsp;· В циклической эксплуатации: <b>3</b> скв.</div>' +
                    '<div><b>Бездействующий фонд:</b> <span style="color:#ef5c65;font-weight:bold;">7</span> скв. (8.5%)</div>' +
                    '<div>&nbsp;&nbsp;· В ожидании ремонта (ПРС/КРС): <b>4</b> скв.</div>' +
                    '<div>&nbsp;&nbsp;· В консервации / ожидание ликвидации: <b>3</b> скв.</div>' +
                    '<div><b>Нагнетательный фонд (система ППД):</b> <b>2</b> скв.</div>' +
                    '<div><b>Освоение после бурения:</b> <b>2</b> скв.</div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.7;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Способы механизированной добычи</div>' +
                    '<div style="margin-bottom:10px;"><b>ЭЦН (электроцентробежные насосы):</b> <span style="color:#33cc33;font-weight:bold;">64 скв.</span> (78.0%)</div>' +
                    '<div style="background:#19191e;border-radius:6px;height:24px;overflow:hidden;margin-bottom:20px;">' +
                        '<div style="background:#54b948;width:78%;height:100%;"></div>' +
                    '</div>' +
                    '<div style="margin-bottom:10px;"><b>ШГН (штанговые глубинные насосы):</b> <span style="color:#d5a62a;font-weight:bold;">18 скв.</span> (22.0%)</div>' +
                    '<div style="background:#19191e;border-radius:6px;height:24px;overflow:hidden;margin-bottom:20px;">' +
                        '<div style="background:#d5a62a;width:22%;height:100%;"></div>' +
                    '</div>' +
                    '<div><b>Средний дебит на 1 действ. скважину:</b></div>' +
                    '<div>· Жидкости: <b>23.7 м³/сут</b></div>' +
                    '<div>· Нефти: <b>6.2 т/сут</b></div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">Сводная ведомость распределения фонда по категориям</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;">' +
                    '<th>Категория фонда скважин</th><th>Кол-во (скв.)</th><th>Дебит жидкости (м³/сут)</th><th>Дебит нефти (т/сут)</th><th>Средняя обводненность</th><th>Доля от общего фонда</th><th>Статус</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr><td>Добывающие скважины в работе</td><td><strong>68</strong></td><td>1 645.2</td><td>431.8</td><td>63.8%</td><td>82.9%</td><td><span class="label label-success">В работе</span></td></tr>' +
                    '<tr><td>Периодический / циклический фонд</td><td><strong>3</strong></td><td>37.1</td><td>10.2</td><td>61.5%</td><td>3.7%</td><td><span class="label label-warning">Цикл</span></td></tr>' +
                    '<tr><td>Ожидание текущего ремонта (ПРС)</td><td><strong>4</strong></td><td>0.0</td><td>0.0</td><td>—</td><td>4.9%</td><td><span class="label label-danger">Простой (ПРС)</span></td></tr>' +
                    '<tr><td>В консервации / ожидает ликвидации</td><td><strong>3</strong></td><td>0.0</td><td>0.0</td><td>—</td><td>3.7%</td><td><span class="label label-default">Консервация</span></td></tr>' +
                    '<tr><td>Нагнетательные скважины (ППД)</td><td><strong>2</strong></td><td>— (закачка: 1 645)</td><td>—</td><td>—</td><td>2.4%</td><td><span class="label label-info">Закачка</span></td></tr>' +
                    '<tr><td>Освоение после бурения / ГРП</td><td><strong>2</strong></td><td>—</td><td>—</td><td>—</td><td>2.4%</td><td><span class="label label-primary">Освоение</span></td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    // --- 2. КЭС (%) Modal Generator ---
    function generateKesHtml() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Коэффициент эксплуатации скважин (КЭС) — <span style="color:#54b948;">97.09%</span> · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.7;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Основные индикаторы эксплуатации</div>' +
                    '<div><b>Текущий КЭС:</b> <span style="font-size:34px;font-weight:bold;color:#54b948;">97.09 %</span></div>' +
                    '<div><b>Плановый КЭС:</b> 96.50 % (перевыполнение <span style="color:#54b948;font-weight:bold;">+0.59%</span>)</div>' +
                    '<div><b>Коэффициент использования фонда (КИФ):</b> <b>0.866</b></div>' +
                    '<div><b>Отработано скважино-дней в месяце:</b> <b>2 136</b> из 2 200 скв.-дн.</div>' +
                    '<div><b>Суммарное время простоев:</b> <span style="color:#ef5c65;font-weight:bold;">64 скважино-часа</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.7;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Динамика КЭС по месяцам (2026 г.)</div>' +
                    '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;font-size:22px;text-align:center;">' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Янв: <b>96.8%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Фев: <b>96.9%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Мар: <b>97.0%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Апр: <b>96.7%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Май: <b>97.2%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Июн: <b>97.1%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Июл: <b>96.9%</b></div>' +
                        '<div style="background:#1f1e24;padding:10px;border-radius:6px;">Авг: <b>97.0%</b></div>' +
                        '<div style="background:#284a2f;padding:10px;border-radius:6px;border:1px solid #54b948;">Сен: <b>97.09%</b></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">Структура и анализ причин простоев фонда за текущий месяц</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;">' +
                    '<th>Причина простоя</th><th>Простой (скв.-часы)</th><th>Скважины</th><th>Доля в общих простоях</th><th>Принятые оперативные меры</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr><td>Ремонт погружного оборудования (отказ ЭЦН)</td><td><strong>28 ч</strong></td><td>UAZ_0065, UAZ_0014</td><td style="color:#ef5c65;font-weight:bold;">43.8%</td><td>Направлена бригада №2 ПРС, подъем оборудования в графике</td></tr>' +
                    '<tr><td>Гидродинамические исследования (КВД, замер Рпл)</td><td><strong>18 ч</strong></td><td>UAZ_0011, UAZ_0043</td><td>28.1%</td><td>Плановые исследования завершены, скважины запущены в работу</td></tr>' +
                    '<tr><td>Ревизия электрооборудования / станции управления</td><td><strong>12 ч</strong></td><td>UAZ_0103</td><td>18.7%</td><td>Заменен силовой контактор ЧРП, параметры телеметрии в норме</td></tr>' +
                    '<tr><td>Промывка забоя от песчаных пробок</td><td><strong>6 ч</strong></td><td>UAZ_0071</td><td>9.4%</td><td>Промывка завершена, выход на технологический режим за 4 часа</td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    // --- 3 & 4. 10 последних ГТМ/КРС и ПРС Modal Generator ---
    function generateLast10Html(typeV) {
        var titles = {
            1: "10 последних мероприятий ГТМ / КРС",
            2: "10 последних мероприятий ПРС (Текущий подземный ремонт)",
            3: "10 последних капитальных ремонтов (КРС)"
        };
        var title = titles[typeV] || titles[1];

        var rowsGTM = [
            { well: "UAZ_0052", type: "ОПЗ соляно-кислотная", start: "14.09.2026", end: "19.09.2026", team: "Бригада №4", before: "18.2", after: "49.2", gain: "+31.0", status: "В работе" },
            { well: "UAZ_0121", type: "Дострел пласта Ю-1", start: "10.09.2026", end: "16.09.2026", team: "Бригада №2", before: "24.0", after: "60.0", gain: "+36.0", status: "В работе" },
            { well: "UAZ_0066", type: "Смена ЭЦН на повышенный типоразмер", start: "05.09.2026", end: "09.09.2026", team: "Бригада №1", before: "14.5", after: "32.5", gain: "+18.0", status: "В работе" },
            { well: "UZS_026U", type: "ГРП большеобъемный", start: "28.08.2026", end: "04.09.2026", team: "Фрак-флот КМГ", before: "8.1", after: "33.1", gain: "+25.0", status: "В работе" },
            { well: "UAZ_0059", type: "РИР цементным мостом", start: "22.08.2026", end: "27.08.2026", team: "Бригада №3", before: "5.0", after: "29.8", gain: "+24.8", status: "В работе" },
            { well: "UZV_008U", type: "Очистка забоя и замена ШГН", start: "18.08.2026", end: "21.08.2026", team: "Бригада №5", before: "12.0", after: "33.3", gain: "+21.3", status: "В работе" },
            { well: "UAZ_0019", type: "Нормализация забоя", start: "12.08.2026", end: "15.08.2026", team: "Бригада №2", before: "7.4", after: "16.5", gain: "+9.1", status: "В работе" },
            { well: "UAZ_0064", type: "Кислотная обработка призабойной зоны", start: "05.08.2026", end: "08.08.2026", team: "Бригада №4", before: "11.0", after: "22.7", gain: "+11.7", status: "В работе" },
            { well: "UAZ_0034", type: "Перевод на вышележащий горизонт", start: "29.07.2026", end: "03.08.2026", team: "Бригада №1", before: "4.2", after: "24.9", gain: "+20.7", status: "В работе" },
            { well: "UAZ_0060", type: "Ревизия погружного оборудования", start: "20.07.2026", end: "24.07.2026", team: "Бригада №3", before: "15.0", after: "22.9", gain: "+7.9", status: "В работе" }
        ];

        var rowsPRS = [
            { well: "UAZ_0052", type: "Плановая смена ЭЦН5-125 / ПЭД-45", start: "15.09.2026", end: "18.09.2026", team: "Бригада №2 ПРС", before: "36.5", after: "49.2", gain: "+12.7", status: "В работе" },
            { well: "UAZ_0015", type: "Устранение негерметичности НКТ / смена подвески", start: "08.09.2026", end: "11.09.2026", team: "Бригада №1 ПРС", before: "11.2", after: "14.5", gain: "+3.3", status: "В работе" },
            { well: "UAZ_0012", type: "Промывка песчаной пробки гидромонитором", start: "01.09.2026", end: "04.09.2026", team: "Бригада №3 ПРС", before: "6.1", after: "11.5", gain: "+5.4", status: "В работе" },
            { well: "UAZ_0004", type: "Смена клапанной пары ШГН / регулировка", start: "25.08.2026", end: "27.08.2026", team: "Бригада №1 ПРС", before: "12.0", after: "16.7", gain: "+4.7", status: "В работе" },
            { well: "UAZ_0062", type: "Ревизия кабельного ввода и термоманометра", start: "18.08.2026", end: "20.08.2026", team: "Бригада №4 ПРС", before: "13.0", after: "14.5", gain: "+1.5", status: "В работе" },
            { well: "UAZ_0031", type: "Очистка обратного клапана от солеотложений", start: "12.08.2026", end: "14.08.2026", team: "Бригада №2 ПРС", before: "10.1", after: "12.8", gain: "+2.7", status: "В работе" },
            { well: "UAZ_0034", type: "Смена глубинной насосной штанги (обрыв)", start: "06.08.2026", end: "08.08.2026", team: "Бригада №3 ПРС", before: "0.0", after: "24.9", gain: "+24.9", status: "В работе" },
            { well: "UAZ_0071", type: "Обработка ингибитором коррозии и промывка", start: "28.07.2026", end: "30.07.2026", team: "Бригада №2 ПРС", before: "38.2", after: "42.1", gain: "+3.9", status: "В работе" },
            { well: "UAZ_0109", type: "Замена сальникового уплотнения и штока", start: "21.07.2026", end: "22.07.2026", team: "Бригада №1 ПРС", before: "18.0", after: "22.6", gain: "+4.6", status: "В работе" },
            { well: "UAZ_0060", type: "Плановая смена погружного кабеля КПБП", start: "14.07.2026", end: "16.07.2026", team: "Бригада №4 ПРС", before: "19.5", after: "22.9", gain: "+3.4", status: "В работе" }
        ];

        var rows = (typeV === 2) ? rowsPRS : rowsGTM;

        var html = '<div class="popup-inner" style="max-width:2400px;">' +
                   '<div class="popup-close">&times;</div>' +
                   '<div class="popup-title">' + title + ' — Месторождение "Уаз"</div>' +
                   '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                   '<thead><tr style="background:#34343a;">' +
                   '<th>№ скважины</th><th>Вид ремонта / операции</th><th>Начало</th><th>Конец</th><th>Бригада</th>' +
                   '<th>Дебит до (м³/сут)</th><th>Дебит после (м³/сут)</th><th>Прирост</th><th>Статус</th>' +
                   '</tr></thead><tbody>';

        rows.forEach(function(r) {
            html += '<tr>' +
                    '<td><strong>' + r.well + '</strong></td>' +
                    '<td>' + r.type + '</td>' +
                    '<td>' + r.start + '</td>' +
                    '<td>' + r.end + '</td>' +
                    '<td>' + r.team + '</td>' +
                    '<td>' + r.before + '</td>' +
                    '<td>' + r.after + '</td>' +
                    '<td style="color:#54b948;font-weight:bold;">' + r.gain + '</td>' +
                    '<td><span class="label label-success" style="font-size:20px;">' + r.status + '</span></td>' +
                    '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }

    // --- 5. Годовой план добычи Modal Generator ---
    function generateYearPlanHtml() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Выполнение годового плана добычи нефти — <span style="color:#54b948;">135 412 тн</span> · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.7;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Баланс добычи за 2026 год</div>' +
                    '<div><b>Годовой утвержденный план:</b> <span style="font-size:32px;font-weight:bold;color:#fff;">135 412</span> тн</div>' +
                    '<div><b>Добыто с начала года (факт):</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">102 840 тн</span></div>' +
                    '<div><b>Ожидаемое выполнение года:</b> <span style="color:#54b948;font-weight:bold;">137 150 тн (101.3%)</span></div>' +
                    '<div><b>Текущее опережение графика:</b> <span style="color:#54b948;font-weight:bold;">+1 738 тн</span></div>' +
                    '<div><b>Среднесуточная добыча нефти:</b> <b>442 тн/сут</b> (план: 435 тн/сут)</div>' +
                    '<div><b>Парковый коэффициент нефти:</b> <b>0.93</b></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.7;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Источники прироста добычи</div>' +
                    '<div>· <b>Базовый фонд:</b> 98 420 тн (95.7% от объема)</div>' +
                    '<div>· <b>Эффект от ГТМ (ГРП, ОПЗ, дострелы):</b> <span style="color:#54b948;font-weight:bold;">+3 180 тн</span></div>' +
                    '<div>· <b>Оптимизация погружного оборудования (ЭЦН):</b> <span style="color:#54b948;font-weight:bold;">+840 тн</span></div>' +
                    '<div>· <b>Сокращение простоев фонда:</b> <span style="color:#54b948;font-weight:bold;">+400 тн</span></div>' +
                    '<div style="margin-top:15px;padding:12px;background:#1e3422;border-radius:8px;border:1px solid #54b948;color:#a3e9b1;">' +
                        '<b>Прогноз:</b> План года будет успешно выполнен до 22 декабря 2026 года.' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">Помесячный график выполнения плана добычи (2026 г.)</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;">' +
                    '<th>Месяц / Период</th><th>План (тн)</th><th>Факт (тн)</th><th>Выполнение (%)</th><th>Отклонение (тн)</th><th>Статус</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr><td>I квартал (Янв — Мар)</td><td>33 200</td><td>33 650</td><td>101.4%</td><td style="color:#54b948;font-weight:bold;">+450</td><td><span class="label label-success">Выполнен</span></td></tr>' +
                    '<tr><td>II квартал (Апр — Июн)</td><td>33 800</td><td>34 120</td><td>100.9%</td><td style="color:#54b948;font-weight:bold;">+320</td><td><span class="label label-success">Выполнен</span></td></tr>' +
                    '<tr><td>Июль</td><td>11 350</td><td>11 650</td><td>102.6%</td><td style="color:#54b948;font-weight:bold;">+300</td><td><span class="label label-success">Выполнен</span></td></tr>' +
                    '<tr><td>Август</td><td>11 350</td><td>11 720</td><td>103.3%</td><td style="color:#54b948;font-weight:bold;">+370</td><td><span class="label label-success">Выполнен</span></td></tr>' +
                    '<tr><td>Сентябрь (тек. ожидание)</td><td>11 400</td><td>11 700</td><td>102.6%</td><td style="color:#54b948;font-weight:bold;">+300</td><td><span class="label label-success">В графике</span></td></tr>' +
                    '<tr><td>IV квартал (Окт — Дек, план)</td><td>34 312</td><td>34 310</td><td>100.0%</td><td>0</td><td><span class="label label-primary">Запланирован</span></td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    // --- Interactive Well Passport Modal ---
    window.openWellPassportModal = function(wellName, debit) {
        var num = parseFloat(debit) || 15.0;
        var oilDebit = (num * 0.28).toFixed(2);
        var waterCut = (64.2 + (num % 5)).toFixed(1);
        
        var modalHtml = '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Паспорт скважины: <span style="color:#33cc33;">' + wellName + '</span> · Месторождение "Уаз" (НГДУ-1, ЦДНГ-1)</div>' +
            '<div style="display:flex;gap:40px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:28px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущий технологический режим</div>' +
                    '<div><b>Способ эксплуатации:</b> Механизированный (ЭЦН)</div>' +
                    '<div><b>Насос:</b> ЭЦН5-125-1400 / ПЭД-45-117</div>' +
                    '<div><b>Дебит жидкости:</b> <span style="color:#54b948;font-weight:bold;">' + debit + ' м³/сут</span> (ТР: ' + (num * 1.05).toFixed(2) + ')</div>' +
                    '<div><b>Дебит нефти:</b> <span style="color:#54b948;font-weight:bold;">' + oilDebit + ' т/сут</span></div>' +
                    '<div><b>Обводненность:</b> ' + waterCut + ' %</div>' +
                    '<div><b>Частота привода:</b> 48.5 Гц / Ток: 24.2 А</div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:28px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Давления и телеметрия</div>' +
                    '<div><b>Пластовое давление:</b> 12.4 МПа</div>' +
                    '<div><b>Забойное давление:</b> 7.82 МПа</div>' +
                    '<div><b>Буферное давление:</b> 0.85 МПа</div>' +
                    '<div><b>Линейное давление:</b> 0.31 МПа</div>' +
                    '<div><b>Динамический уровень:</b> 1120 м</div>' +
                    '<div><b>Статус:</b> <span class="label label-success" style="font-size:24px;">В работе</span> (Наработка: 482 сут)</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">История ремонтных работ и ГТМ</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;"><th>Дата</th><th>Вид операции</th><th>Исполнитель</th><th>Результат</th></tr></thead>' +
                '<tbody>' +
                    '<tr><td>14.05.2026</td><td>ПРС — Замена глубинного насоса</td><td>Бригада №3</td><td>Успешно, насос запущен</td></tr>' +
                    '<tr><td>22.11.2025</td><td>ГТМ — Соляно-кислотная обработка ПЗП</td><td>Бригада №1</td><td>Прирост дебита +6.8 м³/сут</td></tr>' +
                    '<tr><td>08.03.2025</td><td>Ревизия клапанного узла и датчиков ТМ</td><td>Сервисный центр</td><td>Параметры в норме</td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';

        showModal(modalHtml);
    };

    // --- Reverse Widget Modal Drill-down ---
    window.openReverseWidgetModal = function(elem) {
        var $el = $(elem);
        var title = $el.find('.m-button-title').text().trim();
        var type = 'fluid';
        if (title.indexOf('нефти') !== -1) type = 'oil';
        else if (title.indexOf('воды') !== -1) type = 'water';
        else if (title.indexOf('Парковый') !== -1 || title.indexOf('коэффициент') !== -1) type = 'balance';

        $.ajax({
            url: '/widget/reverseTable',
            data: { type: type },
            success: function(html) {
                showModal('<div class="popup-inner">' +
                          '<div class="popup-close">&times;</div>' +
                          html +
                          '</div>');
            }
        });
    };

    // --- Generic Modal Display Helper ---
    function showModal(contentHtml) {
        var $p = $('.popup');
        $p.html(contentHtml).addClass('show').show();
        $('.popup-close, .popup').off('click').on('click', function(e) {
            if (e.target === this || $(e.target).hasClass('popup-close')) {
                $p.removeClass('show').hide().empty();
            }
        });
    }

    // --- Modal Opening Handlers (Top Blocks & Scheme) ---
    window.openStockWellsModal = function() {
        showModal(generateStockWellsHtml());
    };

    window.openKesModal = function() {
        showModal(generateKesHtml());
    };

    window.openLast10Modal = function(typeV) {
        showModal(generateLast10Html(typeV || 1));
    };

    window.openYearPlanModal = function() {
        showModal(generateYearPlanHtml());
    };

    // --- Technological Scheme Modal Generators ---
    function generateRvsModal(num) {
        var isRvs1 = (num === 1);
        var title = isRvs1 
            ? 'РВС-1000 №1 (РВС 1) — Резервуар товарной нефти' 
            : 'РВС-2000 №2 (РВС 2) — Резервуар товарной нефти и отстоя';
        var vol = isRvs1 ? '1 000 м³' : '2 000 м³';
        var level = isRvs1 ? '556 см' : '881 см';
        var mass = isRvs1 ? '486.2 т' : '1 539.8 т';
        var fillPct = isRvs1 ? '49.0 %' : '73.9 %';
        var waterLevel = isRvs1 ? '0 см' : '7 см (подтоварная вода)';
        var temp = isRvs1 ? '22.4 °C' : '24.1 °C';
        var status = isRvs1 ? 'Накопление товарной нефти' : 'Отстой и подготовка к откачке';
        var diam = isRvs1 ? '10 430 мм' : '14 750 мм';
        var maxLevel = isRvs1 ? '11 350 мм' : '11 800 мм';

        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">' + title + ' · Товарный парк УПСВ "Уаз"</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущее оперативное состояние</div>' +
                    '<div><b>Номинальная емкость:</b> <span style="color:#fff;font-weight:bold;">' + vol + '</span></div>' +
                    '<div><b>Текущий уровень взлива:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">' + level + '</span></div>' +
                    '<div><b>Водяная подушка:</b> <b>' + waterLevel + '</b></div>' +
                    '<div><b>Масса нефти в резервуаре:</b> <span style="color:#54b948;font-weight:bold;">' + mass + '</span></div>' +
                    '<div><b>Коэффициент заполнения:</b> <b>' + fillPct + '</b></div>' +
                    '<div><b>Температура продукта:</b> <b>' + temp + '</b></div>' +
                    '<div><b>Технологический статус:</b> <span class="label label-success" style="font-size:22px;">' + status + '</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Паспортные характеристики сосуда</div>' +
                    '<div><b>Тип:</b> Резервуар вертикальный стальной цилиндрический</div>' +
                    '<div><b>Год выпуска / ввода:</b> 2014 г.</div>' +
                    '<div><b>Внутренний диаметр:</b> ' + diam + '</div>' +
                    '<div><b>Максимальный уровень налива:</b> ' + maxLevel + '</div>' +
                    '<div><b>Макс. расчетная температура:</b> +50 °C</div>' +
                    '<div><b>Температура холодной пятидневки:</b> -28 °C</div>' +
                    '<div><b>Нормативный срок службы:</b> 20 лет (до 2034 г.)</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">Системы противоаварийной защиты и телеметрии</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;"><th>Параметр / Датчик</th><th>Тип прибора</th><th>Уставка / Диапазон</th><th>Текущее показание</th><th>Статус</th></tr></thead>' +
                '<tbody>' +
                    '<tr><td>Уровнемер радарный</td><td>Enraf Saab Rosemount</td><td>0 — 12 000 мм</td><td style="color:#54b948;font-weight:bold;">' + level + '</td><td><span class="label label-success">Норма</span></td></tr>' +
                    '<tr><td>Датчик верхнего аварийного уровня (ВАУ)</td><td>Вибрационный сигнализатор</td><td>11 200 мм</td><td>Сухо</td><td><span class="label label-success">Готов</span></td></tr>' +
                    '<tr><td>Многоточечный термометр</td><td>RTD Взрывозащищенный</td><td>-40...+85 °C</td><td>' + temp + '</td><td><span class="label label-success">Норма</span></td></tr>' +
                    '<tr><td>Датчик довзрывных концентраций (ДВК)</td><td>Оптический газоанализатор</td><td>0 — 50% НКПР</td><td>0.0% НКПР</td><td><span class="label label-success">Норма</span></td></tr>' +
                    '<tr><td>Дыхательный клапан с огнепреградителем</td><td>КДС-1500 / ОП-150</td><td>P: +2.0 кПа / V: -0.25 кПа</td><td>В работе</td><td><span class="label label-success">Штатно</span></td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    function generateNasosModal(type) {
        var isOil = (type === 'перекачки');
        var title = isOil 
            ? 'Насосная станция перекачки товарной нефти (НСП) · УПСВ "Уаз"' 
            : 'Блочная кустовая насосная станция ППД (БКНС) · Месторождение "Уаз"';
        var pump1Status = '<span class="label label-success" style="font-size:22px;">В работе</span>';
        var pump2Status = '<span class="label label-primary" style="font-size:22px;">Резерв (АВР готов)</span>';
        var medium = isOil ? 'Товарная обезвоженная нефть' : 'Пластовая и подтоварная вода';
        var pWorking = isOil ? '1.85 МПа' : '12.5 МПа';
        var qWorking = isOil ? '45.2 м³/ч' : '53.3 м³/ч';
        var passportType = isOil ? 'Насос поршневой буровой / центробежный НБ-125' : 'Насос поршневой буровой НБ-125 ППД';
        var power = isOil ? '124.95 кВт (170 л.с.)' : '125 кВт (170 л.с.)';
        var year = isOil ? '2007' : '2013';

        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">' + title + '</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Состояние насосных агрегатов</div>' +
                    '<div><b>Рабочая среда:</b> ' + medium + '</div>' +
                    '<div><b>Агрегат №1:</b> ' + pump1Status + ' · Подача: <b style="color:#54b948;">' + qWorking + '</b> · Давление: <b style="color:#54b948;">' + pWorking + '</b></div>' +
                    '<div><b>Агрегат №2:</b> ' + pump2Status + ' · Подача: 0.0 м³/ч · Давление: 0.0 МПа</div>' +
                    '<div><b>Температура подшипников (№1):</b> 42.1 °C / 44.5 °C (норма &lt; 70 °C)</div>' +
                    '<div><b>Виброскорость (№1):</b> 1.8 мм/с (норма &lt; 4.5 мм/с)</div>' +
                    '<div><b>Система смазки и охлаждения:</b> В норме, давление масла 0.25 МПа</div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Паспорт оборудования (ГОСТ / Регламент)</div>' +
                    '<div><b>Модель агрегата:</b> ' + passportType + '</div>' +
                    '<div><b>Год выпуска:</b> ' + year + ' г.</div>' +
                    '<div><b>Мощность электропривода:</b> ' + power + '</div>' +
                    '<div><b>Габаритные размеры:</b> 2705 × 1000 × 2080 мм</div>' +
                    '<div><b>Масса агрегата:</b> 2 770 кг</div>' +
                    '<div><b>Напряжение питания:</b> 380 В / 50 Гц</div>' +
                    '<div><b>Наработка с начала эксплуатации:</b> 18 420 моточасов</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">Журнал регламентных и сервисных работ</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;"><th>Дата</th><th>Агрегат</th><th>Вид ТО / Ремонта</th><th>Исполнитель</th><th>Результат</th></tr></thead>' +
                '<tbody>' +
                    '<tr><td>12.06.2026</td><td>Агрегат №1</td><td>ТО-2: Замена торцевого уплотнения и масла</td><td>Механическая служба</td><td>Штатный пуск, утечек нет</td></tr>' +
                    '<tr><td>28.02.2026</td><td>Агрегат №2</td><td>Ревизия подшипниковых узлов, центровка валов</td><td>Сервисный центр</td><td>Вибрация в допуске 1.4 мм/с</td></tr>' +
                    '<tr><td>15.11.2025</td><td>Шкаф управления</td><td>Проверка срабатывания защит АВР и реле тока</td><td>Служба КИПиА</td><td>АВР сработал за 0.8 сек</td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    function generateMassometrModal(type) {
        var isOilDock = (type === 'эстакада-нефть');
        var isWaterDock = (type === 'эстакада-вода');
        var title = isOilDock 
            ? 'Расходомер нефти на наливной эстакаде (Кориолисовый массомер)' 
            : (isWaterDock ? 'Расходомер воды на наливной эстакаде' : 'Узел коммерческого учета нефти №1 (СИКН №1)');
        
        var d1 = isOilDock ? '0.00 т/ч' : (isWaterDock ? '0.00 м³/ч' : '0.00 т/ч');
        var d2 = isOilDock ? '701.49 т (смена)' : (isWaterDock ? '18 869.10 м³ (накоплено)' : '423 940.78 т (с начала года)');
        var modelName = isOilDock 
            ? 'Micro Motion Elite CMF-300 / 2700 Transmitter' 
            : (isWaterDock ? 'Promag 50W (Endress+Hauser)' : 'Кориолисовый преобразователь Promass F300 / СИКН');

        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">' + title + ' · УПСВ "Уаз"</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущие телеметрические данные</div>' +
                    '<div><b>Мгновенный расход:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">' + d1 + '</span></div>' +
                    '<div><b>Накопленный объем / масса:</b> <span style="color:#fff;font-weight:bold;">' + d2 + '</span></div>' +
                    '<div><b>Плотность среды:</b> <b>' + (isOilDock ? '874.15 кг/м³' : (isWaterDock ? '998.2 кг/м³' : '864.10 кг/м³')) + '</b></div>' +
                    '<div><b>Температура продукта:</b> <b>' + (isOilDock ? '21.8 °C' : (isWaterDock ? '16.5 °C' : '22.94 °C')) + '</b></div>' +
                    '<div><b>Давление в измерительной линии:</b> <b>' + (isOilDock ? '0.35 МПа' : (isWaterDock ? '0.45 МПа' : '0.45 кгс/см²')) + '</b></div>' +
                    '<div><b>Текущий технологический режим:</b> <span class="label label-success" style="font-size:22px;">Штатно / В сети</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Метрологический паспорт прибора</div>' +
                    '<div><b>Тип прибора:</b> ' + modelName + '</div>' +
                    '<div><b>Предел допускаемой погрешности массы:</b> ±0.10 %</div>' +
                    '<div><b>Предел допускаемой погрешности плотности:</b> ±0.5 кг/м³</div>' +
                    '<div><b>Дата последней поверки:</b> 15.02.2026 г. (Срок действия: до 15.02.2028 г.)</div>' +
                    '<div><b>Межповерочный интервал:</b> 2 года</div>' +
                    '<div><b>Протокол поверки:</b> № 104-М/2026 (КазИнМетр)</div>' +
                    '<div><b>Класс взрывозащиты:</b> 1Ex d [ia] IIC T6 Gb</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:30px;font-weight:bold;margin-bottom:15px;color:#fff;">Сводка сдачи продукции за последние периоды</div>' +
            '<table class="table table-bordered table-striped" style="font-size:24px;color:#fff;">' +
                '<thead><tr style="background:#3a3942;"><th>Дата / Период</th><th>Масса нетто (т)</th><th>Масса брутто (т)</th><th>Средняя плотность</th><th>Температура</th><th>Статус партии</th></tr></thead>' +
                '<tbody>' +
                    '<tr><td>26.09.2026 (тек. сутки)</td><td style="color:#54b948;font-weight:bold;">428.50</td><td>430.12</td><td>864.2 кг/м³</td><td>22.9 °C</td><td><span class="label label-success">Сдано в график</span></td></tr>' +
                    '<tr><td>25.09.2026</td><td>435.80</td><td>437.40</td><td>863.9 кг/м³</td><td>23.1 °C</td><td><span class="label label-success">Акт подписан</span></td></tr>' +
                    '<tr><td>24.09.2026</td><td>441.20</td><td>442.90</td><td>864.0 кг/м³</td><td>22.8 °C</td><td><span class="label label-success">Акт подписан</span></td></tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    function generateCounterModal(type) {
        var isWater = (type === 'вода');
        var title = isWater ? 'Узел учета воды (Система ППД)' : 'Узел учета попутного нефтяного газа (ПНГ)';
        var vol = isWater ? '1 645 728,5 м³' : '3 212 912,5 м³';
        var flow = isWater ? '53,3 м³/ч' : '195,7 м³/ч';
        var p = isWater ? '4.9 МПа' : '0.22 МПа';
        var target = isWater 
            ? 'Закачка в нагнетательные скважины для поддержания пластового давления' 
            : 'Топливо для печей подогрева ПТ-16 (120 м³/ч) и свеча рассеивания / факел';

        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">' + title + ' · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Показания приборов учета</div>' +
                    '<div><b>Накопленный объем:</b> <span style="color:#54b948;font-weight:bold;font-size:32px;">' + vol + '</span></div>' +
                    '<div><b>Текущий часовой расход:</b> <span style="color:#fff;font-weight:bold;font-size:30px;">' + flow + '</span></div>' +
                    '<div><b>Рабочее давление:</b> <b>' + p + '</b></div>' +
                    '<div><b>Назначение потока:</b> ' + target + '</div>' +
                    '<div><b>Статус узла:</b> <span class="label label-success" style="font-size:22px;">Непрерывный учет</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Оборудование узла учета</div>' +
                    '<div><b>Первичный преобразователь:</b> ' + (isWater ? 'Ультразвуковой расходомер Ultraflux' : 'Газосепаратор ГС + Ультразвуковой расходомер газа') + '</div>' +
                    '<div><b>Вычислитель расхода:</b> FloBoss S600 / SuperFlo</div>' +
                    '<div><b>Погрешность измерений:</b> ±1.0 %</div>' +
                    '<div><b>Год ввода в эксплуатацию:</b> 2018 г.</div>' +
                    '<div><b>Периодичность поверки:</b> 1 раз в год (поверен до 11.2026)</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function generateRgsModal(num) {
        var level = (num == 2) ? '205 см' : ((num == 3) ? '282 см' : '287 см');
        var water = (num == 2) ? '0 см' : ((num == 3) ? '100 см' : '0 см');
        var length = (num == 4) ? '13 015 мм' : '12 990 мм';
        var diam = (num == 4) ? '3 007 мм' : '2 999 мм';

        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Резервуар горизонтальный стальной РГС 90 м³ №' + num + ' · Блок сепарации и отстоя</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущие параметры отстоя</div>' +
                    '<div><b>Номинальная вместимость:</b> 90 / 100 м³</div>' +
                    '<div><b>Общий взлив:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">' + level + '</span></div>' +
                    '<div><b>Водяная подушка:</b> <b>' + water + '</b></div>' +
                    '<div><b>Рабочая температура:</b> 37.9 °C</div>' +
                    '<div><b>Технологическая функция:</b> Предварительный отстой водонефтяной эмульсии</div>' +
                    '<div><b>Статус:</b> <span class="label label-success" style="font-size:22px;">В работе</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Паспорт сосуда (ГОСТ 17032-2010)</div>' +
                    '<div><b>Год выпуска:</b> 1981 г. (капремонт с экспертизой ПБ: 2021 г.)</div>' +
                    '<div><b>Длина корпуса:</b> ' + length + '</div>' +
                    '<div><b>Диаметр:</b> ' + diam + '</div>' +
                    '<div><b>Рабочее давление:</b> 0.2 МПа</div>' +
                    '<div><b>Максимальная температура среды:</b> 100 °C</div>' +
                    '<div><b>Срок службы продлен:</b> до 2029 г.</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function generatePechModal(num) {
        var tIn = (num == 1) ? '14 °C' : '31 °C';
        var tOut = (num == 1) ? '35 °C' : '29 °C';
        var pIn = (num == 1) ? '2,70 кгс/см²' : '1,62 кгс/см²';
        var pOut = (num == 1) ? '1,70 кгс/см²' : '1,59 кгс/см²';

        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Подогреватель трубчатый блочный Печь №' + num + ' (ПТ-16/150М)</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущий технологический режим нагрева</div>' +
                    '<div><b>Температура продукта на входе:</b> <b style="color:#fff;">' + tIn + '</b></div>' +
                    '<div><b>Температура продукта на выходе:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">' + tOut + '</span></div>' +
                    '<div><b>Давление нефти на входе:</b> <b>' + pIn + '</b></div>' +
                    '<div><b>Давление нефти на выходе:</b> <b>' + pOut + '</b></div>' +
                    '<div><b>Давление топливного газа на горелку:</b> 0.45 кгс/см²</div>' +
                    '<div><b>Статус горелочного устройства:</b> <span class="label label-success" style="font-size:22px;">Факел стабилен / Автомат</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Паспорт оборудования ПТ-16/150М</div>' +
                    '<div><b>Год выпуска:</b> 2010 г.</div>' +
                    '<div><b>Тепловая мощность полная:</b> 2.0 МВт</div>' +
                    '<div><b>Температурный перепад среды (макс):</b> до 70 °C</div>' +
                    '<div><b>Температура нагреваемой среды (макс):</b> не более 80 °C</div>' +
                    '<div><b>Масса печи в сборе:</b> 15 000 кг</div>' +
                    '<div><b>Топливо:</b> Очищенный попутный нефтяной газ</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function generateCollectorModal() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Коллектор нефти ∅159×6 мм · Магистральная нитка перекачки</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Параметры перекачки нефти</div>' +
                    '<div><b>Трубопровод:</b> Стальная бесшовная труба ∅159 мм, стенка 6 мм</div>' +
                    '<div><b>Текущее давление в начале трассы:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">1.85 МПа</span></div>' +
                    '<div><b>Линейная скорость потока:</b> 0.85 м/с</div>' +
                    '<div><b>Расход транспортируемой нефти:</b> 45.2 м³/ч</div>' +
                    '<div><b>Температура нефти:</b> 22.9 °C</div>' +
                    '<div><b>Статус:</b> <span class="label label-success" style="font-size:22px;">Герметичен / Под давлением</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Технические данные и защита</div>' +
                    '<div><b>Марка стали:</b> Сталь 20 (ГОСТ 8732-78)</div>' +
                    '<div><b>Антикоррозионное покрытие:</b> 3-слойный экструдированный полиэтилен</div>' +
                    '<div><b>Катодная защита (ЭХЗ):</b> Станции СКЗ-1, СКЗ-2 (потенциал -1.15 В)</div>' +
                    '<div><b>Система обнаружения утечек (СОУ):</b> Волновой метод (активна)</div>' +
                    '<div><b>Срок очередной внутритрубной дефектоскопии (ВТД):</b> 2027 г.</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function generateZholdybayModal() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Трасса транспортировки нефти: УПСВ "Уаз" — ПСП "С.Жолдыбай" (25 км)</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Параметры маршрута сдачи</div>' +
                    '<div><b>Пункт отправления:</b> УПСВ "Уаз" (НГДУ "Жайыкмунайгаз")</div>' +
                    '<div><b>Пункт приема:</b> Приемо-сдаточный пункт "С.Жолдыбай" (ПСП)</div>' +
                    '<div><b>Протяженность нефтепровода:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">25.0 км</span></div>' +
                    '<div><b>Давление на приеме в С.Жолдыбай:</b> 0.65 МПа</div>' +
                    '<div><b>Суточная сдача:</b> 428.5 тн/сут</div>' +
                    '<div><b>Состояние трассы:</b> <span class="label label-success" style="font-size:22px;">Безаварийный режим</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Инфраструктура узла Жолдыбай</div>' +
                    '<div><b>Приемочные резервуары:</b> РВС-5000 №1, №2</div>' +
                    '<div><b>Качество сдаваемой нефти:</b> ГОСТ Р 51858-2002 (Группа 1)</div>' +
                    '<div><b>Обводненность нефти на сдаче:</b> 0.35 %</div>' +
                    '<div><b>Концентрация солей:</b> 32 мг/дм³</div>' +
                    '<div><b>Дальнейшая перекачка:</b> В систему магистральных нефтепроводов АО "КазТрансОйл"</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function generateBdrModal() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Блок дозирования химреагентов (БДР) · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущий режим дозирования</div>' +
                    '<div><b>Дозируемый реагент:</b> Деэмульгатор марки СНПХ-7890 / Dissolvan</div>' +
                    '<div><b>Текущий суточный расход:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">18.5 л/сут</span></div>' +
                    '<div><b>Удельная норма подачи:</b> 35.0 г на тонну сырой нефти</div>' +
                    '<div><b>Остаток реагента в емкости:</b> 1.85 м³ (61.7% объема)</div>' +
                    '<div><b>Статус насоса-дозатора:</b> <span class="label label-success" style="font-size:22px;">Непрерывное дозирование</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Характеристики установки БДР</div>' +
                    '<div><b>Тип блока:</b> БДР-2.5 / Взрывозащищенный модуль</div>' +
                    '<div><b>Насос-дозатор:</b> Плунжерный НД-1.0/100 (рабочий + резервный)</div>' +
                    '<div><b>Объем расходного резервуара:</b> 3.0 м³</div>' +
                    '<div><b>Давление нагнетания реагента:</b> 2.5 МПа</div>' +
                    '<div><b>Точка ввода реагента:</b> Сборный коллектор скважин перед первой ступенью сепарации</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function generateAgzuCircleModal() {
        return '<div class="popup-inner" style="max-width:2400px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title">Центральный замерный узел АГЗУ · Измерительный трап и телеметрия</div>' +
            '<div style="display:flex;gap:30px;margin-bottom:30px;">' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Текущие телеметрические показания</div>' +
                    '<div><b>Давление в замерном сепараторе:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">0.31 МПа</span></div>' +
                    '<div><b>Время текущего замера:</b> <span style="color:#fff;font-weight:bold;font-size:30px;">00:01</span> (цикл 2 часа)</div>' +
                    '<div><b>Температура газожидкостной смеси:</b> <span style="color:#54b948;font-weight:bold;font-size:30px;">21.31 °C</span></div>' +
                    '<div><b>Текущая скважина на замере:</b> <b style="color:#d5a62a;">UAZ_0031</b> (Отвод №9)</div>' +
                    '<div><b>Статус ПСМ (переключатель скважин):</b> <span class="label label-success" style="font-size:22px;">Герметичен / Замер активен</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#2d2d34;border-radius:10px;padding:25px;font-size:26px;line-height:1.8;">' +
                    '<div style="font-size:32px;font-weight:bold;margin-bottom:15px;color:#d5a62a;border-bottom:1px solid #444;padding-bottom:10px;">Комплектация установки "Спутник-АМ-40-14"</div>' +
                    '<div><b>Количество подключаемых скважин:</b> 14 отводов</div>' +
                    '<div><b>Преобразователь расхода жидкости:</b> ТОР-1-50 (Турбинный счетчик)</div>' +
                    '<div><b>Влагомер сырой нефти:</b> ВСН-2 (диэлькометрический)</div>' +
                    '<div><b>Погрешность измерения дебита:</b> ±2.5 %</div>' +
                    '<div><b>Шкаф телемеханики:</b> Контроллер B&R X20 / Modbus RTU</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    window.openRvsModal = function(num) { showModal(generateRvsModal(num)); };
    window.openNasosModal = function(type) { showModal(generateNasosModal(type)); };
    window.openMassometrModal = function(type) { showModal(generateMassometrModal(type)); };
    window.openCounterModal = function(type) { showModal(generateCounterModal(type)); };
    window.openRgsModal = function(num) { showModal(generateRgsModal(num)); };
    window.openPechModal = function(num) { showModal(generatePechModal(num)); };
    window.openCollectorModal = function() { showModal(generateCollectorModal()); };
    window.openZholdybayModal = function() { showModal(generateZholdybayModal()); };
    window.openBdrModal = function() { showModal(generateBdrModal()); };
    window.openAgzuCircleModal = function() { showModal(generateAgzuCircleModal()); };

    // --- Toast / Push notification ---
    window.showPushNotification = function(text) {
        $('.push').text(text).fadeIn('fast').delay(2500).fadeOut('fast');
    };

    // --- Global Click Interceptor (Capturing Phase) ---
    // Guarantees immediate response for all blocks, technological scheme elements, and modals
    document.addEventListener('click', function(e) {
        // Dismiss modal if clicking close button or backdrop
        if (e.target.classList.contains('popup-close') || e.target.classList.contains('popup')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            $('.popup').removeClass('show').hide().empty();
            return;
        }

        // If click is inside modal content, do not intercept
        if (e.target.closest('.popup-inner')) {
            return;
        }

        // 1. Page buttons in header
        var pageBtn = e.target.closest('.page-button');
        if (pageBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var id = pageBtn.id || '';
            var text = pageBtn.innerText || '';

            if (id === 'StockWells' || text.indexOf('Фонд скважин') !== -1) {
                window.openStockWellsModal();
            } else if (id === 'kesButton' || text.indexOf('КЭС') !== -1) {
                window.openKesModal();
            } else if (id === 'last10GTM' || text.indexOf('ГТМ') !== -1) {
                window.openLast10Modal(1);
            } else if (id === 'last10PRS' || text.indexOf('ПРС') !== -1) {
                window.openLast10Modal(2);
            } else if (id === 'yearPlan' || text.indexOf('Годовой план') !== -1 || $(pageBtn).hasClass('year')) {
                window.openYearPlanModal();
            }
            return;
        }

        // 2. Secondary KPI buttons (Reverse calculation)
        var mBtn = e.target.closest('.m-button');
        if (mBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openReverseWidgetModal(mBtn);
            return;
        }

        // 3. RVS tanks (РВС 1 and РВС 2)
        var rvsEl = e.target.closest('.rvs2, .rvs, [data-type^="rvs"]');
        if (rvsEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var isRvs1 = $(rvsEl).hasClass('rvs2') || 
                         $(rvsEl).attr('data-type') === 'rvs2' || 
                         $(rvsEl).text().indexOf('РВС 1') !== -1;
            window.openRvsModal(isRvs1 ? 1 : 2);
            return;
        }

        // 4. Pumps (Насосная перекачки нефти and Насосная ППД)
        var nasos2El = e.target.closest('.nasos2, [data-type="nasos2"]');
        if (nasos2El) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openNasosModal('перекачки');
            return;
        }
        var nasosEl = e.target.closest('.nasos, [data-type="nasos"]');
        if (nasosEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openNasosModal('ппд');
            return;
        }

        // 5. Massometers and flow meters
        var massometr2 = e.target.closest('.massometr-2');
        if (massometr2) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openMassometrModal('эстакада-нефть');
            return;
        }
        var massometr3 = e.target.closest('.massometr-3');
        if (massometr3) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openMassometrModal('эстакада-вода');
            return;
        }
        var massometr1 = e.target.closest('.massometr');
        if (massometr1) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openMassometrModal('узел-учета-1');
            return;
        }

        // 6. Water & Gas counter tables
        var waterTable = e.target.closest('.water-counter-table');
        if (waterTable) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openCounterModal('вода');
            return;
        }
        var gasTable = e.target.closest('.gas-counter-table');
        if (gasTable) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openCounterModal('газ');
            return;
        }

        // 7. RGS Horizontal tanks (РГС 2, 3, 4)
        var rgsEl = e.target.closest('.rgs, .rgs2, .rgs3, .rgs4, [data-type^="rgs"]');
        if (rgsEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var rgsNum = 3;
            var dt = $(rgsEl).attr('data-type') || '';
            if ($(rgsEl).hasClass('rgs2') || dt === 'rgs-2' || $(rgsEl).find('.f3').text().trim() === '2') rgsNum = 2;
            else if ($(rgsEl).hasClass('rgs4') || dt === 'rgs-4' || $(rgsEl).find('.f3').text().trim() === '4') rgsNum = 4;
            window.openRgsModal(rgsNum);
            return;
        }

        // 8. Furnaces (Печи №1, №2)
        var pechEl = e.target.closest('.pech1, .pech2, .pech, [data-type="pech"]');
        if (pechEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var pNum = 1;
            if ($(pechEl).hasClass('pech2') || $(pechEl).text().indexOf('Печь №2') !== -1) pNum = 2;
            window.openPechModal(pNum);
            return;
        }

        // 9. Pipelines and terminal
        var blockText1 = e.target.closest('.block-text-1');
        if (blockText1) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openCollectorModal();
            return;
        }
        var blockText2 = e.target.closest('.block-text-2');
        if (blockText2) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openZholdybayModal();
            return;
        }

        // 10. BDR (БДР)
        var bdrEl = e.target.closest('.bdr');
        if (bdrEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openBdrModal();
            return;
        }

        // 11. AGZU central circle
        var circleEl = e.target.closest('.agzu-circle');
        if (circleEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openAgzuCircleModal();
            return;
        }

        // 12. Well clicks in AGZU scheme
        var otvodEl = e.target.closest('.otvod, .otvod-b');
        if (otvodEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var wellName = $(otvodEl).find('.tt1').text().trim() || $(otvodEl).text().trim() || 'UAZ_0031';
            var debit = $(otvodEl).find('.tt2').text().trim() || '12.82';
            window.openWellPassportModal(wellName, debit);
            return;
        }

        // 13. Well clicks in normative table
        var normCell = e.target.closest('.normative-cell');
        if (normCell) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var wName = $(normCell).find('.well-number').text().trim() || $(normCell).data('id') || 'UAZ_0031';
            var deb = $(normCell).find('.evaluate').text().trim() || '14.50';
            window.openWellPassportModal(wName, deb);
            return;
        }

        // 14. AGZU toggle buttons - pass through to native onclick
        if (e.target.closest('.agzu-toggle-buttons .head')) {
            return;
        }
    }, true);

    // --- DOM Ready Bindings ---
    $(document).ready(function() {

        // 1. Initial Notification count & list load
        $.get('/notifications/1', function(data) {
            $('.nots').html(data);
        });

        // 2. Direct click bindings on all 5 header page-buttons
        $('#StockWells').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openStockWellsModal();
        });

        $('#kesButton').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openKesModal();
        });

        $('#last10GTM').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openLast10Modal(1);
        });

        $('#last10PRS').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openLast10Modal(2);
        });

        $('#yearPlan, .page-button.year').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openYearPlanModal();
        });

        // 3. Well clicks (both in AGZU scheme and in normative table)
        $(document).on('click', '.otvod, .normative-cell', function(e) {
            e.stopPropagation();
            var wellName = $(this).find('.tt1').text() || $(this).find('.well-number').text() || $(this).data('id') || 'UAZ_0031';
            var debit = $(this).find('.tt2').text() || $(this).find('.evaluate').text() || '12.82';
            window.openWellPassportModal(wellName, debit);
        });

        // 4. Menu Drawer toggle
        $('.open-menu-button, .menu-button').click(function(e) {
            e.stopPropagation();
            $('.menu-navigation').slideToggle('fast');
        });
        $(document).click(function() {
            $('.menu-navigation').slideUp('fast');
            $('.field-navigation').slideUp('fast');
            $('.sortByItem').slideUp('fast');
        });
        $('.menu-navigation, .field-navigation, .sortByItem').click(function(e) {
            e.stopPropagation();
        });

        // 5. Settings / Field dropdown
        $('.settings-button, .header .b6').click(function(e) {
            e.stopPropagation();
            $('.field-navigation').slideToggle('fast');
        });

        // 6. Notification Drawer toggle
        $('#alert-btn-open').click(function(e) {
            e.stopPropagation();
            $('.notification-list').slideDown('fast');
            $('#alert-btn-open').hide();
            $('#alert-btn-close').show();
        });
        $('#alert-btn-close').click(function(e) {
            e.stopPropagation();
            $('.notification-list').slideUp('fast');
            $('#alert-btn-open').show();
            $('#alert-btn-close').hide();
        });

        // 7. Notification Item Click -> Event Card Overlay
        $(document).on('click', '.notification-list ul li', function() {
            var zid = $(this).attr('zid');
            var well = $(this).find('strong').text();
            $('.card-id').html('<b>№ события:</b> ' + zid);
            $('.card-mesto').html('<b>Скважина:</b> ' + well);
            $('.card-event').html('<b>Описание:</b> ' + $(this).text());
            $('.card-start').html('<b>Время фиксации:</b> 26.09.2026 20:47');
            $('.overlay').fadeIn('fast');
        });
        $('.close-box-submit, .send-box-submit').click(function() {
            $('.overlay').fadeOut('fast');
            window.showPushNotification('Изменения сохранены!');
        });

        // 8. Sorter Dropdown form submit (offline DOM sorting)
        $('#normativeSortForm').on('submit', function(e) {
            e.preventDefault();
            var orderBy = $('#orderBy').val();
            var isDesc = $('#orderTypeDesc').is(':checked');
            
            var $normTable = $('#normTable');
            var $cells = $normTable.find('.normative-cell');
            var sorted = $cells.get().sort(function(a, b) {
                var valA = 0, valB = 0;
                if (orderBy === 'tr_oil') {
                    valA = parseFloat($(a).find('.tech-mode-oil').text()) || 0;
                    valB = parseFloat($(b).find('.tech-mode-oil').text()) || 0;
                } else if (orderBy === 'tr_fluid') {
                    valA = parseFloat($(a).find('.tech-mode-fluid').text()) || 0;
                    valB = parseFloat($(b).find('.tech-mode-fluid').text()) || 0;
                } else if (orderBy === 'water_cut') {
                    valA = parseFloat($(a).find('.water-loading').text()) || 0;
                    valB = parseFloat($(b).find('.water-loading').text()) || 0;
                } else {
                    valA = parseFloat($(a).find('.evaluate').text()) || 0;
                    valB = parseFloat($(b).find('.evaluate').text()) || 0;
                }
                return isDesc ? (valB - valA) : (valA - valB);
            });
            $normTable.append(sorted);
            $('.sortByItem').hide();
            window.showPushNotification('Таблица скважин отсортирована');
        });

        // 9. Download Report button
        $('#downloadWellsReport').click(function(e) {
            e.preventDefault();
            window.showPushNotification('Отчет по скважинам успешно сформирован!');
        });

        // 10. Reports button
        $('#button-report').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#report').toggle();
        });
        $('.btn-cancel').click(function() {
            $('#report').hide();
        });
    });

})();
