# Cloudflare Workers AI 模型研究报告

## 虚拟女友项目 - 模型选型分析

生成时间：2026-10-24（本版替换 2026-08-08 旧版，旧版可在 git 历史中查看）

信息来源（均为官方页面，核对于 2026-10-24）：
- 模型目录：https://developers.cloudflare.com/workers-ai/models/
- 更新日志（含下架公告）：https://developers.cloudflare.com/workers-ai/changelog/
- 定价说明：https://developers.cloudflare.com/workers-ai/platform/pricing/

---

## 一、调研结论（TL;DR）

1. **无需紧急迁移**：项目当前使用的 6 个模型全部仍在官方目录中，两轮下架（2025-10-01、2026-05-30）均未涉及本项目在用的任何模型。
2. **免费额度机制澄清**：Workers AI 的"免费"不是按模型划分免费/收费，而是**所有模型共享每天 10,000 Neurons 的免费额度**（Free 和 Paid 计划都有），每日 00:00 UTC 重置。仅少数超大模型要求绑定付费方式才能调用（见 4.3）。
3. **最大的成本隐患不是 LLM，而是 TTS**：按官方单价换算，`@cf/deepgram/aura-1` 每合成 100 字符约消耗 136 neurons，一次语音回复（约 500 字符）≈ 680 neurons；免费额度 10,000 neurons/天 只够 **约 15 条** aura-1 语音回复。相比之下 LLM 一轮对话仅约 8~50 neurons。
4. **有明确的低成本升级机会**：免费档 LLM 可从 `llama-3.2-3b-instruct` 升级到 `qwen3-30b-a3b-fp8`（单价完全相同、MoE 架构速度快、中文更强）；VIP 档可考虑 `gpt-oss-20b/120b`（输出单价比 70B 便宜 3~7 倍）。✅ 免费档升级已于 2026-10-24 实施（见第九节）。
5. **旧报告两处建议已失效**：`@cf/qwen/qwen2.5-14b-instruct-awq` 已不在目录中（由 qwen3 系列接替）；`aura-luna/asteria/stella` 作为独立模型确实已移除，但其音色以 `speaker` 参数形式内置在 `aura-1` 中（项目已正确利用，见 `src/index.js` 的 speakerMap）。

---

## 二、当前项目模型使用清单与状态核对

以下全部经官方目录逐个核对，**状态均为：可用**。

| 用途 | 模型 | 代码位置 | 官方单价 | 上下文/说明 |
|------|------|---------|---------|------------|
| LLM（VIP 对话/语音/实时通话） | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | `src/index.js` → `MODELS.llmVip` | 输入 $0.293/M tokens，输出 $2.253/M tokens | 24K，支持函数调用 |
| LLM（免费用户，**2026-10-24 已更换**） | `@cf/qwen/qwen3-30b-a3b-fp8` | `src/index.js` → `MODELS.llmFree` | 输入 $0.0509/M，输出 $0.335/M（与旧 3b 完全同价） | 32K，MoE 约 3B 激活参数，中文更强 |
| TTS（中文主模型） | `@cf/myshell-ai/melotts` | `src/index.js` → `MODELS.ttsZh` | $0.000205/音频分钟（18.63 neurons/分钟） | 多语言，输出 MP3 |
| TTS（英文主模型） | `@cf/deepgram/aura-1` + `speaker` 参数 | `src/index.js` → `MODELS.ttsEn` | $0.015/千字符（1,363.64 neurons/千字符） | 12 种音色，默认 angus（男声） |
| TTS（最终兜底，**2026-10-24 已更换**） | `@cf/myshell-ai/melotts`（lang=en） | `src/index.js` → `MODELS.ttsFallback` | $0.000205/音频分钟 | 替换原 `aura-2-en`（价格仅其 1/200），`aura-2-en` 引用已全部移除 |
| STT（语音输入/实时通话） | `@cf/openai/whisper-large-v3-turbo` | `src/index.js` → `MODELS.stt` | $0.000513/音频分钟（46.63 neurons/分钟） | 支持 Batch、VAD、防幻觉参数 |
| 图片生成（死代码） | `@cf/stabilityai/stable-diffusion-xl-base-1.0` | `src/index.js` `generateImageAsync`（仅被已注释代码调用） | 目录中仍存在（Beta 状态） | 实际不可达，属遗留代码 |

所有模型 ID 已集中定义在 `src/index.js` 顶部的 `MODELS` 常量中（2026-10-24 实施），下次迁移只需改一处；三处 LLM 调用统一走 `runChatLLM()` 辅助函数（见第九节实施记录）。

**aura-1 音色核对**（与最近"对话过程中保持女声"提交相关）：官方支持 12 个 speaker：`angus`(默认/男)、`asteria`、`arcas`、`orion`、`orpheus`、`athena`、`luna`、`zeus`、`perseus`、`helios`、`hera`、`stella`。项目当前的映射 yuki→luna、aria→asteria、luna→stella 全部有效。

---

## 三、平台动态：两轮模型下架

### 3.1 2025-10-01 下架（19 个，公告于 2025-09-18）
全部为 TheBloke/旧社区模型（@hf/thebloke/*）、qwen1.5 系列、falcon-7b、openchat、tinyllama 等。官方推荐替代：Llama 4 Scout、gpt-oss-120b。**与本项目无关。**

### 3.2 2026-05-30 下架（18 个，公告于 2026-05-08）
主要包括：
- `@cf/meta/llama-3-8b-instruct`、`@cf/meta/llama-3.1-8b-instruct`（含 awq 版）
- `@cf/meta/llama-3.1-70b-instruct`（非 fast 版）
- `@cf/meta/llama-2-7b-chat-*`、mistral-7b-v0.1/v0.2、`@cf/google/gemma-3-12b-it`
- `@cf/microsoft/phi-2`、`@cf/unum/uform-gen2-qwen-500m`、`@cf/facebook/bart-large-cnn` 等
- `@cf/moonshotai/kimi-k2.5`（请求自动别名到 kimi-k2.6）

官方推荐替代：`@cf/zai-org/glm-4.7-flash`（快速工具调用）、`@cf/google/gemma-4-26b-a4b-it`、`@cf/moonshotai/kimi-k2.6`。

**注意**：`-fast` 和 `-lora` 变体不受影响（因此目录中仍有 `llama-3.1-8b-instruct-fp8`）。**本项目在用模型均不在此列**，但 llama-3.1/3.2/3.3 这一代属于"上一代"，后续批次下架时应再次核对更新日志。

---

## 四、免费额度与付费限制

### 4.1 免费额度
- 所有模型共享 **10,000 Neurons/天**（Workers Free 与 Paid 计划相同），00:00 UTC 重置，超限直接报错。
- 换算：$0.011 / 1,000 Neurons，即每天免费额度 ≈ **$0.11**。
- 概念澄清：目录中的模型没有"免费模型/收费模型"之分，差别只在消耗 Neurons 的速率。

### 4.2 主要在用/候选模型的 Neurons 换算
（按一次典型对话轮估算：输入约 700 tokens（系统提示+6 条历史），输出约 150 tokens）

| 调用 | 换算 | 单轮估算消耗 | 10,000 neurons 约可支撑 |
|------|------|-------------|----------------------|
| llama-3.2-3b（免费档 LLM） | $0.0509/M 入，$0.335/M 出 | ≈ 8 neurons | ≈ 1,200 轮 |
| qwen3-30b-a3b-fp8 | 与 3b 同价 | ≈ 8 neurons | ≈ 1,200 轮 |
| glm-4.7-flash | $0.0605/M 入，$0.40/M 出 | ≈ 9 neurons | ≈ 1,100 轮 |
| llama-3.3-70b-fp8-fast（VIP） | $0.293/M 入，$2.253/M 出 | ≈ 50 neurons | ≈ 200 轮 |
| gpt-oss-20b | $0.20/M 入，$0.30/M 出 | ≈ 6 neurons（不含推理 token） | ≈ 1,600 轮 |
| gpt-oss-120b | $0.35/M 入，$0.75/M 出 | ≈ 11 neurons（不含推理 token） | ≈ 900 轮 |
| melotts（TTS） | 18.63 neurons/分钟 | 10 秒语音 ≈ 3 neurons | ≈ 3,000 条短语音 |
| **aura-1（TTS）** | 1,363.64 neurons/千字符 | 500 字符回复 ≈ **680 neurons** | **≈ 15 条** |
| aura-2-en（TTS） | 2,727.27 neurons/千字符 | 500 字符回复 ≈ 1,360 neurons | ≈ 7 条 |
| whisper-large-v3-turbo | 46.63 neurons/分钟 | 10 秒输入 ≈ 8 neurons | ≈ 1,280 次 |

> ⚠️ **关键发现**：aura-1 语音合成的单位成本约为 LLM 一轮对话的 10 倍以上。免费档用户若默认走 aura-1，语音功能的额度消耗会远超文本功能。melotts 每分钟价格反而比 whisper 还低，是极低成本的兜底方案（且 `lang` 默认 `en`，也支持英文）。

### 4.3 需绑定付费方式才能调用的模型（免费计划不可用）
`@cf/moonshotai/kimi-k2.6`、`@cf/moonshotai/kimi-k2.7-code`、`@cf/zai-org/glm-5.2`、`@cf/zai-org/glm-5.3`、`@cf/zai-org/glm-5.3-flash`、`@cf/deepseek-ai/deepseek-v4-flash-0731`、`@cf/deepseek-ai/deepseek-v4.1-flash-1017`、`@cf/deepseek-ai/deepseek-v4-pro-0813`。

注意：**`glm-5.3-flash` 也在付费限制名单里**，选型时不要被名字里的 "flash" 误导；而 `glm-4.7-flash` 不受限制。

---

## 五、目录中的最新模型（2025-08 至 2026-06 新增）

按用途筛选与本项目相关的：

### 5.1 LLM
| 模型 | 单价（入/出 per M） | 上下文 | 亮点 | 免费计划可用 |
|------|------------------|--------|------|------------|
| `@cf/zai-org/glm-4.7-flash` | $0.0605 / $0.40 | 131K | 多语言（100+）、强中文、官方下架公告的推荐替代 | ✅ |
| `@cf/qwen/qwen3-30b-a3b-fp8` | $0.0509 / $0.335 | 32K | MoE（约 3B 激活参数）速度快，中文强 | ✅ |
| `@cf/openai/gpt-oss-20b` | $0.20 / $0.30 | 128K | 推理档位 low/medium/high，支持函数调用 | ✅ |
| `@cf/openai/gpt-oss-120b` | $0.35 / $0.75 | 128K | 同上，质量更高 | ✅ |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | $0.27 / $0.85 | 131K | 原生多模态（可看图） | ✅ |
| `@cf/google/gemma-4-26b-a4b-it` | 见模型页 | - | 官方推荐的高效开源模型 | ✅ |
| `@cf/nvidia/nemotron-3-120b-a12b` | 见模型页 | - | NVIDIA 最新 MoE | ✅ |
| `@cf/zai-org/glm-5.2 / 5.3 / 5.3-flash`、`@cf/moonshotai/kimi-k2.6 / k2.7-code`、`@cf/deepseek-ai/deepseek-v4*` | 见模型页 | - | 旗舰级 | ❌ 需付费计划 |

### 5.2 语音
- TTS：`@cf/deepgram/aura-2-en` / `aura-2-es`（2025-10 上线的新一代，音质更好但价格是 aura-1 的 2 倍，且 aura-2-en 只有英文；aura-1 音色多、更便宜）。
- STT：`@cf/deepgram/flux`（专为语音 Agent 设计，适合实时通话场景）、`@cf/deepgram/nova-3`。
- 实时对话辅助：`@cf/pipecat-ai/smart-turn-v2`（说话结束/轮次检测，可优化实时通话的打断体验）。

### 5.3 图片生成（若未来重启该功能）
`@cf/black-forest-labs/flux-2-dev`、`flux-2-klein-4b`、`flux-2-klein-9b`（2026-01 上线）、`@cf/black-forest-labs/flux-1-schnell`、`@cf/bytedance/stable-diffusion-xl-lightning`、Leonardo `lucid-origin` / `phoenix-1.0`。SDXL base 1.0 仍可用但属于旧选择。

---

## 六、针对本项目的建议

### 🔴 必须做（0 项）
无。所有在用模型均可用，不存在被迫迁移。

### 🟠 建议做（收益明显、改动小）

**1. ✅ 已实施（2026-10-24）免费档 LLM 升级：`llama-3.2-3b-instruct` → `qwen3-30b-a3b-fp8`**
- 单价与 3b 完全相同（$0.0509/$0.335），但参数量大 10 倍（MoE，激活仅 3B，延迟与 3B 级别相当），角色扮演质量和中文自然度显著更好。
- 本项目核心场景是中文/英文情感对话，Qwen3 的中文能力远强于 Llama 3.2。
- 32K 上下文对"系统提示 + 最近 6 条历史"的用法绰绰有余。
- 实施方式：`MODELS.llmFree` 常量 + `runChatLLM()` 辅助函数，见第九节。

**2. VIP 档 LLM 评估：`llama-3.3-70b-fp8-fast` → `gpt-oss-120b`（或 20b）— 暂不实施**
- 输出单价 $0.75 vs $2.253（便宜 3 倍），上下文 128K vs 24K，推理能力更强。
- ⚠️ 注意事项：gpt-oss 是推理模型，会消耗推理 token，且角色扮演的"人味"需要实测（建议设 `reasoning: { effort: 'low' }` 并 A/B 对比）；70B 目前无任何问题，不急。现在只需改 `MODELS.llmVip` 一个常量即可切换。
- 若想让 VIP 用户"发照片、AI 会看"，`llama-4-scout`（$0.27/$0.85，原生视觉）是比 70B 更便宜且带视觉的选择。

**3. 语音功能的免费额度策略（重要）**
- aura-1 单条回复 ≈ 680 neurons，免费额度每天只够约 15 条语音回复。若产品要面向较多免费用户，建议：
  - 免费用户：全部走 `melotts`（中英文都支持，成本约为 aura-1 的 1/200）；
  - VIP 用户：英文走 `aura-1` + 角色音色，中文走 `melotts`（现状）。
- 或至少在前端对免费用户限制语音条数，避免额度被 TTS 快速耗尽。
- ✅ 兜底已统一（2026-10-24）：所有 `aura-2-en` 兜底路径已改为 `melotts`（lang=en，价格仅其 1/200）；`aura-2-en` 引用已全部移除，少维护一个模型。免费用户全面走 melotts 属产品决策（需 TTS 接口接入鉴权判断 VIP），暂未实施。

### 🟡 可选/中期

**4. 实时通话延迟优化**：语音链路是 STT→LLM→TTS 串行三段。可评估 `@cf/deepgram/flux`（为语音 Agent 设计的流式 STT）替换 whisper-turbo 的实时通话路径，以及用 `@cf/pipecat-ai/smart-turn-v2` 做轮次检测减少"抢话/等待"。`src/index.js:1677`、`:1535`。

**5. 清理死代码**：`generateImageAsync`（`src/index.js:216-232`）及其唯一调用点（`:832-835` 已注释）仍引用 SDXL。要么删除，要么若计划重启图片功能，直接换成 `flux-2-klein-4b`（快、新、质量好）。

**6. 图片理解新功能**（旧报告提过，现在有了更好的载体）：用户发照片 → `llama-4-scout` 或 `@cf/meta/llama-3.2-11b-vision-instruct` 生成回应。

### 🟢 运维习惯
- 每季度复查一次官方更新日志（https://developers.cloudflare.com/workers-ai/changelog/ ）；llama-3.x 这一代属"上一代"，未来下架批次需要重点关注。
- ✅ 已实施（2026-10-24）：模型 ID 已提取为 `src/index.js` 顶部的 `MODELS` 常量，下次迁移只改一处。

---

## 七、旧报告（2026-08-08）勘误

| 旧报告内容 | 现状（2026-10-24 核实） |
|-----------|------------------------|
| 推荐 `@cf/qwen/qwen2.5-14b-instruct-awq` 作为中文优化 | ❌ 已不在目录中，接替者为 `@cf/qwen/qwen3-30b-a3b-fp8` |
| "Llama 3.1 8B ~8 neurons/请求、70B ~70 neurons/请求" | ❌ 与官方换算不符（见 4.2，实际约 8 和 50 neurons/轮，且随 token 量浮动） |
| aura-luna/asteria/stella 已移除 | ✅ 独立模型确实移除，但音色以 `speaker` 参数保留在 aura-1 中 |
| `@cf/moonshotai/kimi-k2.7-code` 262K 上下文 | ✅ 模型存在，但需绑定付费方式才能调用 |
| `@cf/zai-org/glm-4.7-flash` 131K 上下文 | ✅ 正确，且免费计划可用 |
| 免费配额 10,000 neurons/天 | ✅ 仍然正确 |

---

## 八、参考链接

- [Workers AI 模型目录](https://developers.cloudflare.com/workers-ai/models/)
- [Workers AI 更新日志（含下架公告）](https://developers.cloudflare.com/workers-ai/changelog/)
- [2026-05-30 下架公告（18 个模型）](https://developers.cloudflare.com/changelog/post/2026-05-08-planned-model-deprecations/)
- [Workers AI 定价与免费额度](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [aura-1 模型页（含 speaker 列表）](https://developers.cloudflare.com/workers-ai/models/aura-1/)

---

## 九、实施记录（2026-10-24 低成本升级）

已在 `src/index.js` 完成，全部通过 `node --check` 与 `wrangler deploy --dry-run` 验证：

1. **模型 ID 集中化**：新增 `MODELS` 常量（`llmVip` / `llmFree` / `ttsZh` / `ttsEn` / `ttsFallback` / `stt`），替换原先分散在 3 类处理器中的 12 处字符串字面量。
2. **免费档 LLM 更换**：`@cf/meta/llama-3.2-3b-instruct` → `@cf/qwen/qwen3-30b-a3b-fp8`（文本聊天、语音聊天、实时通话 3 处同步生效，单价不变）。
3. **Qwen3 思考模式处理**（新增 `runChatLLM()` 辅助函数，3 处 LLM 调用统一走它）：
   - Qwen3 默认输出 `<think>...</think>` 思考内容；若不处理，思考文本会直接进入对话气泡和 TTS 朗读，且可能耗尽 `max_tokens` 导致回复为空。
   - 处理方式：system 提示末尾追加 `/no_think`（Qwen3 官方软开关，关闭思考模式），并以正则剥离 `<think>` 块作为兜底（兼容未闭合的截断情况）。
4. **TTS 兜底统一**：所有 `aura-2-en` 兜底路径改为 `melotts`（lang=en）。`aura-2-en` 单价是 melotts 的约 200 倍，且兜底路径极少触发，用最便宜的模型兜底即可；同时少维护一个模型。中文路径的兜底由 `aura-2-en` 改为 `aura-1`。
5. **未变更**：VIP 仍用 `llama-3.3-70b-instruct-fp8-fast`（切换只需改 `MODELS.llmVip`）；STT 仍用 `whisper-large-v3-turbo`；角色音色映射（yuki→luna、aria→asteria、luna→stella）不变。

**遗留事项**：
- 免费用户全面走 melotts 的 TTS 分级策略属产品决策（`/api/tts/speak` 目前无鉴权，需先接入 token 校验），暂未实施。
- 免费档切换到 Qwen3 后建议实际对话验证回复质量与延迟；若发现偶发 `<think>` 泄漏，`runChatLLM()` 的剥离逻辑会兜底，同时可反馈调整。

---

**报告生成时间**：2026-10-24
**项目当前版本**：Llama 3.3 70B fp8-fast (VIP) / Qwen3 30B-A3B (免费) + melotts/aura-1 + whisper-large-v3-turbo
**建议复查周期**：每季度
