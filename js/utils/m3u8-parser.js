// M3U8 Parser Utility - DEBUG VERSION
const M3U8Parser = {
    // Parse M3U8 content and extract stream information
    parse(m3u8Content) {
        console.log('🔍 M3U8 Parser Debug - Starting parse...');
        console.log('📄 M3U8 Content (first 500 chars):', m3u8Content.substring(0, 500));
        
        const streams = [];
        const lines = m3u8Content.split('\n');
        let currentStream = null;

        console.log('📝 Total lines in M3U8:', lines.length);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTM3U')) {
                console.log('✅ Found #EXTM3U header');
                continue;
            }
            
            if (line.startsWith('#EXTINF:')) {
                console.log('🎯 Found EXTINF line:', line);
                currentStream = this.parseExtinf(line);
            } else if (line.startsWith('https://') && currentStream) {
                console.log('🔗 Found URL:', line.substring(0, 100) + '...');
                currentStream.url = line;
                currentStream.id = this.generateStreamId(currentStream);
                
                // Check if URL is expired
                currentStream.isExpired = this.isUrlExpired(currentStream.url);
                
                streams.push(currentStream);
                console.log('✅ Added stream:', currentStream.username);
                currentStream = null;
            } else if (line && !line.startsWith('#')) {
                console.log('❓ Unknown line format:', line);
            }
        }

        console.log(`🎉 Parsing complete. Found ${streams.length} streams:`, streams);
        return streams;
    },

    // Parse EXTINF line to extract stream metadata
    parseExtinf(extinfLine) {
        console.log('🔍 Parsing EXTINF:', extinfLine);
        
        const stream = {
            name: '',
            status: CONSTANTS.STREAM_STATUS.UNKNOWN,
            viewers: 0,
            displayStatus: 'Unknown',
            isLive: false,
            url: '',
            isExpired: false
        };

        try {
            // Remove #EXTINF: prefix
            const content = extinfLine.replace('#EXTINF:', '').trim();
            console.log('📋 Cleaned content:', content);
            
            // Find the comma that separates duration from stream info
            const commaIndex = content.indexOf(',');
            if (commaIndex !== -1) {
                const streamInfo = content.slice(commaIndex + 1).trim();
                stream.name = streamInfo;
                console.log('📛 Stream name extracted:', streamInfo);
                
                // Parse stream metadata
                this.parseStreamMetadata(stream, streamInfo);
            } else {
                stream.name = content;
                console.log('⚠️ No comma found, using full content as name');
            }

        } catch (error) {
            console.error('❌ Error parsing EXTINF line:', error);
            // Fallback: extract basic name
            const nameMatch = extinfLine.match(/,(.+)$/);
            if (nameMatch) {
                stream.name = nameMatch[1].trim();
                console.log('🔄 Fallback name:', stream.name);
            }
        }

        console.log('📊 Final stream object:', stream);
        return stream;
    },

    // Parse all metadata from stream info
    parseStreamMetadata(stream, streamInfo) {
        console.log('🔍 Analyzing stream info:', streamInfo);
        
        // Method 1: Check for [LIVE] tag (case insensitive)
        if (streamInfo.match(/\[LIVE\]/i)) {
            stream.isLive = true;
            stream.displayStatus = 'Live';
            stream.status = CONSTANTS.STREAM_STATUS.LIVE;
            console.log('🎯 Detected LIVE stream from [LIVE] tag');
        }
        
        // Method 2: Check for viewers count
        const viewersMatch = streamInfo.match(/(\d+)\s*viewers/i);
        if (viewersMatch) {
            stream.viewers = parseInt(viewersMatch[1]);
            console.log('👥 Found viewers:', stream.viewers);
        }
        
        // Method 3: Check for offline status
        if (streamInfo.match(/offline/i) && !streamInfo.match(/\[LIVE\]/i)) {
            stream.isLive = false;
            stream.displayStatus = 'Offline';
            stream.status = CONSTANTS.STREAM_STATUS.OFFLINE;
            console.log('💤 Detected OFFLINE stream');
        }
        
        // Method 4: If no explicit status but has viewers, assume live
        if (!streamInfo.match(/offline/i) && stream.viewers >= 0 && !stream.isLive) {
            stream.isLive = true;
            stream.displayStatus = 'Live';
            stream.status = CONSTANTS.STREAM_STATUS.LIVE;
            console.log('🔄 Assuming live stream (has viewers, no offline tag)');
        }
        
        console.log('📊 Final metadata:', {
            isLive: stream.isLive,
            viewers: stream.viewers,
            status: stream.displayStatus
        });
    },

    // Generate unique ID for stream
    generateStreamId(stream) {
        const id = btoa(stream.name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        console.log('🆔 Generated stream ID:', id);
        return id;
    },

    // Extract username from stream name
    extractUsername(streamName) {
        console.log('👤 Extracting username from:', streamName);
        
        if (!streamName) {
            console.log('❌ No stream name provided');
            return 'Unknown';
        }
        
        let cleanName = streamName;
        
        // Remove common suffixes
        cleanName = cleanName.replace(/\s*-\s*\d+\s*viewers\s*-\s*Offline/gi, '');
        cleanName = cleanName.replace(/\s*-\s*\d+\s*viewers/gi, '');
        cleanName = cleanName.replace(/\s*-\s*Offline/gi, '');
        cleanName = cleanName.replace(/\s*\[.*?\]\s*/g, '');
        
        // Extract first word as username
        const usernameMatch = cleanName.match(/^([^\s]+)/);
        const username = usernameMatch ? usernameMatch[1].trim() : cleanName.trim();
        
        console.log('✅ Username extracted:', username);
        return username;
    },

    // Check if stream URL is expired
    isUrlExpired(url) {
        try {
            const token = this.parseToken(url);
            if (token && token.expires) {
                const now = Math.floor(Date.now() / 1000);
                const isExpired = now >= token.expires;
                console.log('⏰ URL expiry:', { 
                    expires: new Date(token.expires * 1000), 
                    now: new Date(now * 1000),
                    isExpired 
                });
                return isExpired;
            }
        } catch (error) {
            console.warn('⚠️ Error checking URL expiration:', error);
        }
        return false;
    },

    // Format stream data for display
    formatStreamForDisplay(stream) {
        console.log('🎨 Formatting stream for display:', stream);
        
        const username = this.extractUsername(stream.name);
        const formattedStream = {
            ...stream,
            username: username,
            displayName: username,
            game: 'Just Chatting', // Default game
            thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-320x180.jpg`,
            chatUrl: `https://www.twitch.tv/embed/${username}/chat?darkpopout`,
            shareUrl: `https://twitch.tv/${username}`,
            isExpired: stream.isExpired,
            safeName: this.escapeHtml(username)
        };
        
        console.log('✅ Formatted stream:', formattedStream);
        return formattedStream;
    },

    // Parse token from URL
    parseToken(url) {
        try {
            const urlObj = new URL(url);
            const tokenParam = urlObj.searchParams.get('token');
            if (tokenParam) {
                return JSON.parse(decodeURIComponent(tokenParam));
            }
        } catch (error) {
            console.warn('❌ Failed to parse token from URL:', error);
        }
        return null;
    },

    // Escape HTML
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Create test streams if parsing fails - FIXED: Added function syntax
    createTestStreams: function() {
        console.log('🛠️ Creating test streams since parsing failed');
        return [
            {
                id: 'test1',
                name: 'Test Stream 1 [LIVE] - 5 viewers',
                username: 'teststream1',
                displayName: 'teststream1',
                status: CONSTANTS.STREAM_STATUS.LIVE,
                viewers: 5,
                displayStatus: 'Live',
                isLive: true,
                url: 'https://example.com/stream1.m3u8',
                game: 'Just Chatting',
                thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_teststream1-320x180.jpg',
                chatUrl: 'https://www.twitch.tv/embed/teststream1/chat?darkpopout',
                shareUrl: 'https://twitch.tv/teststream1',
                isExpired: false,
                safeName: 'teststream1'
            },
            {
                id: 'test2', 
                name: 'Test Stream 2 [LIVE] - 10 viewers',
                username: 'teststream2',
                displayName: 'teststream2',
                status: CONSTANTS.STREAM_STATUS.LIVE,
                viewers: 10,
                displayStatus: 'Live',
                isLive: true,
                url: 'https://example.com/stream2.m3u8',
                game: 'Fortnite',
                thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_teststream2-320x180.jpg',
                chatUrl: 'https://www.twitch.tv/embed/teststream2/chat?darkpopout',
                shareUrl: 'https://twitch.tv/teststream2',
                isExpired: false,
                safeName: 'teststream2'
            }
        ];
    }
};
