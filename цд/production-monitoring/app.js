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
            var m = url.match(/\/legends\/(\d+)/);
            var num = m ? parseInt(m[1]) : 1;
            if (num < 1 || num > 9) num = 1;
            return originalAjax.call($, {
                url: 'legends/legend_' + num + '.html',
                dataType: 'html',
                success: function(resp) {
                    if (options.success) options.success(resp);
                },
                error: function() {
                    if (options.success) options.success('<div class="own-table active">Паспорт оборудования</div>');
                }
            });
        }

        // 8. Widgets Update
        if (url.indexOf('/widget/') !== -1) {
            if (url.indexOf('scheme') !== -1) {
                // Offline mode: scheme is already rendered in index.html, do not replace
                return;
            }
            if (url.indexOf('normativeTable') !== -1) {
                if (options.success) options.success($('#normTable').parent().html());
                return;
            }
            return;
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
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Фонд скважин — Месторождение "Уаз" (Всего: <span style="color:#54b948;">82</span> скважины)</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Структура фонда скважин</div>' +
                    '<div><b>Общий фонд скважин:</b> <span style="font-size:24px;font-weight:bold;color:#fff;">82</span> скв.</div>' +
                    '<div><b>Действующий добывающий фонд:</b> <span style="color:#54b948;font-weight:bold;">71</span> скв. (86.6%)</div>' +
                    '<div>&nbsp;&nbsp;· В непрерывной работе: <b>68</b> скв.</div>' +
                    '<div>&nbsp;&nbsp;· В циклической эксплуатации: <b>3</b> скв.</div>' +
                    '<div><b>Бездействующий фонд:</b> <span style="color:#ef5c65;font-weight:bold;">7</span> скв. (8.5%)</div>' +
                    '<div>&nbsp;&nbsp;· В ожидании ремонта (ПРС/КРС): <b>4</b> скв.</div>' +
                    '<div>&nbsp;&nbsp;· В консервации / ожидание ликвидации: <b>3</b> скв.</div>' +
                    '<div><b>Нагнетательный фонд (система ППД):</b> <b>2</b> скв.</div>' +
                    '<div><b>Освоение после бурения:</b> <b>2</b> скв.</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Способы механизированной добычи</div>' +
                    '<div style="margin-bottom:8px;"><b>ЭЦН (электроцентробежные насосы):</b> <span style="color:#54b948;font-weight:bold;">64 скв.</span> (78.0%)</div>' +
                    '<div style="background:#181b24;border-radius:5px;height:20px;overflow:hidden;margin-bottom:16px;">' +
                        '<div style="background:#54b948;width:78%;height:100%;"></div>' +
                    '</div>' +
                    '<div style="margin-bottom:8px;"><b>ШГН (штанговые глубинные насосы):</b> <span style="color:#ffd24d;font-weight:bold;">18 скв.</span> (22.0%)</div>' +
                    '<div style="background:#181b24;border-radius:5px;height:20px;overflow:hidden;margin-bottom:16px;">' +
                        '<div style="background:#ffd24d;width:22%;height:100%;"></div>' +
                    '</div>' +
                    '<div><b>Средний дебит на 1 действ. скважину:</b></div>' +
                    '<div>· Жидкости: <b>23.7 м³/сут</b> &nbsp;|&nbsp; · Нефти: <b>6.2 т/сут</b></div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:10px;color:#ffd24d;">Сводная ведомость распределения фонда по категориям</div>' +
            '<table class="table table-bordered" style="width:100%;font-size:16px;margin-bottom:0;border:1px solid #3e4659;background:#181b24;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;">Категория фонда скважин</th>' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;text-align:center;">Кол-во (скв.)</th>' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;text-align:right;">Дебит жидкости (м³/сут)</th>' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;text-align:right;">Дебит нефти (т/сут)</th>' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;text-align:center;">Средняя обводненность</th>' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;text-align:center;">Доля от фонда</th>' +
                    '<th style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;text-align:center;">Статус</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;">Добывающие скважины в работе</td>' +
                        '<td style="color:#54b948;padding:6px 10px;border:1px solid #313848;text-align:center;font-weight:bold;font-size:18px;">68</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:right;">1 645.2</td>' +
                        '<td style="color:#54b948;padding:6px 10px;border:1px solid #313848;text-align:right;font-weight:bold;">431.8</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">63.8%</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">82.9%</td>' +
                        '<td style="padding:6px 10px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:14px;padding:3px 7px;border-radius:3px;">В работе</span></td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;">Периодический / циклический фонд</td>' +
                        '<td style="color:#ffd24d;padding:6px 10px;border:1px solid #313848;text-align:center;font-weight:bold;font-size:18px;">3</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:right;">37.1</td>' +
                        '<td style="color:#ffd24d;padding:6px 10px;border:1px solid #313848;text-align:right;font-weight:bold;">10.2</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">61.5%</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">3.7%</td>' +
                        '<td style="padding:6px 10px;border:1px solid #313848;text-align:center;"><span class="label label-warning" style="font-size:14px;padding:3px 7px;border-radius:3px;">Цикл</span></td>' +
                    '</tr>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;">Ожидание текущего ремонта (ПРС)</td>' +
                        '<td style="color:#ef5c65;padding:6px 10px;border:1px solid #313848;text-align:center;font-weight:bold;font-size:18px;">4</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">0.0</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">0.0</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:center;">—</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">4.9%</td>' +
                        '<td style="padding:6px 10px;border:1px solid #313848;text-align:center;"><span class="label label-danger" style="font-size:14px;padding:3px 7px;border-radius:3px;">Простой (ПРС)</span></td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;">В консервации / ожидает ликвидации</td>' +
                        '<td style="color:#a0a8b9;padding:6px 10px;border:1px solid #313848;text-align:center;font-weight:bold;font-size:18px;">3</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">0.0</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">0.0</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:center;">—</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">3.7%</td>' +
                        '<td style="padding:6px 10px;border:1px solid #313848;text-align:center;"><span class="label label-default" style="font-size:14px;padding:3px 7px;border-radius:3px;background:#555d70;">Консервация</span></td>' +
                    '</tr>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;">Нагнетательные скважины (ППД)</td>' +
                        '<td style="color:#5bc0de;padding:6px 10px;border:1px solid #313848;text-align:center;font-weight:bold;font-size:18px;">2</td>' +
                        '<td style="color:#5bc0de;padding:6px 10px;border:1px solid #313848;text-align:right;">— (закачка: 1 645)</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">—</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:center;">—</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">2.4%</td>' +
                        '<td style="padding:6px 10px;border:1px solid #313848;text-align:center;"><span class="label label-info" style="font-size:14px;padding:3px 7px;border-radius:3px;">Закачка</span></td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;">Освоение после бурения / ГРП</td>' +
                        '<td style="color:#4a90e2;padding:6px 10px;border:1px solid #313848;text-align:center;font-weight:bold;font-size:18px;">2</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">—</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:right;">—</td>' +
                        '<td style="color:#8892a6;padding:6px 10px;border:1px solid #313848;text-align:center;">—</td>' +
                        '<td style="color:#ffffff;padding:6px 10px;border:1px solid #313848;text-align:center;">2.4%</td>' +
                        '<td style="padding:6px 10px;border:1px solid #313848;text-align:center;"><span class="label label-primary" style="font-size:14px;padding:3px 7px;border-radius:3px;">Освоение</span></td>' +
                    '</tr>' +
                    '<tr style="background:#2c3345;font-weight:bold;">' +
                        '<td style="color:#ffd24d;padding:8px 10px;border:1px solid #3e4659;">ИТОГО ПО МЕСТОРОЖДЕНИЮ</td>' +
                        '<td style="color:#ffffff;text-align:center;font-size:18px;padding:8px 10px;border:1px solid #3e4659;">82</td>' +
                        '<td style="color:#ffffff;text-align:right;padding:8px 10px;border:1px solid #3e4659;">1 682.3</td>' +
                        '<td style="color:#54b948;text-align:right;font-size:18px;padding:8px 10px;border:1px solid #3e4659;">442.0</td>' +
                        '<td style="color:#ffffff;text-align:center;padding:8px 10px;border:1px solid #3e4659;">63.7%</td>' +
                        '<td style="color:#ffffff;text-align:center;padding:8px 10px;border:1px solid #3e4659;">100.0%</td>' +
                        '<td style="color:#54b948;text-align:center;padding:8px 10px;border:1px solid #3e4659;">86.6% экспл.</td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    // --- 2. КЭС (%) Modal Generator ---
    function generateKesHtml() {
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Коэффициент эксплуатации скважин (КЭС) — <span style="color:#54b948;">97.09%</span> · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Основные индикаторы эксплуатации</div>' +
                    '<div><b>Текущий КЭС:</b> <span style="font-size:26px;font-weight:bold;color:#54b948;">97.09 %</span></div>' +
                    '<div><b>Плановый КЭС:</b> 96.50 % (перевыполнение <span style="color:#54b948;font-weight:bold;">+0.59%</span>)</div>' +
                    '<div><b>Коэффициент использования фонда (КИФ):</b> <b>0.866</b></div>' +
                    '<div><b>Отработано скважино-дней в месяце:</b> <b>2 136</b> из 2 200 скв.-дн.</div>' +
                    '<div><b>Суммарное время простоев:</b> <span style="color:#ef5c65;font-weight:bold;">64 скважино-часа</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Динамика КЭС по месяцам (2026 г.)</div>' +
                    '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;font-size:18px;text-align:center;">' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Янв: <b>96.8%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Фев: <b>96.9%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Мар: <b>97.0%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Апр: <b>96.7%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Май: <b>97.2%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Июн: <b>97.1%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Июл: <b>96.9%</b></div>' +
                        '<div style="background:#181b24;padding:8px;border-radius:5px;border:1px solid #313848;">Авг: <b>97.0%</b></div>' +
                        '<div style="background:#1f3a24;padding:8px;border-radius:5px;border:1px solid #54b948;color:#a3e9b1;">Сен: <b>97.09%</b></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Структура и анализ причин простоев фонда за текущий месяц</div>' +
            '<table class="table table-bordered" style="font-size:18px;margin-bottom:0;border:1px solid #3e4659;background:#181b24;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Причина простоя</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Простой (скв.-часы)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Скважины</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Доля в общих простоях</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Принятые оперативные меры</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Ремонт погружного оборудования (отказ ЭЦН)</td>' +
                        '<td style="color:#ef5c65;font-weight:bold;padding:7px 12px;border:1px solid #313848;">28 ч</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">UAZ_0065, UAZ_0014</td>' +
                        '<td style="color:#ef5c65;font-weight:bold;padding:7px 12px;border:1px solid #313848;">43.8%</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Направлена бригада №2 ПРС, подъем оборудования в графике</td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Гидродинамические исследования (КВД, замер Рпл)</td>' +
                        '<td style="color:#ffd24d;font-weight:bold;padding:7px 12px;border:1px solid #313848;">18 ч</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">UAZ_0011, UAZ_0043</td>' +
                        '<td style="color:#ffd24d;font-weight:bold;padding:7px 12px;border:1px solid #313848;">28.1%</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Плановые исследования завершены, скважины запущены в работу</td>' +
                    '</tr>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Ревизия электрооборудования / станции управления</td>' +
                        '<td style="color:#ffffff;font-weight:bold;padding:7px 12px;border:1px solid #313848;">12 ч</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">UAZ_0103</td>' +
                        '<td style="color:#ffffff;font-weight:bold;padding:7px 12px;border:1px solid #313848;">18.7%</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Заменен силовой контактор ЧРП, параметры телеметрии в норме</td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Промывка забоя от песчаных пробок</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;">6 ч</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">UAZ_0071</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;">9.4%</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Промывка завершена, выход на технологический режим за 4 часа</td>' +
                    '</tr>' +
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

        var html = '<div class="popup-inner" style="max-width:2200px;padding:30px 35px;">' +
                   '<div class="popup-close">&times;</div>' +
                   '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' + title + ' — Месторождение "Уаз"</div>' +
                   '<table class="table table-bordered" style="font-size:18px;margin-bottom:0;border:1px solid #3e4659;background:#181b24;">' +
                   '<thead><tr style="background:#272d3b;">' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">№ скважины</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Вид ремонта / операции</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Начало</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Конец</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Бригада</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Дебит до (м³/сут)</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Дебит после (м³/сут)</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Прирост</th>' +
                   '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Статус</th>' +
                   '</tr></thead><tbody>';

        rows.forEach(function(r, idx) {
            var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
            html += '<tr style="background:' + bg + ';">' +
                    '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;"><strong>' + r.well + '</strong></td>' +
                    '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">' + r.type + '</td>' +
                    '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">' + r.start + '</td>' +
                    '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">' + r.end + '</td>' +
                    '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">' + r.team + '</td>' +
                    '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">' + r.before + '</td>' +
                    '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">' + r.after + '</td>' +
                    '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">' + r.gain + '</td>' +
                    '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">' + r.status + '</span></td>' +
                    '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }

    // --- 5. Годовой план добычи Modal Generator ---
    function generateYearPlanHtml() {
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Выполнение годового плана добычи нефти — <span style="color:#54b948;">135 412 тн</span> · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Баланс добычи за 2026 год</div>' +
                    '<div><b>Годовой утвержденный план:</b> <span style="font-size:24px;font-weight:bold;color:#fff;">135 412</span> тн</div>' +
                    '<div><b>Добыто с начала года (факт):</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">102 840 тн</span></div>' +
                    '<div><b>Ожидаемое выполнение года:</b> <span style="color:#54b948;font-weight:bold;">137 150 тн (101.3%)</span></div>' +
                    '<div><b>Текущее опережение графика:</b> <span style="color:#54b948;font-weight:bold;">+1 738 тн</span></div>' +
                    '<div><b>Среднесуточная добыча нефти:</b> <b>442 тн/сут</b> (план: 435 тн/сут)</div>' +
                    '<div><b>Парковый коэффициент нефти:</b> <b>0.93</b></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Источники прироста добычи</div>' +
                    '<div>· <b>Базовый фонд:</b> 98 420 тн (95.7% от объема)</div>' +
                    '<div>· <b>Эффект от ГТМ (ГРП, ОПЗ, дострелы):</b> <span style="color:#54b948;font-weight:bold;">+3 180 тн</span></div>' +
                    '<div>· <b>Оптимизация погружного оборудования (ЭЦН):</b> <span style="color:#54b948;font-weight:bold;">+840 тн</span></div>' +
                    '<div>· <b>Сокращение простоев фонда:</b> <span style="color:#54b948;font-weight:bold;">+400 тн</span></div>' +
                    '<div style="margin-top:12px;padding:10px 14px;background:#1e3422;border-radius:6px;border:1px solid #54b948;color:#a3e9b1;font-size:18px;">' +
                        '<b>Прогноз:</b> План года будет успешно выполнен до 22 декабря 2026 года.' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Помесячный график выполнения плана добычи (2026 г.)</div>' +
            '<table class="table table-bordered" style="font-size:18px;margin-bottom:0;border:1px solid #3e4659;background:#181b24;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Месяц / Период</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">План (тн)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Факт (тн)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Выполнение (%)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Отклонение (тн)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Статус</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">I квартал (Янв — Мар)</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">33 200</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">33 650</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:center;">101.4%</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">+450</td>' +
                        '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Выполнен</span></td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">II квартал (Апр — Июн)</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">33 800</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">34 120</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:center;">100.9%</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">+320</td>' +
                        '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Выполнен</span></td>' +
                    '</tr>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Июль</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">11 350</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">11 650</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:center;">102.6%</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">+300</td>' +
                        '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Выполнен</span></td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Август</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">11 350</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">11 720</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:center;">103.3%</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">+370</td>' +
                        '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Выполнен</span></td>' +
                    '</tr>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Сентябрь (тек. ожидание)</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">11 400</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">11 700</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:center;">102.6%</td>' +
                        '<td style="color:#54b948;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:right;">+300</td>' +
                        '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">В графике</span></td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">IV квартал (Окт — Дек, план)</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">34 312</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">34 310</td>' +
                        '<td style="color:#4a90e2;font-weight:bold;padding:7px 12px;border:1px solid #313848;text-align:center;">100.0%</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;text-align:right;">0</td>' +
                        '<td style="padding:7px 12px;border:1px solid #313848;text-align:center;"><span class="label label-primary" style="font-size:15px;padding:3px 8px;border-radius:3px;">Запланирован</span></td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
    }

    // --- Well Passport Modal ---
    window.openWellPassportModal = function(wellName, debit) {
        var num = parseFloat(debit) || 15.0;
        var oilDebit = (num * 0.28).toFixed(2);
        var waterCut = (64.2 + (num % 5)).toFixed(1);
        
        var modalHtml = '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Паспорт скважины: <span style="color:#54b948;">' + wellName + '</span> · Месторождение "Уаз" (НГДУ-1, ЦДНГ-1)</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Текущий технологический режим</div>' +
                    '<div><b>Способ эксплуатации:</b> Механизированный (ЭЦН)</div>' +
                    '<div><b>Насос:</b> ЭЦН5-125-1400 / ПЭД-45-117</div>' +
                    '<div><b>Дебит жидкости:</b> <span style="color:#54b948;font-weight:bold;">' + debit + ' м³/сут</span> (ТР: ' + (num * 1.05).toFixed(2) + ')</div>' +
                    '<div><b>Дебит нефти:</b> <span style="color:#54b948;font-weight:bold;">' + oilDebit + ' т/сут</span></div>' +
                    '<div><b>Обводненность:</b> ' + waterCut + ' %</div>' +
                    '<div><b>Частота привода:</b> 48.5 Гц / Ток: 24.2 А</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Давления и телеметрия</div>' +
                    '<div><b>Пластовое давление:</b> 12.4 МПа</div>' +
                    '<div><b>Забойное давление:</b> 7.82 МПа</div>' +
                    '<div><b>Буферное давление:</b> 0.85 МПа</div>' +
                    '<div><b>Линейное давление:</b> 0.31 МПа</div>' +
                    '<div><b>Динамический уровень:</b> 1120 м</div>' +
                    '<div><b>Статус:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">В работе</span> (Наработка: 482 сут)</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">История ремонтных работ и ГТМ</div>' +
            '<table class="table table-bordered" style="font-size:18px;margin-bottom:0;border:1px solid #3e4659;background:#181b24;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:8px 12px;border:1px solid #3e4659;">Дата</th>' +
                    '<th style="color:#ffd24d;padding:8px 12px;border:1px solid #3e4659;">Вид операции</th>' +
                    '<th style="color:#ffd24d;padding:8px 12px;border:1px solid #3e4659;">Исполнитель</th>' +
                    '<th style="color:#ffd24d;padding:8px 12px;border:1px solid #3e4659;">Результат</th>' +
                '</tr></thead>' +
                '<tbody>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">14.05.2026</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">ПРС — Замена глубинного насоса</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Бригада №3</td>' +
                        '<td style="color:#54b948;padding:7px 12px;border:1px solid #313848;">Успешно, насос запущен</td>' +
                    '</tr>' +
                    '<tr style="background:#181b24;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">22.11.2025</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">ГТМ — Соляно-кислотная обработка ПЗП</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Бригада №1</td>' +
                        '<td style="color:#54b948;padding:7px 12px;border:1px solid #313848;">Прирост дебита +6.8 м³/сут</td>' +
                    '</tr>' +
                    '<tr style="background:#212533;">' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">08.03.2025</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Ревизия клапанного узла и датчиков ТМ</td>' +
                        '<td style="color:#ffffff;padding:7px 12px;border:1px solid #313848;">Сервисный центр</td>' +
                        '<td style="color:#54b948;padding:7px 12px;border:1px solid #313848;">Параметры в норме</td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
        showModal(modalHtml);
    };

    // --- RGS Horizontal Tanks Modal Generator ---
    function generateRgsModal(num) {
        var level = (num == 2) ? '205 см' : ((num == 3) ? '282 см' : '287 см');
        var water = (num == 2) ? '0 см' : ((num == 3) ? '100 см' : '0 см');
        var length = (num == 4) ? '13 015 мм' : '12 990 мм';
        var diam = (num == 4) ? '3 007 мм' : '2 999 мм';

        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Резервуар горизонтальный стальной РГС 90 м³ №' + num + ' · Блок сепарации и отстоя</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Текущие параметры отстоя</div>' +
                    '<div><b>Номинальная вместимость:</b> 90 / 100 м³</div>' +
                    '<div><b>Общий взлив:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">' + level + '</span></div>' +
                    '<div><b>Водяная подушка:</b> <b>' + water + '</b></div>' +
                    '<div><b>Рабочая температура:</b> 37.9 °C</div>' +
                    '<div><b>Технологическая функция:</b> Предварительный отстой водонефтяной эмульсии</div>' +
                    '<div><b>Статус:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">В работе</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Паспорт сосуда (ГОСТ 17032-2010)</div>' +
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

    // --- Furnaces Modal Generator ---
    function generatePechModal(num) {
        var tIn = (num == 1) ? '14 °C' : '31 °C';
        var tOut = (num == 1) ? '35 °C' : '29 °C';
        var pIn = (num == 1) ? '2,70 кгс/см²' : '1,62 кгс/см²';
        var pOut = (num == 1) ? '1,70 кгс/см²' : '1,59 кгс/см²';

        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Подогреватель трубчатый блочный Печь №' + num + ' (ПТ-16/150М)</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Текущий технологический режим нагрева</div>' +
                    '<div><b>Температура продукта на входе:</b> <b style="color:#fff;">' + tIn + '</b></div>' +
                    '<div><b>Температура продукта на выходе:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">' + tOut + '</span></div>' +
                    '<div><b>Давление нефти на входе:</b> <b>' + pIn + '</b></div>' +
                    '<div><b>Давление нефти на выходе:</b> <b>' + pOut + '</b></div>' +
                    '<div><b>Давление топливного газа на горелку:</b> 0.45 кгс/см²</div>' +
                    '<div><b>Статус горелочного устройства:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Факел стабилен / Автомат</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Паспорт оборудования ПТ-16/150М</div>' +
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

    // --- Collector Modal Generator ---
    function generateCollectorModal() {
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Коллектор нефти ∅159×6 мм · Магистральная нитка перекачки</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Параметры перекачки нефти</div>' +
                    '<div><b>Трубопровод:</b> Стальная бесшовная труба ∅159 мм, стенка 6 мм</div>' +
                    '<div><b>Текущее давление в начале трассы:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">1.85 МПа</span></div>' +
                    '<div><b>Линейная скорость потока:</b> 0.85 м/с</div>' +
                    '<div><b>Расход транспортируемой нефти:</b> 45.2 м³/ч</div>' +
                    '<div><b>Температура нефти:</b> 22.9 °C</div>' +
                    '<div><b>Статус:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Герметичен / Под давлением</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Технические данные и защита</div>' +
                    '<div><b>Марка стали:</b> Сталь 20 (ГОСТ 8732-78)</div>' +
                    '<div><b>Антикоррозионное покрытие:</b> 3-слойный экструдированный полиэтилен</div>' +
                    '<div><b>Катодная защита (ЭХЗ):</b> Станции СКЗ-1, СКЗ-2 (потенциал -1.15 В)</div>' +
                    '<div><b>Система обнаружения утечек (СОУ):</b> Волновой метод (активна)</div>' +
                    '<div><b>Срок очередной внутритрубной дефектоскопии (ВТД):</b> 2027 г.</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- Zholdybay Modal Generator ---
    function generateZholdybayModal() {
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Трасса транспортировки нефти: УПСВ "Уаз" — ПСП "С.Жолдыбай" (25 км)</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Параметры маршрута сдачи</div>' +
                    '<div><b>Пункт отправления:</b> УПСВ "Уаз" (НГДУ "Жайыкмунайгаз")</div>' +
                    '<div><b>Пункт приема:</b> Приемо-сдаточный пункт "С.Жолдыбай" (ПСП)</div>' +
                    '<div><b>Протяженность нефтепровода:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">25.0 км</span></div>' +
                    '<div><b>Давление на приеме в С.Жолдыбай:</b> 0.65 МПа</div>' +
                    '<div><b>Суточная сдача:</b> 428.5 тн/сут</div>' +
                    '<div><b>Состояние трассы:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Безаварийный режим</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Инфраструктура узла Жолдыбай</div>' +
                    '<div><b>Приемочные резервуары:</b> РВС-5000 №1, №2</div>' +
                    '<div><b>Качество сдаваемой нефти:</b> ГОСТ Р 51858-2002 (Группа 1)</div>' +
                    '<div><b>Обводненность нефти на сдаче:</b> 0.35 %</div>' +
                    '<div><b>Концентрация солей:</b> 32 мг/дм³</div>' +
                    '<div><b>Дальнейшая перекачка:</b> В систему магистральных нефтепроводов АО "КазТрансОйл"</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- BDR Modal Generator ---
    function generateBdrModal() {
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Блок дозирования химреагентов (БДР) · Месторождение "Уаз"</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Текущий режим дозирования</div>' +
                    '<div><b>Дозируемый реагент:</b> Деэмульгатор марки СНПХ-7890 / Dissolvan</div>' +
                    '<div><b>Текущий суточный расход:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">18.5 л/сут</span></div>' +
                    '<div><b>Удельная норма подачи:</b> 35.0 г на тонну сырой нефти</div>' +
                    '<div><b>Остаток реагента в емкости:</b> 1.85 м³ (61.7% объема)</div>' +
                    '<div><b>Статус насоса-дозатора:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Непрерывное дозирование</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Характеристики установки БДР</div>' +
                    '<div><b>Тип блока:</b> БДР-2.5 / Взрывозащищенный модуль</div>' +
                    '<div><b>Насос-дозатор:</b> Плунжерный НД-1.0/100 (рабочий + резервный)</div>' +
                    '<div><b>Объем расходного резервуара:</b> 3.0 м³</div>' +
                    '<div><b>Давление нагнетания реагента:</b> 2.5 МПа</div>' +
                    '<div><b>Точка ввода реагента:</b> Сборный коллектор скважин перед первой ступенью сепарации</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- AGZU Circle Modal Generator ---
    function generateAgzuCircleModal() {
        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">Центральный замерный узел АГЗУ · Измерительный трап и телеметрия</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Текущие телеметрические показания</div>' +
                    '<div><b>Давление в замерном сепараторе:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">0.31 МПа</span></div>' +
                    '<div><b>Время текущего замера:</b> <span style="color:#fff;font-weight:bold;font-size:24px;">00:01</span> (цикл 2 часа)</div>' +
                    '<div><b>Температура газожидкостной смеси:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">21.31 °C</span></div>' +
                    '<div><b>Текущая скважина на замере:</b> <b style="color:#ffd24d;">UAZ_0031</b> (Отвод №9)</div>' +
                    '<div><b>Статус ПСМ (переключатель скважин):</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Герметичен / Замер активен</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Комплектация установки "Спутник-АМ-40-14"</div>' +
                    '<div><b>Количество подключаемых скважин:</b> 14 отводов</div>' +
                    '<div><b>Преобразователь расхода жидкости:</b> ТОР-1-50 (Турбинный счетчик)</div>' +
                    '<div><b>Влагомер сырой нефти:</b> ВСН-2 (диэлькометрический)</div>' +
                    '<div><b>Погрешность измерения дебита:</b> ±2.5 %</div>' +
                    '<div><b>Шкаф телемеханики:</b> Контроллер B&R X20 / Modbus RTU</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- RVS Modal Generator ---
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

        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' + title + '</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Телеметрические данные резервуара</div>' +
                    '<div><b>Уровень нефти (взлив):</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">' + level + '</span></div>' +
                    '<div><b>Масса нефти в резервуаре:</b> <span style="color:#fff;font-weight:bold;font-size:24px;">' + mass + '</span></div>' +
                    '<div><b>Коэффициент заполнения:</b> <b>' + fillPct + '</b></div>' +
                    '<div><b>Уровень подтоварной воды:</b> ' + waterLevel + '</div>' +
                    '<div><b>Температура продукта:</b> ' + temp + '</div>' +
                    '<div><b>Технологический режим:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">' + status + '</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Паспортные характеристики РВС</div>' +
                    '<div><b>Номинальный объем:</b> ' + vol + '</div>' +
                    '<div><b>Диаметр резервуара:</b> ' + diam + '</div>' +
                    '<div><b>Максимальная высота взлива:</b> ' + maxLevel + '</div>' +
                    '<div><b>Система измерения уровня:</b> Радарный уровнемер Saab Rosemount</div>' +
                    '<div><b>Год последнего полного тех. освидетельствования:</b> 2023 г.</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- Pumps Modal Generator ---
    function generateNasosModal(type) {
        var isPpd = (type === 'ппд');
        var title = isPpd ? 'Насосная станция системы ППД (поддержание пластового давления)' : 'Насосная станция перекачки товарной нефти';
        var pIn = isPpd ? '0.45 МПа' : '0.28 МПа';
        var pOut = isPpd ? '11.8 МПа' : '2.15 МПа';
        var q = isPpd ? '1 645 м³/сут' : '45.2 м³/ч';
        var pumpModel = isPpd ? 'ЦНС 180-1422 (3 шт, 1 в работе, 2 в резерве)' : 'НДв 120/80 (2 шт, 1 в работе, 1 в резерве)';
        var motor = isPpd ? 'А4-450-4У3 (800 кВт, 6000 В)' : 'ВАО2-315 (160 кВт, 380 В)';

        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' + title + '</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Параметры работы насосной</div>' +
                    '<div><b>Давление на приеме:</b> <b>' + pIn + '</b></div>' +
                    '<div><b>Давление на выкиде:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">' + pOut + '</span></div>' +
                    '<div><b>Текущая производительность:</b> <span style="color:#fff;font-weight:bold;font-size:24px;">' + q + '</span></div>' +
                    '<div><b>Температура подшипников:</b> 46.2 °C (в норме)</div>' +
                    '<div><b>Вибрация насосного агрегата:</b> 1.8 мм/с (допустимо до 4.5)</div>' +
                    '<div><b>Статус агрегата:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">В работе</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Спецификация оборудования</div>' +
                    '<div><b>Тип насосов:</b> ' + pumpModel + '</div>' +
                    '<div><b>Электропривод:</b> ' + motor + '</div>' +
                    '<div><b>Система защиты:</b> Автоматическое отключение по осевому сдвигу и перегрузке</div>' +
                    '<div><b>Наработка агрегата:</b> 3 120 часов</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- Massometers Modal Generator ---
    function generateMassometrModal(type) {
        var title = 'Узел учета сырой нефти (СИКН)';
        var p = '1.82 МПа';
        var t = '22.8 °C';
        var density = '854.2 кг/м³';
        var massRate = '18.4 т/ч';

        if (type === 'эстакада-нефть') {
            title = 'Массомер на эстакаде налива нефти (Micro Motion CMF300)';
            p = '1.45 МПа';
            density = '853.8 кг/м³';
            massRate = '42.1 т/ч';
        } else if (type === 'эстакада-вода') {
            title = 'Узел учета пластовой воды на сброс / закачку';
            p = '0.92 МПа';
            density = '1024.5 кг/м³';
            massRate = '68.5 м³/ч';
        }

        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' + title + '</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Мгновенные показания массомера</div>' +
                    '<div><b>Массовый расход:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">' + massRate + '</span></div>' +
                    '<div><b>Плотность среды:</b> <b>' + density + '</b></div>' +
                    '<div><b>Температура продукта:</b> <b>' + t + '</b></div>' +
                    '<div><b>Рабочее давление:</b> <b>' + p + '</b></div>' +
                    '<div><b>Статус измерительной линии:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Учет в норме (Линия 1)</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Паспорт кориолисова расходомера</div>' +
                    '<div><b>Тип сенсора:</b> Кориолисов расходомер Micro Motion ELITE</div>' +
                    '<div><b>Вычислитель расхода:</b> Micro Motion 2700 MVD</div>' +
                    '<div><b>Класс точности:</b> ±0.10 % по массе</div>' +
                    '<div><b>Срок действия поверки:</b> Действителен до 10.2027 г.</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // --- Water & Gas Counter Modal Generator ---
    function generateCounterModal(type) {
        var isWater = (type === 'вода');
        var title = isWater ? 'Узел технологического учета пластовой воды' : 'Узел учета попутного нефтяного газа (УПНГ)';
        var vol = isWater ? '1 245.0 м³' : '3 840.5 м³';
        var flow = isWater ? '54.2 м³/ч' : '162.8 м³/ч';
        var p = isWater ? '0.62 МПа' : '0.15 МПа';
        var target = isWater ? 'Сброс в блок подготовки и закачка в пласт' : 'Подача топливного газа на печи ПТ-16 и факел';

        return '<div class="popup-inner" style="max-width:2000px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' + title + '</div>' +
            '<div style="display:flex;gap:25px;margin-bottom:25px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Показания счетчика-расходомера</div>' +
                    '<div><b>Накопленный объем:</b> <span style="color:#54b948;font-weight:bold;font-size:24px;">' + vol + '</span></div>' +
                    '<div><b>Текущий часовой расход:</b> <span style="color:#fff;font-weight:bold;font-size:24px;">' + flow + '</span></div>' +
                    '<div><b>Рабочее давление:</b> <b>' + p + '</b></div>' +
                    '<div><b>Назначение потока:</b> ' + target + '</div>' +
                    '<div><b>Статус узла:</b> <span class="label label-success" style="font-size:15px;padding:3px 8px;border-radius:3px;">Непрерывный учет</span></div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:18px 22px;font-size:20px;line-height:1.6;">' +
                    '<div style="font-size:23px;font-weight:bold;margin-bottom:12px;color:#ffd24d;border-bottom:1px solid #3d4659;padding-bottom:8px;">Оборудование узла учета</div>' +
                    '<div><b>Первичный преобразователь:</b> ' + (isWater ? 'Ультразвуковой расходомер Ultraflux' : 'Газосепаратор ГС + Ультразвуковой расходомер газа') + '</div>' +
                    '<div><b>Вычислитель расхода:</b> FloBoss S600 / SuperFlo</div>' +
                    '<div><b>Погрешность измерений:</b> ±1.0 %</div>' +
                    '<div><b>Периодичность поверки:</b> 1 раз в год (поверен до 11.2026)</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }


    // =========================================================================
    // --- SIDEBAR MENU MODALS GENERATORS ---
    // =========================================================================

    // --- 1. Обратный расчет (Reverse Calculation) Modal Generator ---
    function generateReverseCalculationHtml(tab) {
        tab = tab || 'oil';

        var tabs = [
            { id: 'oil', label: 'Нефть (тн)', unit: 'тн' },
            { id: 'fluid', label: 'Жидкость (м³)', unit: 'м³' },
            { id: 'water', label: 'Вода (м³)', unit: 'м³' },
            { id: 'balance', label: 'Баланс простоев и потерь', unit: 'тн' }
        ];

        var tabButtonsHtml = '<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">';
        tabs.forEach(function(t) {
            var activeClass = (t.id === tab) ? 'active' : '';
            tabButtonsHtml += '<button class="rc-tab-btn ' + activeClass + '" data-tab="' + t.id + '">' + t.label + '</button>';
        });
        tabButtonsHtml += '</div>';

        var kpiHtml = '';
        var tableHtml = '';

        if (tab === 'oil') {
            kpiHtml = '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Замерная добыча (АГЗУ)</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">526.1 <span style="font-size:18px;">тн/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Накоплено за сентябрь: 13 482.5 тн</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Фактическая сдача (РВС)</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">442.2 <span style="font-size:18px;">тн/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">По данным ТМ резервуаров: 10 516.4 тн</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Небаланс (разница)</div>' +
                    '<div style="color:#ef5c65;font-size:28px;font-weight:bold;">-83.9 <span style="font-size:18px;">тн (-15.9%)</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">В пределах технологического норматива</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Парковый коэффициент (ПК)</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">0.78</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Нормативный диапазон: 0.75 - 0.85</div>' +
                '</div>' +
            '</div>';

            var wells = [
                { name: "UZV_0121", zamer: "424.39", fact: "332.83", diff: "-91.56", share: "12.8%", method: "ЭЦН", debit: "33.2" },
                { name: "UAZ_0052", zamer: "309.81", fact: "242.97", diff: "-66.84", share: "9.3%", method: "ЭЦН", debit: "24.3" },
                { name: "UZV_0111", zamer: "297.07", fact: "232.98", diff: "-64.09", share: "8.9%", method: "ЭЦН", debit: "23.3" },
                { name: "UAZ_0066", zamer: "254.64", fact: "199.70", diff: "-54.94", share: "7.7%", method: "ЭЦН", debit: "20.0" },
                { name: "UZS_026U", zamer: "254.64", fact: "199.70", diff: "-54.94", share: "7.7%", method: "ЭЦН", debit: "20.0" },
                { name: "UZS_014US", zamer: "237.66", fact: "186.39", diff: "-51.27", share: "7.2%", method: "ЭЦН", debit: "18.6" },
                { name: "UAZ_0064", zamer: "246.15", fact: "193.04", diff: "-53.11", share: "7.4%", method: "ЭЦН", debit: "19.3" },
                { name: "UAZ_0034", zamer: "218.42", fact: "171.30", diff: "-47.12", share: "6.6%", method: "ШГН", debit: "17.1" },
                { name: "UAZ_0060", zamer: "201.12", fact: "157.73", diff: "-43.39", share: "6.1%", method: "ЭЦН", debit: "15.8" },
                { name: "UAZ_0019", zamer: "184.55", fact: "144.74", diff: "-39.81", share: "5.6%", method: "ЭЦН", debit: "14.5" },
                { name: "UAZ_0015", zamer: "168.20", fact: "131.91", diff: "-36.29", share: "5.1%", method: "ЭЦН", debit: "13.2" },
                { name: "UAZ_0004", zamer: "147.30", fact: "115.52", diff: "-31.78", share: "4.4%", method: "ШГН", debit: "11.6" },
                { name: "UAZ_0062", zamer: "132.80", fact: "104.15", diff: "-28.65", share: "4.0%", method: "ЭЦН", debit: "10.4" },
                { name: "UAZ_0012", zamer: "119.40", fact: "93.64", diff: "-25.76", share: "3.6%", method: "ЭЦН", debit: "9.4" },
                { name: "UAZ_0031", zamer: "105.10", fact: "82.43", diff: "-22.67", share: "3.2%", method: "ЭЦН", debit: "8.2" }
            ];

            tableHtml = '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">№ скважины</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Замер нефти (тн)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Факт нефти по ПК (тн)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Небаланс (тн)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Доля в добыче</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Способ</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Действие</th>' +
                '</tr></thead><tbody>';

            wells.forEach(function(w, idx) {
                var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
                tableHtml += '<tr style="background:' + bg + ';">' +
                    '<td style="color:#ffffff;font-weight:bold;padding:7px 12px;border:1px solid #313848;">' + w.name + '</td>' +
                    '<td style="color:#ffd24d;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.zamer + '</td>' +
                    '<td style="color:#54b948;font-weight:bold;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.fact + '</td>' +
                    '<td style="color:#ef5c65;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.diff + '</td>' +
                    '<td style="color:#ffffff;text-align:center;padding:7px 12px;border:1px solid #313848;">' + w.share + '</td>' +
                    '<td style="color:#5bc0de;text-align:center;padding:7px 12px;border:1px solid #313848;">' + w.method + '</td>' +
                    '<td style="text-align:center;padding:7px 12px;border:1px solid #313848;">' +
                        '<button class="rc-open-passport" data-well="' + w.name + '" data-debit="' + w.debit + '" style="background:#363d4f;color:#ffd24d;border:1px solid #4a5468;padding:3px 10px;border-radius:4px;font-size:14px;cursor:pointer;">Паспорт</button>' +
                    '</td>' +
                '</tr>';
            });
            tableHtml += '</tbody></table>';

        } else if (tab === 'fluid') {
            kpiHtml = '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Замер жидкости (АГЗУ)</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">1 682.3 <span style="font-size:18px;">м³/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Накоплено за период: 42 057.5 м³</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Фактическая жидкость по РВС</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">1 540.8 <span style="font-size:18px;">м³/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Накоплено факт: 38 520.0 м³</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Небаланс жидкости</div>' +
                    '<div style="color:#ef5c65;font-size:28px;font-weight:bold;">-141.5 <span style="font-size:18px;">м³/сут (-8.4%)</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">В пределах допуска погрешности</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">ПК по жидкости</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">0.92</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Коэффициент учета сепарации</div>' +
                '</div>' +
            '</div>';

            var wellsFluid = [
                { name: "UZV_0121", zamer: "1354.66", fact: "1216.83", diff: "-137.83", method: "ЭЦН", debit: "33.2" },
                { name: "UAZ_0052", zamer: "988.90", fact: "888.28", diff: "-100.62", method: "ЭЦН", debit: "24.3" },
                { name: "UZV_0111", zamer: "948.26", fact: "851.78", diff: "-96.48", method: "ЭЦН", debit: "23.3" },
                { name: "UAZ_0066", zamer: "812.80", fact: "730.10", diff: "-82.70", method: "ЭЦН", debit: "20.0" },
                { name: "UZS_026U", zamer: "812.80", fact: "730.10", diff: "-82.70", method: "ЭЦН", debit: "20.0" },
                { name: "UZS_014US", zamer: "758.60", fact: "681.42", diff: "-77.18", method: "ЭЦН", debit: "18.6" },
                { name: "UAZ_0064", zamer: "785.80", fact: "705.85", diff: "-79.95", method: "ЭЦН", debit: "19.3" },
                { name: "UAZ_0034", zamer: "697.35", fact: "626.39", diff: "-70.96", method: "ШГН", debit: "17.1" },
                { name: "UAZ_0060", zamer: "642.08", fact: "576.75", diff: "-65.33", method: "ЭЦН", debit: "15.8" },
                { name: "UAZ_0019", zamer: "589.15", fact: "529.20", diff: "-59.95", method: "ЭЦН", debit: "14.5" }
            ];

            tableHtml = '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">№ скважины</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Замер жидкости (м³)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Факт жидкости по ПК (м³)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Небаланс (м³)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Способ</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Действие</th>' +
                '</tr></thead><tbody>';

            wellsFluid.forEach(function(w, idx) {
                var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
                tableHtml += '<tr style="background:' + bg + ';">' +
                    '<td style="color:#ffffff;font-weight:bold;padding:7px 12px;border:1px solid #313848;">' + w.name + '</td>' +
                    '<td style="color:#ffd24d;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.zamer + '</td>' +
                    '<td style="color:#54b948;font-weight:bold;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.fact + '</td>' +
                    '<td style="color:#ef5c65;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.diff + '</td>' +
                    '<td style="color:#5bc0de;text-align:center;padding:7px 12px;border:1px solid #313848;">' + w.method + '</td>' +
                    '<td style="text-align:center;padding:7px 12px;border:1px solid #313848;">' +
                        '<button class="rc-open-passport" data-well="' + w.name + '" data-debit="' + w.debit + '" style="background:#363d4f;color:#ffd24d;border:1px solid #4a5468;padding:3px 10px;border-radius:4px;font-size:14px;cursor:pointer;">Паспорт</button>' +
                    '</td>' +
                '</tr>';
            });
            tableHtml += '</tbody></table>';

        } else if (tab === 'water') {
            kpiHtml = '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Замер воды (АГЗУ)</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">1 156.2 <span style="font-size:18px;">м³/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Накоплено за период: 28 575.0 м³</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Фактический сброс воды (РВС)</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">1 098.6 <span style="font-size:18px;">м³/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Сброс в систему ППД: 28 003.6 м³</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Средняя обводненность</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">68.7 %</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">По замерам влагомера: 68.2% - 69.1%</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">ПК по воде</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">0.95</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Высокая точность гидродинамики</div>' +
                '</div>' +
            '</div>';

            var wellsWater = [
                { name: "UZV_0121", zamer: "875.12", fact: "841.17", cut: "69.1%", debit: "33.2" },
                { name: "UAZ_0052", zamer: "638.84", fact: "614.06", cut: "69.1%", debit: "24.3" },
                { name: "UZV_0111", zamer: "612.58", fact: "588.82", cut: "69.1%", debit: "23.3" },
                { name: "UAZ_0066", zamer: "525.04", fact: "504.68", cut: "69.1%", debit: "20.0" },
                { name: "UZS_026U", zamer: "525.04", fact: "504.68", cut: "69.1%", debit: "20.0" },
                { name: "UZS_014US", zamer: "490.04", fact: "471.04", cut: "69.1%", debit: "18.6" },
                { name: "UAZ_0064", zamer: "507.59", fact: "487.91", cut: "69.1%", debit: "19.3" },
                { name: "UAZ_0034", zamer: "450.45", fact: "433.00", cut: "69.1%", debit: "17.1" }
            ];

            tableHtml = '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">№ скважины</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Замер воды (м³)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Факт воды по ПК (м³)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Обводненность</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Действие</th>' +
                '</tr></thead><tbody>';

            wellsWater.forEach(function(w, idx) {
                var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
                tableHtml += '<tr style="background:' + bg + ';">' +
                    '<td style="color:#ffffff;font-weight:bold;padding:7px 12px;border:1px solid #313848;">' + w.name + '</td>' +
                    '<td style="color:#ffd24d;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.zamer + '</td>' +
                    '<td style="color:#54b948;font-weight:bold;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.fact + '</td>' +
                    '<td style="color:#5bc0de;text-align:center;padding:7px 12px;border:1px solid #313848;">' + w.cut + '</td>' +
                    '<td style="text-align:center;padding:7px 12px;border:1px solid #313848;">' +
                        '<button class="rc-open-passport" data-well="' + w.name + '" data-debit="' + w.debit + '" style="background:#363d4f;color:#ffd24d;border:1px solid #4a5468;padding:3px 10px;border-radius:4px;font-size:14px;cursor:pointer;">Паспорт</button>' +
                    '</td>' +
                '</tr>';
            });
            tableHtml += '</tbody></table>';

        } else if (tab === 'balance') {
            kpiHtml = '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Суммарный простой фонда</div>' +
                    '<div style="color:#ef5c65;font-size:28px;font-weight:bold;">84.6 <span style="font-size:18px;">часов</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">За текущий расчетный период</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Потери нефти от простоев</div>' +
                    '<div style="color:#ef5c65;font-size:28px;font-weight:bold;">18.2 <span style="font-size:18px;">тн</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Недополученная выручка: 4.5 млн ₸</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Скважин с зафиксированными простоями</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">7 <span style="font-size:18px;">скв.</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">4 в ремонте, 3 в цикле</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Основная причина</div>' +
                    '<div style="color:#fff;font-size:22px;font-weight:bold;">Ожидание ПРС</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Смена глубинного оборудования</div>' +
                '</div>' +
            '</div>';

            var wellsBalance = [
                { name: "UZV_0121", downtime: "0.16 ч", loss: "0.19 тн", reason: "Кратковременный сбой АВР электроэнергии", debit: "33.2" },
                { name: "UAZ_0052", downtime: "0.50 ч", loss: "0.44 тн", reason: "Ревизия станции управления ЧРП", debit: "24.3" },
                { name: "UAZ_0066", downtime: "0.17 ч", loss: "0.13 тн", reason: "Продувка затрубного пространства", debit: "20.0" },
                { name: "UAZ_0065", downtime: "48.00 ч", loss: "11.20 тн", reason: "В подземном ремонте (смена ЭЦН)", debit: "0.0" },
                { name: "UAZ_0014", downtime: "24.00 ч", loss: "4.80 тн", reason: "В подземном ремонте (промывка забоя)", debit: "0.0" },
                { name: "UAZ_0043", downtime: "12.00 ч", loss: "1.44 тн", reason: "В ремонте (опрессовка РИР)", debit: "0.0" }
            ];

            tableHtml = '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">№ скважины</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Время простоя</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Потери нефти</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Причина простоя / тех. событие</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Действие</th>' +
                '</tr></thead><tbody>';

            wellsBalance.forEach(function(w, idx) {
                var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
                tableHtml += '<tr style="background:' + bg + ';">' +
                    '<td style="color:#ffffff;font-weight:bold;padding:7px 12px;border:1px solid #313848;">' + w.name + '</td>' +
                    '<td style="color:#ef5c65;font-weight:bold;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.downtime + '</td>' +
                    '<td style="color:#ffd24d;font-weight:bold;text-align:right;padding:7px 12px;border:1px solid #313848;">' + w.loss + '</td>' +
                    '<td style="color:#e1e4ea;padding:7px 12px;border:1px solid #313848;">' + w.reason + '</td>' +
                    '<td style="text-align:center;padding:7px 12px;border:1px solid #313848;">' +
                        '<button class="rc-open-passport" data-well="' + w.name + '" data-debit="' + w.debit + '" style="background:#363d4f;color:#ffd24d;border:1px solid #4a5468;padding:3px 10px;border-radius:4px;font-size:14px;cursor:pointer;">Паспорт</button>' +
                    '</td>' +
                '</tr>';
            });
            tableHtml += '</tbody></table>';
        }

        return '<div class="popup-inner" style="max-width:2100px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #3e4659;display:flex;justify-content:space-between;align-items:center;">' +
                '<div>Обратный расчет добычи — Месторождение "Уаз"</div>' +
                '<div style="font-size:20px;color:#a0a8b9;font-weight:normal;">Период: 01.09.2026 — 25.09.2026</div>' +
            '</div>' +
            tabButtonsHtml +
            kpiHtml +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Сводное распределение по действующему фонду скважин</div>' +
            tableHtml +
        '</div>';
    }

    // --- 2. ПРС (Active Workovers) Modal Generator ---
    function generatePrsOperationsHtml() {
        var rows = [
            { well: "UAZ_0065", team: "Бригада №1 (ТОО «Ойл Сервис КМГ»)", op: "Смена погружной установки ЭЦН5-125 / ПЭД-45", depth: "1 420 м", dates: "24.09 — 27.09", progress: 85, stage: "Спуск подвески НКТ-73", debitExp: "+18.5 т/сут", curDeb: "0.0" },
            { well: "UAZ_0014", team: "Бригада №2 (ТОО «Ойл Сервис КМГ»)", op: "Очистка песчаной пробки гидромонитором", depth: "1 280 м", dates: "25.09 — 28.09", progress: 60, stage: "Промывка забоя и вымыв пробки", debitExp: "+11.2 т/сут", curDeb: "0.0" },
            { well: "UAZ_0043", team: "Бригада №3 (ТОО «Эмбамунайавтоматика»)", op: "Ликвидация негерметичности эксплуатационной колонны (РИР)", depth: "1 345 м", dates: "22.09 — 29.09", progress: 40, stage: "Опрессовка цементного моста", debitExp: "+8.0 т/сут", curDeb: "0.0" },
            { well: "UAZ_0071", team: "Бригада №4 (ТОО «Ойл Сервис КМГ»)", op: "Смена глубинного штангового насоса (ШГН 44 мм)", depth: "1 150 м", dates: "25.09 — 27.09", progress: 90, stage: "Монтаж качалки, пуск в работу", debitExp: "+6.4 т/сут", curDeb: "0.0" },
            { well: "UAZ_0103", team: "Бригада №5 (ТОО «Ойл Сервис КМГ»)", op: "Передислокация подъемной установки АПР-60/80", depth: "1 390 м", dates: "26.09 — 26.09", progress: 15, stage: "Монтаж мачты и якорей", debitExp: "Плановая ревизия", curDeb: "0.0" }
        ];

        var tableRows = '';
        rows.forEach(function(r, idx) {
            var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
            tableRows += '<tr style="background:' + bg + ';">' +
                '<td style="color:#ffffff;font-weight:bold;font-size:18px;padding:9px 12px;border:1px solid #313848;">' + r.well + '</td>' +
                '<td style="color:#ffd24d;padding:9px 12px;border:1px solid #313848;">' + r.team + '</td>' +
                '<td style="color:#ffffff;padding:9px 12px;border:1px solid #313848;">' + r.op + '</td>' +
                '<td style="color:#5bc0de;text-align:center;padding:9px 12px;border:1px solid #313848;">' + r.depth + '</td>' +
                '<td style="color:#ffffff;text-align:center;padding:9px 12px;border:1px solid #313848;">' + r.dates + '</td>' +
                '<td style="padding:9px 12px;border:1px solid #313848;min-width:180px;">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;color:#a0a8b9;"><span>' + r.stage + '</span><b>' + r.progress + '%</b></div>' +
                    '<div style="background:#181b24;border-radius:4px;height:12px;overflow:hidden;border:1px solid #3d4659;">' +
                        '<div style="background:#54b948;width:' + r.progress + '%;height:100%;"></div>' +
                    '</div>' +
                '</td>' +
                '<td style="color:#54b948;font-weight:bold;text-align:right;padding:9px 12px;border:1px solid #313848;">' + r.debitExp + '</td>' +
                '<td style="text-align:center;padding:9px 12px;border:1px solid #313848;">' +
                    '<button class="rc-open-passport" data-well="' + r.well + '" data-debit="' + r.curDeb + '" style="background:#363d4f;color:#ffd24d;border:1px solid #4a5468;padding:4px 10px;border-radius:4px;font-size:14px;cursor:pointer;">Паспорт</button>' +
                '</td>' +
            '</tr>';
        });

        return '<div class="popup-inner" style="max-width:2150px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' +
                'Текущий подземный ремонт скважин (ПРС) — Месторождение "Уаз"' +
            '</div>' +
            '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Бригад ПРС на объекте</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">5 <span style="font-size:18px;">бригад</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">ТОО «Ойл Сервис КМГ», ЭМА</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Скважин в ремонте</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">4 <span style="font-size:18px;">скв.</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">UAZ_0065, 0014, 0043, 0071</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Ожидание ремонта</div>' +
                    '<div style="color:#ef5c65;font-size:28px;font-weight:bold;">4 <span style="font-size:18px;">скв.</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">В графике следующей декады</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">План на сентябрь</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">18 / 22 <span style="font-size:18px;">скв. (81.8%)</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Среднее время: 3.4 сут/скв.</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Текущие ремонтные работы на скважинах (оперативная сводка)</div>' +
            '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;margin-bottom:24px;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Скважина</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Подрядчик / Бригада</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Технологическая операция</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Глубина</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Сроки</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Текущий этап и прогресс</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Ожидаемый прирост</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Действие</th>' +
                '</tr></thead><tbody>' +
                tableRows +
            '</tbody></table>' +
            '<div style="background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;font-size:16px;line-height:1.6;">' +
                '<div style="font-size:18px;font-weight:bold;color:#ffd24d;margin-bottom:8px;">Оперативные отметки диспетчера ЦДНГ (за последние 12 часов):</div>' +
                '<div>• <b>16:30</b> — Скв. <b>UAZ_0071</b>: Завершена подвеска полированного штока, начата балансировка станка-качалки СКД-8. Пуск запланирован на 19:00.</div>' +
                '<div>• <b>14:15</b> — Скв. <b>UAZ_0065</b>: Спущено 1100 м НКТ-73, замер сопротивления изоляции погружного кабеля: 120 МОм (норма).</div>' +
                '<div>• <b>11:50</b> — Скв. <b>UAZ_0014</b>: Вымыто 4.5 м³ песчано-глинистой пробки, обратная циркуляция 100%, начата опрессовка забоя.</div>' +
            '</div>' +
        '</div>';
    }

    // --- 3. Сводки ПРС (Workover Summaries) Modal Generator ---
    function generatePrsSummariesHtml() {
        var completedList = [
            { well: "UAZ_0052", op: "Плановая смена ЭЦН5-125 / ПЭД-45", start: "15.09", end: "18.09", team: "Бригада №2", before: "36.5", after: "49.2", gain: "+12.7", status: "В работе" },
            { well: "UAZ_0015", op: "Устранение негерметичности НКТ / смена подвески", start: "08.09", end: "11.09", team: "Бригада №1", before: "11.2", after: "14.5", gain: "+3.3", status: "В работе" },
            { well: "UAZ_0012", op: "Промывка песчаной пробки гидромонитором", start: "01.09", end: "04.09", team: "Бригада №3", before: "6.1", after: "11.5", gain: "+5.4", status: "В работе" },
            { well: "UAZ_0004", op: "Смена клапанной пары ШГН / регулировка", start: "25.08", end: "27.08", team: "Бригада №1", before: "12.0", after: "16.7", gain: "+4.7", status: "В работе" },
            { well: "UAZ_0062", op: "Ревизия кабельного ввода и термоманометра", start: "18.08", end: "20.08", team: "Бригада №4", before: "13.0", after: "14.5", gain: "+1.5", status: "В работе" },
            { well: "UAZ_0031", op: "Очистка обратного клапана от солеотложений", start: "12.08", end: "14.08", team: "Бригада №2", before: "10.1", after: "12.8", gain: "+2.7", status: "В работе" },
            { well: "UAZ_0034", op: "Смена глубинной насосной штанги (обрыв)", start: "06.08", end: "08.08", team: "Бригада №3", before: "0.0", after: "24.9", gain: "+24.9", status: "В работе" },
            { well: "UAZ_0071", op: "Обработка ингибитором коррозии и промывка", start: "28.07", end: "30.07", team: "Бригада №2", before: "38.2", after: "42.1", gain: "+3.9", status: "В работе" },
            { well: "UAZ_0109", op: "Замена сальникового уплотнения и штока", start: "21.07", end: "22.07", team: "Бригада №1", before: "18.0", after: "22.6", gain: "+4.6", status: "В работе" },
            { well: "UAZ_0060", op: "Плановая смена погружного кабеля КПБП", start: "14.07", end: "16.07", team: "Бригада №4", before: "19.5", after: "22.9", gain: "+3.4", status: "В работе" }
        ];

        var tableRows = '';
        completedList.forEach(function(r, idx) {
            var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
            tableRows += '<tr style="background:' + bg + ';">' +
                '<td style="color:#ffffff;font-weight:bold;padding:8px 12px;border:1px solid #313848;">' + r.well + '</td>' +
                '<td style="color:#ffffff;padding:8px 12px;border:1px solid #313848;">' + r.op + '</td>' +
                '<td style="color:#ffd24d;text-align:center;padding:8px 12px;border:1px solid #313848;">' + r.start + ' — ' + r.end + '</td>' +
                '<td style="color:#a0a8b9;padding:8px 12px;border:1px solid #313848;">' + r.team + '</td>' +
                '<td style="color:#ffffff;text-align:right;padding:8px 12px;border:1px solid #313848;">' + r.before + '</td>' +
                '<td style="color:#54b948;font-weight:bold;text-align:right;padding:8px 12px;border:1px solid #313848;">' + r.after + '</td>' +
                '<td style="color:#54b948;font-weight:bold;text-align:right;padding:8px 12px;border:1px solid #313848;">' + r.gain + '</td>' +
                '<td style="text-align:center;padding:8px 12px;border:1px solid #313848;"><span class="label label-success" style="font-size:13px;padding:3px 8px;border-radius:3px;">Принят</span></td>' +
                '<td style="text-align:center;padding:8px 12px;border:1px solid #313848;">' +
                    '<button class="rc-open-passport" data-well="' + r.well + '" data-debit="' + r.after + '" style="background:#363d4f;color:#ffd24d;border:1px solid #4a5468;padding:3px 10px;border-radius:4px;font-size:13px;cursor:pointer;">Паспорт</button>' +
                '</td>' +
            '</tr>';
        });

        return '<div class="popup-inner" style="max-width:2150px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' +
                'Суточная и накопительная сводка ПРС — Месторождение "Уаз" (Сентябрь 2026)' +
            '</div>' +
            '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Завершено ремонтов в сентябре</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">18 <span style="font-size:18px;">скв. (105.8% плана)</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">С начала года: 168 скв.</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Прирост дебита нефти</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">+84.6 <span style="font-size:18px;">т/сут</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Дополнительно: +2 115 тн/мес</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Средний МРП фонда</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">412 <span style="font-size:18px;">суток</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Норматив: 380 сут (+32 сут)</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Экономия бюджета ПРС</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">-4.8 <span style="font-size:18px;">млн ₸</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">За счет сокращения простоев</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Выполненные ремонтные работы за текущий месяц</div>' +
            '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Скважина</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Вид ремонта</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Период</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Бригада</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Дебит до (т/с)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Дебит после (т/с)</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Прирост</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Акт</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Действие</th>' +
                '</tr></thead><tbody>' +
                tableRows +
            '</tbody></table>' +
        '</div>';
    }

    // --- 4. ИИ-ассистент (AI Assistant) Modal Generator ---
    function generateAiAssistantHtml() {
        return '<div class="popup-inner" style="max-width:2050px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #3e4659;display:flex;justify-content:space-between;align-items:center;">' +
                '<div>Интеллектуальный ИИ-ассистент диспетчера промысла (KMG-GeoAI v2.4)</div>' +
                '<div style="font-size:18px;color:#54b948;font-weight:bold;">● Онлайн · Телеметрия месторождения Уаз активна</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Выявленные технологические отклонения в реальном времени:</div>' +
            '<div style="display:flex;gap:18px;margin-bottom:22px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #ef5c65;border-radius:8px;padding:14px 18px;font-size:16px;line-height:1.5;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                        '<b style="color:#ef5c65;font-size:18px;">[Критично] UAZ_0065</b>' +
                        '<span class="label label-danger" style="font-size:12px;">ЭЦН Перегрузка</span>' +
                    '</div>' +
                    '<div>Температура ПЭД: <b style="color:#ef5c65;">114 °C</b> (порог: 110 °C). Скачки фазного тока 48-56 А.</div>' +
                    '<div style="margin-top:6px;color:#ffd24d;"><b>Рекомендация:</b> Снизить частоту ЧРП на 3 Гц (до 47 Гц) во избежание теплового пробоя обмоток статора.</div>' +
                    '<div style="margin-top:10px;">' +
                        '<button class="ai-prompt-pill" data-prompt="Применить оптимизацию частоты ЧРП для UAZ_0065" style="margin:0;font-size:14px;padding:5px 12px;">Применить рекомендацию</button>' +
                    '</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #ffd24d;border-radius:8px;padding:14px 18px;font-size:16px;line-height:1.5;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                        '<b style="color:#ffd24d;font-size:18px;">[Внимание] UAZ_0031</b>' +
                        '<span class="label label-warning" style="font-size:12px;">Обводненность</span>' +
                    '</div>' +
                    '<div>Рост обводненности с <b>72% до 88%</b> за последние 72 часа. Дебит жидкости стабилен (23.4 м³/с).</div>' +
                    '<div style="margin-top:6px;color:#ffd24d;"><b>Рекомендация:</b> Фиксация прорыва подошвенных вод. Включить скважину в план РИР (полимерная изоляция).</div>' +
                    '<div style="margin-top:10px;">' +
                        '<button class="ai-prompt-pill" data-prompt="Сформировать заявку на гидродинамические исследования UAZ_0031" style="margin:0;font-size:14px;padding:5px 12px;">Сформировать заявку</button>' +
                    '</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #5bc0de;border-radius:8px;padding:14px 18px;font-size:16px;line-height:1.5;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                        '<b style="color:#5bc0de;font-size:18px;">[Предупреждение] Печь №2</b>' +
                        '<span class="label label-info" style="font-size:12px;">Тепловой режим</span>' +
                    '</div>' +
                    '<div>Температура входа: <b>31 °C</b>, выхода: <b>29 °C</b> (Δt = -2 °C). Недостаточный нагрев эмульсии.</div>' +
                    '<div style="margin-top:6px;color:#ffd24d;"><b>Рекомендация:</b> Проверить подачу топливного газа и факел горелочного устройства.</div>' +
                    '<div style="margin-top:10px;">' +
                        '<button class="ai-prompt-pill" data-prompt="Направить оператора на осмотр горелки Печи №2" style="margin:0;font-size:14px;padding:5px 12px;">Направить оператора</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:10px;color:#ffd24d;">Диалоговый инженерный терминал (KMG-GeoAI Dispatcher):</div>' +
            '<div id="aiChatMessages" style="background:#181b24;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;height:240px;overflow-y:auto;margin-bottom:14px;display:flex;flex-direction:column;gap:12px;">' +
                '<div style="background:#232733;border-left:4px solid #54b948;padding:10px 14px;border-radius:4px;color:#e1e4ea;font-size:16px;line-height:1.5;">' +
                    '<b>KMG-GeoAI:</b> Здравствуйте! Я контролирую технологические режимы объектов месторождения "Уаз" в непрерывном режиме. Выберите быстрый запрос ниже либо введите свой вопрос.' +
                '</div>' +
            '</div>' +
            '<div style="margin-bottom:14px;">' +
                '<div class="ai-prompt-pill" data-prompt="Проанализировать падение дебита на АГЗУ">Проанализировать падение дебита на АГЗУ</div>' +
                '<div class="ai-prompt-pill" data-prompt="Прогноз выполнения плана добычи до конца месяца">Прогноз добычи до конца месяца</div>' +
                '<div class="ai-prompt-pill" data-prompt="Оптимизация дозировки химреагента БДР">Оптимизация дозировки БДР</div>' +
                '<div class="ai-prompt-pill" data-prompt="Анализ причин небаланса по обратным расчетам">Анализ причин небаланса</div>' +
            '</div>' +
            '<div style="display:flex;gap:12px;">' +
                '<input type="text" id="aiInputText" class="form-control" placeholder="Задайте вопрос ИИ-ассистенту (например: Диагностика скв. UAZ_0065)..." style="flex:1;background:#181b24;color:#fff;border:2px solid #3e4659;border-radius:6px;height:52px;font-size:18px;padding:0 16px;">' +
                '<button id="aiSubmitBtn" class="btn btn-warning" style="background:#ffd24d;color:#181b24;font-weight:bold;font-size:18px;padding:0 26px;border-radius:6px;border:none;cursor:pointer;">Запросить ИИ</button>' +
            '</div>' +
        '</div>';
    }

    // --- 5. Эффективность ПРС (Workover Efficiency) Modal Generator ---
    function generatePrsEfficiencyHtml() {
        var contractors = [
            { name: "Бригада №1 (ТОО «Ойл Сервис КМГ»)", master: "Куанышев Т.", jobs: 24, safety: "0 (100%)", ontime: "98.5%", gain: "+42.1 т/с", eff: "98.6%", rating: "5.0 ★" },
            { name: "Бригада №2 (ТОО «Ойл Сервис КМГ»)", master: "Аманов С.", jobs: 22, safety: "0 (100%)", ontime: "95.2%", gain: "+36.4 т/с", eff: "96.2%", rating: "4.9 ★" },
            { name: "Бригада №3 (ТОО «Эмбамунайавтоматика»)", master: "Бисенов Е.", jobs: 19, safety: "0 (100%)", ontime: "94.0%", gain: "+28.8 т/с", eff: "94.5%", rating: "4.8 ★" },
            { name: "Бригада №4 (ТОО «Ойл Сервис КМГ»)", master: "Маратов Д.", jobs: 18, safety: "0 (100%)", ontime: "91.8%", gain: "+24.1 т/с", eff: "92.0%", rating: "4.7 ★" },
            { name: "Бригада №5 (ТОО «КазМунайГаз Сервис»)", master: "Тулегенов Р.", jobs: 15, safety: "0 (100%)", ontime: "89.4%", gain: "+19.6 т/с", eff: "89.4%", rating: "4.6 ★" }
        ];

        var tableRows = '';
        contractors.forEach(function(c, idx) {
            var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
            tableRows += '<tr style="background:' + bg + ';">' +
                '<td style="color:#ffffff;font-weight:bold;padding:9px 12px;border:1px solid #313848;">' + c.name + '</td>' +
                '<td style="color:#a0a8b9;padding:9px 12px;border:1px solid #313848;">' + c.master + '</td>' +
                '<td style="color:#ffd24d;text-align:center;font-weight:bold;padding:9px 12px;border:1px solid #313848;">' + c.jobs + '</td>' +
                '<td style="color:#54b948;text-align:center;padding:9px 12px;border:1px solid #313848;">' + c.safety + '</td>' +
                '<td style="color:#ffffff;text-align:center;padding:9px 12px;border:1px solid #313848;">' + c.ontime + '</td>' +
                '<td style="color:#54b948;font-weight:bold;text-align:right;padding:9px 12px;border:1px solid #313848;">' + c.gain + '</td>' +
                '<td style="color:#5bc0de;text-align:center;font-weight:bold;padding:9px 12px;border:1px solid #313848;">' + c.eff + '</td>' +
                '<td style="color:#ffd24d;text-align:center;font-weight:bold;padding:9px 12px;border:1px solid #313848;">' + c.rating + '</td>' +
            '</tr>';
        });

        return '<div class="popup-inner" style="max-width:2100px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' +
                'Анализ технико-экономической эффективности ПРС и ГТМ — Месторождение "Уаз"' +
            '</div>' +
            '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Накопленная доп. добыча</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">+18 420 <span style="font-size:18px;">тн нефти</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Экономический эффект: 412.8 млн ₸</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Удельная себестоимость</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">12 400 <span style="font-size:18px;">₸ / тн</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Ниже лимита затрат на 14.5%</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Срок окупаемости затрат</div>' +
                    '<div style="color:#5bc0de;font-size:28px;font-weight:bold;">18.4 <span style="font-size:18px;">суток</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Высокая рентабельность ГТМ</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Технологическая успешность</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">94.4 %</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Без повторных ремонтов в течение 60 сут</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Рейтинг эффективности подрядных сервисных бригад ПРС (KPI за 2026 год)</div>' +
            '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Подрядчик / Бригада</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Мастер бригады</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Ремонтов</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Инциденты ТБ</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Соблюдение сроков</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:right;">Доп. дебит</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Индекс надежности</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Рейтинг</th>' +
                '</tr></thead><tbody>' +
                tableRows +
            '</tbody></table>' +
        '</div>';
    }

    // --- 6. Обходы (Mobile Operator Bypasses) Modal Generator ---
    function generateBypassesHtml() {
        var routes = [
            { num: "Маршрут №1", name: "Кустовая площадка №1 (Скважины UAZ_0004 — UAZ_0019)", time: "09:15 — 10:45", operator: "Сейткалиев А.", rfid: "8 из 8 меток", status: "Завершен", statusClass: "label-success", notes: "Все параметры герметичности устьев и давления в норме" },
            { num: "Маршрут №2", name: "Центральный замерный узел АГЗУ-1 и блок переключателей", time: "11:00 — 11:40", operator: "Жолдасов Н.", rfid: "4 из 4 меток", status: "Завершен", statusClass: "label-success", notes: "Давление 0.31 МПа, температура 21.3 °C. Утечек нет" },
            { num: "Маршрут №3", name: "Подогреватели нефти Печь №1, Печь №2 и БДР", time: "12:00 — 13:10", operator: "Сейткалиев А.", rfid: "6 из 6 меток", status: "Завершен", statusClass: "label-warning", notes: "Печь №1: 35°C (норма). Печь №2: 29°C (выдано задание на продувку горелки)" },
            { num: "Маршрут №4", name: "Резервуарный парк (РГС 2, 3, 4) и насосная станция перекачки", time: "13:30 — 14:45", operator: "Жолдасов Н.", rfid: "5 из 5 меток", status: "Завершен", statusClass: "label-success", notes: "Уровни: РГС-2 (205 см), РГС-3 (100 см), РГС-4 (0 см). Сальники насосов сухие" },
            { num: "Маршрут №5", name: "Кустовая площадка №2 (Скважины UAZ_0052 — UAZ_0071)", time: "15:00 — в процессе", operator: "Сейткалиев А.", rfid: "4 из 7 меток", status: "В процессе (65%)", statusClass: "label-primary", notes: "Скв. UAZ_0014: зафиксирован незначительный пропуск сальника СУСГ. Заявка #102 отправлена цеховому механику" },
            { num: "Маршрут №6", name: "Магистральный коллектор нефти на ПСП «С.Жолдыбай» (25 км)", time: "17:30 — 19:00", operator: "Жолдасов Н.", rfid: "3 метки", status: "Запланирован", statusClass: "label-default", notes: "Плановый объезд трассы нефтепровода на автотранспорте" }
        ];

        var tableRows = '';
        routes.forEach(function(r, idx) {
            var bg = (idx % 2 === 0) ? '#212533' : '#181b24';
            tableRows += '<tr style="background:' + bg + ';">' +
                '<td style="color:#ffd24d;font-weight:bold;padding:9px 12px;border:1px solid #313848;">' + r.num + '</td>' +
                '<td style="color:#ffffff;font-weight:bold;padding:9px 12px;border:1px solid #313848;">' + r.name + '</td>' +
                '<td style="color:#ffffff;text-align:center;padding:9px 12px;border:1px solid #313848;">' + r.time + '</td>' +
                '<td style="color:#a0a8b9;padding:9px 12px;border:1px solid #313848;">' + r.operator + '</td>' +
                '<td style="color:#5bc0de;text-align:center;padding:9px 12px;border:1px solid #313848;">' + r.rfid + '</td>' +
                '<td style="text-align:center;padding:9px 12px;border:1px solid #313848;"><span class="label ' + r.statusClass + '" style="font-size:13px;padding:3px 8px;border-radius:3px;">' + r.status + '</span></td>' +
                '<td style="color:#e1e4ea;font-size:15px;padding:9px 12px;border:1px solid #313848;">' + r.notes + '</td>' +
            '</tr>';
        });

        return '<div class="popup-inner" style="max-width:2150px;padding:30px 35px;">' +
            '<div class="popup-close">&times;</div>' +
            '<div class="popup-title" style="font-size:32px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3e4659;">' +
                'Электронный журнал маршрутных обходов оборудования — Месторождение "Уаз"' +
            '</div>' +
            '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Текущая рабочая смена</div>' +
                    '<div style="color:#ffd24d;font-size:26px;font-weight:bold;">Дневная (08:00 — 20:00)</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Дата: 26.09.2026</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Бригада операторов обхода</div>' +
                    '<div style="color:#ffffff;font-size:22px;font-weight:bold;">Сейткалиев А. / Жолдасов Н.</div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">ЦДНГ месторождения Уаз</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Выполнение графика обходов</div>' +
                    '<div style="color:#54b948;font-size:28px;font-weight:bold;">5 из 6 <span style="font-size:18px;">маршрутов (83.3%)</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Все контрольные RFID метки считаны</div>' +
                '</div>' +
                '<div style="flex:1;background:#232733;border:1px solid #363d4f;border-radius:8px;padding:16px 20px;">' +
                    '<div style="color:#a0a8b9;font-size:18px;margin-bottom:6px;">Выявлено замечаний</div>' +
                    '<div style="color:#ffd24d;font-size:28px;font-weight:bold;">1 <span style="font-size:18px;">дефект</span></div>' +
                    '<div style="color:#7f8b9f;font-size:16px;margin-top:4px;">Заявка #102 передана в цех ПРС</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:bold;margin-bottom:12px;color:#ffd24d;">Маршруты инспекции технологических узлов и кустовых площадок</div>' +
            '<table class="table table-bordered" style="width:100%;font-size:16px;background:#181b24;border:1px solid #3e4659;">' +
                '<thead><tr style="background:#272d3b;">' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Маршрут</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Наименование контролируемого узла</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Время</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Оператор</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">RFID скан</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;text-align:center;">Статус</th>' +
                    '<th style="color:#ffd24d;padding:9px 12px;border:1px solid #3e4659;">Результаты осмотра и выявленные замечания</th>' +
                '</tr></thead><tbody>' +
                tableRows +
            '</tbody></table>' +
        '</div>';
    }

    // --- 7. Выход (Logout Confirmation) Modal Generator ---
    function generateLogoutConfirmHtml() {
        return '<div class="popup-inner" style="max-width:900px;padding:35px 40px;text-align:center;">' +
            '<div class="popup-close">&times;</div>' +
            '<div style="font-size:55px;margin-bottom:15px;color:#ffd24d;">⏻</div>' +
            '<div style="font-size:30px;font-weight:bold;color:#ffffff;margin-bottom:12px;">Завершение сеанса работы в системе</div>' +
            '<div style="font-size:20px;color:#a0a8b9;line-height:1.6;margin-bottom:30px;">' +
                'Вы действительно хотите выйти из профиля «Диспетчер ЦДНГ Уаз» системы интеллектуального мониторинга АО «Эмбамунайгаз»?' +
            '</div>' +
            '<div style="display:flex;justify-content:center;gap:20px;">' +
                '<button class="popup-close" style="position:static;font-size:20px;background:#363d4f;color:#ffffff;border:1px solid #4a5468;border-radius:8px;padding:12px 35px;cursor:pointer;font-weight:bold;">Остаться в системе</button>' +
                '<button id="confirmLogoutBtn" style="font-size:20px;background:#ef5c65;color:#ffffff;border:none;border-radius:8px;padding:12px 35px;cursor:pointer;font-weight:bold;">Завершить сеанс</button>' +
            '</div>' +
        '</div>';
    }

    // --- 8. AI Prompt Submitter Handler ---
    window.submitAiPrompt = function(promptText) {
        if (!promptText) return;
        var $box = $('#aiChatMessages');
        if (!$box.length) return;

        // User question bubble
        var userHtml = '<div style="align-self:flex-end;background:#2e384d;border-right:4px solid #ffd24d;padding:10px 14px;border-radius:4px;color:#ffffff;font-size:16px;max-width:85%;line-height:1.4;">' +
            '<b>Вы:</b> ' + promptText +
        '</div>';
        $box.append(userHtml);
        $box.scrollTop($box[0].scrollHeight);

        // Compute AI response
        var lower = promptText.toLowerCase();
        var reply = '';

        if (lower.indexOf('uaz_0065') !== -1 || lower.indexOf('перегрузк') !== -1 || lower.indexOf('чрп') !== -1) {
            reply = '<b>Диагностика скважины UAZ_0065:</b> Погружной электродвигатель ПЭД-45 работает с токовой перегрузкой (I_ср = 52 А при номинале 44 А). Температура обмоток статора достигла 114°C при допустимом максимуме 110°C. Причина: высокая плотность газожидкостной смеси и повышенное динамическое сопротивление в затрубье. <br><b>Рекомендация:</b> Снизить выходную частоту преобразователя ЧРП с 50.0 Гц до 47.0 Гц. Прогнозируемый ток снизится до 43.5 А, дебит стабилизируется на уровне 20.8 т/сут без риска теплового пробоя изоляции.';
        } else if (lower.indexOf('прогноз') !== -1 || lower.indexOf('план') !== -1 || lower.indexOf('конец месяца') !== -1) {
            reply = '<b>Прогноз выполнения плана добычи до конца месяца:</b> На текущие расчетные сутки (26.09.2026) суточный дебит составляет 442.2 тн/сут. С учетом ввода из ремонта скв. UAZ_0071 (+6.4 т/сут) и UAZ_0065 (+18.5 т/сут к 28.09) ожидаемый среднесуточный дебит к 30.09 составит ~467 тн/сут. Накопленная добыча за сентябрь прогнозируется на уровне <b>13 410 тн</b> при плане 13 250 тн (выполнение: <b>101.2%</b>).';
        } else if (lower.indexOf('бдр') !== -1 || lower.indexOf('деэмульгатор') !== -1 || lower.indexOf('химреагент') !== -1) {
            reply = '<b>Оптимизация дозировки химреагента (БДР):</b> Текущий удельный расход деэмульгатора составляет 38.5 г/тн (подача 2.4 л/ч). В связи со снижением температуры на входе РГС-2 до 14°C наблюдается замедление фазового расслоения эмульсии. <br><b>Рекомендация:</b> Для сохранения остаточной обводненности товарной нефти в пределах < 0.5% временно увеличить дозировку до 42.0 г/тн либо скорректировать тепловой режим печи №1 до 38°C.';
        } else if (lower.indexOf('обратн') !== -1 || lower.indexOf('небаланс') !== -1 || lower.indexOf('потер') !== -1) {
            reply = '<b>Анализ небаланса по обратным расчетам:</b> Расхождение между узлом замера АГЗУ (526.1 тн) и сдачей по резервуарам РВС (442.2 тн) составляет -83.9 тн (ПК = 0.78). Основные факторы: 1) простои фонда по ожиданию ремонта (суммарно 84.6 ч, потери 18.2 тн); 2) газовый фактор и унос капельной нефти с попутным газом на факел (~4.5 тн); 3) завышение показаний массомера АГЗУ из-за периодической загазованности потока на скв. UAZ_0052.';
        } else if (lower.indexOf('uaz_0031') !== -1 || lower.indexOf('обводненност') !== -1 || lower.indexOf('водоприток') !== -1) {
            reply = '<b>Анализ скв. UAZ_0031:</b> Обводненность продукции достигла 88% при сохранении общего дебита жидкости 23.4 м³/сут. Анализ динамики пластового давления указывает на прорыв конуса подошвенных вод через зону трещиноватости пласта Ю-1. <br><b>Рекомендация:</b> Направить каротажную партию для проведения высокочувствительной термометрии и влагометрии (ПГИ), после чего провести ремонтно-изоляционные работы (РИР) синтетическими полимерами.';
        } else if (lower.indexOf('печ') !== -1 || lower.indexOf('горелк') !== -1 || lower.indexOf('температур') !== -1) {
            reply = '<b>Диагностика подогревателя нефти Печь №2:</b> Разница температур между входом и выходом составляет -2°C (31°C -> 29°C), что свидетельствует о прекращении теплоотдачи. Проверка давления топливного газа показала просадку до 0.4 кгс/см² (норма 0.8-1.2 кгс/см²). <br><b>Действие:</b> Задание оператору Жумабаеву Е. на продувку фильтра топливного газа передано в мобильный терминал.';
        } else {
            reply = '<b>Анализ KMG-GeoAI:</b> Запрос принят в обработку нейросетевым модулем. Телеметрические параметры комплекса "Уаз" находятся в границах технологического регламента ЦДНГ. Рекомендуется регулярный мониторинг динамического уровня скважин и давления в магистральном коллекторе сдачи (текущее: 16.2 кгс/см²).';
        }

        setTimeout(function() {
            var botHtml = '<div style="background:#232733;border-left:4px solid #54b948;padding:10px 14px;border-radius:4px;color:#e1e4ea;font-size:16px;line-height:1.5;">' +
                '<b>KMG-GeoAI:</b> ' + reply +
            '</div>';
            $box.append(botHtml);
            $box.scrollTop($box[0].scrollHeight);
        }, 300);
    };

    // --- 9. Fullscreen Login Splash Overlay ---
    window.showLoginOverlay = function() {
        var overlayHtml = '<div class="login-overlay">' +
            '<div style="background:#232733;border:2px solid #4a5468;border-radius:12px;padding:45px 50px;width:720px;box-shadow:0 30px 80px rgba(0,0,0,0.95);text-align:center;">' +
                '<div style="margin-bottom:20px;">' +
                    '<div style="font-size:34px;font-weight:bold;color:#ffd24d;">АО «Эмбамунайгаз»</div>' +
                    '<div style="font-size:22px;color:#ffffff;margin-top:6px;">Интеллектуальное месторождение «Уаз»</div>' +
                '</div>' +
                '<div style="background:#181b24;border:1px solid #363d4f;border-radius:8px;padding:24px 28px;margin-bottom:30px;text-align:left;">' +
                    '<div style="color:#a0a8b9;font-size:16px;margin-bottom:6px;">Текущий сеанс завершен</div>' +
                    '<div style="margin-bottom:16px;">' +
                        '<label style="color:#ffffff;font-size:16px;margin-bottom:6px;display:block;">Учетная запись</label>' +
                        '<input type="text" class="form-control" value="Диспетчер ЦДНГ (Уаз)" readonly style="background:#232733;color:#ffd24d;font-size:18px;border:1px solid #4a5468;height:50px;">' +
                    '</div>' +
                    '<div>' +
                        '<label style="color:#ffffff;font-size:16px;margin-bottom:6px;display:block;">Пароль доступа</label>' +
                        '<input type="password" class="form-control" value="••••••••••••" readonly style="background:#232733;color:#ffffff;font-size:18px;border:1px solid #4a5468;height:50px;">' +
                    '</div>' +
                '</div>' +
                '<button id="reLoginBtn" class="btn btn-warning" style="background:#54b948;color:#ffffff;font-size:22px;font-weight:bold;width:100%;height:58px;border-radius:8px;border:none;cursor:pointer;">' +
                    'Войти в систему мониторинга' +
                '</button>' +
            '</div>' +
        '</div>';
        $('body').append(overlayHtml);
    };

    // --- Generic Modal Display Helper ---
    function showModal(contentHtml) {
        var $p = $('.popup');
        $p.html(contentHtml).addClass('show').show();
        $('.popup-close, .popup').off('click').on('click', function(e) {
            if (e.target === this || $(e.target).hasClass('popup-close')) {
                $p.removeClass('show').hide().empty();
                $('.underTable').remove();
            }
        });
    }

    // --- Modal Opening Handlers (Top Blocks & Scheme) ---
    window.openReverseCalculationModal = function(tab) { showModal(generateReverseCalculationHtml(tab || 'oil')); };
    window.openPrsOperationsModal = function() { showModal(generatePrsOperationsHtml()); };
    window.openPrsSummariesModal = function() { showModal(generatePrsSummariesHtml()); };
    window.openAiAssistantModal = function() { showModal(generateAiAssistantHtml()); };
    window.openPrsEfficiencyModal = function() { showModal(generatePrsEfficiencyHtml()); };
    window.openBypassesModal = function() { showModal(generateBypassesHtml()); };
    window.openLogoutConfirmModal = function() { showModal(generateLogoutConfirmHtml()); };
    window.openStockWellsModal = function() { showModal(generateStockWellsHtml()); };
    window.openKesModal = function() { showModal(generateKesHtml()); };
    window.openLast10Modal = function(typeV) { showModal(generateLast10Html(typeV || 1)); };
    window.openYearPlanModal = function() { showModal(generateYearPlanHtml()); };
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
    document.addEventListener("click", function(e) {
        // Dismiss modal if clicking close button or backdrop
        if (e.target.classList.contains("popup-close") || e.target.classList.contains("popup")) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            $(".popup").removeClass("show").hide().empty();
            $(".underTable").remove();
            return;
        }

        // If click is inside modal content or inside floating equipment legend, do not intercept
        if (e.target.closest(".popup-inner") || e.target.closest(".underTable")) {
            return;
        }

        // 0. Menu navigation items
        var menuItem = e.target.closest(".menu-navigation ul li");
        if (menuItem) {
            // Check if clicking report button or inside report dropdown
            if (e.target.closest("#button-report")) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                $("#report").toggle();
                return;
            }
            if (e.target.closest("#report")) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var link = $(menuItem).find("a").first();
            var href = link.attr("href") || "";
            var txt = link.text().replace(/\s+/g, " ").trim();

            $(".menu-navigation").removeClass("active").hide();

            if (href.indexOf("productionMonitoring") !== -1 || txt.indexOf("Мониторинг") !== -1) {
                $(".popup").removeClass("show").hide().empty();
                $(".underTable").remove();
                window.showPushNotification("Мониторинг добычи — данные актуализированы");
            } else if (href.indexOf("reverseCalculation") !== -1 || txt.indexOf("Обратный расчет") !== -1) {
                window.openReverseCalculationModal("oil");
            } else if (href.indexOf("repair_summary") !== -1 || txt.indexOf("Сводки ПРС") !== -1) {
                window.openPrsSummariesModal();
            } else if (href.indexOf("repair") !== -1 || txt === "ПРС") {
                window.openPrsOperationsModal();
            } else if (href.indexOf(":8083") !== -1 || txt.indexOf("ИИ-ассистент") !== -1) {
                window.openAiAssistantModal();
            } else if (href.indexOf(":8081") !== -1 || txt.indexOf("Эффективность ПРС") !== -1) {
                window.openPrsEfficiencyModal();
            } else if (href.indexOf("bypasses") !== -1 || txt.indexOf("Обходы") !== -1) {
                window.openBypassesModal();
            } else if (href.indexOf("logout") !== -1 || txt.indexOf("Выход") !== -1) {
                window.openLogoutConfirmModal();
            }
            return;
        }

        // 1. Page buttons in header
        var pageBtn = e.target.closest(".page-button");
        if (pageBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var id = pageBtn.id || "";
            var text = pageBtn.innerText || "";

            if (id === "StockWells" || text.indexOf("Фонд скважин") !== -1) {
                window.openStockWellsModal();
            } else if (id === "kesButton" || text.indexOf("КЭС") !== -1) {
                window.openKesModal();
            } else if (id === "last10GTM" || text.indexOf("ГТМ") !== -1) {
                window.openLast10Modal(1);
            } else if (id === "last10PRS" || text.indexOf("ПРС") !== -1) {
                window.openLast10Modal(2);
            } else if (id === "yearPlan" || text.indexOf("Годовой план") !== -1 || $(pageBtn).hasClass("year")) {
                window.openYearPlanModal();
            }
            return;
        }

        // 2. AGZU toggle tabs - pass through to native onclick
        if (e.target.closest(".agzu-toggle-buttons, .head")) {
            return;
        }

        // 3. AGZU wells & otvod-b clicks
        var otvodEl = e.target.closest(".otvod, .otvod-b");
        if (otvodEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var wellName = "";
            var debit = "";
            if (otvodEl.classList.contains("otvod-b")) {
                var num = $(otvodEl).attr("data-otvod") || $(otvodEl).text().trim();
                var matched = $("#agzu .otvod[data-otvod=\"" + num + "\"]");
                if (matched.length) {
                    wellName = matched.find(".tt1").text().trim();
                    debit = matched.find(".tt2").text().trim();
                }
                if (!wellName) {
                    wellName = "Отвод №" + num + " (Резерв)";
                    debit = "0.00";
                }
            } else {
                wellName = $(otvodEl).find(".tt1").text().trim();
                debit = $(otvodEl).find(".tt2").text().trim();
                if (!wellName) {
                    wellName = "Отвод (Резерв)";
                    debit = "0.00";
                }
            }
            window.openWellPassportModal(wellName, debit);
            return;
        }

        // 4. Normative table well cells
        var normCell = e.target.closest(".normative-cell");
        if (normCell) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var wName = $(normCell).find(".well-number").text().trim() || $(normCell).data("id") || "UAZ_0031";
            var deb = $(normCell).find(".evaluate").text().trim() || "14.50";
            window.openWellPassportModal(wName, deb);
            return;
        }

        // 5. RGS Horizontal tanks (РГС 2, 3, 4)
        var rgsEl = e.target.closest(".rgs, .rgs2, .rgs3, .rgs4, [data-type^=\"rgs\"]");
        if (rgsEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var rgsNum = 3;
            var dt = $(rgsEl).attr("data-type") || "";
            if ($(rgsEl).hasClass("rgs2") || dt === "rgs-2" || $(rgsEl).find(".f3").text().trim() === "2") rgsNum = 2;
            else if ($(rgsEl).hasClass("rgs4") || dt === "rgs-4" || $(rgsEl).find(".f3").text().trim() === "4") rgsNum = 4;
            window.openRgsModal(rgsNum);
            return;
        }

        // 6. Furnaces (Печи №1, №2)
        var pechEl = e.target.closest(".pech1, .pech2, .pech, [data-type=\"pech\"]");
        if (pechEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var pNum = 1;
            if ($(pechEl).hasClass("pech2") || $(pechEl).text().indexOf("Печь №2") !== -1) pNum = 2;
            window.openPechModal(pNum);
            return;
        }

        // 7. Pipeline collector
        var blockText1 = e.target.closest(".block-text-1");
        if (blockText1) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openCollectorModal();
            return;
        }

        // 8. Zholdybay pipeline
        var blockText2 = e.target.closest(".block-text-2");
        if (blockText2) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openZholdybayModal();
            return;
        }

        // 9. BDR (БДР)
        var bdrEl = e.target.closest(".bdr");
        if (bdrEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openBdrModal();
            return;
        }

        // 10. AGZU central circle
        var circleEl = e.target.closest(".agzu-circle");
        if (circleEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openAgzuCircleModal();
            return;
        }

        // 11. RVS tanks (РВС 1 and РВС 2)
        var rvsEl = e.target.closest(".rvs2, .rvs, [data-type^=\"rvs\"]");
        if (rvsEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var isRvs1 = $(rvsEl).hasClass("rvs2") || 
                         $(rvsEl).attr("data-type") === "rvs2" || 
                         $(rvsEl).text().indexOf("РВС 1") !== -1;
            window.openRvsModal(isRvs1 ? 1 : 2);
            return;
        }

        // 12. Pumps (Насосная перекачки нефти and Насосная ППД)
        var nasos2El = e.target.closest(".nasos2, [data-type=\"nasos2\"]");
        if (nasos2El) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openNasosModal("перекачки");
            return;
        }
        var nasosEl = e.target.closest(".nasos, [data-type=\"nasos\"]");
        if (nasosEl) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openNasosModal("ппд");
            return;
        }

        // 13. Massometers and flow meters
        var massometr2 = e.target.closest(".massometr-2");
        if (massometr2) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openMassometrModal("эстакада-нефть");
            return;
        }
        var massometr3 = e.target.closest(".massometr-3");
        if (massometr3) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openMassometrModal("эстакада-вода");
            return;
        }
        var massometr1 = e.target.closest(".massometr");
        if (massometr1) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openMassometrModal("узел-учета-1");
            return;
        }

        // 14. Water & Gas counter tables
        var waterTable = e.target.closest(".water-counter-table");
        if (waterTable) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openCounterModal("вода");
            return;
        }
        var gasTable = e.target.closest(".gas-counter-table");
        if (gasTable) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.openCounterModal("газ");
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



        // 4. Menu Drawer toggle (unified, robust)
        $('.open-menu-button, .menu-button').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var $m = $('.menu-navigation');
            if ($m.is(':visible') || $m.hasClass('active')) {
                $m.removeClass('active').hide();
                $('#report').hide();
            } else {
                $m.addClass('active').show();
            }
        });
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.menu-navigation, .open-menu-button, .menu-button').length) {
                $('.menu-navigation').removeClass('active').hide();
                $('#report').hide();
            }
            if (!$(e.target).closest('.field-navigation, .settings-button, .open-settings-button').length) {
                $('.field-navigation').removeClass('active').hide();
            }
            if (!$(e.target).closest('.sortByItem, #sortBy').length) {
                $('.sortByItem').hide();
            }
        });
        $('.menu-navigation, .field-navigation, .sortByItem').on('click', function(e) {
            e.stopPropagation();
        });

        // 4b. Reverse calculation tab switcher & passport clicks
        $(document).on('click', '.rc-tab-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var tab = $(this).data('tab');
            window.openReverseCalculationModal(tab);
        });
        $(document).on('click', '.rc-open-passport', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var well = $(this).data('well');
            var debit = $(this).data('debit');
            window.openWellPassportModal(well, debit);
        });

        // 4c. AI Assistant interactive prompt pills & inputs
        $(document).on('click', '.ai-prompt-pill', function(e) {
            e.preventDefault();
            var prompt = $(this).data('prompt') || $(this).text().trim();
            window.submitAiPrompt(prompt);
        });
        $(document).on('click', '#aiSubmitBtn', function(e) {
            e.preventDefault();
            var prompt = $('#aiInputText').val().trim();
            if (prompt) {
                $('#aiInputText').val('');
                window.submitAiPrompt(prompt);
            }
        });
        $(document).on('keypress', '#aiInputText', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                var prompt = $('#aiInputText').val().trim();
                if (prompt) {
                    $('#aiInputText').val('');
                    window.submitAiPrompt(prompt);
                }
            }
        });

        // 4d. Logout Confirm & Login Screen Overlay
        $(document).on('click', '#confirmLogoutBtn', function(e) {
            e.preventDefault();
            $('.popup').removeClass('show').hide().empty();
            window.showLoginOverlay();
        });
        $(document).on('click', '#reLoginBtn', function(e) {
            e.preventDefault();
            $('.login-overlay').fadeOut(300, function() {
                $(this).remove();
            });
            window.showPushNotification('Добро пожаловать в систему мониторинга добычи!');
        });

        // 4e. Report Form Interceptor
        $('#report form').on('submit', function(e) {
            e.preventDefault();
            var formId = $(this).closest('.tab-pane').attr('id') || 'accounting';
            var month = $(this).find('select[name="month"] option:selected').text();
            var year = $(this).find('select[name="year"]').val();
            var typeText = formId === 'balance' ? 'по балансу' : 'по учету';
            $('#report').hide();
            $('.menu-navigation').removeClass('active').hide();
            window.showPushNotification('Отчет ' + typeText + ' за ' + month + ' ' + year + ' успешно выгружен!');
        });
        $('.report .btn-cancel').on('click', function(e) {
            e.preventDefault();
            $('#report').hide();
        });
        $('.report .nav-report li a').on('click', function(e) {
            e.preventDefault();
            var target = $(this).attr('href');
            $('.report .nav-report li').removeClass('active');
            $(this).parent().addClass('active');
            $('.report .tab-content .tab-pane').removeClass('active');
            $(target).addClass('active');
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
