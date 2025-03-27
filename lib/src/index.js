import express from 'express';
import dotenv from 'dotenv';
import { initializeTweetFetching, TweetManager } from './scheduler';
// Load environment variables from .env file
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
// Middleware for parsing JSON bodies
app.use(express.json());
// Basic route
app.get('/', async (req, res) => {
    res.json({ message: 'Hello World' });
});
app.get('/tweets_on_queue', async (req, res) => {
    const tweetManager = TweetManager.getInstance();
    const tweets = tweetManager.getTweetsOnQueue();
    const status = tweetManager.isEnabled();
    res.json({ tweets, status: status ? 'enabled' : 'disabled' });
});
app.get('/disable', async (req, res) => {
    const tweetManager = TweetManager.getInstance();
    tweetManager.disable();
    res.json({ message: 'Tweet manager disabled' });
});
app.get('/enable', async (req, res) => {
    const tweetManager = TweetManager.getInstance();
    tweetManager.enable();
    res.json({ message: 'Tweet manager enabled' });
});
// Initialize the application
(async () => {
    try {
        initializeTweetFetching();
        app.listen(port, () => {
            console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);
    }
})();
