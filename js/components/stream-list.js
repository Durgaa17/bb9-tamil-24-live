// Stream List Component
const StreamListComponent = {
    currentFilter: 'all',
    searchQuery: '',
    sortBy: 'viewers',
    sortOrder: 'desc',

    // Initialize stream list
    init() {
        this.render();
        this.setupEventListeners();
        this.setupStreamListeners();
        this.loadStreams();
    },

    // Render stream list
    render() {
        const container = DOMUtils.get('stream-list-container');
        if (!container) return;

        container.innerHTML = `
            <div class="stream-list-header">
                <div class="stream-list-title">
                    <i>📺</i>
                    <span>Available Streams</span>
                </div>
                <div class="stream-list-actions">
                    <button class="stream-list-action" data-action="refresh-streams" title="Refresh Streams">
                        <i>🔄</i>
                    </button>
                    <button class="stream-list-action" data-action="toggle-filters" title="Toggle Filters">
                        <i>🔍</i>
                    </button>
                </div>
            </div>
            
            <div class="stream-filters" id="stream-filters">
                <div class="search-box">
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Search streams..." 
                        id="stream-search"
                    >
                </div>
                <select class="filter-select" id="status-filter">
                    <option value="all">All Streams</option>
                    <option value="live">Live Only</option>
                    <option value="offline">Offline Only</option>
                </select>
                <select class="filter-select" id="sort-by">
                    <option value="viewers">Sort by Viewers</option>
                    <option value="name">Sort by Name</option>
                    <option value="status">Sort by Status</option>
                </select>
            </div>
            
            <div class="stream-list" id="stream-list">
                <div class="stream-list-loading">
                    <i>⏳</i>
                    <div>Loading streams...</div>
                </div>
            </div>
        `;
    },

    // Setup event listeners
    setupEventListeners() {
        // Refresh streams
        DOMUtils.on('[data-action="refresh-streams"]', 'click', () => {
            this.refreshStreams();
        });

        // Toggle filters
        DOMUtils.on('[data-action="toggle-filters"]', 'click', () => {
            this.toggleFilters();
        });

        // Search input
        const searchInput = DOMUtils.get('stream-search');
        if (searchInput) {
            searchInput.addEventListener('input', DOMUtils.debounce((e) => {
                this.searchQuery = e.target.value;
                this.filterAndRenderStreams();
            }, 300));
        }

        // Status filter
        const statusFilter = DOMUtils.get('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterAndRenderStreams();
            });
        }

        // Sort by
        const sortBy = DOMUtils.get('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndRenderStreams();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            if (e.key === '/' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                const searchInput = DOMUtils.get('stream-search');
                if (searchInput) searchInput.focus();
            }
        });
    },

    // Setup stream listeners
    setupStreamListeners() {
        StreamManager.on('streamsUpdated', (streams) => {
            this.filterAndRenderStreams();
        });

        StreamManager.on('streamsError', (error) => {
            this.showError(error);
        });

        StreamManager.on('streamChanged', (stream) => {
            this.updateActiveStream(stream);
        });
    },

    // Load streams
    async loadStreams() {
        await StreamManager.loadStreams();
    },

    // Refresh streams
    async refreshStreams() {
        const refreshBtn = DOMUtils.find('[data-action="refresh-streams"]');
        DOMUtils.addClass(refreshBtn, CONSTANTS.CLASS_NAMES.LOADING);
        
        await StreamManager.refreshStreams();
        
        setTimeout(() => {
            DOMUtils.removeClass(refreshBtn, CONSTANTS.CLASS_NAMES.LOADING);
        }, 1000);
    },

    // Filter and render streams
    filterAndRenderStreams() {
        const streams = StreamManager.getStreams({
            status: this.currentFilter === 'all' ? null : this.currentFilter,
            search: this.searchQuery
        });

        this.renderStreams(streams);
    },

    // Render streams list
    renderStreams(streams) {
        const streamList = DOMUtils.get('stream-list');
        if (!streamList) return;

        if (streams.length === 0) {
            this.showEmptyState();
            return;
        }

        let html = '';
        
        streams.forEach(stream => {
            const isActive = StreamManager.getCurrentStream()?.id === stream.id;
            const activeClass = isActive ? 'active' : '';
            
            html += `
                <div class="stream-item ${activeClass}" data-stream-id="${stream.id}">
                    <div class="stream-thumbnail">
                        <img src="${stream.thumbnail}" alt="${stream.username}" onerror="this.style.display='none'">
                        <div class="live-indicator ${stream.isLive ? 'live' : ''}">
                            ${stream.isLive ? 'LIVE' : 'OFF'}
                        </div>
                        <div class="viewer-count">
                            ${stream.viewers} viewers
                        </div>
                    </div>
                    <div class="stream-info-compact">
                        <div class="stream-username-compact">
                            ${this.escapeHtml(stream.username)}
                        </div>
                        <div class="stream-details-compact">
                            <span class="stream-game-compact">
                                ${this.escapeHtml(stream.game)}
                            </span>
                            <div class="stream-status-compact">
                                <span class="status-dot ${stream.isLive ? 'live' : ''}"></span>
                                <span>${stream.displayStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        streamList.innerHTML = html;
        
        // Add click listeners to stream items
        this.setupStreamItemListeners();
        
        // Update stats in header
        if (window.HeaderComponent) {
            HeaderComponent.updateStats();
        }
    },

    // Setup stream item listeners
    setupStreamItemListeners() {
        const streamItems = DOMUtils.findAll('.stream-item');
        
        streamItems.forEach(item => {
            item.addEventListener('click', () => {
                const streamId = item.getAttribute('data-stream-id');
                const stream = StreamManager.getStreamById(streamId);
                
                if (stream) {
                    StreamManager.playStream(stream);
                    this.updateActiveStream(stream);
                    
                    // Scroll item into view on mobile
                    if (ResponsiveManager.isMobile) {
                        ResponsiveManager.scrollToElement(item);
                    }
                }
            });

            // Add focus styles for TV navigation
            if (ResponsiveManager.isTV) {
                item.addEventListener('focus', () => {
                    DOMUtils.addClass(item, 'focused');
                });
                
                item.addEventListener('blur', () => {
                    DOMUtils.removeClass(item, 'focused');
                });
            }
        });
    },

    // Update active stream highlight
    updateActiveStream(stream) {
        // Remove active class from all items
        const allItems = DOMUtils.findAll('.stream-item');
        allItems.forEach(item => {
            DOMUtils.removeClass(item, CONSTANTS.CLASS_NAMES.ACTIVE);
        });

        // Add active class to current stream
        if (stream) {
            const activeItem = DOMUtils.find(`[data-stream-id="${stream.id}"]`);
            if (activeItem) {
                DOMUtils.addClass(activeItem, CONSTANTS.CLASS_NAMES.ACTIVE);
            }
        }
    },

    // Show empty state
    showEmptyState() {
        const streamList = DOMUtils.get('stream-list');
        if (!streamList) return;

        let message = '';
        let icon = '📺';

        if (this.searchQuery) {
            message = 'No streams match your search criteria';
            icon = '🔍';
        } else if (this.currentFilter === 'live') {
            message = 'No live streams available';
            icon = '⏳';
        } else {
            message = 'No streams available';
            icon = '❌';
        }

        streamList.innerHTML = `
            <div class="stream-list-empty">
                <i>${icon}</i>
                <div>${message}</div>
                ${this.searchQuery || this.currentFilter !== 'all' ? 
                    '<button class="chat-connect-btn" onclick="StreamListComponent.clearFilters()">Clear Filters</button>' : 
                    ''
                }
            </div>
        `;
    },

    // Show error state
    showError(error) {
        const streamList = DOMUtils.get('stream-list');
        if (!streamList) return;

        streamList.innerHTML = `
            <div class="stream-list-error">
                <i>⚠️</i>
                <div>Failed to load streams</div>
                <div class="error-details">${error.message || 'Unknown error'}</div>
                <button class="chat-connect-btn" onclick="StreamListComponent.retryLoad()">Retry</button>
            </div>
        `;
    },

    // Clear all filters
    clearFilters() {
        this.searchQuery = '';
        this.currentFilter = 'all';
        this.sortBy = 'viewers';

        // Update UI elements
        const searchInput = DOMUtils.get('stream-search');
        const statusFilter = DOMUtils.get('status-filter');
        const sortBy = DOMUtils.get('sort-by');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (sortBy) sortBy.value = 'viewers';

        this.filterAndRenderStreams();
    },

    // Retry loading streams
    retryLoad() {
        this.loadStreams();
    },

    // Toggle filters visibility
    toggleFilters() {
        const filters = DOMUtils.get('stream-filters');
        if (filters) {
            DOMUtils.toggleClass(filters, CONSTANTS.CLASS_NAMES.HIDDEN);
        }
    },

    // Get current filter state
    getFilterState() {
        return {
            search: this.searchQuery,
            status: this.currentFilter,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
    },

    // Apply filter state
    applyFilterState(state) {
        this.searchQuery = state.search || '';
        this.currentFilter = state.status || 'all';
        this.sortBy = state.sortBy || 'viewers';
        this.sortOrder = state.sortOrder || 'desc';

        // Update UI
        const searchInput = DOMUtils.get('stream-search');
        const statusFilter = DOMUtils.get('status-filter');
        const sortBy = DOMUtils.get('sort-by');

        if (searchInput) searchInput.value = this.searchQuery;
        if (statusFilter) statusFilter.value = this.currentFilter;
        if (sortBy) sortBy.value = this.sortBy;

        this.filterAndRenderStreams();
    },

    // Escape HTML for safe rendering
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Focus management for TV
    focusFirstStream() {
        const firstStream = DOMUtils.find('.stream-item');
        if (firstStream) {
            firstStream.focus();
        }
    },

    // Cleanup
    destroy() {
        // Cleanup if needed
    }
};
