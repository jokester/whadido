import { ArgumentParser } from 'argparse';

export interface ParsedOptions {
  path: string;
  dump: string;
  verbose: boolean;
}

export function createOptionParser() {
  const parser = new ArgumentParser({
    version: require('../package.json').version,
    addHelp: true,
    description: require('../package.json').description,
  });

  parser.addArgument(['-r', '--repo'], {
    metavar: 'REPO_PATH',
    defaultValue: process.cwd(),
    help: 'Root of repository or somewhere inside it. Defaults to $PWD',
    dest: 'path',
  });

  parser.addArgument(['--dump'], {
    defaultValue: false,
    action: 'storeTrue',
    dest: 'dump',
    help: `Dump refs and reflogs to a timestamp-named JSON file. Most for development use.`,
  });

  parser.addArgument(['--verbose'], {
    defaultValue: false,
    action: 'storeTrue',
    dest: 'verbose',
    help: `Enable verbose log. Most for development use.`,
  });

  return parser as {
    parseArgs(): ParsedOptions;
  };
}

/**
 * Run this file with node / ts-node to test output of parser
 */
if (require.main === module) {
  const parser = createOptionParser();
  const args = parser.parseArgs();
  console.log('parsed');
  console.log(args);
  console.log(JSON.stringify(args));
}
