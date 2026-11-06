(function(){
  'use strict';
  var routes={
    webkitty:'5.05 5.07 6.71 6.72 7.00 7.01 7.02 7.50 7.51 7.55 8.00 8.01 8.03 8.50 8.52 9.00 9.03 9.04 9.50 9.51 9.60 10.00 10.01 10.50 10.70 10.71 11.00 11.02 11.52',
    lapse:'11.00 11.50 12.00 12.02',
    poops:'12.50 12.52 13.00',
    original:'13.02 13.04 13.50 13.52',
    afterglow:'14.00'
  };
  var full='5.05, 5.07; 6.71, 6.72; 7.00, 7.01, 7.02, 7.50, 7.51, 7.55; 8.00, 8.01, 8.03, 8.50, 8.52; 9.00, 9.03, 9.04, 9.50, 9.51, 9.60; 10.00, 10.01, 10.50, 10.70, 10.71; 11.00, 11.02, 11.50, 11.52; 12.00, 12.02, 12.50, 12.52; 13.00, 13.02, 13.04, 13.50, 13.52; 14.00.';
  function route(fw){
    if(fw==='11.00'){
      try{return localStorage.getItem('mcfort9669.1100.module.v1')==='lapse'?'lapse':'webkitty';}
      catch(e){return 'webkitty';}
    }
    for(var key in routes)if(Object.prototype.hasOwnProperty.call(routes,key)&&
      (' '+routes[key]+' ').indexOf(' '+fw+' ')!==-1)return key;
    return null;
  }
  function payload(fw){
    var kind=route(fw), version='2.4b18.13',name='GoldHEN',source='MCFORT9669';
    if(kind==='lapse'||kind==='poops'){version='2.4b18.10';source='RawGame4';}
    else if(kind==='webkitty'){
      source='WebKitty';
      try{
        var flavor=localStorage.getItem('jailbreakFlavor');
        if(flavor==='PS4HEN'||flavor==='nexHEN'){name=flavor==='PS4HEN'?'PS4 HEN':'nexHEN';version='';}
        else{
          var selected=localStorage.getItem('GHVer');
          if(/^GHv2\.4b18\.(?:13|12|10|9|8|7)$/.test(selected||''))version=selected.slice(3);
        }
      }catch(e){}
    }
    return {name:name,version:version,source:source,route:kind};
  }
  window.hostFirmware={route:route,payload:payload,fullList:full,routes:routes};
})();
