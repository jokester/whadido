"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const rawtypes = require("../git/rawtypes");
const repo = require("../git/repo");
const reader = require("../git/reader");
const parser = require("../git/parser");
const path_1 = require("path");
const subprocess_1 = require("../git/subprocess");
const helper_1 = require("./helper");
const logger = console;
let TestSubProcess = class TestSubProcess {
    true_returns_0() {
        return subprocess_1.spawnSubprocess('true')
            .then(result => chai_1.expect(result.exit).eq(0));
    }
    false_returns_1() {
        return subprocess_1.spawnSubprocess('false')
            .then(result => chai_1.expect(result.exit).eq(1));
    }
    captures_stdout1() {
        return subprocess_1.spawnSubprocess('/bin/echo', ['aa', 'bb'])
            .then(result => {
            chai_1.expect(result.exit).eq(0);
            chai_1.expect(result.stdout).to.deep.eq(['aa bb', '']);
        });
    }
    captures_stdout2() {
        return subprocess_1.spawnSubprocess('/bin/echo', ["-n", 'aa', 'bb'])
            .then(result => {
            chai_1.expect(result.exit).eq(0);
            chai_1.expect(result.stdout).to.deep.eq(['aa bb']);
        });
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSubProcess.prototype, "true_returns_0", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSubProcess.prototype, "false_returns_1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSubProcess.prototype, "captures_stdout1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestSubProcess.prototype, "captures_stdout2", null);
TestSubProcess = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestSubProcess);
/**
 * test for reader.ts
 *
 * @deprecated
 *
 * @class TestGitReader
 */
let TestGitReader = class TestGitReader {
    /**
     * test for reader.ts
     *
     * @deprecated
     *
     * @class TestGitReader
     */
    constructor() {
        this.findRepo = repo.findRepo(__dirname);
    }
    findGitRepo() {
        return this.findRepo;
    }
    catFile() {
        return this.findRepo
            .then(repo => reader.catFile(repo, 'master'));
    }
    listRefs() {
        return this.findRepo
            .then(repo => reader.listRefs(repo))
            .then(refs => {
            chai_1.expect(refs.length).eq(9);
        });
    }
    readLocalHead() {
        const log = 'readLocalHead.json';
        return this.findRepo
            .then(repo => reader.readHead(repo, "HEAD"))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
    readRemoteHead_1() {
        const log = 'readRemoteHead.json';
        return this.findRepo
            .then(repo => reader.readHead(repo, "refs/remotes/origin/HEAD"))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
    readRemoteBranch() {
        const log = 'readRemoteMaster.json';
        return this.findRepo
            .then(repo => reader.readHead(repo, "refs/remotes/origin/master"))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
    readRefs() {
        const log = 'readRefs.json';
        return this.findRepo
            .then(repo => reader.readRefs(repo))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "findGitRepo", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "catFile", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "listRefs", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "readLocalHead", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "readRemoteHead_1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "readRemoteBranch", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitReader.prototype, "readRefs", null);
TestGitReader = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestGitReader);
let TestGitParser = class TestGitParser {
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
        chai_1.expect(helper_1.getMatchedIndex(/a/, ['a', 'b', 'a b a'])).deep.eq([0, 2]);
        chai_1.expect(helper_1.getMatchedIndex(patterns.ref_line, lines)).deep.eq([0, 1, 2, 3, 4, 5]);
        const matched = lines.map(l => l.match(patterns.ref_line)[3]);
        chai_1.expect(helper_1.getMatchedIndex(patterns.refpath.local_branch, matched))
            .deep.eq([0, 1]);
        chai_1.expect(helper_1.getMatchedIndex(patterns.refpath.remote_head, matched))
            .deep.eq([2]);
        chai_1.expect(helper_1.getMatchedIndex(patterns.refpath.remote_branch, matched))
            .deep.eq([3]);
        chai_1.expect(helper_1.getMatchedIndex(patterns.refpath.tag, matched))
            .deep.eq([4, 5]);
    }
    parseDate() {
        const timeStr = "1480181019 +0500";
        const date = parser.parseDate(timeStr);
        chai_1.expect(date).deep.eq({
            utc_sec: 1480181019,
            tz: '+0500'
        });
    }
    parseAuthor1() {
        const authorStr = "Wang Guan <momocraft@gmail.com>";
        chai_1.expect(parser.parseAuthor(authorStr)).deep.eq({
            name: "Wang Guan",
            email: "momocraft@gmail.com"
        });
    }
    parseAuthor2() {
        const authorStr = "Wang Guan <momocraftgmail.com>";
        chai_1.expect(parser.parseAuthor(authorStr)).deep.eq({
            name: authorStr,
            email: ""
        });
    }
    parseHEAD1() {
        const line = "ce95a0817d18df7c027df4334b19e5bc9980a995";
        chai_1.expect(parser.parseHEAD(line)).deep.eq({
            type: rawtypes.RefType.HEAD,
            dest: line,
            path: "HEAD",
        });
    }
    parseHEAD2() {
        const line = "ref: refs/heads/master";
        chai_1.expect(parser.parseHEAD(line)).deep.eq({
            type: rawtypes.RefType.HEAD,
            dest: "refs/heads/master",
            path: "HEAD",
        });
    }
    parseHEAD3() {
        const line = "ee";
        chai_1.expect(() => parser.parseHEAD(line)).to.throw();
    }
    reflogPattern() {
        const patterns = parser.PATTERNS;
        const reflogLine = '70f7812171ef7ec6bf599352e84aa57092cd412a faea5b6b1129ca7945199e4c78cc73f6cac471d6 Wang Guan <momocraft@gmail.com> 1480181019 +0900\tcommit: read refs';
        const match = patterns.reflog_line.exec(reflogLine);
        chai_1.expect(match).ok;
        chai_1.expect(parser.parseReflog(reflogLine)).deep.eq({
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
    }
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
        ];
        const parsed = parser.parseRawCommit("eeeqq", lines);
        chai_1.expect(parsed).deep.eq({
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
    parseRawCommit_orphanCommit() {
        const lines = [
            "tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074",
            "author Wang Guan <momocraft@gmail.com> 1479579845 +0500",
            "committer Wang Guan <momocraft@gmail.com> 1479579845 -0500",
            "",
            "Merge branch 'learning-3d'",
        ];
        const parsed = parser.parseRawCommit("eeeqq", lines);
        chai_1.expect(parsed).deep.eq({
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
        chai_1.expect(parsed).deep.eq([
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/heads/master", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/heads/moyu", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/remotes/origin/master", "type": "Branch", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/remotes/origin/moyu", "type": "Branch", },
            { "dest": "1940b1adca8f6633dfe9c4e73bb79b11e820af35", "path": "refs/tags/VVV", "type": "TAG OF UNKNOWN KIND", },
            { "dest": "cbe73c6c2d757565f074c95c27e2b2dadfd31428", "path": "refs/tags/WTF", "type": "TAG OF UNKNOWN KIND", },
            { "dest": "298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea", "path": "refs/tags/あああ", "type": "TAG OF UNKNOWN KIND", },
        ]);
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "refNamePatterns", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseDate", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseAuthor1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseAuthor2", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseHEAD1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseHEAD2", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseHEAD3", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "reflogPattern", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseRawCommit_mergeCommit", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parseRawCommit_orphanCommit", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestGitParser.prototype, "parsePackedRef", null);
TestGitParser = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestGitParser);
let TestGitRepo = class TestGitRepo {
    openTestRepo() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const path = path_1.join(__dirname, '..', '..', 'test', 'node-libtidy.git', 'hooks');
            const foundRepo = yield repo.findRepo(path);
            logger.info(`openTestRepo: foundRepo=${foundRepo}`);
            return repo.openRepo(foundRepo);
        });
    }
    findRepo() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const path = path_1.join(__dirname, '..', '..', 'test', 'node-libtidy.git', 'hooks');
            const foundRepo = yield repo.findRepo(path);
            const expected = path_1.join(__dirname, '..', '..', 'test', 'node-libtidy.git');
            chai_1.expect(foundRepo).to.eq(expected);
        });
    }
    openRepo() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testRepo = yield this.openTestRepo();
        });
    }
    readPackedRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testRespo = yield this.openTestRepo();
            const packedRefs = yield testRespo.readPackedRefs();
            chai_1.expect(packedRefs).deep.eq([
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
        });
    }
    readLocalHead() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const testRespo = yield this.openTestRepo();
            const localHead = yield testRespo.readLocalHead();
            chai_1.expect(localHead).deep.eq({
                dest: "refs/heads/master",
                path: "HEAD",
                type: rawtypes.RefType.HEAD,
            });
        });
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], TestGitRepo.prototype, "findRepo", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], TestGitRepo.prototype, "openRepo", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], TestGitRepo.prototype, "readPackedRefs", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], TestGitRepo.prototype, "readLocalHead", null);
TestGitRepo = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestGitRepo);
//# sourceMappingURL=git.js.map