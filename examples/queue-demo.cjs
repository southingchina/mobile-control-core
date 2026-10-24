const {Controller}=require('../core.cjs');
const events=[];
const adapter={id:'demo-device',info:async()=>({id:'demo-device',online:true}),execute:async(tool,args)=>{events.push(tool);return {tool,synthetic:true};}};
(async()=>{const c=new Controller([adapter]);const r=await c.call('mobile_batch_commands',{device:adapter.id,steps:[{name:'mobile_observe_screen',arguments:{}},{name:'mobile_get_orientation',arguments:{}}]});console.log(JSON.stringify({events,result:r},null,2));})();
