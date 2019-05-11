import { ArgumentParser } from 'argparse';
import pkgJson from './pkg.json';

export interface ParsedOptions {
  path: string;
  dump: string;
  verbose: boolean;
}

export function createOptionParser() {
  const parser = new ArgumentParser({
    version: pkgJson.version,
    addHelp: true,
    description: pkgJson.description,
  });

  parser.addArgument(['-r', '--repo'], {
    metavar: 'REPO_PATH',
    defaultValue: process.cwd(),
    help: 'Path in worktree git repository or its worktree. Defaults to $PWD',
    dest: 'path',
  });

  parser.addArgument(['--dump'], {
    defaultValue: false,
    action: 'storeTrue',
    dest: 'dump',
    help: `Dump refs and reflogs to a timestamp-named JSON file in PWD. Most for development use.`,
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
