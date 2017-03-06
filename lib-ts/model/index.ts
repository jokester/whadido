import {
    GitRepo,
    Ref, Obj, Human, Timestamp, RefLog
} from '../git';

export class Analyzer {
    constructor(private repo: GitRepo) {

    }

    async analyze(): Promise<void> {

    }

    async readRef(): Promise<ReflogEntry[]> {
        return [];
    }
}

interface ReflogEntry {
    timestamp: number;
    refPath: string;
    fromSHA1: string;
    toSHA1: string;
}