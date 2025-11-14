// Chat Component
const ChatComponent = {
    chatIframe: null,
    isVisible: SETTINGS.chat.visible,
    currentStream: null,

    // Initialize chat
    init() {
        this.render();
        this.setupEventListeners();
        this.setupStreamListeners();
        this.applyVisibility();
    },

    // Render chat
    render() {
        const container = DOMUtils.get('chat-container');
        if (!container) return;

        container.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">
                    <i>💬</i>
                    <span>Stream Chat</span>
                </div>
                <div class="chat-actions">
                    <button class="chat-action-btn" data-action="toggle-chat" title="Toggle Chat">
                        <i>👁️</i>
                    </button>
                    <button class="chat-action-btn" data-action="refresh-chat" title="Refresh Chat">
                        <i>🔄</i>
                    </button>
                    <button class="chat-action-btn" data-action="clear-chat" title="Clear Chat">
                        <i>🗑️</i>
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="chat-disconnected">
                    <i>💬</i>
                    <div>No active stream</div>
                    <div class="chat-help">Select a stream to view chat</div>
                </div>
            </div>
            
            <div class="chat-input-container" style="display: none;">
                <div class="chat-input-wrapper">
                    <input 
                        type="text" 
                        class="chat-input" 
                        placeholder="Type a message..." 
                        maxlength="500"
                        disabled
                    >
                    <button class="chat-send-btn" disabled>Send</button>
                </div>
            </div>
        `;
    },

    // Setup event listeners
    setupEventListeners() {
        // Toggle chat visibility
        DOMUtils.on('[data-action="toggle-chat"]', 'click', () => {
            this.toggleVisibility();
        });

        // Refresh chat
        DOMUtils.on('[data-action="refresh-chat"]', 'click', () => {
            this.refreshChat();
        });

        // Clear chat messages
        DOMUtils.on('[data-action="clear-chat"]', 'click', () => {
            this.clearMessages();
        });

        // Chat input
        const chatInput = DOMUtils.find('.chat-input');
        const sendBtn = DOMUtils.find('.chat-send-btn');

        if (chatInput) {
            chatInput.addEventListener('input', () => {
                this.updateSendButton();
            });

            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Responsive layout changes
        ResponsiveManager.on('breakpointChanged', () => {
            this.handleLayoutChange();
        });
    },

    // Setup stream listeners
    setupStreamListeners() {
        StreamManager.on('streamChanged', (stream) => {
            this.setStream(stream);
        });

        StreamManager.on('playStream', (stream) => {
            this.setStream(stream);
        });

        StreamManager.on('stopStream', () => {
            this.clearStream();
        });
    },

    // Set current stream for chat
    setStream(stream) {
        this.currentStream = stream;
        
        if (stream && stream.isLive) {
            this.loadChat(stream);
        } else {
            this.showDisconnectedState();
        }
    },

    // Clear current stream
    clearStream() {
        this.currentStream = null;
        this.showDisconnectedState();
    },

    // Load chat for stream
    loadChat(stream) {
        if (!stream) return;

        const messagesContainer = DOMUtils.get('chat-messages');
        
        // Show loading state
        messagesContainer.innerHTML = `
            <div class="chat-disconnected">
                <i>⏳</i>
                <div>Loading chat for ${stream.username}</div>
                <div class="chat-help">Please wait...</div>
            </div>
        `;

        // For now, show a simulated chat since we can't easily embed Twitch chat without proper authentication
        // In a real implementation, you would use Twitch's embed or IRC connection
        setTimeout(() => {
            this.showSimulatedChat(stream);
        }, 1000);
    },

    // Show simulated chat (placeholder)
    showSimulatedChat(stream) {
        const messagesContainer = DOMUtils.get('chat-messages');
        
        messagesContainer.innerHTML = `
            <div class="chat-message">
                <div class="message-avatar" style="background: #9146ff;">T</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">TwitchBot</span>
                        <span class="message-badge">BOT</span>
                        <span class="message-timestamp">Just now</span>
                    </div>
                    <div class="message-text">
                        Welcome to ${stream.username}'s stream chat! This is a simulated chat interface.
                    </div>
                </div>
            </div>
            <div class="chat-message">
                <div class="message-avatar" style="background: #00ff7f;">V</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">Viewer123</span>
                        <span class="message-timestamp">Just now</span>
                    </div>
                    <div class="message-text">
                        Great stream! Loving the content 👍
                    </div>
                </div>
            </div>
            <div class="chat-message">
                <div class="message-avatar" style="background: #ff4444;">M</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">Moderator</span>
                        <span class="message-badge" style="background: #00ff7f;">MOD</span>
                        <span class="message-timestamp">Just now</span>
                    </div>
                    <div class="message-text">
                        Remember to follow the channel rules everyone!
                    </div>
                </div>
            </div>
        `;

        // Scroll to bottom
        this.scrollToBottom();

        // Show input for simulated interaction
        this.enableChatInput();
    },

    // Show disconnected state
    showDisconnectedState() {
        const messagesContainer = DOMUtils.get('chat-messages');
        const inputContainer = DOMUtils.find('.chat-input-container');
        
        messagesContainer.innerHTML = `
            <div class="chat-disconnected">
                <i>💬</i>
                <div>No active stream</div>
                <div class="chat-help">Select a stream to view chat</div>
            </div>
        `;

        if (inputContainer) {
            DOMUtils.hide(inputContainer);
        }

        this.disableChatInput();
    },

    // Enable chat input
    enableChatInput() {
        const chatInput = DOMUtils.find('.chat-input');
        const sendBtn = DOMUtils.find('.chat-send-btn');
        const inputContainer = DOMUtils.find('.chat-input-container');

        if (inputContainer) {
            DOMUtils.show(inputContainer);
        }

        if (chatInput) {
            chatInput.disabled = false;
            chatInput.placeholder = `Chat as Guest...`;
        }

        if (sendBtn) {
            sendBtn.disabled = false;
        }
    },

    // Disable chat input
    disableChatInput() {
        const chatInput = DOMUtils.find('.chat-input');
        const sendBtn = DOMUtils.find('.chat-send-btn');

        if (chatInput) {
            chatInput.disabled = true;
            chatInput.value = '';
            chatInput.placeholder = 'Chat disabled';
        }

        if (sendBtn) {
            sendBtn.disabled = true;
        }
    },

    // Send message (simulated)
    sendMessage() {
        const chatInput = DOMUtils.find('.chat-input');
        const message = chatInput?.value.trim();

        if (!message || !this.currentStream) return;

        // Add message to chat
        this.addMessage('Guest', message, 'guest');

        // Clear input
        if (chatInput) {
            chatInput.value = '';
            this.updateSendButton();
        }

        // Simulate responses
        this.simulateResponse(message);
    },

    // Add message to chat
    addMessage(username, text, type = 'viewer') {
        const messagesContainer = DOMUtils.get('chat-messages');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageEl = DOMUtils.create('div', {
            className: `chat-message ${type === 'mod' ? 'message-highlighted' : ''}`
        }, [
            DOMUtils.create('div', {
                className: 'message-avatar',
                style: { background: this.getUserColor(username) },
                textContent: username.charAt(0).toUpperCase()
            }),
            DOMUtils.create('div', { className: 'message-content' }, [
                DOMUtils.create('div', { className: 'message-header' }, [
                    DOMUtils.create('span', { 
                        className: 'message-username',
                        textContent: username
                    }),
                    type === 'mod' ? DOMUtils.create('span', {
                        className: 'message-badge',
                        style: { background: '#00ff7f' },
                        textContent: 'MOD'
                    }) : null,
                    DOMUtils.create('span', {
                        className: 'message-timestamp',
                        textContent: timestamp
                    })
                ]),
                DOMUtils.create('div', { 
                    className: 'message-text',
                    textContent: text
                })
            ])
        ]);

        messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    },

    // Simulate chat response
    simulateResponse(userMessage) {
        const responses = [
            "Thanks for watching!",
            "Great point!",
            "I agree!",
            "What do you think about this?",
            "Thanks for the feedback!",
            "Awesome! 🎉"
        ];

        // Random delay before response
        setTimeout(() => {
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addMessage('StreamerBot', randomResponse, 'mod');
        }, 1000 + Math.random() * 2000);
    },

    // Update send button state
    updateSendButton() {
        const chatInput = DOMUtils.find('.chat-input');
        const sendBtn = DOMUtils.find('.chat-send-btn');
        
        if (chatInput && sendBtn) {
            const hasText = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasText;
        }
    },

    // Scroll chat to bottom
    scrollToBottom() {
        const messagesContainer = DOMUtils.get('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },

    // Get user color for avatar
    getUserColor(username) {
        const colors = [
            '#9146ff', '#00ff7f', '#ff4444', '#ffaa00', '#00aaff', '#ff00aa'
        ];
        const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    },

    // Toggle chat visibility
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        SETTINGS.update('chat.visible', this.isVisible);
        this.applyVisibility();
        
        // Notify other components
        if (this.onVisibilityChange) {
            this.onVisibilityChange(this.isVisible);
        }
    },

    // Apply visibility state
    applyVisibility() {
        const container = DOMUtils.get('chat-container');
        if (!container) return;

        if (this.isVisible) {
            DOMUtils.show(container);
        } else {
            DOMUtils.hide(container);
        }

        this.updateToggleButton();
    },

    // Update toggle button
    updateToggleButton() {
        const toggleBtn = DOMUtils.find('[data-action="toggle-chat"] i');
        if (toggleBtn) {
            toggleBtn.textContent = this.isVisible ? '👁️' : '👁️‍🗨️';
        }
    },

    // Refresh chat
    refreshChat() {
        if (this.currentStream) {
            this.loadChat(this.currentStream);
        }
    },

    // Clear chat messages
    clearMessages() {
        const messagesContainer = DOMUtils.get('chat-messages');
        if (messagesContainer) {
            if (this.currentStream) {
                this.showSimulatedChat(this.currentStream);
            } else {
                this.showDisconnectedState();
            }
        }
    },

    // Handle layout changes
    handleLayoutChange() {
        if (ResponsiveManager.isMobile) {
            // Auto-hide chat on mobile if not enough space
            if (window.innerHeight < 500) {
                this.isVisible = false;
                this.applyVisibility();
            }
        }
    },

    // Set visibility change callback
    onVisibilityChange: null,

    // Cleanup
    destroy() {
        // Cleanup if needed
    }
};
