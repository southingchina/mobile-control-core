class ControlError extends Error {constructor(code,message){super(message);this.code=code;}}
class Controller {
 constructor(adapters){this.adapters=new Map(adapters.map(a=>[a.id,a]));this.queues=new Map();this.calls=0;}
 async list(){const known_devices=await Promise.all([...this.adapters.values()].map(async a=>{try{return await a.info();}catch{return {id:a.id,online:false,status:'offline'};}}));return {devices:known_devices.filter(d=>d.online),known_devices};}
 async call(tool,args={},signal){
  if(tool==='mobile_list_available_devices')return this.list();
  const adapter=this.adapters.get(args.device);if(!adapter)throw new ControlError('unknown_device','Select an explicit id from mobile_list_available_devices.');
  const previous=this.queues.get(adapter.id)||Promise.resolve();
  const result=previous.then(async()=>{
   if(signal?.aborted)throw new ControlError('call_cancelled','Cancelled before execution; no action sent.');this.calls++;
   if(tool!=='mobile_batch_commands')return adapter.execute(tool,args,signal);
   if(!Array.isArray(args.steps)||args.steps.length<1||args.steps.length>50)throw new ControlError('invalid_batch','Use 1..50 steps');
   for(const s of args.steps)if(s.name==='mobile_batch_commands'||s.arguments?.device&&s.arguments.device!==args.device)throw new ControlError('invalid_batch','Nested batches and cross-device steps are not allowed');
   const results=[];let safetyHalt=false;
   for(const s of args.steps){if(signal?.aborted)throw new ControlError('call_cancelled','Cancelled before next step');try{const output=await adapter.execute(s.name,{...s.arguments,device:args.device},signal);results.push({tool:s.name,result:output});if(output?.input_complete===false){safetyHalt=true;break;}}catch(e){results.push({tool:s.name,error:e.code||'operation_failed',message:e.message});if(/uncertain|unverified|cancel|budget|focus|input_continues/.test(e.code||'')){safetyHalt=true;break;}if(args.stopOnError!==false)break;}}
   if(args.listElementsAtEnd&&!safetyHalt&&!signal?.aborted)results.push({tool:'mobile_list_elements_on_screen',result:await adapter.execute('mobile_list_elements_on_screen',{device:args.device},signal)});
   return {steps:results};
  });
  const tail=result.catch(()=>{});this.queues.set(adapter.id,tail);tail.finally(()=>{if(this.queues.get(adapter.id)===tail)this.queues.delete(adapter.id);});return result;
 }
}
module.exports={Controller,ControlError};
