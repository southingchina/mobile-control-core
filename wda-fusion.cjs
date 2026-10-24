// Independent implementation inspired by iPhone Use's documented design.
// No dependency on its macOS setup, transport or runtime.
const crypto=require('node:crypto');
const ELEMENT='element-6066-11e4-a52e-4f735466cecf';
class FusionError extends Error {
  constructor(code,message,details={}){super(message);this.code=code;this.details=details;}
}
class SerialQueue {
  constructor(){this.tail=Promise.resolve();}
  run(fn){const result=this.tail.then(fn);this.tail=result.catch(()=>{});return result;}
}
class FusionController {
  constructor({request,maxChunks=3}){
    this.transport=request;this.maxChunks=maxChunks;this.sid=null;this.viewport=null;
    this.pending=null;this.counts={requests:0,sessions:0,read_retries:0,uncertain_actions:0};
  }
  reset(){this.sid=null;this.viewport=null;this.pending=null;}
  async raw(method,path,body,read=method==='GET'){
    for(let attempt=0;attempt<(read?2:1);attempt++){
      if(this.signal?.aborted)throw new FusionError('call_cancelled','Caller cancelled; no further requests will be sent.',{replay_action:false});
      const remaining=this.deadline?this.deadline-Date.now():30000;
      if(remaining<=0)throw new FusionError('call_budget','Tool time budget exhausted; no further requests will be sent.',{replay_action:false});
      try {
        this.counts.requests++;
        const response=await this.transport(method,path,body,{timeoutMs:Math.min(30000,remaining),signal:this.signal});
        if(response?.value?.error)throw new FusionError(response.value.error,response.value.message||response.value.error);
        return response?.value;
      } catch(error){
        if(error instanceof FusionError)throw error;
        if(read&&attempt===0){this.counts.read_retries++;continue;}
        if(!read){this.pending=null;this.counts.uncertain_actions++;
          throw new FusionError('action_uncertain','Request may have completed. Observe before taking further action.',{replay_action:false});}
        throw new FusionError('transport_error','Cannot read WDA; no phone action was replayed.');
      }
    }
  }
  async ensureSession(){
    if(!this.sid){
      const value=await this.raw('POST','/session',{capabilities:{alwaysMatch:{platformName:'iOS',shouldWaitForQuiescence:false,shouldTerminateApp:false}}},false);
      if(!value?.sessionId)throw new FusionError('invalid_response','WDA did not supply a session ID.');
      this.sid=value.sessionId;this.counts.sessions++;
    }
    return this.sid;
  }
  async session(method,path,body,read=method==='GET'){
    for(let attempt=0;attempt<2;attempt++){
      const sid=await this.ensureSession();
      try{return await this.raw(method,`/session/${sid}${path}`,body,read);}
      catch(error){
        if(error.code==='invalid session id'){
          this.reset();
          // Element IDs and writes cannot be carried into a new session.
          if(read&&attempt===0&&!path.includes('/element/'))continue;
        }
        throw error;
      }
    }
  }
  async geometry(refresh=false){
    if(!this.viewport||refresh){
      const size=await this.session('GET','/window/size');
      const metrics=await this.session('GET','/wda/screen');
      if(!(size?.width>0&&size?.height>0))throw new FusionError('invalid_viewport','WDA screen size is unavailable.');
      this.viewport={width:size.width,height:size.height,units:'points',scale:metrics?.scale||1,pixel_to_point:1/(metrics?.scale||1)};
    }
    return this.viewport;
  }
  async screenshot(){return this.raw('GET','/screenshot');}
  async observe(maxNodes=200){
    if(!Number.isInteger(maxNodes)||maxNodes<1||maxNodes>500)throw new FusionError('invalid_argument','max_nodes must be 1..500');
    const viewport=await this.geometry(true),tree=await this.session('GET','/source?format=json');
    if(!tree||typeof tree!=='object')throw new FusionError('invalid_source','WDA did not return a JSON accessibility tree.');
    const nodes=[];let total=0,visited=0;
    const stack=[tree];
    while(stack.length&&visited<20000){
      const node=stack.pop();visited++;
      for(const child of [...(node.children||[])].reverse())stack.push(child);
      const type=String(node.type||'').replace(/^XCUIElementType/,'');
      if(['Application','Window','Other',''].includes(type))continue;
      const visible=node.isVisible??node.visible;
      if(visible===false||visible==='0'||visible==='false')continue;
      const r=node.rect;
      if(!r||r.width<=0||r.height<=0||r.x+r.width<=0||r.y+r.height<=0||r.x>=viewport.width||r.y>=viewport.height)continue;
      total++;
      if(nodes.length>=maxNodes)continue;
      const compact={type,rect:[r.x,r.y,r.width,r.height]};
      if(node.label)compact.label=node.label;
      if(node.name&&node.name!==node.label)compact.name=node.name;
      if(node.value!=null&&node.value!==node.label&&node.value!==node.name)compact.value=node.value;
      if(node.enabled===false||node.enabled==='false'||node.enabled==='0')compact.enabled=false;
      nodes.push(compact);
    }
    return {nodes,viewport,total_nodes:total,truncated:total>nodes.length||stack.length>0,coverage:stack.length?'scan_limit':'visible_nodes_in_current_viewport'};
  }
  predicate(selector){
    const allowed=new Set(['label','name','type','label_contains']);
    if(!selector||!Object.keys(selector).length||Object.keys(selector).some(k=>!allowed.has(k)))throw new FusionError('invalid_selector','Use label, label_contains, name and/or type.');
    return Object.entries(selector).map(([field,value])=>{
      if(typeof value!=='string'||!value.length||value.length>1000||/[\x00-\x1f]/.test(value))throw new FusionError('invalid_selector','Selector values must be nonempty text without control characters.');
      if(field==='type'&&!value.startsWith('XCUIElementType'))value='XCUIElementType'+value;
      const escaped=value.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return `${field==='label_contains'?'label':field} ${field==='label_contains'?'CONTAINS':'=='} '${escaped}'`;
    }).join(' AND ');
  }
  async find(selector){
    const matches=await this.session('POST','/elements',{using:'predicate string',value:this.predicate(selector)},true);
    if(!Array.isArray(matches))throw new FusionError('invalid_response','WDA did not return element matches.');
    const candidates=[];
    for(const match of matches.slice(0,30)){
      const id=match[ELEMENT]||match.ELEMENT;
      if(!id)continue;
      const rect=await this.session('GET',`/element/${encodeURIComponent(id)}/rect`);
      candidates.push({id,rect});
    }
    return {candidates,total_matches:matches.length,truncated:matches.length>30};
  }
  async visualError(code,message,details={}){
    try{details.screenshot=await this.screenshot();}catch{details.screenshot_unavailable=true;}
    throw new FusionError(code,message,{...details,action_executed:false,next_step:'Inspect screenshot and use a fresh point-coordinate action.'});
  }
  async tap(selector){
    const found=await this.find(selector);
    if(found.total_matches!==1)return this.visualError(found.total_matches?'ambiguous_target':'no_such_element','Selector must match exactly one visible target.',found);
    const target=found.candidates[0],v=await this.geometry(true),r=target?.rect;
    if(!r||r.width<=0||r.height<=0||r.x<0||r.y<0||r.x+r.width>v.width||r.y+r.height>v.height)return this.visualError('offscreen_target','Target is not inside the current viewport.',found);
    const base=`/element/${encodeURIComponent(target.id)}`;
    const visible=await this.session('GET',base+'/displayed'),enabled=await this.session('GET',base+'/enabled');
    if(visible!==true||enabled!==true)return this.visualError('target_not_interactable','Target is not enabled and visible.',found);
    this.pending=null;
    await this.session('POST',base+'/click',{},false);
    return {action:'tap',executed:true,verification:'not_requested',target};
  }
  async focusContext(){
    const app=(await this.raw('GET','/wda/activeAppInfo'))?.bundleId;
    const active=await this.session('GET','/element/active');
    const id=active?.[ELEMENT]||active?.ELEMENT;
    if(!app||!id)throw new FusionError('no_focused_field','Cannot establish app and focused element.');
    const type=await this.session('GET',`/element/${encodeURIComponent(id)}/attribute/type`);
    if(!['XCUIElementTypeTextField','XCUIElementTypeTextView','XCUIElementTypeSearchField'].includes(type))throw new FusionError('not_editable','Focused control is not a supported nonsecure input.');
    return {app,id,sid:this.sid};
  }
  async typeText({text,continue_token,submit,allow_newlines}={}){
    let state;
    if(continue_token){
      state=this.pending;
      if(text!==undefined||submit!==undefined||allow_newlines!==undefined||!state||state.token!==continue_token||Date.now()>state.expires){this.pending=null;throw new FusionError('invalid_continuation','Continuation is missing, expired or incompatible.');}
    } else {
      if(typeof text!=='string'||!text.length||[...text].length>10000)throw new FusionError('invalid_argument','Provide 1..10000 Unicode characters.');
      if(/[\r\n]/.test(text)&&allow_newlines!==true)throw new FusionError('explicit_newline_required','Newlines may submit a form. Pass allow_newlines=true only for an intended multiline input.');
      state={context:await this.focusContext(),characters:[...text],completed:0,submit:submit===true,token:crypto.randomBytes(24).toString('hex'),expires:Date.now()+600000};
      this.pending=state;
    }
    for(let i=0;i<this.maxChunks&&state.completed<state.characters.length;i++){
      let current;
      try{current=await this.focusContext();}
      catch(error){this.pending=null;error.details={...error.details,completed:state.completed,continuation_invalidated:true};throw error;}
      if(current.app!==state.context.app||current.id!==state.context.id||current.sid!==state.context.sid){this.pending=null;throw new FusionError('input_context_changed','App, focused field or WDA session changed. Input stopped.',{completed:state.completed});}
      const piece=state.characters.slice(state.completed,state.completed+200).join('');
      try{await this.session('POST','/wda/keys',{value:[piece]},false);}
      catch(error){this.pending=null;error.details={...error.details,completed:state.completed,continuation_invalidated:true};throw error;}
      state.completed += [...piece].length;
    }
    const complete=state.completed===state.characters.length;
    this.pending=complete?null:state;
    if(complete&&state.submit){
      const current=await this.focusContext();
      if(current.app!==state.context.app||current.id!==state.context.id||current.sid!==state.context.sid)throw new FusionError('input_context_changed','Input complete, but submission stopped because focus changed.',{completed:state.completed,submitted:false});
      await this.session('POST','/wda/keys',{value:['\n']},false);
    }
    return {completed:state.completed,total:state.characters.length,input_complete:complete,submitted:complete&&state.submit,...(!complete?{continue_token:state.token}:{})};
  }
}
module.exports={FusionController,FusionError,SerialQueue};
