"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const gittypes = require("../git/types");
const repo = require("../git/repo");
const parser = require("../git/parser");
const path = require("path");
const subprocess_1 = require("../util/subprocess");
const helper_1 = require("./helper");
const logger = console;
describe("getSubprocessOutput", () => {
    it("captures exit value of process", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result1 = yield subprocess_1.getSubprocessOutput('true');
        expect(result1.stderr).toEqual([""]);
        let err;
        try {
            yield subprocess_1.getSubprocessOutput('false');
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeTruthy();
    }));
    it("captures stdout", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield subprocess_1.getSubprocessOutput('/bin/echo', ['aa', 'bb']);
        expect(result.stdout).toEqual(['aa bb', '']);
        const result2 = yield subprocess_1.getSubprocessOutput('/bin/echo', ["-n", 'aa', 'bb']);
        expect(result2.stdout).toEqual(['aa bb']);
    }));
});
describe("parser.ts", () => {
    it("parses ref name", () => {
        const patterns = parser.PATTERNS;
        const lines = [
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/heads/master",
            "373a71c3290b40a538346285e346eeff3f72c32b commit refs/heads/try-test",
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/HEAD",
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/master",
            "16c3ed22fae69b4eee2fe5bccd1a12cb6d696897 commit refs/tags/tag1",
            "1022a187d2cb5614c49733987a8b04bc8b747115 tag    refs/tags/tag5"
        ];
        expect(helper_1.getMatchedIndex(/a/, ['a', 'b', 'a b a'])).toEqual([0, 2]);
        expect(helper_1.getMatchedIndex(patterns.ref_line, lines)).toEqual([0, 1, 2, 3, 4, 5]);
        const matched = lines.map(l => l.match(patterns.ref_line)[3]);
        expect(helper_1.getMatchedIndex(patterns.refpath.local_branch, matched))
            .toEqual([0, 1]);
        expect(helper_1.getMatchedIndex(patterns.refpath.remote_head, matched))
            .toEqual([2]);
        expect(helper_1.getMatchedIndex(patterns.refpath.remote_branch, matched))
            .toEqual([3]);
        expect(helper_1.getMatchedIndex(patterns.refpath.tag, matched))
            .toEqual([4, 5]);
    });
    it("parses date", () => {
        expect(parser.parseDate("1480181019 +0500")).toEqual({
            utc_sec: 1480181019,
            tz: '+0500'
        });
    });
    it("parses author", () => {
        expect(parser.parseAuthor("Wang Guan <momocraft@gmail.com>")).toEqual({
            name: "Wang Guan",
            email: "momocraft@gmail.com"
        });
        expect(parser.parseAuthor("Wang Guan <momocraftgmail.com>")).toEqual({
            name: "Wang Guan <momocraftgmail.com>",
            email: ""
        });
    });
    it("parsed a HEAD", () => {
        const line1 = "ce95a0817d18df7c027df4334b19e5bc9980a995";
        expect(parser.parseHEAD(line1)).toEqual({
            type: gittypes.RefType.HEAD,
            dest: line1,
            path: "HEAD",
        });
        const line2 = "ref: refs/heads/master";
        expect(parser.parseHEAD(line2)).toEqual({
            type: gittypes.RefType.HEAD,
            dest: "refs/heads/master",
            path: "HEAD",
        });
        const line3 = "ee";
        expect(() => parser.parseHEAD(line3)).toThrow();
    });
    it("parses reflog pattern", () => {
        const patterns = parser.PATTERNS;
        const reflogLine = '70f7812171ef7ec6bf599352e84aa57092cd412a faea5b6b1129ca7945199e4c78cc73f6cac471d6 Wang Guan <momocraft@gmail.com> 1480181019 +0900\tcommit: read refs';
        const match = patterns.reflog_line.exec(reflogLine);
        expect(match).toBeTruthy();
        expect(parser.parseReflog(reflogLine)).toEqual({
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
        });
    });
    it("parses a merge commit", () => {
        // a commit with 2 parants
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "parent e878f7caaf971fd3f4808d66fb41a74ac9567d44",
            "parent 06af50718ab0dc34024b312fddbb95f565d5e194",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0000",
            "committer Wang Guan <momocraft@gmail.com> 1479579855 +0000",
            "",
            "Merge branch 'learning-3d'",
        ];
        const parsed = parser.parseCommit("eeeqq", lines);
        expect(parsed).toEqual({
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
            type: 1 /* COMMIT */,
        });
    });
    it("parses a orphan commit", () => {
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0500",
            "committer Wang Guan <momocraft@gmail.com> 1479579845 -0500",
            "",
            "Merge branch 'learning-3d'",
        ];
        const parsed = parser.parseCommit("eeeqq", lines);
        expect(parsed).toEqual({
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
            type: 1 /* COMMIT */,
        });
    });
    it("parses packed ref", () => {
        const lines = `# pack-refs with: peeled fully-peeled
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/heads/master
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/heads/moyu
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/remotes/origin/master
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/remotes/origin/moyu
    1940b1adca8f6633dfe9c4e73bb79b11e820af35 refs/tags/VVV
    cbe73c6c2d757565f074c95c27e2b2dadfd31428 refs/tags/WTF
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/tags/あああ`.split("\n").map(line => line.trim());
        const parsed = parser.parsePackedRef(lines);
        expect(parsed).toEqual([
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/heads/master", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/heads/moyu", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/remotes/origin/master", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/remotes/origin/moyu", "type": "Branch", },
            { "dest": "1940b1adca8f6633dfe9c4e73bb79b11e820af35", "path": "refs/tags/VVV", "type": "TAG OF UNKNOWN KIND", },
            { "dest": "cbe73c6c2d757565f074c95c27e2b2dadfd31428", "path": "refs/tags/WTF", "type": "TAG OF UNKNOWN KIND", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/tags/あああ", "type": "TAG OF UNKNOWN KIND", },
        ]);
    });
});
describe("git reader", () => {
    // a node-libtidy repo included for test
    const devRepoRoot = path.join(__dirname, '..', '..', 'test', 'node-libtidy.git');
    const devRepoStart = repo.findRepo(path.join(devRepoRoot, "hooks"));
    let devRepo;
    let r;
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        devRepo = (yield repo.openRepo(devRepoRoot));
        r = yield devRepo;
    }));
    afterEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        r.dispose();
    }));
    it("finds repo", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const repoPath = yield devRepoStart;
        expect(repoPath).toEqual(devRepoRoot);
    }));
    it("opens repo", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        expect(r.repoRoot).toEqual(devRepoRoot);
    }));
    it("reads packed refs", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const packedRefs = yield r.readPackedRefs();
        expect(packedRefs).toEqual([
            {
                dest: "414c5870b27970db0fa7762148adb89eb07f1fe0",
                path: "refs/heads/master",
                type: gittypes.RefType.BRANCH,
            },
            {
                dest: "414c5870b27970db0fa7762148adb89eb07f1fe0",
                path: "refs/remotes/origin/master",
                type: gittypes.RefType.BRANCH,
            },
            {
                dest: "49e49799d6625785708fc64b365ea0fae1c48ece",
                path: "refs/tags/v0.1.0",
                type: gittypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "915849a5d77a57ed389d93a638d5e329c6c565ae",
                path: "refs/tags/v0.1.1",
                type: gittypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "78c872a7676487dc430339031cf1a6d179ed4946",
                path: "refs/tags/v0.2.0",
                type: gittypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "3f8a54c3780f7c6db91dabd97b67fa77e75822b6",
                path: "refs/tags/v0.3.0",
                type: gittypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "aec08967c642f58651a414996c1e9368ff42baa9",
                path: "refs/tags/v0.3.1",
                type: gittypes.RefType.UNKNOWN_TAG,
            },
            {
                dest: "07fc5636f0359a857a5f9ecd583fcd56d6edb83b",
                path: "refs/tags/v0.3.2",
                type: gittypes.RefType.UNKNOWN_TAG,
            },
        ]);
    }));
    it("reads local HEAD", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const localHead = yield r.readLocalHead();
        expect(localHead).toEqual({
            dest: "refs/heads/master",
            path: "HEAD",
            type: gittypes.RefType.HEAD,
        });
    }));
    it("reads unpacked refs", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const unpackedRefs = yield r.readUnpackedRefs();
        expect(unpackedRefs).toEqual([
            {
                dest: "1fa95ee88a69f541f8c6b50bffe8bd4b131886c0",
                path: "refs/tags/t2",
                type: "TAG OF UNKNOWN KIND",
            },
            {
                dest: "refs/remotes/origin/master",
                path: "refs/remotes/origin/HEAD",
                type: "HEAD",
            }
        ]);
    }));
    it("reads all refs", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const refs = yield r.listRefs();
        expect(refs.length).toEqual(/*local head*/ 1 + 2 + 8);
    }));
    it("reads object", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const o = yield r.readObject("f71ebe8741ed7866115a0e27cf4431067627ecd9");
    }));
    it("resolves ref: local HEAD", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const head = yield r.getRefByPath("HEAD");
        const resolved = yield r.resolveRef(head);
        expect(resolved.length).toEqual(3);
        expect(resolved[0].type).toEqual(gittypes.RefType.HEAD);
        expect(resolved[1].type).toEqual(gittypes.RefType.BRANCH);
        expect(resolved[2].type).toEqual(1 /* COMMIT */);
    }));
    it("resolves ref: local branch", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const head = yield r.getRefByPath("refs/heads/master");
        const resolved = yield r.resolveRef(head);
        expect(resolved.length).toEqual(2);
        expect(resolved[0].type).toEqual(gittypes.RefType.BRANCH);
        expect(resolved[1].type).toEqual(1 /* COMMIT */);
    }));
    it("resolves ref: remote HEAD", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const head = yield r.getRefByPath("refs/remotes/origin/HEAD");
        const resolved = yield r.resolveRef(head);
        expect(resolved.length).toEqual(3);
        expect(resolved[0].type).toEqual(gittypes.RefType.HEAD);
        expect(resolved[1].type).toEqual(gittypes.RefType.BRANCH);
        expect(resolved[2].type).toEqual(1 /* COMMIT */);
    }));
    it("resolves ref: remote branch", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        const head = yield r.getRefByPath("refs/remotes/origin/master");
        const resolved = yield r.resolveRef(head);
        expect(resolved.length).toEqual(2);
        expect(resolved[0].type).toEqual(gittypes.RefType.BRANCH);
        expect(resolved[1].type).toEqual(1 /* COMMIT */);
    }));
    it("throws when obj sha1 not exist", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
        try {
            yield r.readObjRaw("NOT");
            throw "should not be here";
        }
        catch (e) {
            // expect(e).instanceOf(Error);
            expect(e.message).toEqual("object \"NOT\" is missing");
        }
    }));
    it("reads obj", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const r = yield devRepo;
    }));
    //     @test
    //     async readObjRaw2() {
    //         const testRepo = await this.openTestRepo();
    //         const rawObj = await testRepo.readObjRaw("HEAD");
    //         const lines = util.chunkToLines(rawObj.data);
    //         // metadata line: "414c5870b27970db0fa7762148adb89eb07f1fe0 commit 347"
    //         expect(rawObj.type).eq(gittypes.ObjType.COMMIT);
    //         expect(rawObj.data.length).eq(347);
    //         expect(rawObj.sha1).eq("414c5870b27970db0fa7762148adb89eb07f1fe0")
    //         expect(lines.length).eq(9);
    //         expect(lines[3]).eq("committer Martin von Gagern <Martin.vGagern@gmx.net> 1478766514 +0100");
    //         expect(lines[7]).eq("This line got into master by accident, as gulp support isn't ready yet.");
    //     }
    //     @test
    //     async readCommitObj() {
    //         const testRepo = await this.openTestRepo();
    //         const obj = await testRepo.readObject("931bbc96");
    //         expect(obj.sha1).eq("931bbc96dc534e907479c0b82f0bf48598ad6b7c");
    //         if (gittypes.DetectObjType.isCommit(obj)) {
    //             expect(obj.author).deep.eq({ name: "Martin von Gagern", email: "Martin.vGagern@gmx.net" });
    //             expect(obj.parent_sha1).deep.eq(["0b017e41fc65a3c3193fd410d6d35274d7bb7f71"]);
    //             expect(obj.commit_at).deep.eq({ tz: "+0200", "utc_sec": 1463522581 });
    //         } else {
    //             throw "not a commit";
    //         }
    //     }
    //     @test
    //     async readAtagObj() {
    //         const testRepo = await this.openTestRepo();
    //         const obj = await testRepo.readObject("07fc");
    //         expect(obj.sha1).eq("07fc5636f0359a857a5f9ecd583fcd56d6edb83b");
    //         expect(obj.type).eq(gittypes.ObjType.ATAG);
    //         if (gittypes.DetectObjType.isAnnotatedTag(obj)) {
    //             expect(obj.destType).eq(gittypes.ObjType.COMMIT);
    //             expect(obj.dest).eq("414c5870b27970db0fa7762148adb89eb07f1fe0");
    //             expect(obj.tagger).deep.eq({ name: "Martin von Gagern", email: "Martin.vGagern@gmx.net" });
    //             expect(obj.tagged_at).deep.eq({ tz: "+0100", "utc_sec": 1478766625 });
    //             expect(obj.name).eq("v0.3.2");
    //             expect(obj.message.length).eq(10);
    //             expect(obj.message[0]).eq("Version 0.3.2");
    //             expect(obj.message[2]).eq("* Fixed gulp import introduced in 0.3.1 by accident");
    //             expect(obj.message[6]).eq("dFuDzQCeKXpBXRfcDBf9nKhPcVBoMoZgx1oAnRoeTCxkIsPhwSqiYgh3PpRYLpn1");
    //             expect(obj.message[8]).eq("-----END PGP SIGNATURE-----");
    //             expect(obj.message[9]).eq("");
    //         } else {
    //             throw "not an annotated tag";
    //         }
    //     }
    //     @test
    //     async readAllObjects1() {
    //         const testRepo = await this.openTestRepo();
    //         // a list of all objects, generated with `git cat-file --batch-all-objects --batch-check`
    //         const objectListFile = join(testRepo.repoRoot, "objects-list.txt");
    //         const objectList = await util.readLines(objectListFile);
    //         for (const l of objectList) {
    //             const sha1 = l.slice(0, 40);
    //             if (sha1) {
    //                 const obj = await testRepo.readObject(sha1);
    //             }
    //         }
    //     }
    //     @test
    //     @timeout(100e3)
    //     @skip // this case requires a bare repo of TypeScript
    //     async readAllObjects2() {
    //         const testRepo = await this.openTestRepo2();
    //         // a list of all objects, generated with `git cat-file --batch-all-objects --batch-check`
    //         const objectListFile = join(testRepo.repoRoot, "objects-list.txt");
    //         const objectList = await util.readLines(objectListFile);
    //         for (const l of objectList.slice(0, 5000)) {
    //             const sha1 = l.slice(0, 40);
    //             if (sha1) {
    //                 const obj = await testRepo.readObject(sha1);
    //             }
    //         }
    //     }
    //     @test
    //     async resolveRef1() {
    //         // Head -> Branch -> Commit
    //         const repo = await this.openTestRepo();
    //         const refs = await repo.listRefs();
    //         const localHead = refs[0];
    //         expect(localHead).deep.eq({ dest: "refs/heads/master", path: "HEAD", type: gittypes.RefType.HEAD });
    //         const resolved = await repo.resolveRef(localHead);
    //         expect(resolved[0].type).eq(gittypes.RefType.HEAD);
    //         expect(resolved[1].type).eq(gittypes.RefType.BRANCH);
    //         expect(resolved[2].type).eq(gittypes.ObjType.COMMIT);
    //     }
    //     @test
    //     async resolveRef2() {
    //         // ATAG -> ATAG -> Commit
    //         const repo = await this.openTestRepo();
    //         const refs = await repo.listRefs();
    //         const nestedAtag = refs[9];
    //         expect(nestedAtag.path).eq('refs/tags/t2');
    //         const resolved2 = await repo.resolveRef(nestedAtag);
    //         expect(resolved2).deep.eq([]);
    //     }
    // }
});
xdescribe("reader.ts", () => {
});
// /**
//  * test for reader.ts
//  *
//  * @deprecated
//  *
//  * @class TestGitReader
//  */
// @suite
// class TestGitReader {
//     private 
//     @test
//     @skip
//     catFile() {
//         return this.findRepo
//             .then(repo => reader.catFile(repo, 'master'));
//     }
//     @test
//     @skip
//     listRefs() {
//         return this.findRepo
//             .then(repo => reader.listRefs(repo))
//             .then(refs => {
//                 expect(refs.length).eq(9);
//             })
//     }
//     @test
//     readLocalHead() {
//         const log = 'readLocalHead.json';
//         return this.findRepo
//             .then(repo => reader.readHead(repo, "HEAD"))
//             .then(logAsJSON(log))
//             .catch(logError(log));
//     }
//     @test
//     readRemoteHead_1() {
//         const log = 'readRemoteHead.json';
//         return this.findRepo
//             .then(repo => reader.readHead(repo, "refs/remotes/origin/HEAD"))
//             .then(logAsJSON(log))
//             .catch(logError(log));
//     }
//     @test
//     readRemoteBranch() {
//         const log = 'readRemoteMaster.json';
//         return this.findRepo
//             .then(repo => reader.readHead(repo, "refs/remotes/origin/master"))
//             .then(logAsJSON(log))
//             .catch(logError(log));
//     }
//     @test
//     @skip
//     readRefs() {
//         const log = 'readRefs.json';
//         return this.findRepo
//             .then(repo => reader.readRefs(repo))
//             .then(logAsJSON(log))
//             .catch(logError(log));
//     }
// }
//# sourceMappingURL=git.spec.js.map