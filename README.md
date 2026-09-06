# ⭐ Star AI WhatsApp Bot

Star AI is a friendly, funny WhatsApp assistant powered by DeepSeek.  
It can chat, reply to messages, read forwards, and acknowledge images/videos.

## ✨ Features
- **Casual Chat**: Talks like a close friend. Max 2 sentences per reply.
- **Memory**: Remembers last 10 messages per user.
- **Reply Context**: Understands when you reply to a message.
- **Forward Support**: Detects forwarded messages.
- **Media Aware**: Knows when you send images/videos + captions.
- **Image Generation**: `generate image of [prompt]` → sends AI image.
- **Anti-Ban**: Cooldowns + random skip + typing delay.
- **Pairing UI**: Link any WhatsApp number with 1 click.

## 📦 Tech Stack
- Node.js 18+
- @whiskeysockets/baileys for WhatsApp
- Express.js for pairing server
- DeepSeek API for AI
- Pollinations.ai for free image generation

## 🚀 Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-username/star-ai-bot
cd star-ai-bot
npm install
