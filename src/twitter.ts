import { TweetV2, TwitterApi } from 'twitter-api-v2';

// Initialize Twitter client
let userContext: TwitterApi | null = null;
let latestTweetId: string | null = null;
let latestMyTweetId: string | null = null;

/**
 * Compares two Twitter IDs numerically
 * @param id1 First Twitter ID string
 * @param id2 Second Twitter ID string
 * @returns -1 if id1 < id2, 0 if equal, 1 if id1 > id2
 */
export function isBiggerThan(id1: string, id2: string): boolean {
    // Convert string IDs to BigInt since Twitter IDs can exceed Number.MAX_SAFE_INTEGER
    const num1 = BigInt(id1);
    const num2 = BigInt(id2);
    
    if (num1 < num2) return false;
    if (num1 > num2) return true;
    return false;
}


function getTwitterClient(): TwitterApi {
    if (!userContext) {
        if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET || 
            !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
            throw new Error('Twitter credentials are not properly configured in environment variables');
        }
        
        console.log('Initializing Twitter client with credentials:', {
            appKey: process.env.TWITTER_API_KEY,
            appSecret: `${process.env.TWITTER_API_KEY_SECRET?.substring(0, 5)}...`,
            accessToken: `${process.env.TWITTER_ACCESS_TOKEN?.substring(0, 5)}...`,
            accessSecret: `${process.env.TWITTER_ACCESS_TOKEN_SECRET?.substring(0, 5)}...`,
        });
        
        userContext = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_KEY_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });
    }
    return userContext;
}

export async function getUserTweets(userId: string, paginationToken?: string) {
    const client = getTwitterClient();
    const tweets = await client.v2.userTimeline(userId, {
        exclude: ["retweets"],
        max_results: 50,
        pagination_token: paginationToken,
    });
    return tweets.data;
}

export async function getUserMentionTimeline(userId: string, paginationToken?: string) {
    const client = getTwitterClient();
    const quotes = await client.v2.userMentionTimeline(userId, {
        max_results: 10,
        pagination_token: paginationToken
    });
    return quotes.data;
}

export async function getUserMentionTimelineXTimes(userId: string, times: number) {
  let paginationToken: string | undefined = undefined;
  const res: TweetV2[] = [];
  for (let i = 0; i < times && (i == 0 || paginationToken); i++) {
    const quotes = await getUserMentionTimeline(userId, paginationToken);
    if(!quotes.data || quotes.data.length == 0) break;
    const tweets = quotes.data;
    res.unshift(...tweets);
    paginationToken = quotes.meta.next_token;
    if (tweets?.length == 0) {
      break;
    }
    if (userId == process.env.MY_USER_ID) {
      if (isBiggerThan(tweets[0].id, latestMyTweetId ?? "0")) {
        latestMyTweetId = tweets[0].id;
      } else {
        break;
      }
    } else {
      if (isBiggerThan(tweets[0].id, latestTweetId ?? "0")) {
        latestTweetId = tweets[0].id;
      } else {
        break;
      }
    }
  }
  console.log("latestTweetId", latestTweetId);
  return res;
}

export async function quoteAndComment(tweetId: string, replyText: string) {
    try {
        const client = getTwitterClient();
        const quote = await client.v2.quote(replyText, tweetId);
        return quote.data;
    } catch (error) {
        console.error('Error retweeting with reply:', error);
        throw error;
    }
}

export async function replyTweet(tweetId: string, replyText: string) {
    try {
        const client = getTwitterClient();
        const reply = await client.v2.reply(replyText, tweetId);
        return reply.data;
    } catch (error) {
        console.error('Error replying to tweet:', error);
        throw error;
    }
}
