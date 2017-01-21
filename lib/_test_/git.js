"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const git_reader = require("../git/reader");
const git_parser = require("../git/parser");
const subprocess_1 = require("../git/subprocess");
const helper_1 = require("./helper");
function count(array, value) {
    return array.filter(v => v === value).length;
}
function getMatchedIndex(pattern, against) {
    const matched = [];
    // return against.filter(s => s.match(pattern)).map(toIndex);
    against.forEach((v, lineNo) => {
        if (v.match(pattern)) {
            matched.push(lineNo);
        }
    });
    return matched;
}
let SubProcess = class SubProcess {
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
], SubProcess.prototype, "true_returns_0", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], SubProcess.prototype, "false_returns_1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], SubProcess.prototype, "captures_stdout", null);
SubProcess = tslib_1.__decorate([
    mocha_typescript_1.suite
], SubProcess);
let GitParser = class GitParser {
    refNamePatterns() {
        const patterns = git_parser.PATTERNS;
        const lines = [
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/heads/master",
            "373a71c3290b40a538346285e346eeff3f72c32b commit refs/heads/try-test",
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/HEAD",
            "70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/master",
            "16c3ed22fae69b4eee2fe5bccd1a12cb6d696897 commit refs/tags/tag1",
            "1022a187d2cb5614c49733987a8b04bc8b747115 tag    refs/tags/tag5"
        ];
        chai_1.expect(getMatchedIndex(/a/, ['a', 'b', 'a b a'])).deep.eq([0, 2]);
        chai_1.expect(getMatchedIndex(patterns.ref_line, lines)).deep.eq([0, 1, 2, 3, 4, 5]);
        const matched = lines.map(l => l.match(patterns.ref_line)[3]);
        chai_1.expect(getMatchedIndex(patterns.refnames.local_branch, matched))
            .deep.eq([0, 1]);
        chai_1.expect(getMatchedIndex(patterns.refnames.remote_head, matched))
            .deep.eq([2]);
        chai_1.expect(getMatchedIndex(patterns.refnames.remote_branch, matched))
            .deep.eq([3]);
        chai_1.expect(getMatchedIndex(patterns.refnames.tag, matched))
            .deep.eq([4, 5]);
    }
    parseDate() {
        const timeStr = "1480181019 +0500";
        const date = git_parser.parseDate(timeStr);
        chai_1.expect(date).deep.eq({
            utc_sec: 1480181019,
            tz: '+0500'
        });
    }
    parseAuthor1() {
        const authorStr = "Wang Guan <momocraft@gmail.com>";
        chai_1.expect(git_parser.parseAuthor(authorStr)).deep.eq({
            name: "Wang Guan",
            email: "momocraft@gmail.com"
        });
    }
    parseAuthor2() {
        const authorStr = "Wang Guan <momocraftgmail.com>";
        chai_1.expect(git_parser.parseAuthor(authorStr)).deep.eq({
            name: authorStr,
            email: ""
        });
    }
    reflogPattern() {
        const patterns = git_parser.PATTERNS;
        const reflogLine = '70f7812171ef7ec6bf599352e84aa57092cd412a faea5b6b1129ca7945199e4c78cc73f6cac471d6 Wang Guan <momocraft@gmail.com> 1480181019 +0900\tcommit: read refs';
        const match = patterns.reflog_line.exec(reflogLine);
        chai_1.expect(match).ok;
        chai_1.expect(git_parser.parseReflog(reflogLine)).deep.eq({
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
        const parsed = git_parser.parseRawCommit("eeeqq", lines);
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
        const parsed = git_parser.parseRawCommit("eeeqq", lines);
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
], GitParser.prototype, "refNamePatterns", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitParser.prototype, "parseDate", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitParser.prototype, "parseAuthor1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitParser.prototype, "parseAuthor2", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitParser.prototype, "reflogPattern", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitParser.prototype, "parseRawCommit_mergeCommit", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitParser.prototype, "parseRawCommit_orphanCommit", null);
GitParser = tslib_1.__decorate([
    mocha_typescript_1.suite
], GitParser);
let GitReader = class GitReader {
    constructor() {
        this.findRepo = git_reader.findGitRepo(__dirname);
    }
    findGitRepo() {
        return this.findRepo;
    }
    catFile() {
        return this.findRepo
            .then(repo => git_reader.catFile(repo, 'master'));
    }
    listRefs() {
        return this.findRepo
            .then(repo => git_reader.listRefs(repo))
            .then(refs => {
            chai_1.expect(refs.length).eq(9);
        });
    }
    readLocalHead() {
        const log = 'readLocalHead.json';
        return this.findRepo
            .then(repo => git_reader.readHead(repo, "HEAD"))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
    readRemoteHead_1() {
        const log = 'readRemoteHead.json';
        return this.findRepo
            .then(repo => git_reader.readHead(repo, "refs/remotes/origin/HEAD"))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
    readRemoteBranch() {
        const log = 'readRemoteMaster.json';
        return this.findRepo
            .then(repo => git_reader.readHead(repo, "refs/remotes/origin/master"))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
    readRefs() {
        const log = 'readRefs.json';
        return this.findRepo
            .then(repo => git_reader.readRefs(repo))
            .then(helper_1.logAsJSON(log))
            .catch(helper_1.logError(log));
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "findGitRepo", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "catFile", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "listRefs", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "readLocalHead", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "readRemoteHead_1", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "readRemoteBranch", null);
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], GitReader.prototype, "readRefs", null);
GitReader = tslib_1.__decorate([
    mocha_typescript_1.suite
], GitReader);
//# sourceMappingURL=git.js.map