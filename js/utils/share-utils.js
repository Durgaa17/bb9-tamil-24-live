// Social Share Utilities
const ShareUtils = {
    // Share content to social media platforms
    shareToPlatform(platform, stream, text = '') {
        const shareUrl = stream?.shareUrl || window.location.href;
        const shareText = text || SETTINGS.socialShare.customMessage;
        const username = stream?.username || 'Twitch Stream';
        
        let url;
        
        switch (platform) {
            case CONSTANTS.SOCIAL_PLATFORMS.FACEBOOK:
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
                
            case CONSTANTS.SOCIAL_PLATFORMS.WHATSAPP:
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                break;
                
            case CONSTANTS.SOCIAL_PLATFORMS.TELEGRAM:
                url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
                
            case CONSTANTS.SOCIAL_PLATFORMS.TWITTER:
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
                
            case CONSTANTS.SOCIAL_PLATFORMS.TIKTOK:
                // TikTok doesn't have a direct share API, open in new tab
                url = shareUrl;
                break;
                
            case CONSTANTS.SOCIAL_PLATFORMS.REDDIT:
                url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
                break;
                
            default:
                console.warn('Unknown platform:', platform);
                return;
        }
        
        this.openShareWindow(url, platform);
        this.trackShare(platform, stream);
    },
    
    // Open share window
    openShareWindow(url, platform) {
        const windowFeatures = 'width=600,height=400,menubar=no,toolbar=no,resizable=yes,scrollbars=yes';
        
        if (platform === CONSTANTS.SOCIAL_PLATFORMS.TIKTOK) {
            // For TikTok, just open the stream URL
            window.open(url, '_blank');
        } else {
            window.open(url, 'share', windowFeatures);
        }
    },
    
    // Copy stream URL to clipboard
    async copyToClipboard(stream, text = '') {
        const shareUrl = stream?.shareUrl || window.location.href;
        const shareText = text || SETTINGS.socialShare.customMessage;
        const fullText = `${shareText} ${shareUrl}`;
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(fullText);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = fullText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            this.trackShare('copy', stream);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },
    
    // Generate shareable text
    generateShareText(stream, platform = '') {
        const username = stream?.username || 'Twitch Stream';
        const game = stream?.game || 'Live';
        const status = stream?.isLive ? 'is live now' : 'was streaming';
        
        let baseText = SETTINGS.socialShare.customMessage;
        
        if (baseText.includes('{username}') || baseText.includes('{game}') || baseText.includes('{status}')) {
            baseText = baseText
                .replace(/{username}/g, username)
                .replace(/{game}/g, game)
                .replace(/{status}/g, status);
        } else {
            baseText = `Check out ${username} ${status} playing ${game} on Twitch!`;
        }
        
        // Platform-specific adjustments
        if (platform === CONSTANTS.SOCIAL_PLATFORMS.TWITTER) {
            // Twitter has character limits
            if (baseText.length > 240) {
                baseText = `Watching ${username} live on Twitch!`;
            }
        }
        
        return baseText;
    },
    
    // Generate QR code for sharing
    generateQRCode(stream, element) {
        const shareUrl = stream?.shareUrl || window.location.href;
        
        // Simple QR code generation using Google Charts API
        const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(shareUrl)}`;
        
        if (element) {
            const img = DOMUtils.create('img', {
                src: qrCodeUrl,
                alt: 'QR Code for sharing',
                className: 'qr-code'
            });
            
            DOMUtils.empty(element);
            element.appendChild(img);
        }
        
        return qrCodeUrl;
    },
    
    // Track share events
    trackShare(platform, stream) {
        const eventData = {
            platform: platform,
            stream: stream?.username,
            timestamp: new Date().toISOString()
        };
        
        // Store in localStorage for basic analytics
        try {
            const shares = JSON.parse(localStorage.getItem('share_analytics') || '[]');
            shares.push(eventData);
            
            // Keep only last 100 events
            if (shares.length > 100) {
                shares.splice(0, shares.length - 100);
            }
            
            localStorage.setItem('share_analytics', JSON.stringify(shares));
        } catch (error) {
            console.warn('Failed to track share event:', error);
        }
        
        // Notify listeners
        if (typeof this.onShare === 'function') {
            this.onShare(eventData);
        }
    },
    
    // Get share statistics
    getShareStats() {
        try {
            const shares = JSON.parse(localStorage.getItem('share_analytics') || '[]');
            const stats = {};
            
            shares.forEach(share => {
                stats[share.platform] = (stats[share.platform] || 0) + 1;
            });
            
            return {
                total: shares.length,
                byPlatform: stats,
                recent: shares.slice(-10).reverse()
            };
        } catch (error) {
            console.warn('Failed to get share stats:', error);
            return { total: 0, byPlatform: {}, recent: [] };
        }
    },
    
    // Share via Web Share API if available
    async nativeShare(stream) {
        if (!navigator.share) {
            return false;
        }
        
        try {
            const shareUrl = stream?.shareUrl || window.location.href;
            const shareText = this.generateShareText(stream);
            
            await navigator.share({
                title: `${stream?.username} - Twitch Stream`,
                text: shareText,
                url: shareUrl
            });
            
            this.trackShare('native', stream);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Native share failed:', error);
            }
            return false;
        }
    },
    
    // Generate embed code for stream
    generateEmbedCode(stream) {
        const username = stream?.username;
        if (!username) return '';
        
        return `
<iframe 
    src="https://player.twitch.tv/?channel=${username}&parent=${window.location.hostname}"
    height="360" 
    width="640" 
    frameborder="0" 
    scrolling="no" 
    allowfullscreen>
</iframe>
        `.trim();
    },
    
    // Copy embed code to clipboard
    async copyEmbedCode(stream) {
        const embedCode = this.generateEmbedCode(stream);
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(embedCode);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = embedCode;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to copy embed code:', error);
            return false;
        }
    },
    
    // Initialize share buttons
    initShareButtons(container, stream) {
        if (!container || !stream) return;
        
        const shareData = {
            url: stream.shareUrl,
            text: this.generateShareText(stream),
            title: `${stream.username} - Twitch Stream`
        };
        
        // Create platform-specific buttons
        const platforms = [
            { name: CONSTANTS.SOCIAL_PLATFORMS.FACEBOOK, icon: 'facebook', label: 'Facebook' },
            { name: CONSTANTS.SOCIAL_PLATFORMS.WHATSAPP, icon: 'whatsapp', label: 'WhatsApp' },
            { name: CONSTANTS.SOCIAL_PLATFORMS.TELEGRAM, icon: 'telegram', label: 'Telegram' },
            { name: CONSTANTS.SOCIAL_PLATFORMS.TWITTER, icon: 'twitter', label: 'Twitter' },
            { name: CONSTANTS.SOCIAL_PLATFORMS.TIKTOK, icon: 'tiktok', label: 'TikTok' },
            { name: CONSTANTS.SOCIAL_PLATFORMS.REDDIT, icon: 'reddit', label: 'Reddit' }
        ];
        
        platforms.forEach(platform => {
            const button = DOMUtils.create('button', {
                className: `share-button share-${platform.name}`,
                onclick: () => this.shareToPlatform(platform.name, stream)
            }, [
                DOMUtils.create('i', { className: `icon-${platform.icon}` }),
                platform.label
            ]);
            
            container.appendChild(button);
        });
        
        // Add copy button
        const copyButton = DOMUtils.create('button', {
            className: 'share-button share-copy',
            onclick: async () => {
                const success = await this.copyToClipboard(stream);
                if (success) {
                    DOMUtils.addClass(copyButton, 'copied');
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        DOMUtils.removeClass(copyButton, 'copied');
                        copyButton.innerHTML = '<i class="icon-copy"></i>Copy Link';
                    }, 2000);
                }
            }
        }, [
            DOMUtils.create('i', { className: 'icon-copy' }),
            'Copy Link'
        ]);
        
        container.appendChild(copyButton);
    },
    
    // Set share callback
    onShare: null
};
