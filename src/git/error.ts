/**
 * Error when handling git repo
 */
export class GitRepoException extends Error {}

const typeTag = '##__GitRepoError';

export interface GitRepoError {
  typeTag: typeof typeTag;
  messages: string[];
}

export function isGitRepoError(v: any): v is GitRepoError {
  return v && v.typeTag === typeTag;
}
