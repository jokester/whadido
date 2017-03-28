"use strict";
/**
 * Generic parser combinator
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
// unit :: a -> M a
exports.unit = (a) => {
    return (input) => [{ output: a, rest: input }];
};
// zero :: M a
exports.zero = (input) => [];
// bind: M a -> (a -> M b) -> M b
exports.bind = (m, k) => {
    return ((input) => m(input).map(mRet => k(mRet.output)(mRet.rest)).reduce(util_1.concatReducer, []));
};
// orMulti :: [M a] -> M a
exports.orMulti = (...ms) => {
    return ((input) => ms.map(m => m(input)).reduce(util_1.concatReducer, []));
};
exports.or = exports.orMulti;
// filter :: M a -> (a -> Bool) -> M a
exports.filter = (m, predicate) => {
    return ((input) => m(input).filter(mRet => predicate(mRet.output)));
};
var Iterate;
(function (Iterate) {
    // iterate :: M a -> M [a]
    Iterate.iterate = (m) => {
        return exports.or(exports.bind(m, (a) => exports.bind(Iterate.iterate(m), (bs) => exports.unit([a].concat(bs)))), exports.unit([]));
    };
    const iterate1 = (m, prev) => {
        return prev
            .map(p => exports.bind(m, a => exports.unit(p.output.concat([a])))(p.rest))
            .reduce(util_1.concatReducer, []);
    };
    // iterateN :: Int -> Int -> M a -> M [a]
    Iterate.iterateN = (minCount, maxCount) => (m) => {
        return (input) => {
            let count = 0;
            const result = [];
            let temp = exports.unit([])(input);
            while (count <= maxCount) {
                if (minCount <= count)
                    result.push(...temp);
                // run m for 1 more time
                temp = iterate1(m, temp);
                count++;
            }
            return result;
        };
    };
    Iterate.oneOrMany = Iterate.iterateN(1, Number.MAX_SAFE_INTEGER);
    // reiterate :: M a -> M [a]
    // like iterate, but stop at first match
    Iterate.reiterate = (m) => {
        return exports.biased(exports.bind(m, (a) => exports.bind(Iterate.reiterate(m), (bs) => exports.unit([a].concat(bs)))), exports.unit([]));
    };
})(Iterate || (Iterate = {}));
exports.iterate = Iterate.iterate, exports.iterateN = Iterate.iterateN, exports.reiterate = Iterate.reiterate;
// skip multiple m1 and return m2
exports.skip = (m1, m2) => {
    return exports.bind(exports.reiterate(m1), _ => m2);
};
// biasedM :: [M a] -> M a
exports.biased = (...ms) => {
    return ((input) => {
        for (const m of ms) {
            if (!m)
                continue;
            const r = m(input);
            if (r.length)
                return r;
        }
        return [];
    });
};
exports.seq2 = (p1, p2, then) => {
    return exports.bind(p1, a => exports.bind(p2, b => then(a, b)));
};
exports.seq3 = (p1, p2, p3, then) => {
    return exports.bind(p1, a => exports.bind(p2, b => exports.bind(p3, c => then(a, b, c))));
};
exports.lookAhead = (predicate, p) => {
    return ((input) => predicate(input) ? p(input) : exports.zero(input));
};
//# sourceMappingURL=combinator.js.map