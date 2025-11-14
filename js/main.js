// Main Application Entry Point
const TwitchStreamsApp = {
    // Initialize the application
    async init() {
        try {
            console.log('🚀 Initializing Twitch Streams App...');
            
            // Show loading state
            this.showLoadingState();
            
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

    // Show loading state
    showLoadingState() {
        const loadingHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--background-dark);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: var(--text-primary);
                font-family: var(--font-family);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">📺</div>
                <h2 style="margin-bottom: 10px; color: var(--primary-color);">Twitch Streams</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Loading application...</p>
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--text-muted);
                    border-top: 3px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
            </div>
        `;
        
        const loadingElement = DOMUtils.create('div', {
            id: 'app-loading',
            innerHTML: loadingHtml
        });
        
        document.body.appendChild(loadingElement);
    },

    // Hide loading state
    hideLoadingState() {
        const loadingElement = DOMUtils.get('app-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    },

    // Initialize core utilities
    async initializeCore() {
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

        // Handle keyboard shortcuts
        this.setupKeyboardShortcuts();
    },

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when user is typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + R to refresh streams
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                StreamManager.refreshStreams();
                this.showNotification('Refreshing streams...', 'info');
            }

            // Escape to stop current stream
            if (e.key === 'Escape') {
                StreamManager.stopStream();
            }

            // ? to show help
            if (e.key === '?') {
                e.preventDefault();
                if (window.FooterComponent) {
                    FooterComponent.showHelpModal();
                }
            }
        });
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
        
        // Debug: Check what streams were loaded
        setTimeout(() => {
            this.debugStreamData();
        }, 1500);
        
        // Hide loading screen
        setTimeout(() => {
            this.hideLoadingState();
        }, 2000);
    },

    // Debug stream data
    debugStreamData() {
        const streams = StreamManager.getStreams();
        const stats = StreamManager.getStats();
        
        console.log('🔍 DEBUG - Stream Data Analysis:');
        console.log('📊 Stream stats:', stats);
        console.log('📁 Total streams loaded:', streams.length);
        
        if (streams.length === 0) {
            console.error('❌ CRITICAL: No streams loaded!');
            console.log('🔧 Possible issues:');
            console.log('   - M3U8 URL not accessible');
            console.log('   - Network connection problem');
            console.log('   - M3U8 parsing failed');
            console.log('   - CORS issues');
            
            // Show error to user
            this.showNotification(
                'No streams loaded. Check console for details.', 
                'error', 
                5000
            );
        } else {
            console.log('✅ Streams loaded successfully');
            console.log('📺 Stream details:');
            
            streams.forEach((stream, index) => {
                console.log(`   ${index + 1}. ${stream.username}`, {
                    originalName: stream.name,
                    isLive: stream.isLive,
                    viewers: stream.viewers,
                    isExpired: stream.isExpired,
                    status: stream.displayStatus
                });
            });

            // Auto-select first live stream if available
            const liveStreams = streams.filter(s => s.isLive && !s.isExpired);
            if (liveStreams.length > 0 && !StreamManager.getCurrentStream()) {
                console.log('🎯 Auto-selecting first live stream:', liveStreams[0].username);
                StreamManager.playStream(liveStreams[0]);
            } else if (streams.length > 0 && !StreamManager.getCurrentStream()) {
                console.log('🎯 Auto-selecting first stream:', streams[0].username);
                StreamManager.playStream(streams[0]);
            }
        }
        
        // Log M3U8 URL being used
        console.log('🔗 M3U8 Source:', CONSTANTS.M3U8_URL);
    },

    // Load initial data
    async loadInitialData() {
        try {
            // Streams are already loaded by StreamManager.init()
            // Additional initial data loading can go here
            
            // Check if we have any streams
            const streams = StreamManager.getStreams();
            if (streams.length === 0) {
                console.warn('⚠️ No streams loaded - this might be expected if M3U8 file is empty');
            } else {
                console.log(`📊 Loaded ${streams.length} streams`);
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.showNotification('Failed to load stream data', 'error');
        }
    },

    // Setup auto-refresh
    setupAutoRefresh() {
        if (SETTINGS.features.autoRefresh) {
            console.log('🔄 Auto-refresh enabled (30s interval)');
            // StreamManager already handles auto-refresh internally
        } else {
            console.log('⏸️ Auto-refresh disabled');
        }
    },

    // Handle page visibility change
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        
        if (isVisible) {
            // Page became visible - refresh streams if needed
            console.log('👀 Page became visible');
            if (SETTINGS.features.autoRefresh) {
                StreamManager.refreshStreams();
            }
        } else {
            // Page became hidden
            console.log('👻 Page became hidden');
        }
    },

    // Handle online/offline status
    handleOnlineStatus(online) {
        if (online) {
            console.log('🌐 App is online');
            this.showNotification('Connection restored', 'success', 3000);
            
            // Refresh streams when coming back online
            setTimeout(() => {
                StreamManager.refreshStreams();
            }, 1000);
            
        } else {
            console.warn('📵 App is offline');
            this.showNotification('Connection lost - some features may not work', 'error', 5000);
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
            'error',
            5000
        );
    },

    // Check if error should be ignored
    shouldIgnoreError(error) {
        // Ignore common non-critical errors
        const ignoredErrors = [
            'NetworkError',
            'AbortError',
            'NotAllowedError',
            'TypeError' // Some TypeErrors are non-critical
        ];
        
        const shouldIgnore = ignoredErrors.some(ignored => 
            error.name?.includes(ignored) || error.message?.includes(ignored)
        );
        
        if (shouldIgnore) {
            console.log('🔕 Ignoring non-critical error:', error.message);
        }
        
        return shouldIgnore;
    },

    // Show fatal error
    showFatalError(error) {
        // Hide loading screen first
        this.hideLoadingState();
        
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
                    max-height: 200px;
                ">
                    <strong>Error:</strong> ${error.toString()}
                </div>
                <div style="display: flex; gap: 10px;">
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
                    <button onclick="TwitchStreamsApp.showDebugInfo()" style="
                        background: var(--background-light);
                        color: var(--text-primary);
                        border: 1px solid var(--border-color);
                        padding: 12px 24px;
                        border-radius: var(--border-radius-md);
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        Debug Info
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    },

    // Show debug info
    showDebugInfo() {
        const debugInfo = `
            <h3>Debug Information</h3>
            <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
            <p><strong>Online:</strong> ${navigator.onLine}</p>
            <p><strong>Cookies Enabled:</strong> ${navigator.cookieEnabled}</p>
            <p><strong>Local Storage:</strong> ${typeof localStorage !== 'undefined' ? 'Available' : 'Unavailable'}</p>
            <p><strong>Screen:</strong> ${screen.width}x${screen.height}</p>
            <p><strong>Viewport:</strong> ${window.innerWidth}x${window.innerHeight}</p>
            <p><strong>M3U8 URL:</strong> ${CONSTANTS.M3U8_URL}</p>
        `;
        
        alert(debugInfo);
    },

    // Update connection status in UI
    updateConnectionStatus(online) {
        let connectionIndicator = DOMUtils.get('connection-indicator');
        
        if (!connectionIndicator) {
            // Create connection indicator if it doesn't exist
            connectionIndicator = DOMUtils.create('div', {
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
                    border: '2px solid var(--background-dark)',
                    transition: 'background-color 0.3s ease'
                },
                title: online ? 'Online' : 'Offline'
            });
            
            document.body.appendChild(connectionIndicator);
        } else {
            // Update existing indicator
            connectionIndicator.style.background = online ? 'var(--online-color)' : 'var(--offline-color)';
            connectionIndicator.title = online ? 'Online' : 'Offline';
        }
    },

    // Update overall app state
    updateAppState() {
        // Update any global state indicators
        this.updateConnectionStatus(navigator.onLine);
        
        // Apply responsive layout
        ResponsiveManager.applyLayout();
        
        // Update component layouts if needed
        if (window.HeaderComponent) {
            HeaderComponent.updateLayout();
        }
        if (window.SocialShareComponent) {
            SocialShareComponent.updateLayout();
        }
        if (window.FooterComponent) {
            FooterComponent.updateLayout();
        }
    },

    // Show welcome notification
    showWelcomeNotification() {
        // Only show on first visit or after significant updates
        const lastVisit = localStorage.getItem('last_app_visit');
        const currentVersion = '1.0.0';
        const lastVersion = localStorage.getItem('app_version');
        
        if (!lastVisit || lastVersion !== currentVersion) {
            this.showNotification(
                'Welcome to Twitch Streams! Select a stream from the list to start watching.',
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
            
            // Simple fallback alert for critical errors
            if (type === 'error') {
                alert(`Error: ${message}`);
            }
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
                settings: SETTINGS,
                responsive: ResponsiveManager.getBreakpointInfo()
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
        },
        
        // Debug info
        debug() {
            const streams = StreamManager.getStreams();
            console.log('🔧 DEBUG INFO:');
            console.log('📊 Streams:', streams);
            console.log('⚙️ Settings:', SETTINGS);
            console.log('📱 Responsive:', ResponsiveManager.getBreakpointInfo());
            return {
                streams: streams,
                settings: SETTINGS,
                responsive: ResponsiveManager.getBreakpointInfo()
            };
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
        console.log('📄 DOM loaded, initializing app...');
        TwitchStreamsApp.init();
    });
} else {
    console.log('📄 DOM already loaded, initializing app...');
    TwitchStreamsApp.init();
}

// Add CSS for loading animation
const loadingStyles = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwitchStreamsApp;
}
