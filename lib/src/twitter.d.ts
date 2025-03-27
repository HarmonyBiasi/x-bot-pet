import { TweetV2 } from 'twitter-api-v2';
/**
 * Compares two Twitter IDs numerically
 * @param id1 First Twitter ID string
 * @param id2 Second Twitter ID string
 * @returns -1 if id1 < id2, 0 if equal, 1 if id1 > id2
 */
export declare function isBiggerThan(id1: string, id2: string): boolean;
export declare function getUserTweets(userId: string, paginationToken?: string): Promise<import("twitter-api-v2").TweetV2PaginableTimelineResult>;
export declare function getUserMentionTimeline(userId: string, paginationToken?: string): Promise<import("twitter-api-v2").TweetV2PaginableTimelineResult>;
export declare function getUserMentionTimelineXTimes(userId: string, times: number): Promise<TweetV2[]>;
export declare function quoteAndComment(tweetId: string, replyText: string): Promise<{
    id: string;
    text: string;
}>;
export declare function replyTweet(tweetId: string, replyText: string): Promise<{
    id: string;
    text: string;
}>;
