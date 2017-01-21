import { suite, test } from 'mocha-typescript';
import { expect } from 'chai';

import * as git_reader from '../git/reader';
import * as git_parser from '../git/parser';

import { spawnSubprocess } from '../git/subprocess';

import { logAsJSON, logError } from './helper';

function count<T>(array: T[], value: T): number {
    return array.filter(v => v === value).length;
}

function getMatchedIndex(pattern: RegExp, against: string[]): number[] {
    const matched: number[] = [];
    // return against.filter(s => s.match(pattern)).map(toIndex);
    against.forEach((v, lineNo) => {
        if (v.match(pattern)) {
            matched.push(lineNo);
        }
    })
    return matched;
}

@suite class SubProcess {
    @test true_returns_0() {
        return spawnSubprocess('true')
            .then(result => expect(result.exit).eq(0));
    }

    @test false_returns_1() {
        return spawnSubprocess('false')
            .then(result => expect(result.exit).eq(1));
    }

    @test captures_stdout() {
        return spawnSubprocess('/bin/echo', ['aa', 'bb'])
            .then(result => {
                expect(result.exit).eq(0);
                expect(result.stdout).to.deep.eq(['aa bb', '']);
            })
    }
}

@suite class GitParser {

    @test refNamePatterns() {

        const patterns = git_parser.PATTERNS;

        const lines = [
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/heads/master",
            "373a71c3290b40a538346285e346eeff3f72c32b commit refs/heads/try-test",
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/HEAD",
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/master",
            "16c3ed22fae69b4eee2fe5bccd1a12cb6d696897 commit refs/tags/tag1",
            "1022a187d2cb5614c49733987a8b04bc8b747115 tag    refs/tags/tag5"
        ];

        expect(getMatchedIndex(/a/, ['a', 'b', 'a b a'])).deep.eq([0, 2]);

        expect(getMatchedIndex(patterns.ref_line, lines)).deep.eq([0, 1, 2, 3, 4, 5]);

        const matched = lines.map(l => l.match(patterns.ref_line)[3]);

        expect(getMatchedIndex(patterns.refnames.local_branch, matched))
            .deep.eq([0, 1]);

        expect(getMatchedIndex(patterns.refnames.remote_head, matched))
            .deep.eq([2]);

        expect(getMatchedIndex(patterns.refnames.remote_branch, matched))
            .deep.eq([3]);

        expect(getMatchedIndex(patterns.refnames.tag, matched))
            .deep.eq([4, 5]);
    }

    @test parseDate() {
        const timeStr = "1480181019 +0500";
        const date = git_parser.parseDate(timeStr);

        expect(date).deep.eq({
            utc_sec: 1480181019,
            tz: '+0500'
        });
    }

    @test parseAuthor1() {
        const authorStr = "Wang Guan <momocraft@gmail.com>";

        expect(git_parser.parseAuthor(authorStr)).deep.eq({
            name: "Wang Guan",
            email: "momocraft@gmail.com"
        })
    }

    @test parseAuthor2() {
        const authorStr = "Wang Guan <momocraftgmail.com>";

        expect(git_parser.parseAuthor(authorStr)).deep.eq({
            name: authorStr,
            email: ""
        })
    }

    @test reflogPattern() {
        const patterns = git_parser.PATTERNS;

        const reflogLine
            = '70f7812171ef7ec6bf599352e84aa57092cd412a faea5b6b1129ca7945199e4c78cc73f6cac471d6 Wang Guan <momocraft@gmail.com> 1480181019 +0900\tcommit: read refs';
        const match = patterns.reflog_line.exec(reflogLine);

        expect(match).ok;

        expect(git_parser.parseReflog(reflogLine)).deep.eq({
            from: '70f7812171ef7ec6bf599352e84aa57092cd412a',
            to: 'faea5b6b1129ca7945199e4c78cc73f6cac471d6',
            at: {
                utc_sec: 1480181019,
                tz: "+0900",
            },
            by: {
                name: "Wang Guan",
                email: "momocraft@gmail.com"
            },
            desc: 'commit: read refs',
        })
    }

    @test parseRawCommit_mergeCommit() {
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "parent e878f7caaf971fd3f4808d66fb41a74ac9567d44",
            "parent 06af50718ab0dc34024b312fddbb95f565d5e194",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0000",
            "committer Wang Guan <momocraft@gmail.com> 1479579855 +0000",
            "",
            "Merge branch 'learning-3d'",
        ] as string[];

        const parsed = git_parser.parseRawCommit("eeeqq", lines);
        expect(parsed).deep.eq({
            author: {
                email: "momocraft@gmail.com",
                name: "Wang Guan"
            },
            author_at: {
                tz: "+0000",
                utc_sec: 1479579845,
            },
            commit_at: {
                tz: "+0000",
                utc_sec: 1479579855,
            },
            committer: {
                email: "momocraft@gmail.com",
                name: "Wang Guan"
            },
            message: [
                "Merge branch 'learning-3d'",
            ],
            parent_sha1: [
                "e878f7caaf971fd3f4808d66fb41a74ac9567d44",
                "06af50718ab0dc34024b312fddbb95f565d5e194"
            ],
            sha1: "eeeqq",
            type: "Commit",
        });
    }

    @test parseRawCommit_orphanCommit() {
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0500",
            "committer Wang Guan <momocraft@gmail.com> 1479579845 -0500",
            "",
            "Merge branch 'learning-3d'",
        ] as string[];

        const parsed = git_parser.parseRawCommit("eeeqq", lines);
        expect(parsed).deep.eq({
            author: {
                email: "momocraft@gmail.com",
                name: "Wang Guan"
            },
            author_at: {
                tz: "+0500",
                utc_sec: 1479579845,
            },
            commit_at: {
                tz: "-0500",
                utc_sec: 1479579845,
            },
            committer: {
                email: "momocraft@gmail.com",
                name: "Wang Guan"
            },
            message: [
                "Merge branch 'learning-3d'",
            ],
            parent_sha1: [],
            sha1: "eeeqq",
            type: "Commit",
        });
    }
}

@suite class GitReader {

    private findRepo = git_reader.findGitRepo(__dirname);

    @test findGitRepo() {
        return this.findRepo;
    }

    @test catFile() {
        return this.findRepo
            .then(repo => git_reader.catFile(repo, 'master'));
    }

    @test listRefs() {
        return this.findRepo
            .then(repo => git_reader.listRefs(repo))
            .then(refs => {
                expect(refs.length).eq(9);
            })
    }

    @test readLocalHead() {
        const log = 'readLocalHead.json';
        return this.findRepo
            .then(repo => git_reader.readHead(repo, "HEAD"))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

    @test readRemoteHead_1() {
        const log = 'readRemoteHead.json';
        return this.findRepo
            .then(repo => git_reader.readHead(repo, "refs/remotes/origin/HEAD"))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

    @test readRemoteBranch() {
        const log = 'readRemoteMaster.json';
        return this.findRepo
            .then(repo => git_reader.readHead(repo, "refs/remotes/origin/master"))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

    @test readRefs() {
        const log = 'readRefs.json';
        return this.findRepo
            .then(repo => git_reader.readRefs(repo))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

}
