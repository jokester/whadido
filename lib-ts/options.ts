import { ArgumentParser } from "argparse";

export interface ParsedOptions {
    path: string
    dump: string
}

export function createParser() {
    const parser = new ArgumentParser({
        version: require("../package.json").version,
        addHelp: true,
        description: "whadido: Analyze recent operations in local git repository"
    });

    parser.addArgument(
        ['path'],
        {
            metavar: "PATH",
            defaultValue: process.cwd(),
            help: "Root of repository or somewhere inside it. Defaults to $PWD",
            required: false,
        }
    );

    parser.addArgument(
        ["--dump"],
        {
            defaultValue: true,
            action: "storeTrue",
            dest: "dump",
            help: `dump refs and reflogs of repo. Most for development use.`,
        }

    )

    return parser as {
        parseArgs(): ParsedOptions
    };
}

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
