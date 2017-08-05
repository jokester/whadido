"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const argparse_1 = require("argparse");
function createParser() {
    const parser = new argparse_1.ArgumentParser({
        version: require("../package.json").version,
        addHelp: true,
        description: "whadido: Analyze recent operations in local git repository"
    });
    parser.addArgument(["-r", "--repo"], {
        metavar: "REPO_PATH",
        defaultValue: process.cwd(),
        help: "Root of repository or somewhere inside it. Defaults to $PWD",
        dest: "path",
    });
    parser.addArgument(["--dump"], {
        defaultValue: false,
        action: "storeTrue",
        dest: "dump",
        help: `Dump refs and reflogs to a timestamp-named JSON file. Most for development use.`,
    });
    parser.addArgument(["--verbose"], {
        defaultValue: false,
        action: "storeTrue",
        dest: "verbose",
        help: `Enable verbose log. Most for development use.`,
    });
    return parser;
}
exports.createParser = createParser;
/**
 * Run this file with node / ts-node to test output of parser
 */
if (require.main === module) {
    const parser = createParser();
    const args = parser.parseArgs();
    console.log("parsed");
    console.log(args);
    console.log(JSON.stringify(args));
}
//# sourceMappingURL=options.js.map