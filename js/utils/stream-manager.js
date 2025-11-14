// Stream Manager - DEBUG VERSION
const StreamManager = {
    streams: [],
    currentStream: null,
    refreshInterval: null,
    listeners: {},

    // Initialize stream manager
    async init() {
        console.log('🚀 StreamManager init started');
        try {
            await this.loadStreams();
            this.setupAutoRefresh();
            this.loadCurrentStream();
            
            // Check for expired streams on init
            this.checkExpiredStreams();
            
            console.log('✅ StreamManager init completed');
        } catch (error) {
            console.error('❌ StreamManager init failed:', error);
            // Create test streams if loading fails
            this.createFallbackStreams();
        }
    },

    // Load streams from M3U8 URL
    async loadStreams(forceRefresh = false) {
        console.log('📥 Loading streams, forceRefresh:', forceRefresh);
        
        try {
            DOMUtils.addClass(DOMUtils.get('stream-list-container'), CONSTANTS.CLASS_NAMES.LOADING);
            
            console.log('🔗 Fetching M3U8 from:', CONSTANTS.M3U8_URL);
            const response = await fetch(CONSTANTS.M3U8_URL + '?t=' + (forceRefresh ? Date.now() : ''));
            
            console.log('📡 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const m3u8Content = await response.text();
            console.log('✅ M3U8 content received, length:', m3u8Content.length);
            
            const parsedStreams = M3U8Parser.parse(m3u8Content);
            console.log('📊 Parsed streams:', parsedStreams.length);
            
            this.streams = parsedStreams.map(stream => 
                M3U8Parser.formatStreamForDisplay(stream)
            );
            
            console.log('🎯 Final streams array:', this.streams);
            
            this.saveToStorage();
            this.notifyListeners('streamsUpdated', this.streams);
            
        } catch (error) {
            console.error('❌ Failed to load streams:', error);
            this.loadFromStorage(); // Fallback to cached data
            
            // If still no streams, create fallback
            if (this.streams.length === 0) {
                this.createFallbackStreams();
            }
            
            this.notifyListeners('streamsError', error);
        } finally {
            DOMUtils.removeClass(DOMUtils.get('stream-list-container'), CONSTANTS.CLASS_NAMES.LOADING);
        }
    },

    // Create fallback streams if everything fails
    createFallbackStreams() {
        console.log('🛠️ Creating fallback test streams');
        this.streams = M3U8Parser.createTestStreams();
        this.saveToStorage();
        this.notifyListeners('streamsUpdated', this.streams);
        
        // Show notification about fallback
        if (window.HeaderComponent) {
            HeaderComponent.showNotification(
                'Using test streams - check console for M3U8 loading issues',
                'error',
                5000
            );
        }
    },

    // Get all streams
    getStreams(filters = {}) {
        console.log('🔍 Getting streams with filters:', filters);
        let filteredStreams = this.streams;
        
        if (filters.status) {
            filteredStreams = filteredStreams.filter(stream => 
                filters.status === 'live' ? stream.isLive : !stream.isLive
            );
        }
        
        if (filters.search) {
            filteredStreams = filteredStreams.filter(stream =>
                stream.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                stream.game.toLowerCase().includes(filters.search.toLowerCase())
            );
        }
        
        const sortedStreams = M3U8Parser.sortStreams(
            filteredStreams, 
            SETTINGS.streamList.sortBy, 
            SETTINGS.streamList.sortOrder
        );
        
        console.log('📋 Filtered streams:', sortedStreams.length);
        return sortedStreams;
    },

    // Rest of the methods remain mostly the same but with added logging...
    getStreamById(streamId) {
        const stream = this.streams.find(stream => stream.id === streamId);
        console.log('🔍 Getting stream by ID:', streamId, 'found:', !!stream);
        return stream;
    },

    setCurrentStream(stream) {
        console.log('🎯 Setting current stream:', stream?.username);
        if (this.currentStream?.id === stream?.id) return;
        
        this.currentStream = stream;
        this.saveCurrentStream();
        this.notifyListeners('streamChanged', stream);
        
        if (stream) {
            this.updatePageTitle(stream);
            this.updateSocialShare(stream);
        }
    },

    // ... (keep all other methods but add console logs to key ones)

    // Get stream statistics
    getStats() {
        const liveStreams = this.streams.filter(stream => stream.isLive && !stream.isExpired);
        const expiredStreams = this.streams.filter(stream => stream.isExpired);
        const totalViewers = liveStreams.reduce((sum, stream) => sum + stream.viewers, 0);
        
        const stats = {
            total: this.streams.length,
            live: liveStreams.length,
            offline: this.streams.length - liveStreams.length - expiredStreams.length,
            expired: expiredStreams.length,
            totalViewers: totalViewers
        };
        
        console.log('📊 Stream stats:', stats);
        return stats;
    }
};
