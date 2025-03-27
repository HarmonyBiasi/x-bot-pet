import { VectorStoreIndex } from "llamaindex";
import { JSONReader } from "@llamaindex/readers/json";
class VectorIndexManager {
    static instance = null;
    static async getInstance() {
        if (!VectorIndexManager.instance) {
            try {
                const path = "src/dataset/cz.json";
                const reader = new JSONReader({ levelsBack: 3, collapseLength: 500 });
                const docsFromFile = await reader.loadData(path);
                console.log(docsFromFile);
                const index = await VectorStoreIndex.fromDocuments(docsFromFile);
                VectorIndexManager.instance = index.asChatEngine();
            }
            catch (error) {
                console.error('Error initializing vector index:', error);
                throw error;
            }
        }
        return VectorIndexManager.instance;
    }
}
export default VectorIndexManager;
