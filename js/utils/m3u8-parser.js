// M3U8 Parser Utility - UPDATED FIX
const M3U8Parser = {
    // Parse M3U8 content and extract stream information - FIXED
    parse(m3u8Content) {
        const streams = [];
        const lines = m3u8Content.split('\n');
        let currentStream = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('#EXTINF:')) {
                currentStream = this.parseExtinf(line);
            } else if (line.startsWith('https://') && currentStream) {
                currentStream.url = line;
                currentStream.id = this.generateStreamId(currentStream);
                
                // Fix: Check if URL is expired and handle accordingly
                if (this.isUrlExpired(currentStream.url)) {
                    currentStream.isExpired = true;
                    currentStream.displayStatus = 'Expired';
                }
                
                streams.push(currentStream);
                currentStream = null;
            }
        }

        return streams;
    },

    // Parse EXTINF line to extract stream metadata - IMPROVED
    parseExtinf(extinfLine) {
        const stream = {
            name: '',
            status: CONSTANTS.STREAM_STATUS.UNKNOWN,
            viewers: 0,
            displayStatus: 'Offline',
            isLive: false,
            url: '',
            isExpired: false
        };

        try {
            // Remove #EXTINF: prefix
            const content = extinfLine.replace('#EXTINF:', '').trim();
            
            // Extract the main content after duration
            const commaIndex = content.indexOf(',');
            if (commaIndex !== -1) {
                const streamInfo = content.slice(commaIndex + 1).trim();
                stream.name = streamInfo;
                
                // Parse status and viewers more robustly
                this.parseStreamMetadata(stream, streamInfo);
            } else {
                stream.name = content;
            }

        } catch (error) {
            console.error('Error parsing EXTINF line:', error, extinfLine);
            // Fallback: extract basic name
            const nameMatch = extinfLine.match(/,(.+)$/);
            if (nameMatch) {
                stream.name = nameMatch[1].trim();
            }
        }

        return stream;
    },

    // Improved metadata parsing
    parseStreamMetadata(stream, streamInfo) {
        // Extract LIVE/OFFLINE status
        if (streamInfo.includes('[LIVE]')) {
            stream.status = CONSTANTS.STREAM_STATUS.LIVE;
            stream.isLive = true;
            stream.displayStatus = 'Live';
        } else if (streamInfo.includes('[OFFLINE]')) {
            stream.status = CONSTANTS.STREAM_STATUS.OFFLINE;
            stream.isLive = false;
            stream.displayStatus = 'Offline';
        }

        // Extract viewer count
        const viewersMatch = streamInfo.match(/(\d+)\s*viewers/);
        if (viewersMatch) {
            stream.viewers = parseInt(viewersMatch[1]);
        }

        // Extract additional metadata
        const statusMatch = streamInfo.match(/\[(.*?)\]/g);
        if (statusMatch) {
            statusMatch.forEach(match => {
                const content = match.slice(1, -1);
                if (content.includes('LIVE') && !stream.isLive) {
                    stream.isLive = true;
                    stream.displayStatus = 'Live';
                } else if (content.includes('OFFLINE') && stream.isLive) {
                    stream.isLive = false;
                    stream.displayStatus = 'Offline';
                }
            });
        }
    },

    // Generate unique ID for stream
    generateStreamId(stream) {
        return btoa(stream.name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    },

    // Extract username from stream name - IMPROVED
    extractUsername(streamName) {
        // Remove metadata brackets and extract username
        const cleanName = streamName.replace(/\s*\[.*?\]\s*/g, '').trim();
        
        // Extract username (first part before any metadata)
        const usernameMatch = cleanName.match(/^([^\s-]+)/);
        return usernameMatch ? usernameMatch[1] : cleanName;
    },

    // Check if stream URL is expired - IMPROVED
    isUrlExpired(url) {
        try {
            const token = this.parseToken(url);
            if (token && token.expires) {
                const now = Math.floor(Date.now() / 1000);
                // Consider URL expired if within 5 minutes of expiration
                return now >= (token.expires - 300);
            }
        } catch (error) {
            console.warn('Error checking URL expiration:', error);
        }
        return false;
    },

    // Format stream data for display - IMPROVED
    formatStreamForDisplay(stream) {
        const username = this.extractUsername(stream.name);
        
        return {
            ...stream,
            username: username,
            displayName: username,
            game: this.extractGame(stream.name),
            thumbnail: this.generateThumbnailUrl(username),
            chatUrl: this.generateChatUrl(username),
            shareUrl: this.generateShareUrl(username),
            isExpired: this.isUrlExpired(stream.url),
            // Add fallback for display
            safeName: this.escapeHtml(username)
        };
    },

    // Escape HTML for safe display
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Rest of the methods remain the same...
    // ... (keep all other existing methods)
};
