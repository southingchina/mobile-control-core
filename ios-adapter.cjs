const {FusionController,FusionError}=require('./wda-fusion.cjs');
class IosAdapter {
 constructor(){this.id='windows-usb-iphone';this.fusion=new FusionController({request:async(method,route,body,limits={})=>{
  const response=await fetch('http://127.0.0.1:8200'+route,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:limits.signal?AbortSignal.any([limits.signal,AbortSignal.timeout(limits.timeoutMs||30000)]):AbortSignal.timeout(limits.timeoutMs||30000)});
  const value=await response.json();if(!response.ok&&!value.value?.error)throw new FusionError('http_error','WDA HTTP '+response.status);return value;
 }});}
 async info(){let online=false;try{const r=await fetch('http://127.0.0.1:8200/status',{signal:AbortSignal.timeout(1500)});online=r.ok&&(await r.json()).value?.ready===true;}catch{}if(!online)this.fusion.reset();return {id:this.id,name:'iPhone via Windows USB WDA',platform:'ios',online,status:online?'online':'offline',capabilities:['observe','screenshot','selector','tap','swipe','input','apps','orientation'],acceptance:'iPhone fusion adapter real-device regression pending phone return'};}
 async execute(tool,a,signal){
  const f=this.fusion;f.signal=signal;f.deadline=Date.now()+40000;
  try{
   const state=await this.info();
   if(tool==='mobile_control_status')return {device:state,metrics:f.counts,session_active:!!f.sid};
   if(!state.online)throw new FusionError('device_offline','iPhone WDA is offline. Connect and unlock the phone, then start the existing WDA service.');
   if(!['mobile_type_keys','mobile_type_text_guarded','mobile_control_metrics'].includes(tool))f.pending=null;
   if(['mobile_control_status','mobile_control_metrics'].includes(tool))return {device:await this.info(),metrics:f.counts,session_active:!!f.sid};
   if(['mobile_observe_screen','mobile_list_elements_on_screen'].includes(tool))return await f.observe(a.max_nodes||200);
   if(tool==='mobile_find_elements')return await f.find(a.selector);
   if(tool==='mobile_tap_element')return await f.tap(a.selector);
   if(tool==='mobile_get_screen_size')return await f.geometry(true);
   if(['mobile_take_screenshot','mobile_save_screenshot'].includes(tool))return {content:[{type:'text',text:JSON.stringify(await f.geometry(true))},{type:'image',mimeType:'image/png',data:await f.screenshot()}]};
   if(tool==='mobile_get_foreground_app')return await f.raw('GET','/wda/activeAppInfo');
   if(['mobile_type_keys','mobile_type_text_guarded'].includes(tool))return await f.typeText(a);
   if(['mobile_launch_app','mobile_terminate_app'].includes(tool))return await f.session('POST',tool==='mobile_launch_app'?'/wda/apps/launch':'/wda/apps/terminate',{bundleId:a.packageName},false);
   if(tool==='mobile_list_apps')return await f.session('GET','/wda/apps/list');
   if(tool==='mobile_press_button'){
    if(a.button==='ENTER')return await f.session('POST','/wda/keys',{value:['\n']},false);
    const name={HOME:'home',VOLUME_UP:'volumeup',VOLUME_DOWN:'volumedown',LOCK:'lock'}[a.button];if(!name)throw new FusionError('unsupported_button','Unsupported iPhone button');return await f.session('POST','/wda/pressButton',{name},false);
   }
   if(['mobile_click_on_screen_at_coordinates','mobile_double_tap_on_screen','mobile_long_press_on_screen_at_coordinates'].includes(tool)){
    if(a.ref)throw new FusionError('unsupported_reference','Use selectors on iPhone; Android snapshot refs do not apply.');
    const g=await f.geometry(true);if(!(a.x>=0&&a.y>=0&&a.x<g.width&&a.y<g.height))throw new FusionError('offscreen_target','iPhone coordinates must be WDA points in current viewport.');
    const route=tool==='mobile_double_tap_on_screen'?'/wda/doubleTap':tool==='mobile_long_press_on_screen_at_coordinates'?'/wda/touchAndHold':'/wda/tap/0';
    return await f.session('POST',route,{x:a.x,y:a.y,...(tool.includes('long_press')?{duration:(a.duration||500)/1000}:{})},false);
   }
   if(tool==='mobile_swipe_on_screen'){
    const g=await f.geometry(true),x=a.x??g.width/2,y=a.y??g.height/2,d=a.distance||Math.min(g.width,g.height)*.3,delta={up:[0,-d],down:[0,d],left:[-d,0],right:[d,0]}[a.direction];
    if(!delta)throw new FusionError('invalid_argument','Invalid swipe direction');return await f.session('POST','/wda/dragfromtoforduration',{fromX:x,fromY:y,toX:Math.max(1,Math.min(g.width-1,x+delta[0])),toY:Math.max(1,Math.min(g.height-1,y+delta[1])),duration:.4},false);
   }
   if(tool==='mobile_get_orientation')return await f.session('GET','/orientation');
   if(tool==='mobile_set_orientation'){f.viewport=null;return await f.session('POST','/orientation',{orientation:{portrait:'PORTRAIT',landscape:'LANDSCAPE'}[a.orientation]},false);}
   if(tool==='mobile_open_url'){
    if(!/^https?:\/\//i.test(a.url))throw new FusionError('unsafe_url','Only HTTP(S) URLs supported');return await f.session('POST','/url',{url:a.url},false);
   }
   throw new FusionError('unsupported_capability',tool+' is not available through this WDA adapter; Android Root/files do not apply.');
  }finally{f.signal=null;f.deadline=null;}
 }
}
module.exports={IosAdapter};
