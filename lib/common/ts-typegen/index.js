"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const io_1 = require("../io");
var infer_1 = require("./infer");
exports.infer = infer_1.infer;
var format_1 = require("./format");
exports.format = format_1.format;
const infer_2 = require("./infer");
const format_2 = require("./format");
var Main;
(function (Main) {
    function main() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                process.stdout.write("input a json-decodeable value:\n");
                const stdinBuffer = yield io_1.readStream(process.stdin);
                const stdinStr = stdinBuffer.toString();
                const jsValue = JSON.parse(stdinStr);
                const tsType = infer_2.infer(jsValue);
                const lines = format_2.format(tsType.generateCode(), 4);
                process.stdout.write(lines.join("\n") + "\n");
            }
            catch (e) {
                console.error(e);
                process.exit(1);
            }
        });
    }
    Main.main = main;
})(Main || (Main = {}));
if (require.main === module) {
    Main.main();
}
//# sourceMappingURL=index.js.map