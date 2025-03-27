import { TweetV2 } from "twitter-api-v2";
export declare function replyToTweet(tweet: string): Promise<import("llamaindex").MessageContent>;
export declare function selectTweet(tweets: TweetV2[]): Promise<string[]>;
