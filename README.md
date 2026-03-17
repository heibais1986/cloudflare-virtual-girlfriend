# Virtual Girlfriend - Cloudflare Worker

基于 Cloudflare Worker 的虚拟女友聊天服务后端，提供 AI 对话、语音合成、图片生成等功能。
因为 Cloudflare 每天提供的免费AI配额，所以普通用户也可以部署，生成自己的专属虚拟女友。 再次感谢赛博活佛！
因为 Cloudflare 的tts模型对于中文支持很差，所以默认界面是英文，聊天也尽量使用英文。 富哥或不习惯英文的用户请自行注册ElevenLabs或使用CosyVoice2来支持中文（音色克隆由于成本原因未开发，接入ElevenLabs或CosyVoice2可支持）。
最后，所有的VIP功能，都是使用的 Cloudflare 每天提供的免费AI配额，所以效果一般，富哥或要求较高的用户可以自行接入其他更加智能的模型。

## 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/heibais1986/cloudflare-virtual-girlfriend)

点击上方按钮即可一键部署到 Cloudflare Workers！部署完成后，请访问 `https://你的域名/init` 完成数据库初始化。

**部署后步骤：**
1. 点击部署按钮，按提示完成 Cloudflare 授权和部署
2. 部署完成后，访问 `https://你的域名/init` 初始化数据库
3. 使用默认账号登录：用户名 `admin`，密码 `admin123`
4. 开始与你的虚拟女友聊天吧！💕

## 功能特性

### 核心功能
- **AI 聊天对话** - 使用 Cloudflare AI (Llama 3.1) 提供角色化对话
- **语音合成 (TTS)** - 支持文字转语音，使用 Deepgram Aura-2
- **语音转文字 (STT)** - 使用 OpenAI Whisper 实现语音识别
- **AI 图片生成** - 根据对话上下文生成场景图片（支持浴室、卧室等场景）
- **语音通话** - 实时语音对话功能

### 角色系统
支持 3 个虚拟角色：
- **Yuki** - 温柔体贴的虚拟女友
- **Aria** - 神秘傲娇的赛博朋克女孩
- **Luna** - 活力开朗的阳光少女

### VIP 系统
- VIP 会员解锁高清图片查看
- 非 VIP 用户看到模糊图片 + 升级引导
- 支持月卡和年卡订阅

## 技术栈

- **运行时**: Cloudflare Worker
- **数据库**: Cloudflare D1 (SQLite)
- **对象存储**: Cloudflare R2
- **AI 推理**: Cloudflare AI (Workers AI)
- **认证**: JWT Token

## 快速开始

### 方案一：一键部署（推荐）

最简单的部署方式，无需安装任何本地工具：

1. **点击部署按钮**
   
   [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/heibais1986/cloudflare-virtual-girlfriend)

2. **登录 Cloudflare 账号**
   
   按页面提示授权 Cloudflare 访问你的 GitHub 仓库

3. **自动部署**
   
   系统会自动创建 D1 数据库、R2 存储桶并部署 Worker

4. **初始化数据库**
   
   部署完成后，访问 `https://你的域名/init` 完成数据库初始化
   
   你会看到成功提示：`{"success": true, "message": "Database initialized successfully"}`

5. **开始使用**
   
   - 访问 `https://你的域名` 打开应用
   - 使用默认账号登录：用户名 `admin`，密码 `admin123`
   - 开始与你的虚拟女友聊天！

---

### 方案二：手动部署（开发者）

如果你需要本地开发或自定义修改，可以使用手动部署：

#### 1. 前置要求

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
```bash
npm install -g wrangler
```

#### 2. 克隆本项目

```bash
git clone https://github.com/heibais1986/cloudflare-virtual-girlfriend.git
cd cloudflare-worker
```

#### 3. 登录 Cloudflare

```bash
wrangler login
```

#### 4. 创建 D1 数据库

```bash
wrangler d1 create virtual-girlfriend
```

记录输出的 `database_id`，更新 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "virtual-girlfriend"
database_id = "your-database-id-here"
```

#### 5. 创建 R2 Bucket

```bash
wrangler r2 bucket create virtual-girlfriend-media
```

#### 6. 初始化数据库

**方式 A：通过 Web 界面（推荐）**

部署后访问 `https://你的域名/init` 自动初始化

**方式 B：通过命令行**

```bash
wrangler d1 execute virtual-girlfriend --file=./schema.sql
```

#### 7. 本地开发

```bash
wrangler dev
```

服务将在 `http://localhost:8787` 启动。

#### 8. 部署

```bash
wrangler deploy
```

## API 文档

### 认证相关

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "yourname",
  "password": "yourpassword"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "yourname",
  "password": "yourpassword"
}

# 响应
{
  "status": "ok",
  "token": "your-jwt-token",
  "user": {
    "id": 1,
    "username": "yourname",
    "is_vip": false
  }
}
```

#### 检查登录状态
```http
GET /api/auth/check
Authorization: Bearer <token>
```

### 聊天相关

#### 发送消息
```http
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "你好",
  "character": "yuki",
  "history": [
    {"role": "user", "content": "之前的消息"}
  ]
}

# 普通响应
{
  "reply": "你好呀~ 很高兴见到你！"
}

# 图片生成响应（当用户请求图片时）
{
  "type": "image_placeholder",
  "generation_id": 123,
  "character_id": "yuki",
  "message_zh": "Yuki 正在准备相机...",
  "message_en": "Yuki is preparing the camera..."
}
```

#### 查询图片生成状态
```http
GET /api/image/status/<generation_id>
Authorization: Bearer <token>

# 响应 - 生成中
{
  "status": "processing",
  "is_vip": false
}

# 响应 - 已完成
{
  "status": "completed",
  "is_vip": false,
  "image_url": "https://.../generated/123/xxx.png",
  "requires_vip": true
}
```

### 语音相关

#### 文字转语音
```http
POST /api/tts/speak
Content-Type: application/json

{
  "text": "你好呀~"
}

# 响应: audio/wav 二进制数据
```

#### 语音转文字
```http
POST /api/speech-to-text
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <音频文件>
```

### VIP 相关

#### 获取 VIP 套餐
```http
GET /api/vip/plans
```

#### 购买 VIP
```http
POST /api/vip/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": "monthly"  // 或 "yearly"
}
```

## 图片生成功能详解

### 触发关键词
用户发送包含以下关键词的消息时会触发图片生成：
- 中文：照片、图片、自拍、看看、发张、来张、拍张
- 英文：photo、picture、selfie、image、pic、send、snap

### 场景识别
系统会根据对话上下文自动识别场景：

| 上下文关键词 | 生成场景 |
|-------------|---------|
| 洗澡、沐浴、bath | 浴室场景（浴缸视角） |
| 睡觉、床、sleep、bed | 卧室场景（床上视角） |
| 厨房、做饭、kitchen、cook | 厨房场景 |
| 外面、公园、outside、park | 户外公园场景 |
| 工作、办公、work、office | 办公室场景 |

### 图片展示逻辑
- **VIP 用户**：直接展示高清原图
- **非 VIP 用户**：展示模糊图片 + "升级 VIP 解锁" 按钮

## 项目结构

```
cloudflare-worker/
├── src/
│   └── index.js          # 主入口文件
├── public/               # 静态文件（前端页面）
│   ├── css/
│   ├── js/
│   ├── images/           # 预置的各种图片
│   └── *.html
├── schema.sql            # 数据库结构
├── wrangler.toml         # Cloudflare 配置
└── README.md             # 本文档
```

## 数据库表结构

### 核心表
- **users** - 用户信息（含 VIP 状态）
- **sessions** - 登录会话（JWT Token）
- **chat_sessions** - 聊天会话
- **chat_messages** - 聊天消息

### 图片生成相关
- **image_generations** - AI 图片生成任务记录
- **user_viewed_images** - 用户查看图片记录

### 媒体库
- **character_media** - 角色预置媒体
- **user_unlocks** - 用户解锁记录

## 环境变量

| 变量名 | 说明 | 位置 |
|--------|------|------|
| `DB` | D1 数据库绑定 | wrangler.toml |
| `R2_BUCKET` | R2 存储桶绑定 | wrangler.toml |
| `AI` | Workers AI 绑定 | wrangler.toml |

## 故障排查

### R2 图片无法访问
所有图片都通过 Worker API (`/api/media/view/{r2_key}`) 代理访问，不需要配置 R2 公开访问。如果图片无法加载：
1. 检查 R2 bucket 名称是否为 `virtual-girlfriend-media`
2. 检查 `wrangler.toml` 中的 `binding` 是否为 `R2_BUCKET`
3. 检查图片是否成功上传到 R2（查看生成日志）

### 数据库连接失败
1. 检查 `database_id` 是否正确
2. 运行 `wrangler d1 list` 确认数据库存在
3. 执行 schema.sql 初始化表结构

### AI 模型调用失败
检查 Cloudflare 账户的 Workers AI 配额和权限。

## 开发注意事项

1. **本地开发**：使用 `wrangler dev` 会自动读取 `.dev.vars` 文件中的环境变量
2. **生产部署**：敏感信息应使用 `wrangler secret put <KEY>` 设置
3. **数据库迁移**：修改 schema.sql 后需要手动执行迁移
4. **图片存储**：生成的图片存储在 R2 的 `generated/` 目录下

## 许可证

Apache-2.0 license

## 赞助我

本人自去年大厂毕业后就一直没有收入，纯靠独立开发勉强度日。如果本项目对您有帮助，可以请我喝杯咖啡，谢谢！

微信支付 (WeChat Pay)
	![image](https://github.com/user-attachments/assets/a5c5ac9f-b3d0-4244-bed5-48116cec5dce)


支付宝 (Alipay)
	![image](https://github.com/user-attachments/assets/72fb93f9-0bb3-48da-bac9-89d5f7960da7)

ETH: 0x143C6b1A6893efafc8F2f76E93dfD08b1441c29a

SOL: 6GTQQNBuDySX7DAsF4mAxjuYygMZ4qfqnMDX4pDKGVds