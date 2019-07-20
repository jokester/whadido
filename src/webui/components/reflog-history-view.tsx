import React from 'react';
import { RefLog, Timestamp } from '../../git';
import { RefHistory } from '../../analyze/ref-state';
import { mergeOrderedSequence } from '../../util/merge-ordered-sequence';
import { TotalOrdered } from '../../vendor/ts-commonutil/algebra/total-ordered';

interface PreviewProps {
  refHistory: RefHistory[];
}

const chronologicalOrder = new (class extends TotalOrdered<Timestamp> {
  before(a: Timestamp, b: Timestamp): boolean {
    return a.utcSec < b.utcSec;
  }

  equal(a: Timestamp, b: Timestamp): boolean {
    return a.utcSec === b.utcSec;
  }
})();

interface FoldedCell {
  timestamps: Timestamp[];
  reflogCells: /* [refIndex][timestampIndex] */ RefLog[][][];
}

function foldCell(dumps: RefHistory[]): FoldedCell {
  const refPaths = dumps.map(h => h.path);

  const reflogTimestamps: Timestamp[][] = dumps.map(d => d.reflog.map(reflog => reflog.at));

  const timestamps = mergeOrderedSequence(reflogTimestamps, chronologicalOrder);

  const reflogCells: RefLog[][][] = dumps.map(ref => {
    let timestampIndex = 0;
    const cells: RefLog[][] = [];
    for (const [reflogOrigIndex, reflog] of ref.reflog.entries()) {
      while (!chronologicalOrder.equal(reflog.at, timestamps[timestampIndex])) {
        ++timestampIndex;
      }

      cells[timestampIndex] = (cells[timestampIndex] || []).concat([reflog]);
    }
    return cells;
  });

  return {
    timestamps,
    reflogCells,
  };
}

export const ReflogHistoryView: React.FC<PreviewProps> = ({ refHistory }) => {
  const { timestamps, reflogCells } = foldCell(refHistory);

  console.log('ReflogHistoryView', refHistory, timestamps, reflogCells);

  const timestampIndexes = timestamps.map((_, i) => i);

  return (
    <table className="reflog-preview">
      <thead className="th-timestamp">
        <th>{/* empty at (0, 0) */} </th>
        {timestamps.map((timestamp, timestampIndex) => (
          <th className="td timestamp" key={timestampIndex}>
            <div>{new Date(timestamp.utcSec * 1e3).toISOString()}</div>
            <div>{JSON.stringify(timestamp)}</div>
          </th>
        ))}
      </thead>
      <tbody>
        {refHistory.map((ref, refIndex) => (
          <tr key={refIndex}>
            <th>{ref.path}</th>
            {timestampIndexes.map(timestampIndex => (
              <td className="reflog-cell" key={timestampIndex}>
                {(reflogCells[refIndex][timestampIndex] || []).map((reflog, reflogIndexInCell) => (
                  <div key={reflogIndexInCell} className="reflog-item">
                    <p className="reflog-time">{new Date(reflog.at.utcSec * 1e3).toISOString()}</p>
                    <p className="reflog-time">{JSON.stringify(reflog.at)}</p>
                    <p className="reflog-sha1">{reflog.from.slice(0, 6)}</p>↓
                    <p className="reflog-sha1">{reflog.to.slice(0, 6)}</p>
                    <p className="reflog-message">{reflog.desc}</p>
                  </div>
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
