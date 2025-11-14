// M3U8 Parser Utility
const M3U8Parser = {
    // Parse M3U8 content and extract stream information
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
                streams.push(currentStream);
                currentStream = null;
            }
        }

        return streams;
    },

    // Parse EXTINF line to extract stream metadata
    parseExtinf(extinfLine) {
        const stream = {
            name: '',
            status: CONSTANTS.STREAM_STATUS.UNKNOWN,
            viewers: 0,
            displayStatus: 'Offline',
            isLive: false,
            url: ''
        };

        try {
            // Remove #EXTINF: prefix and split parameters
            const content = extinfLine.replace('#EXTINF:', '').trim();
            
            // Extract duration (we don't need it but it's there)
            const durationMatch = content.match(/^(-?\d+)/);
            
            // Extract the rest of the data after duration
            const dataPart = durationMatch ? content.slice(durationMatch[0].length).trim() : content;
            
            // Parse stream name and metadata
            const nameMatch = dataPart.match(/^([^\[]+)/);
            if (nameMatch) {
                stream.name = nameMatch[1].trim();
            }

            // Extract status and viewers from brackets
            const bracketMatches = dataPart.match(/\[(.*?)\]/g);
            if (bracketMatches) {
                bracketMatches.forEach(match => {
                    const content = match.slice(1, -1); // Remove brackets
                    
                    // Check for LIVE/OFFLINE status
                    if (content.includes('LIVE')) {
                        stream.status = CONSTANTS.STREAM_STATUS.LIVE;
                        stream.isLive = true;
                        stream.displayStatus = 'Live';
                    } else if (content.includes('OFFLINE')) {
                        stream.status = CONSTANTS.STREAM_STATUS.OFFLINE;
                        stream.isLive = false;
                        stream.displayStatus = 'Offline';
                    }
                    
                    // Extract viewer count
                    const viewersMatch = content.match(/(\d+)\s*viewers/);
                    if (viewersMatch) {
                        stream.viewers = parseInt(viewersMatch[1]);
                    }
                });
            }

        } catch (error) {
            console.error('Error parsing EXTINF line:', error, extinfLine);
            // Fallback: try to extract just the stream name
            const nameMatch = extinfLine.match(/,(.+)$/);
            if (nameMatch) {
                stream.name = nameMatch[1].trim();
            }
        }

        return stream;
    },

    // Generate unique ID for stream
    generateStreamId(stream) {
        return btoa(stream.name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    },

    // Extract username from stream name
    extractUsername(streamName) {
        // Remove metadata brackets and extract username
        const cleanName = streamName.replace(/\s*\[.*?\]\s*/g, '').trim();
        
        // Extract username (usually the first word before any spaces)
        const usernameMatch = cleanName.match(/^([^\s]+)/);
        return usernameMatch ? usernameMatch[1] : cleanName;
    },

    // Extract game/category from stream name if available
    extractGame(streamName) {
        const gameMatch = streamName.match(/-\s*(.+)$/);
        return gameMatch ? gameMatch[1].trim() : 'Just Chatting';
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
        const token = this.parseToken(url);
        if (token && token.expires) {
            const now = Math.floor(Date.now() / 1000);
            return now >= token.expires;
        }
        return false;
    },

    // Estimate expiration time (in milliseconds)
    getTimeUntilExpiration(url) {
        const token = this.parseToken(url);
        if (token && token.expires) {
            const now = Math.floor(Date.now() / 1000);
            return (token.expires - now) * 1000; // Convert to milliseconds
        }
        return 0;
    },

    // Format stream data for display
    formatStreamForDisplay(stream) {
        return {
            ...stream,
            username: this.extractUsername(stream.name),
            game: this.extractGame(stream.name),
            displayName: this.extractUsername(stream.name),
            thumbnail: this.generateThumbnailUrl(stream),
            chatUrl: this.generateChatUrl(stream),
            shareUrl: this.generateShareUrl(stream),
            isExpired: this.isUrlExpired(stream.url)
        };
    },

    // Generate thumbnail URL (Twitch thumbnail pattern)
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
    }
};
