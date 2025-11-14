// Main Application Entry Point
const TwitchStreamsApp = {
    // Initialize the application
    async init() {
        try {
            console.log('🚀 Initializing Twitch Streams App...');
            
            // Initialize core utilities first
            await this.initializeCore();
            
            // Initialize all components
            this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalListeners();
            
            // Start the application
            this.start();
            
            console.log('✅ Twitch Streams App initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showFatalError(error);
        }
    },

    // Initialize core utilities
    async initializeCore() {
        // Settings and constants are already loaded via script tags
        console.log('📋 Loading core utilities...');
        
        // Initialize managers
        ResponsiveManager.init();
        await StreamManager.init();
    },

    // Initialize all components
    initializeComponents() {
        console.log('🧩 Initializing components...');
        
        // Initialize components in order of dependency
        const components = [
            { name: 'Header', component: HeaderComponent },
            { name: 'Player', component: PlayerComponent },
            { name: 'Chat', component: ChatComponent },
            { name: 'StreamList', component: StreamListComponent },
            { name: 'SocialShare', component: SocialShareComponent },
            { name: 'Footer', component: FooterComponent }
        ];

        components.forEach(({ name, component }) => {
            try {
                if (component && typeof component.init === 'function') {
                    component.init();
                    console.log(`✅ ${name} component initialized`);
                } else {
                    console.warn(`⚠️ ${name} component missing init method`);
                }
            } catch (error) {
                console.error(`❌ Failed to initialize ${name} component:`, error);
            }
        });
    },

    // Setup global event listeners
    setupGlobalListeners() {
        console.log('🔗 Setting up global listeners...');
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatus(true);
        });

        window.addEventListener('offline', () => {
            this.handleOnlineStatus(false);
        });

        // Handle beforeunload for cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Handle errors
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason);
        });

        // Handle service worker registration (if needed in future)
        this.registerServiceWorker();
    },

    // Start the application
    start() {
        console.log('🎬 Starting application...');
        
        // Apply initial settings
        SETTINGS.applySettings();
        
        // Load initial stream data
        this.loadInitialData();
        
        // Setup auto-refresh if enabled
        this.setupAutoRefresh();
        
        // Show welcome notification
        this.showWelcomeNotification();
        
        // Update UI state
        this.updateAppState();
    },

    // Load initial data
    async loadInitialData() {
        try {
            // Streams are already loaded by StreamManager.init()
            // Additional initial data loading can go here
            
            // Check if we have any streams
            const streams = StreamManager.getStreams();
            if (streams.length === 0) {
                console.warn('⚠️ No streams loaded');
            } else {
                console.log(`📊 Loaded ${streams.length} streams`);
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
        }
    },

    // Setup auto-refresh
    setupAutoRefresh() {
        if (SETTINGS.features.autoRefresh) {
            console.log('🔄 Auto-refresh enabled');
            // StreamManager already handles auto-refresh
        } else {
            console.log('⏸️ Auto-refresh disabled');
        }
    },

    // Handle page visibility change
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        
        if (isVisible) {
            // Page became visible - refresh streams if needed
            if (SETTINGS.features.autoRefresh) {
                StreamManager.refreshStreams();
            }
        } else {
            // Page became hidden - pause player to save resources
            if (PlayerComponent.player && !PlayerComponent.player.paused) {
                // Don't auto-pause, let user decide
                // PlayerComponent.player.pause();
            }
        }
        
        console.log(`👀 Page visibility: ${isVisible ? 'visible' : 'hidden'}`);
    },

    // Handle online/offline status
    handleOnlineStatus(online) {
        if (online) {
            console.log('🌐 App is online');
            this.showNotification('Connection restored', 'success');
            
            // Refresh streams when coming back online
            setTimeout(() => {
                StreamManager.refreshStreams();
            }, 1000);
            
        } else {
            console.warn('📵 App is offline');
            this.showNotification('Connection lost - some features may not work', 'error');
        }
        
        // Update UI to show connection status
        this.updateConnectionStatus(online);
    },

    // Handle global errors
    handleGlobalError(error) {
        console.error('💥 Global error:', error);
        
        // Don't show notification for minor errors
        if (this.shouldIgnoreError(error)) return;
        
        this.showNotification(
            'An unexpected error occurred. The app may not work correctly.', 
            'error'
        );
    },

    // Check if error should be ignored
    shouldIgnoreError(error) {
        // Ignore common non-critical errors
        const ignoredErrors = [
            'NetworkError',
            'AbortError',
            'NotAllowedError'
        ];
        
        return ignoredErrors.some(ignored => 
            error.name?.includes(ignored) || error.message?.includes(ignored)
        );
    },

    // Show fatal error
    showFatalError(error) {
        const errorHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--background-dark);
                color: var(--text-primary);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
                text-align: center;
                font-family: var(--font-family);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
                <h1 style="color: var(--offline-color); margin-bottom: 20px;">
                    Application Error
                </h1>
                <p style="margin-bottom: 30px; max-width: 500px;">
                    The application failed to initialize properly. This may be due to a network issue 
                    or browser compatibility problem.
                </p>
                <div style="
                    background: var(--background-card);
                    padding: 20px;
                    border-radius: var(--border-radius-md);
                    margin-bottom: 30px;
                    max-width: 500px;
                    text-align: left;
                    font-family: monospace;
                    font-size: 12px;
                    overflow: auto;
                ">
                    ${error.toString()}
                </div>
                <button onclick="location.reload()" style="
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: var(--border-radius-md);
                    cursor: pointer;
                    font-size: 16px;
                ">
                    Reload Application
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    },

    // Update connection status in UI
    updateConnectionStatus(online) {
        const connectionIndicator = DOMUtils.get('connection-indicator');
        
        if (!connectionIndicator) {
            // Create connection indicator if it doesn't exist
            const indicator = DOMUtils.create('div', {
                id: 'connection-indicator',
                style: {
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: online ? 'var(--online-color)' : 'var(--offline-color)',
                    zIndex: 'var(--z-tooltip)',
                    border: '2px solid var(--background-dark)'
                },
                title: online ? 'Online' : 'Offline'
            });
            
            document.body.appendChild(indicator);
        } else {
            // Update existing indicator
            indicator.style.background = online ? 'var(--online-color)' : 'var(--offline-color)';
            indicator.title = online ? 'Online' : 'Offline';
        }
    },

    // Update overall app state
    updateAppState() {
        // Update any global state indicators
        this.updateConnectionStatus(navigator.onLine);
        
        // Apply responsive layout
        ResponsiveManager.applyLayout();
    },

    // Show welcome notification
    showWelcomeNotification() {
        // Only show on first visit or after significant updates
        const lastVisit = localStorage.getItem('last_app_visit');
        const currentVersion = '1.0.0';
        const lastVersion = localStorage.getItem('app_version');
        
        if (!lastVisit || lastVersion !== currentVersion) {
            this.showNotification(
                'Welcome to Twitch Streams! Select a stream to start watching.',
                'info',
                5000
            );
            
            localStorage.setItem('last_app_visit', new Date().toISOString());
            localStorage.setItem('app_version', currentVersion);
        }
    },

    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        if (window.HeaderComponent) {
            HeaderComponent.showNotification(message, type, duration);
        } else {
            // Fallback notification
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    },

    // Register service worker (for future PWA features)
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // In a real implementation, you would register a service worker here
                // const registration = await navigator.serviceWorker.register('/sw.js');
                // console.log('🔧 Service Worker registered:', registration);
            } catch (error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            }
        }
    },

    // Cleanup before unload
    cleanup() {
        console.log('🧹 Cleaning up before unload...');
        
        // Stop all streams
        StreamManager.stopStream();
        
        // Clear intervals
        if (StreamManager.refreshInterval) {
            clearInterval(StreamManager.refreshInterval);
        }
        
        // Destroy components
        const components = [
            PlayerComponent,
            StreamManager,
            ResponsiveManager
        ];
        
        components.forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
    },

    // Public API methods for global access
    api: {
        // Refresh streams
        refreshStreams() {
            return StreamManager.refreshStreams();
        },
        
        // Play specific stream
        playStream(streamId) {
            const stream = StreamManager.getStreamById(streamId);
            if (stream) {
                StreamManager.playStream(stream);
            }
        },
        
        // Get app statistics
        getStats() {
            return {
                streams: StreamManager.getStats(),
                shares: ShareUtils.getShareStats(),
                settings: SETTINGS
            };
        },
        
        // Export data
        exportData() {
            if (window.FooterComponent) {
                FooterComponent.exportStreamData();
            }
        },
        
        // Reset settings
        resetSettings() {
            SETTINGS.reset();
            this.showNotification('Settings reset to defaults', 'success');
        }
    }
};

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('💥 Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
});

// Make app globally available
window.TwitchStreamsApp = TwitchStreamsApp;

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TwitchStreamsApp.init();
    });
} else {
    TwitchStreamsApp.init();
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwitchStreamsApp;
}
