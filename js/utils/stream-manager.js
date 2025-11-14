// Stream Manager with Storage Fix
const StreamManager = {
    streams: [],
    currentStream: null,
    listeners: {},
    isInitialized: false,

    // Initialize with storage support
    init() {
        console.log('🔄 StreamManager initializing...');
        
        // Load saved streams from storage
        this.loadFromStorage();
        
        // Set up auto-save
        this.setupAutoSave();
        
        this.isInitialized = true;
        console.log('✅ StreamManager initialized');
    },

    // Load streams from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('twitch_streams_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.streams = data.streams || [];
                this.currentStream = data.currentStream || null;
                console.log('💾 Loaded streams from storage:', this.streams.length);
            }
        } catch (error) {
            console.warn('❌ Failed to load from storage:', error);
        }
    },

    // Save streams to localStorage
    saveToStorage() {
        try {
            const data = {
                streams: this.streams,
                currentStream: this.currentStream,
                timestamp: Date.now()
            };
            localStorage.setItem('twitch_streams_data', JSON.stringify(data));
            console.log('💾 Saved streams to storage');
        } catch (error) {
            console.warn('❌ Failed to save to storage:', error);
        }
    },

    // Set up auto-save on changes
    setupAutoSave() {
        // Auto-save when streams update
        this.on('streamsUpdated', () => {
            setTimeout(() => this.saveToStorage(), 100);
        });
        
        // Auto-save when stream changes
        this.on('streamChanged', () => {
            setTimeout(() => this.saveToStorage(), 100);
        });
    },

    // Parse M3U8 and update streams
    async parseM3U8(m3u8Content) {
        console.log('📥 Parsing M3U8 content...');
        
        try {
            const parsedStreams = M3U8Parser.parse(m3u8Content);
            console.log('📊 Raw parsed streams:', parsedStreams.length);
            
            // Format streams for display
            this.streams = parsedStreams.map(stream => 
                M3U8Parser.formatStreamForDisplay(stream)
            );
            
            console.log('🎯 Formatted streams:', this.streams.length);
            
            // Notify listeners
            this.notifyListeners('streamsUpdated', this.streams);
            
            // Auto-play first live stream if none is playing
            if (!this.currentStream && this.streams.length > 0) {
                const firstLiveStream = this.streams.find(stream => stream.isLive);
                if (firstLiveStream) {
                    this.playStream(firstLiveStream);
                }
            }
            
            return this.streams;
            
        } catch (error) {
            console.error('❌ M3U8 parsing failed:', error);
            
            // Fallback to test streams
            console.log('🔄 Falling back to test streams...');
            this.streams = M3U8Parser.createTestStreams();
            this.notifyListeners('streamsUpdated', this.streams);
            
            return this.streams;
        }
    },

    // Play a specific stream
    playStream(stream) {
        console.log('🎬 Playing stream:', stream.username);
        
        this.currentStream = stream;
        
        // Notify listeners
        this.notifyListeners('streamChanged', stream);
        this.notifyListeners('streamsUpdated', this.streams);
        
        // Update URL without page reload
        this.updateUrl(stream.username);
    },

    // Refresh streams from source
    async refreshStreams() {
        console.log('🔄 Refreshing streams...');
        
        try {
            const M3U8_URL = 'https://raw.githubusercontent.com/Durgaa17/twitch-finder/refs/heads/main/output/twitch_all.m3u8';
            const response = await fetch(M3U8_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const m3u8Content = await response.text();
            await this.parseM3U8(m3u8Content);
            
            console.log('✅ Streams refreshed successfully');
            
        } catch (error) {
            console.error('❌ Stream refresh failed:', error);
            
            // Notify error
            this.notifyListeners('streamsError', error.message);
        }
    },

    // Get live streams only
    getLiveStreams() {
        return this.streams.filter(stream => stream.isLive && !stream.isExpired);
    },

    // Get streams by game
    getStreamsByGame(game) {
        return this.streams.filter(stream => 
            stream.game.toLowerCase().includes(game.toLowerCase())
        );
    },

    // Search streams
    searchStreams(query) {
        if (!query) return this.streams;
        
        return this.streams.filter(stream =>
            stream.username.toLowerCase().includes(query.toLowerCase()) ||
            stream.displayName.toLowerCase().includes(query.toLowerCase()) ||
            stream.game.toLowerCase().includes(query.toLowerCase())
        );
    },

    // Update URL
    updateUrl(username) {
        const newUrl = `${window.location.pathname}?stream=${encodeURIComponent(username)}`;
        window.history.replaceState({}, '', newUrl);
    },

    // Event listener system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    // Notify listeners
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in ${event} listener:`, error);
                }
            });
        }
    },

    // Get stream by username
    getStreamByUsername(username) {
        return this.streams.find(stream => 
            stream.username.toLowerCase() === username.toLowerCase()
        );
    },

    // Get current stream info
    getCurrentStream() {
        return this.currentStream;
    },

    // Get all streams
    getAllStreams() {
        return this.streams;
    },

    // Clear all data
    clearData() {
        this.streams = [];
        this.currentStream = null;
        localStorage.removeItem('twitch_streams_data');
        this.notifyListeners('streamsUpdated', []);
        console.log('🗑️ All data cleared');
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.StreamManager = StreamManager;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            StreamManager.init();
        });
    } else {
        StreamManager.init();
    }
}
