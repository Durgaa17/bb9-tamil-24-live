// M3U8 Parser Utility - FIXED STREAM PARSING
const M3U8Parser = {
    // Parse M3U8 content and extract stream information - COMPLETELY REWRITTEN
    parse(m3u8Content) {
        const streams = [];
        const lines = m3u8Content.split('\n');
        let currentStream = null;

        console.log('📋 Parsing M3U8 content...');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('#EXTINF:')) {
                currentStream = this.parseExtinf(line);
                console.log('📺 Found stream:', currentStream);
            } else if (line.startsWith('https://') && currentStream) {
                currentStream.url = line;
                currentStream.id = this.generateStreamId(currentStream);
                
                // Check if URL is expired
                currentStream.isExpired = this.isUrlExpired(currentStream.url);
                
                streams.push(currentStream);
                currentStream = null;
            }
        }

        console.log(`✅ Parsed ${streams.length} streams`);
        return streams;
    },

    // Parse EXTINF line to extract stream metadata - IMPROVED PARSING
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
            // Example line: #EXTINF:-1,arivumani1075 [LIVE] - 0 viewers - Offline
            const content = extinfLine.replace('#EXTINF:', '').trim();
            
            // Find the comma that separates duration from stream info
            const commaIndex = content.indexOf(',');
            if (commaIndex !== -1) {
                const streamInfo = content.slice(commaIndex + 1).trim();
                stream.name = streamInfo;
                
                // Parse stream metadata using multiple methods
                this.parseAllMetadata(stream, streamInfo);
            } else {
                stream.name = content;
            }

        } catch (error) {
            console.error('Error parsing EXTINF line:', error);
            // Fallback: extract basic name
            const nameMatch = extinfLine.match(/,(.+)$/);
            if (nameMatch) {
                stream.name = nameMatch[1].trim();
            }
        }

        return stream;
    },

    // Parse all metadata from stream info
    parseAllMetadata(stream, streamInfo) {
        console.log('🔍 Parsing metadata from:', streamInfo);
        
        // Method 1: Check for [LIVE] tag
        if (streamInfo.includes('[LIVE]')) {
            stream.isLive = true;
            stream.displayStatus = 'Live';
            stream.status = CONSTANTS.STREAM_STATUS.LIVE;
            console.log('🎯 Detected LIVE stream');
        }
        
        // Method 2: Check for viewers count
        const viewersMatch = streamInfo.match(/(\d+)\s*viewers/i);
        if (viewersMatch) {
            stream.viewers = parseInt(viewersMatch[1]);
            console.log('👥 Viewers:', stream.viewers);
        }
        
        // Method 3: Check for offline status
        if (streamInfo.includes('Offline') && !streamInfo.includes('[LIVE]')) {
            stream.isLive = false;
            stream.displayStatus = 'Offline';
            stream.status = CONSTANTS.STREAM_STATUS.OFFLINE;
            console.log('💤 Detected OFFLINE stream');
        }
        
        // Method 4: Check brackets for any status
        const bracketMatches = streamInfo.match(/\[(.*?)\]/g);
        if (bracketMatches) {
            bracketMatches.forEach(match => {
                const bracketContent = match.slice(1, -1);
                console.log('📌 Bracket content:', bracketContent);
                
                if (bracketContent === 'LIVE' && !stream.isLive) {
                    stream.isLive = true;
                    stream.displayStatus = 'Live';
                    stream.status = CONSTANTS.STREAM_STATUS.LIVE;
                }
            });
        }
        
        // Method 5: Final fallback - if no explicit offline, assume live if viewers > 0
        if (!streamInfo.includes('Offline') && stream.viewers > 0 && !stream.isLive) {
            stream.isLive = true;
            stream.displayStatus = 'Live';
            stream.status = CONSTANTS.STREAM_STATUS.LIVE;
            console.log('🔄 Fallback: Assuming live due to viewers');
        }
        
        console.log('📊 Final stream status:', {
            name: stream.name,
            isLive: stream.isLive,
            viewers: stream.viewers,
            status: stream.displayStatus
        });
    },

    // Generate unique ID for stream
    generateStreamId(stream) {
        return btoa(stream.name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    },

    // Extract username from stream name - IMPROVED
    extractUsername(streamName) {
        if (!streamName) return 'Unknown';
        
        // Remove metadata brackets and extract username
        let cleanName = streamName.replace(/\s*\[.*?\]\s*/g, '').trim();
        
        // Remove " - 0 viewers - Offline" type suffixes
        cleanName = cleanName.replace(/\s*-\s*\d+\s*viewers\s*-\s*Offline/gi, '');
        cleanName = cleanName.replace(/\s*-\s*\d+\s*viewers/gi, '');
        cleanName = cleanName.replace(/\s*-\s*Offline/gi, '');
        
        // Extract username (first word)
        const usernameMatch = cleanName.match(/^([^\s]+)/);
        const username = usernameMatch ? usernameMatch[1].trim() : cleanName;
        
        console.log('👤 Extracted username:', username, 'from:', streamName);
        return username;
    },

    // Extract game/category
    extractGame(streamName) {
        // For now, default to "Just Chatting"
        // In a real implementation, you'd extract this from the stream name
        return 'Just Chatting';
    },

    // Validate M3U8 URL
    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' && 
                   urlObj.hostname.includes('usher.ttvnw.net');
        } catch {
            return false;
        }
    },

    // Parse token from URL if present
    parseToken(url) {
        try {
            const urlObj = new URL(url);
            const tokenParam = urlObj.searchParams.get('token');
            if (tokenParam) {
                return JSON.parse(decodeURIComponent(tokenParam));
            }
        } catch (error) {
            console.warn('Failed to parse token from URL:', error);
        }
        return null;
    },

    // Check if stream URL is expired
    isUrlExpired(url) {
        try {
            const token = this.parseToken(url);
            if (token && token.expires) {
                const now = Math.floor(Date.now() / 1000);
                // Consider URL expired if within 10 minutes of expiration
                const isExpired = now >= (token.expires - 600);
                console.log('⏰ URL expiry check:', { 
                    expires: token.expires, 
                    now, 
                    isExpired 
                });
                return isExpired;
            }
        } catch (error) {
            console.warn('Error checking URL expiration:', error);
        }
        return false;
    },

    // Format stream data for display
    formatStreamForDisplay(stream) {
        const formattedStream = {
            ...stream,
            username: this.extractUsername(stream.name),
            game: this.extractGame(stream.name),
            thumbnail: this.generateThumbnailUrl(stream),
            chatUrl: this.generateChatUrl(stream),
            shareUrl: this.generateShareUrl(stream),
            isExpired: stream.isExpired || this.isUrlExpired(stream.url),
            safeName: this.escapeHtml(this.extractUsername(stream.name))
        };
        
        // Ensure displayName is set
        formattedStream.displayName = formattedStream.username;
        
        console.log('🎨 Formatted stream:', {
            name: stream.name,
            username: formattedStream.username,
            isLive: formattedStream.isLive,
            isExpired: formattedStream.isExpired
        });
        
        return formattedStream;
    },

    // Generate thumbnail URL
    generateThumbnailUrl(stream) {
        const username = this.extractUsername(stream.name);
        return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-320x180.jpg`;
    },

    // Generate chat embed URL
    generateChatUrl(stream) {
        const username = this.extractUsername(stream.name);
        return `https://www.twitch.tv/embed/${username}/chat?darkpopout`;
    },

    // Generate shareable URL
    generateShareUrl(stream) {
        const username = this.extractUsername(stream.name);
        return `https://twitch.tv/${username}`;
    },

    // Sort streams by various criteria
    sortStreams(streams, criteria = 'viewers', order = 'desc') {
        const sorted = [...streams];
        
        sorted.sort((a, b) => {
            let aValue, bValue;
            
            switch (criteria) {
                case 'name':
                    aValue = a.username?.toLowerCase() || '';
                    bValue = b.username?.toLowerCase() || '';
                    break;
                case 'status':
                    // Live streams first, then by viewers
                    if (a.isLive !== b.isLive) {
                        return a.isLive ? -1 : 1;
                    }
                    aValue = a.viewers;
                    bValue = b.viewers;
                    break;
                case 'viewers':
                default:
                    aValue = a.viewers;
                    bValue = b.viewers;
                    break;
            }
            
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
        
        return sorted;
    },

    // Filter streams based on criteria
    filterStreams(streams, filters = {}) {
        return streams.filter(stream => {
            if (filters.status === 'live' && !stream.isLive) return false;
            if (filters.status === 'offline' && stream.isLive) return false;
            if (filters.search && !stream.username.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.minViewers !== undefined && stream.viewers < filters.minViewers) return false;
            return true;
        });
    },

    // Escape HTML for safe rendering
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
