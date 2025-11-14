// Footer Component
const FooterComponent = {
    // Initialize footer
    init() {
        this.render();
        this.setupEventListeners();
    },

    // Render footer
    render() {
        const footer = DOMUtils.get('footer');
        if (!footer) return;

        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Twitch Streams</h3>
                    <p>
                        A simple web application for watching Twitch streams with built-in chat 
                        and social sharing features. Responsive design for mobile and Android TV.
                    </p>
                    <div class="social-links">
                        <a href="#" class="social-link" title="GitHub" data-action="github">
                            <i>🐙</i>
                        </a>
                        <a href="#" class="social-link" title="Twitter" data-action="twitter">
                            <i>🐦</i>
                        </a>
                        <a href="#" class="social-link" title="Report Issue" data-action="issue">
                            <i>🐛</i>
                        </a>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <ul class="footer-links">
                        <li><a href="#" data-action="refresh"><i>🔄</i> Refresh Streams</a></li>
                        <li><a href="#" data-action="settings"><i>⚙️</i> Settings</a></li>
                        <li><a href="#" data-action="about"><i>ℹ️</i> About</a></li>
                        <li><a href="#" data-action="help"><i>❓</i> Help</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Stream Info</h3>
                    <ul class="footer-links">
                        <li><a href="https://twitch.tv" target="_blank"><i>📺</i> Twitch.tv</a></li>
                        <li><a href="#" data-action="stats"><i>📊</i> Statistics</a></li>
                        <li><a href="#" data-action="export"><i>📤</i> Export Data</a></li>
                        <li><a href="#" data-action="donate"><i>❤️</i> Support</a></li>
                    </ul>
                </div>
                
                <div class="footer-bottom">
                    <div class="copyright">
                        &copy; 2024 Twitch Streams Web App. All streams belong to their respective broadcasters.
                    </div>
                    <div class="footer-legal">
                        <a href="#" data-action="privacy">Privacy</a>
                        <a href="#" data-action="terms">Terms</a>
                        <a href="#" data-action="credits">Credits</a>
                    </div>
                </div>
            </div>
        `;
    },

    // Setup event listeners
    setupEventListeners() {
        // Social links
        DOMUtils.on('[data-action="github"]', 'click', (e) => {
            e.preventDefault();
            this.handleGithubClick();
        });

        DOMUtils.on('[data-action="twitter"]', 'click', (e) => {
            e.preventDefault();
            this.handleTwitterClick();
        });

        DOMUtils.on('[data-action="issue"]', 'click', (e) => {
            e.preventDefault();
            this.handleIssueClick();
        });

        // Quick links
        DOMUtils.on('[data-action="refresh"]', 'click', (e) => {
            e.preventDefault();
            this.handleRefreshClick();
        });

        DOMUtils.on('[data-action="settings"]', 'click', (e) => {
            e.preventDefault();
            this.handleSettingsClick();
        });

        DOMUtils.on('[data-action="about"]', 'click', (e) => {
            e.preventDefault();
            this.handleAboutClick();
        });

        DOMUtils.on('[data-action="help"]', 'click', (e) => {
            e.preventDefault();
            this.handleHelpClick();
        });

        // Stream info links
        DOMUtils.on('[data-action="stats"]', 'click', (e) => {
            e.preventDefault();
            this.handleStatsClick();
        });

        DOMUtils.on('[data-action="export"]', 'click', (e) => {
            e.preventDefault();
            this.handleExportClick();
        });

        DOMUtils.on('[data-action="donate"]', 'click', (e) => {
            e.preventDefault();
            this.handleDonateClick();
        });

        // Legal links
        DOMUtils.on('[data-action="privacy"]', 'click', (e) => {
            e.preventDefault();
            this.handlePrivacyClick();
        });

        DOMUtils.on('[data-action="terms"]', 'click', (e) => {
            e.preventDefault();
            this.handleTermsClick();
        });

        DOMUtils.on('[data-action="credits"]', 'click', (e) => {
            e.preventDefault();
            this.handleCreditsClick();
        });

        // Update footer layout on resize
        ResponsiveManager.on('breakpointChanged', () => {
            this.updateLayout();
        });
    },

    // Event handlers
    handleGithubClick() {
        window.open('https://github.com/Durgaa17/twitch-finder', '_blank');
    },

    handleTwitterClick() {
        // Open Twitter with share message
        const url = 'https://twitter.com/intent/tweet?text=Check%20out%20this%20Twitch%20streams%20web%20app!';
        window.open(url, '_blank');
    },

    handleIssueClick() {
        // Open GitHub issues
        window.open('https://github.com/Durgaa17/twitch-finder/issues', '_blank');
    },

    handleRefreshClick() {
        if (window.HeaderComponent) {
            HeaderComponent.handleRefresh();
        }
    },

    handleSettingsClick() {
        if (window.HeaderComponent) {
            HeaderComponent.handleSettings();
        }
    },

    handleAboutClick() {
        this.showAboutModal();
    },

    handleHelpClick() {
        this.showHelpModal();
    },

    handleStatsClick() {
        this.showStatsModal();
    },

    handleExportClick() {
        this.exportStreamData();
    },

    handleDonateClick() {
        this.showDonateModal();
    },

    handlePrivacyClick() {
        this.showPrivacyModal();
    },

    handleTermsClick() {
        this.showTermsModal();
    },

    handleCreditsClick() {
        this.showCreditsModal();
    },

    // Show about modal
    showAboutModal() {
        const aboutText = `
            <h3>About Twitch Streams Web App</h3>
            <p>This is a responsive web application for watching Twitch streams with the following features:</p>
            <ul>
                <li>📺 Stream playback with M3U8 support</li>
                <li>💬 Built-in chat interface</li>
                <li>📱 Responsive design for mobile and TV</li>
                <li>📤 Social media sharing</li>
                <li>🔄 Auto-refresh stream list</li>
                <li>🔍 Search and filter streams</li>
            </ul>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Data Source:</strong> Your GitHub M3U8 file</p>
        `;
        
        this.showModal('About', aboutText);
    },

    // Show help modal
    showHelpModal() {
        const helpText = `
            <h3>Help & Instructions</h3>
            <p><strong>Getting Started:</strong></p>
            <ol>
                <li>Select a stream from the list on the right</li>
                <li>Use player controls to play/pause the stream</li>
                <li>Toggle chat visibility using the chat button</li>
                <li>Share streams using the social share buttons</li>
            </ol>
            
            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul>
                <li><kbd>Space</kbd> or <kbd>K</kbd> - Play/Pause</li>
                <li><kbd>F</kbd> - Toggle fullscreen</li>
                <li><kbd>M</kbd> - Mute/Unmute</li>
                <li><kbd>↑</kbd>/<kbd>↓</kbd> - Volume control</li>
                <li><kbd>/</kbd> - Focus search</li>
            </ul>
            
            <p><strong>Mobile/TV:</strong></p>
            <ul>
                <li>Swipe gestures supported on mobile</li>
                <li>TV remote navigation optimized</li>
                <li>Touch-friendly controls</li>
            </ul>
        `;
        
        this.showModal('Help & Instructions', helpText);
    },

    // Show statistics modal
    showStatsModal() {
        const stats = StreamManager.getStats();
        const shareStats = ShareUtils.getShareStats();
        
        const statsText = `
            <h3>Application Statistics</h3>
            
            <p><strong>Stream Statistics:</strong></p>
            <ul>
                <li>Total Streams: ${stats.total}</li>
                <li>Live Streams: ${stats.live}</li>
                <li>Offline Streams: ${stats.offline}</li>
                <li>Total Viewers: ${stats.totalViewers.toLocaleString()}</li>
            </ul>
            
            <p><strong>Share Statistics:</strong></p>
            <ul>
                <li>Total Shares: ${shareStats.total}</li>
                ${Object.entries(shareStats.byPlatform).map(([platform, count]) => 
                    `<li>${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${count}</li>`
                ).join('')}
            </ul>
            
            <p><strong>Performance:</strong></p>
            <ul>
                <li>Last Updated: ${new Date().toLocaleString()}</li>
                <li>Current Stream: ${StreamManager.getCurrentStream()?.username || 'None'}</li>
                <li>Chat Status: ${window.ChatComponent?.isVisible ? 'Visible' : 'Hidden'}</li>
            </ul>
        `;
        
        this.showModal('Statistics', statsText);
    },

    // Export stream data
    exportStreamData() {
        const streams = StreamManager.getStreams();
        const data = {
            exportedAt: new Date().toISOString(),
            totalStreams: streams.length,
            streams: streams
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `twitch-streams-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Stream data exported successfully!', 'success');
    },

    // Show donate modal
    showDonateModal() {
        const donateText = `
            <h3>Support This Project</h3>
            <p>If you find this application useful, consider supporting its development:</p>
            
            <div style="text-align: center; margin: 20px 0;">
                <p><strong>Ways to support:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>⭐ Star the project on GitHub</li>
                    <li>🐛 Report bugs and issues</li>
                    <li>💡 Suggest new features</li>
                    <li>🔗 Share with others</li>
                </ul>
            </div>
            
            <p>This is an open-source project maintained for the community.</p>
        `;
        
        this.showModal('Support', donateText);
    },

    // Show privacy modal
    showPrivacyModal() {
        const privacyText = `
            <h3>Privacy Policy</h3>
            <p><strong>Data Collection:</strong></p>
            <p>This application does not collect any personal data. All stream data is loaded from your provided M3U8 file.</p>
            
            <p><strong>Local Storage:</strong></p>
            <p>The app uses browser local storage to remember your preferences and cache stream data for better performance.</p>
            
            <p><strong>Third Parties:</strong></p>
            <p>Streams are loaded directly from Twitch's servers. Chat functionality is simulated for demonstration purposes.</p>
            
            <p><strong>Your Privacy:</strong></p>
            <p>No tracking, no analytics, no data sharing with third parties.</p>
        `;
        
        this.showModal('Privacy Policy', privacyText);
    },

    // Show terms modal
    showTermsModal() {
        const termsText = `
            <h3>Terms of Use</h3>
            <p><strong>Stream Content:</strong></p>
            <p>All stream content belongs to the respective broadcasters and is subject to Twitch's Terms of Service.</p>
            
            <p><strong>Usage:</strong></p>
            <p>This application is provided for personal, non-commercial use only.</p>
            
            <p><strong>Limitations:</strong></p>
            <p>Stream availability depends on the M3U8 source file. Some streams may not be available in all regions.</p>
            
            <p><strong>Open Source:</strong></p>
            <p>This project is open source. Feel free to modify and distribute according to the license.</p>
        `;
        
        this.showModal('Terms of Use', termsText);
    },

    // Show credits modal
    showCreditsModal() {
        const creditsText = `
            <h3>Credits & Acknowledgments</h3>
            
            <p><strong>Built With:</strong></p>
            <ul>
                <li>Vanilla JavaScript, HTML5, CSS3</li>
                <li>Twitch API for stream data</li>
                <li>M3U8 playlist parsing</li>
                <li>Responsive design principles</li>
            </ul>
            
            <p><strong>Thanks To:</strong></p>
            <ul>
                <li>Twitch for the streaming platform</li>
                <li>GitHub for hosting</li>
                <li>The open source community</li>
            </ul>
            
            <p><strong>Developer:</strong></p>
            <p>Created as a demonstration project for responsive web design.</p>
        `;
        
        this.showModal('Credits', creditsText);
    },

    // Show modal utility
    showModal(title, content) {
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

        const modalContent = DOMUtils.create('div', {
            className: 'modal-content',
            style: {
                background: 'var(--background-card)',
                padding: 'var(--space-xl)',
                borderRadius: 'var(--border-radius-lg)',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
            }
        }, [
            DOMUtils.create('h3', {
                style: { 
                    marginBottom: 'var(--space-lg)',
                    color: 'var(--primary-color)'
                },
                textContent: title
            }),
            DOMUtils.create('div', {
                innerHTML: content,
                style: {
                    marginBottom: 'var(--space-lg)',
                    lineHeight: '1.6'
                }
            }),
            DOMUtils.create('button', {
                className: 'chat-connect-btn',
                onclick: () => document.body.removeChild(modal),
                textContent: 'Close'
            })
        ]);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

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

    // Show notification
    showNotification(message, type = 'info') {
        if (window.HeaderComponent) {
            HeaderComponent.showNotification(message, type);
        }
    },

    // Update footer layout
    updateLayout() {
        const footer = DOMUtils.get('footer');
        if (!footer) return;

        if (ResponsiveManager.isMobile) {
            DOMUtils.addClass(footer, 'mobile-layout');
        } else {
            DOMUtils.removeClass(footer, 'mobile-layout');
        }
    },

    // Cleanup
    destroy() {
        // Cleanup if needed
    }
};
