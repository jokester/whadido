import { findGitRepo } from './reader'

export function openRepo(start: string): Promise<GitRepo> {
    return findGitRepo(start).then(path => new GitRepo(path));
}

class GitRepo {
    constructor(private path: string) {

    }

    listRefs() {

    }

    watchRefs(callback: Function) {

    }
}
