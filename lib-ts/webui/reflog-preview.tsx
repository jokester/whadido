import * as preact from 'preact';

import {
    GitRepo, ResolvedRef,
    Ref, Obj, Human, Timestamp, RefLog,
} from "../git";

import { RefDump } from '../analyze';

interface PreviewProps {
    reflogDump: RefDump;
}

export class ReflogPreview extends preact.Component<PreviewProps, {}> {

    render() {
        return <p>{this.props.reflogDump}</p>;
    }
}
