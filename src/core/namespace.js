(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__ = global.__SQSMORPH__ || {};
  NS.version = '0.1.0';
  NS.state = NS.state || {
    components: new Map(),
    selectedId: null,
    observer: null,
    designer: null,
    initialized: false,
    scanTimer: null
  };
  NS.utils = NS.utils || {};
  NS.adapters = NS.adapters || [];
  NS.presets = NS.presets || {};
})(window);
