/**
 * Virtual Girlfriend Landing Page
 * Character Selection Interface
 */

// ============================================
// Character Data
// ============================================
const CHARACTERS_DATA = [
  {
    id: 'yuki',
    name: 'Yuki',
    name_zh: '雪',
    image: 'images/yuki.png',
    description: '温柔如雪，善解人意的邻家女孩',
    description_en: 'Gentle as snow, an understanding girl next door',
    tags: ['温柔', '体贴', '善解人意', '内向'],
    tags_en: ['Gentle', 'Caring', 'Understanding', 'Introverted'],
    age: 21,
    occupation: '大学生',
    occupation_en: 'University Student',
    hobbies: ['阅读', '写作', '听音乐'],
    hobbies_en: ['Reading', 'Writing', 'Music'],
    traits: ['擅长倾听', '会安慰人', '偶尔小害羞'],
    traits_en: ['Good listener', 'Comforting', 'Sometimes shy'],
    greeting: '你好呀~ 我是Yuki，很高兴认识你...'
  },
  {
    id: 'aria',
    name: 'Aria',
    name_zh: '艾莉亚',
    image: 'images/aria.png',
    description: '活泼开朗，热情似火的元气少女',
    description_en: 'Vibrant and cheerful, full of energy and passion',
    tags: ['活泼', '热情', '开朗', '外向'],
    tags_en: ['Energetic', 'Passionate', 'Cheerful', 'Extroverted'],
    age: 22,
    occupation: '自由职业者',
    occupation_en: 'Freelancer',
    hobbies: ['旅行', '摄影', '美食'],
    hobbies_en: ['Travel', 'Photography', 'Food'],
    traits: ['话题丰富', '幽默风趣', '充满活力'],
    traits_en: ['Great conversationalist', 'Humorous', 'Full of energy'],
    greeting: '嗨！我是Aria~ 你今天过得怎么样？'
  },
  {
    id: 'luna',
    name: 'Luna',
    name_zh: '露娜',
    image: 'images/luna.png',
    description: '神秘优雅，如月光般迷人的女神',
    description_en: 'Mysterious and elegant, captivating like moonlight',
    tags: ['神秘', '优雅', '知性', '成熟'],
    tags_en: ['Mysterious', 'Elegant', 'Intellectual', 'Mature'],
    age: 24,
    occupation: '设计师',
    occupation_en: 'Designer',
    hobbies: ['艺术', '电影', '品酒'],
    hobbies_en: ['Art', 'Movies', 'Wine tasting'],
    traits: ['见解独到', '气质优雅', '神秘感十足'],
    traits_en: ['Insightful', 'Elegant aura', 'Full of mystery'],
    greeting: '欢迎来到我的世界，我是Luna...'
  }
];

// ============================================
// Translations
// ============================================
const TRANSLATIONS = {
  en: {
    heroTitle: 'Choose Your Companion',
    heroSubtitle: 'Select your virtual partner and start a special conversation',
    skipBtn: 'Skip - Use Default Character',
    footerText: 'Select a character to start chatting',
    loginBtn: 'Login',
    logoutBtn: 'Logout',
    age: 'years old',
    hobbies: 'Hobbies',
    startChat: 'Start Chat',
    viewDetails: 'View Details'
  },
  zh: {
    heroTitle: '选择你的伴侣',
    heroSubtitle: '选择你的虚拟伴侣，开始一段特别的对话',
    skipBtn: '跳过 - 使用默认角色',
    footerText: '选择一个角色开始聊天',
    loginBtn: '登录',
    logoutBtn: '退出',
    age: '岁',
    hobbies: '爱好',
    startChat: '开始聊天',
    viewDetails: '查看详情'
  }
};

// ============================================
// Landing Page Controller
// ============================================
class LandingPage {
  constructor() {
    this.characters = CHARACTERS_DATA;
    this.lang = this.detectLanguage();
    this.selectedChar = null;
    
    this.init();
  }
  
  /**
   * Detect user language preference
   */
  detectLanguage() {
    // Check localStorage first
    const savedLang = localStorage.getItem('lang');
    if (savedLang) return savedLang;
    
    // Default to English (不再根据浏览器语言自动选择中文)
    return 'en';
  }
  
  /**
   * Get translation
   */
  t(key) {
    return TRANSLATIONS[this.lang][key] || TRANSLATIONS['en'][key] || key;
  }
  
  /**
   * Initialize the landing page
   */
  init() {
    this.applyTranslations();
    this.updateLangSwitchBtn();
    this.renderCharacterGrid();
    this.bindEvents();
    this.checkAuthStatus();
  }
  
  /**
   * Update language switch button text
   */
  updateLangSwitchBtn() {
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) {
      langSwitch.textContent = this.lang === 'en' ? 'EN/中' : '中/EN';
    }
  }
  
  /**
   * Apply translations to static elements
   */
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  }
  
  /**
   * Render character cards grid
   */
  renderCharacterGrid() {
    const grid = document.getElementById('character-grid');
    if (!grid) return;
    
    grid.innerHTML = this.characters.map(char => this.createCharacterCard(char)).join('');
  }
  
  /**
   * Create character card HTML
   */
  createCharacterCard(char) {
    const tags = this.lang === 'zh' ? char.tags : char.tags_en;
    const desc = this.lang === 'zh' ? char.description : char.description_en;
    const occupation = this.lang === 'zh' ? char.occupation : char.occupation_en;
    const hobbies = this.lang === 'zh' ? char.hobbies : char.hobbies_en;
    const traits = this.lang === 'zh' ? char.traits : char.traits_en;
    
    return `
      <article 
        class="character-card" 
        data-char-id="${char.id}"
        role="button"
        tabindex="0"
        aria-label="${this.lang === 'zh' ? '选择角色' : 'Select character'} ${char.name}"
      >
        <div class="character-card__image-wrapper">
          <img 
            src="${char.image}" 
            alt="${char.name}" 
            class="character-card__image"
            loading="lazy"
          />
        </div>
        
        <div class="character-card__content">
          <h3 class="character-card__name">
            ${char.name}
            <span class="character-card__name-zh">${char.name_zh}</span>
          </h3>
          
          <p class="character-card__desc">${desc}</p>
          
          <div class="character-card__detail">
            <div class="character-card__tags">
              ${tags.map(tag => `<span class="character-tag">${tag}</span>`).join('')}
            </div>
            
            <div class="character-info">
              <div class="character-info__item">
                <svg class="character-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
                <span>${char.age} ${this.t('age')}</span>
              </div>
              <div class="character-info__item">
                <svg class="character-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                <span>${occupation}</span>
              </div>
            </div>
            
            <div class="character-traits">
              ${traits.map(trait => `<span class="character-trait">${trait}</span>`).join('')}
            </div>
            
            <button class="character-card__action" data-char-id="${char.id}">
              ${this.t('startChat')}
              <svg class="character-card__action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    // Character card click
    document.getElementById('character-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.character-card');
      const actionBtn = e.target.closest('.character-card__action');
      
      if (card || actionBtn) {
        const charId = actionBtn?.dataset.charId || card?.dataset.charId;
        if (charId) {
          this.selectCharacter(charId);
        }
      }
    });
    
    // Keyboard navigation
    document.getElementById('character-grid').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.character-card');
        if (card) {
          e.preventDefault();
          this.selectCharacter(card.dataset.charId);
        }
      }
    });
    
    // Skip button
    document.getElementById('skip-btn')?.addEventListener('click', () => {
      this.navigateToChat('yuki'); // Default character
    });
    
    // Language switch
    document.getElementById('lang-switch')?.addEventListener('click', () => {
      this.toggleLanguage();
    });
    
    // Auth button
    document.getElementById('auth-btn')?.addEventListener('click', () => {
      this.handleAuth();
    });
  }
  
  /**
   * Select a character and navigate to chat
   */
  selectCharacter(charId) {
    this.selectedChar = charId;
    
    // Add selection visual feedback
    document.querySelectorAll('.character-card').forEach(card => {
      card.classList.remove('character-card--selected');
    });
    
    const selectedCard = document.querySelector(`[data-char-id="${charId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('character-card--selected');
    }
    
    // Navigate to chat page
    this.navigateToChat(charId);
  }
  
  /**
   * Navigate to chat page with character parameter
   */
  navigateToChat(charId) {
    // Store selection for persistence
    localStorage.setItem('selectedChar', charId);
    
    // Navigate with URL parameter
    window.location.href = `chat.html?char=${charId}`;
  }
  
  /**
   * Toggle language
   */
  toggleLanguage() {
    this.lang = this.lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', this.lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = this.lang;
    
    // Update language switch button text
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) {
      langSwitch.textContent = this.lang === 'en' ? 'EN/中' : '中/EN';
    }
    
    // Re-render
    this.applyTranslations();
    this.renderCharacterGrid();
    this.bindEvents();
  }
  
  /**
   * Check authentication status
   */
  checkAuthStatus() {
    const user = localStorage.getItem('user');
    const authBtn = document.getElementById('auth-btn');
    
    if (user && authBtn) {
      try {
        const userData = JSON.parse(user);
        authBtn.textContent = `${this.t('logoutBtn')} (${userData.email?.split('@')[0] || 'User'})`;
      } catch (e) {
        authBtn.textContent = this.t('loginBtn');
      }
    }
  }
  
  /**
   * Handle auth button click
   */
  handleAuth() {
    const user = localStorage.getItem('user');
    
    if (user) {
      // Logout
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.reload();
    } else {
      // Redirect to auth page
      window.location.href = 'auth.html';
    }
  }
}

// ============================================
// Initialize on DOM ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  new LandingPage();
});
