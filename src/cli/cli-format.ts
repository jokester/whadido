import { Operation, OpType } from '../analyze/operations';
import { ReflogFormatter } from '../formatter/text-line-formatter';

export function cliFormat(operations: Operation[], sink: ReflogFormatter) {
  for (const o of operations) {
    if (o.type === OpType.checkout) {
      const { headLog } = o;
      sink.line(line => {
        line.timestamp(headLog.at).text('Checkouted: o');
      }); //a
    } else if (o.type === OpType.push) {
      const { refpath, branchLog } = o;
      sink.line(l => l.timestamp(branchLog.at));
    } else {
      sink.line(line => line.comment(`TODO: ${o.type}`));
      sink.debug(o);
    }
  }
}
