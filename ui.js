(function () {
  'use strict';
  var $=function(id){return document.getElementById(id);};
  var ua=navigator.userAgent.match(/PlayStation 4[ /]([\d.]+)/i);
  var demo=/(?:\?|&)demo=1(?:&|$)/.test(location.search)||/\/demo\.html$/.test(location.pathname)||!ua, cache=window.applicationCache;
  var demoParams=new URLSearchParams(location.search), firmware=demo?(demoParams.get('fw')||'13.02'):(ua?ua[1]:null);
  var firmwareRoute=window.hostFirmware.route(firmware,demo?demoParams.get('module'):null),original=firmwareRoute==='original'||firmwareRoute==='afterglow';
  var lapse=firmwareRoute==='lapse',poops=firmwareRoute==='poops',legacy=firmwareRoute==='webkitty',integrated1100=legacy&&firmware==='11.00';
  var compatible=!!firmwareRoute, ready=false, started=false, finished=false, frame=null;
  var startTime=0, timer=null, warningTimer=null, autoTimer=null, received=0, logs=[], lastMessage='', payloadSeen=false, activeStep=0, reused=false;

  var statsKey='alizhon.ps4.'+firmware+'.stats.v1',stats={success:0,failure:0,interrupted:0,pending:null},storageOK=true,runId=null,counted=false;
  function number(v){return typeof v==='number'&&isFinite(v)&&v>=0?Math.min(999999,Math.floor(v)):0;}
  function showStats(){var completed=stats.success+stats.failure; $('successCount').textContent=String(stats.success);$('failureCount').textContent=String(stats.failure);$('interruptedCount').textContent=String(stats.interrupted);$('successRate').textContent=completed?String(Math.round(stats.success/completed*100))+'%':'—';$('rateDetail').textContent=completed?stats.success+' из '+completed+' завершённых':'Нет завершённых попыток';$('statsHint').textContent=demo?'Демо не меняет статистику':storageOK?'На этой PS4':'Сохранение недоступно'; }
  function saveStats(){try{window.localStorage.setItem(statsKey,JSON.stringify(stats));}catch(e){storageOK=false;}showStats();}
  function readStats(){if(demo){showStats();return;}try{var saved=JSON.parse(window.localStorage.getItem(statsKey)||'null');if(saved&&typeof saved==='object')stats={success:number(saved.success),failure:number(saved.failure),interrupted:number(saved.interrupted),pending:saved.pending&&typeof saved.pending.id==='string'?saved.pending:null};}catch(e){storageOK=false;}if(!demo&&compatible&&stats.pending){stats.interrupted=number(stats.interrupted+1);stats.pending=null;saveStats();}showStats();}
  function beginAttempt(){if(demo)return;runId=String(Date.now())+'-'+Math.random().toString(16).slice(2);counted=false;stats.pending={id:runId,at:Date.now()};saveStats();}
  function finishStats(result){if(demo||counted||!runId)return;counted=true;if(reused){if(stats.pending&&stats.pending.id===runId)stats.pending=null;saveStats();return;}if(result==='success')stats.success=number(stats.success+1);else stats.failure=number(stats.failure+1);if(stats.pending&&stats.pending.id===runId)stats.pending=null;saveStats();}
  function journal(open){if(open)window.hostPanels.close(false);$('journal').hidden=!open;window.hostJournal.render(logs,received);$('journalToggle').setAttribute('aria-expanded',open?'true':'false');if(open)$('journalClose').focus();else $('journalToggle').focus();}
  function status(title,description){$('statusTitle').textContent=title;$('statusDescription').textContent=description;}
  function signal(text){if(demo){$('hostSignal').hidden=true;document.body.classList.remove('signal-ready');return;}$('hostSignal').hidden=!text;document.body.classList.toggle('signal-ready',!!text);if(text)$('hostSignalText').textContent=text;}
  function autoEnabled(){return !!(window.hostPreferences&&window.hostPreferences.autoStartEnabled());}
  function readyDisplay(){
    var automatic=!demo&&autoEnabled();status('Готово к запуску',automatic?(integrated1100?'Автовзлом 11.00 начнётся здесь после готовности файлов.':legacy?'WebKitty начнёт запуск на этом экране после загрузки файлов.':'Автовзлом начнётся автоматически.'):firmware==='14.00'?'Нажмите «ВЗЛОМ» для запуска Afterglow.':integrated1100?'Нажмите «ВЗЛОМ». WebKitty выполнит запуск на этом экране.':legacy?'Нажмите «ВЗЛОМ». WebKitty работает внутри общего экрана.':!original?'Нажмите «ВЗЛОМ» для запуска модуля FW '+firmware+'.':'Нажмите кнопку «ВЗЛОМ».');
    signal((automatic?'АВТОВЗЛОМ':'ХОСТ ГОТОВ')+' · '+(demo?'ДЕМО':'FW '+firmware));
    $('launch').textContent=automatic?'АВТО':'ВЗЛОМ';$('buttonHint').textContent=automatic?'Автовзлом включён':!original?'Модуль прошивки '+firmware:'Нажмите кнопку один раз';
    if(demo){var moduleName=legacy?'WebKitty':lapse?'RawGame4 Lapse':poops?'RawGame4 Poops':firmwareRoute==='afterglow'?'Afterglow':'MCFORT9669',hen=window.hostFirmware.payload(firmware,demoParams.get('module'),true);status('FW '+firmware+' · '+moduleName,'Единый экран · '+hen.name+' '+hen.version+' · имитация без взлома');$('buttonHint').textContent='Посмотреть пример запуска';}
  }
  function scheduleAutoLaunch(){
    clearTimeout(autoTimer);autoTimer=null;
    if(demo||!autoEnabled()||!ready||started||finished||$('launch').disabled)return;
    autoTimer=setTimeout(function(){autoTimer=null;if(autoEnabled()&&ready&&!started&&!finished)launch();},0);
  }
  function notice(text,kind){$('notice').textContent=text;$('notice').className='notice show'+(kind?' '+kind:'');}
  function log(text,kind){if(!text||text===lastMessage)return;lastMessage=text;logs.push({text:text,kind:kind||''});if(logs.length>70)logs.shift();received++;window.hostJournal.render(logs,received);$('logCount').textContent=String(received);}
  function updateLaunchProgress(){var completed=0;for(var n=3;n<=5;n++)if($('step'+n).className==='done')completed++;var percent=Math.round(completed/3*100);$('launchProgressFill').style.width=percent+'%';$('launchProgressValue').textContent=percent+'%';$('launchMeter').setAttribute('aria-valuenow',String(percent));$('launchProgressLabel').textContent=finished?(document.body.classList.contains('error-state')?'Запуск остановлен':'Запуск завершён'):started?'Прогресс запуска':'Прогресс запуска';}
  function step(n,state){var el=$('step'+n);if(!el)return;el.className=state||'';el.querySelector('em').textContent=state==='done'?'Готово':state==='active'?'В работе':state==='failed'?'Ошибка':'Ожидание';if(state==='active')activeStep=n;updateLaunchProgress();}
  function progress(percent,text){$('cacheFill').style.width=Math.max(0,Math.min(100,percent))+'%';$('cachePercent').textContent=Math.round(percent)+'%';if(text)$('cacheText').textContent=text;}
  function stopAnimation(){document.body.classList.remove('running');clearInterval(timer);clearTimeout(warningTimer);}
  function fail(title,description){if(finished)return;finished=true;if(!demo&&legacy)try{sessionStorage.removeItem('mcfort9669.integrated1100.v1');}catch(e){};finishStats('failure');stopAnimation();document.body.classList.add('error-state');signal(demo?'ДЕМО · ОШИБКА':'ЗАПУСК НЕ ЗАВЕРШЁН');$('launch').textContent='Запуск\nне завершён';status('Запуск не завершён','Откройте журнал для подробностей.');step(activeStep||3,'failed');$('buttonHint').textContent=demo?'Нажмите «Повторить»':'Повторный запуск заблокирован';notice(demo?'ДЕМО: ошибка показана для примера.':'Перед новой попыткой перезапустите PS4.','error');log(description,'bad');if(!demo&&window.hostErrorReport)window.hostErrorReport.fail(title,description);}
  function cacheReady(reason){ready=true;progress(100,'Файлы готовы');$('cacheProgress').hidden=true;step(2,'done');if(started)return;if(!compatible&&!demo)return;$('launch').disabled=false;readyDisplay();if(reason)log(reason,'good');if(!demo&&autoEnabled())scheduleAutoLaunch();else $('launch').focus();}
  function complete(){if(finished)return;finished=true;if(!demo&&legacy)try{sessionStorage.removeItem('mcfort9669.integrated1100.v1');}catch(e){};finishStats('success');if(!demo&&window.hostErrorReport)window.hostErrorReport.success();stopAnimation();document.body.classList.add('done-state');signal(demo?'ДЕМО · УСПЕХ':reused?'ВЗЛОМ УЖЕ АКТИВЕН':'GOLDHEN АКТИВЕН');$('launch').textContent=reused?'Взлом\nактивен':'Взлом\nактивирован';step(3,'done');step(4,'done');step(5,'done');status(reused?'Взлом уже активирован':'Запуск завершён',reused?'Повторное обращение не меняет статистику.':'GoldHEN — запуск подтверждён загрузчиком.');$('buttonHint').textContent=demo?'Нажмите «Повторить»':'Готово';notice(demo?'Демонстрация. Реальный запуск не выполнялся.':'');log(demo?'[DEMO] Демонстрация завершена.':'[HOST] Получено итоговое подтверждение загрузчика.','good');}
  function processLine(text){
    if(finished||!started||typeof text!=='string')return;
    if(text.length>400)text=text.slice(0,400);
    var bad=/^(THREW|KPATCH-FETCH-THREW|PAYLOAD-FETCH-THREW)\b/.test(text);
    var interesting=/^(BUILD|FW |FW-STATUS|PRIMITIVE-OK|JB-ALREADY|JB-RELAUNCH|KPATCH-BLOB|PAYLOAD-BLOB|PAYLOAD-RUN|EG-VERDICT|PROOF-SUMMARY-FINAL|THREW|KPATCH-FETCH-THREW|PAYLOAD-FETCH-THREW)\b/.test(text)||/^PROOF-(?:OK|FAIL)\s+(?:PAYLOAD-RUNNING|eg-krw-ok|kernel-table-present|kpatch-table-present|payload-table-present|.*kpatch.*|.*jailbreak.*)/i.test(text);
    if(interesting){log(text,bad?'bad':/^PROOF-OK|PRIMITIVE-OK/.test(text)?'good':'');if(window.hostErrorReport)window.hostErrorReport.stage(text);}
    if(/^JB-ALREADY\b/.test(text)||/^EG-VERDICT\b.*(?:kpatched=already|reused=1)\b/.test(text)){reused=true;document.body.classList.add('reused-state');$('launch').textContent='Взлом\nактивен';finishStats('reused');log('[HOST] Система уже взломана. Повторное обращение не учитывается в статистике.','warn');}
    if(/^PRIMITIVE-OK\b/.test(text)){step(3,'done');step(4,'active');status('Выполняется системный этап','WebKit пройден. Подготавливаем систему.');}
    if(/^PAYLOAD-BLOB\b/.test(text)){status('Подготовка GoldHEN','Файл GoldHEN прочитан. Ожидаем запуска.');}
    if(/^PAYLOAD-RUN\b/.test(text)){step(4,'done');step(5,'active');status('Запускается GoldHEN','Ожидаем итоговое сообщение загрузчика.');}
    if(/^PROOF-OK\s+PAYLOAD-RUNNING\b/.test(text)||/^EG-VERDICT\b.*payload_running=1\b/.test(text))payloadSeen=true;
    if(bad){fail('Загрузчик сообщил об ошибке',text);return;}
    if(/^PROOF-SUMMARY-FINAL\b/.test(text)){
      if(payloadSeen){if(/\bfail=[1-9]/.test(text))log('В журнале есть предупреждения: проверьте результат на консоли.','warn');complete();}
      else fail('Запуск не подтверждён','Загрузчик закончил работу без подтверждённого запуска GoldHEN. Смотрите журнал.');
    }
  }
  function updateClock(){var seconds=Math.floor((Date.now()-startTime)/1000);$('elapsed').textContent=('0'+Math.floor(seconds/60)).slice(-2)+':'+('0'+seconds%60).slice(-2);}
  function startDemo(){
    var name=firmwareRoute==='webkitty'?'WebKitty':firmwareRoute==='lapse'?'RawGame4 Lapse':firmwareRoute==='poops'?'RawGame4 Poops':firmwareRoute==='afterglow'?'Afterglow':'MCFORT9669';
    var events=[['web',1100],['kernel',2500],['payload',4000],['result',5600]];
    for(var i=0;i<events.length;i++)(function(event){setTimeout(function(){if(finished)return;
      if(event==='web'){step(3,'done');step(4,'active');status('Выполняется системный этап',name+' · FW '+firmware);log('[DEMO] '+name+': браузерный этап завершён.','good');}
      else if(event==='kernel'){step(4,'done');step(5,'active');status('Запускается GoldHEN','Загрузка из '+name+'.');log('[DEMO] Системный этап завершён.','good');}
      else if(event==='payload'){log('[DEMO] GoldHEN '+window.hostFirmware.payload(firmware,demoParams.get('module'),true).version+' · имитация загрузки.');}
      else if(demoParams.get('result')==='failure'){fail('Демонстрация ошибки','[DEMO] Модуль '+name+' не подтвердил запуск. Это пример оформления ошибки.');}
      else complete();
    },events[i][1]);})(events[i][0]);
  }
  function demoControls(){
    var tools=$('demoTools'),choices=$('demoFirmware'),routes=window.hostFirmware.routes;
    $('demoRow').hidden=false;tools.hidden=false;document.body.classList.add('demo-mode');choices.textContent='';for(var k in routes){if(!Object.prototype.hasOwnProperty.call(routes,k))continue;var versions=routes[k].split(' ');for(var n=0;n<versions.length;n++){if(versions[n]==='11.00'&&k==='lapse')continue;var opt=document.createElement('option');opt.value=versions[n];opt.textContent=versions[n];choices.appendChild(opt);}}
    var unsupported=document.createElement('option');unsupported.value='15.00';unsupported.textContent='15.00 · не поддерживается';choices.appendChild(unsupported);choices.value=firmware;
    $('demoModuleRow').hidden=firmware!=='11.00';$('demoModule').value=firmwareRoute==='lapse'?'lapse':'webkitty';$('demoOutcome').value=demoParams.get('result')==='failure'?'failure':'success';
    function go(){location.search='?demo=1&fw='+encodeURIComponent(choices.value)+'&module='+encodeURIComponent($('demoModule').value)+'&result='+encodeURIComponent($('demoOutcome').value);}
    choices.addEventListener('change',go);$('demoModule').addEventListener('change',go);$('demoOutcome').addEventListener('change',go);$('demoReset').addEventListener('click',go);
  }
  function launch(){
    clearTimeout(autoTimer);autoTimer=null;
    if(started)return;
    if(!demo&&!compatible){notice('Для этой прошивки нет проверенного встроенного модуля. На компьютере оформление доступно с ?demo=1.','warn');return;}
    if(!ready){notice('Дождитесь полного сохранения кэша.','warn');return;}
    window.hostPanels.close(false);window.hostJournal.close();started=true;if(!demo&&window.hostErrorReport)window.hostErrorReport.start(integrated1100?'WebKitty':'MCFORT9669');beginAttempt();startTime=Date.now();$('launch').disabled=true;document.body.classList.add('running');signal('ЗАПУСК · '+(demo?'ДЕМО':'FW '+firmware));$('launch').textContent='Взлом\nв процессе…';$('buttonHint').textContent='Не нажимайте повторно';status('Выполняется ВЗЛОМ','Выполняется WebKit. Пожалуйста, подождите.');step(3,'active');log(demo?'[DEMO] Только анимация и тестовые статусы.':'[HOST] Запуск цепочки для PS4 '+firmware+'.');timer=setInterval(updateClock,1000);
    warningTimer=setTimeout(function(){if(!finished)notice('Запуск длится дольше обычного. Не запускайте вторую копию.','warn');},120000);
    if(demo){status('Демонстрация запуска','FW '+firmware+' · '+(legacy?'WebKitty':lapse?'RawGame4 Lapse':poops?'RawGame4 Poops':firmwareRoute==='afterglow'?'Afterglow':'MCFORT9669')+' · взлом не выполняется');startDemo();return;}
    if(legacy){
      try{
        if(integrated1100){localStorage.setItem('exploitChain','4');localStorage.setItem('bareboneJB','false');}
        sessionStorage.setItem('mcfort9669.integrated1100.v1',firmware);
      }catch(e){fail('Ошибка подготовки','Браузер не сохранил состояние запуска WebKitty: '+String(e));return;}
    }
    if(lapse||poops||firmware==='14.00'){
      try{if(lapse||poops)sessionStorage.setItem('mcfort9669.route.once',lapse?'rawgame4/run_lapse.html':'rawgame4/run_poops.html');if(firmware==='14.00')sessionStorage.setItem('mcfort9669.afterglow14.launch','1');}catch(e){fail('Ошибка подготовки',String(e));return;}
    }
    frame=document.createElement('iframe');frame.className=(original?'engine-frame':'engine-frame unified-webkitty-frame');frame.title='PS4 '+firmware+' engine';
    frame.src=legacy?'webkitty/index.html?source=mcfort9669':lapse?'rawgame4/run_lapse.html':poops?'rawgame4/run_poops.html':firmware==='14.00'?'afterglow/index.html':'engine/launch.html?log=1';
    $('engineMount').appendChild(frame);
  }
  window.addEventListener('message',function(e){
    if(!frame||e.source!==frame.contentWindow||e.origin!==location.origin||!e.data)return;
    if((legacy||lapse||poops||firmware==='14.00')&&e.data.type==='mcfort-webkitty-bridge'){
      if(finished)return;
      var line=String(e.data.line||'').slice(0,300),stage=e.data.stage;
      if(stage==='cache'){if(e.data.percent>=0){$('cacheProgress').hidden=false;progress(e.data.percent,'КЭШ WEBKITTY');}status('Подготовка WebKitty',line||'Сохраняем модуль FW 11.00.');return;}
      if(stage==='ready'){$('cacheProgress').hidden=true;log('[MODULE] '+line,'good');status('Модуль готов','Цепочка для FW '+firmware+'.');return;}
      if(stage==='retry'){log('[WEBKITTY] '+line,'warn');status('Повтор WebKitty','После перезагрузки страницы модуль повторит попытку.');return;}
      if(stage==='start'){log('[WEBKITTY] '+line);status('Выполняется ВЗЛОМ','WebKitty работает внутри общего экрана.');return;}
      if(stage==='error'){fail('Ошибка модуля',line||'Встроенный модуль остановился.');return;}
      if(stage==='success'){if(/уже активен/i.test(line))reused=true;log('[MODULE] '+line,'good');complete();return;}
      if(stage==='line'){
        log(line,/^\[-\]/.test(line)?'bad':'');
        if(/UAF Achieved|Found UAF|Achieved ARW/.test(line)){step(3,'done');step(4,'active');status('Выполняется системный этап','WebKit пройден. Подготавливаем систему.');}
        if(/kpatch|kernel patch|Created bin thread|PAYLOAD-RUNNING/i.test(line)){step(4,'done');step(5,'active');status('Запускается GoldHEN','Ожидаем итоговое сообщение загрузчика.');}
      }
      return;
    }
    if(e.data.type!=='personal-host-status')return;
    if(e.data.error){fail('Ошибка модуля',String(e.data.error));return;}
    if(e.data.line)processLine(e.data.line);
  });
  $('launch').addEventListener('click',launch);
  document.addEventListener('host-autostart-change',function(){if(started||finished)return;clearTimeout(autoTimer);autoTimer=null;if(ready){readyDisplay();scheduleAutoLaunch();}else if(autoEnabled()){$('buttonHint').textContent='Автовзлом включён · ждём файлы';}});
  $('journalToggle').addEventListener('click',function(){journal($('journal').hidden);});
  $('journalClose').addEventListener('click',function(){journal(false);});
  window.addEventListener('keydown',function(e){if((e.key==='Escape'||e.keyCode===27)&&!$('journal').hidden)journal(false);});
  function init(){
    readStats();step(1,'active');if(!demo&&window.hostErrorReport)window.hostErrorReport.restore();
    if(demo){demoControls();$('fwBadge').textContent='FW '+firmware;step(1,compatible?'done':'failed');
      if(!compatible){status('Прошивка не поддерживается','FW '+firmware+' · запуск заблокирован.');$('launch').disabled=true;notice('ДЕМО: для этой версии нет маршрута.','warn');return;}
      log('[DEMO] FW '+firmware+' · '+(firmwareRoute==='webkitty'?'WebKitty':firmwareRoute==='lapse'?'RawGame4 Lapse':firmwareRoute==='poops'?'RawGame4 Poops':firmwareRoute==='afterglow'?'Afterglow':'MCFORT9669')+'.','good');cacheReady('[DEMO] Имитируются этапы. Взлом не запускается.');return;}
    if(!ua){step(1,'failed');status('Откройте хост на PS4','Точный список прошивок откройте в «Гайды» → «Поддержка прошивок».');$('buttonHint').textContent='';$('launch').disabled=false;log('[HOST] Браузер PS4 не обнаружен. Запуск отключён.','warn');return;}
    $('fwBadge').textContent='FW '+firmware;
    if(!compatible){step(1,'failed');status('Прошивка не поддерживается','Обнаружена FW '+firmware+'. Нет модуля и подтверждённого GoldHEN для этой версии. Список — в гайдах.');notice('Взлом отключён. Не запускайте модуль от другой прошивки.','error');return;}
    step(1,'done');step(2,'active');log('[HOST] Обнаружена PS4 с прошивкой '+firmware+'. Модуль: '+(original?'MCFORT9669':lapse?'Lapse':poops?'Poops':'WebKitty')+'.','good');
    if(!cache){status('Офлайн-кэш недоступен','Браузер не предоставил AppCache. Установка офлайн-хоста не подтверждена.');notice('Откройте страницу в штатном браузере PS4. Если AppCache недоступен, этот комплект нельзя считать сохранённым офлайн.','error');step(2,'failed');return;}
    if(cache.status===1)cacheReady('[CACHE] Найден сохранённый офлайн-хост.');
    else if(cache.status===4){status('Обновление кэша готово','Закройте и снова откройте браузер.');notice('Новая версия загружена. Перезапустите браузер.');try{cache.swapCache();}catch(e){log('[CACHE] '+e.message,'warn');}}
    else{$('cacheProgress').hidden=false;status('Загрузка файлов','Дождитесь окончания загрузки. Интернет пока нужен.');if(autoEnabled())$('buttonHint').textContent='Автовзлом включён · ждём файлы';}
    cache.addEventListener('checking',function(){if(!started&&ready)log('[CACHE] Проверка обновлений.');});
    cache.addEventListener('downloading',function(){if(started){log('[CACHE] Обновление скачивается; примените его после перезапуска браузера.','warn');return;}clearTimeout(autoTimer);autoTimer=null;ready=false;signal('');$('launch').disabled=true;$('cacheProgress').hidden=false;step(2,'active');status('Загрузка файлов','Сохраняем файлы для автономной работы. Не закрывайте страницу.');});
    cache.addEventListener('progress',function(e){if(started)return;if(e.lengthComputable&&e.total)progress(Math.min(99,e.loaded/e.total*100),'СОХРАНЕНИЕ ФАЙЛОВ');else{$('cachePercent').textContent='…';}});
    cache.addEventListener('cached',function(){cacheReady('[CACHE] Все файлы сохранены.');notice('Файлы готовы. Закройте браузер и откройте хост без интернета.');});
    cache.addEventListener('noupdate',function(){cacheReady('[CACHE] Сохранённая версия актуальна.');});
    cache.addEventListener('updateready',function(){if(started){log('[CACHE] Новая версия готова. Примените после завершения и перезапуска браузера.','warn');return;}clearTimeout(autoTimer);autoTimer=null;ready=false;signal('');$('launch').disabled=true;status('Обновление кэша готово','Закройте и снова откройте браузер.');notice('Новая версия загружена. Перезапустите браузер.');try{cache.swapCache();}catch(e){log('[CACHE] '+e.message,'warn');}});
    cache.addEventListener('error',function(){if(started){log('[CACHE] Проверка обновления недоступна; текущий запуск продолжается.','warn');return;}if(cache.status===1||ready){cacheReady('[CACHE] Обновление недоступно. Используется сохранённая версия.');}else{status('Не удалось сохранить кэш','Проверьте интернет и комплект файлов хоста.');step(2,'failed');notice('Проверьте размещение файлов. Подробности — в инструкции.','error');}});
    cache.addEventListener('obsolete',function(){if(!started){clearTimeout(autoTimer);autoTimer=null;ready=false;signal('');$('launch').disabled=true;step(2,'failed');status('Кэш хоста удалён','Манифест больше недоступен на сервере. Восстановите комплект файлов и установите кэш заново.');}});
  }
  init();
})();
