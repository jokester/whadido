"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const repo = require("../git/repo");
const reader = require("../git/reader");
const parser = require("../git/parser");
const subprocess_1 = require("../git/subprocess");
const helper_1 = require("./helper");
let TestSubProcess = class TestSubProcess {
    true_returns_0() {
        return subprocess_1.spawnSubprocess('true')
            .then(result => chai_1.expect(result.exit).eq(0));
    }
    false_returns_1() {
        return subprocess_1.spawnSubprocess('false')
            .then(result => chai_1.expect(result.exit).eq(1));
    }
    captures_stdout() {
        return subprocess_1.spawnSubprocess('/bin/echo', ['aa', 'bb'])
            .then(result => {
            chai_1.expect(result.exit).eq(0);
            chai_1.expect(result.stdout).to.deep.eq(['aa bb', '']);
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
], TestSubProcess.prototype, "captures_stdout", null);
TestSubProcess = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestSubProcess);
let TestGitReader = class TestGitReader {
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
TestGitParser = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestGitParser);
//# sourceMappingURL=git.js.map