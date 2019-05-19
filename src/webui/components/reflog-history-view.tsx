import * as React from 'react';
import * as lodash from 'lodash';
import { RefLog } from '../../git';
import { RefHistory } from '../../analyze/ref-state';

interface PreviewProps {
  refHistory: RefHistory[];
}

export class ReflogHistoryView extends React.Component<PreviewProps, {}> {
  sortedTimestamp(dumps: RefHistory[]) {
    const timestamps = lodash.flatten(dumps.map(d => d.reflog.map(f => f.at.utcSec)));

    return lodash.uniq(timestamps);
  }

  /**
   * A row shows all reflogs of one ref
   */
  reflogRow(refpath: string, timestamps: number[], reflogs: RefLog[]): React.ReactNode {
    const cells: JSX.Element[] = [];

    if (!reflogs.length) {
      return (
        <div className="reflog-row">
          <p>refpath = {refpath} (no reflogs)</p>
        </div>
      );
    }

    return (
      <div className="reflog-row">
        <p>refpath = {refpath}</p>
        {timestamps.map(t => this.reflogCell(t, reflogs))}
        <p>refpath = {refpath}</p>
      </div>
    );
  }

  /**
   * A cell is identified by (refpath && timestamp), may contain multiple reflog items.
   */
  reflogCell(timestamp: number, reflogs: RefLog[]) {
    const selected = reflogs.filter(r => r.at.utcSec === timestamp);
    return <div className="reflog-cell">{selected.map(this.reflogItem)}</div>;
  }

  reflogItem(reflog: RefLog) {
    return (
      <div className="reflog-item">
        <p className="reflog-time">{new Date(reflog.at.utcSec * 1e3).toISOString()}</p>
        <p className="reflog-time">{JSON.stringify(reflog.at)}</p>
        <p className="reflog-sha1">{reflog.from.slice(0, 6)}</p>↓<p className="reflog-sha1">{reflog.to.slice(0, 6)}</p>
        <p className="reflog-message">{reflog.desc}</p>
      </div>
    );
  }

  render() {
    const { props } = this;
    const timestamps = this.sortedTimestamp(props.refHistory);

    return (
      <div className="reflog-preview">
        {props.refHistory.filter(r => r.reflog.length).map(dump => this.reflogRow(dump.path, timestamps, dump.reflog))}
      </div>
    );
  }
}
