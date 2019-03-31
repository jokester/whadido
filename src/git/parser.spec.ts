import * as parser from './parser';
import { getMatchedIndex } from '../spec/helper';
import * as gittypes from './types';
import { Ref } from './types';

describe('parser.ts', () => {
  it('parses ref name', () => {
    const patterns = parser.PATTERNS;

    const lines = [
      '70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/heads/master',
      '373a71c3290b40a538346285e346eeff3f72c32b commit refs/heads/try-test',
      '70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/HEAD',
      '70f7812171ef7ec6bf599352e84aa57092cd412a commit refs/remotes/origin/master',
      '16c3ed22fae69b4eee2fe5bccd1a12cb6d696897 commit refs/tags/tag1',
      '1022a187d2cb5614c49733987a8b04bc8b747115 tag    refs/tags/tag5',
    ];

    expect(getMatchedIndex(/a/, ['a', 'b', 'a b a'])).toEqual([0, 2]);

    expect(getMatchedIndex(patterns.refLine, lines)).toEqual([0, 1, 2, 3, 4, 5]);

    const matched = lines.map(l => l.match(patterns.refLine)![3]);

    expect(getMatchedIndex(patterns.refpath.localBranch, matched)).toEqual([0, 1]);

    expect(getMatchedIndex(patterns.refpath.remoteHead, matched)).toEqual([2]);

    expect(getMatchedIndex(patterns.refpath.remoteBranch, matched)).toEqual([3]);

    expect(getMatchedIndex(patterns.refpath.tag, matched)).toEqual([4, 5]);
  });

  it('parses date', () => {
    expect(parser.parseDate('1480181019 +0500')).toEqual({
      utcSec: 1480181019,
      tz: '+0500',
    });
  });

  it('parses author', () => {
    expect(parser.parseAuthor('Wang Guan <momocraft@gmail.com>')).toEqual({
      name: 'Wang Guan',
      email: 'momocraft@gmail.com',
    });

    expect(parser.parseAuthor('Wang Guan <momocraftgmail.com>')).toEqual({
      name: 'Wang Guan <momocraftgmail.com>',
      email: '',
    });
  });

  it('parsed a HEAD', () => {
    const line1 = 'ce95a0817d18df7c027df4334b19e5bc9980a995';
    expect(parser.parseHEAD(line1)).toEqual({
      type: gittypes.Ref.RefType.LocalHead,
      dest: line1,
      path: 'HEAD',
    });

    const line2 = 'ref: refs/heads/master';
    expect(parser.parseHEAD(line2)).toEqual({
      type: gittypes.Ref.RefType.LocalHead,
      dest: 'refs/heads/master',
      path: 'HEAD',
    });

    const line3 = 'ee';
    expect(() => parser.parseHEAD(line3)).toThrow();
  });

  it('parses reflog pattern', () => {
    const patterns = parser.PATTERNS;

    const reflogLine =
      '70f7812171ef7ec6bf599352e84aa57092cd412a faea5b6b1129ca7945199e4c78cc73f6cac471d6 Wang Guan <momocraft@gmail.com> 1480181019 +0900\tcommit: read refs';
    const match = patterns.reflogLine.exec(reflogLine);

    expect(match).toBeTruthy();

    expect(parser.parseReflog(reflogLine)).toEqual({
      from: '70f7812171ef7ec6bf599352e84aa57092cd412a',
      to: 'faea5b6b1129ca7945199e4c78cc73f6cac471d6',
      at: {
        utcSec: 1480181019,
        tz: '+0900',
      },
      by: {
        name: 'Wang Guan',
        email: 'momocraft@gmail.com',
      },
      desc: 'commit: read refs',
    });
  });

  it('parses a merge commit', () => {
    // a commit with 2 parants
    const lines = [
      'tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074',
      'parent e878f7caaf971fd3f4808d66fb41a74ac9567d44',
      'parent 06af50718ab0dc34024b312fddbb95f565d5e194',
      'author Wang Guan <momocraft@gmail.com> 1479579845 +0000',
      'committer Wang Guan <momocraft@gmail.com> 1479579855 +0000',
      '',
      "Merge branch 'learning-3d'",
    ] as string[];

    const parsed = parser.parseCommit('eeeqq', lines);
    expect(parsed).toEqual({
      author: {
        email: 'momocraft@gmail.com',
        name: 'Wang Guan',
      },
      authorAt: {
        tz: '+0000',
        utcSec: 1479579845,
      },
      commitAt: {
        tz: '+0000',
        utcSec: 1479579855,
      },
      committer: {
        email: 'momocraft@gmail.com',
        name: 'Wang Guan',
      },
      message: ["Merge branch 'learning-3d'"],
      parentSHA1: ['e878f7caaf971fd3f4808d66fb41a74ac9567d44', '06af50718ab0dc34024b312fddbb95f565d5e194'],
      sha1: 'eeeqq',
      type: gittypes.Obj.ObjType.Commit,
    });
  });

  it('parses a orphan commit', () => {
    const lines = [
      'tree 2d0c2fb45fe59fa84bd8c940ef5cc7ea0a050074',
      'author Wang Guan <momocraft@gmail.com> 1479579845 +0500',
      'committer Wang Guan <momocraft@gmail.com> 1479579845 -0500',
      '',
      "Merge branch 'learning-3d'",
    ] as string[];

    const parsed = parser.parseCommit('eeeqq', lines);
    expect(parsed).toEqual({
      author: {
        email: 'momocraft@gmail.com',
        name: 'Wang Guan',
      },
      authorAt: {
        tz: '+0500',
        utcSec: 1479579845,
      },
      commitAt: {
        tz: '-0500',
        utcSec: 1479579845,
      },
      committer: {
        email: 'momocraft@gmail.com',
        name: 'Wang Guan',
      },
      message: ["Merge branch 'learning-3d'"],
      parentSHA1: [],
      sha1: 'eeeqq',
      type: gittypes.Obj.ObjType.Commit,
    });
  });

  it('parses packed ref', () => {
    const lines = `# pack-refs with: peeled fully-peeled
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/heads/master
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/heads/moyu
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/remotes/origin/master
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/remotes/origin/moyu
    1940b1adca8f6633dfe9c4e73bb79b11e820af35 refs/tags/VVV
    cbe73c6c2d757565f074c95c27e2b2dadfd31428 refs/tags/WTF
    298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea refs/tags/あああ`
      .split('\n')
      .map(line => line.trim());

    const parsed = parser.parsePackedRefBlock(lines);
    expect(parsed).toEqual([
      { dest: '298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea', path: 'refs/heads/master', type: Ref.RefType.LocalBranch },
      { dest: '298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea', path: 'refs/heads/moyu', type: Ref.RefType.LocalBranch },
      {
        dest: '298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea',
        path: 'refs/remotes/origin/master',
        type: Ref.RefType.RemoteBranch,
      },
      {
        dest: '298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea',
        path: 'refs/remotes/origin/moyu',
        type: Ref.RefType.RemoteBranch,
      },
      {
        dest: '1940b1adca8f6633dfe9c4e73bb79b11e820af35',
        path: 'refs/tags/VVV',
        type: Ref.RefType.Tag,
      },
      {
        dest: 'cbe73c6c2d757565f074c95c27e2b2dadfd31428',
        path: 'refs/tags/WTF',
        type: Ref.RefType.Tag,
      },
      {
        dest: '298ca5248eda588e2e18ccdbe9b4d8e8b7ceaeea',
        path: 'refs/tags/あああ',
        type: Ref.RefType.Tag,
      },
    ]);
  });
});
