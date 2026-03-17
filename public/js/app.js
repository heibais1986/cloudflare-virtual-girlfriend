// Virtual Girlfriend App

// API 配置 - 使用 Cloudflare Worker API
const API_BASE_URL = 'https://gf.xxzd.de5.net'; // Cloudflare Worker URL

// Language translations
const translations = {
  en: {
    title: 'My Virtual Girlfriend',
    greeting: "Honey, I'm right here~ Do you want to talk to me?",
    voiceSettings: '🎤 Voice Customization',
    voiceSelectBtn: 'Choose an audio file to clone your unique voice',
    voiceUploading: 'Uploading and cloning voice...',
    voiceSuccess: '✅ Voice cloned successfully!',
    voiceAiSuccess: 'Voice customization successful! I will reply in your voice now~',
    voiceError: '❌ Upload failed: ',
    voiceErrorRetry: '❌ Upload failed: (please check if server is running)',
    bgSettings: '🖼️ Chat Background',
    bgSelectBtn: 'Choose an image for chat background',
    bgSuccess: '✅ Background set successfully!',
    bgError: '❌ Failed to set background',
    micBtn: '🎤 Speak',
    inputPlaceholder: 'Type your message...',
    sendBtn: 'Send',
    listening: "I'm listening, go ahead~",
    speechNotSupported: 'Speech recognition is not supported in this browser. Please use the input box.',
    speechError: "Sorry, I didn't catch that. Could you say it again?",
    micError: "Can't start microphone. Please check your permissions.",
    apiError: 'Sorry, the service is temporarily unavailable. Please try again later.',
    loadingMessage: 'Upgrading to VIP for faster responses...',
    error: 'Unknown error',
    langSwitch: 'EN/中',
    loginBtn: 'Login',
    logoutBtn: 'Logout',
    welcomeUser: 'Welcome',
    vipBtn: 'VIP'
  },
  zh: {
    title: '我的虚拟女友',
    greeting: '亲爱的，我在这里呢~ 你想和我说说话吗？',
    voiceSettings: '🎤 语音定制',
    voiceSelectBtn: '选择文件上传以克隆你专属的声音',
    voiceUploading: '上传并克隆声音中...',
    voiceSuccess: '✅ 声音克隆成功！',
    voiceAiSuccess: '声音已定制成功！以后我会用你的声音回复你～',
    voiceError: '❌ 上传失败: ',
    voiceErrorRetry: '❌ 上传失败: (请检查服务器是否运行)',
    bgSettings: '🖼️ 聊天背景',
    bgSelectBtn: '选择图片作为聊天背景',
    bgSuccess: '✅ 背景设置成功！',
    bgError: '❌ 设置背景失败',
    micBtn: '🎤 说话',
    inputPlaceholder: '输入你想说的话...',
    sendBtn: '发送',
    listening: '我在听着呢，说吧～',
    speechNotSupported: '当前浏览器不支持语音识别功能，请使用输入框。',
    speechError: '抱歉，我没有听清楚，能再说一遍吗？',
    micError: '无法启动麦克风，请检查权限设置。',
    apiError: '抱歉，服务暂时不可用，请稍后再试。',
    loadingMessage: '升级会员以解锁更快的回复速度...',
    error: '未知错误',
    langSwitch: '中/EN',
    loginBtn: '登录',
    logoutBtn: '退出',
    welcomeUser: '欢迎',
    vipBtn: '会员'
  }
};

class VirtualGirlfriend {
  constructor() {
    this.chatBox = document.getElementById('chat-box');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.micBtn = document.getElementById('mic-btn');
    this.voiceUpload = document.getElementById('voice-upload');
    this.voiceSelectBtn = document.getElementById('voice-select-btn');
    this.voiceStatus = document.getElementById('voice-status');
    this.bgUpload = document.getElementById('bg-upload');
    this.bgSelectBtn = document.getElementById('bg-select-btn');
    this.bgStatus = document.getElementById('bg-status');
    this.recognition = null;
    this.isListening = false;
    this.lang = 'en'; // Default language is English
    this.currentUser = null;
    this.chatHistory = []; // Chat history for context
    this.activeChar = this.getSelectedCharacter(); // Get character from URL or localStorage
    
    // Avatar elements
    this.avatar = document.getElementById('avatar');
    this.avatarAction = document.getElementById('avatar-action');
    
    this.initAuthButton();
    this.initSpeechRecognition();
    this.bindEvents();
    
    // Update character selector UI to reflect selected character
    this.updateCharacterSelector();
    
    // load default or saved background
    this.updateChatBackground();
    
    // Load saved chat history
    this.loadChatHistory();
    
    // Start idle animation
    this.startIdleAnimation();
    
    // Update VIP button text
    this.updateVipButton();
  }

  getSelectedCharacter() {
    // Check URL parameter first (from landing page)
    const urlParams = new URLSearchParams(window.location.search);
    const charParam = urlParams.get('char');
    
    // Valid character IDs
    const validChars = ['yuki', 'aria', 'luna'];
    
    if (charParam && validChars.includes(charParam)) {
      // Save to localStorage for persistence
      localStorage.setItem('selectedChar', charParam);
      return charParam;
    }
    
    // Check localStorage
    const savedChar = localStorage.getItem('selectedChar');
    if (savedChar && validChars.includes(savedChar)) {
      return savedChar;
    }
    
    // Default to yuki
    return 'yuki';
  }

  updateCharacterSelector() {
    const charItems = document.querySelectorAll('.char-item');
    charItems.forEach(item => {
      const charId = item.getAttribute('data-char');
      if (charId === this.activeChar) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Load chat history from localStorage
  loadChatHistory() {
    const key = `chatHistory_${this.activeChar}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        this.chatHistory = JSON.parse(saved);
        // Render saved messages to chat box
        this.chatHistory.forEach(msg => {
          this.addMessage(msg.role === 'user' ? 'user' : 'ai', msg.content, false);
        });
      } catch (e) {
        console.error('Failed to load chat history:', e);
        this.chatHistory = [];
        this.addMessage('ai', this.t('greeting'));
      }
    } else {
      // No saved history, show greeting
      this.addMessage('ai', this.t('greeting'));
    }
  }

  // Save chat history to localStorage
  saveChatHistory() {
    const key = `chatHistory_${this.activeChar}`;
    try {
      localStorage.setItem(key, JSON.stringify(this.chatHistory));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }

  // Clear chat history for current character
  clearChatHistory() {
    const key = `chatHistory_${this.activeChar}`;
    localStorage.removeItem(key);
    this.chatHistory = [];
    this.chatBox.innerHTML = '';
    this.addMessage('ai', this.t('greeting'));
  }

  initAuthButton() {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        this.currentUser = null;
      }
    }
    
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
      this.updateAuthButton(authBtn);
      
      authBtn.addEventListener('click', () => {
        if (this.currentUser) {
          // Logout
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.currentUser = null;
          this.updateAuthButton(authBtn);
        } else {
          // Go to login page with redirect parameter
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `auth.html?redirect=${encodeURIComponent(currentUrl)}`;
        }
      });
    }
  }

  updateAuthButton(authBtn) {
    if (this.currentUser) {
      authBtn.textContent = this.t('logoutBtn');
      authBtn.title = this.t('welcomeUser') + ' ' + this.currentUser.username;
    } else {
      authBtn.textContent = this.t('loginBtn');
    }
  }

  loadSavedBackground() {
    const savedBg = localStorage.getItem('chatBackground');
    if (savedBg) {
      this.chatBox.style.backgroundImage = `url(${savedBg})`;
      this.chatBox.style.backgroundSize = 'cover';
      this.chatBox.style.backgroundPosition = 'center center';
      // Hide the button if background is already set
      if (this.bgSelectBtn) {
        this.bgSelectBtn.style.display = 'none';
      }
      if (this.bgStatus) {
        this.bgStatus.textContent = this.t('bgSuccess');
      }
      return true;
    }
    return false;
  }

  updateChatBackground() {
    // Clear custom background when a character is selected (or load default)
    // To make the background look better for chat readability, we might add a subtle overlay
    // But setting background image directly:
    this.chatBox.style.backgroundImage = `url(images/${this.activeChar}.png)`;
    this.chatBox.style.backgroundSize = 'cover';
    this.chatBox.style.backgroundPosition = 'center top'; // Top aligns character faces better
  }

  // Translation helper
  t(key) {
    return translations[this.lang][key] || translations['en'][key] || key;
  }

  // Switch language
  switchLanguage() {
    this.lang = this.lang === 'en' ? 'zh' : 'en';
    
    // Update page title
    document.title = this.t('title');
    
    // Update HTML lang attribute
    document.documentElement.lang = this.lang;
    
    // Update h1 title
    this.updateChatTitle();
    
    // Update voice settings section
    const voiceSettingsTitle = document.getElementById('voice-settings-title');
    if (voiceSettingsTitle) {
      voiceSettingsTitle.textContent = this.t('voiceSettings');
    }
    
    // Update voice select button
    const voiceSelectBtn = document.getElementById('voice-select-btn');
    if (voiceSelectBtn) {
      voiceSelectBtn.textContent = this.t('voiceSelectBtn');
    }
    
    // Update background select button
    const bgSettingsTitle = document.getElementById('bg-settings-title');
    if (bgSettingsTitle) {
      bgSettingsTitle.textContent = this.t('bgSettings');
    }
    
    const bgSelectBtn = document.getElementById('bg-select-btn');
    if (bgSelectBtn) {
      bgSelectBtn.textContent = this.t('bgSelectBtn');
    }
    
    // Update mic button
    if (this.micBtn) {
      this.micBtn.textContent = this.t('micBtn');
    }
    
    // Update input placeholder
    if (this.userInput) {
      this.userInput.placeholder = this.t('inputPlaceholder');
    }
    
    // Update send button
    if (this.sendBtn) {
      this.sendBtn.textContent = this.t('sendBtn');
    }
    
    // Update speech recognition language
    if (this.recognition) {
      this.recognition.lang = this.lang === 'en' ? 'en-US' : 'zh-CN';
    }
    
    // Update language switch button text
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) {
      langSwitch.textContent = this.t('langSwitch');
    }
    
    // Update auth button
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
      this.updateAuthButton(authBtn);
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US'; // Default to English
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.userInput.value = transcript;
        this.handleUserMessage();
      };

      this.recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        this.addMessage('ai', this.t('speechError'));
        this.isListening = false;
        if (this.micBtn) this.micBtn.classList.remove('pressed');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.micBtn) this.micBtn.classList.remove('pressed');
      };
    } else {
      this.addMessage('ai', this.t('speechNotSupported'));
      if (this.micBtn) this.micBtn.disabled = true;
    }
  }

  bindEvents() {
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleUserMessage());
    }
    if (this.userInput) {
      this.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleUserMessage();
      });
    }

    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => {
        if (this.isListening) {
          this.stopListening();
        } else {
          this.startListening();
        }
      });
    }

    // Character selection
    const charItems = document.querySelectorAll('.char-item');
    if (charItems.length > 0) {
      charItems.forEach(item => {
        item.addEventListener('click', () => {
          charItems.forEach(c => c.classList.remove('active'));
          item.classList.add('active');
          this.activeChar = item.getAttribute('data-char');
          this.updateChatTitle();
          this.updateChatBackground();
          
          // Clear chat history on switch
          this.chatHistory = [];
          this.chatBox.innerHTML = '';
          this.addMessage('ai', this.t('greeting'));
        });
      });
    }
    
    // Voice select button - triggers file input and auto-uploads
    if (this.voiceSelectBtn) {
      this.voiceSelectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Check VIP status
        if (!this.currentUser || this.currentUser.is_vip !== 1) {
          // Show VIP modal
          const vipModal = document.getElementById('vip-modal');
          if (vipModal) vipModal.style.display = 'flex';
          return;
        }
        
        // If VIP, trigger file input
        this.voiceUpload.click();
      });
    }

    // VIP Modal Events
    const vipModalClose = document.getElementById('vip-modal-close');
    if (vipModalClose) {
      vipModalClose.addEventListener('click', () => {
        document.getElementById('vip-modal').style.display = 'none';
      });
    }

    const vipModalUpgrade = document.getElementById('vip-modal-upgrade');
    if (vipModalUpgrade) {
      vipModalUpgrade.addEventListener('click', () => {
        document.getElementById('vip-modal').style.display = 'none';
        const timestamp = new Date().getTime();
        if (this.currentUser) {
          window.location.href = `pricing.html?lang=${this.lang}&t=${timestamp}`;
        } else {
          window.location.href = `auth.html?lang=${this.lang}&t=${timestamp}`;
        }
      });
    }
    
    // Auto-upload voice when file is selected
    if (this.voiceUpload) {
      this.voiceUpload.addEventListener('change', () => {
        if (this.voiceUpload.files.length > 0) {
          this.handleVoiceUpload();
        }
      });
    }
    
    // Background select button
    if (this.bgSelectBtn) {
      this.bgSelectBtn.addEventListener('click', () => {
        this.bgUpload.click();
      });
    }
    
    // Auto-set background when image is selected
    if (this.bgUpload) {
      this.bgUpload.addEventListener('change', () => {
        if (this.bgUpload.files.length > 0) {
          this.handleBgUpload();
        }
      });
    }
    
    // Language switch event
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) {
      langSwitch.addEventListener('click', () => {
        this.switchLanguage();
        this.updateVipButton();
      });
    }
    
    // VIP button event
    const vipBtn = document.getElementById('vip-btn');
    if (vipBtn) {
      vipBtn.onclick = () => {
        const timestamp = new Date().getTime();
        const currentUrl = window.location.pathname + window.location.search;
        if (this.currentUser) {
          window.location.href = `pricing.html?lang=${this.lang}&redirect=${encodeURIComponent(currentUrl)}&t=${timestamp}`;
        } else {
          window.location.href = `auth.html?lang=${this.lang}&redirect=${encodeURIComponent(currentUrl)}&t=${timestamp}`;
        }
      };
      console.log('VIP button found and handler attached');
    } else {
      console.log('VIP button not found');
    }
  }
  
  updateVipButton() {
    const vipBtn = document.getElementById('vip-btn');
    if (vipBtn) {
      vipBtn.textContent = this.t('vipBtn');
    }
  }

  updateChatTitle() {
    const pageTitle = document.getElementById('page-title');
    if (!pageTitle) return;
    
    const names = {
      yuki: { en: 'Yuki', zh: '小美 (Yuki)' },
      aria: { en: 'Aria', zh: '阿丽亚 (Aria)' },
      luna: { en: 'Luna', zh: '露娜 (Luna)' }
    };
    
    const charName = names[this.activeChar] ? names[this.activeChar][this.lang] : 'Yuki';
    
    if (this.lang === 'en') {
      pageTitle.textContent = `Chatting with ${charName}`;
    } else {
      pageTitle.textContent = `和 ${charName} 聊天中`;
    }
  }

  // Detect language from text content
  detectLanguage(text) {
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(text) ? 'zh' : 'en';
  }

  // Clean text for TTS - remove action descriptions like *smile*, *laugh*, etc.
  cleanTextForTTS(text) {
    // Remove patterns like *smile*, *laugh*, *happy*, *sad*, etc.
    return text.replace(/\*[a-zA-Z]+\*/g, '').trim();
  }

  // Try primary port, fallback to alternate if needed
  async fetchWithFallback(url, options) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (e) {
      // Try fallback URL - use Cloudflare Worker as fallback
      const fallbackUrl = url.replace('gf.xxzd.de5.net', 'gf.docman.edu.kg');
      return fetch(fallbackUrl, options);
    }
  }
  
  async handleVoiceUpload() {
    const file = this.voiceUpload.files[0];
    if (!file) {
      return;
    }
    
    this.voiceStatus.textContent = this.t('voiceUploading');
    
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('language', this.lang);
    
    // 语音克隆需要使用本地后端（因为需要 Piper TTS）
    // Cloudflare Worker 不支持语音克隆
    const voiceCloneUrl = 'https://gf.docman.edu.kg/api/voice/upload';
    
    try {
      const response = await fetch(voiceCloneUrl, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status === 'ok') {
        this.voiceStatus.textContent = this.t('voiceSuccess');
        this.addMessage('ai', this.t('voiceAiSuccess'));
        // Hide the voice select button
        if (this.voiceSelectBtn) {
          this.voiceSelectBtn.style.display = 'none';
        }
      } else {
        this.voiceStatus.textContent = this.t('voiceError') + (data.error || this.t('error'));
      }
    } catch (error) {
      console.error('Voice upload error:', error);
      this.voiceStatus.textContent = this.t('voiceErrorRetry');
    }
  }

  handleBgUpload() {
    const file = this.bgUpload.files[0];
    if (!file) {
      return;
    }
    
    // Read the image and set it as chat background
    const reader = new FileReader();
    reader.onload = (e) => {
      // Save to localStorage for persistence
      localStorage.setItem('chatBackground', e.target.result);
      
      // Apply to chat box
      this.chatBox.style.backgroundImage = `url(${e.target.result})`;
      this.chatBox.style.backgroundSize = 'cover';
      this.chatBox.style.backgroundPosition = 'center center';
      
      // Show success message
      if (this.bgStatus) {
        this.bgStatus.textContent = this.t('bgSuccess');
        // Hide the button after setting background
        if (this.bgSelectBtn) {
          this.bgSelectBtn.style.display = 'none';
        }
      }
    };
    reader.onerror = () => {
      if (this.bgStatus) {
        this.bgStatus.textContent = this.t('bgError');
      }
    };
    reader.readAsDataURL(file);
  }

  startListening() {
    try {
      this.recognition.start();
      this.isListening = true;
      if (this.micBtn) this.micBtn.classList.add('pressed');
      // Show listening message without saving to history
      this.addMessage('ai', this.t('listening'), false);
    } catch (error) {
      console.error('启动语音识别失败:', error);
      this.addMessage('ai', this.t('micError'), false);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      if (this.micBtn) this.micBtn.classList.remove('pressed');
    }
  }

  async handleUserMessage() {
    const message = this.userInput.value.trim();
    if (!message) return;

    // Save history before adding new message (for API context)
    const historyForAPI = [...this.chatHistory];

    // Add user message to chat (will save to history)
    this.addMessage('user', message);
    this.userInput.value = '';

    // Show loading animation
    const loadingMsgDiv = this.createLoadingMessage();
    
    try {
      // Always use Cloudflare Worker for AI chat
      const response = await fetch(API_BASE_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          history: historyForAPI, // Use history before current message
          character: this.activeChar
        })
      });

      const data = await response.json();
      
      // Remove loading message
      this.removeLoadingMessage(loadingMsgDiv);
      
      if (data.reply) {
        // Add AI response to chat (will save to history)
        this.addMessage('ai', data.reply);
        
        // Play TTS - always use Cloudflare aura-2-en (sounds more natural)
        await this.playTTSSpeak(data.reply);
      } else {
        throw new Error(data.error || this.t('error'));
      }
    } catch (error) {
      console.error('API Error:', error);
      // Remove loading message
      this.removeLoadingMessage(loadingMsgDiv);
      // Error message should not be saved to history
      this.addMessage('ai', this.t('apiError'), false);
    }
  }

  // Play TTS using local backend (for Chinese)
  async playLocalTTS(text) {
    try {
      // Call local backend's TTS endpoint
      const response = await fetch('https://gf.docman.edu.kg/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio_url) {
          // Play the audio from the local backend
          const audioUrl = 'https://gf.docman.edu.kg' + data.audio_url;
          const audio = new Audio(audioUrl);
          audio.play();
        }
      }
    } catch (error) {
      console.error('Local TTS Error:', error);
    }
  }

  // Play TTS using Cloudflare Worker
  async playTTSSpeak(text) {
    try {
      // Clean text for TTS - remove action descriptions like *smile*, *laugh*, etc.
      const cleanText = this.cleanTextForTTS(text);
      
      console.log('TTS Request:', cleanText.substring(0, 50));
      
      // Use Cloudflare Worker for all TTS (aura-2-en sounds more natural)
      const response = await fetch(API_BASE_URL + '/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      });

      console.log('TTS Response status:', response.status);

      if (response.ok) {
        const audioBlob = await response.blob();
        console.log('TTS Audio blob size:', audioBlob.size);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error('Audio play error:', e));
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      } else {
        const errorText = await response.text();
        console.error('TTS API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }

  createLoadingMessage() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg ai loading';
    msgDiv.innerHTML = `
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="loading-text">${this.t('loadingMessage')}</div>
    `;
    this.chatBox.appendChild(msgDiv);
    this.scrollToBottom();
    return msgDiv;
  }

  removeLoadingMessage(loadingMsgDiv) {
    if (loadingMsgDiv && loadingMsgDiv.parentNode) {
      loadingMsgDiv.parentNode.removeChild(loadingMsgDiv);
    }
  }

  playAudio(audioId, reply = null) {
    // Use fallback URL if needed
    let audioUrl = API_BASE_URL + '/audio/' + audioId + '.wav';
    
    const audio = new Audio(audioUrl);
    
    // Start talking animation
    if (this.avatar) {
      this.avatar.classList.remove('idle');
      this.avatar.classList.add('talking');
    }
    
    audio.oncanplaythrough = () => audio.play();
    
    audio.onplay = () => {
      // Check for action in reply and play corresponding animation
      if (reply) {
        const actionMatch = reply.match(/\*([^*]+)\*/);
        if (actionMatch) {
          const actionText = actionMatch[1].trim();
          const animationClass = this.getAnimationFromAction(actionText);
          
          if (animationClass && animationClass !== 'talking') {
            this.avatar.classList.remove('talking');
            this.avatar.classList.add(animationClass);
            this.showAction(actionText);
          }
        }
      }
    };
    
    audio.onended = () => {
      // Return to idle after speech ends
      if (this.avatar) {
        this.avatar.classList.remove('talking');
        // Remove any emotion classes
        this.avatar.classList.remove('happy', 'sad', 'shy', 'surprised', 
          'thinking', 'blushing', 'loving', 'waving');
        this.startIdleAnimation();
      }
      
      // Hide action text
      if (this.avatarAction) {
        this.avatarAction.classList.remove('show');
      }
    };
    
    audio.onerror = () => {
      // Try again after 1s (TTS may still be generating)
      setTimeout(() => {
        let retryUrl = API_BASE_URL + '/audio/' + audioId + '.wav';
        const retry = new Audio(retryUrl);
        retry.oncanplaythrough = () => retry.play();
        retry.onended = () => {
          if (this.avatar) {
            this.avatar.classList.remove('talking');
            this.startIdleAnimation();
          }
        };
      }, 1000);
    };
  }

  addMessage(role, content, save = true) {
    // Clean the content - remove action markers (*action*)
    const cleanContent = content.replace(/\*([^*]+)\*/g, '').trim();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${role}`;
    msgDiv.textContent = cleanContent;
    this.chatBox.appendChild(msgDiv);
    this.scrollToBottom();
    
    // Save to chat history (only for new messages, not when loading)
    if (save) {
      this.chatHistory.push({ 
        role: role === 'user' ? 'user' : 'assistant', 
        content: content 
      });
      this.saveChatHistory();
    }
  }

  scrollToBottom() {
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }
  
  // ==================== Avatar Animation Methods ====================
  
  startIdleAnimation() {
    if (this.avatar) {
      this.avatar.className = 'avatar idle';
    }
  }
  
  // Map action keywords to animation classes
  getAnimationFromAction(actionText) {
    if (!actionText) return null;
    
    const action = actionText.toLowerCase();
    
    // Happy emotions
    if (action.includes('happy') || action.includes('开心') || action.includes('高兴') || 
        action.includes('love') || action.includes('爱') || action.includes('喜欢') ||
        action.includes('joy') || action.includes('joyful')) {
      return 'happy';
    }
    
    // Sad emotions
    if (action.includes('sad') || action.includes('难过') || action.includes('伤心') ||
        action.includes('cry') || action.includes('哭') || action.includes('tear')) {
      return 'sad';
    }
    
    // Shy/embarrassed
    if (action.includes('shy') || action.includes('害羞') || action.includes('不好意思') ||
        action.includes('embarrassed') || action.includes('尴尬')) {
      return 'shy';
    }
    
    // Surprised
    if (action.includes('surprise') || action.includes('惊讶') || action.includes('吃惊') ||
        action.includes('wow') || action.includes('咦') || action.includes('啊')) {
      return 'surprised';
    }
    
    // Thinking
    if (action.includes('think') || action.includes('想') || action.includes('思考') ||
        action.includes('hmm') || action.includes('嗯') || action.includes('consider')) {
      return 'thinking';
    }
    
    // Blushing
    if (action.includes('blush') || action.includes('脸红') || action.includes('不好意思') ||
        action.includes('cute')) {
      return 'blushing';
    }
    
    // Loving
    if (action.includes('love') || action.includes('爱') || action.includes('心') ||
        action.includes('miss') || action.includes('想你')) {
      return 'loving';
    }
    
    // Wave
    if (action.includes('wave') || action.includes('挥手') || action.includes('打招呼')) {
      return 'waving';
    }
    
    // Talking (default during speech)
    if (action.includes('say') || action.includes('说') || action.includes('tell')) {
      return 'talking';
    }
    
    return null;
  }
  
  // Show action text above avatar
  showAction(actionText) {
    if (!this.avatarAction || !actionText) return;
    
    this.avatarAction.textContent = actionText;
    this.avatarAction.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      this.avatarAction.classList.remove('show');
    }, 3000);
  }
  
  // Play avatar animation
  playAnimation(animationClass, duration = 2000) {
    if (!this.avatar) return;
    
    // Remove idle and talking classes
    this.avatar.classList.remove('idle', 'talking');
    
    // Add the animation class
    this.avatar.classList.add(animationClass);
    
    // Return to idle after duration
    setTimeout(() => {
      this.avatar.classList.remove(animationClass);
      this.startIdleAnimation();
    }, duration);
  }
  
  // Update avatar based on AI response
  updateAvatarFromResponse(reply) {
    // Extract action from reply (format: *action* or *action*dialogue)
    const actionMatch = reply.match(/\*([^*]+)\*/);
    
    if (actionMatch) {
      const actionText = actionMatch[1].trim();
      const animationClass = this.getAnimationFromAction(actionText);
      
      if (animationClass) {
        this.playAnimation(animationClass, 3000);
        this.showAction(actionText);
      }
    }
  }
}

// 启动应用
window.addEventListener('load', () => {
  new VirtualGirlfriend();
});
