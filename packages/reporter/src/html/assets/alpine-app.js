function visnapReport() {
  return {
    data: window.__VISNAP_DATA__,
    filters: {
      search: '',
      status: 'all',
      browser: ''
    },
    expandedTests: [],
    filteredTests: [],
    browsers: [],
    showConfig: false,
    // Per-test comparison state
    testViewModes: {}, // testId -> viewMode
    testSliderPositions: {}, // testId -> sliderPosition
    testOverlayOpacities: {}, // testId -> overlayOpacity
    isDragging: false,

    init() {
      // Auto-expand failed tests
      if (this.data.outcome.testCases) {
        this.data.outcome.testCases.forEach(test => {
          if (test.status === 'failed' || test.status === 'capture-failed') {
            this.expandedTests.push(test.id);
          }
        });
      }

      // Extract unique browsers
      const browserSet = new Set();
      this.data.outcome.testCases?.forEach(test => {
        if (test.browser) browserSet.add(test.browser);
      });
      this.browsers = Array.from(browserSet).sort();

      // Initial filter
      this.applyFilters();
    },

    get failedCount() {
      return (
        (this.data.outcome.failedDiffs || 0) +
        (this.data.outcome.failedMissingCurrent || 0) +
        (this.data.outcome.failedMissingBase || 0) +
        (this.data.outcome.failedErrors || 0)
      );
    },

    get duration() {
      return this.data.outcome.durations?.totalDurationMs;
    },

    get formattedTimestamp() {
      return new Date(this.data.timestamp).toLocaleString();
    },

    setStatusFilter(status) {
      this.filters.status = status;
      this.applyFilters();
    },

    applyFilters() {
      let tests = this.data.outcome.testCases || [];

      // Status filter
      if (this.filters.status !== 'all') {
        tests = tests.filter(t => t.status === this.filters.status);
      }

      // Browser filter
      if (this.filters.browser) {
        tests = tests.filter(t => t.browser === this.filters.browser);
      }

      // Search filter
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase();
        tests = tests.filter(t => 
          t.id?.toLowerCase().includes(query) ||
          t.title?.toLowerCase().includes(query) ||
          t.kind?.toLowerCase().includes(query)
        );
      }

      // Sort tests: failed first, then passed, then others
      tests.sort((a, b) => {
        const statusOrder = { 'failed': 0, 'capture-failed': 1, 'passed': 2 };
        const aOrder = statusOrder[a.status] ?? 3;
        const bOrder = statusOrder[b.status] ?? 3;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // If same status, sort by test ID for consistency
        return a.id.localeCompare(b.id);
      });

      this.filteredTests = tests;
    },

    clearFilters() {
      this.filters = { search: '', status: 'all', browser: '' };
      this.applyFilters();
    },

    toggleConfig() {
      this.showConfig = !this.showConfig;
    },

    toggleTest(id) {
      const index = this.expandedTests.indexOf(id);
      if (index > -1) {
        this.expandedTests.splice(index, 1);
      } else {
        this.expandedTests.push(id);
        // Initialize comparison state for this test
        this.initializeTestComparison(id);
      }
    },

    // Per-test comparison methods
    initializeTestComparison(testId) {
      if (!this.testViewModes[testId]) {
        this.testViewModes[testId] = 'side-by-side';
        this.testSliderPositions[testId] = 50;
        this.testOverlayOpacities[testId] = 0.5;
      }
    },

    getTestViewMode(testId) {
      return this.testViewModes[testId] || 'side-by-side';
    },

    setTestViewMode(testId, mode) {
      this.testViewModes[testId] = mode;
    },

    getTestSliderPosition(testId) {
      return this.testSliderPositions[testId] || 50;
    },

    getTestOverlayOpacity(testId) {
      return this.testOverlayOpacities[testId] || 0.5;
    },

    setTestOverlayOpacity(testId, opacity) {
      this.testOverlayOpacities[testId] = parseFloat(opacity);
    },

    initTestSlider(testId) {
      // Called when slider view is initialized for a specific test
    },

    startTestSliderDrag(event, testId) {
      this.isDragging = true;
      const slider = event.target.parentElement;
      
      const move = (e) => {
        if (!this.isDragging) return;
        const rect = slider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
        this.testSliderPositions[testId] = position;
      };

      const stop = () => {
        this.isDragging = false;
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', stop);
      };

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', stop);
    }
  };
}
