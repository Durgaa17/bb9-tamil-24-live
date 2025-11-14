// Player Component - UPDATED FIX
const PlayerComponent = {
    player: null,
    currentStream: null,
    isPlaying: false,
    isFullscreen: false,

    // Play a stream - UPDATED with better error handling
    async playStream(stream) {
        if (!stream || !stream.url) {
            console.error('Invalid stream or URL');
            this.showError('Invalid stream URL');
            return;
        }

        this.currentStream = stream;
        
        try {
            // Show loading state
            this.showLoading();
            
            // Check if URL is expired
            if (stream.isExpired) {
                throw new Error('Stream URL has expired. Please refresh the stream list.');
            }

            // Set video source
            this.player.src = stream.url;
            this.player.load();
            
            // Attempt to play with better error handling
            if (SETTINGS.player.autoplay) {
                await this.player.play();
                this.isPlaying = true;
            }
            
            // Update UI
            this.showPlayer();
            this.updateStreamInfo(stream);
            this.updatePlayButton();
            
        } catch (error) {
            console.error('Error playing stream:', error);
            
            // More specific error messages
            let errorMessage = 'Failed to play stream. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Autoplay was blocked. Please click the play button.';
            } else if (error.name === 'NetworkError') {
                errorMessage += 'Network error. Please check your connection.';
            } else if (stream.isExpired) {
                errorMessage = 'Stream URL has expired. Please refresh the stream list.';
            } else {
                errorMessage += 'The stream may be offline or the URL may have expired.';
            }
            
            this.showError(errorMessage);
        }
    },

    // Update stream information display - IMPROVED
    updateStreamInfo(stream) {
        const streamInfo = DOMUtils.get('stream-info');
        const placeholder = DOMUtils.get('player-placeholder');
        
        if (!stream) {
            DOMUtils.hide(streamInfo);
            if (placeholder) DOMUtils.show(placeholder);
            return;
        }

        DOMUtils.show(streamInfo);
        if (placeholder) DOMUtils.hide(placeholder);

        // Update stream details with safe HTML
        DOMUtils.get('stream-username').textContent = stream.safeName || stream.username;
        DOMUtils.get('stream-viewers').textContent = `${stream.viewers} viewers`;
        DOMUtils.get('stream-game').textContent = stream.game || 'Just Chatting';
        
        // Update status with expiration check
        const statusDot = DOMUtils.get('status-dot');
        const statusText = DOMUtils.get('stream-status-text');
        
        if (stream.isExpired) {
            DOMUtils.removeClass(statusDot, CONSTANTS.CLASS_NAMES.LIVE);
            statusText.textContent = 'Expired';
            statusText.style.color = 'var(--offline-color)';
        } else if (stream.isLive) {
            DOMUtils.addClass(statusDot, CONSTANTS.CLASS_NAMES.LIVE);
            statusText.textContent = 'Live';
            statusText.style.color = 'var(--online-color)';
        } else {
            DOMUtils.removeClass(statusDot, CONSTANTS.CLASS_NAMES.LIVE);
            statusText.textContent = 'Offline';
            statusText.style.color = 'var(--offline-color)';
        }

        // Update avatar
        const avatar = DOMUtils.get('stream-avatar');
        avatar.style.background = `linear-gradient(45deg, var(--primary-color), var(--primary-dark))`;
        avatar.textContent = (stream.username?.charAt(0) || 'S').toUpperCase();
    },

    // Show error state - IMPROVED
    showError(message) {
        const placeholder = DOMUtils.get('player-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <i>❌</i>
                <div class="player-placeholder-text">
                    <div class="player-placeholder-title">Playback Error</div>
                    <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 10px;">
                        ${message}
                    </div>
                    ${this.currentStream?.isExpired ? 
                        '<button onclick="StreamManager.refreshStreams()" style="margin-top: 15px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Streams</button>' : 
                        ''
                    }
                </div>
            `;
            DOMUtils.show(placeholder);
        }
        
        // Also hide player and controls
        DOMUtils.hide(this.player);
        DOMUtils.hide(DOMUtils.find('.player-controls'));
    },

    // Rest of the methods remain the same...
    // ... (keep all other existing methods)
};
