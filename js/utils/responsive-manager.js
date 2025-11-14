// Responsive Layout Manager
const ResponsiveManager = {
    currentBreakpoint: null,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTV: false,
    orientation: 'landscape',
    listeners: {},

    // Initialize responsive manager
    init() {
        this.detectBreakpoint();
        this.detectOrientation();
        
        // Set up event listeners
        window.addEventListener('resize', DOMUtils.debounce(() => {
            this.handleResize();
        }, 250));
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
        
        // Initial layout setup
        this.applyLayout();
    },

    // Detect current breakpoint
    detectBreakpoint() {
        const width = window.innerWidth;
        const oldBreakpoint = this.currentBreakpoint;

        if (width < CONSTANTS.BREAKPOINTS.MOBILE) {
            this.currentBreakpoint = 'mobile';
            this.isMobile = true;
            this.isTablet = false;
            this.isDesktop = false;
            this.isTV = false;
        } else if (width < CONSTANTS.BREAKPOINTS.TABLET) {
            this.currentBreakpoint = 'tablet';
            this.isMobile = false;
            this.isTablet = true;
            this.isDesktop = false;
            this.isTV = false;
        } else if (width < CONSTANTS.BREAKPOINTS.TV) {
            this.currentBreakpoint = 'desktop';
            this.isMobile = false;
            this.isTablet = false;
            this.isDesktop = true;
            this.isTV = false;
        } else {
            this.currentBreakpoint = 'tv';
            this.isMobile = false;
            this.isTablet = false;
            this.isDesktop = false;
            this.isTV = true;
        }

        // Notify if breakpoint changed
        if (oldBreakpoint !== this.currentBreakpoint) {
            this.notifyListeners('breakpointChanged', this.currentBreakpoint);
        }
    },

    // Detect device orientation
    detectOrientation() {
        const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        
        if (this.orientation !== newOrientation) {
            this.orientation = newOrientation;
            this.notifyListeners('orientationChanged', newOrientation);
        }
    },

    // Handle window resize
    handleResize() {
        this.detectBreakpoint();
        this.detectOrientation();
        this.applyLayout();
    },

    // Apply responsive layout changes
    applyLayout() {
        const body = document.body;
        
        // Remove all breakpoint classes
        body.classList.remove('layout-mobile', 'layout-tablet', 'layout-desktop', 'layout-tv');
        
        // Add current breakpoint class
        body.classList.add(`layout-${this.currentBreakpoint}`);
        
        // Add orientation class
        body.classList.remove('orientation-portrait', 'orientation-landscape');
        body.classList.add(`orientation-${this.orientation}`);
        
        // Apply specific layout adjustments
        this.adjustPlayerLayout();
        this.adjustChatLayout();
        this.adjustStreamListLayout();
        
        this.notifyListeners('layoutApplied', this.currentBreakpoint);
    },

    // Adjust player layout based on screen size
    adjustPlayerLayout() {
        const playerContainer = DOMUtils.get('player-container');
        if (!playerContainer) return;

        if (this.isMobile) {
            DOMUtils.setStyles(playerContainer, {
                maxHeight: '250px'
            });
        } else if (this.isTV) {
            DOMUtils.setStyles(playerContainer, {
                maxHeight: '600px'
            });
        } else {
            DOMUtils.setStyles(playerContainer, {
                maxHeight: '400px'
            });
        }
    },

    // Adjust chat layout
    adjustChatLayout() {
        const chatContainer = DOMUtils.get('chat-container');
        if (!chatContainer) return;

        if (this.isMobile) {
            DOMUtils.setStyles(chatContainer, {
                height: '300px'
            });
        } else if (this.isTV) {
            DOMUtils.setStyles(chatContainer, {
                height: '400px'
            });
        } else {
            DOMUtils.setStyles(chatContainer, {
                height: '500px'
            });
        }
    },

    // Adjust stream list layout
    adjustStreamListLayout() {
        const streamList = DOMUtils.get('stream-list-container');
        if (!streamList) return;

        if (this.isMobile) {
            DOMUtils.setStyles(streamList, {
                maxHeight: '200px'
            });
        } else if (this.isTV) {
            DOMUtils.setStyles(streamList, {
                maxHeight: '300px'
            });
        } else {
            DOMUtils.setStyles(streamList, {
                maxHeight: '400px'
            });
        }
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Scroll element into view with offset for fixed headers
    scrollToElement(element, offset = 80) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    // Enable/disable smooth scrolling based on performance
    toggleSmoothScrolling(enable) {
        document.documentElement.style.scrollBehavior = enable ? 'smooth' : 'auto';
    },

    // Handle touch device detection
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // Get safe area insets for mobile devices
    getSafeAreaInsets() {
        const style = getComputedStyle(document.documentElement);
        
        return {
            top: parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0,
            right: parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0,
            bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
            left: parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0
        };
    },

    // Apply safe area padding to element
    applySafeArea(element) {
        if (!this.isMobile) return;
        
        const insets = this.getSafeAreaInsets();
        DOMUtils.setStyles(element, {
            paddingTop: `calc(var(--space-lg) + ${insets.top}px)`,
            paddingBottom: `calc(var(--space-lg) + ${insets.bottom}px)`,
            paddingLeft: `calc(var(--space-lg) + ${insets.left}px)`,
            paddingRight: `calc(var(--space-lg) + ${insets.right}px)`
        });
    },

    // Lock body scroll (for modals, etc.)
    lockBodyScroll(lock = true) {
        if (lock) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    },

    // Event listener management
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    },

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    },

    // Get current breakpoint information
    getBreakpointInfo() {
        return {
            breakpoint: this.currentBreakpoint,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: this.isDesktop,
            isTV: this.isTV,
            orientation: this.orientation,
            width: window.innerWidth,
            height: window.innerHeight
        };
    },

    // Check if current device is Android TV
    isAndroidTV() {
        return this.isTV || 
               navigator.userAgent.includes('Android TV') ||
               navigator.userAgent.includes('AFT');
    },

    // Cleanup
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);
        this.listeners = {};
    }
};
