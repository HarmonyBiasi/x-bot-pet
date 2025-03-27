import cron from 'node-cron';
import { getUserMentionTimelineXTimes, isBiggerThan, quoteAndComment, replyTweet } from './twitter';
import { replyToTweet, selectTweet } from './agent';
import { TweetV2 } from 'twitter-api-v2';

// In-memory storage for CZ's tweets
export interface Tweet extends TweetV2 {
    created_at?: string;
    replied?: boolean;
}

export let generatedReplies: { originalTweet: string, generatedReply: string }[] = [];

export class TweetManager {
    private static instance: TweetManager;
    public czTweets: Tweet[] = [];
    private readonly MAX_TWEETS = 1000; // Prevent unlimited memory growth
    private enabled: boolean = false;
    public unselectedTweets: TweetV2[] = [];
    private constructor() {}

    public static getInstance(): TweetManager {
        if (!TweetManager.instance) {
            TweetManager.instance = new TweetManager();
        }
        return TweetManager.instance;
    }

    public enable() {
        this.enabled = true;
        console.log('Tweet manager enabled');
    }

    public disable() {
        this.enabled = false;
        console.log('Tweet manager disabled');
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public rulebaseFilter(tweets: TweetV2[], isMyTweets: boolean = false) {
        const rules = ["Breaking News, refer link", "follow me", "inbox", "🚀", "dream", "mission"];

        tweets = tweets.filter(tweet => {
             // Filter out tweets that are not in English or Chinese
             const hasOnlyEnglishAndChinese = (text: string) => {
                // Match English letters, numbers, Chinese characters, and common punctuation
                const englishAndChineseRegex = /^[a-zA-Z0-9\s,.!?'"@#$%&*()_+\-=\[\]{}|;:<>\/\\¥£€$\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+$/;
                return englishAndChineseRegex.test(text);
            };

            // Filter out tweets containing "DM " or "t.co/" links
            if (tweet.text.includes("DM ") || tweet.text.includes("t.co/")) {
                return false;
            }

            if (!isMyTweets && !hasOnlyEnglishAndChinese(tweet.text)) {
                return false;
            }
            // Check if tweet contains at least 5 Chinese characters
            const chineseCharCount = (tweet.text.match(/[\u4e00-\u9fff]/g) || []).length;
            if (chineseCharCount > 2) {
                return true;
            }
            const textWithoutMentions = tweet.text.replace(/@[a-zA-Z0-9_]+/g, '');
            // Remove all hashtags from the text
            const textWithoutHashtags = textWithoutMentions.replace(/#\w+/g, '');
            const textWithoutCoins = textWithoutHashtags.replace(/\$[a-zA-Z0-9]+/g, '');
            const textWithoutSpaces = textWithoutCoins.replace(/\s+/g, '');
            // Remove special characters and emojis
            const textWithoutSpecialChars = textWithoutSpaces
                .replace(/[\n\r]/g, '') // Remove newlines
                .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2B06}]|[\u{2934}]|[\u{2935}]/gu, ''); // Remove emojis
            const textWithoutSpace = textWithoutSpecialChars.replace(/\s+/g, '');
            // Remove Ethereum-style addresses (0x followed by 40 hex characters)
            const textWithoutAddresses = textWithoutSpace.replace(/0x[a-fA-F0-9]{40}/g, '');
            // Remove URLs and website links
            const textWithoutUrls = textWithoutAddresses.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');

            // Filter out tweets containing token symbols ($XXX)
            if (!isMyTweets && tweet.text.match(/\$[A-Za-z]+/)) {
                return false;
            }

            return isMyTweets ? textWithoutUrls.length > 1 : textWithoutUrls.length > 20;
        });

        return tweets.filter(tweet => !rules.some(rule => tweet.text.includes(rule)));
    }

    public filterOutTweetsIAlreadyReplied(tweets: TweetV2[]) {
        return tweets.filter(tweet => isBiggerThan(tweet.id, "1891796176699261441"));
    }

    public async addTweets(tweets: TweetV2[], isMyTweets: boolean = false) {
        if (!this.enabled) return;
        tweets = this.rulebaseFilter(tweets, false);
        tweets = this.filterOutTweetsIAlreadyReplied(tweets);

        tweets = tweets.filter(tweet => !this.unselectedTweets.some(t => t.id === tweet.id));
        this.unselectedTweets = [...tweets, ...this.unselectedTweets].slice(0, this.MAX_TWEETS);

    }

    public async selectingTweets(isMyTweets: boolean = false) {
        // if(!isMyTweets) {
        //     const tweetsToReply = await selectTweet(this.unselectedTweets);
        //     this.unselectedTweets = this.unselectedTweets.filter(tweet => !tweetsToReply.includes(tweet.id));
        // }

        this.czTweets = [...this.czTweets, ...this.unselectedTweets.filter(tweet => this.czTweets.every(t => t.id !== tweet.id))];
        console.log(`Selected ${this.czTweets.length} tweets. Total tweets in memory: ${this.czTweets.length}`, this.czTweets, this.unselectedTweets);
        
        this.unselectedTweets = [];
    }

    public async getTweetToReply(): Promise<Tweet | null> {
        if (!this.enabled) return null;
        return this.czTweets.find(tweet => !tweet.replied) || null;
    }

    public getTweetsOnQueue(): { selected: Tweet[], unselected: Tweet[] } {
        return {
            selected: this.czTweets,
            unselected: this.unselectedTweets
        };
    }

    public getTweetsCount(): number {
        return this.czTweets.length;
    }

    public repliedTweet(id: string) {
        this.czTweets = this.czTweets.map(tweet => tweet.id === id ? { ...tweet, replied: true } : tweet);
    }
}

let fetchMyTweets = 0;

// Initialize tweet fetching (every 30 minutes)
export function initializeTweetFetching() {
    const tweetManager = TweetManager.getInstance();
    tweetManager.enable(); // Enable by default
    console.log('Tweet fetching initialized');
    // Schedule tweet fetching every 30 minutes starting at 0 min
    cron.schedule('*/15 * * * *', async () => {
        console.log('Tweet fetching scheduled');
        if (!tweetManager.isEnabled()) return;
        try {
            console.log('Fetching CZ tweets...');
            if (fetchMyTweets < 2) {
                const myTweets = await getUserMentionTimelineXTimes(process.env.MY_USER_ID ?? "", 1);
                console.log('myTweets', myTweets);
                tweetManager.addTweets(myTweets, true);
                console.log('Fetched and stored', myTweets.length, 'my tweets');
                fetchMyTweets++;
                await tweetManager.selectingTweets(true);
            } else {
                const tweets = await getUserMentionTimelineXTimes(process.env.CZ_USER_ID ?? "", 1);
                console.log('tweets', tweets);
                tweetManager.addTweets(tweets);
                console.log('Fetched and stored', tweets.length, 'tweets');
                fetchMyTweets = 0;
                await tweetManager.selectingTweets();
            }
            
            } catch (error) {
            console.error('Error fetching tweets:', error);
        }
    });

    // // Schedule tweet selection every 15 minutes
    // cron.schedule('*/3 * * * *', async () => {
    //     if (!tweetManager.isEnabled()) return;
    //     console.log('Selecting tweets...');
    //     await tweetManager.selectingTweets();
    //     console.log(`Selected ${tweetManager.getTweetsCount()} tweets. Total tweets in memory: ${tweetManager.getTweetsCount()}`);
    // });

    // Schedule random replies every 120 minutes with random delay
    cron.schedule('0 */2 * * *', async () => {
        if (!tweetManager.isEnabled()) return;
        try {
            // Random delay between 0-240 seconds (0-4 minutes) to simulate human behavior
            const randomDelay = Math.floor(Math.random() * 500);
            console.log(`Scheduling reply with ${randomDelay} seconds delay...`);
            
            setTimeout(async () => {
                if (!tweetManager.isEnabled()) return;
                const tweet = await tweetManager.getTweetToReply();
                if (!tweet) return;
                
                try {
                    // Generate reply using AI
                    const aiResponse = await replyToTweet(tweet.text);
                    // Convert the response to string if it's not already
                    const messageContent = aiResponse as string;
                    
                    // Randomly choose between quote and reply (50/50 chance)
                    const shouldQuote = Math.random() < 0.8;

                    generatedReplies.push({
                        originalTweet: tweet.text,
                        generatedReply: messageContent
                    });
                    
                    if (shouldQuote) {
                        await quoteAndComment(tweet.id, messageContent);
                        console.log(`Quoted tweet ${tweet.id} with message: ${messageContent}`);
                    } else {
                        await replyTweet(tweet.id, messageContent);
                        console.log(`Replied to tweet ${tweet.id} with message: ${messageContent}`);
                    }
                    tweetManager.repliedTweet(tweet.id);
                    // Add random delay between replies (1-30 seconds)
                    const replyDelay = Math.floor(Math.random() * 29) + 1;
                    await new Promise(resolve => setTimeout(resolve, replyDelay * 1000));
                } catch (error) {
                    tweetManager.repliedTweet(tweet.id);
                    console.error(`Error processing tweet ${tweet.id}:`, error);
                }
            }, randomDelay * 1000);
        } catch (error) {
            console.error('Error in reply scheduler:', error);
        }
    });

    // Clear queue and generated replies every 24 hours at noon
    cron.schedule('0 12 * * *', () => {
        try {
            const tweetManager = TweetManager.getInstance();
            tweetManager.czTweets = []; // Clear the tweet queue directly since no clearQueue() method exists
            generatedReplies = [];
            console.log('Successfully cleared tweet queue and generated replies');
        } catch (error) {
            console.error('Error clearing tweet queue and replies:', error);
        }
    });
} 