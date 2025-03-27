import cron from 'node-cron';
import { getUserMentionTimelineXTimes, quoteAndComment, replyTweet } from './twitter';
import { replyToTweet, selectTweet } from './agent';
export class TweetManager {
    static instance;
    czTweets = [];
    MAX_TWEETS = 1000; // Prevent unlimited memory growth
    enabled = false;
    constructor() { }
    static getInstance() {
        if (!TweetManager.instance) {
            TweetManager.instance = new TweetManager();
        }
        return TweetManager.instance;
    }
    enable() {
        this.enabled = true;
        console.log('Tweet manager enabled');
    }
    disable() {
        this.enabled = false;
        console.log('Tweet manager disabled');
    }
    isEnabled() {
        return this.enabled;
    }
    addTweets(tweets) {
        if (!this.enabled)
            return;
        this.czTweets = [...new Map([...this.czTweets, ...tweets].map(tweet => [tweet.id, tweet])).values()]
            .filter(tweet => tweet.text.length > 10)
            .slice(-this.MAX_TWEETS); // Keep only the latest tweets
    }
    async getTweetsToReply() {
        if (!this.enabled)
            return [];
        const tweetsToReply = await selectTweet(this.czTweets);
        this.czTweets = this.czTweets.filter(tweet => !tweetsToReply.includes(tweet.id));
        return [...this.czTweets];
    }
    getTweetsOnQueue() {
        return this.czTweets;
    }
    getTweetsCount() {
        return this.czTweets.length;
    }
    removeTweet(id) {
        this.czTweets = this.czTweets.filter(tweet => tweet.id !== id);
    }
}
// Initialize tweet fetching (every 30 minutes)
export function initializeTweetFetching() {
    const tweetManager = TweetManager.getInstance();
    tweetManager.enable(); // Enable by default
    console.log('Tweet fetching initialized');
    // Schedule tweet fetching every 30 minutes starting at 0 min
    cron.schedule('*/15 * * * *', async () => {
        console.log('Tweet fetching scheduled');
        if (!tweetManager.isEnabled())
            return;
        try {
            console.log('Fetching CZ tweets...');
            const tweets = await getUserMentionTimelineXTimes(process.env.CZ_USER_ID ?? "", 3);
            const myTweets = await getUserMentionTimelineXTimes(process.env.MY_USER_ID ?? "", 3);
            tweetManager.addTweets(tweets);
            tweetManager.addTweets(myTweets);
            console.log(`Fetched and stored ${tweets.length} tweets. Total tweets in memory: ${tweetManager.getTweetsCount()}`);
        }
        catch (error) {
            console.error('Error fetching tweets:', error);
        }
    });
    // Schedule random replies every 5 minutes with random delay
    cron.schedule('*/3 * * * *', async () => {
        if (!tweetManager.isEnabled())
            return;
        try {
            // Random delay between 0-240 seconds (0-4 minutes) to simulate human behavior
            const randomDelay = Math.floor(Math.random() * 240);
            console.log(`Scheduling reply with ${randomDelay} seconds delay...`);
            setTimeout(async () => {
                if (!tweetManager.isEnabled())
                    return;
                const selectedTweets = await tweetManager.getTweetsToReply();
                for (const tweet of selectedTweets) {
                    if (!tweetManager.isEnabled())
                        break;
                    try {
                        // Generate reply using AI
                        const aiResponse = await replyToTweet(tweet.text);
                        // Convert the response to string if it's not already
                        const messageContent = aiResponse;
                        // Randomly choose between quote and reply (50/50 chance)
                        const shouldQuote = Math.random() < 0.5;
                        if (shouldQuote) {
                            await quoteAndComment(tweet.id, messageContent);
                            console.log(`Quoted tweet ${tweet.id} with message: ${messageContent}`);
                        }
                        else {
                            await replyTweet(tweet.id, messageContent);
                            console.log(`Replied to tweet ${tweet.id} with message: ${messageContent}`);
                        }
                        tweetManager.removeTweet(tweet.id);
                        // Add random delay between replies (1-30 seconds)
                        const replyDelay = Math.floor(Math.random() * 29) + 1;
                        await new Promise(resolve => setTimeout(resolve, replyDelay * 1000));
                    }
                    catch (error) {
                        console.error(`Error processing tweet ${tweet.id}:`, error);
                    }
                }
            }, randomDelay * 1000);
        }
        catch (error) {
            console.error('Error in reply scheduler:', error);
        }
    });
}
