// Social Share Component
const SocialShareComponent = {
    currentStream: null,

    // Initialize social share
    init() {
        this.render();
        this.setupEventListeners();
        this.setupStreamListeners();
    },

    // Render social share
    render() {
        const container = DOMUtils.get('social-share');
        if (!container) return;

        container.innerHTML = `
            <div class="social-share-header">
                <i>📤</i>
                <span>Share This Stream</span>
            </div>
            
            <div class="share-buttons" id="share-buttons">
                <div class="share-placeholder">
                    Select a stream to enable sharing
                </div>
            </div>
            
            <div class="share-url" style="display: none;">
                <div class="url-copy-container">
                    <input type="text" class="url-input" id="share-url-input" readonly>
                    <button class="copy-btn" id="copy-url-btn">
                        <i>📋</i>
                        Copy URL
                    </button>
                </div>
            </div>
            
            <div class="share-stats" style="display: none;">
                <div class="share-stat">
                    <i>👁️</i>
                    <span>Shared <span id="share-count">0</span> times</span>
                </div>
                <div class="share-stat">
                    <i>🕒</i>
                    <span>Last shared: <span id="last-share">Never</span></span>
                </div>
            </div>
        `;
    },

    // Setup event listeners
    setupEventListeners() {
        // Copy URL button
        DOMUtils.on('#copy-url-btn', 'click', async () => {
            await this.copyStreamUrl();
        });

        // URL input click to select all
        DOMUtils.on('#share-url-input', 'click', (e) => {
            e.target.select();
        });

        // Listen for share events from ShareUtils
        ShareUtils.onShare = (eventData) => {
            this.updateShareStats();
        };
    },

    // Setup stream listeners
    setupStreamListeners() {
        StreamManager.on('streamChanged', (stream) => {
            this.setStream(stream);
        });

        StreamManager.on('socialShareUpdate', (stream) => {
            this.setStream(stream);
        });
    },

    // Set current stream for sharing
    setStream(stream) {
        this.currentStream = stream;
        
        if (stream) {
            this.enableSharing(stream);
        } else {
            this.disableSharing();
        }
    },

    // Enable sharing for a stream
    enableSharing(stream) {
        const shareButtons = DOMUtils.get('share-buttons');
        const shareUrl = DOMUtils.find('.share-url');
        const shareStats = DOMUtils.find('.share-stats');

        if (!shareButtons) return;

        // Clear existing buttons
        DOMUtils.empty(shareButtons);

        // Create share buttons
        ShareUtils.initShareButtons(shareButtons, stream);

        // Show URL and stats sections
        if (shareUrl) DOMUtils.show(shareUrl);
        if (shareStats) DOMUtils.show(shareStats);

        // Update share URL
        this.updateShareUrl(stream);

        // Update share stats
        this.updateShareStats();
    },

    // Disable sharing
    disableSharing() {
        const shareButtons = DOMUtils.get('share-buttons');
        const shareUrl = DOMUtils.find('.share-url');
        const shareStats = DOMUtils.find('.share-stats');

        if (shareButtons) {
            shareButtons.innerHTML = `
                <div class="share-placeholder">
                    Select a stream to enable sharing
                </div>
            `;
        }

        if (shareUrl) DOMUtils.hide(shareUrl);
        if (shareStats) DOMUtils.hide(shareStats);
    },

    // Update share URL input
    updateShareUrl(stream) {
        const urlInput = DOMUtils.get('share-url-input');
        if (urlInput && stream) {
            urlInput.value = stream.shareUrl || `https://twitch.tv/${stream.username}`;
        }
    },

    // Copy stream URL to clipboard
    async copyStreamUrl() {
        if (!this.currentStream) return;

        const success = await ShareUtils.copyToClipboard(this.currentStream);
        const copyBtn = DOMUtils.get('copy-url-btn');
        
        if (success) {
            // Show success feedback
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i>✅</i> Copied!';
            copyBtn.disabled = true;
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
                copyBtn.disabled = false;
            }, 2000);
            
            // Update stats
            this.updateShareStats();
        } else {
            // Show error feedback
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i>❌</i> Failed';
            copyBtn.disabled = true;
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
                copyBtn.disabled = false;
            }, 2000);
        }
    },

    // Update share statistics
    updateShareStats() {
        const stats = ShareUtils.getShareStats();
        const shareCount = DOMUtils.get('share-count');
        const lastShare = DOMUtils.get('last-share');

        if (shareCount) {
            shareCount.textContent = stats.total;
        }

        if (lastShare) {
            if (stats.recent.length > 0) {
                const lastShareTime = new Date(stats.recent[0].timestamp);
                lastShare.textContent = lastShareTime.toLocaleTimeString();
            } else {
                lastShare.textContent = 'Never';
            }
        }
    },

    // Share to specific platform
    shareToPlatform(platform) {
        if (!this.currentStream) return;
        
        ShareUtils.shareToPlatform(platform, this.currentStream);
    },

    // Generate QR code
    generateQRCode() {
        if (!this.currentStream) return;
        
        // Create QR code modal
        this.showQRCodeModal(this.currentStream);
    },

    // Show QR code modal
    showQRCodeModal(stream) {
        // Create modal overlay
        const modal = DOMUtils.create('div', {
            className: 'modal-overlay',
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 'var(--z-modal)'
            }
        });

        // Create modal content
        const modalContent = DOMUtils.create('div', {
            className: 'modal-content',
            style: {
                background: 'var(--background-card)',
                padding: 'var(--space-xl)',
                borderRadius: 'var(--border-radius-lg)',
                textAlign: 'center',
                maxWidth: '300px',
                width: '90%'
            }
        }, [
            DOMUtils.create('h3', {
                style: { marginBottom: 'var(--space-md)' },
                textContent: 'Share QR Code'
            }),
            DOMUtils.create('div', {
                id: 'qrcode-container',
                style: { margin: 'var(--space-lg) 0' }
            }),
            DOMUtils.create('p', {
                style: { 
                    marginBottom: 'var(--space-lg)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-size-sm)'
                },
                textContent: 'Scan to visit stream'
            }),
            DOMUtils.create('button', {
                className: 'chat-connect-btn',
                onclick: () => document.body.removeChild(modal),
                textContent: 'Close'
            })
        ]);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Generate QR code
        ShareUtils.generateQRCode(stream, DOMUtils.get('qrcode-container'));

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', function closeModal(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', closeModal);
            }
        });
    },

    // Get shareable platforms
    getPlatforms() {
        return [
            { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877f2' },
            { id: 'whatsapp', name: 'WhatsApp', icon: '💚', color: '#25d366' },
            { id: 'telegram', name: 'Telegram', icon: '📨', color: '#0088cc' },
            { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1da1f2' },
            { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
            { id: 'reddit', name: 'Reddit', icon: '📱', color: '#ff5700' }
        ];
    },

    // Update component for responsive design
    updateLayout() {
        const container = DOMUtils.get('social-share');
        if (!container) return;

        if (ResponsiveManager.isMobile) {
            DOMUtils.addClass(container, 'mobile-layout');
        } else {
            DOMUtils.removeClass(container, 'mobile-layout');
        }
    },

    // Cleanup
    destroy() {
        ShareUtils.onShare = null;
    }
};
