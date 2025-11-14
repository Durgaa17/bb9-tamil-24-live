// Application Settings and Configuration
const SETTINGS = {
    // Feature Flags
    features: {
        autoRefresh: true,
        chatEnabled: true,
        socialShare: true,
        streamFilter: true,
        offlineStreams: false
    },
    
    // Player Settings
    player: {
        autoplay: true,
        muted: false,
        volume: CONSTANTS.DEFAULTS.VOLUME,
        quality: 'auto',
        controls: true,
        loop: false
    },
    
    // Chat Settings
    chat: {
        visible: CONSTANTS.DEFAULTS.CHAT_VISIBLE,
        theme: 'dark',
        fontSize: 'normal',
        showTimestamps: true,
        showBadges: true
    },
    
    // Stream List Settings
    streamList: {
        sortBy: 'viewers', // 'viewers', 'name', 'status'
        sortOrder: 'desc', // 'asc', 'desc'
        itemsPerPage: 50,
        showThumbnails: true,
        showViewerCount: true
    },
    
    // Social Share Settings
    socialShare: {
        includeThumbnail: true,
        customMessage: 'Check out this Twitch stream!',
        shortenUrl: false
    },
    
    // UI Settings
    ui: {
        theme: 'dark',
        compactMode: false,
        animations: true,
        focusHighlight: true // for Android TV
    },
    
    // Initialize settings from localStorage or use defaults
    init() {
        this.loadFromStorage();
        this.applySettings();
    },
    
    // Load settings from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('twitch_app_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this, parsed);
            }
        } catch (error) {
            console.warn('Failed to load settings from storage:', error);
        }
    },
    
    // Save settings to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('twitch_app_settings', JSON.stringify(this));
        } catch (error) {
            console.warn('Failed to save settings to storage:', error);
        }
    },
    
    // Apply current settings to the app
    applySettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.ui.theme);
        
        // Apply animations preference
        if (!this.ui.animations) {
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-normal', '0s');
            document.documentElement.style.setProperty('--transition-slow', '0s');
        }
        
        // Apply focus highlights for TV
        if (!this.ui.focusHighlight) {
            document.documentElement.classList.add('no-focus-outline');
        }
    },
    
    // Update a specific setting
    update(settingPath, value) {
        const keys = settingPath.split('.');
        let current = this;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveToStorage();
        this.applySettings();
    },
    
    // Reset to defaults
    reset() {
        const defaults = {
            features: {
                autoRefresh: true,
                chatEnabled: true,
                socialShare: true,
                streamFilter: true,
                offlineStreams: false
            },
            player: {
                autoplay: true,
                muted: false,
                volume: CONSTANTS.DEFAULTS.VOLUME,
                quality: 'auto',
                controls: true,
                loop: false
            },
            chat: {
                visible: CONSTANTS.DEFAULTS.CHAT_VISIBLE,
                theme: 'dark',
                fontSize: 'normal',
                showTimestamps: true,
                showBadges: true
            },
            streamList: {
                sortBy: 'viewers',
                sortOrder: 'desc',
                itemsPerPage: 50,
                showThumbnails: true,
                showViewerCount: true
            },
            socialShare: {
                includeThumbnail: true,
                customMessage: 'Check out this Twitch stream!',
                shortenUrl: false
            },
            ui: {
                theme: 'dark',
                compactMode: false,
                animations: true,
                focusHighlight: true
            }
        };
        
        Object.assign(this, defaults);
        this.saveToStorage();
        this.applySettings();
    }
};

// Initialize settings when script loads
SETTINGS.init();
