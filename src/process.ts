import fs from 'fs/promises';

export const processData = async (data: any) => {
    const twitterData = await fs.readFile('src/dataset/twitter.json', 'utf-8');
    const parsedData = JSON.parse(twitterData);
    const processedData = parsedData.data.user.result.timeline_v2.timeline.instructions.find((instruction: any) => instruction.type === 'TimelineAddEntries').entries.map((entry: any) => entry.content.itemContent).filter(Boolean).map((itemContent: any) => itemContent.tweet_results.result.legacy.full_text);
    return processedData;
}