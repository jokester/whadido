import { suite, test } from 'mocha-typescript';
import { expect } from 'chai';

import * as repo from '../git/repo';
import * as reader from '../git/reader';
import * as parser from '../git/parser';

import { join } from 'path';
import { spawnSubprocess } from '../git/subprocess';

import { logAsJSON, logError, getMatchedIndex } from './helper';

@suite
class TestSubProcess {
    @test
    true_returns_0() {
        return spawnSubprocess('true')
            .then(result => expect(result.exit).eq(0));
    }

    @test
    false_returns_1() {
        return spawnSubprocess('false')
            .then(result => expect(result.exit).eq(1));
    }

    @test
    captures_stdout1() {
        return spawnSubprocess('/bin/echo', ['aa', 'bb'])
            .then(result => {
                expect(result.exit).eq(0);
                expect(result.stdout).to.deep.eq(['aa bb', '']);
            })
    }

    @test
    captures_stdout2() {
        return spawnSubprocess('/bin/echo', ["-n", 'aa', 'bb'])
            .then(result => {
                expect(result.exit).eq(0);
                expect(result.stdout).to.deep.eq(['aa bb']);
            })
    }
}


/**
 * test for reader.ts
 *
 * @deprecated
 *
 * @class TestGitReader
 */
@suite
class TestGitReader {

    private findRepo = repo.findRepo(__dirname);

    @test
    findGitRepo() {
        return this.findRepo;
    }

    @test
    catFile() {
        return this.findRepo
            .then(repo => reader.catFile(repo, 'master'));
    }

    @test
    listRefs() {
        return this.findRepo
            .then(repo => reader.listRefs(repo))
            .then(refs => {
                expect(refs.length).eq(9);
            })
    }

    @test
    readLocalHead() {
        const log = 'readLocalHead.json';
        return this.findRepo
            .then(repo => reader.readHead(repo, "HEAD"))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

    @test
    readRemoteHead_1() {
        const log = 'readRemoteHead.json';
        return this.findRepo
            .then(repo => reader.readHead(repo, "refs/remotes/origin/HEAD"))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

    @test
    readRemoteBranch() {
        const log = 'readRemoteMaster.json';
        return this.findRepo
            .then(repo => reader.readHead(repo, "refs/remotes/origin/master"))
            .then(logAsJSON(log))
            .catch(logError(log));
    }

    @test
    readRefs() {
        const log = 'readRefs.json';
        return this.findRepo
            .then(repo => reader.readRefs(repo))
            .then(logAsJSON(log))
            .catch(logError(log));
    }
}

@suite
class TestGitParser {

    @test
    refNamePatterns() {

        const patterns = parser.PATTERNS;

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

        expect(getMatchedIndex(patterns.refpath.local_branch, matched))
            .deep.eq([0, 1]);

        expect(getMatchedIndex(patterns.refpath.remote_head, matched))
            .deep.eq([2]);

        expect(getMatchedIndex(patterns.refpath.remote_branch, matched))
            .deep.eq([3]);

        expect(getMatchedIndex(patterns.refpath.tag, matched))
            .deep.eq([4, 5]);
    }

    @test
    parseDate() {
        const timeStr = "1480181019 +0500";
        const date = parser.parseDate(timeStr);

        expect(date).deep.eq({
            utc_sec: 1480181019,
            tz: '+0500'
        });
    }

    @test
    parseAuthor1() {
        const authorStr = "Wang Guan <momocraft@gmail.com>";

        expect(parser.parseAuthor(authorStr)).deep.eq({
            name: "Wang Guan",
            email: "momocraft@gmail.com"
        })
    }

    @test
    parseAuthor2() {
        const authorStr = "Wang Guan <momocraftgmail.com>";

        expect(parser.parseAuthor(authorStr)).deep.eq({
            name: authorStr,
            email: ""
        })
    }

    @test
    reflogPattern() {
        const patterns = parser.PATTERNS;

        const reflogLine
            = '70f7812171ef7ec6bf599352e84aa57092cd412a faea5b6b1129ca7945199e4c78cc73f6cac471d6 Wang Guan <momocraft@gmail.com> 1480181019 +0900\tcommit: read refs';
        const match = patterns.reflog_line.exec(reflogLine);

        expect(match).ok;

        expect(parser.parseReflog(reflogLine)).deep.eq({
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

    @test
    parseRawCommit_mergeCommit() {
        // a commit with 2 parants
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "parent e878f7caaf971fd3f4808d66fb41a74ac9567d44",
            "parent 06af50718ab0dc34024b312fddbb95f565d5e194",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0000",
            "committer Wang Guan <momocraft@gmail.com> 1479579855 +0000",
            "",
            "Merge branch 'learning-3d'",
        ] as string[];

        const parsed = parser.parseRawCommit("eeeqq", lines);
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

    @test
    parseRawCommit_orphanCommit() {
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0500",
            "committer Wang Guan <momocraft@gmail.com> 1479579845 -0500",
            "",
            "Merge branch 'learning-3d'",
        ] as string[];

        const parsed = parser.parseRawCommit("eeeqq", lines);
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

    @test
    parsePackedRef() {
        const lines = `# pack-refs with: peeled fully-peeled
298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/heads/master
298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/heads/moyu
298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/remotes/origin/master
298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/remotes/origin/moyu
1940b1adca8f6633dfe9c4e73bb79b11e820af35 refs/tags/VVV
cbe73c6c2d757565f074c95c27e2b2dadfd31428 refs/tags/WTF
298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/tags/あああ`.split("\n");

        const parsed = parser.parsePackedRef(lines);
        expect(parsed).deep.eq([
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/heads/master", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/heads/moyu", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/remotes/origin/master", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/remotes/origin/moyu", "type": "Branch", },
            { "dest": "1940b1adca8f6633dfe9c4e73bb79b11e820af35", "path": "refs/tags/VVV", "type": "TAG OF UNKNOWN KIND", },
            { "dest": "cbe73c6c2d757565f074c95c27e2b2dadfd31428", "path": "refs/tags/WTF", "type": "TAG OF UNKNOWN KIND", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/tags/あああ", "type": "TAG OF UNKNOWN KIND", },
        ]);
    }
}

@suite
class TestGitRepo {

    @test
    async findRepo() {
        const path = join(__dirname, '..', '..', 'test', 'node-libtidy.git', 'hooks');
        const foundRepo = await repo.findRepo(path);

        const expected = join(__dirname, '..', '..', 'test', 'node-libtidy.git');
        expect(foundRepo).to.eq(expected);
    }
}