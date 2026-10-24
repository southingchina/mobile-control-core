const {test}=require('node:test'),assert=require('node:assert/strict');
const {IosAdapter}=require('../ios-adapter.cjs');
test('iOS call retains cancellation through all awaited suboperations',async()=>{
 const a=new IosAdapter(),abort=new AbortController();a.info=async()=>({online:true});
 let release;const gate=new Promise(r=>release=r);
 a.fusion={observe:async()=>{await gate;return a.fusion.signal?.aborted;}};
 const p=a.execute('mobile_observe_screen',{},abort.signal);await new Promise(r=>setImmediate(r));
 assert.equal(a.fusion.signal,abort.signal);abort.abort();release();assert.equal(await p,true);assert.equal(a.fusion.signal,null);
});
