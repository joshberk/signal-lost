import { strict as assert } from 'node:assert';
import { readSavedSession, shouldApplySnapshot } from '../lib/game/client.ts';

// A poll may start after a commit but reach D1 first. Request order alone
// would allow this stale poll response to undo the displayed commitment.
const committed={code:'ABC234',revision:12,requestId:20};
assert.equal(shouldApplySnapshot(committed,{code:'ABC234',revision:11,requestId:21}),false);
// Conversely, the earlier request can finish a CAS retry after a newer poll.
assert.equal(shouldApplySnapshot(committed,{code:'ABC234',revision:13,requestId:19}),true);
assert.equal(shouldApplySnapshot(committed,{code:'ABC234',revision:12,requestId:19}),false);
assert.equal(shouldApplySnapshot(committed,{code:'DEF234',revision:0,requestId:22}),true);

assert.deepEqual(readSavedSession('{"code":"ABC234","token":"crew-token"}'),{code:'ABC234',token:'crew-token'});
for(const raw of [null,'{','null','{}','{"code":"ABC234"}','{"code":"ABC234","token":""}','{"code":234567,"token":"crew-token"}'])assert.equal(readSavedSession(raw),null);
console.log('Client regressions passed: out-of-order room revisions and malformed saved sessions.');
