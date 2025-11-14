// Stream Manager - Handles stream data and state
const StreamManager = {
    streams: [],
    currentStream: null,
    refreshInterval: null,
    listeners: {},

    // Initialize stream manager
    async init() {
        await this.loadStreams();
        this.setupAutoRefresh();
        this.loadCurrentStream();
    },

    // Load streams from M3U8 URL
    async loadStreams(forceRefresh = false) {
        try {
            DOMUtils.addClass(DOMUtils.get('stream-list-container'), CONSTANTS.CLASS_NAMES.LOADING);
            
            const response = await fetch(CONSTANTS.M3U8_URL + '?t=' + (forceRefresh ? Date.now() : ''));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const m3u8Content = await response.text();
            const parsedStreams = M3U8Parser.parse(m3u8Content);
            
            this.streams = parsedStreams.map(stream => 
                M3U8Parser.formatStreamForDisplay(stream)
            );
            
            this.saveToStorage();
            this.notifyListeners('streamsUpdated', this.streams);
            
        } catch (error) {
            console.error('Failed to load streams:', error);
            this.loadFromStorage(); // Fallback to cached data
            this.notifyListeners('streamsError', error);
        } finally {
            DOMUtils.removeClass(DOMUtils.get('stream-list-container'), CONSTANTS.CLASS_NAMES.LOADING);
        }
    },

    // Get all streams
    getStreams(filters = {}) {
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
        
        return M3U8Parser.sortStreams(
            filteredStreams, 
            SETTINGS.streamList.sortBy, 
            SETTINGS.streamList.sortOrder
        );
    },

    // Get stream by ID
    getStreamById(streamId) {
        return this.streams.find(stream => stream.id === streamId);
    },

    // Get stream by username
    getStreamByUsername(username) {
        return this.streams.find(stream => 
            stream.username.toLowerCase() === username.toLowerCase()
        );
    },

    // Set current stream
    setCurrentStream(stream) {
        if (this.currentStream?.id === stream?.id) return;
        
        this.currentStream = stream;
        this.saveCurrentStream();
        this.notifyListeners('streamChanged', stream);
        
        if (stream) {
            this.updatePageTitle(stream);
            this.updateSocialShare(stream);
        }
    },

    // Get current stream
    getCurrentStream() {
        return this.currentStream;
    },

    // Play a stream
    playStream(stream) {
        if (!stream || !stream.url) {
            console.error('Invalid stream or URL');
            return;
        }
        
        this.setCurrentStream(stream);
        this.notifyListeners('playStream', stream);
    },

    // Stop current stream
    stopStream() {
        this.notifyListeners('stopStream');
        this.setCurrentStream(null);
        this.updatePageTitle();
    },

    // Refresh stream data
    async refreshStreams() {
        await this.loadStreams(true);
    },

    // Setup auto-refresh
    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (SETTINGS.features.autoRefresh) {
            this.refreshInterval = setInterval(() => {
                this.refreshStreams();
            }, CONSTANTS.DEFAULTS.REFRESH_INTERVAL);
        }
    },

    // Update page title with current stream
    updatePageTitle(stream = null) {
        if (stream) {
            document.title = `${stream.username} - Twitch Streams`;
        } else {
            document.title = 'Twitch Streams';
        }
    },

    // Update social share data
    updateSocialShare(stream) {
        if (stream) {
            this.notifyListeners('socialShareUpdate', stream);
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

    // Storage management
    saveToStorage() {
        try {
            const data = {
                streams: this.streams,
                timestamp: Date.now()
            };
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.STREAMS_DATA, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save streams to storage:', error);
        }
    },

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.STREAMS_DATA);
            if (stored) {
                const data = JSON.parse(stored);
                // Use cached data if it's less than 5 minutes old
                if (Date.now() - data.timestamp < 5 * 60 * 1000) {
                    this.streams = data.streams;
                    this.notifyListeners('streamsUpdated', this.streams);
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load streams from storage:', error);
        }
        return false;
    },

    saveCurrentStream() {
        try {
            if (this.currentStream) {
                localStorage.setItem(
                    CONSTANTS.STORAGE_KEYS.SELECTED_STREAM, 
                    JSON.stringify(this.currentStream)
                );
            } else {
                localStorage.removeItem(CONSTANTS.STORAGE_KEYS.SELECTED_STREAM);
            }
        } catch (error) {
            console.warn('Failed to save current stream:', error);
        }
    },

    loadCurrentStream() {
        try {
            const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SELECTED_STREAM);
            if (stored) {
                const stream = JSON.parse(stored);
                // Verify the stream still exists in our list
                const currentStream = this.getStreamById(stream.id);
                if (currentStream) {
                    this.setCurrentStream(currentStream);
                }
            }
        } catch (error) {
            console.warn('Failed to load current stream:', error);
        }
    },

    // Get stream statistics
    getStats() {
        const liveStreams = this.streams.filter(stream => stream.isLive);
        const totalViewers = liveStreams.reduce((sum, stream) => sum + stream.viewers, 0);
        
        return {
            total: this.streams.length,
            live: liveStreams.length,
            offline: this.streams.length - liveStreams.length,
            totalViewers: totalViewers
        };
    },

    // Cleanup
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.listeners = {};
    }
};
