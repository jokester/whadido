import { createParser, ParsedOptions } from './options';
import { openRepo, findRepo, GitRepo } from './git';

function exit() {
    process.exit(0);
}

function raise(error: Error) {
    if (error.message.match('Not a git repository')) {
        console.error('Repository not found');
    } else {
        console.error(raise);
    }
    process.exit(1);
}

export function main() {
    const options = createParser().parseArgs();

    if (options.dump) {
        dump(options)
            .then(exit, raise);
    }
}

async function dump(options: ParsedOptions) {
    let repo: GitRepo;

    repo = await openRepo(options.path);

    const refs = await repo.listRefs();
    const dump: any = {};
    for (const r of refs) {
        const refDump: any = {};
        const resolved = refDump.resolved = await repo.resolveRef(r);
        refDump.reflog = await repo.readReflog(r.path);
        dump[r.path] = refDump;
    }

    console.log(JSON.stringify(dump, undefined, 4));

}

if (require.main === module) {
    main();
}