(function () {
  'use strict';
  var activeKey='mcfort9669.error.active.v1';
  var lastKey='mcfort9669.error.last.v1';
  var ua=navigator.userAgent.match(/PlayStation 4[ \/]([0-9.]+)/i);
  var fw=ua?ua[1]:'не определена';
  var path=location.pathname;
  var module=path.indexOf('/rawgame4/')!==-1?'RawGame4 '+(path.indexOf('poops')!==-1?'Poops':'Lapse'):
    path.indexOf('/webkitty/')!==-1?'WebKitty':
    path.indexOf('/afterglow/')!==-1?'Afterglow':'MCFORT9669';
  var current=null, ended=false, latestLine='', diagnostic='', scheduled=false;
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}}
  function remove(key){try{localStorage.removeItem(key);}catch(e){}}
  function clean(value){return String(value==null?'':value).replace(/[\x00-\x1f\x7f]/g,' ').slice(0,320);}
  function show(){/* Module logs and host journal show errors without a blocking dialog. */}
  function writeActive(){if(current)save(activeKey,current);}
  function start(name){
    ended=false;
    var previous=read(lastKey);if(previous&&previous.seen===false){previous.seen=true;save(lastKey,previous);}
    current={fw:fw,module:name||module,stage:'Запуск модуля',message:'',detail:'',time:new Date().toLocaleString('ru-RU')};
    latestLine='';diagnostic='';writeActive();
  }
  function stage(value){
    if(!current||!value)return;
    value=clean(value);
    if(current.stage===value)return;
    current.stage=value;writeActive();
  }
  function onLog(value,color){
    var line=clean(value);if(!line)return;
    latestLine=line;
    if(current && /^(?:stage|step)\b/i.test(line))stage(line);
    if(current&&(color==='red'||/^(?:Error:|FAILED\b|THREW\b)/i.test(line)))fail(line);
  }
  function note(value){
    var line=clean(value);if(!line||!current)return;
    latestLine=line;
    if(/(?:STEP4D-FAILED|THREW|PROOF-FAIL|PAYLOAD-THREW|KPATCH-FETCH-THREW|PAYLOAD-FETCH-THREW|ERROR|MISSING)/i.test(line)){
      diagnostic=line;current.detail=line;writeActive();
    }
  }
  function fail(message,detail){
    if(ended)return;
    if(!current)start(module);
    current.message=clean(message)||'Ошибка без подробностей';
    current.detail=clean(diagnostic||detail||latestLine);
    current.time=new Date().toLocaleString('ru-RU');
    current.seen=false;save(lastKey,current);remove(activeKey);show(current,false);
    current=null;ended=true;
  }
  function success(){current=null;ended=true;remove(activeKey);remove(lastKey);}
  function restore(){
    // A prior WebKitty run may have succeeded without acknowledging an old
    // interrupted record. Never block the next visit with that stale record.
    remove(activeKey);remove(lastKey);
  }
  function scan(){
    scheduled=false;
    if(!current)return;
    var state=document.getElementById('state');
    var msg=document.getElementById('msg');
    var out=document.getElementById('out')||document.getElementById('console');
    var value=state&&clean(state.textContent);
    if(value)stage(value);
    if(out){
      var line=out.lastElementChild;
      if(line){
        latestLine=clean(line.textContent);
        if(module==='WebKitty'&&line.style&&line.style.color==='red'){fail(latestLine);return;}
      }
    }
    if(module.indexOf('RawGame4')===0){
      if(value==='ALL DONE'){success();return;}
      if(/REPAIRED -- tearing down/i.test(value))return;
      if(/^no win in \d+ attempts/i.test(value)){
        fail('Цепочка Lapse не сработала в этом запуске: '+value,latestLine);return;
      }
      if(/^(?:REBOOT THE CONSOLE|FREED BUT NOT RECLAIMED|ROOT .* NO REBOOT|REPAIRED -- NO REBOOT)/i.test(value)){
        fail('GoldHEN не запущен: '+value,latestLine);return;
      }
    }
    if(state&&/\b(?:bad|fail)\b/i.test(state.className||'')){fail(value||'Сбой модуля',latestLine);return;}
    if(document.body&&/\bfail\b/.test(document.body.className||'')&&module==='Afterglow'){
      fail(msg&&msg.textContent||value||'Ошибка Afterglow',latestLine);
    }
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(scan,120);}
  function watch(){
    if(!document.body||!window.MutationObserver)return;
    var observer=new MutationObserver(schedule);
    ['state','msg','out','console'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)observer.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
    });
    if(module==='Afterglow')observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  }
  window.hostErrorReport={start:start,stage:stage,note:note,onLog:onLog,fail:fail,success:success,restore:restore};
  window.addEventListener('error',function(e){if(current)fail(e.message||'Ошибка JavaScript');});
  window.addEventListener('unhandledrejection',function(e){if(current)fail(e.reason&&e.reason.message||e.reason||'Необработанная ошибка');});
  function boot(){
    watch();
    if(module==='RawGame4 Lapse'||module==='RawGame4 Poops'){
      var once='';try{once=sessionStorage.getItem('mcfort9669.route.once')||'';}catch(e){}
      if(once==='rawgame4/'+path.split('/').pop())start(module);
      else restore();
    }
    else if(module==='Afterglow'&&/afterglow=run/.test(location.search)&&document.referrer)start(module);
    else if(module==='WebKitty'){
      if(path.indexOf('/exploit.html')!==-1)start(module);
      else {restore();['ps-logo-container','exploitRun'].forEach(function(id){
        var el=document.getElementById(id);
        if(el)el.addEventListener('click',function(){start(module);});
      });}
    }
  }
  if(document.body)boot();
  else document.addEventListener('DOMContentLoaded',boot);
})();
