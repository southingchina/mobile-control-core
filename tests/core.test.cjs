const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Controller}=require('../core.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function adapter(id,fn=async()=>id,online=true){return {id,info:async()=>({id,online,capabilities:['observe']}),execute:fn};}
test('local and remote calls serialize the entire operation on one device',async()=>{
 let active=0,max=0;const log=[];
 const a=adapter('a',async(t,args)=>{max=Math.max(max,++active);log.push(args.source);await delay(15);active--;return t;});
 const c=new Controller([a]);await Promise.all([c.call('tap',{device:'a',source:'cli'}),c.call('observe',{device:'a',source:'mcp'})]);
 assert.equal(max,1);assert.deepEqual(log,['cli','mcp']);
});
test('different devices do not block each other',async()=>{
 let active=0,max=0;const fn=async()=>{max=Math.max(max,++active);await delay(10);active--;};
 const c=new Controller([adapter('a',fn),adapter('b',fn)]);await Promise.all([c.call('tap',{device:'a'}),c.call('tap',{device:'b'})]);assert.equal(max,2);
});
test('cancelled queued action is never dispatched',async()=>{
 let calls=0;const c=new Controller([adapter('a',async()=>{calls++;await delay(20);})]);const abort=new AbortController();
 const p=c.call('tap',{device:'a'});const cancelled=c.call('tap',{device:'a'},abort.signal);abort.abort();
 await assert.rejects(cancelled,{code:'call_cancelled'});await p;assert.equal(calls,1);
});
test('failure does not poison queue and is never automatically retried',async()=>{
 let n=0;const c=new Controller([adapter('a',async()=>{if(++n===1)throw new Error('uncertain');return n;})]);
 await assert.rejects(c.call('tap',{device:'a'}));assert.equal(await c.call('observe',{device:'a'}),2);
});
test('offline iPhone remains known and unavailable',async()=>{
 const c=new Controller([adapter('a'),adapter('iphone',undefined,false)]);const r=await c.list();
 assert.deepEqual(r.devices.map(x=>x.id),['a']);assert.equal(r.known_devices.find(x=>x.id==='iphone').online,false);
});
test('device must be explicitly selected; no first-device fallback',async()=>{
 const c=new Controller([adapter('a')]);await assert.rejects(c.call('tap',{}),{code:'unknown_device'});await assert.rejects(c.call('tap',{device:'other'}),{code:'unknown_device'});
});
test('batch holds one queue slot and stops at incomplete input',async()=>{
 const log=[];const c=new Controller([adapter('a',async tool=>{log.push(tool);await delay(5);return tool==='type'?{input_complete:false}:{ok:true};})]);
 const p=c.call('mobile_batch_commands',{device:'a',steps:[{name:'tap',arguments:{}},{name:'type',arguments:{}},{name:'must-not-run',arguments:{}}]});
 await Promise.all([p,c.call('after',{device:'a'})]);assert.deepEqual(log,['tap','type','after']);
});
test('cross-device or nested batch rejected before any dispatch',async()=>{
 let n=0;const c=new Controller([adapter('a',async()=>n++)]);
 await assert.rejects(c.call('mobile_batch_commands',{device:'a',steps:[{name:'tap',arguments:{device:'other'}}]}),{code:'invalid_batch'});
 await assert.rejects(c.call('mobile_batch_commands',{device:'a',steps:[{name:'mobile_batch_commands',arguments:{}}]}),{code:'invalid_batch'});assert.equal(n,0);
});
test('batch stops on uncertainty even with stopOnError=false',async()=>{
 const log=[],c=new Controller([adapter('a',async t=>{log.push(t);if(t==='write')throw Object.assign(new Error('unknown outcome'),{code:'action_uncertain'});})]);
 await c.call('mobile_batch_commands',{device:'a',stopOnError:false,listElementsAtEnd:true,steps:[{name:'write',arguments:{}},{name:'must-not-run',arguments:{}}]});assert.deepEqual(log,['write']);
});
test('batch does not observe away an incomplete input continuation',async()=>{
 const log=[],c=new Controller([adapter('a',async t=>{log.push(t);return {input_complete:false,continue_token:'valid'};})]);
 const r=await c.call('mobile_batch_commands',{device:'a',listElementsAtEnd:true,steps:[{name:'type',arguments:{}}]});assert.deepEqual(log,['type']);assert.equal(r.steps[0].result.continue_token,'valid');
});
