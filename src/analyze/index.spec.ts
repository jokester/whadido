/* eslint-disable */
import { fromTest, fromTmp } from '../spec/helper';
import { topParser } from './reflog';
import { buildState, countReflog, RefHistory, unbuildState } from './ref-state';
import { fsp } from "../util/fsp";

const { readText, writeFile } = fsp;

describe('reflog - parser', () => {

  for(const [tag, jsonFilename] of new Map<string, string>([
    ['whadido-1', 'whadido-1.json'],
    ['bangumi-1', 'bangumi-1.json'],
    ['ts-boilerplate-1', 'ts-boilerplate-1.json'],
  ])) {
    it(`parses ${tag}`, () => testWithDump(tag, jsonFilename));
  }

  async function testWithDump(tag: string, jsonFilename: string) {

    const input = JSON.parse(await readText(fromTest(jsonFilename)))

    const inputState = buildState(input);

    const parsed = topParser(inputState);

    for(let i=0; i < parsed.length; i++) {
      const {output, rest} = parsed[i];
      await writeFile(fromTmp(`${tag}-output-alt${i}.json`), JSON.stringify(output, undefined, 4));
      await writeFile(fromTmp(`${tag}-rest-alt${i}.json`), JSON.stringify(unbuildState(input, rest), undefined, 4));
    }

    expect(parsed.map(p => p.output)).toMatchSnapshot(`topParser(${jsonFilename}`);
  }

});
