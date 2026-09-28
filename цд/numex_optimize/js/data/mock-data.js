// Данные для экранов «Оптимизируемые скважины», «Очередь расчетов», «Результаты»
(function(window) {
  'use strict';

  const WELLS_DATA = [
    { well: '2907', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '3.43', rateTo: '∞', pFrom: '1.00', pTo: '1.00', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2753', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '30.91', rateTo: '∞', pFrom: '33.60', pTo: '34.91', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2744', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '25.02', rateTo: '∞', pFrom: '28.91', pTo: '29.78', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2743', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '49.71', rateTo: '∞', pFrom: '19.47', pTo: '20.09', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2671', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2665', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '13.80', rateTo: '∞', pFrom: '18.72', pTo: '1.00', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2663', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '72.48', rateTo: '∞', pFrom: '19.76', pTo: '20.88', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2658', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2532', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2524', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '1.34', rateTo: '∞', pFrom: '11.84', pTo: '13.10', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2517', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2516', date: '01.2026', type: 'inj', from: 'наг.', to: 'наг.', rateFrom: '147.00', rateTo: '∞', pFrom: '52.68', pTo: '52.35', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2514', date: '01.2026', type: 'inj-conv', from: 'б/д из доб.', to: 'б/д из наг.', rateFrom: '0.00', rateTo: '∞', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2513', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2511', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '62.50', rateTo: '∞', pFrom: '17.03', pTo: '3.23', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2506', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '2505', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '32.84', rateTo: '∞', pFrom: '16.76', pTo: '10.49', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '2060', date: '01.2026', type: 'inj-conv', from: 'б/д из наг.', to: 'б/д из наг.', rateFrom: '0.00', rateTo: '∞', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '1128', date: '01.2026', type: 'inj', from: 'наг.', to: 'наг.', rateFrom: '200.00', rateTo: '∞', pFrom: '54.76', pTo: '55.34', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '1050', date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '59.65', rateTo: '∞', pFrom: '1.00', pTo: '1.00', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
    { well: '1019', date: '01.2026', type: 'shut', from: 'б/д из доб.', to: 'б/д из доб.', rateFrom: '0.00', rateTo: '0.00', pFrom: '0.00', pTo: '0.00', dP: '-', kFrom: '1.00', kTo: '1.00', action: '', event: '' },
    { well: '906',  date: '01.2026', type: 'prod', from: 'доб.', to: 'доб.', rateFrom: '114.79', rateTo: '∞', pFrom: '15.05', pTo: '14.18', dP: '', kFrom: '0.97', kTo: '0.97', action: '', event: '' },
  ];

  const QUEUE_DATA = [
    { id: 'base_5_OBJ_...', startTime: '2026-08-01 13:20:36', status: 'завершен', duration: '0:02:54', node: 'MKHL9HX', result: '186457.8358' },
    { id: 'e0_5_OBJ_2.d...', startTime: '2026-08-01 13:25:20', status: 'завершен', duration: '0:04:25', node: 'MKHL9HX', result: '177040.781' },
    { id: 'e1_5_OBJ_2.d...', startTime: '2026-08-01 13:25:20', status: 'завершен', duration: '0:04:25', node: 'MKHL9HX', result: '177195.174' },
    { id: 'e2_5_OBJ_2.d...', startTime: '2026-08-01 13:29:46', status: 'завершен', duration: '0:04:42', node: 'MKHL9HX', result: '197522.3416' },
    { id: 'e3_5_OBJ_2.d...', startTime: '2026-08-01 13:29:46', status: 'завершен', duration: '0:04:32', node: 'MKHL9HX', result: '188598.3674' },
    { id: 'e4_5_OBJ_2.d...', startTime: '2026-08-01 13:34:18', status: 'завершен', duration: '0:03:02', node: 'MKHL9HX', result: '206902.2022' },
    { id: 'e5_5_OBJ_2.d...', startTime: '2026-08-01 13:37:24', status: 'завершен', duration: '0:04:41', node: 'MKHL9HX', result: '197946.7926' },
    { id: 'e6_5_OBJ_2.d...', startTime: '2026-08-01 13:37:25', status: 'завершен', duration: '0:04:47', node: 'MKHL9HX', result: '206180.7425' },
    { id: 'e7_5_OBJ_2.d...', startTime: '2026-08-01 13:42:06', status: 'завершен', duration: '0:04:45', node: 'MKHL9HX', result: '203324.3949' },
    { id: 'e8_5_OBJ_2.d...', startTime: '2026-08-01 13:42:12', status: 'завершен', duration: '0:04:45', node: 'MKHL9HX', result: '204918.2972' },
    { id: 'e9_5_OBJ_2.d...', startTime: '2026-08-01 13:46:51', status: 'завершен', duration: '0:04:53', node: 'MKHL9HX', result: '197423.879' },
    { id: 'e10_5_OBJ_2....', startTime: '2026-08-01 13:46:57', status: 'завершен', duration: '0:04:43', node: 'MKHL9HX', result: '200208.8768' },
    { id: 'e11_5_OBJ_2....', startTime: '2026-08-01 13:51:48', status: 'завершен', duration: '0:04:42', node: 'MKHL9HX', result: '199232.097' },
    { id: 'e12_5_OBJ_2....', startTime: '2026-08-01 13:51:48', status: 'завершен', duration: '0:04:33', node: 'MKHL9HX', result: '205783.8228' },
    { id: 'e13_5_OBJ_2....', startTime: '2026-08-01 13:56:21', status: 'завершен', duration: '0:05:10', node: 'MKHL9HX', result: '201250.5857' },
    { id: 'e14_5_OBJ_2....', startTime: '2026-08-01 13:56:30', status: 'завершен', duration: '0:04:50', node: 'MKHL9HX', result: '204035.9706' },
  ];

  const RESULTS_DATA = [
    { model: 'base_5_OBJ_...', result: '186 458', oil: '186 458', water: '4 226 814', liquid: '4 413 271', gas: '1 910 881', injWater: '2 193 765', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '186 458' },
    { model: 'e0_5_OBJ_2.d...', result: '177 041', oil: '177 041', water: '3 960 905', liquid: '4 137 946', gas: '1 810 270', injWater: '2 085 522', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '177 041', selectedCol: 'water' },
    { model: 'e1_5_OBJ_2.d...', result: '177 195', oil: '177 195', water: '3 968 010', liquid: '4 145 205', gas: '1 811 695', injWater: '2 088 035', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '177 195' },
    { model: 'e2_5_OBJ_2.d...', result: '197 522', oil: '197 522', water: '4 404 444', liquid: '4 601 966', gas: '2 016 665', injWater: '2 571 098', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '197 522' },
    { model: 'e3_5_OBJ_2.d...', result: '188 598', oil: '188 598', water: '4 416 909', liquid: '4 605 507', gas: '1 931 708', injWater: '2 733 244', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '188 598' },
    { model: 'e4_5_OBJ_2.d...', result: '206 902', oil: '206 902', water: '4 662 568', liquid: '4 869 471', gas: '2 098 780', injWater: '2 693 794', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '206 902' },
    { model: 'e5_5_OBJ_2.d...', result: '197 947', oil: '197 947', water: '4 521 105', liquid: '4 719 052', gas: '2 024 245', injWater: '2 469 548', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '197 947' },
    { model: 'e6_5_OBJ_2.d...', result: '206 181', oil: '206 181', water: '4 574 014', liquid: '4 780 194', gas: '2 103 656', injWater: '2 189 810', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '206 181' },
    { model: 'e7_5_OBJ_2.d...', result: '203 324', oil: '203 324', water: '4 482 922', liquid: '4 686 246', gas: '2 056 607', injWater: '2 468 599', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '203 324' },
    { model: 'e8_5_OBJ_2.d...', result: '204 918', oil: '204 918', water: '4 420 177', liquid: '4 625 096', gas: '2 078 021', injWater: '2 226 653', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '204 918' },
    { model: 'e9_5_OBJ_2.d...', result: '197 424', oil: '197 424', water: '4 382 284', liquid: '4 579 708', gas: '2 021 042', injWater: '2 272 190', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '197 424' },
    { model: 'e10_5_OBJ_2....', result: '200 209', oil: '200 209', water: '4 473 439', liquid: '4 673 648', gas: '2 042 516', injWater: '2 637 204', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '200 209' },
    { model: 'e11_5_OBJ_2....', result: '199 232', oil: '199 232', water: '4 493 776', liquid: '4 693 009', gas: '2 026 574', injWater: '2 288 547', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '199 232' },
    { model: 'e12_5_OBJ_2....', result: '205 784', oil: '205 784', water: '4 611 337', liquid: '4 817 121', gas: '2 086 355', injWater: '2 633 189', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '205 784' },
    { model: 'e13_5_OBJ_2....', result: '201 251', oil: '201 251', water: '4 536 979', liquid: '4 738 230', gas: '2 051 216', injWater: '2 585 612', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '201 251' },
    { model: 'e14_5_OBJ_2....', result: '204 036', oil: '204 036', water: '4 537 799', liquid: '4 741 834', gas: '2 063 202', injWater: '1 949 813', injGas: '0', actInj: '10', actGn: '0', actProd: '35', newWells: '0', bdToInj: '0', bdToProd: '0', transfers: '0', discOil: '204 036' },
  ];

  const TORNADO_DATA = [
    { name: 'Цена нефти ($/барр.)', neg: -18.4, pos: 22.6 },
    { name: 'Капитальные затраты (CAPEX)', neg: -14.2, pos: 11.5 },
    { name: 'Операционные затраты (OPEX)', neg: -9.8, pos: 8.4 },
    { name: 'Дебит новых скважин', neg: -7.5, pos: 15.2 },
    { name: 'Темп падения базовой добычи', neg: -12.1, pos: 6.8 },
    { name: 'Коэффициент дисконтирования', neg: -8.9, pos: 9.3 },
    { name: 'Приемистость нагнетания', neg: -5.4, pos: 7.1 },
  ];

  window.WELLS_DATA = WELLS_DATA;
  window.QUEUE_DATA = QUEUE_DATA;
  window.RESULTS_DATA = RESULTS_DATA;
  window.TORNADO_DATA = TORNADO_DATA;

})(typeof window !== 'undefined' ? window : this);
