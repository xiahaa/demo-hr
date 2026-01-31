# GitTalent AI

A high-end candidate analysis platform that transforms GitHub profiles into visual bento-style reports with engineering scores, tech stack radar charts, and salary estimates using AI.

## Features

- 📊 **Tech Stack Radar Charts** - Visual representation of candidate's technology expertise
- 💯 **Engineering Scores** - AI-powered assessment across multiple dimensions
- 💰 **Salary Estimates** - Data-driven compensation recommendations
- 🎨 **Bento-Style Reports** - Beautiful, modern card-based UI
- 🚀 **Demo Mode** - Try it instantly without any GitHub profile

## Quick Start

**Prerequisites:** Node.js (v16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file and add your DeepSeek API key:
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   ```
   
   Optional: Configure specific models:
   ```
   DEEPSEEK_CHAT_MODEL=deepseek-chat
   DEEPSEEK_REASONER_MODEL=deepseek-reasoner
   ```
   The app auto-selects the model based on profile complexity to manage token usage.

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Try demo mode:**
   - Open the app in your browser
   - Click "View Live Demo" or enter "demo" as the GitHub URL
   - See a complete analysis with mock data

## Documentation

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Overview of recent improvements and testing guide
- **Testing Instructions** - Run `npm run dev` and test with real GitHub profiles

## How It Works

1. Enter a GitHub profile URL (or use demo mode)
2. AI analyzes 100+ repositories and language statistics
3. Generates comprehensive assessment including:
   - Tech stack with expertise scores
   - Engineering capability metrics
   - Salary recommendations
   - Interview questions

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **Charts:** Recharts
- **AI:** DeepSeek API
- **Icons:** Lucide React
