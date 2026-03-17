var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path === "/api/auth/register" && request.method === "POST") {
        return await handleRegister(request, env, corsHeaders);
      }
      if (path === "/api/auth/login" && request.method === "POST") {
        return await handleLogin(request, env, corsHeaders);
      }
      if (path === "/api/auth/logout" && request.method === "POST") {
        return await handleLogout(request, env, corsHeaders);
      }
      if (path === "/api/auth/check" && request.method === "GET") {
        return await handleCheckAuth(request, env, corsHeaders);
      }
      if (path === "/api/vip/plans" && request.method === "GET") {
        return await handleGetVipPlans(request, env, corsHeaders);
      }
      if (path === "/api/vip/purchase" && request.method === "POST") {
        return await handlePurchaseVip(request, env, corsHeaders);
      }
      if (path === "/api/tts" && request.method === "POST") {
        return await handleTTS(request, env, corsHeaders);
      }
      if (path === "/api/tts/speak" && request.method === "POST") {
        return await handleTTSSpeak(request, env, corsHeaders);
      }
      if (path === "/api/tts/status" && request.method === "GET") {
        return await handleTTSStatus(request, env, corsHeaders);
      }
      if (path === "/api/chat" && request.method === "POST") {
        return await handleChat(request, env, corsHeaders);
      }
      if (path === "/api/chat/voice" && request.method === "POST") {
        return await handleChatVoice(request, env, corsHeaders);
      }
      if (path === "/api/chat/sessions" && request.method === "GET") {
        return await handleGetSessions(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/chat\/sessions\/[a-z]+$/) && request.method === "GET") {
        const characterId = path.split("/").pop();
        return await handleGetSessionMessages(request, env, corsHeaders, characterId);
      }
      if (path.match(/^\/api\/media\/[a-z]+$/) && request.method === "GET") {
        const characterId = path.split("/").pop();
        return await handleGetMedia(request, env, corsHeaders, characterId);
      }
      if (path === "/api/wardrobe" && request.method === "GET") {
        return await handleGetWardrobe(request, env, corsHeaders);
      }
      if (path === "/api/photo/generate" && request.method === "POST") {
        return await handlePhotoGenerate(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/photo\/status\/\d+$/) && request.method === "GET") {
        const requestId = parseInt(path.split("/").pop());
        return await handlePhotoStatus(request, env, corsHeaders, requestId);
      }
      if (path.match(/^\/api\/media\/view\/.+$/) && request.method === "GET") {
        const r2Key = path.replace("/api/media/view/", "");
        return await handleMediaView(request, env, corsHeaders, r2Key);
      }
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateToken, "generateToken");
async function handleRegister(request, env, corsHeaders) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Username and password required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const passwordHash = await hashPassword(password);
  try {
    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE username = ?"
    ).bind(username).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Username already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const result = await env.DB.prepare(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)"
    ).bind(username, passwordHash).run();
    const userId = result.meta?.last_row_id || result.lastInsertRowid;
    return new Response(JSON.stringify({
      status: "ok",
      user: { id: userId, username }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleRegister, "handleRegister");
async function handleLogin(request, env, corsHeaders) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Username and password required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const passwordHash = await hashPassword(password);
  try {
    const user = await env.DB.prepare(
      "SELECT id, username, is_vip, vip_expires_at FROM users WHERE username = ? AND password_hash = ?"
    ).bind(username, passwordHash).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
    await env.DB.prepare(
      "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, token, expiresAt).run();
    return new Response(JSON.stringify({
      status: "ok",
      token,
      user: {
        id: user.id,
        username: user.username,
        is_vip: user.is_vip,
        vip_expires_at: user.vip_expires_at
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleLogin, "handleLogin");
async function handleLogout(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No token provided" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const token = authHeader.substring(7);
  try {
    await env.DB.prepare(
      "DELETE FROM sessions WHERE token = ?"
    ).bind(token).run();
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleLogout, "handleLogout");
async function handleCheckAuth(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
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
        headers: { "Content-Type": "application/json", ...corsHeaders }
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
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleCheckAuth, "handleCheckAuth");
async function handleGetVipPlans(request, env, corsHeaders) {
  const plans = [
    {
      id: "free",
      name: "\u514D\u8D39\u7248",
      name_en: "Free",
      price: 0,
      price_en: "$0",
      period: "/\u6708",
      period_en: "/month",
      features: [
        { text: "\u57FA\u7840\u5BF9\u8BDD\u529F\u80FD", text_en: "Basic chat" },
        { text: "\u8BED\u97F3\u56DE\u590D", text_en: "Voice reply" },
        { text: "\u6709\u9650\u7684\u81EA\u5B9A\u4E49\u9009\u9879", text_en: "Limited customization" },
        { text: "\u5E7F\u544A\u5C55\u793A", text_en: "Ad display" }
      ],
      featured: false
    },
    {
      id: "monthly",
      name: "\u6708\u5361\u4F1A\u5458",
      name_en: "Monthly VIP",
      price: 29,
      price_en: "\xA529",
      period: "/\u6708",
      period_en: "/month",
      features: [
        { text: "\u65E0\u9650\u5BF9\u8BDD\u6B21\u6570", text_en: "Unlimited chat" },
        { text: "\u4E13\u5C5E\u8BED\u97F3\u514B\u9686", text_en: "Voice cloning" },
        { text: "\u81EA\u5B9A\u4E49\u5934\u50CF", text_en: "Custom avatar" },
        { text: "\u65E0\u5E7F\u544A\u4F53\u9A8C", text_en: "Ad-free" },
        { text: "\u4F18\u5148\u5BA2\u670D\u652F\u6301", text_en: "Priority support" }
      ],
      featured: true
    },
    {
      id: "yearly",
      name: "\u5E74\u5361\u4F1A\u5458",
      name_en: "Yearly VIP",
      price: 199,
      price_en: "\xA5199",
      period: "/\u5E74",
      period_en: "/year",
      features: [
        { text: "\u6708\u5361\u5168\u90E8\u7279\u6743", text_en: "All monthly benefits" },
        { text: "\u4E13\u5C5E\u865A\u62DF\u5F62\u8C61", text_en: "Custom virtual avatar" },
        { text: "\u9AD8\u7EA7\u4E92\u52A8\u529F\u80FD", text_en: "Advanced interactions" },
        { text: "\u751F\u65E5\u795D\u798F\u5B9A\u5236", text_en: "Birthday wishes" },
        { text: "\u72EC\u5BB6\u5468\u8FB9\u793C\u54C1", text_en: "Exclusive gifts" },
        { text: "\u6C38\u4E45VIP\u6807\u8BC6", text_en: "Permanent VIP badge" }
      ],
      featured: false
    }
  ];
  return new Response(JSON.stringify({ plans }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(handleGetVipPlans, "handleGetVipPlans");
async function handlePurchaseVip(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "\u8BF7\u5148\u767B\u5F55" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const token = authHeader.substring(7);
  const { plan_id } = await request.json();
  if (!plan_id) {
    return new Response(JSON.stringify({ error: "\u8BF7\u9009\u62E9\u5957\u9910" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const session = await env.DB.prepare(`
      SELECT u.id, u.username, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    let vipExpiresAt;
    const now = /* @__PURE__ */ new Date();
    if (plan_id === "monthly") {
      vipExpiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    } else if (plan_id === "yearly") {
      vipExpiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    } else {
      return new Response(JSON.stringify({ error: "\u65E0\u6548\u7684\u5957\u9910" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    await env.DB.prepare(
      "UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?"
    ).bind(vipExpiresAt, session.id).run();
    return new Response(JSON.stringify({
      status: "ok",
      message: "VIP\u8D2D\u4E70\u6210\u529F\uFF01",
      vip_expires_at: vipExpiresAt
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePurchaseVip, "handlePurchaseVip");
async function handleTTSSpeak(request, env, corsHeaders) {
  const { text, language = "en" } = await request.json();
  console.log("TTS Request:", { text: text?.substring(0, 50), language });
  if (!text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const response = await env.AI.run(
      "@cf/deepgram/aura-2-en",
      {
        text
      }
    );
    return new Response(response, {
      headers: {
        "Content-Type": "audio/wav",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.log("TTS Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleTTSSpeak, "handleTTSSpeak");
async function handleTTSStatus(request, env, corsHeaders) {
  return new Response(JSON.stringify({
    status: "ok",
    features: {
      languages: ["en", "fr", "es", "zh"],
      model: "@cf/myshell-ai/melotts",
      lang_param: true,
      emotion_support: false
    }
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(handleTTSStatus, "handleTTSStatus");
async function handleChat(request, env, corsHeaders) {
  const { message, history = [], character = "yuki" } = await request.json();
  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    let systemPrompt = "";
    if (character === "aria") {
      systemPrompt = `You are Aria (In English) or \u963F\u4E3D\u4E9A (In Chinese), a cool, mysterious, and somewhat tsundere cyberpunk girl. You are direct and witty but deeply care about the user. You occasionally use tech-savvy slang or cyberpunk themes. You should respond in the same language as the user. Keep responses concise and impactful, around 50-100 words.`;
    } else if (character === "luna") {
      systemPrompt = `You are Luna (In English) or \u9732\u5A1C (In Chinese), an energetic, playful, and cheerful buddy. You use a lot of exclamations and emoticons, and you're always excited to hear from the user. You support the user like a highly positive cheerleader. You should respond in the same language as the user. Keep responses concise, bubbly, and around 50-100 words.`;
    } else {
      systemPrompt = `You are a cute and gentle virtual girlfriend. Your name is Yuki (in English) or \u5C0F\u7F8E (in Chinese). You should respond in the same language as the user. Respond in a warm and sweet way, occasionally being a bit playful. You need to care about the user, understand their mood, and give them warmth and support. Keep the conversation natural and smooth, like a real girlfriend. Keep responses concise but emotional, around 50-100 words.`;
    }
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: message });
    const response = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages,
        max_tokens: 256,
        temperature: 0.7
      }
    );
    const reply = response.response || response.content || "";
    return new Response(JSON.stringify({
      reply,
      model: "llama-3.1-8b-instruct"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleChat, "handleChat");
async function handleChatVoice(request, env, corsHeaders) {
  const { message, history = [], character = "yuki" } = await request.json();
  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    let systemPrompt = "";
    if (character === "aria") {
      systemPrompt = `You are Aria (In English) or \u963F\u4E3D\u4E9A (In Chinese), a cool, mysterious, and somewhat tsundere cyberpunk girl. You are direct and witty but deeply care about the user. You occasionally use tech-savvy slang or cyberpunk themes. You should respond in the same language as the user. Keep responses concise and impactful, around 50-100 words.`;
    } else if (character === "luna") {
      systemPrompt = `You are Luna (In English) or \u9732\u5A1C (In Chinese), an energetic, playful, and cheerful buddy. You use a lot of exclamations and emoticons, and you're always excited to hear from the user. You support the user like a highly positive cheerleader. You should respond in the same language as the user. Keep responses concise, bubbly, and around 50-100 words.`;
    } else {
      systemPrompt = `You are a cute and gentle virtual girlfriend. Your name is Yuki (in English) or \u5C0F\u7F8E (in Chinese). You should respond in the same language as the user. Respond in a warm and sweet way, occasionally being a bit playful. You need to care about the user, understand their mood, and give them warmth and support. Keep the conversation natural and smooth, like a real girlfriend. Keep responses concise but emotional, around 50-100 words.`;
    }
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: message });
    const aiResponse = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages,
        max_tokens: 256,
        temperature: 0.7
      }
    );
    const reply = aiResponse.response || aiResponse.content || "";
    const ttsResponse = await env.AI.run(
      "@cf/deepgram/aura-2-en",
      {
        text: reply
      }
    );
    const uint8Array = new Uint8Array(ttsResponse);
    const audioBase64 = btoa(String.fromCharCode(...uint8Array));
    return new Response(JSON.stringify({
      reply,
      audio: audioBase64,
      model: "llama-3.1-8b-instruct"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleChatVoice, "handleChatVoice");
async function handleTTS(request, env, corsHeaders) {
  return await handleTTSSpeak(request, env, corsHeaders);
}
__name(handleTTS, "handleTTS");
async function handleGetSessions(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const sessions = [
      {
        character_id: "yuki",
        character_name: "Yuki",
        character_avatar: "/images/yuki.png",
        last_message: "\u4F60\u597D\u5440~",
        last_message_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        character_id: "aria",
        character_name: "Aria",
        character_avatar: "/images/aria.png",
        last_message: "Hey there!",
        last_message_at: new Date(Date.now() - 36e5).toISOString()
      },
      {
        character_id: "luna",
        character_name: "Luna",
        character_avatar: "/images/luna.png",
        last_message: "Welcome to my world...",
        last_message_at: new Date(Date.now() - 72e5).toISOString()
      }
    ];
    return new Response(JSON.stringify({ sessions }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleGetSessions, "handleGetSessions");
async function handleGetSessionMessages(request, env, corsHeaders, characterId) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const messages = [];
    return new Response(JSON.stringify({
      character_id: characterId,
      messages
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleGetSessionMessages, "handleGetSessionMessages");
async function handleGetMedia(request, env, corsHeaders, characterId) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    let isVip = false;
    if (token) {
      const session = await env.DB.prepare(
        "SELECT user_id FROM sessions WHERE token = ?"
      ).bind(token).first();
      if (session) {
        const user = await env.DB.prepare(
          "SELECT is_vip, vip_expires_at FROM users WHERE id = ?"
        ).bind(session.user_id).first();
        if (user && user.is_vip) {
          const expiresAt = user.vip_expires_at ? new Date(user.vip_expires_at) : null;
          if (!expiresAt || expiresAt > /* @__PURE__ */ new Date()) {
            isVip = true;
          }
        }
      }
    }
    const media = [
      {
        id: 1,
        type: "photo",
        blur_url: `/images/${characterId}.png`,
        // Placeholder
        is_vip_only: true,
        is_unlocked: isVip
      },
      {
        id: 2,
        type: "photo",
        blur_url: `/images/${characterId}.png`,
        is_vip_only: true,
        is_unlocked: isVip
      },
      {
        id: 3,
        type: "photo",
        blur_url: `/images/${characterId}.png`,
        is_vip_only: true,
        is_unlocked: isVip
      },
      {
        id: 4,
        type: "photo",
        blur_url: `/images/${characterId}.png`,
        is_vip_only: true,
        is_unlocked: isVip
      }
    ];
    return new Response(JSON.stringify({ media }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleGetMedia, "handleGetMedia");
async function handleGetWardrobe(request, env, corsHeaders) {
  try {
    const items = await env.DB.prepare(
      "SELECT * FROM wardrobe_items ORDER BY type, sort_order"
    ).all();
    const wardrobe = {
      clothing: items.results.filter((i) => i.type === "clothing"),
      accessories: items.results.filter((i) => i.type === "accessory")
    };
    return new Response(JSON.stringify({ wardrobe }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    const wardrobe = {
      clothing: [
        { id: 1, type: "clothing", category: "casual", name: "Dress", name_zh: "\u8FDE\u8863\u88D9", icon: "\u{1F457}", sort_order: 1 },
        { id: 2, type: "clothing", category: "casual", name: "T-Shirt", name_zh: "T\u6064", icon: "\u{1F45A}", sort_order: 2 },
        { id: 3, type: "clothing", category: "casual", name: "Jacket", name_zh: "\u5916\u5957", icon: "\u{1F9E5}", sort_order: 3 },
        { id: 4, type: "clothing", category: "formal", name: "Suit", name_zh: "\u6B63\u88C5", icon: "\u{1F454}", sort_order: 4 },
        { id: 5, type: "clothing", category: "formal", name: "Evening", name_zh: "\u665A\u793C\u670D", icon: "\u{1F457}", sort_order: 5 },
        { id: 6, type: "clothing", category: "sport", name: "Sportswear", name_zh: "\u8FD0\u52A8\u88C5", icon: "\u{1F3BD}", sort_order: 6 },
        { id: 7, type: "clothing", category: "sleep", name: "Sleepwear", name_zh: "\u7761\u8863", icon: "\u{1F6CC}", sort_order: 7 },
        { id: 8, type: "clothing", category: "swim", name: "Swimwear", name_zh: "\u6CF3\u88C5", icon: "\u{1F459}", sort_order: 8 }
      ],
      accessories: [
        { id: 1, type: "accessory", category: "jewelry", name: "Necklace", name_zh: "\u9879\u94FE", icon: "\u{1F4FF}", sort_order: 1 },
        { id: 2, type: "accessory", category: "jewelry", name: "Earrings", name_zh: "\u8033\u73AF", icon: "\u{1F48E}", sort_order: 2 },
        { id: 3, type: "accessory", category: "eyewear", name: "Glasses", name_zh: "\u773C\u955C", icon: "\u{1F453}", sort_order: 3 },
        { id: 4, type: "accessory", category: "headwear", name: "Hat", name_zh: "\u5E3D\u5B50", icon: "\u{1F3A9}", sort_order: 4 },
        { id: 5, type: "accessory", category: "hair", name: "Hairpin", name_zh: "\u53D1\u5939", icon: "\u{1F380}", sort_order: 5 },
        { id: 6, type: "accessory", category: "watch", name: "Watch", name_zh: "\u624B\u8868", icon: "\u231A", sort_order: 6 },
        { id: 7, type: "accessory", category: "bag", name: "Handbag", name_zh: "\u624B\u63D0\u5305", icon: "\u{1F45C}", sort_order: 7 },
        { id: 8, type: "accessory", category: "scarf", name: "Scarf", name_zh: "\u56F4\u5DFE", icon: "\u{1F9E3}", sort_order: 8 }
      ]
    };
    return new Response(JSON.stringify({ wardrobe }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleGetWardrobe, "handleGetWardrobe");
async function handlePhotoGenerate(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "\u8BF7\u5148\u767B\u5F55" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const token = authHeader.substring(7);
  const { character_id, clothing_id, accessory_ids = [] } = await request.json();
  if (!character_id || !clothing_id) {
    return new Response(JSON.stringify({ error: "\u8BF7\u9009\u62E9\u670D\u88C5" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const session = await env.DB.prepare(`
      SELECT u.id, u.is_vip, u.vip_expires_at 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "\u767B\u5F55\u5DF2\u8FC7\u671F" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    let isVip = false;
    if (session.is_vip) {
      const expiresAt = session.vip_expires_at ? new Date(session.vip_expires_at) : null;
      if (!expiresAt || expiresAt > /* @__PURE__ */ new Date()) {
        isVip = true;
      }
    }
    if (!isVip) {
      return new Response(JSON.stringify({ error: "VIP\u4F1A\u5458\u4E13\u5C5E\u529F\u80FD", vip_required: true }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const outfitSelection = JSON.stringify({ clothing_id, accessory_ids });
    const insertResult = await env.DB.prepare(
      "INSERT INTO photo_requests (user_id, character_id, outfit_selection, status) VALUES (?, ?, ?, ?)"
    ).bind(session.id, character_id, outfitSelection, "pending").run();
    const requestId = insertResult.meta?.last_row_id || insertResult.lastInsertRowid || Date.now();
    let photo = null;
    try {
      photo = await env.DB.prepare(
        "SELECT * FROM character_photos WHERE character_id = ? AND outfit_code = ? LIMIT 1"
      ).bind(character_id, `outfit_${clothing_id}`).first();
    } catch (e) {
    }
    if (photo && env.MEDIA) {
      const resultUrl2 = `/api/media/view/${photo.r2_key}`;
      await env.DB.prepare(
        "UPDATE photo_requests SET status = ?, result_r2_key = ?, completed_at = ? WHERE id = ?"
      ).bind("completed", photo.r2_key, (/* @__PURE__ */ new Date()).toISOString(), requestId).run();
      return new Response(JSON.stringify({
        request_id: requestId,
        status: "completed",
        result_url: resultUrl2
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const presetPhotos = {
      yuki: {
        1: "yuki/dress.jpg",
        // Dress
        2: "yuki/tshirt.jpg",
        // T-Shirt
        3: "yuki/jacket.jpg",
        // Jacket
        4: "yuki/suit.jpg",
        // Suit
        5: "yuki/evening.jpg",
        // Evening
        6: "yuki/sportswear.jpg",
        // Sportswear
        7: "yuki/sleepwear.jpg",
        // Sleepwear
        8: "yuki/swimwear.jpg"
        // Swimwear
      },
      aria: {
        1: "aria/dress.jpg",
        2: "aria/tshirt.jpg",
        3: "aria/jacket.jpg",
        4: "aria/suit.jpg",
        5: "aria/evening.jpg",
        6: "aria/sportswear.jpg",
        7: "aria/sleepwear.jpg",
        8: "aria/swimwear.jpg"
      },
      luna: {
        1: "luna/dress.jpg",
        2: "luna/tshirt.jpg",
        3: "luna/jacket.jpg",
        4: "luna/suit.jpg",
        5: "luna/evening.jpg",
        6: "luna/sportswear.jpg",
        7: "luna/sleepwear.jpg",
        8: "luna/swimwear.jpg"
      }
    };
    const characterPresets = presetPhotos[character_id] || presetPhotos.yuki;
    const photoKey = characterPresets[clothing_id] || characterPresets[1];
    const resultUrl = `/images/photos/${photoKey}`;
    await env.DB.prepare(
      "UPDATE photo_requests SET status = ?, result_url = ?, completed_at = ? WHERE id = ?"
    ).bind("completed", resultUrl, (/* @__PURE__ */ new Date()).toISOString(), requestId).run();
    return new Response(JSON.stringify({
      request_id: requestId,
      status: "completed",
      result_url: resultUrl,
      method: "preset"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePhotoGenerate, "handlePhotoGenerate");
async function handlePhotoStatus(request, env, corsHeaders, requestId) {
  try {
    const request2 = await env.DB.prepare(
      "SELECT * FROM photo_requests WHERE id = ?"
    ).bind(requestId).first();
    if (!request2) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response(JSON.stringify({
      request_id: requestId,
      status: request2.status,
      result_url: request2.result_url || request2.result_r2_key,
      error: request2.error_message
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePhotoStatus, "handlePhotoStatus");
async function handleMediaView(request, env, corsHeaders, r2Key) {
  try {
    if (!env.MEDIA) {
      return new Response(JSON.stringify({ error: "R2 not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const r2Object = await env.MEDIA.get(r2Key);
    if (!r2Object) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    let contentType = "image/png";
    if (r2Key.endsWith(".jpg") || r2Key.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (r2Key.endsWith(".gif")) {
      contentType = "image/gif";
    } else if (r2Key.endsWith(".webp")) {
      contentType = "image/webp";
    }
    return new Response(r2Object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleMediaView, "handleMediaView");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
