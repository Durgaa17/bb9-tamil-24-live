// Stream List Component - UPDATED FIX
const StreamListComponent = {

    // Render streams list - UPDATED with better display
    renderStreams(streams) {
        const streamList = DOMUtils.get('stream-list');
        if (!streamList) return;

        if (streams.length === 0) {
            this.showEmptyState();
            return;
        }

        let html = '';
        
        streams.forEach(stream => {
            const isActive = StreamManager.getCurrentStream()?.id === stream.id;
            const activeClass = isActive ? 'active' : '';
            const expiredClass = stream.isExpired ? 'expired' : '';
            
            // Safe display names
            const safeUsername = stream.safeName || this.escapeHtml(stream.username);
            const safeGame = this.escapeHtml(stream.game);
            
            html += `
                <div class="stream-item ${activeClass} ${expiredClass}" data-stream-id="${stream.id}">
                    <div class="stream-thumbnail">
                        <img src="${stream.thumbnail}" alt="${safeUsername}" onerror="this.style.display='none'">
                        <div class="live-indicator ${stream.isLive && !stream.isExpired ? 'live' : ''}">
                            ${stream.isExpired ? 'EXP' : (stream.isLive ? 'LIVE' : 'OFF')}
                        </div>
                        <div class="viewer-count">
                            ${stream.viewers} viewers
                        </div>
                    </div>
                    <div class="stream-info-compact">
                        <div class="stream-username-compact">
                            ${safeUsername}
                            ${stream.isExpired ? ' ⚠️' : ''}
                        </div>
                        <div class="stream-details-compact">
                            <span class="stream-game-compact">
                                ${safeGame}
                            </span>
                            <div class="stream-status-compact">
                                <span class="status-dot ${stream.isLive && !stream.isExpired ? 'live' : ''}"></span>
                                <span>${stream.displayStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        streamList.innerHTML = html;
        
        // Add click listeners to stream items
        this.setupStreamItemListeners();
        
        // Update stats in header
        if (window.HeaderComponent) {
            HeaderComponent.updateStats();
        }
    },

    // Setup stream item listeners - UPDATED with expiration handling
    setupStreamItemListeners() {
        const streamItems = DOMUtils.findAll('.stream-item');
        
        streamItems.forEach(item => {
            item.addEventListener('click', () => {
                const streamId = item.getAttribute('data-stream-id');
                const stream = StreamManager.getStreamById(streamId);
                
                if (stream) {
                    if (stream.isExpired) {
                        // Show message for expired streams
                        if (window.HeaderComponent) {
                            HeaderComponent.showNotification(
                                'Stream URL expired. Refreshing stream list...', 
                                'error'
                            );
                        }
                        StreamManager.refreshStreams();
                    } else {
                        StreamManager.playStream(stream);
                        this.updateActiveStream(stream);
                        
                        // Scroll item into view on mobile
                        if (ResponsiveManager.isMobile) {
                            ResponsiveManager.scrollToElement(item);
                        }
                    }
                }
            });

            // Add tooltip for expired streams
            if (item.classList.contains('expired')) {
                item.title = 'Stream URL expired - Click to refresh';
            }

            // Add focus styles for TV navigation
            if (ResponsiveManager.isTV) {
                item.addEventListener('focus', () => {
                    DOMUtils.addClass(item, 'focused');
                });
                
                item.addEventListener('blur', () => {
                    DOMUtils.removeClass(item, 'focused');
                });
            }
        });
    },

    // Show empty state - UPDATED
    showEmptyState() {
        const streamList = DOMUtils.get('stream-list');
        if (!streamList) return;

        let message = '';
        let icon = '📺';

        if (this.searchQuery) {
            message = 'No streams match your search criteria';
            icon = '🔍';
        } else if (this.currentFilter === 'live') {
            message = 'No live streams available';
            icon = '⏳';
        } else {
            message = 'No streams available';
            icon = '❌';
        }

        streamList.innerHTML = `
            <div class="stream-list-empty">
                <i>${icon}</i>
                <div>${message}</div>
                ${this.searchQuery || this.currentFilter !== 'all' ? 
                    '<button class="chat-connect-btn" onclick="StreamListComponent.clearFilters()">Clear Filters</button>' : 
                    '<button class="chat-connect-btn" onclick="StreamManager.refreshStreams()">Refresh Streams</button>'
                }
            </div>
        `;
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
    },

    // Rest of the methods remain the same...
    // ... (keep all other existing methods)
};
