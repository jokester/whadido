import React, { useState } from 'react';
import { buildState, countReflog, RefHistory, unbuildState } from '../../analyze/ref-state';
import { Operation } from '../../analyze/operations';
import { topParser } from '../../analyze';
import { ReflogHistoryView } from './reflog-history-view';

export interface WhadidoDump {
  input: {
    refHistory: RefHistory[];
    reflogCount: number;
  };

  outputs: {
    operations: Operation[];
    rest: RefHistory[];
    remainedReflogCount: number;
  }[];
}

function analyzeForWeb(refHistory: RefHistory[]): WhadidoDump {
  const initState = buildState(refHistory);
  const results = topParser(initState);
  const input = {
    refHistory,
    reflogCount: countReflog(initState),
  };
  const outputs = results.map(result => ({
    operations: result.output,
    rest: unbuildState(refHistory, result.rest),
    remainedReflogCount: countReflog(result.rest),
  }));
  return { input, outputs };
}

export const ReflogPreview: React.FunctionComponent<{ history: RefHistory[] }> = props => {
  const [dump] = useState<WhadidoDump>(() => analyzeForWeb(props.history));

  console.log('whadido-dump', dump);

  const [historyIndex, setHistoryIndex] = useState(-1);

  const history = historyIndex < 0 ? dump.input.refHistory : dump.outputs[historyIndex].rest;

  return (
    <>
      <div className="history-selector">
        <button key={-1} onClick={() => setHistoryIndex(-1)}>
          input: {dump.input.reflogCount} reflogs
        </button>

        {dump.outputs.map((output, i) => (
          <button key={i} onClick={() => setHistoryIndex(i)}>
            output#{i}: {output.remainedReflogCount} reflogs
          </button>
        ))}
      </div>
      <div className="history-view">
        <ReflogHistoryView refHistory={history} />
      </div>
    </>
  );
};
