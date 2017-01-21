"use strict";
const reader_1 = require("./reader");
function openRepo(start) {
    return reader_1.findGitRepo(start).then(path => new GitRepo(path));
}
exports.openRepo = openRepo;
class GitRepo {
    constructor(path) {
        this.path = path;
    }
    listRefs() {
    }
    watchRefs(callback) {
    }
}
//# sourceMappingURL=repo.js.map