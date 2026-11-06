// The normal WebKitty entry remains available. When opened from the MCFORT9669
// host on FW 11.00, it reports progress while the host keeps its own screen.
(function(){
  'use strict';
  var key='mcfort9669.integrated1100.v1';
  function active(){
    try{return window.parent!==window && sessionStorage.getItem(key)===(navigator.userAgent.match(/PlayStation 4[ \/]([\d.]+)/i)||[])[1] &&
      window.parent.location.origin===window.location.origin;}catch(e){return false;}
  }
  function send(stage,line){
    if(active()){window.parent.postMessage({type:'mcfort-webkitty-bridge',stage:stage,line:String(line||'').slice(0,300)},location.origin);if(stage==='success')try{sessionStorage.removeItem(key);}catch(e){}}
  }
  window.mcfortIntegratedBridge={active:active,send:send};
  function boot(){
    if(!active())return;
    var count=0;
    var timer=setInterval(function(){
      if(!active()){clearInterval(timer);return;}
      if(++count>120){clearInterval(timer);send('error','Не удалось подготовить модуль WebKitty. Откройте журнал.');return;}
      if(!window.applicationCache || window.applicationCache.status===window.applicationCache.UNCACHED)return;
      if(!window.user || !window.ui || !window.ps4Fw || typeof window.jailbreak!=='function')return;
      clearInterval(timer);
      send('ready','WebKitty готов · PS4 '+(window.ps4Fw||''));
      // WebKitty's own retry timer takes precedence after an interrupted run.
      if(window.autoJbInterval || (window.storage && storage.session.getBoolean('autoJbRetry',false))){
        send('retry','WebKitty повторит попытку после перезагрузки страницы.');return;
      }
      user.blockJailbreak=true;
      send('start','WebKitty запускается внутри общего интерфейса.');
      chooseHEN();
      jailbreak();
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
