import { suite, test, skip, timeout } from 'mocha-typescript';
import { expect } from 'chai';

import * as rawtypes from '../git/rawtypes';
import * as repo from '../git/repo';
import * as reader from '../git/reader';
import * as parser from '../git/parser';
import * as util from '../util';

import { join } from 'path';
import { getSubprocessOutput } from '../git/subprocess';

import { logAsJSON, logError, getMatchedIndex } from './helper';

const logger = console;

@suite
class TestSubProcess {
    @test
    async true_returns_0() {
        const result = await getSubprocessOutput('true');
        expect(result.stderr).deep.eq([""]);
    }

    @test
    async false_returns_1() {
        const err = "should not be this";
        try {
            await getSubprocessOutput('false');
            throw err;
        } catch (e) {
            expect(e).not.eq(err);
        }
    }

    @test
    captures_stdout1() {
        return getSubprocessOutput('/bin/echo', ['aa', 'bb'])
            .then(result => {
                expect(result.stdout).to.deep.eq(['aa bb', '']);
            })
    }

    @test
    captures_stdout2() {
        return getSubprocessOutput('/bin/echo', ["-n", 'aa', 'bb'])
            .then(result => {
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
    @skip
    catFile() {
        return this.findRepo
            .then(repo => reader.catFile(repo, 'master'));
    }

    @test
    @skip
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
    @skip
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
    parseHEAD1() {
        const line = "ce95a0817d18df7c027df4334b19e5bc9980a995";
        expect(parser.parseHEAD(line)).deep.eq({
            type: rawtypes.RefType.HEAD,
            dest: line,
            path: "HEAD",
        });
    }

    @test
    parseHEAD2() {
        const line = "ref: refs/heads/master";
        expect(parser.parseHEAD(line)).deep.eq({
            type: rawtypes.RefType.HEAD,
            dest: "refs/heads/master",
            path: "HEAD",
        });
    }

    @test
    parseHEAD3() {
        const line = "ee";
        expect(() => parser.parseHEAD(line)).to.throw();
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

        const parsed = parser.parseCommit("eeeqq", lines);
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

        const parsed = parser.parseCommit("eeeqq", lines);
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

    // a node-libtidy repo included for test
    async openTestRepo() {
        const path = join(__dirname, '..', '..', 'test', 'node-libtidy.git', 'hooks');
        const foundRepo = await repo.findRepo(path);
        return repo.openRepo(foundRepo);
    }

    // TypeScript repo included for test
    async openTestRepo2() {
        const path = join(__dirname, '..', '..', 'test', 'TypeScript.git', 'hooks');
        const foundRepo = await repo.findRepo(path);
        return repo.openRepo(foundRepo);
    }

    // current repo to cover more cases
    async openDevRepo() {
        const path = join(__dirname, '..', '..', 'test');
        const foundRepo = await repo.findRepo(path);
        return repo.openRepo(foundRepo);
    }

    @test
    async findRepo() {
        const path = join(__dirname, '..', '..', 'test', 'node-libtidy.git', 'hooks');
        const foundRepo = await repo.findRepo(path);

        const expected = join(__dirname, '..', '..', 'test', 'node-libtidy.git');
        expect(foundRepo).to.eq(expected);
    }

    @test
    async openRepo() {
        const testRepo = await this.openTestRepo();
    }

    @test
    async readPackedRefs() {
        const testRespo = await this.openTestRepo();
        const packedRefs = await (testRespo as any).readPackedRefs();

        expect(packedRefs).deep.eq([
            {
                dest: "414c5870b27970db0fa7762148adb89eb07f1fe0",
                path: "refs/heads/master",
                type: rawtypes.RefType.BRANCH,
            },
            {
                dest: "414c5870b27970db0fa7762148adb89eb07f1fe0",
                path: "refs/remotes/origin/master",
                type: rawtypes.RefType.BRANCH,
            },
            {
                dest: "49e49799d6625785708fc64b365ea0fae1c48ece",
                path: "refs/tags/v0.1.0",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "915849a5d77a57ed389d93a638d5e329c6c565ae",
                path: "refs/tags/v0.1.1",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "78c872a7676487dc430339031cf1a6d179ed4946",
                path: "refs/tags/v0.2.0",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "3f8a54c3780f7c6db91dabd97b67fa77e75822b6",
                path: "refs/tags/v0.3.0",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "aec08967c642f58651a414996c1e9368ff42baa9",
                path: "refs/tags/v0.3.1",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "07fc5636f0359a857a5f9ecd583fcd56d6edb83b",
                path: "refs/tags/v0.3.2",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },

        ]);
    }

    @test
    async readLocalHead() {
        const testRespo = await this.openTestRepo();
        const localHead = await (testRespo as any).readLocalHead();

        expect(localHead).deep.eq(
            {
                dest: "refs/heads/master",
                path: "HEAD",
                type: rawtypes.RefType.HEAD,
            });
    }

    @test
    async findRefFiles() {
        const refsRoot = join(__dirname, '..', '..', 'test', 'node-libtidy.git', 'refs');
        const found = await repo.listRefFiles(refsRoot);
        expect(found).deep.eq([
            join(refsRoot, 'tags', 't2'),
            join(refsRoot, 'remotes', 'origin', 'HEAD'),
        ]);
    }

    @test
    async readNonpackedRef() {
        const testRepo = await this.openTestRepo();
        const nonpacked = await (testRepo as any).readNonpackedRef();

        expect(nonpacked).deep.eq([
            {
                dest: "1fa95ee88a69f541f8c6b50bffe8bd4b131886c0",
                path: "refs/tags/t2",
                type: rawtypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "refs/remotes/origin/master",
                path: "refs/remotes/origin/HEAD",
                type: rawtypes.RefType.HEAD,
            }
        ]);
    }

    @test
    @skip
    async readNonpackedRef$$() {
        const devRepo = await this.openDevRepo();
        const nonpacked = await (devRepo as any).readNonpackedRef();

        expect(nonpacked).deep.eq([]);
    }

    @test
    async readObjRaw1() {
        const testRepo = await this.openTestRepo();

        try {
            await testRepo.readObjRaw("NOT");
            throw "should not be here";
        } catch (e) {
            expect(e).instanceOf(Error);
            expect(e.message).eq("object \"NOT\" is missing");
        }
    }

    @test
    async readObjRaw2() {
        const testRepo = await this.openTestRepo();
        const rawObj = await testRepo.readObjRaw("HEAD");
        const lines = util.chunkToLines(rawObj.data);

        // metadata line: "414c5870b27970db0fa7762148adb89eb07f1fe0 commit 347"
        expect(rawObj.type).eq(rawtypes.ObjType.COMMIT);
        expect(rawObj.data.length).eq(347);
        expect(rawObj.sha1).eq("414c5870b27970db0fa7762148adb89eb07f1fe0")
        expect(lines.length).eq(9);
        expect(lines[3]).eq("committer Martin von Gagern <Martin.vGagern@gmx.net> 1478766514 +0100");
        expect(lines[7]).eq("This line got into master by accident, as gulp support isn't ready yet.");
    }

    @test
    async readCommitObj() {
        const testRepo = await this.openTestRepo();
        const obj = await testRepo.readObject("931bbc96");

        expect(obj.sha1).eq("931bbc96dc534e907479c0b82f0bf48598ad6b7c");

        if (rawtypes.DetectObjType.isCommit(obj)) {
            expect(obj.author).deep.eq({ name: "Martin von Gagern", email: "Martin.vGagern@gmx.net" });
            expect(obj.parent_sha1).deep.eq(["0b017e41fc65a3c3193fd410d6d35274d7bb7f71"]);
            expect(obj.commit_at).deep.eq({ tz: "+0200", "utc_sec": 1463522581 });
        } else {
            throw "not a commit";
        }
    }

    @test
    async readAtagObj() {
        const testRepo = await this.openTestRepo();
        const obj = await testRepo.readObject("07fc");

        expect(obj.sha1).eq("07fc5636f0359a857a5f9ecd583fcd56d6edb83b");
        expect(obj.type).eq(rawtypes.ObjType.ATAG);
        if (rawtypes.DetectObjType.isAnnotatedTag(obj)) {
            expect(obj.destType).eq(rawtypes.ObjType.COMMIT);
            expect(obj.dest).eq("414c5870b27970db0fa7762148adb89eb07f1fe0");
            expect(obj.tagger).deep.eq({ name: "Martin von Gagern", email: "Martin.vGagern@gmx.net" });
            expect(obj.tagged_at).deep.eq({ tz: "+0100", "utc_sec": 1478766625 });
            expect(obj.name).eq("v0.3.2");
            expect(obj.message.length).eq(10);
            expect(obj.message[0]).eq("Version 0.3.2");
            expect(obj.message[2]).eq("* Fixed gulp import introduced in 0.3.1 by accident");
            expect(obj.message[6]).eq("dFuDzQCeKXpBXRfcDBf9nKhPcVBoMoZgx1oAnRoeTCxkIsPhwSqiYgh3PpRYLpn1");
            expect(obj.message[8]).eq("-----END PGP SIGNATURE-----");
            expect(obj.message[9]).eq("");
        } else {
            throw "not an annotated tag";
        }
    }

    @test
    async readAllObjects1() {
        const testRepo = await this.openTestRepo();
        // a list of all objects, generated with `git cat-file --batch-all-objects --batch-check`
        const objectListFile = join(testRepo.repoRoot, "objects-list.txt");
        const objectList = await util.readLines(objectListFile);
        for (const l of objectList) {
            const sha1 = l.slice(0, 40);
            if (sha1) {
                const obj = await testRepo.readObject(sha1);
            }
        }
    }

    @test
    @timeout(100e3)
    @skip // this case requires a bare repo of TypeScript
    async readAllObjects2() {
        const testRepo = await this.openTestRepo2();
        // a list of all objects, generated with `git cat-file --batch-all-objects --batch-check`
        const objectListFile = join(testRepo.repoRoot, "objects-list.txt");
        const objectList = await util.readLines(objectListFile);
        for (const l of objectList.slice(0, 5000)) {
            const sha1 = l.slice(0, 40);
            if (sha1) {
                const obj = await testRepo.readObject(sha1);
            }
        }
    }

    @test
    async resolveRef1() {
        // Head -> Branch -> Commit
        const repo = await this.openTestRepo();
        const refs = await repo.listRefs();

        const localHead = refs[0];
        expect(localHead).deep.eq({ dest: "refs/heads/master", path: "HEAD", type: rawtypes.RefType.HEAD });
        const resolved = await repo.resolveRef(localHead);
        expect(resolved[0].type).eq(rawtypes.RefType.HEAD);
        expect(resolved[1].type).eq(rawtypes.RefType.BRANCH);
        expect(resolved[2].type).eq(rawtypes.ObjType.COMMIT);
    }

    @test
    async resolveRef2() {
        // ATAG -> ATAG -> Commit
        const repo = await this.openTestRepo();
        const refs = await repo.listRefs();

        const nestedAtag = refs[9];
        expect(nestedAtag.path).eq('refs/tags/t2');
        const resolved2 = await repo.resolveRef(nestedAtag);
        expect(resolved2).deep.eq([]);
    }
}
