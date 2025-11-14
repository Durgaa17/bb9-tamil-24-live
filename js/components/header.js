// Header Component
const HeaderComponent = {
    // Initialize header
    init() {
        this.render();
        this.setupEventListeners();
        this.updateStats();
    },

    // Render header content
    render() {
        const header = DOMUtils.get('header');
        if (!header) return;

        header.innerHTML = `
            <div class="header-content">
                <div class="logo-section">
                    <a href="#" class="logo">
                        <img src="assets/images/logo.png" alt="Twitch Streams" class="logo-image" onerror="this.style.display='none'">
                        <span class="logo-text">Twitch Streams</span>
                    </a>
                </div>
                
                <nav class="nav">
                    <button class="nav-item active" data-action="refresh">
                        <i>🔄</i>
                        <span>Refresh</span>
                    </button>
                    <button class="nav-item" data-action="toggle-chat">
                        <i>💬</i>
                        <span>Chat</span>
                    </button>
                    <button class="nav-item" data-action="settings">
                        <i>⚙️</i>
                        <span>Settings</span>
                    </button>
                </nav>
                
                <div class="stats">
                    <div class="stat-item">
                        <span class="stat-badge live">LIVE</span>
                        <span id="live-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Total: </span>
                        <span id="total-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Viewers: </span>
                        <span id="viewers-count">0</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Setup event listeners
    setupEventListeners() {
        // Refresh button
        DOMUtils.on('[data-action="refresh"]', 'click', () => {
            this.handleRefresh();
        });

        // Toggle chat button
        DOMUtils.on('[data-action="toggle-chat"]', 'click', () => {
            this.handleToggleChat();
        });

        // Settings button
        DOMUtils.on('[data-action="settings"]', 'click', () => {
            this.handleSettings();
        });

        // Listen for stream updates
        StreamManager.on('streamsUpdated', () => {
            this.updateStats();
        });

        // Listen for chat visibility changes
        if (window.ChatComponent) {
            ChatComponent.onVisibilityChange((visible) => {
                this.updateChatButton(visible);
            });
        }
    },

    // Handle refresh action
    handleRefresh() {
        const refreshBtn = DOMUtils.find('[data-action="refresh"]');
        DOMUtils.addClass(refreshBtn, CONSTANTS.CLASS_NAMES.LOADING);
        
        StreamManager.refreshStreams().finally(() => {
            setTimeout(() => {
                DOMUtils.removeClass(refreshBtn, CONSTANTS.CLASS_NAMES.LOADING);
            }, 1000);
        });
    },

    // Handle toggle chat action
    handleToggleChat() {
        if (window.ChatComponent) {
            ChatComponent.toggleVisibility();
        }
    },

    // Handle settings action
    handleSettings() {
        // Simple settings modal - can be enhanced later
        const settings = `
            Auto-refresh: ${SETTINGS.features.autoRefresh ? 'ON' : 'OFF'}<br>
            Chat: ${SETTINGS.chat.visible ? 'ON' : 'OFF'}<br>
            Theme: ${SETTINGS.ui.theme}
        `;
        
        alert('Settings:\n\n' + settings);
    },

    // Update statistics display
    updateStats() {
        const stats = StreamManager.getStats();
        
        const liveCount = DOMUtils.get('live-count');
        const totalCount = DOMUtils.get('total-count');
        const viewersCount = DOMUtils.get('viewers-count');
        
        if (liveCount) liveCount.textContent = stats.live;
        if (totalCount) totalCount.textContent = stats.total;
        if (viewersCount) viewersCount.textContent = stats.totalViewers.toLocaleString();
        
        // Update refresh button with last update time
        this.updateLastRefreshTime();
    },

    // Update last refresh time
    updateLastRefreshTime() {
        const refreshBtn = DOMUtils.find('[data-action="refresh"] span');
        if (refreshBtn) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            refreshBtn.textContent = `Refresh (${timeString})`;
        }
    },

    // Update chat button state
    updateChatButton(visible) {
        const chatBtn = DOMUtils.find('[data-action="toggle-chat"]');
        if (chatBtn) {
            if (visible) {
                DOMUtils.addClass(chatBtn, CONSTANTS.CLASS_NAMES.ACTIVE);
            } else {
                DOMUtils.removeClass(chatBtn, CONSTANTS.CLASS_NAMES.ACTIVE);
            }
        }
    },

    // Set active navigation item
    setActiveNavItem(action) {
        const navItems = DOMUtils.findAll('.nav-item');
        navItems.forEach(item => {
            DOMUtils.removeClass(item, CONSTANTS.CLASS_NAMES.ACTIVE);
        });
        
        const activeItem = DOMUtils.find(`[data-action="${action}"]`);
        if (activeItem) {
            DOMUtils.addClass(activeItem, CONSTANTS.CLASS_NAMES.ACTIVE);
        }
    },

    // Show notification in header
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = DOMUtils.create('div', {
            className: `header-notification ${type}`,
            style: {
                position: 'fixed',
                top: '80px',
                right: '20px',
                background: type === 'error' ? 'var(--offline-color)' : 'var(--online-color)',
                color: 'white',
                padding: 'var(--space-md)',
                borderRadius: 'var(--border-radius-md)',
                zIndex: 'var(--z-tooltip)',
                boxShadow: 'var(--shadow-lg)'
            }
        }, [message]);

        document.body.appendChild(notification);

        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    },

    // Update header for mobile/TV layouts
    updateLayout() {
        const header = DOMUtils.get('header');
        if (!header) return;

        if (ResponsiveManager.isMobile) {
            DOMUtils.addClass(header, 'mobile-layout');
        } else {
            DOMUtils.removeClass(header, 'mobile-layout');
        }

        if (ResponsiveManager.isTV) {
            DOMUtils.addClass(header, 'tv-layout');
        } else {
            DOMUtils.removeClass(header, 'tv-layout');
        }
    },

    // Cleanup
    destroy() {
        // Remove event listeners if needed
    }
};
