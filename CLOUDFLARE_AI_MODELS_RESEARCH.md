# Cloudflare Workers AI 模型研究报告
## 虚拟女友项目 - 模型选型分析

生成时间：2026-08-08

---

## 一、当前项目使用的模型

### 1.1 对话模型（LLM）
- **当前使用**：`@cf/meta/llama-3.1-8b-instruct`
- **使用位置**：
  - `src/index.js:858` - 文本聊天
  - `src/index.js:918` - 语音聊天
  - `src/index.js:1662` - 实时语音通话
- **参数配置**：
  - `max_tokens`: 256 (普通聊天), 100 (语音通话)
  - `temperature`: 0.7

### 1.2 语音合成模型（TTS）
- **主要模型**：`@cf/myshell-ai/melotts`
  - 支持多语言：中文、英文、日语、韩语等
  - 使用位置：`src/index.js:710`, `src/index.js:936`
- **英文模型**：`@cf/deepgram/aura-1`
  - 上下文感知 TTS，自然节奏和表现力
  - 使用位置：`src/index.js:703-707`, `src/index.js:984-988`, `src/index.js:1751-1755`
- **备用模型**：`@cf/deepgram/aura-2-en`
  - 仅支持英文
  - 使用位置：`src/index.js:720`, `src/index.js:946`, `src/index.js:1672`

> ⚠️ **重要更新（2026-08-08）**：`@cf/deepgram/aura-luna-en`、`@cf/deepgram/aura-asteria-en`、`@cf/deepgram/aura-stella-en` 已从 Cloudflare 模型目录中移除，已统一改用 `@cf/deepgram/aura-1`。

### 1.3 语音识别模型（STT）
- **当前使用**：`@cf/openai/whisper-large-v3-turbo`
- **使用位置**：`src/index.js:1526`, `src/index.js:1668`
- **功能**：VIP专属功能，用于语音输入和实时通话

> ⚠️ **重要更新（2026-08-08）**：`@cf/openai/whisper-large-v3` 已从 Cloudflare 模型目录中移除，已改用 `@cf/openai/whisper-large-v3-turbo`（更快且支持 Batch）。

### 1.4 图片生成模型
- **曾使用**：`@cf/stabilityai/stable-diffusion-xl-base-1.0`
- **状态**：已注释禁用（第774-832行）
- **原因**：改用预置图片方案（第1267-1324行）

---

## 二、Cloudflare Workers AI 最新模型清单

### 2.1 大语言模型（LLM）- 对话生成

#### 🔥 推荐模型

| 模型名称 | 参数量 | 特点 | 适用场景 |
|---------|--------|------|---------|
| **@cf/meta/llama-4-scout-17b-16e-instruct** | 17B MoE | 🌟 最新，多模态，16专家 | **强烈推荐** - 最佳对话质量 |
| **@cf/meta/llama-3.3-70b-instruct-fp8-fast** | 70B | FP8量化，速度快 | 高质量对话 |
| **@cf/openai/gpt-oss-20b** | 20B | OpenAI开源，推理强 | 高质量对话 |
| **@cf/moonshotai/kimi-k2.7-code** | 1T | 月之暗面，262K上下文 | 长对话场景 |
| **@cf/zai-org/glm-4.7-flash** | - | 智谱AI，131K上下文 | 多语言对话 |
| **@cf/meta/llama-3.2-3b-instruct** | 3B | 轻量级，响应快 | 免费用户（当前方案） |
| **@cf/meta/llama-3.1-8b-instruct** | 8B | 平衡性能 | 已弃用（Deprecated） |

#### 其他可选模型

| 模型名称 | 特点 | 备注 |
|---------|------|------|
| `@cf/qwen/qwen2.5-14b-instruct-awq` | 14B，中文优化 | 🇨🇳 **中文对话更自然** |
| `@cf/qwen/qwen2.5-7b-instruct-awq` | 7B，中文优化 | 中文支持好，速度快 |
| `@cf/qwen/qwen2.5-coder-7b-instruct` | 7B，代码优化 | 不适合聊天场景 |
| `@cf/mistral/mistral-7b-instruct-v0.2` | 7B，欧洲模型 | 英文对话质量好 |
| `@cf/google/gemma-7b-it` | 7B，Google出品 | 安全性高 |

### 2.2 语音合成模型（TTS）

| 模型名称 | 语言支持 | 特点 | 推荐度 |
|---------|---------|------|--------|
| **@cf/myshell-ai/melotts** | 多语言（中英日韩等） | 当前使用，质量好 | ⭐⭐⭐⭐⭐ |
| **@cf/deepgram/aura-1** | 多语言 | 上下文感知，自然节奏 | ⭐⭐⭐⭐⭐ |
| `@cf/deepgram/aura-2-en` | 仅英文 | 备用方案 | ⭐⭐⭐ |

> ⚠️ **已移除**：`aura-luna-en`、`aura-asteria-en`、`aura-stella-en` 已从 Cloudflare 目录中移除（2026-08-08）。
> 所有角色统一使用 `@cf/deepgram/aura-1`（上下文感知 TTS，自动调整节奏和表现力）。

### 2.3 语音识别模型（STT）

| 模型名称 | 语言支持 | 特点 | 推荐度 |
|---------|---------|------|--------|
| **@cf/openai/whisper-large-v3-turbo** | 多语言 | 当前使用，准确且快 | ⭐⭐⭐⭐⭐ |
| `@cf/openai/whisper` | 多语言 | 基础版，准确度高 | ⭐⭐⭐⭐ |
| `@cf/openai/whisper-tiny-en` | 仅英文 | 轻量级，速度快 | ⭐⭐⭐ |

> ⚠️ **已移除**：`@cf/openai/whisper-large-v3` 已从 Cloudflare 目录中移除（2026-08-08），改用 `whisper-large-v3-turbo`。

### 2.4 图片生成模型

| 模型名称 | 分辨率 | 特点 | 推荐度 |
|---------|--------|------|--------|
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | 1024x1024 | 高质量，慢 | ⭐⭐⭐⭐ |
| `@cf/bytedance/stable-diffusion-xl-lightning` | 1024x1024 | 快速生成（4步） | ⭐⭐⭐⭐⭐ |
| `@cf/lykon/dreamshaper-8-lcm` | 可变 | 梦幻风格，快速 | ⭐⭐⭐⭐ |
| `@cf/runwayml/stable-diffusion-v1-5` | 512x512 | 经典模型 | ⭐⭐⭐ |

### 2.5 图片理解模型（Vision）

| 模型名称 | 特点 | 应用场景 |
|---------|------|---------|
| `@cf/meta/llama-3.2-11b-vision-instruct` | 多模态LLM | 理解用户发送的图片 |
| `@cf/unum/uform-gen2-qwen-500m` | 图片描述生成 | 图片内容分析 |

### 2.6 翻译模型

| 模型名称 | 特点 | 应用场景 |
|---------|------|---------|
| `@cf/meta/m2m100-1.2b` | 多语言互译 | 自动翻译聊天内容 |

---

## 三、针对虚拟女友项目的优化建议

### 3.1 🎯 核心升级方案（推荐）

#### 方案A：最佳质量方案
```javascript
// 对话模型升级
LLM: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'  // 70B最新模型
// 或者中文优化
LLM: '@cf/qwen/qwen2.5-14b-instruct-awq'  // 中文对话更自然

// TTS按角色分配不同音色
Yuki: '@cf/deepgram/aura-luna-en'      // 温柔女声
Aria: '@cf/deepgram/aura-asteria-en'   // 神秘女声
Luna: '@cf/deepgram/aura-stella-en'    // 活力女声
// 中文备用
Fallback: '@cf/myshell-ai/melotts'

// STT升级
STT: '@cf/openai/whisper-large-v3'  // 更准确的语音识别
```

**优势**：
- ✅ 对话质量显著提升（70B vs 8B）
- ✅ 每个角色有独特音色
- ✅ 语音识别更准确
- ✅ FP8量化保证速度

**成本**：中等（70B模型消耗更多配额）

---

#### 方案B：中文优化方案
```javascript
// 专门优化中文对话
LLM: '@cf/qwen/qwen2.5-14b-instruct-awq'  // 阿里通义千问，中文最强

// TTS保持现状
TTS: '@cf/myshell-ai/melotts'  // 多语言支持

// STT保持现状
STT: '@cf/openai/whisper'
```

**优势**：
- ✅ 中文对话自然度大幅提升
- ✅ 理解中文语境更准确
- ✅ 成本适中
- ✅ 14B参数量平衡性能和速度

**适用**：主要面向中文用户

---

#### 方案C：性价比方案
```javascript
// 保持当前配置，微调优化
LLM: '@cf/meta/llama-3.1-8b-instruct'  // 不变

// 仅升级TTS，为角色分配音色
Yuki: '@cf/deepgram/aura-luna-en'
Aria: '@cf/deepgram/aura-asteria-en'
Luna: '@cf/deepgram/aura-stella-en'

// STT不变
STT: '@cf/openai/whisper'
```

**优势**：
- ✅ 成本最低
- ✅ 角色音色差异化
- ✅ 改动最小

---

### 3.2 🚀 高级功能扩展

#### 功能1：图片理解（用户发图）
```javascript
// 添加视觉理解能力
Vision: '@cf/meta/llama-3.2-11b-vision-instruct'

// 使用场景：
// - 用户发送自拍，AI评论
// - 用户分享照片，AI理解内容
// - 增强互动体验
```

#### 功能2：重启图片生成
```javascript
// 使用快速生成模型
ImageGen: '@cf/bytedance/stable-diffusion-xl-lightning'

// 优势：
// - 4步生成，速度快5-10倍
// - 质量接近SDXL
// - 适合实时场景
```

#### 功能3：多语言自动翻译
```javascript
// 自动翻译功能
Translation: '@cf/meta/m2m100-1.2b'

// 使用场景：
// - 自动检测用户语言
// - 翻译AI回复
// - 支持更多国家用户
```

---

## 四、具体实施建议

### 4.1 立即可做的优化（无风险）

#### ✅ 优化1：为角色分配专属音色
**修改位置**：`src/index.js` 第689-743行（TTS函数）

```javascript
// 当前代码
async function handleTTSSpeak(request, env, corsHeaders) {
  const { text, language = 'en' } = await request.json();
  
  // 建议改为
  const { text, language = 'en', character = 'yuki' } = await request.json();
  
  // 根据角色选择音色
  const voiceMap = {
    yuki: '@cf/deepgram/aura-luna-en',      // 温柔
    aria: '@cf/deepgram/aura-asteria-en',   // 神秘
    luna: '@cf/deepgram/aura-stella-en'     // 活力
  };
  
  const model = language === 'zh' 
    ? '@cf/myshell-ai/melotts'  // 中文用melotts
    : (voiceMap[character] || '@cf/deepgram/aura-2-en');
}
```

**效果**：每个角色有独特声音，增强沉浸感

---

#### ✅ 优化2：升级到Llama 3.3 70B
**修改位置**：`src/index.js` 第858行、918行、1662行

```javascript
// 将所有
'@cf/meta/llama-3.1-8b-instruct'

// 替换为
'@cf/meta/llama-3.3-70b-instruct-fp8-fast'
```

**效果**：对话质量显著提升，更智能、更自然

---

#### ✅ 优化3：升级Whisper到v3
**修改位置**：`src/index.js` 第1476行、1619行

```javascript
// 将
'@cf/openai/whisper'

// 替换为
'@cf/openai/whisper-large-v3'
```

**效果**：语音识别准确度提升

---

### 4.2 中期优化（需要测试）

#### 🔄 优化4：添加中文优化选项
在配置中添加语言偏好设置，中文用户自动使用Qwen模型

#### 🔄 优化5：重启图片生成
使用Lightning模型，速度快5-10倍

---

### 4.3 长期规划（新功能）

#### 🎨 功能1：图片理解
用户可以发送图片，AI能理解并评论

#### 🌍 功能2：多语言支持
自动检测语言并翻译

#### 🎭 功能3：情感分析
根据对话调整AI情绪和回复风格

---

## 五、成本和配额分析

### Cloudflare Workers AI 免费配额（每天）
- **神经元数量**：10,000 neurons/day
- **不同模型消耗**：
  - Llama 3.1 8B：~8 neurons/请求
  - Llama 3.3 70B：~70 neurons/请求
  - Whisper：~5 neurons/请求
  - TTS：~3 neurons/请求

### 配额计算示例
假设每天100个用户，每人10次对话：

**当前方案（8B）**：
- 对话：1000次 × 8 = 8,000 neurons
- TTS：1000次 × 3 = 3,000 neurons
- **总计**：11,000 neurons ❌ 超出免费额度

**升级方案（70B）**：
- 对话：1000次 × 70 = 70,000 neurons ❌ 远超免费额度

**建议**：
1. 为VIP用户使用70B模型
2. 普通用户使用8B或3B模型
3. 或者升级到付费计划

---

## 六、最终推荐方案

### 🏆 推荐方案：分级服务

```javascript
// 普通用户
LLM: '@cf/meta/llama-3.2-3b-instruct'  // 3B轻量级
TTS: '@cf/deepgram/aura-2-en'          // 基础音色

// VIP用户
LLM: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'  // 70B最强
TTS: 角色专属音色（luna/asteria/stella）
STT: '@cf/openai/whisper-large-v3'
额外功能：图片理解、图片生成

// 中文用户（可选）
LLM: '@cf/qwen/qwen2.5-14b-instruct-awq'
TTS: '@cf/myshell-ai/melotts'
```

### 优势
- ✅ 控制成本，免费用户不超配额
- ✅ VIP体验显著提升，物有所值
- ✅ 差异化服务，促进付费转化
- ✅ 灵活扩展，支持更多功能

---

## 七、实施优先级

### 🔴 高优先级（立即实施）
1. ✅ 为角色分配专属音色（成本低，效果好）
2. ✅ VIP用户升级到70B模型（差异化服务）

### 🟡 中优先级（1-2周内）
3. 🔄 添加Qwen中文模型支持
4. 🔄 升级Whisper到v3

### 🟢 低优先级（长期规划）
5. 🎨 添加图片理解功能
6. 🌍 多语言自动翻译
7. 🎭 情感分析系统

---

## 八、参考资源

- [Cloudflare Workers AI 官方文档](https://developers.cloudflare.com/workers-ai/)
- [模型列表](https://developers.cloudflare.com/workers-ai/models/)
- [定价说明](https://developers.cloudflare.com/workers-ai/platform/pricing/)

---

**报告生成时间**：2026-08-08  
**项目版本**：当前使用 Llama 3.3 70B (VIP) / Llama 3.2 3B (免费)  
**建议更新周期**：每季度重新评估模型选择
