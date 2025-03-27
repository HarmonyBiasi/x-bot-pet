import { BaseChatEngine } from "llamaindex";
declare class VectorIndexManager {
    private static instance;
    static getInstance(): Promise<BaseChatEngine>;
}
export default VectorIndexManager;
