# X AI Pet 🥜

<div align="center">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=OpenAI&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/X-%23000000.svg?style=for-the-badge&logo=X&logoColor=white" alt="X">
</div>

## Overview
CA：0x66368b7D0146405dCF22dFE1F9D98CA61dFCd0dD

https://x.com/dog_fragrance

X AI Pet is an intelligent agent-based system that automates interactions on X using AI-powered personas. It monitors mentions and replies to tweets with context-aware, persona-driven responses through advanced Large Language Model integration.

The system implements multiple AI personas (currently we implemented: CZ, Vitalik, Heyi) specializing in cryptocurrency topics while maintaining unique, consistent personalities. These personas can analyze conversations, filter out spam, and generate appropriate responses that match their character traits.

In the future we will build a To-C platform for the bot which allows end-users to generate a bot easily with a few clicks.

## Features

- **Multiple AI Personas**: Includes customizable personas with distinct personalities and knowledge bases
- **Intelligent Tweet Selection**: Automatically filters spam and selects relevant tweets for response
- **Scheduled Tweet Processing**: Uses cron jobs to periodically fetch and process mentions
- **Content Moderation**: Integrates sophisticated rule-based and AI-powered filtering
- **RESTful API**: Provides endpoints to monitor and control the bot's operations
- **Memory Management**: Maintains efficient tweet history with size limitations

## Architecture

```
├── src/                  # Source code
│   ├── agent.ts          # AI agent implementation
│   ├── scheduler.ts      # Cron job scheduler
│   ├── twitter.ts        # Twitter API integration
│   ├── index.ts          # Application entry point
│   ├── process.ts        # Process utilities
│   └── vectorIndex.ts    # Vector indexing for AI memory
├── dist/                 # Compiled JavaScript
├── lib/                  # Additional libraries
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/x-bot.git
   cd x-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with the following variables:
   ```
   PORT=3000
   AGENT_NAME=cz  # Options: cz, vitalik, heyi
   TWITTER_API_KEY=your_api_key
   TWITTER_API_KEY_SECRET=your_api_key_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
   TWITTER_USER_ID=your_user_id
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Build the project:
   ```
   npm run build
   ```

5. Start the application:
   ```
   npm start
   ```

## API Endpoints

- `GET /`: Health check
- `GET /tweets_on_queue`: Get tweets waiting for processing
- `GET /disable`: Disable the tweet manager
- `GET /enable`: Enable the tweet manager

## AI Personas

The bot can assume different personas, each with unique characteristics:

- **CZ (Binance CEO)**: Responds with sarcastic, engaging comments about the cryptocurrency space
- **Vitalik (Ethereum Founder)**: Provides technical insights with a "Dark Vitalik" persona
- **Heyi (Binance Co-founder)**: Responds with "green tea" personality, seemingly innocent but calculated

## Tweet Selection Process

1. Tweets are fetched via the Twitter API
2. Rule-based filters remove spam and advertisements
3. AI-based filtering selects relevant, high-quality tweets
4. Selected tweets are queued for response generation
5. Responses are generated using the configured AI persona
6. Responses are posted back to Twitter

## Development

Start the development server with hot reloading:
```
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
