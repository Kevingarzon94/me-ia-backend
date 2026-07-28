"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convertJsonToText_1 = require("../../src/utils/convertJsonToText");
const chunks = (0, convertJsonToText_1.convertJsonToText)();
console.log(chunks.length);
console.log(JSON.stringify(chunks[0], null, 2));
//# sourceMappingURL=debug-convert.js.map