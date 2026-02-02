<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MwPW1pXAWDxWKyJ8bBEzt3hZbJowohLi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `DEEPSEEK_API_KEY` in `.env` to your DeepSeek API key
3. Optional: set `GITHUB_TOKEN` in `.env` to a GitHub personal access token to increase API rate limits from 60 to 5000 requests/hour
4. Optional: set `DEEPSEEK_CHAT_MODEL` for quick reasoning and `DEEPSEEK_REASONER_MODEL` for deep analysis.
   The app auto-selects the model based on profile complexity to manage token usage.
5. Run the app:
   `npm run dev`
