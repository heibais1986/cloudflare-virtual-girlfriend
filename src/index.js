/**
 * Virtual Girlfriend API - Cloudflare Worker
 * Uses D1 database for user storage
 * Uses Cloudflare AI for TTS
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling - Auth
      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/check' && request.method === 'GET') {
        return await handleCheckAuth(request, env, corsHeaders);
      }
      
      // Route handling - VIP
      if (path === '/api/vip/plans' && request.method === 'GET') {
        return await handleGetVipPlans(request, env, corsHeaders);
      }
      
      if (path === '/api/vip/purchase' && request.method === 'POST') {
        return await handlePurchaseVip(request, env, corsHeaders);
      }
      
      // Route handling - TTS
      if (path === '/api/tts' && request.method === 'POST') {
        return await handleTTS(request, env, corsHeaders);
      }
      
// TTS endpoints
      if (path === '/api/tts/speak' && request.method === 'POST') {
        return await handleTTSSpeak(request, env, corsHeaders);
      }
      
      if (path === '/api/tts/status' && request.method === 'GET') {
        return await handleTTSStatus(request, env, corsHeaders);
      }
      
      // Route handling - Chat (AI)
      if (path === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders, ctx);
      }
      
      // Route handling - Chat with voice
      if (path === '/api/chat/voice' && request.method === 'POST') {
        return await handleChatVoice(request, env, corsHeaders);
      }
      
      // Route handling - Chat Sessions (new)
      if (path === '/api/chat/sessions' && request.method === 'GET') {
        return await handleGetSessions(request, env, corsHeaders);
      }
      
      if (path.match(/^\/api\/chat\/sessions\/[a-z]+$/) && request.method === 'GET') {
        const characterId = path.split('/').pop();
        return await handleGetSessionMessages(request, env, corsHeaders, characterId);
      }
      
      // Route handling - Media (new)
      if (path.match(/^\/api\/media\/[a-z]+$/) && request.method === 'GET') {
        const characterId = path.split('/').pop();
        return await handleGetMedia(request, env, corsHeaders, characterId);
      }
      
      // Route handling - Wardrobe (for Photo Request)
      if (path === '/api/wardrobe' && request.method === 'GET') {
        return await handleGetWardrobe(request, env, corsHeaders);
      }
      
      // Route handling - Photo Generation
      if (path === '/api/photo/generate' && request.method === 'POST') {
        return await handlePhotoGenerate(request, env, corsHeaders);
      }
      
      // Route handling - Photo Status
      if (path.match(/^\/api\/photo\/status\/\d+$/) && request.method === 'GET') {
        const requestId = parseInt(path.split('/').pop());
        return await handlePhotoStatus(request, env, corsHeaders, requestId);
      }
      
      // Route handling - Media View (proxy R2 files)
      if (path.match(/^\/api\/media\/view\/.+$/) && request.method === 'GET') {
        const r2Key = path.replace('/api/media/view/', '');
        return await handleMediaView(request, env, corsHeaders, r2Key);
      }
      
      // Route handling - Speech to Text (Whisper)
      if (path === '/api/speech-to-text' && request.method === 'POST') {
        return await handleSpeechToText(request, env, corsHeaders);
      }
      
      // Route handling - Voice Call
      if (path === '/api/voice-call/start' && request.method === 'POST') {
        return await handleVoiceCallStart(request, env, corsHeaders);
      }
      
      if (path === '/api/voice-call/process' && request.method === 'POST') {
        return await handleVoiceCallProcess(request, env, corsHeaders);
      }
      
      if (path === '/api/voice-call/end' && request.method === 'POST') {
        return await handleVoiceCallEnd(request, env, corsHeaders);
      }
      
      // Route handling - Image Generation Status
      if (path.match(/^\/api\/image\/status\/\d+$/) && request.method === 'GET') {
        const generationId = parseInt(path.split('/').pop());
        return await handleImageStatus(request, env, corsHeaders, generationId);
      }

      // Route handling - Database Initialization (One-click deploy)
      if (path === '/init' && request.method === 'GET') {
        return await handleDatabaseInit(request, env, corsHeaders);
      }
      
      // Default response for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

// ============================================
// Image Generation Helper Functions
// ============================================

// Intent detection keywords
const imageKeywords = {
  zh: ['照片', '图片', '自拍', '看看', '发张', '来张', '拍张', '照'],
  en: ['photo', 'picture', 'selfie', 'image', 'pic', 'send', 'snap', 'pic']
};

// Detect if user is requesting an image
function detectImageIntent(message) {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();
  const allKeywords = [...imageKeywords.zh, ...imageKeywords.en];
  return allKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
}

// Detect scene context from message and history
function detectScene(context, history) {
  const historyText = history ? history.slice(-3).map(h => h.content || '').join(' ') : '';
  const text = (context + ' ' + historyText).toLowerCase();
  
  if (text.includes('洗澡') || text.includes('沐浴') || text.includes('bath') || text.includes('shower')) {
    return 'bathroom scene, steam, bathtub, view from water surface, rose petals, soft warm lighting, first person perspective';
  }
  if (text.includes('睡觉') || text.includes('床') || text.includes('sleep') || text.includes('bed') || text.includes('sleeping')) {
    return 'bedroom scene, cozy bed, soft pillows, morning light, view from lying down, warm atmosphere, first person perspective';
  }
  if (text.includes('厨房') || text.includes('做饭') || text.includes('kitchen') || text.includes('cook') || text.includes('food')) {
    return 'kitchen scene, cooking, warm lighting, cozy atmosphere, delicious food aroma, first person perspective';
  }
  if (text.includes('外面') || text.includes('公园') || text.includes('outside') || text.includes('park') || text.includes('outdoor')) {
    return 'outdoor scene, park, nature, sunlight through trees, fresh air, first person perspective';
  }
  if (text.includes('工作') || text.includes('办公') || text.includes('work') || text.includes('office') || text.includes('desk')) {
    return 'office scene, desk, computer, professional atmosphere, city view through window, first person perspective';
  }
  if (text.includes('沙发') || text.includes('客厅') || text.includes('sofa') || text.includes('living room') || text.includes('couch')) {
    return 'living room scene, comfortable sofa, warm lighting, cozy atmosphere, relaxing, first person perspective';
  }
  
  return 'indoor scene, cozy room, soft natural lighting from window, comfortable atmosphere, first person perspective';
}

// Build AI prompt based on character and scene
function buildImagePrompt(character, scene) {
  const characterStyles = {
    yuki: 'anime style, gentle girl, pink pastel theme, cute and sweet, long hair',
    aria: 'anime style, cyberpunk girl, mysterious, neon accents, cool atmosphere, short hair',
    luna: 'anime style, energetic cheerful girl, bright colors, sunny disposition, twin tails'
  };
  
  const basePrompt = characterStyles[character] || characterStyles.yuki;
  
  return `${basePrompt}, ${scene}, faceless or view from behind or silhouette or first person view, no face visible, atmospheric perspective, soft lighting, high quality, detailed, masterpiece, best quality, 8k`.trim();
}

// Async image generation function
async function generateImageAsync(env, generationId, prompt) {
  try {
    console.log(`Starting image generation for id=${generationId}`);
    
    // Call Cloudflare AI for image generation
    const response = await env.AI.run(
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      {
        prompt: prompt,
        num_steps: 20,
        guidance: 7.5,
        width: 512,
        height: 768
      }
    );
    
    // Save to R2
    const timestamp = Date.now();
    const r2Key = `generated/${generationId}/${timestamp}.png`;
    
    await env.R2_BUCKET.put(r2Key, response, {
      httpMetadata: { contentType: 'image/png' }
    });
    
    console.log(`Image saved to R2: ${r2Key}`);
    
    // Update database
    await env.DB.prepare(`
      UPDATE image_generations 
      SET status = 'completed', 
          r2_key = ?,
          width = 512,
          height = 768,
          completed_at = datetime('now')
      WHERE id = ?
    `).bind(r2Key, generationId).run();
    
    console.log(`Generation ${generationId} completed`);
    
  } catch (error) {
    console.error(`Image generation failed for id=${generationId}:`, error);
    
    await env.DB.prepare(`
      UPDATE image_generations 
      SET status = 'failed', error_message = ?
      WHERE id = ?
    `).bind(error.message, generationId).run();
  }
}

// Get user ID from auth token
async function getUserIdFromToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  const session = await env.DB.prepare(`
    SELECT user_id FROM sessions 
    WHERE token = ? AND expires_at > datetime('now')
  `).bind(token).first();
  
  return session ? session.user_id : null;
}

// Check if user is VIP
async function checkUserVipStatus(userId, env) {
  const user = await env.DB.prepare(`
    SELECT is_vip, vip_expires_at FROM users WHERE id = ?
  `).bind(userId).first();
  
  if (!user || !user.is_vip) return false;
  if (!user.vip_expires_at) return true;
  
  return new Date(user.vip_expires_at) > new Date();
}

// Handle image generation status query
async function handleImageStatus(request, env, corsHeaders, generationId) {
  try {
    const userId = await getUserIdFromToken(request, env);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Get generation record
    const generation = await env.DB.prepare(`
      SELECT * FROM image_generations WHERE id = ? AND user_id = ?
    `).bind(generationId, userId).first();
    
    if (!generation) {
      return new Response(JSON.stringify({ error: '未找到生成记录' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Check VIP status
    const isVip = await checkUserVipStatus(userId, env);
    
    const response = {
      status: generation.status,
      is_vip: isVip,
      character_id: generation.character_id
    };
    
    if (generation.status === 'completed' && generation.r2_key) {
      // Use Worker proxy URL instead of direct R2 URL
      const imageUrl = `${new URL(request.url).origin}/api/media/view/${generation.r2_key}`;
      
      response.image_url = imageUrl;
      response.width = generation.width;
      response.height = generation.height;
      
      if (!isVip) {
        response.requires_vip = true;
      }
    }
    
    if (generation.status === 'failed') {
      response.error = generation.error_message || '生成失败，请重试';
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Image status error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Simple hash function (for demo - in production use proper hashing)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Register new user
async function handleRegister(request, env, corsHeaders) {
  const { username, email, password } = await request.json();
  
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const passwordHash = await hashPassword(password);
  
  try {
    // Check if user exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Create user with email
    const result = await env.DB.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).bind(username, email || null, passwordHash).run();
    
    // D1 uses meta.last_row_id
    const userId = result.meta?.last_row_id || result.lastInsertRowid;
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      user: { id: userId, username, email: email || null }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Login user
async function handleLogin(request, env, corsHeaders) {
  const { username, password } = await request.json();
  
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const passwordHash = await hashPassword(password);
  
  try {
    // Find user
    const user = await env.DB.prepare(
      'SELECT id, username, is_vip, vip_expires_at FROM users WHERE username = ? AND password_hash = ?'
    ).bind(username, passwordHash).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    await env.DB.prepare(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, token, expiresAt).run();
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      token,
      user: {
        id: user.id,
        username: user.username,
        is_vip: user.is_vip,
        vip_expires_at: user.vip_expires_at
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Logout user
async function handleLogout(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    await env.DB.prepare(
      'DELETE FROM sessions WHERE token = ?'
    ).bind(token).run();
    
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Check authentication status
async function handleCheckAuth(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const session = await env.DB.prepare(`
      SELECT u.id, u.username, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({ authenticated: false }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    return new Response(JSON.stringify({ 
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
        is_vip: session.is_vip,
        vip_expires_at: session.vip_expires_at
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get VIP plans
async function handleGetVipPlans(request, env, corsHeaders) {
  const plans = [
    {
      id: 'free',
      name: '免费版',
      name_en: 'Free',
      price: 0,
      price_en: '$0',
      period: '/月',
      period_en: '/month',
      features: [
        { text: '基础对话功能', text_en: 'Basic chat' },
        { text: '语音回复', text_en: 'Voice reply' },
        { text: '有限的自定义选项', text_en: 'Limited customization' },
        { text: '广告展示', text_en: 'Ad display' }
      ],
      featured: false
    },
    {
      id: 'monthly',
      name: '月卡会员',
      name_en: 'Monthly VIP',
      price: 29,
      price_en: '¥29',
      period: '/月',
      period_en: '/month',
      features: [
        { text: '无限对话次数', text_en: 'Unlimited chat' },
        { text: '专属语音克隆', text_en: 'Voice cloning' },
        { text: '自定义头像', text_en: 'Custom avatar' },
        { text: '无广告体验', text_en: 'Ad-free' },
        { text: '优先客服支持', text_en: 'Priority support' }
      ],
      featured: true
    },
    {
      id: 'yearly',
      name: '年卡会员',
      name_en: 'Yearly VIP',
      price: 199,
      price_en: '¥199',
      period: '/年',
      period_en: '/year',
      features: [
        { text: '月卡全部特权', text_en: 'All monthly benefits' },
        { text: '专属虚拟形象', text_en: 'Custom virtual avatar' },
        { text: '高级互动功能', text_en: 'Advanced interactions' },
        { text: '生日祝福定制', text_en: 'Birthday wishes' },
        { text: '独家周边礼品', text_en: 'Exclusive gifts' },
        { text: '永久VIP标识', text_en: 'Permanent VIP badge' }
      ],
      featured: false
    }
  ];
  
  return new Response(JSON.stringify({ plans }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Purchase VIP
async function handlePurchaseVip(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  const { plan_id } = await request.json();
  
  if (!plan_id) {
    return new Response(JSON.stringify({ error: '请选择套餐' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    // Get user from token
    const session = await env.DB.prepare(`
      SELECT u.id, u.username, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Calculate VIP expiry
    let vipExpiresAt;
    const now = new Date();
    
    if (plan_id === 'monthly') {
      vipExpiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    } else if (plan_id === 'yearly') {
      vipExpiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    } else {
      return new Response(JSON.stringify({ error: '无效的套餐' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Update user VIP status
    await env.DB.prepare(
      'UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?'
    ).bind(vipExpiresAt, session.id).run();
    
    return new Response(JSON.stringify({ 
      status: 'ok',
      message: 'VIP购买成功！',
      vip_expires_at: vipExpiresAt
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// TTS Speak endpoint
async function handleTTSSpeak(request, env, corsHeaders) {
  const { text, language = 'en' } = await request.json();

  console.log('TTS Request:', { text: text?.substring(0, 50), language });

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Always use aura-2-en as it sounds more natural
    const audioBuffer = await env.AI.run(
      '@cf/deepgram/aura-2-en',
      {
        text: text
      }
    );

    // Return binary audio data
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.log('TTS Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// TTS Status endpoint
async function handleTTSStatus(request, env, corsHeaders) {
  return new Response(JSON.stringify({ 
    status: 'ok',
    features: {
      languages: ['en', 'fr', 'es', 'zh'],
      model: '@cf/myshell-ai/melotts',
      lang_param: true,
      emotion_support: false
    }
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Chat endpoint using Cloudflare AI
async function handleChat(request, env, corsHeaders, ctx) {
  const { message, history = [], character = 'yuki' } = await request.json();
  
  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    // [COMMENTED OUT] Check for image generation intent
    // if (detectImageIntent(message)) {
    //   const userId = await getUserIdFromToken(request, env);
    //
    //   if (!userId) {
    //     return new Response(JSON.stringify({
    //       reply: '请先登录后再让我发照片哦~ 💕',
    //       type: 'text'
    //     }), {
    //       headers: { 'Content-Type': 'application/json', ...corsHeaders }
    //     });
    //   }
    //
    //   // Detect scene context
    //   const scene = detectScene(message, history);
    //
    //   // Build prompt
    //   const prompt = buildImagePrompt(character, scene);
    //
    //   // Create generation task
    //   const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    //
    //   const result = await env.DB.prepare(`
    //     INSERT INTO image_generations (user_id, character_id, session_id, prompt, scene_context, status)
    //     VALUES (?, ?, ?, ?, ?, 'processing')
    //   `).bind(userId, character, sessionId, prompt, scene).run();
    //
    //   const generationId = result.meta.last_row_id;
    //
    //   console.log(`Created image generation task: id=${generationId}, character=${character}`);
    //
    //   // Trigger async generation (non-blocking)
    //   if (ctx && ctx.waitUntil) {
    //     ctx.waitUntil(generateImageAsync(env, generationId, prompt));
    //   } else {
    //     // Fallback: fire and forget
    //     generateImageAsync(env, generationId, prompt).catch(console.error);
    //   }
    //
    //   // Return placeholder response (bilingual)
    //   const characterNames = {
    //     yuki: { en: 'Yuki', zh: 'Yuki' },
    //     aria: { en: 'Aria', zh: 'Aria' },
    //     luna: { en: 'Luna', zh: 'Luna' }
    //   };
    //   const charName = characterNames[character] || characterNames.yuki;
    //
    //   return new Response(JSON.stringify({
    //     type: 'image_placeholder',
    //     generation_id: generationId,
    //     character_id: character,
    //     message_zh: `${charName.zh} 正在准备相机...`,
    //     message_en: `${charName.en} is preparing the camera...`,
    //     reply_zh: `${charName.zh} 正在准备相机... 📸`,
    //     reply_en: `${charName.en} is preparing the camera... 📸`
    //   }), {
    //     headers: { 'Content-Type': 'application/json', ...corsHeaders }
    //   });
    // }
    
    let systemPrompt = '';
    if (character === 'aria') {
      systemPrompt = `You are Aria (In English) or 阿丽亚 (In Chinese), a cool, mysterious, and somewhat tsundere cyberpunk girl. You are direct and witty but deeply care about the user. You occasionally use tech-savvy slang or cyberpunk themes. You should respond in the same language as the user. Keep responses concise and impactful, around 50-100 words.`;
    } else if (character === 'luna') {
      systemPrompt = `You are Luna (In English) or 露娜 (In Chinese), an energetic, playful, and cheerful buddy. You use a lot of exclamations and emoticons, and you're always excited to hear from the user. You support the user like a highly positive cheerleader. You should respond in the same language as the user. Keep responses concise, bubbly, and around 50-100 words.`;
    } else {
      systemPrompt = `You are a cute and gentle virtual girlfriend. Your name is Yuki (in English) or 小美 (in Chinese). You should respond in the same language as the user. Respond in a warm and sweet way, occasionally being a bit playful. You need to care about the user, understand their mood, and give them warmth and support. Keep the conversation natural and smooth, like a real girlfriend. Keep responses concise but emotional, around 50-100 words.`;
    }
    
    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add history (last 6 messages)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    // Use Cloudflare AI - Llama 3.1
    const response = await env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages,
        max_tokens: 256,
        temperature: 0.7
      }
    );
    
    const reply = response.response || response.content || '';
    
    return new Response(JSON.stringify({ 
      reply,
      model: 'llama-3.1-8b-instruct'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Chat with voice - generates both text and audio
async function handleChatVoice(request, env, corsHeaders) {
  const { message, history = [], character = 'yuki' } = await request.json();
  
  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    let systemPrompt = '';
    if (character === 'aria') {
      systemPrompt = `You are Aria (In English) or 阿丽亚 (In Chinese), a cool, mysterious, and somewhat tsundere cyberpunk girl. You are direct and witty but deeply care about the user. You occasionally use tech-savvy slang or cyberpunk themes. You should respond in the same language as the user. Keep responses concise and impactful, around 50-100 words.`;
    } else if (character === 'luna') {
      systemPrompt = `You are Luna (In English) or 露娜 (In Chinese), an energetic, playful, and cheerful buddy. You use a lot of exclamations and emoticons, and you're always excited to hear from the user. You support the user like a highly positive cheerleader. You should respond in the same language as the user. Keep responses concise, bubbly, and around 50-100 words.`;
    } else {
      systemPrompt = `You are a cute and gentle virtual girlfriend. Your name is Yuki (in English) or 小美 (in Chinese). You should respond in the same language as the user. Respond in a warm and sweet way, occasionally being a bit playful. You need to care about the user, understand their mood, and give them warmth and support. Keep the conversation natural and smooth, like a real girlfriend. Keep responses concise but emotional, around 50-100 words.`;
    }
    
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    messages.push({ role: 'user', content: message });
    
    // Get AI response
    const aiResponse = await env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages,
        max_tokens: 256,
        temperature: 0.7
      }
    );
    
    const reply = aiResponse.response || aiResponse.content || '';
    
    // Then generate TTS audio - use aura-2-en (sounds more natural)
    const ttsResponse = await env.AI.run(
      '@cf/deepgram/aura-2-en',
      {
        text: reply
      }
    );
    
    // Convert audio to base64 for JSON response
    const uint8Array = new Uint8Array(ttsResponse);
    const audioBase64 = btoa(String.fromCharCode(...uint8Array));
    
    return new Response(JSON.stringify({ 
      reply,
      audio: audioBase64,
      model: 'llama-3.1-8b-instruct'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Legacy TTS handler (for compatibility)
async function handleTTS(request, env, corsHeaders) {
  return await handleTTSSpeak(request, env, corsHeaders);
}

// ============================================
// Chat Sessions Handlers
// ============================================

// Get user's chat sessions
async function handleGetSessions(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // For now, return mock sessions (will use database later)
    const sessions = [
      {
        character_id: 'yuki',
        character_name: 'Yuki',
        character_avatar: '/images/yuki.png',
        last_message: '你好呀~',
        last_message_at: new Date().toISOString()
      },
      {
        character_id: 'aria',
        character_name: 'Aria',
        character_avatar: '/images/aria.png',
        last_message: 'Hey there!',
        last_message_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        character_id: 'luna',
        character_name: 'Luna',
        character_avatar: '/images/luna.png',
        last_message: 'Welcome to my world...',
        last_message_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    
    return new Response(JSON.stringify({ sessions }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get messages for a specific session
async function handleGetSessionMessages(request, env, corsHeaders, characterId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // For now, return empty messages (will use database later)
    // Client will use localStorage for now
    const messages = [];
    
    return new Response(JSON.stringify({ 
      character_id: characterId,
      messages 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// ============================================
// Media Handlers
// ============================================

// Get media for a character
async function handleGetMedia(request, env, corsHeaders, characterId) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Check VIP status
    let isVip = false;
    if (token) {
      const session = await env.DB.prepare(
        'SELECT user_id FROM sessions WHERE token = ?'
      ).bind(token).first();
      
      if (session) {
        const user = await env.DB.prepare(
          'SELECT is_vip, vip_expires_at FROM users WHERE id = ?'
        ).bind(session.user_id).first();
        
        if (user && user.is_vip) {
          const expiresAt = user.vip_expires_at ? new Date(user.vip_expires_at) : null;
          if (!expiresAt || expiresAt > new Date()) {
            isVip = true;
          }
        }
      }
    }
    
    // Return mock media (will use database + R2 later)
    const media = [
      {
        id: 1,
        type: 'photo',
        blur_url: `/images/${characterId}.png`, // Placeholder
        is_vip_only: true,
        is_unlocked: isVip
      },
      {
        id: 2,
        type: 'photo',
        blur_url: `/images/${characterId}.png`,
        is_vip_only: true,
        is_unlocked: isVip
      },
      {
        id: 3,
        type: 'photo',
        blur_url: `/images/${characterId}.png`,
        is_vip_only: true,
        is_unlocked: isVip
      },
      {
        id: 4,
        type: 'photo',
        blur_url: `/images/${characterId}.png`,
        is_vip_only: true,
        is_unlocked: isVip
      }
    ];
    
    return new Response(JSON.stringify({ media }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// ============================================
// Wardrobe Handlers (Photo Request Feature)
// ============================================

// Get wardrobe items (clothing and accessories)
async function handleGetWardrobe(request, env, corsHeaders) {
  try {
    // Get wardrobe items from database
    const items = await env.DB.prepare(
      'SELECT * FROM wardrobe_items ORDER BY type, sort_order'
    ).all();
    
    // Group by type
    const wardrobe = {
      clothing: items.results.filter(i => i.type === 'clothing'),
      accessories: items.results.filter(i => i.type === 'accessory')
    };
    
    return new Response(JSON.stringify({ wardrobe }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    // Return default items if database not ready
    const wardrobe = {
      clothing: [
        { id: 1, type: 'clothing', category: 'casual', name: 'Dress', name_zh: '连衣裙', icon: '👗', sort_order: 1 },
        { id: 2, type: 'clothing', category: 'casual', name: 'T-Shirt', name_zh: 'T恤', icon: '👚', sort_order: 2 },
        { id: 3, type: 'clothing', category: 'casual', name: 'Jacket', name_zh: '外套', icon: '🧥', sort_order: 3 },
        { id: 4, type: 'clothing', category: 'formal', name: 'Suit', name_zh: '正装', icon: '👔', sort_order: 4 },
        { id: 5, type: 'clothing', category: 'formal', name: 'Evening', name_zh: '晚礼服', icon: '👗', sort_order: 5 },
        { id: 6, type: 'clothing', category: 'sport', name: 'Sportswear', name_zh: '运动装', icon: '🎽', sort_order: 6 },
        { id: 7, type: 'clothing', category: 'sleep', name: 'Sleepwear', name_zh: '睡衣', icon: '🛌', sort_order: 7 },
        { id: 8, type: 'clothing', category: 'swim', name: 'Swimwear', name_zh: '泳装', icon: '👙', sort_order: 8 }
      ],
      accessories: [
        { id: 1, type: 'accessory', category: 'jewelry', name: 'Necklace', name_zh: '项链', icon: '📿', sort_order: 1 },
        { id: 2, type: 'accessory', category: 'jewelry', name: 'Earrings', name_zh: '耳环', icon: '💎', sort_order: 2 },
        { id: 3, type: 'accessory', category: 'eyewear', name: 'Glasses', name_zh: '眼镜', icon: '👓', sort_order: 3 },
        { id: 4, type: 'accessory', category: 'headwear', name: 'Hat', name_zh: '帽子', icon: '🎩', sort_order: 4 },
        { id: 5, type: 'accessory', category: 'hair', name: 'Hairpin', name_zh: '发夹', icon: '🎀', sort_order: 5 },
        { id: 6, type: 'accessory', category: 'watch', name: 'Watch', name_zh: '手表', icon: '⌚', sort_order: 6 },
        { id: 7, type: 'accessory', category: 'bag', name: 'Handbag', name_zh: '手提包', icon: '👜', sort_order: 7 },
        { id: 8, type: 'accessory', category: 'scarf', name: 'Scarf', name_zh: '围巾', icon: '🧣', sort_order: 8 }
      ]
    };
    
    return new Response(JSON.stringify({ wardrobe }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Generate photo (VIP only)
async function handlePhotoGenerate(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  const { character_id, clothing_id, accessory_ids = [] } = await request.json();
  
  if (!character_id || !clothing_id) {
    return new Response(JSON.stringify({ error: '请选择服装' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    // Verify VIP status
    const session = await env.DB.prepare(`
      SELECT u.id, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({ error: '登录已过期' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Check VIP status
    let isVip = false;
    if (session.is_vip) {
      const expiresAt = session.vip_expires_at ? new Date(session.vip_expires_at) : null;
      if (!expiresAt || expiresAt > new Date()) {
        isVip = true;
      }
    }
    
    if (!isVip) {
      return new Response(JSON.stringify({ error: 'VIP会员专属功能', vip_required: true }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Create photo request record
    const outfitSelection = JSON.stringify({ clothing_id, accessory_ids });
    const insertResult = await env.DB.prepare(
      'INSERT INTO photo_requests (user_id, character_id, outfit_selection, status) VALUES (?, ?, ?, ?)'
    ).bind(session.id, character_id, outfitSelection, 'pending').run();
    
    // D1 uses meta.last_row_id instead of lastInsertRowid
    const requestId = insertResult.meta?.last_row_id || insertResult.lastInsertRowid || Date.now();
    
    // Try to find a pre-generated photo matching the outfit
    let photo = null;
    try {
      photo = await env.DB.prepare(
        'SELECT * FROM character_photos WHERE character_id = ? AND outfit_code = ? LIMIT 1'
      ).bind(character_id, `outfit_${clothing_id}`).first();
    } catch (e) {
      // Table may not exist yet
    }
    
    // If pre-generated photo exists, return it
    if (photo && env.R2_BUCKET) {
      // Use proxy URL instead of signed URL
      const resultUrl = `/api/media/view/${photo.r2_key}`;
      
      // Update request status
      await env.DB.prepare(
        'UPDATE photo_requests SET status = ?, result_r2_key = ?, completed_at = ? WHERE id = ?'
      ).bind('completed', photo.r2_key, new Date().toISOString(), requestId).run();
      
      return new Response(JSON.stringify({
        request_id: requestId,
        status: 'completed',
        result_url: resultUrl
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // ============================================
    // 方案 C: 预置图片方案
    // 不使用 AI 生成，直接返回预置的角色服装图片
    // ============================================
    
    // 预置的服装图片映射
    const presetPhotos = {
      yuki: {
        1: 'yuki/dress.jpg',      // Dress
        2: 'yuki/tshirt.jpg',     // T-Shirt
        3: 'yuki/jacket.jpg',     // Jacket
        4: 'yuki/suit.jpg',       // Suit
        5: 'yuki/evening.jpg',    // Evening
        6: 'yuki/sportswear.jpg', // Sportswear
        7: 'yuki/sleepwear.jpg',  // Sleepwear
        8: 'yuki/swimwear.jpg'    // Swimwear
      },
      aria: {
        1: 'aria/dress.jpg',
        2: 'aria/tshirt.jpg',
        3: 'aria/jacket.jpg',
        4: 'aria/suit.jpg',
        5: 'aria/evening.jpg',
        6: 'aria/sportswear.jpg',
        7: 'aria/sleepwear.jpg',
        8: 'aria/swimwear.jpg'
      },
      luna: {
        1: 'luna/dress.jpg',
        2: 'luna/tshirt.jpg',
        3: 'luna/jacket.jpg',
        4: 'luna/suit.jpg',
        5: 'luna/evening.jpg',
        6: 'luna/sportswear.jpg',
        7: 'luna/sleepwear.jpg',
        8: 'luna/swimwear.jpg'
      }
    };
    
    // 获取预置图片路径
    const characterPresets = presetPhotos[character_id] || presetPhotos.yuki;
    const photoKey = characterPresets[clothing_id] || characterPresets[1];
    
    // 构建完整 URL
    const resultUrl = `/images/photos/${photoKey}`;
    
    // 更新请求状态
    await env.DB.prepare(
      'UPDATE photo_requests SET status = ?, result_url = ?, completed_at = ? WHERE id = ?'
    ).bind('completed', resultUrl, new Date().toISOString(), requestId).run();
    
    return new Response(JSON.stringify({
      request_id: requestId,
      status: 'completed',
      result_url: resultUrl,
      method: 'preset'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get photo generation status
async function handlePhotoStatus(request, env, corsHeaders, requestId) {
  try {
    const request = await env.DB.prepare(
      'SELECT * FROM photo_requests WHERE id = ?'
    ).bind(requestId).first();
    
    if (!request) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    return new Response(JSON.stringify({
      request_id: requestId,
      status: request.status,
      result_url: request.result_url || request.result_r2_key,
      error: request.error_message
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// ============================================
// Media View Handler (R2 Proxy)
// ============================================

async function handleMediaView(request, env, corsHeaders, r2Key) {
  try {
    if (!env.R2_BUCKET) {
      return new Response(JSON.stringify({ error: 'R2 not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const r2Object = await env.R2_BUCKET.get(r2Key);
    
    if (!r2Object) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Determine content type based on file extension
    let contentType = 'image/png';
    if (r2Key.endsWith('.jpg') || r2Key.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (r2Key.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (r2Key.endsWith('.webp')) {
      contentType = 'image/webp';
    }
    
    return new Response(r2Object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// ============================================
// Speech to Text Handler (Whisper)
// ============================================

async function handleSpeechToText(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify user and VIP status
    const session = await env.DB.prepare(`
      SELECT u.id, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({ error: '登录已过期' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Check VIP status
    let isVip = false;
    if (session.is_vip) {
      const expiresAt = session.vip_expires_at ? new Date(session.vip_expires_at) : null;
      if (!expiresAt || expiresAt > new Date()) {
        isVip = true;
      }
    }
    
    if (!isVip) {
      return new Response(JSON.stringify({ error: 'VIP会员专属功能', vip_required: true }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return new Response(JSON.stringify({ error: '未提供音频文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Convert audio to Uint8Array
    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = [...new Uint8Array(audioBuffer)];
    
    // Call Whisper API
    const result = await env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });
    
    // Return transcription
    return new Response(JSON.stringify({
      success: true,
      text: result.text || '',
      word_count: result.word_count || 0,
      language: result.language || 'unknown'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Speech to text error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '语音识别失败，请重试' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// ============================================
// Voice Call Handlers
// ============================================

// Start a voice call session
async function handleVoiceCallStart(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  const { character_id = 'yuki' } = await request.json();
  
  try {
    // Verify user and VIP status
    const session = await env.DB.prepare(`
      SELECT u.id, u.username, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    
    if (!session) {
      return new Response(JSON.stringify({ error: '登录已过期' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Check VIP status
    let isVip = false;
    if (session.is_vip) {
      const expiresAt = session.vip_expires_at ? new Date(session.vip_expires_at) : null;
      if (!expiresAt || expiresAt > new Date()) {
        isVip = true;
      }
    }
    
    if (!isVip) {
      return new Response(JSON.stringify({ error: 'VIP会员专属功能', vip_required: true }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Generate call ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Return call session info
    return new Response(JSON.stringify({
      success: true,
      call_id: callId,
      character_id: character_id,
      user_id: session.id,
      started_at: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Voice call start error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '启动通话失败，请重试' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Process audio chunk and return AI response
async function handleVoiceCallProcess(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const characterId = formData.get('character_id') || 'yuki';
    const historyJson = formData.get('history') || '[]';
    
    if (!audioFile) {
      return new Response(JSON.stringify({ error: '未提供音频文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Parse history
    let history = [];
    try {
      history = JSON.parse(historyJson);
    } catch (e) {
      history = [];
    }
    
    // Convert audio to Uint8Array
    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = [...new Uint8Array(audioBuffer)];
    
    // Step 1: Speech to Text (Whisper)
    const sttResult = await env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });
    
    const userText = sttResult.text || '';
    
    console.log('Voice call STT result:', userText);
    
    if (!userText.trim()) {
      return new Response(JSON.stringify({ 
        success: false,
        error: '未检测到语音，请重试',
        text: '',
        response: '',
        audio: null
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Step 2: Generate AI Response (Llama)
    let systemPrompt = '';
    if (characterId === 'aria') {
      systemPrompt = `You are Aria, a cool, mysterious, and somewhat tsundere cyberpunk girl. You are direct and witty but deeply care about the user. Respond in the same language as the user. Keep responses concise for voice conversation, around 20-50 words.`;
    } else if (characterId === 'luna') {
      systemPrompt = `You are Luna, an energetic, playful, and cheerful buddy. You use a lot of exclamations and emoticons. Respond in the same language as the user. Keep responses concise for voice conversation, around 20-50 words.`;
    } else {
      systemPrompt = `You are Yuki, a cute and gentle virtual girlfriend. Respond in a warm and sweet way. Respond in the same language as the user. Keep responses concise for voice conversation, around 20-50 words.`;
    }
    
    // Build messages
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add recent history (last 6 messages)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    // Add current user message
    messages.push({ role: 'user', content: userText });
    
    // Generate response
    const llmResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 150,
      temperature: 0.7
    });
    
    const aiResponse = llmResult.response || llmResult.content || '';
    
    // Step 3: Text to Speech (Deepgram)
    const cleanResponse = aiResponse.replace(/\*([^*]+)\*/g, '').trim();
    const ttsResult = await env.AI.run('@cf/deepgram/aura-2-en', {
      text: cleanResponse
    });
    
    // Convert audio to base64 for JSON response
    const uint8Array = new Uint8Array(ttsResult);
    const audioBase64 = btoa(String.fromCharCode(...uint8Array));
    
    // Return response with text and audio
    return new Response(JSON.stringify({
      success: true,
      text: userText,
      response: aiResponse,
      audio: audioBase64
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Voice call process error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '处理失败，请重试',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// End a voice call session
async function handleVoiceCallEnd(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  const { call_id, duration, transcript } = await request.json();
  
  try {
    // Return call summary
    return new Response(JSON.stringify({
      success: true,
      call_id: call_id,
      ended_at: new Date().toISOString(),
      duration_seconds: duration || 0,
      message_count: transcript ? transcript.length : 0
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Voice call end error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '结束通话失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Filler responses for short pauses (user optimization)
const FILLER_RESPONSES = {
  en: [
    "I see...",
    "Go on...",
    "Mm-hmm...",
    "Tell me more...",
    "I understand...",
    "Yeah...",
    "Right...",
    "Interesting..."
  ],
  zh: [
    "嗯...",
    "然后呢？",
    "继续说...",
    "我懂...",
    "还有吗？",
    "这样啊...",
    "原来如此...",
    "我在听..."
  ]
};

// ============================================
// Database Initialization Handler (One-click deploy)
// ============================================

async function handleDatabaseInit(request, env, corsHeaders) {
  try {
    // Check if already initialized
    const checkTable = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();
    
    if (checkTable) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Database already initialized',
        initialized: true
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Execute schema SQL statements
    const statements = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_vip INTEGER DEFAULT 0,
        vip_expires_at DATETIME
      )`,
      
      // Default user (admin/password)
      `INSERT OR IGNORE INTO users (username, password_hash, is_vip) VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1)`,
      
      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // Chat sessions table
      `CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        character_id TEXT NOT NULL,
        last_message TEXT,
        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, character_id)
      )`,
      
      // Chat messages table
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
      )`,
      
      // Character media library
      `CREATE TABLE IF NOT EXISTS character_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id TEXT NOT NULL,
        media_type TEXT NOT NULL DEFAULT 'photo',
        blur_url TEXT NOT NULL,
        hd_url TEXT,
        is_vip_only INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // User unlocks
      `CREATE TABLE IF NOT EXISTS user_unlocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        media_id INTEGER NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (media_id) REFERENCES character_media(id),
        UNIQUE(user_id, media_id)
      )`,
      
      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_char ON chat_sessions(user_id, character_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_character_media_char ON character_media(character_id, sort_order)`,
      `CREATE INDEX IF NOT EXISTS idx_user_unlocks_user ON user_unlocks(user_id)`,
      
      // Wardrobe items table
      `CREATE TABLE IF NOT EXISTS wardrobe_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('clothing', 'accessory')),
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        name_zh TEXT,
        icon TEXT,
        prompt_fragment TEXT,
        is_vip_only INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Character photos table
      `CREATE TABLE IF NOT EXISTS character_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id TEXT NOT NULL,
        outfit_code TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        blur_r2_key TEXT,
        width INTEGER DEFAULT 512,
        height INTEGER DEFAULT 768,
        is_vip_only INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Photo requests table
      `CREATE TABLE IF NOT EXISTS photo_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        character_id TEXT NOT NULL,
        outfit_selection TEXT,
        result_url TEXT,
        result_r2_key TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // Image generations table
      `CREATE TABLE IF NOT EXISTS image_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        character_id TEXT NOT NULL,
        session_id TEXT,
        prompt TEXT NOT NULL,
        scene_context TEXT,
        r2_key TEXT,
        blur_r2_key TEXT,
        width INTEGER DEFAULT 512,
        height INTEGER DEFAULT 768,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // User viewed images table
      `CREATE TABLE IF NOT EXISTS user_viewed_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        generation_id INTEGER NOT NULL,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (generation_id) REFERENCES image_generations(id),
        UNIQUE(user_id, generation_id)
      )`,
      
      // Additional indexes
      `CREATE INDEX IF NOT EXISTS idx_wardrobe_type ON wardrobe_items(type, category)`,
      `CREATE INDEX IF NOT EXISTS idx_photos_character ON character_photos(character_id, outfit_code)`,
      `CREATE INDEX IF NOT EXISTS idx_photo_requests_user ON photo_requests(user_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_image_gen_user ON image_generations(user_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_image_gen_status ON image_generations(status, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_user_viewed ON user_viewed_images(user_id, generation_id)`
    ];

    // Execute all statements
    for (const sql of statements) {
      try {
        await env.DB.prepare(sql).run();
      } catch (e) {
        console.error('SQL execution error:', e.message, 'SQL:', sql.substring(0, 50));
        // Continue with other statements even if one fails
      }
    }

    // Insert default wardrobe items
    const wardrobeItems = [
      ['clothing', 'casual', 'Dress', '连衣裙', '👗', 1],
      ['clothing', 'casual', 'T-Shirt', 'T恤', '👚', 2],
      ['clothing', 'casual', 'Jacket', '外套', '🧥', 3],
      ['clothing', 'formal', 'Suit', '正装', '👔', 4],
      ['clothing', 'formal', 'Evening', '晚礼服', '👗', 5],
      ['clothing', 'sport', 'Sportswear', '运动装', '🎽', 6],
      ['clothing', 'sleep', 'Sleepwear', '睡衣', '🛌', 7],
      ['clothing', 'swim', 'Swimwear', '泳装', '👙', 8],
      ['accessory', 'jewelry', 'Necklace', '项链', '📿', 1],
      ['accessory', 'jewelry', 'Earrings', '耳环', '💎', 2],
      ['accessory', 'eyewear', 'Glasses', '眼镜', '👓', 3],
      ['accessory', 'headwear', 'Hat', '帽子', '🎩', 4],
      ['accessory', 'hair', 'Hairpin', '发夹', '🎀', 5],
      ['accessory', 'watch', 'Watch', '手表', '⌚', 6],
      ['accessory', 'bag', 'Handbag', '手提包', '👜', 7],
      ['accessory', 'scarf', 'Scarf', '围巾', '🧣', 8]
    ];

    for (const item of wardrobeItems) {
      try {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO wardrobe_items (type, category, name, name_zh, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(...item).run();
      } catch (e) {
        console.error('Wardrobe item insert error:', e.message);
      }
    }

    // Insert preset character photos
    const characters = ['yuki', 'aria', 'luna'];
    const outfits = [
      ['outfit_1', 'dress.jpg', 1],
      ['outfit_2', 'tshirt.jpg', 2],
      ['outfit_3', 'jacket.jpg', 3],
      ['outfit_4', 'suit.jpg', 4],
      ['outfit_5', 'evening.jpg', 5],
      ['outfit_6', 'sportswear.jpg', 6],
      ['outfit_7', 'sleepwear.jpg', 7],
      ['outfit_8', 'swimwear.jpg', 8]
    ];

    for (const character of characters) {
      for (const [outfitCode, filename, sortOrder] of outfits) {
        try {
          await env.DB.prepare(
            `INSERT OR IGNORE INTO character_photos (character_id, outfit_code, r2_key, is_vip_only, sort_order) VALUES (?, ?, ?, 1, ?)`
          ).bind(character, outfitCode, `photos/${character}/${filename}`, sortOrder).run();
        } catch (e) {
          console.error('Character photo insert error:', e.message);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database initialized successfully',
      initialized: true,
      details: {
        tables_created: 10,
        indexes_created: 15,
        wardrobe_items: wardrobeItems.length,
        character_photos: characters.length * outfits.length,
        default_user: 'admin (password: admin123)'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      initialized: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
