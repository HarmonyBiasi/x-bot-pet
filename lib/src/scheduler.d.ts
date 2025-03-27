import { TweetV2 } from 'twitter-api-v2';
export declare class TweetManager {
    private static instance;
    private czTweets;
    private readonly MAX_TWEETS;
    private enabled;
    private constructor();
    static getInstance(): TweetManager;
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    addTweets(tweets: TweetV2[]): void;
    getTweetsToReply(): Promise<TweetV2[]>;
    getTweetsOnQueue(): TweetV2[];
    getTweetsCount(): number;
    removeTweet(id: string): void;
}
export declare function initializeTweetFetching(): void;
