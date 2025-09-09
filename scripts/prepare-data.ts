import {convertJsonToText} from '../src/utils/convertJsonToText'
import {processChunks} from '../src/utils/processor-chunk'
import {generateEmbeddings} from "../src/utils/embedding_generator";
import {upsertEmbeddings} from "../src/utils/pinecone-upload";
import fs from "fs";

const Main = async () => {
    try {
        const UnProcessedChunk = convertJsonToText()
        const ProcessedChunk = await processChunks(UnProcessedChunk)
        const embeddedsChunks = await generateEmbeddings(ProcessedChunk)
        await upsertEmbeddings(embeddedsChunks)

        fs.writeFileSync('./data/embeddings.json', JSON.stringify(embeddedsChunks))
    } catch (error) {
        console.log(error)
        process.exit(1)
    }

}

Main()
