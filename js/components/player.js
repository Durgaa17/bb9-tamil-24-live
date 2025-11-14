// Player Component
const PlayerComponent = {
    player: null,
    currentStream: null,
    isPlaying: false,
    isFullscreen: false,

    // Initialize player
    init() {
        this.render();
        this.setupEventListeners();
        this.setupStreamListeners();
    },

    // Render player
    render() {
        const container = DOMUtils.get('player-container');
        if (!container) return;

        container.innerHTML = `
            <div class="player-wrapper">
                <div class="player-placeholder" id="player-placeholder">
                    <i>📺</i>
                    <div class="player-placeholder-text">
                        <div class="player-placeholder-title">No Stream Selected</div>
                        <div>Select a stream from the list to start watching</div>
                    </div>
                </div>
                
                <video 
                    id="video-player" 
                    class="video-player"
                    controls
                    playsinline
                    style="display: none;"
                >
                    Your browser does not support the video tag.
                </video>
                
                <div class="player-controls" style="display: none;">
                    <div class="control-bar">
                        <button class="play-pause-btn" data-action="play-pause">
                            <i>⏸️</i>
                        </button>
                        
                        <div class="volume-control">
                            <button class="volume-btn" data-action="toggle-mute">
                                <i>🔊</i>
                            </button>
                            <input type="range" class="volume-slider" data-action="volume" min="0" max="1" step="0.1" value="${SETTINGS.player.volume}">
                        </div>
                        
                        <div class="time-display">
                            <span class="current-time">0:00</span> / 
                            <span class="duration">0:00</span>
                        </div>
                        
                        <button class="fullscreen-btn" data-action="fullscreen">
                            <i>⛶</i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="stream-info" id="stream-info" style="display: none;">
                <div class="stream-title">
                    <div class="stream-avatar" id="stream-avatar"></div>
                    <div class="stream-details">
                        <div class="stream-username" id="stream-username"></div>
                        <div class="stream-status">
                            <div class="status-indicator">
                                <span class="status-dot" id="status-dot"></span>
                                <span id="stream-status-text">Offline</span>
                            </div>
                            <span class="stream-viewers" id="stream-viewers">0 viewers</span>
                            <span class="stream-game" id="stream-game">Just Chatting</span>
                        </div>
                    </div>
                </div>
                <div class="stream-description" id="stream-description">
                    No description available.
                </div>
            </div>
        `;

        this.player = DOMUtils.get('video-player');
        this.setupPlayer();
    },

    // Setup video player
    setupPlayer() {
        if (!this.player) return;

        // Set initial volume
        this.player.volume = SETTINGS.player.volume;
        if (SETTINGS.player.muted) {
            this.player.muted = true;
        }

        // Player event listeners
        this.player.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.player.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.player.addEventListener('play', () => this.onPlay());
        this.player.addEventListener('pause', () => this.onPause());
        this.player.addEventListener('ended', () => this.onEnded());
        this.player.addEventListener('error', (e) => this.onError(e));
        this.player.addEventListener('waiting', () => this.onWaiting());
        this.player.addEventListener('canplay', () => this.onCanPlay());
    },

    // Setup event listeners
    setupEventListeners() {
        // Play/pause button
        DOMUtils.on('[data-action="play-pause"]', 'click', () => {
            this.togglePlayPause();
        });

        // Volume control
        DOMUtils.on('[data-action="volume"]', 'input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });

        // Mute toggle
        DOMUtils.on('[data-action="toggle-mute"]', 'click', () => {
            this.toggleMute();
        });

        // Fullscreen
        DOMUtils.on('[data-action="fullscreen"]', 'click', () => {
            this.toggleFullscreen();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.changeVolume(0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.changeVolume(-0.1);
                    break;
            }
        });

        // Fullscreen change
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenButton();
        });
    },

    // Setup stream listeners
    setupStreamListeners() {
        StreamManager.on('playStream', (stream) => {
            this.playStream(stream);
        });

        StreamManager.on('stopStream', () => {
            this.stopStream();
        });

        StreamManager.on('streamChanged', (stream) => {
            this.updateStreamInfo(stream);
        });
    },

    // Play a stream
    async playStream(stream) {
        if (!stream || !stream.url) {
            console.error('Invalid stream or URL');
            return;
        }

        this.currentStream = stream;
        
        try {
            // Show loading state
            this.showLoading();
            
            // Set video source
            this.player.src = stream.url;
            this.player.load();
            
            // Attempt to play
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
            this.showError('Failed to play stream. The stream may be offline or the URL may have expired.');
        }
    },

    // Stop current stream
    stopStream() {
        if (this.player) {
            this.player.pause();
            this.player.src = '';
            this.player.load();
        }
        
        this.isPlaying = false;
        this.currentStream = null;
        this.showPlaceholder();
        this.updatePlayButton();
    },

    // Toggle play/pause
    togglePlayPause() {
        if (!this.player.src) return;

        if (this.player.paused) {
            this.player.play().catch(error => {
                console.error('Error playing:', error);
            });
        } else {
            this.player.pause();
        }
    },

    // Set volume
    setVolume(volume) {
        if (!this.player) return;
        
        volume = Math.max(0, Math.min(1, volume));
        this.player.volume = volume;
        SETTINGS.update('player.volume', volume);
        
        // Update volume slider
        const volumeSlider = DOMUtils.find('[data-action="volume"]');
        if (volumeSlider) {
            volumeSlider.value = volume;
        }
        
        this.updateMuteButton();
    },

    // Change volume by delta
    changeVolume(delta) {
        const currentVolume = this.player ? this.player.volume : SETTINGS.player.volume;
        this.setVolume(currentVolume + delta);
    },

    // Toggle mute
    toggleMute() {
        if (!this.player) return;
        
        this.player.muted = !this.player.muted;
        SETTINGS.update('player.muted', this.player.muted);
        this.updateMuteButton();
    },

    // Toggle fullscreen
    toggleFullscreen() {
        const playerWrapper = DOMUtils.find('.player-wrapper');
        
        if (!document.fullscreenElement) {
            playerWrapper.requestFullscreen?.().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen?.();
        }
    },

    // Update stream information display
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

        // Update stream details
        DOMUtils.get('stream-username').textContent = stream.username;
        DOMUtils.get('stream-viewers').textContent = `${stream.viewers} viewers`;
        DOMUtils.get('stream-game').textContent = stream.game;
        
        // Update status
        const statusDot = DOMUtils.get('status-dot');
        const statusText = DOMUtils.get('stream-status-text');
        
        if (stream.isLive) {
            DOMUtils.addClass(statusDot, CONSTANTS.CLASS_NAMES.LIVE);
            statusText.textContent = 'Live';
        } else {
            DOMUtils.removeClass(statusDot, CONSTANTS.CLASS_NAMES.LIVE);
            statusText.textContent = 'Offline';
        }

        // Update avatar (placeholder)
        const avatar = DOMUtils.get('stream-avatar');
        avatar.style.background = `linear-gradient(45deg, var(--primary-color), var(--primary-dark))`;
        avatar.textContent = stream.username.charAt(0).toUpperCase();
    },

    // Show player
    showPlayer() {
        DOMUtils.show(this.player);
        DOMUtils.show(DOMUtils.find('.player-controls'));
        DOMUtils.hide(DOMUtils.get('player-placeholder'));
    },

    // Show placeholder
    showPlaceholder() {
        DOMUtils.hide(this.player);
        DOMUtils.hide(DOMUtils.find('.player-controls'));
        DOMUtils.show(DOMUtils.get('player-placeholder'));
        DOMUtils.hide(DOMUtils.get('stream-info'));
    },

    // Show loading state
    showLoading() {
        const placeholder = DOMUtils.get('player-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <i>⏳</i>
                <div class="player-placeholder-text">
                    <div class="player-placeholder-title">Loading Stream...</div>
                    <div>Please wait</div>
                </div>
            `;
            DOMUtils.show(placeholder);
        }
    },

    // Show error state
    showError(message) {
        const placeholder = DOMUtils.get('player-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <i>❌</i>
                <div class="player-placeholder-text">
                    <div class="player-placeholder-title">Playback Error</div>
                    <div>${message}</div>
                </div>
            `;
            DOMUtils.show(placeholder);
        }
    },

    // Update play button
    updatePlayButton() {
        const playBtn = DOMUtils.find('[data-action="play-pause"] i');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }
    },

    // Update mute button
    updateMuteButton() {
        const muteBtn = DOMUtils.find('[data-action="toggle-mute"] i');
        if (muteBtn && this.player) {
            if (this.player.muted || this.player.volume === 0) {
                muteBtn.textContent = '🔇';
            } else if (this.player.volume < 0.5) {
                muteBtn.textContent = '🔈';
            } else {
                muteBtn.textContent = '🔊';
            }
        }
    },

    // Update fullscreen button
    updateFullscreenButton() {
        const fsBtn = DOMUtils.find('[data-action="fullscreen"] i');
        if (fsBtn) {
            fsBtn.textContent = this.isFullscreen ? '⛷️' : '⛶';
        }
    },

    // Player event handlers
    onLoadedMetadata() {
        console.log('Video metadata loaded');
    },

    onTimeUpdate() {
        const currentTime = DOMUtils.find('.current-time');
        const duration = DOMUtils.find('.duration');
        
        if (currentTime) {
            currentTime.textContent = this.formatTime(this.player.currentTime);
        }
        if (duration) {
            duration.textContent = this.formatTime(this.player.duration);
        }
    },

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
    },

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
    },

    onEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.showPlaceholder();
    },

    onError(e) {
        console.error('Video error:', e);
        this.showError('Stream playback error. The stream may be offline or the URL may have expired.');
    },

    onWaiting() {
        // Show buffering indicator if needed
    },

    onCanPlay() {
        // Hide loading state if needed
    },

    // Format time (seconds to MM:SS)
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Cleanup
    destroy() {
        if (this.player) {
            this.player.pause();
            this.player.src = '';
            this.player.load();
        }
    }
};
