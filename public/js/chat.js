/**
 * Virtual Girlfriend Chat Controller
 * Three Column Layout Implementation
 */

// API Configuration
const API_BASE_URL = '';

// Character Data
const CHARACTERS = {
  yuki: {
    id: 'yuki',
    name: 'Yuki',
    name_zh: '雪',
    avatar: 'images/yuki.png',
    tags: ['Gentle', 'Caring', 'Shy'],
    tags_zh: ['温柔', '体贴', '害羞'],
    greeting: "Honey, I'm right here~ Do you want to talk to me?",
    greeting_zh: '亲爱的，我在这里呢~ 你想和我说说话吗？'
  },
  aria: {
    id: 'aria',
    name: 'Aria',
    name_zh: '艾莉亚',
    avatar: 'images/aria.png',
    tags: ['Cool', 'Mysterious', 'Tsundere'],
    tags_zh: ['酷', '神秘', '傲娇'],
    greeting: "Hey there! Ready for some fun?",
    greeting_zh: '嗨！准备好来点有趣的了吗？'
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    name_zh: '露娜',
    avatar: 'images/luna.png',
    tags: ['Elegant', 'Intellectual', 'Mature'],
    tags_zh: ['优雅', '知性', '成熟'],
    greeting: "Welcome to my world... I'm Luna.",
    greeting_zh: '欢迎来到我的世界... 我是露娜。'
  }
};

// Translations
const TRANSLATIONS = {
  en: {
    myChats: 'My Chats',
    online: 'Online',
    typeMessage: 'Type a message...',
    send: 'Send',
    requestPhoto: 'Request Photo',
    clearHistory: 'Clear Chat History',
    vipOnly: 'VIP Only',
    login: 'Login',
    logout: 'Logout',
    welcome: 'Welcome',
    loadingMessage: 'Upgrading to VIP for faster responses...',
    apiError: 'Sorry, the service is temporarily unavailable.',
    newChat: 'New Chat',
    // Photo Request Dialog
    chooseOutfit: '👗 Choose Outfit',
    chooseAccessories: '💍 Choose Accessories',
    generating: 'Generating your photo...',
    photoReady: 'Your photo is ready!',
    download: 'Download',
    sendToChat: 'Send to Chat',
    cancel: 'Cancel',
    generate: 'Generate'
  },
  zh: {
    myChats: '我的聊天',
    online: '在线',
    typeMessage: '输入消息...',
    send: '发送',
    requestPhoto: '请求照片',
    clearHistory: '清空聊天记录',
    vipOnly: '会员专享',
    login: '登录',
    logout: '退出',
    welcome: '欢迎',
    loadingMessage: '升级会员以解锁更快的回复速度...',
    apiError: '抱歉，服务暂时不可用。',
    newChat: '新对话',
    // Photo Request Dialog
    chooseOutfit: '👗 选择服装',
    chooseAccessories: '💍 选择饰品',
    generating: '正在生成照片...',
    photoReady: '照片已生成！',
    download: '下载',
    sendToChat: '发送到聊天',
    cancel: '取消',
    generate: '生成'
  }
};

// Wardrobe Data (Clothing and Accessories)
const WARDROBE = {
  clothing: [
    { id: 'casual_1', icon: '👗', name: 'Dress', name_zh: '连衣裙' },
    { id: 'casual_2', icon: '👚', name: 'T-Shirt', name_zh: 'T恤' },
    { id: 'casual_3', icon: '🧥', name: 'Jacket', name_zh: '外套' },
    { id: 'formal_1', icon: '👔', name: 'Suit', name_zh: '正装' },
    { id: 'formal_2', icon: '👗', name: 'Evening', name_zh: '晚礼服' },
    { id: 'sport_1', icon: '🎽', name: 'Sportswear', name_zh: '运动装' },
    { id: 'sleep_1', icon: '🛌', name: 'Sleepwear', name_zh: '睡衣' },
    { id: 'swim_1', icon: '👙', name: 'Swimwear', name_zh: '泳装' }
  ],
  accessories: [
    { id: 'necklace_1', icon: '📿', name: 'Necklace', name_zh: '项链' },
    { id: 'earrings_1', icon: '💎', name: 'Earrings', name_zh: '耳环' },
    { id: 'glasses_1', icon: '👓', name: 'Glasses', name_zh: '眼镜' },
    { id: 'hat_1', icon: '🎩', name: 'Hat', name_zh: '帽子' },
    { id: 'hair_1', icon: '🎀', name: 'Hairpin', name_zh: '发夹' },
    { id: 'watch_1', icon: '⌚', name: 'Watch', name_zh: '手表' },
    { id: 'bag_1', icon: '👜', name: 'Handbag', name_zh: '手提包' },
    { id: 'scarf_1', icon: '🧣', name: 'Scarf', name_zh: '围巾' }
  ]
};

// ============================================
// Chat Controller Class
// ============================================
class ChatController {
  constructor() {
    // State
    this.currentCharacter = null;
    this.sessions = [];
    this.messages = [];
    this.currentUser = null;
    this.lang = 'en';
    
    // DOM Elements
    this.elements = {
      sessionList: document.getElementById('session-list'),
      chatMessages: document.getElementById('chat-messages'),
      messageInput: document.getElementById('message-input'),
      sendBtn: document.getElementById('send-btn'),
      voiceBtn: document.getElementById('voice-btn'),
      charCounter: document.getElementById('char-counter'),
      chatTitle: document.getElementById('chat-title'),
      chatAvatar: document.getElementById('chat-avatar'),
      profileName: document.getElementById('profile-name'),
      profileAvatar: document.getElementById('profile-avatar'),
      profileTags: document.getElementById('profile-tags'),
      langSwitch: document.getElementById('lang-switch'),
      authBtn: document.getElementById('auth-btn'),
      sidebarAuthBtn: document.getElementById('sidebar-auth-btn'),
      vipBtn: document.getElementById('vip-btn'),
      vipModal: document.getElementById('vip-modal'),
      sidebar: document.getElementById('sidebar'),
      infoPanel: document.getElementById('info-panel'),
      menuBtn: document.getElementById('menu-btn')
    };
    
    this.init();
  }
  
  // ============================================
  // Initialization
  // ============================================
  async init() {
    this.detectLanguage();
    this.checkAuth();
    this.getCurrentCharacter();
    this.bindEvents();
    await this.loadSessions();
    await this.loadMessages();
  }
  
  detectLanguage() {
    const saved = localStorage.getItem('lang');
    this.lang = saved || 'en';
    this.updateLangSwitch();
  }
  
  checkAuth() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        this.currentUser = null;
      }
    }
    this.updateAuthButton();
    
    // Fetch latest user status from API
    this.refreshUserStatus();
  }
  
  async refreshUserStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        this.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        this.updateAuthButton();
      }
    } catch (e) {
      console.error('Failed to refresh user status:', e);
    }
  }
  
  getCurrentCharacter() {
    const params = new URLSearchParams(window.location.search);
    const charParam = params.get('char');
    const savedChar = localStorage.getItem('selectedChar');
    
    this.currentCharacter = charParam || savedChar || 'yuki';
    localStorage.setItem('selectedChar', this.currentCharacter);
  }
  
  // ============================================
  // API Methods
  // ============================================
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
  
  async loadSessions() {
    try {
      // For now, use local data since API may not be updated yet
      // In production, this would call: GET /api/chat/sessions
      
      // Simulate sessions from localStorage
      const savedSessions = JSON.parse(localStorage.getItem('chat_sessions') || '{}');
      this.sessions = Object.keys(CHARACTERS).map(charId => ({
        character_id: charId,
        character_name: CHARACTERS[charId].name,
        character_avatar: CHARACTERS[charId].avatar,
        last_message: savedSessions[charId]?.lastMessage || CHARACTERS[charId].greeting.substring(0, 30) + '...',
        last_message_at: savedSessions[charId]?.lastMessageAt || new Date().toISOString()
      }));
      
      this.renderSessionList();
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = Object.values(CHARACTERS).map(c => ({
        character_id: c.id,
        character_name: c.name,
        character_avatar: c.avatar,
        last_message: c.greeting.substring(0, 30) + '...',
        last_message_at: new Date().toISOString()
      }));
      this.renderSessionList();
    }
  }
  
  async loadMessages() {
    try {
      // Load from localStorage for now (will be API later)
      const key = `chatHistory_${this.currentCharacter}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        this.messages = JSON.parse(saved);
      } else {
        // Show greeting for new conversation
        const char = CHARACTERS[this.currentCharacter];
        const greeting = this.lang === 'zh' ? char.greeting_zh : char.greeting;
        this.messages = [{ role: 'assistant', content: greeting }];
      }
      
      this.renderMessages();
      this.updateCharacterInfo();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }
  
  async sendMessage(content) {
    if (!content.trim()) return;
    
    // Add user message
    this.addMessage('user', content);
    this.elements.messageInput.value = '';
    this.updateCharCounter();
    
    // Show loading animation
    const loadingDiv = this.showLoadingMessage();
    
    try {
      // Prepare history for context
      const history = this.messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));
      
      // Call API
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message: content,
          history: history.slice(0, -1), // Exclude current message
          character: this.currentCharacter
        })
      });
      
      const data = await response.json();
      
      // Remove loading
      this.removeLoadingMessage(loadingDiv);
      
      // Handle image placeholder response
      if (data.type === 'image_placeholder') {
        // Select message based on current language
        const messageContent = this.lang === 'zh' ? data.message_zh : data.message_en;
        const replyContent = this.lang === 'zh' ? data.reply_zh : data.reply_en;
        
        // Add placeholder message
        const placeholderMsg = {
          role: 'assistant',
          type: 'image_placeholder',
          generation_id: data.generation_id,
          character_id: data.character_id,
          content: messageContent || replyContent,
          created_at: new Date().toISOString()
        };
        this.messages.push(placeholderMsg);
        this.renderMessages();
        
        // Start polling for image status
        this.pollImageStatus(data.generation_id, placeholderMsg);
        
        // Play TTS for the placeholder message (use English TTS text)
        await this.playTTS(replyContent || messageContent);
      } else if (data.reply) {
        this.addMessage('assistant', data.reply);
        await this.playTTS(data.reply);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Send message error:', error);
      this.removeLoadingMessage(loadingDiv);
      this.addMessage('assistant', this.t('apiError'), false);
    }
  }
  
  // ============================================
  // TTS (Text-to-Speech)
  // ============================================
  async playTTS(text) {
    try {
      const cleanText = text.replace(/\*([^*]+)\*/g, '').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.log('Audio play failed:', e));
        audio.onended = () => URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  }
  
  // ============================================
  // UI Rendering
  // ============================================
  renderSessionList() {
    const html = this.sessions.map(session => {
      const isActive = session.character_id === this.currentCharacter;
      const char = CHARACTERS[session.character_id];
      const name = this.lang === 'zh' ? char?.name_zh : session.character_name;
      
      return `
        <div class="session-item ${isActive ? 'session-item--active' : ''}" 
             data-char="${session.character_id}">
          <div class="session-avatar">
            <img src="${session.character_avatar}" alt="${name}">
            <span class="online-dot"></span>
          </div>
          <div class="session-info">
            <div class="session-name">${name}</div>
            <div class="session-preview">${this.escapeHtml(session.last_message)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    this.elements.sessionList.innerHTML = html;
  }
  
  renderMessages() {
    // Preserve messageInput if it's inside chatMessages (it shouldn't be, but handle just in case)
    const messageInput = this.elements.messageInput;
    let messageInputParent = null;
    let messageInputNextSibling = null;
    
    // Check if messageInput is inside chatMessages
    if (this.elements.chatMessages.contains(messageInput)) {
      // Store its position
      messageInputParent = messageInput.parentNode;
      messageInputNextSibling = messageInput.nextSibling;
      
      // Remove it from chatMessages temporarily
      messageInputParent.removeChild(messageInput);
    }
    
    const html = this.messages.map((msg, index) => {
      const isUser = msg.role === 'user';
      const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      
      // Handle image placeholder
      if (msg.type === 'image_placeholder') {
        const char = CHARACTERS[msg.character_id] || CHARACTERS.yuki;
        const charName = this.lang === 'zh' ? char.name_zh : char.name;
        
        return `
          <div class="message message--ai message--placeholder" data-generation-id="${msg.generation_id}">
            <div class="message__avatar">
              <img src="${char.avatar}" alt="${charName}">
            </div>
            <div class="message__content-wrapper">
              <div class="message__sender">${charName}</div>
              <div class="image-placeholder-card">
                <div class="placeholder-animation">
                  <div class="camera-icon">📷</div>
                  <div class="placeholder-text">${this.escapeHtml(msg.content)}</div>
                  <div class="placeholder-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
              ${time ? `<span class="message__time">${time}</span>` : ''}
            </div>
          </div>
        `;
      }
      
      // Handle completed image message
      if (msg.type === 'image') {
        const char = CHARACTERS[msg.character_id] || CHARACTERS.yuki;
        const charName = this.lang === 'zh' ? char.name_zh : char.name;
        
        // VIP sees clear image, non-VIP sees blurred image
        const isVip = msg.is_vip;
        const imageUrl = isVip ? msg.image_url : (msg.blur_url || msg.image_url);
        
        if (isVip) {
          // VIP image view
          return `
            <div class="message message--ai message--image">
              <div class="message__avatar">
                <img src="${char.avatar}" alt="${charName}">
              </div>
              <div class="message__content-wrapper">
                <div class="message__sender">${charName}</div>
                <div class="chat-image vip-image">
                  <img src="${imageUrl}" alt="Generated image" loading="lazy" onclick="window.open('${imageUrl}', '_blank')">
                  <div class="image-actions">
                    <button class="download-btn" onclick="event.stopPropagation(); window.open('${imageUrl}', '_blank')">
                      ⬇️ ${this.lang === 'zh' ? '查看原图' : 'View'}
                    </button>
                  </div>
                </div>
                ${time ? `<span class="message__time">${time}</span>` : ''}
              </div>
            </div>
          `;
        } else {
          // Non-VIP blurred image with upgrade prompt
          return `
            <div class="message message--ai message--image">
              <div class="message__avatar">
                <img src="${char.avatar}" alt="${charName}">
              </div>
              <div class="message__content-wrapper">
                <div class="message__sender">${charName}</div>
                <div class="chat-image blur-image" onclick="chatController.showVipModalForImage('${imageUrl}')">
                  <img src="${imageUrl}" alt="Blurred image" class="blurred" loading="lazy">
                  <div class="blur-overlay">
                    <div class="lock-icon">🔒</div>
                    <button class="upgrade-btn" onclick="event.stopPropagation(); chatController.showVipModalForImage('${imageUrl}')">
                      <span class="crown">👑</span>
                      ${this.lang === 'zh' ? '升级 VIP 解锁高清图' : 'Upgrade VIP to Unlock'}
                    </button>
                  </div>
                </div>
                ${time ? `<span class="message__time">${time}</span>` : ''}
              </div>
            </div>
          `;
        }
      }
      
      // Handle image error
      if (msg.type === 'image_error') {
        const char = CHARACTERS.yuki;
        const charName = this.lang === 'zh' ? char.name_zh : char.name;
        
        return `
          <div class="message message--ai message--error">
            <div class="message__avatar">
              <img src="${char.avatar}" alt="${charName}">
            </div>
            <div class="message__content-wrapper">
              <div class="message__sender">${charName}</div>
              <div class="image-error-card">
                <div class="error-icon">⚠️</div>
                <div class="error-text">${this.escapeHtml(msg.content)}</div>
                <button class="retry-btn" onclick="chatController.retryImageGeneration(${msg.generation_id})">
                  🔄 ${this.lang === 'zh' ? '重试' : 'Retry'}
                </button>
              </div>
              ${time ? `<span class="message__time">${time}</span>` : ''}
            </div>
          </div>
        `;
      }
      
      // Check if message contains an image (legacy format)
      if (msg.image) {
        return `
          <div class="message message--ai message--photo">
            <div class="message__content">
              <img src="${msg.image}" alt="Photo" class="message__image" onclick="window.open('${msg.image}', '_blank')">
            </div>
            ${time ? `<span class="message__time">${time}</span>` : ''}
          </div>
        `;
      }
      
      // Standard text message
      const char = !isUser ? CHARACTERS[this.currentCharacter] : null;
      const charName = char ? (this.lang === 'zh' ? char.name_zh : char.name) : '';
      
      return `
        <div class="message message--${isUser ? 'user' : 'ai'}">
          ${!isUser ? `<div class="message__avatar"><img src="${char.avatar}" alt="${charName}"></div>` : ''}
          <div class="message__content-wrapper">
            ${!isUser ? `<div class="message__sender">${charName}</div>` : ''}
            <div class="message__content">${this.escapeHtml(msg.content)}</div>
            ${time ? `<span class="message__time">${time}</span>` : ''}
          </div>
          ${isUser ? `
            <button class="message__delete" data-index="${index}" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
    
    this.elements.chatMessages.innerHTML = html;
    
    // Check if there are any images that need to be loaded
    const images = this.elements.chatMessages.querySelectorAll('img[loading="lazy"]');
    if (images.length > 0) {
      let loadedCount = 0;
      const totalImages = images.length;
      
      images.forEach(img => {
        // Remove lazy loading for chat images to ensure they load immediately
        img.removeAttribute('loading');
        
        if (img.complete) {
          loadedCount++;
          if (loadedCount === totalImages) {
            this.scrollToBottom();
          }
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              this.scrollToBottom();
            }
          });
          img.addEventListener('error', () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              this.scrollToBottom();
            }
          });
        }
      });
      
      // Fallback: scroll after a short delay even if images haven't loaded
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
     } else {
       this.scrollToBottom();
     }
     
     // Restore messageInput if it was temporarily removed
     if (messageInputParent && messageInputNextSibling) {
       messageInputParent.insertBefore(messageInput, messageInputNextSibling);
     } else if (messageInputParent) {
       messageInputParent.appendChild(messageInput);
     }
   }
  
  // Show VIP modal for image unlock
  showVipModalForImage(blurImageUrl) {
    // Store the image URL for potential use in modal
    this.pendingImageUrl = blurImageUrl;
    
    // Show the existing VIP modal
    const vipModal = document.getElementById('vip-modal');
    if (vipModal) {
      vipModal.style.display = 'flex';
      vipModal.classList.add('modal--active');
    }
  }
  
  // Retry image generation
  async retryImageGeneration(generationId) {
    // Remove the error message
    const msgIndex = this.messages.findIndex(m => 
      m.type === 'image_error' && m.generation_id === generationId
    );
    
    if (msgIndex !== -1) {
      // Remove error message
      this.messages.splice(msgIndex, 1);
      
      // Add new placeholder
      const char = CHARACTERS[this.currentCharacter];
      const placeholderMsg = {
        role: 'assistant',
        type: 'image_placeholder',
        generation_id: generationId,
        character_id: this.currentCharacter,
        content: this.lang === 'zh' ? `${char.name_zh} 正在重新准备...` : `${char.name} is preparing again...`,
        created_at: new Date().toISOString()
      };
      
      this.messages.splice(msgIndex, 0, placeholderMsg);
      this.renderMessages();
      
      // Start polling again
      this.pollImageStatus(generationId, placeholderMsg);
    }
  }
  
  addMessage(role, content, save = true) {
    const message = {
      role,
      content,
      created_at: new Date().toISOString()
    };
    
    this.messages.push(message);
    this.renderMessages();
    
    if (save) {
      this.saveMessages();
    }
  }
  
  // ============================================
  // Image Generation
  // ============================================
  
  // Poll for image generation status
  async pollImageStatus(generationId, placeholderMsg) {
    const maxAttempts = 60; // Max 60 seconds
    const interval = 1000; // Check every second
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, interval));
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/image/status/${generationId}`, {
          headers: this.getHeaders()
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          // Find and update the placeholder message
          const msgIndex = this.messages.findIndex(m => 
            m.type === 'image_placeholder' && m.generation_id === generationId
          );
          
          if (msgIndex !== -1) {
            // Replace placeholder with actual image message
            this.messages[msgIndex] = {
              role: 'assistant',
              type: 'image',
              generation_id: generationId,
              character_id: data.character_id,
              content: data.image_url || data.blur_url,
              image_url: data.image_url,
              blur_url: data.blur_url,
              is_vip: data.is_vip,
              requires_vip: data.requires_vip,
              width: data.width,
              height: data.height,
              created_at: new Date().toISOString()
            };
            this.renderMessages();
            
            // Play notification sound for VIP users
            if (data.is_vip) {
              this.playNotificationSound();
            }
          }
          return;
        }
        
        if (data.status === 'failed') {
          // Update placeholder with error
          const msgIndex = this.messages.findIndex(m => 
            m.type === 'image_placeholder' && m.generation_id === generationId
          );
          
          if (msgIndex !== -1) {
            this.messages[msgIndex] = {
              role: 'assistant',
              type: 'image_error',
              generation_id: generationId,
              content: data.error || '图片生成失败，请重试',
              created_at: new Date().toISOString()
            };
            this.renderMessages();
            this.scrollToBottom();
          }
          return;
        }
        
        // Still processing, continue polling
      } catch (error) {
        console.error('Poll image status error:', error);
      }
    }
    
    // Timeout
    const msgIndex = this.messages.findIndex(m => 
      m.type === 'image_placeholder' && m.generation_id === generationId
    );
    
    if (msgIndex !== -1) {
      this.messages[msgIndex] = {
        role: 'assistant',
        type: 'image_error',
        generation_id: generationId,
        content: '生成超时，请重试',
        created_at: new Date().toISOString()
      };
      this.renderMessages();
      this.scrollToBottom();
    }
  }
  
  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  }
  
  updateCharacterInfo() {
    const char = CHARACTERS[this.currentCharacter];
    if (!char) return;
    
    const name = this.lang === 'zh' ? char.name_zh : char.name;
    const tags = this.lang === 'zh' ? char.tags_zh : char.tags;
    
    this.elements.chatTitle.textContent = name;
    this.elements.chatAvatar.src = char.avatar;
    this.elements.profileName.textContent = name;
    this.elements.profileAvatar.src = char.avatar;
    
    this.elements.profileTags.innerHTML = tags.map(tag => 
      `<span class="tag">${tag}</span>`
    ).join('');
  }
  
  showLoadingMessage() {
    const div = document.createElement('div');
    div.className = 'message message--ai message--loading';
    div.innerHTML = `
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <div class="loading-text">${this.t('loadingMessage')}</div>
    `;
    this.elements.chatMessages.appendChild(div);
    this.scrollToBottom();
    return div;
  }
  
  removeLoadingMessage(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  
  // ============================================
  // Event Handlers
  // ============================================
  bindEvents() {
    // Send message
    this.elements.sendBtn.addEventListener('click', () => {
      this.sendMessage(this.elements.messageInput.value);
    });
    
    this.elements.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(this.elements.messageInput.value);
      }
    });
    
    // Character counter
    this.elements.messageInput.addEventListener('input', () => {
      this.updateCharCounter();
    });
    
    // Session selection
    this.elements.sessionList.addEventListener('click', (e) => {
      const item = e.target.closest('.session-item');
      if (item) {
        this.switchCharacter(item.dataset.char);
        // Auto-hide sidebar on mobile after selection
        if (window.innerWidth <= 1024) {
          this.elements.sidebar.classList.remove('open');
        }
      }
    });
    
    // Language switch
    this.elements.langSwitch.addEventListener('click', () => {
      this.toggleLanguage();
    });
    
    // Auth button (desktop)
    this.elements.authBtn.addEventListener('click', () => {
      this.handleAuth();
    });
    
    // Auth button (sidebar/mobile)
    this.elements.sidebarAuthBtn.addEventListener('click', () => {
      this.handleAuth();
      // Close sidebar on mobile after clicking login
      if (window.innerWidth <= 1024) {
        this.elements.sidebar.classList.remove('open');
      }
    });
    
    // VIP button
    this.elements.vipBtn.addEventListener('click', () => {
      this.showVipModal();
    });
    
    // Voice input button - handled by VoiceInputController
    // (initialized in the VoiceInputController class)
    
    // Call button - handled by VoiceCallController
    // (initialized in the VoiceCallController class)
    
    // Request photo button - VIP opens dialog, non-VIP shows upgrade prompt
    document.getElementById('request-photo-btn').addEventListener('click', () => {
      if (this.currentUser?.is_vip) {
        // VIP user - open photo request dialog
        if (window.photoRequestController) {
          window.photoRequestController.open();
        }
      } else {
        // Non-VIP user - show upgrade prompt
        this.showVipModal();
      }
    });
    
    // Mobile menu
    this.elements.menuBtn.addEventListener('click', () => {
      this.elements.sidebar.classList.toggle('open');
    });
    
    // VIP modal close
    document.getElementById('vip-modal-close').addEventListener('click', () => {
      this.hideVipModal();
    });
    
    document.getElementById('vip-modal-upgrade').addEventListener('click', () => {
      window.location.href = 'pricing.html';
    });
    
    // Clear history
    document.getElementById('clear-history-btn').addEventListener('click', () => {
      this.clearHistory();
    });
    
    // Media click (VIP check)
    document.getElementById('media-grid').addEventListener('click', (e) => {
      const item = e.target.closest('.media-item--locked');
      if (item) {
        if (this.currentUser?.is_vip) {
          // Unlock media
          item.classList.remove('media-item--locked');
          item.classList.add('media-item--unlocked');
        } else {
          this.showVipModal();
        }
      }
    });
  }
  
  // ============================================
  // Actions
  // ============================================
  async switchCharacter(charId) {
    if (charId === this.currentCharacter) return;
    
    this.currentCharacter = charId;
    localStorage.setItem('selectedChar', charId);
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('char', charId);
    window.history.pushState({}, '', url);
    
    // Reload messages
    await this.loadMessages();
    this.renderSessionList();
  }
  
  toggleLanguage() {
    this.lang = this.lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', this.lang);
    this.updateLangSwitch();
    this.updateCharacterInfo();
    this.renderSessionList();
  }
  
  updateLangSwitch() {
    this.elements.langSwitch.textContent = this.lang === 'en' ? 'EN/中' : '中/EN';
  }
  
  handleAuth() {
    if (this.currentUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.currentUser = null;
      this.updateAuthButton();
    } else {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `auth.html?redirect=${encodeURIComponent(currentUrl)}`;
    }
  }
  
  updateAuthButton() {
    const text = this.currentUser ? this.t('logout') : this.t('login');
    this.elements.authBtn.textContent = text;
    this.elements.sidebarAuthBtn.textContent = text;
  }
  
  // Check if user is a valid VIP (not expired)
  isVip() {
    if (!this.currentUser) return false;
    
    // Check is_vip flag (could be 1, true, or '1')
    const isVipFlag = this.currentUser.is_vip === 1 || 
                      this.currentUser.is_vip === true || 
                      this.currentUser.is_vip === '1';
    
    if (!isVipFlag) return false;
    
    // Check if VIP is not expired
    if (this.currentUser.vip_expires_at) {
      const expiresAt = new Date(this.currentUser.vip_expires_at);
      if (expiresAt < new Date()) {
        return false;
      }
    }
    
    return true;
  }
  
  showVipModal() {
    this.elements.vipModal.style.display = 'flex';
    const char = CHARACTERS[this.currentCharacter];
    document.getElementById('vip-modal-img').src = char?.avatar || 'images/yuki.png';
  }
  
  hideVipModal() {
    this.elements.vipModal.style.display = 'none';
  }
  
  clearHistory() {
    if (confirm('Clear all chat history for this character?')) {
      const key = `chatHistory_${this.currentCharacter}`;
      localStorage.removeItem(key);
      this.messages = [];
      
      const char = CHARACTERS[this.currentCharacter];
      const greeting = this.lang === 'zh' ? char.greeting_zh : char.greeting;
      this.messages = [{ role: 'assistant', content: greeting }];
      
      this.renderMessages();
    }
  }
  
  saveMessages() {
    const key = `chatHistory_${this.currentCharacter}`;
    localStorage.setItem(key, JSON.stringify(this.messages));
  }
  
  scrollToBottom() {
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }
  
  updateCharCounter() {
    const len = this.elements.messageInput.value.length;
    this.elements.charCounter.textContent = `${len} / 240`;
  }
  
  // ============================================
  // Utilities
  // ============================================
  t(key) {
    return TRANSLATIONS[this.lang][key] || TRANSLATIONS['en'][key] || key;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================
// Photo Request Dialog Controller
// ============================================
class PhotoRequestController {
  constructor(chatController) {
    this.chatController = chatController;
    this.selectedClothing = null;
    this.selectedAccessories = [];
    this.resultImageUrl = null;
    
    this.elements = {
      dialog: document.getElementById('photo-dialog'),
      closeBtn: document.getElementById('photo-dialog-close'),
      clothingGrid: document.getElementById('clothing-grid'),
      accessoriesGrid: document.getElementById('accessories-grid'),
      selectionView: document.getElementById('photo-selection-view'),
      generatingView: document.getElementById('photo-generating-view'),
      resultView: document.getElementById('photo-result-view'),
      resultImage: document.getElementById('result-image'),
      cancelBtn: document.getElementById('photo-cancel'),
      generateBtn: document.getElementById('photo-generate'),
      downloadBtn: document.getElementById('download-btn'),
      sendToChatBtn: document.getElementById('send-to-chat-btn')
    };
    
    this.init();
  }
  
  init() {
    this.renderWardrobe();
    this.bindEvents();
  }
  
  renderWardrobe() {
    const lang = this.chatController.lang;
    
    // Render clothing
    this.elements.clothingGrid.innerHTML = WARDROBE.clothing.map(item => `
      <div class="wardrobe-item" data-id="${item.id}" data-type="clothing">
        <span class="icon">${item.icon}</span>
        <span class="name">${item.name}</span>
        <span class="name-zh">${item.name_zh}</span>
      </div>
    `).join('');
    
    // Render accessories
    this.elements.accessoriesGrid.innerHTML = WARDROBE.accessories.map(item => `
      <div class="wardrobe-item" data-id="${item.id}" data-type="accessory">
        <span class="icon">${item.icon}</span>
        <span class="name">${item.name}</span>
        <span class="name-zh">${item.name_zh}</span>
      </div>
    `).join('');
  }
  
  bindEvents() {
    // Close button
    this.elements.closeBtn.addEventListener('click', () => this.close());
    this.elements.cancelBtn.addEventListener('click', () => this.close());
    
    // Click outside to close
    this.elements.dialog.addEventListener('click', (e) => {
      if (e.target === this.elements.dialog) {
        this.close();
      }
    });
    
    // Wardrobe selection
    this.elements.clothingGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.wardrobe-item');
      if (item) {
        this.selectClothing(item.dataset.id);
      }
    });
    
    this.elements.accessoriesGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.wardrobe-item');
      if (item) {
        this.selectAccessory(item.dataset.id);
      }
    });
    
    // Generate button
    this.elements.generateBtn.addEventListener('click', () => this.generate());
    
    // Download button
    this.elements.downloadBtn.addEventListener('click', () => this.download());
    
    // Send to chat button
    this.elements.sendToChatBtn.addEventListener('click', () => this.sendToChat());
  }
  
  selectClothing(id) {
    // Remove previous selection
    this.elements.clothingGrid.querySelectorAll('.wardrobe-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Add new selection
    const selectedItem = this.elements.clothingGrid.querySelector(`[data-id="${id}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
      this.selectedClothing = id;
    }
    
    this.updateGenerateButton();
  }
  
  selectAccessory(id) {
    const item = this.elements.accessoriesGrid.querySelector(`[data-id="${id}"]`);
    if (!item) return;
    
    // Toggle selection (multi-select for accessories)
    if (this.selectedAccessories.includes(id)) {
      item.classList.remove('selected');
      this.selectedAccessories = this.selectedAccessories.filter(a => a !== id);
    } else {
      item.classList.add('selected');
      this.selectedAccessories.push(id);
    }
  }
  
  updateGenerateButton() {
    this.elements.generateBtn.disabled = !this.selectedClothing;
  }
  
  open() {
    this.reset();
    this.elements.dialog.style.display = 'flex';
  }
  
  close() {
    this.elements.dialog.style.display = 'none';
  }
  
  reset() {
    this.selectedClothing = null;
    this.selectedAccessories = [];
    this.resultImageUrl = null;
    
    // Clear selections
    this.elements.clothingGrid.querySelectorAll('.wardrobe-item').forEach(item => {
      item.classList.remove('selected');
    });
    this.elements.accessoriesGrid.querySelectorAll('.wardrobe-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Reset views
    this.showSelectionView();
    this.updateGenerateButton();
  }
  
  showSelectionView() {
    this.elements.selectionView.style.display = 'block';
    this.elements.generatingView.style.display = 'none';
    this.elements.resultView.style.display = 'none';
    document.getElementById('photo-dialog-footer').style.display = 'flex';
  }
  
  showGeneratingView() {
    this.elements.selectionView.style.display = 'none';
    this.elements.generatingView.style.display = 'flex';
    this.elements.resultView.style.display = 'none';
    document.getElementById('photo-dialog-footer').style.display = 'none';
  }
  
  showResultView() {
    this.elements.selectionView.style.display = 'none';
    this.elements.generatingView.style.display = 'none';
    this.elements.resultView.style.display = 'flex';
    document.getElementById('photo-dialog-footer').style.display = 'none';
  }
  
  async generate() {
    if (!this.selectedClothing) return;
    
    this.showGeneratingView();
    
    try {
      // Call real API
      const result = await this.callGenerateApi();
      
      if (result.result_url) {
        this.resultImageUrl = result.result_url;
        this.elements.resultImage.src = result.result_url;
        this.showResultView();
      } else {
        throw new Error('No result URL returned');
      }
    } catch (error) {
      console.error('Photo generation error:', error);
      
      // Fallback to demo image if API fails
      const char = CHARACTERS[this.chatController.currentCharacter];
      this.resultImageUrl = char?.avatar || 'images/yuki.png';
      this.elements.resultImage.src = this.resultImageUrl;
      this.showResultView();
      
      // Show error message
      console.log('Using demo image due to API error:', error.message);
    }
  }
  
  async callGenerateApi() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/photo/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        character_id: this.chatController.currentCharacter,
        clothing_id: this.selectedClothing,
        accessory_ids: this.selectedAccessories
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If VIP required, show VIP modal
      if (errorData.vip_required) {
        this.close();
        this.chatController.showVipModal();
        throw new Error('VIP required');
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  }
  
  async simulateGeneration() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use character avatar as demo result
    const char = CHARACTERS[this.chatController.currentCharacter];
    this.resultImageUrl = char?.avatar || 'images/yuki.png';
    this.elements.resultImage.src = this.resultImageUrl;
  }
  
  download() {
    if (!this.resultImageUrl) return;
    
    const link = document.createElement('a');
    link.href = this.resultImageUrl;
    link.download = `photo_${Date.now()}.png`;
    link.click();
  }
  
  sendToChat() {
    if (!this.resultImageUrl) return;
    
    // Add image message to chat
    const imageMessage = {
      role: 'assistant',
      content: `[Photo] ${this.resultImageUrl}`,
      image: this.resultImageUrl,
      created_at: new Date().toISOString()
    };
    
    this.chatController.messages.push(imageMessage);
    this.chatController.renderMessages();
    this.chatController.saveMessages();
    this.chatController.scrollToBottom();
    
    this.close();
  }
}

// ============================================
// Voice Input Controller
// ============================================
class VoiceInputController {
  constructor(chatController) {
    this.chatController = chatController;
    this.isRecording = false;
    this.isProcessing = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.startTime = null;
    this.maxDuration = 60; // Max recording duration in seconds
    this.timerInterval = null;
    
    this.elements = {
      voiceBtn: document.getElementById('voice-btn'),
      recordingOverlay: null
    };
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    this.createRecordingOverlay();
  }
  
  createRecordingOverlay() {
    // Create recording overlay element
    const overlay = document.createElement('div');
    overlay.className = 'recording-overlay';
    overlay.id = 'recording-overlay';
    overlay.innerHTML = `
      <div class="recording-content">
        <div class="recording-indicator">
          <span class="recording-dot"></span>
          <span class="recording-text">Recording...</span>
        </div>
        <div class="recording-timer" id="recording-timer">00:00</div>
        <div class="recording-waveform">
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
          <span class="wave-bar"></span>
        </div>
        <div class="recording-hint">Release to send</div>
      </div>
    `;
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    this.elements.recordingOverlay = overlay;
  }
  
  bindEvents() {
    const btn = this.elements.voiceBtn;

    // Mouse events (desktop)
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startRecording();
    });

    btn.addEventListener('mouseup', () => {
      this.stopRecording();
    });

    btn.addEventListener('mouseleave', () => {
      if (this.isRecording) {
        this.stopRecording();
      }
    });

    // Touch events (mobile) - need passive: false to prevent scrolling
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startRecording();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopRecording();
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      if (this.isRecording) {
        this.cancelRecording();
      }
    });
  }
  
  async startRecording() {
    console.log('startRecording called, isRecording:', this.isRecording);

    // Check VIP status first
    if (!this.chatController.isVip()) {
      this.chatController.showVipModal();
      return;
    }
    
    // Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      // Initialize MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };
      
      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.startTime = Date.now();
      
      // Update UI
      this.elements.voiceBtn.classList.add('recording');
      this.elements.recordingOverlay.style.display = 'flex';
      
      // Start timer
      this.startTimer();
      
      // Haptic feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
    } catch (error) {
      console.error('Microphone access error:', error);
      this.showPermissionError();
    }
  }
  
  stopRecording() {
    console.log('stopRecording called, isRecording:', this.isRecording, 'mediaRecorder:', !!this.mediaRecorder);

    if (!this.isRecording || !this.mediaRecorder) {
      console.log('stopRecording: early return');
      return;
    }

    this.isRecording = false;
    
    // Stop timer
    this.stopTimer();
    
    // Update UI
    this.elements.voiceBtn.classList.remove('recording');
    this.elements.recordingOverlay.style.display = 'none';
    
    // Stop recording
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop all tracks
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    // Haptic feedback (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }
  
  cancelRecording() {
    this.audioChunks = [];
    this.stopRecording();
  }
  
  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      
      const timerEl = document.getElementById('recording-timer');
      if (timerEl) {
        timerEl.textContent = `${minutes}:${seconds}`;
      }
      
      // Auto-stop at max duration
      if (elapsed >= this.maxDuration) {
        this.stopRecording();
      }
    }, 100);
  }
  
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  async processRecording() {
    if (this.audioChunks.length === 0) {
      console.log('No audio recorded');
      return;
    }
    
    // Show processing state
    this.isProcessing = true;
    this.elements.voiceBtn.classList.add('processing');
    
    try {
      // Create audio blob and convert to WAV
      const webmBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const wavBlob = await this.convertToWav(webmBlob);
      
      // Send to API
      const text = await this.transcribe(wavBlob);
      
      if (text && text.trim()) {
        // Send message
        this.chatController.sendMessage(text);
      } else {
        this.showError('Could not transcribe audio');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      this.showError('Transcription failed');
    } finally {
      this.isProcessing = false;
      this.elements.voiceBtn.classList.remove('processing');
      this.audioChunks = [];
    }
  }
  
  async transcribe(audioBlob) {
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.vip_required) {
      this.chatController.showVipModal();
      throw new Error('VIP required');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Transcription failed');
    }
    
    return data.text;
  }
  
  showPermissionError() {
    const msg = this.chatController.lang === 'zh' 
      ? '请允许麦克风访问以使用语音输入' 
      : 'Please allow microphone access to use voice input';
    
    alert(msg);
  }
  
  showError(message) {
    console.error('Voice input error:', message);
    // Could show a toast notification here
  }
  
  // Convert audio blob to WAV format (PCM 16-bit, 16kHz mono)
  async convertToWav(audioBlob) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio data (mono)
    const channelData = audioBuffer.numberOfChannels > 1
      ? this.mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);
    
    // Resample to 16kHz if needed
    const sampleRate = 16000;
    let resampledData = channelData;
    if (audioBuffer.sampleRate !== sampleRate) {
      resampledData = this.resampleAudio(channelData, audioBuffer.sampleRate, sampleRate);
    }
    
    // Convert to 16-bit PCM
    const wavBlob = this.encodeWav(resampledData, sampleRate);
    return wavBlob;
  }
  
  mixToMono(audioBuffer) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
    const result = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      result[i] = (left[i] + right[i]) / 2;
    }
    return result;
  }
  
  resampleAudio(samples, fromRate, toRate) {
    const ratio = fromRate / toRate;
    const newLength = Math.round(samples.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = Math.floor(i * ratio);
      result[i] = samples[srcIndex];
    }
    return result;
  }
  
  encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true);  // NumChannels (1 for mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    // Write audio data (16-bit PCM)
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
}

// ============================================
// Voice Call Controller (Realtime)
// Realtime audio processing with cloud AI
// ============================================
class VoiceCallController {
  constructor(chatController) {
    this.chatController = chatController;
    
    // State
    this.isInCall = false;
    this.callId = null;
    this.isMuted = false;
    this.isSpeakerOn = true;
    this.startTime = null;
    this.timerInterval = null;
    
    // Audio
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isPlaying = false;
    this.currentAudio = null;
    
    // Silence detection
    this.speakingThreshold = 0.05;  // level to consider user is speaking
    this.silenceThreshold = 0.02;   // level to consider silence
    this.lastSoundTime = 0;
    this.isSpeaking = false;
    
    // Silence detection for realtime processing
    this.silenceTimeout = null;
    
    // History
    this.conversationHistory = [];
    
    this.init();
  }
  
  init() {
    this.createCallOverlay();
    this.bindEvents();
  }
  
  createCallOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'call-overlay';
    overlay.id = 'call-overlay';
    overlay.innerHTML = `
      <div class="call-content">
        <!-- Connecting State -->
        <div class="call-state call-state--connecting" id="call-connecting">
          <div class="call-avatar">
            <img src="images/yuki.png" alt="Character" id="call-avatar-img">
          </div>
          <div class="call-spinner"></div>
          <div class="call-status-text">Connecting...</div>
          <button class="call-btn call-btn--cancel" id="call-cancel-connect">Cancel</button>
        </div>
        
        <!-- Active Call State -->
        <div class="call-state call-state--active" id="call-active" style="display: none;">
          <div class="call-avatar call-avatar--active">
            <img src="images/yuki.png" alt="Character" id="call-active-avatar">
          </div>
          <div class="call-character-name" id="call-character-name">Yuki</div>
          <div class="call-timer" id="call-timer">00:00</div>
          
          <div class="call-status" id="call-status">
            <span class="call-status-icon">🎤</span>
            <span class="call-status-text">Listening...</span>
          </div>
          
          <div class="call-transcript" id="call-transcript" style="display: none;"></div>
          
          <div class="call-waveform" id="call-waveform">
            ${Array(20).fill('<span class="waveform-bar"></span>').join('')}
          </div>
          
          <div class="call-controls">
            <button class="call-btn call-btn--control" id="call-mute" title="Mute">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button class="call-btn call-btn--end" id="call-end" title="End Call">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"/>
              </svg>
            </button>
            <button class="call-btn call-btn--control" id="call-speaker" title="Speaker">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- End Call State -->
        <div class="call-state call-state--ended" id="call-ended" style="display: none;">
          <div class="call-ended-icon">📞</div>
          <div class="call-ended-title">Call Ended</div>
          <div class="call-ended-duration" id="call-ended-duration">Duration: 00:00</div>
          <div class="call-ended-messages" id="call-ended-messages">Messages: 0</div>
          <button class="call-btn call-btn--done" id="call-done">Done</button>
        </div>
      </div>
    `;
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    this.elements = {
      overlay,
      connecting: document.getElementById('call-connecting'),
      active: document.getElementById('call-active'),
      ended: document.getElementById('call-ended'),
      avatarImg: document.getElementById('call-avatar-img'),
      activeAvatar: document.getElementById('call-active-avatar'),
      characterName: document.getElementById('call-character-name'),
      timer: document.getElementById('call-timer'),
      status: document.getElementById('call-status'),
      transcript: document.getElementById('call-transcript'),
      waveform: document.getElementById('call-waveform'),
      waveformBars: overlay.querySelectorAll('.waveform-bar'),
      muteBtn: document.getElementById('call-mute'),
      speakerBtn: document.getElementById('call-speaker'),
      endBtn: document.getElementById('call-end'),
      cancelBtn: document.getElementById('call-cancel-connect'),
      doneBtn: document.getElementById('call-done'),
      endedDuration: document.getElementById('call-ended-duration'),
      endedMessages: document.getElementById('call-ended-messages')
    };
  }
  
  bindEvents() {
    // Call button in header
    const callBtn = document.getElementById('call-btn');
    if (callBtn) {
      callBtn.addEventListener('click', () => this.startCall());
    }
    
    // Cancel during connecting
    this.elements.cancelBtn.addEventListener('click', () => this.cancelCall());
    
    // End call
    this.elements.endBtn.addEventListener('click', () => this.endCall());
    
    // Done after ended
    this.elements.doneBtn.addEventListener('click', () => this.closeOverlay());
    
    // Mute toggle
    this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
    
    // Speaker toggle
    this.elements.speakerBtn.addEventListener('click', () => this.toggleSpeaker());
  }
  
  async startCall() {
    // Check VIP status
    if (!this.chatController.isVip()) {
      this.chatController.showVipModal();
      return;
    }
    
    // Show connecting state
    this.showState('connecting');
    this.updateCharacterInfo();
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.mediaStream = stream;
      
      // Setup audio
      await this.setupAudio(stream);
      
      // Start recording
      this.startRecording(stream);
      
      // Show active call state
      this.showState('active');
      this.isInCall = true;
      this.startTime = Date.now();
      this.startTimer();
      this.startSilenceDetection();
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
    } catch (error) {
      console.error('Failed to start call:', error);
      this.closeOverlay();
      
      if (error.name === 'NotAllowedError') {
        alert(this.chatController.lang === 'zh' 
          ? '请允许麦克风访问以使用语音通话' 
          : 'Please allow microphone access for voice calls');
      }
    }
  }
  
  async setupAudio(stream) {
    // Create AudioContext for analysis
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
  }
  
  startRecording(stream) {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    
    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.audioChunks = [];
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.audioChunks.push(e.data);
        console.log('Audio chunk recorded, total chunks:', this.audioChunks.length);
      }
    };
    
    this.mediaRecorder.start(100); // 100ms chunks
    console.log('MediaRecorder started, mimeType:', mimeType);
  }
  
  startSilenceDetection() {
    // Initialize lastSoundTime to now
    this.lastSoundTime = Date.now();
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const checkAudio = () => {
      if (!this.isInCall) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = average / 255;
      
      // Update waveform visualization
      this.updateWaveform(normalizedLevel);
      
      // Skip detection if audio is playing (avoid echo feedback)
      if (this.isPlaying) {
        requestAnimationFrame(checkAudio);
        return;
      }
      
      const now = Date.now();
      
      // Two-threshold approach: higher to start speaking, lower to stop
      if (normalizedLevel > this.speakingThreshold) {
        // User is speaking
        this.lastSoundTime = now;
        this.isSpeaking = true;
        
        // Clear silence timeout
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
        
        this.updateStatus('listening');
      } else if (normalizedLevel < this.silenceThreshold && this.isSpeaking) {
        // Silence detected after speaking
        const silenceDuration = now - this.lastSoundTime;
        
        // Process with AI after 1.5 seconds of silence
        if (silenceDuration > 1500 && !this.silenceTimeout) {
          console.log('Silence detected, processing with AI, silence:', silenceDuration, 'audioChunks:', this.audioChunks.length);
          this.silenceTimeout = setTimeout(() => {
            if (this.isInCall) {
              this.processWithAI();
            }
          }, 300);
        }
      }
      
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  }
  
  // Process audio with cloud AI
  async processWithAI() {
    // Reset silence timeout so next utterance can trigger again
    this.silenceTimeout = null;
    
    console.log('processWithAI called, audioChunks:', this.audioChunks.length, 'isMuted:', this.isMuted);
    
    if (this.isMuted || this.audioChunks.length === 0) {
      console.log('Skipping AI processing: muted or no audio chunks');
      this.isSpeaking = false;
      return;
    }
    
    this.updateStatus('processing');
    this.isSpeaking = false;
    
    try {
      // Convert to WAV
      const webmBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const wavBlob = await this.convertToWav(webmBlob);
      
      // Clear audio chunks after converting
      this.audioChunks = [];
      
      // Send to API
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('character_id', this.chatController.currentCharacter);
      formData.append('history', JSON.stringify(this.conversationHistory.slice(-6)));
      
      const response = await fetch(`${API_BASE_URL}/api/voice-call/process`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.audio) {
        // Add to history
        if (data.text) {
          this.conversationHistory.push({ role: 'user', content: data.text });
          this.showTranscript(data.text);
        }
        if (data.response) {
          this.conversationHistory.push({ role: 'assistant', content: data.response });
        }
        
        // Play AI response
        await this.playAudioBase64(data.audio);
      }
      
    } catch (error) {
      console.error('AI processing error:', error);
    }
    
    // Resume listening
    if (this.isInCall) {
      this.updateStatus('listening');
    }
  }
  
  showTranscript(text) {
    const el = this.elements.transcript;
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
  
  async playAudioBase64(base64Audio) {
    console.log('playAudioBase64 called, isPlaying:', this.isPlaying);
    
    if (this.isPlaying) {
      console.log('Already playing, skip');
      return;
    }
    
    this.updateStatus('speaking');
    this.isPlaying = true;
    
    try {
      console.log('Decoding base64 audio, length:', base64Audio.length);
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('Creating audio element, blob size:', audioBlob.size);
      this.currentAudio = new Audio(audioUrl);
      
      // Set volume
      this.currentAudio.volume = this.isSpeakerOn ? 1.0 : 0.5;
      
      // Log events for debugging
      this.currentAudio.oncanplay = () => console.log('Audio can play');
      this.currentAudio.onplay = () => console.log('Audio started playing');
      this.currentAudio.onerror = (e) => console.error('Audio error:', e);
      
      console.log('Calling play()...');
      await this.currentAudio.play();
      console.log('play() succeeded');
      
      this.currentAudio.onended = () => {
        console.log('Audio ended');
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        if (this.isInCall) {
          this.updateStatus('listening');
        }
      };
      
    } catch (error) {
      console.error('Audio playback error:', error.name, error.message);
      this.isPlaying = false;
      if (this.isInCall) {
        this.updateStatus('listening');
      }
    }
  }
  
  // Convert WebM to WAV for Whisper compatibility
  async convertToWav(audioBlob) {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // Get mono audio
    const channelData = audioBuffer.numberOfChannels > 1
      ? this.mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);
    
    // Resample to 16kHz
    const sampleRate = 16000;
    let resampledData = channelData;
    if (audioBuffer.sampleRate !== sampleRate) {
      resampledData = this.resampleAudio(channelData, audioBuffer.sampleRate, sampleRate);
    }
    
    return this.encodeWav(resampledData, sampleRate);
  }
  
  mixToMono(audioBuffer) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
    const result = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      result[i] = (left[i] + right[i]) / 2;
    }
    return result;
  }
  
  resampleAudio(samples, fromRate, toRate) {
    const ratio = fromRate / toRate;
    const newLength = Math.round(samples.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = samples[Math.floor(i * ratio)];
    }
    return result;
  }
  
  encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  updateWaveform(level) {
    const bars = this.elements.waveformBars;
    if (!bars) return;
    bars.forEach((bar) => {
      const height = Math.max(4, level * 40 * (0.5 + Math.random() * 0.5));
      bar.style.height = `${height}px`;
    });
  }
  
  updateStatus(status, message = null) {
    const statusEl = this.elements.status;
    const icon = statusEl.querySelector('.call-status-icon');
    const text = statusEl.querySelector('.call-status-text');
    
    switch (status) {
      case 'listening':
        icon.textContent = '🎤';
        text.textContent = 'Listening...';
        break;
      case 'processing':
      case 'thinking':
        icon.textContent = '💭';
        text.textContent = 'Thinking...';
        break;
      case 'speaking':
        icon.textContent = '💬';
        text.textContent = 'Speaking...';
        break;
      case 'error':
        icon.textContent = '❌';
        text.textContent = message || 'Error';
        break;
    }
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.elements.muteBtn.classList.toggle('call-btn--active', this.isMuted);
    
    if (this.mediaStream) {
      const tracks = this.mediaStream.getAudioTracks();
      tracks.forEach(track => track.enabled = !this.isMuted);
    }
  }
  
  toggleSpeaker() {
    this.isSpeakerOn = !this.isSpeakerOn;
    this.elements.speakerBtn.classList.toggle('call-btn--active', this.isSpeakerOn);
  }
  
  async endCall() {
    if (!this.isInCall) return;
    
    this.isInCall = false;
    
    // Stop timer
    this.stopTimer();
    
    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    // Stop any playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    // Show end state
    const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
    const seconds = (duration % 60).toString().padStart(2, '0');
    this.elements.endedDuration.textContent = `Duration: ${minutes}:${seconds}`;
    this.elements.endedMessages.textContent = `Messages: ${this.conversationHistory.length}`;
    
    this.showState('ended');
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }
  
  cancelCall() {
    this.closeOverlay();
  }
  
  closeOverlay() {
    this.elements.overlay.style.display = 'none';
    this.conversationHistory = [];
  }
  
  showState(state) {
    this.elements.connecting.style.display = state === 'connecting' ? 'flex' : 'none';
    this.elements.active.style.display = state === 'active' ? 'flex' : 'none';
    this.elements.ended.style.display = state === 'ended' ? 'flex' : 'none';
    this.elements.overlay.style.display = 'flex';
  }
  
  updateCharacterInfo() {
    const char = CHARACTERS[this.chatController.currentCharacter];
    if (!char) return;
    
    const name = this.chatController.lang === 'zh' ? char.name_zh : char.name;
    
    this.elements.avatarImg.src = char.avatar;
    this.elements.activeAvatar.src = char.avatar;
    this.elements.characterName.textContent = name;
  }
  
  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      this.elements.timer.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }
  
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  window.chatController = new ChatController();
  window.photoRequestController = new PhotoRequestController(window.chatController);
  window.voiceInputController = new VoiceInputController(window.chatController);
  window.voiceCallController = new VoiceCallController(window.chatController);
});
