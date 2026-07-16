import { convertJsonToText } from "../../src/utils/convertJsonToText";

const chunks = convertJsonToText();

console.log(chunks.length);
console.log(JSON.stringify(chunks[0], null, 2));