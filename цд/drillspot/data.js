'use strict';

// Зафиксированное состояние экрана Demo. Трассы ниже — демонстрационные,
// поскольку исходная страница не предоставляет исторические замеры в разметке.
const screenData = Object.freeze({
  windows: [
    'Demo', 'Copy of Monitoring_time (3)', 'Copy of Monitoring_time (2)',
    'Copy of Monitoring_time', 'Monitoring_time_new', 'Drilling Optimization',
    'Directional Drilling', 'Rig Performance', 'Real-time Operations', '3D 4 Nurlan',
    'Rig Performance 646', 'Copy of 3D 1', 'Copy of Activity 1', 'Copy of Drilling KPI 1',
    'Copy of Days vs Depth 1', 'Monitoring_time', 'N-247 Aibar', 'Analytics',
  ],
  wells: ['привязка', '2745', '2745', '2746', '2748', '2748_', '2748_привяз', '2769', '2769', '2773', '2781', '2786', '2793'],
  groups: ['Bit Depth', 'Block Position', 'Erratic Torque', 'Flow In Rate', 'Flow Out Rate', 'Gamma Ray', 'Gas C1', 'Gas C2', 'Gas C3', 'Gas iso-C4', 'Gas iso-C5', 'Gas nor-C4', 'Gas nor-C5', 'Gross ROP', 'Hole Depth', 'Hookload', 'KPI: On Bottom to Slips', 'KPI: Pumps On to Bottom', 'KPI: Slips to On Bottom', 'ROP', 'Standpipe Pressure', 'Surface RPM', 'Surface Torque', 'Total Gas', 'Total Volume', 'WOB'],
  activities: ['Rig Act', 'Weight', 'Slip to', 'Pump', 'On Bott', 'Slips to'],
  tracks: [
    [{ name: 'Block Position', label: 'Block P', color: '#fff28b', line: 'steps' }, { name: 'Hookload', label: 'Hookload', color: '#8071ff', line: 'load' }],
    [{ name: 'WOB', label: 'WOB', color: '#c94e56', light: true, line: 'zero' }, { name: 'ROP', label: 'ROP', color: '#75cf5b', line: 'speed' }, { name: 'Differential Pressure', label: 'Differen', color: '#213443', light: true, line: 'none' }],
    [{ name: 'Surface Torque', label: 'Surface', color: '#8cdff1', line: 'torque' }, { name: 'Surface RPM', label: 'Surface', color: '#69c953', line: 'none' }],
    [{ name: 'Flow In Rate', label: 'Flow In', color: '#8773ff', line: 'flow' }, { name: 'Standpipe Pressure', label: 'Standpi', color: '#ff6339', line: 'pressure' }],
    [{ name: 'Gamma Ray', label: 'Gamma', color: '#92e5f5', line: 'gamma' }, { name: 'Total Gas', label: 'Total Ga', color: '#ff6236', line: 'gas' }],
    [{ name: 'Total Volume', label: 'Total Ta', color: '#94e4f5', line: 'none' }, { name: 'Total Volume', label: 'Total Vo', color: '#7c6aff', line: 'volume' }],
  ],
});
