import { Obj } from './types';
import { ObjTypeMappings, PATTERNS } from './parser';
import { GitRepoException } from '../error';
import { chunkToLines } from '../vendor/ts-commonutil/text/chunk-to-lines';

/**
 * Receive a series of chunks (from output of git cat-file --batch) and build Object
 */
export class ObjBuilder {
  private readonly chunks: Buffer[] = [];
  private metadataSize = 0;
  private objSize = 0;
  private currentProgress = 0;
  private objType!: Obj.ObjType;
  private objFullname!: string;

  constructor(readonly name: string) {}

  get requiredBytes() {
    if (!(this.objSize && this.metadataSize)) {
      throw new Error(`requiredBytes depends on objSize and metadataSize`);
    }
    return this.metadataSize + this.objSize;
  }

  /**
   * Feed a new buffer into ObjReader
   *
   * @param {Buffer} chunk a chunk emitted from stdout of `git cat-file --batch` object
   * @returns {boolean} whether reading is complete
   */
  feed(chunk: Buffer): boolean {
    if (chunk.byteLength === 1 && chunk[0] === 10) {
      return false;
    }
    this.chunks.push(chunk);
    this.currentProgress += chunk.length;

    if (this.chunks.length === 1) {
      this.readMetaData(chunk);
    }

    return this.currentProgress >= this.requiredBytes;
  }

  getObj(): Obj.ObjectData {
    if (this.objType === Obj.ObjType.Commit || this.objType === Obj.ObjType.ATag) {
      return {
        type: this.objType,
        sha1: this.objFullname,
        data: this.mergeBuffer(),
      };
    }

    return {
      type: this.objType,
      sha1: this.objFullname,
      data: this.mergeBuffer(), // Buffer.from(`buffer of ${this.objSize} bytes`),
    };
  }

  /**
   * Get whole raw-object as a buffer
   *
   * (You should only call this after feed() returns true)
   *
   * @returns {Buffer}
   *
   * @memberOf ObjReader
   */
  private mergeBuffer(): Buffer {
    // Concatenate all buffers and remove metadata
    const allBuffer = Buffer.concat(this.chunks, this.currentProgress);
    return allBuffer.slice(this.metadataSize, this.metadataSize + this.objSize);
  }

  // Read metadata (obj type / size) from first buffer
  private readMetaData(firstChunk: Buffer) {
    const maybeMetadata = chunkToLines(firstChunk);
    // treat first non-empty line as metadata: sometimes git outputs 1 empty line before metadata for seemingly no reason
    const metadataLine = maybeMetadata.find(l => !!l);
    if (!metadataLine) {
      throw new GitRepoException(
        `metadata not found: ${JSON.stringify(firstChunk)} / ${JSON.stringify(chunkToLines(firstChunk))}`,
      );
    } else if (PATTERNS.rawObject.missing.exec(metadataLine)) {
      throw new GitRepoException(`object ${JSON.stringify(this.name)} is missing`);
    }

    // FIXME: maybe we should check whether sha1/name is ambiguous (may happen in huge repo)

    const matched = PATTERNS.rawObject.metadata.exec(metadataLine);
    if (!matched) {
      throw new GitRepoException(`metadata not recognized: ${JSON.stringify(metadataLine)}`);
    }

    this.metadataSize = metadataLine.length + 1 + maybeMetadata.indexOf(metadataLine);
    //                                      ^+1 for the \n of metadata line
    //                                            ^+indexOf() for empty lines before actual metadata

    this.objSize = parseInt(matched[3], 10);
    this.objFullname = matched[1];
    this.objType = ObjTypeMappings[matched[2] as keyof typeof ObjTypeMappings];
    if (!this.objType) {
      throw new GitRepoException(`object type not recognized: '${matched[2]}'`);
    }
  }
}
