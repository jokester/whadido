import * as lodash from "lodash";

describe("try lodash", () => {
    it("uniq", () => {
        const orig = [{ "type": "Branch", "path": "refs/heads/cli-entrypoint", "dest": "237f54d8729f9304532d6b2eade43e05a069190e", "destCommit": "237f54d8729f9304532d6b2eade43e05a069190e" },
        {
            /** refs/heads/master from packed ref */
            "type": "Branch", "path": "refs/heads/master", "dest": "a0f345a1cea6f8df066082d6112df2f64256531e", "destCommit": "a0f345a1cea6f8df066082d6112df2f64256531e"
        },
        { "type": "Branch", "path": "refs/heads/parse-reflog", "dest": "a9ebcc2a90f08aa1218c4913de805035d1fdc2af", "destCommit": "a9ebcc2a90f08aa1218c4913de805035d1fdc2af" },
        { "type": "Branch", "path": "refs/remotes/github/analyze-reflog", "dest": "346fbef348715b9d0aef721a96bb969e33125fbb", "destCommit": "346fbef348715b9d0aef721a96bb969e33125fbb" },
        { "type": "Branch", "path": "refs/remotes/github/master", "dest": "28a66bbb8d31c1c44926c8f7b04d03ecb358ad99", "destCommit": "28a66bbb8d31c1c44926c8f7b04d03ecb358ad99" },
        { "type": "Branch", "path": "refs/remotes/origin/analyze-reflog", "dest": "346fbef348715b9d0aef721a96bb969e33125fbb", "destCommit": "346fbef348715b9d0aef721a96bb969e33125fbb" },
        {
            "type": "Branch", "path": "refs/remotes/origin/master",
            "dest": "a0f345a1cea6f8df066082d6112df2f64256531e",
            "destCommit": "a0f345a1cea6f8df066082d6112df2f64256531e"
        },
        {
            "type": "Branch", "path": "refs/remotes/origin/parse-reflog",
            "dest": "10f0d2a5e76363c3b2fd627adfc9c45c57fc4d90",
            "destCommit": "10f0d2a5e76363c3b2fd627adfc9c45c57fc4d90"
        },
        { "type": "Branch", "path": "refs/remotes/origin/try/improve-read-performance-1", "dest": "2b6d1650dc6e680a82d580d2168b41565ae6b268", "destCommit": "2b6d1650dc6e680a82d580d2168b41565ae6b268" },
        {
            "type": "Branch", "path": "refs/remotes/origin/vis-reflog",
            "dest": "23b605e8bacc6e0b59947cbfc4ce4e158bc325be", "destCommit": "23b605e8bacc6e0b59947cbfc4ce4e158bc325be"
        },
        {
            /** refs/heads/master from packed ref */
            "dest": "1940b1adca8f6633dfe9c4e73bb79b11e820af35",
            "type": "Branch", "path": "refs/heads/master"
        },
        { "dest": "1940b1adca8f6633dfe9c4e73bb79b11e820af35", "type": "Branch", "path": "refs/remotes/origin/master" }];

        expect(orig.length).toBe(12);

        const sorted1 = lodash.uniqBy(orig, "path");
        expect(sorted1.length).toEqual(10);

        const sorted2 = lodash.uniqBy(orig, r => r.path);
        expect(sorted2.length).toEqual(10);

    });
});