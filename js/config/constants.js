// Application Constants
const CONSTANTS = {
    // M3U8 Source
    M3U8_URL: 'https://raw.githubusercontent.com/Durgaa17/twitch-finder/refs/heads/main/output/twitch_all.m3u8',
    
    // Stream Status
    STREAM_STATUS: {
        LIVE: 'LIVE',
        OFFLINE: 'OFFLINE',
        UNKNOWN: 'UNKNOWN'
    },
    
    // Social Media Platforms
    SOCIAL_PLATFORMS: {
        FACEBOOK: 'facebook',
        WHATSAPP: 'whatsapp',
        TELEGRAM: 'telegram',
        TWITTER: 'twitter',
        TIKTOK: 'tiktok',
        REDDIT: 'reddit'
    },
    
    // CSS Classes
    CLASS_NAMES: {
        ACTIVE: 'active',
        LOADING: 'loading',
        HIDDEN: 'd-none',
        LIVE: 'live',
        OFFLINE: 'offline'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        STREAMS_DATA: 'twitch_streams_data',
        SELECTED_STREAM: 'selected_stream',
        CHAT_VISIBILITY: 'chat_visibility'
    },
    
    // API Endpoints (if needed later)
    API: {
        TWITCH_CHAT: 'https://twitch.tv/embed/chat/',
        STREAM_INFO: 'https://api.twitch.tv/helix/streams'
    },
    
    // Default Settings
    DEFAULTS: {
        VOLUME: 0.8,
        CHAT_VISIBLE: true,
        AUTO_REFRESH: true,
        REFRESH_INTERVAL: 30000 // 30 seconds
    },
    
    // Breakpoints for responsive design
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1200,
        TV: 1920
    }
};
