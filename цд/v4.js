/**
 * @fileoverview Application entry point and business logic controller for Digital Twin v4.
 * Integrates bidirectional hover interaction between HTML UI and 3D WebGL scene.
 */

import { DigitalTwin3D } from './v4-3d.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('scene-container');
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loader-text');

  if (!container) {
    console.error('Fatal: #scene-container element not found');
    return;
  }

  const stackItems = Array.from(document.querySelectorAll('.lay'));

  /**
   * Helper to parse comma-separated layer IDs from data-layers attribute.
   * @param {HTMLElement} el
   * @returns {number[]}
   */
  const parseLayers = (el) => {
    const raw = el.getAttribute('data-layers');
    if (!raw) return [];
    return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  };

  /**
   * Synchronizes active state across sidebar stack items.
   * @param {number|number[]|null} targetLayer
   */
  const syncUiHighlight = (targetLayer) => {
    let activeIds = [];
    if (Array.isArray(targetLayer)) {
      activeIds = targetLayer;
    } else if (typeof targetLayer === 'number') {
      activeIds = [targetLayer];
    }

    const matchesGroup = (el) => {
      const elLayers = parseLayers(el);
      return activeIds.some(id => elLayers.includes(id));
    };

    stackItems.forEach(lay => lay.classList.toggle('active', matchesGroup(lay)));
  };

  // Initialize the 3D Digital Twin instance in compact resting mode
  const digitalTwin = new DigitalTwin3D(container, {
    initialGap: 0,
    autoRotate: true,
    onReady: () => {
      if (loader) {
        loader.classList.add('is-hidden');
        setTimeout(() => loader.remove(), 550);
      }
    },
    onError: (error) => {
      console.error('Failed to initialize 3D scene:', error);
      if (loaderText) {
        loaderText.textContent = 'Ошибка загрузки 3D модели';
      }
    },
    onLayerHover: (layerId) => {
      syncUiHighlight(layerId);
    }
  });

  // Expose instance for debugging/inspection in developer tools
  window.digitalTwin = digitalTwin;
  window.digitalTwinRoot = digitalTwin.rootGroup;

  // Bind hover interactions on sidebar stack items
  stackItems.forEach(item => {
    const layers = parseLayers(item);
    item.addEventListener('mouseenter', () => {
      digitalTwin.setHoveredLayer(layers);
      syncUiHighlight(layers);
    });
    item.addEventListener('mouseleave', () => {
      digitalTwin.setHoveredLayer(null);
      syncUiHighlight(null);
    });
  });

    // Spacebar keyboard shortcut toggles layer expansion
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      digitalTwin.toggleGap();
    }
  });

  // Support URL parameters for automated testing and deep linking (e.g. ?hover=4 or ?exploded=1)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('hover')) {
    const rawHover = urlParams.get('hover').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    setTimeout(() => {
      digitalTwin.setHoveredLayer(rawHover);
      syncUiHighlight(rawHover);
    }, 600);
  }
  if (urlParams.has('exploded') && (urlParams.get('exploded') === '1' || urlParams.get('exploded') === 'true')) {
    setTimeout(() => {
      digitalTwin.toggleGap();
    }, 600);
  }
});
