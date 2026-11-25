/* Standalone presentation controls. No flight physics or hardware transport. */
(()=>{'use strict';
const $=id=>document.getElementById(id), key='micromotion-demo-layout', axes={gas:0,seite:0,hoehe:0,quer:0};
const choice=document.createElement('label');choice.className='flight-layout-choice';choice.innerHTML='Modell <select id="demoLayout"><option value="boat">Boote</option><option value="indoor">Indoor-Flyer · 3 Kanäle</option><option value="plane">Leichtflugzeug · 4 Kanäle</option><option value="glider">Segelflugzeug · mit Störklappen</option></select>';
document.querySelector('.theme-box').append(choice);
const styleChoice=document.createElement('label');styleChoice.className='flight-layout-choice';styleChoice.id='flightStyleChoice';styleChoice.innerHTML='Flugdesign <select id="flightStyle"><option value="aviation">Aviation · Graphit</option><option value="riveted">Aluminium · Genietet</option><option value="brushed">Aluminium · Gebürstet</option><option value="classic">Classic</option></select>';styleChoice.hidden=true;
document.querySelector('.theme-box').append(styleChoice);
const panel=document.createElement('section');panel.id='flightDemo';panel.hidden=true;panel.setAttribute('aria-label','Flugmodell-Senderdemo');
const slider=(id,label,min,max)=>`<label class="flight-axis" data-axis="${id}"><span id="${id}Label">${label}</span> <output id="${id}Value">0 %</output><input id="flight-${id}" type="range" min="${min}" max="${max}" value="0" step="1"></label>`;
panel.innerHTML=`<div class="flight-stick" id="flightPowerPanel"><h2 id="flightLeftTitle">Gas / Seite</h2><div class="flight-gimbal" id="flightLeft" aria-hidden="true"><i></i></div>${slider('gas','Gas',0,100)}${slider('seite','Seitenruder',-100,100)}</div><div class="flight-instruments"><div class="flight-plaque"><span id="flightName">INDOOR</span><small id="flightHandLabel">GAS LINKS · SENDERDEMO</small></div><div class="flight-monitor"><div class="flight-horizon" aria-label="Illustrative Fluglage"><div id="flightSky"></div><span class="flight-wings">━━ ● ━━</span></div><div class="flight-autopilot"><button id="flightAP" type="button" aria-pressed="false"><span class="flight-ap-lamp" aria-hidden="true"></span> Autopilot · Demo</button><p id="flightAPStatus" role="status">MANUELL · AP aus</p><div class="flight-ap-readouts"><span>Kurs <output id="flightCourse">090°</output></span><span>Höhe <output id="flightAltitude">–</output></span></div><small id="flightAPTarget">Nur erzeugte Beispieldaten</small><p id="flightCorrection">Keine automatischen Korrekturen</p><button id="flightGust" type="button">Windböe vorführen</button></div></div><div class="flight-light-panel"><div class="flight-light-face"><svg class="flight-airframe" viewBox="0 0 220 110" role="img" aria-label="Flugmodell mit schaltbaren Positionslichtern"><path id="flightOutline" d="M110 8 Q116 12 116 33 L198 66 L198 73 L116 60 L116 84 L140 96 L140 101 L110 95 L80 101 L80 96 L104 84 L104 60 L22 73 L22 66 L104 33 Q104 12 110 8Z" fill="#34444d" stroke="#a9bbc5" stroke-width="2"/><path id="flightFrameLines" d="M110 26V83 M30 69L104 47 M190 69L116 47" fill="none" stroke="#70838c"/><path id="flightSpoilers" d="M28 54H88 M132 54H192" fill="none" stroke="#ffd166" stroke-width="5" opacity="0"/><circle id="flightLampRed" class="flight-lamp flight-lamp-red" cx="23" cy="68" r="5"/><circle id="flightLampGreen" class="flight-lamp flight-lamp-green" cx="197" cy="68" r="5"/><circle class="flight-lamp flight-lamp-white" cx="110" cy="95" r="4"/></svg><p id="flightLightStatus" role="status">Beleuchtung aus</p></div><div class="flight-switch-stack"><button type="button" id="flightLights" aria-pressed="false" aria-label="Beleuchtung einschalten"><span class="toggle-guard guard-left" aria-hidden="true"></span><span class="toggle-base" aria-hidden="true"></span><span class="toggle-arm" aria-hidden="true"></span><span class="toggle-guard guard-right" aria-hidden="true"></span></button><div id="flightStopSlot"></div></div></div><div class="flight-gyro"><button id="flightGyro" type="button" aria-pressed="false">Neigungssteuerung einschalten</button><button id="flightGyroCenter" type="button" disabled>Neutralstellung setzen</button><p id="flightGyroStatus" role="status">Klassisch · manuelle Steuerung</p></div><details class="flight-trim"><summary>Trimmung · Feinabgleich</summary><p>Demo-Offset bis ±15 %. STOPP setzt auch die Trimmung zurück.</p>${['seite','hoehe','quer'].map(k=>`<label data-trim-axis="${k}">${{seite:'Seite',hoehe:'Höhe',quer:'Quer'}[k]} <output id="trimValue-${k}">0 %</output><input type="range" id="trim-${k}" min="-15" max="15" value="0" step="1"></label>`).join('')}<button type="button" id="flightTrimReset">Trimmung nullen</button></details><p class="flight-attitude" id="flightAttitude">Quer 0 % · Höhe 0 %</p><button type="button" id="flightStop">STOPP · Gas aus</button><p class="flight-note" id="flightNote">Gas bleibt stehen, Ruder zentrieren beim Loslassen der Knüppel. Fluglage nur illustriert; keine Flugphysik oder echten Messwerte.</p></div><div class="flight-stick" id="flightControlPanel"><h2 id="flightRightTitle">Höhe</h2><div class="flight-gimbal" id="flightRight" aria-hidden="true"><i></i></div>${slider('hoehe','Höhenruder',-100,100)}${slider('quer','Querruder',-100,100)}</div>`;
document.querySelector('.deck').after(panel);
$('flightStopSlot').append($('flightStop'));
let mode='boat',lights=false,flightStyle='aviation',autopilot=false,apTimer=null,apTime=0,course=90,altitude=1.5,targetCourse=90,targetAltitude=1.5,gyro=false,gyroEpoch=0,gyroTimer=null,gyroNeutral=null,gyroLast=null,gyroStamp=0;const cancelGestures=[];const trim={seite:0,hoehe:0,quer:0};const active=()=>mode!=='boat';
const output=k=>k==='gas'?axes[k]:Math.max(-100,Math.min(100,axes[k]+trim[k]));
function render(){for(const k of Object.keys(axes)){$('flight-'+k).value=axes[k];$(k+'Value').textContent=output(k)+' %'}
 for(const k of Object.keys(trim)){$('trim-'+k).value=trim[k];$('trimValue-'+k).textContent=trim[k]+' %'}
 const travel=id=>$(id).clientWidth*.32;
 $('flightLeft').querySelector('i').style.transform=`translate(${axes.seite/100*travel('flightLeft')}px,${(1-axes.gas/50)*travel('flightLeft')}px)`;
 $('flightRight').querySelector('i').style.transform=`translate(${axes.quer/100*travel('flightRight')}px,${axes.hoehe/100*travel('flightRight')}px)`;
 $('flightGust').disabled=gyro;
 if(!autopilot)$('flightSky').style.transform=`rotate(${-(mode==='indoor'?output('seite')*.25:output('quer')*.4)}deg) translateY(${output('hoehe')*.25}px)`;
 $('flightSpoilers').setAttribute('opacity',mode==='glider'?String(axes.gas/100):'0');
 $('flightAttitude').textContent=`${mode==='indoor'?'Seite':'Quer'} ${output(mode==='indoor'?'seite':'quer')} % · Höhe ${output('hoehe')} %`;
}
function gyroOff(message='Klassisch · manuelle Steuerung'){
 gyro=false;gyroEpoch++;gyroNeutral=null;gyroLast=null;if(gyroTimer!==null){window.clearInterval(gyroTimer);gyroTimer=null}
 $('flightGyro').setAttribute('aria-pressed','false');$('flightGyro').textContent='Neigungssteuerung einschalten';$('flightGyroCenter').disabled=true;$('flightGyroStatus').textContent=message;
 axes.seite=axes.hoehe=axes.quer=0;render();
}
function cancelGyroPending(){if(!gyro){gyroEpoch++;$('flightGyroStatus').textContent='Klassisch · manuelle Steuerung'}}
function screenTilt(e){
 const b=e.beta*Math.PI/180,g=e.gamma*Math.PI/180,a=(window.screen?.orientation?.angle??window.orientation??0)*Math.PI/180;
 const x=Math.cos(b)*Math.sin(g),y=Math.sin(b);
 return {x:x*Math.cos(a)+y*Math.sin(a),y:-x*Math.sin(a)+y*Math.cos(a)};
}
window.addEventListener('deviceorientation',e=>{if(!gyro||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
 gyroLast=screenTilt(e);gyroStamp=Date.now();if(!gyroNeutral)gyroNeutral={...gyroLast};
 const val=n=>Math.round(Math.max(-1,Math.min(1,n/.35))*100);
 const x=val(gyroLast.x-gyroNeutral.x),y=val(gyroLast.y-gyroNeutral.y);
 axes.hoehe=y;if(mode==='indoor'){axes.seite=x;axes.quer=0}else{axes.quer=x}
 $('flightGyroStatus').textContent=`Neigung aktiv · ${mode==='indoor'?'Zusatzhebel manuell':'Gas/Klappen und Seite manuell'}`;render();
});
$('flightGyro').onclick=async()=>{
 if(gyro){gyroOff();return}
 if(!window.isSecureContext||!window.DeviceOrientationEvent){$('flightGyroStatus').textContent='Neigung hier nicht verfügbar – HTTPS und Bewegungssensoren erforderlich.';return}
 const epoch=++gyroEpoch;$('flightGyroStatus').textContent='Sensorfreigabe anfordern …';
 try{const E=window.DeviceOrientationEvent;if(typeof E.requestPermission==='function'&&await E.requestPermission()!=='granted')throw Error('denied');
 if(epoch!==gyroEpoch)return;for(const cancel of cancelGestures)cancel();axes.seite=axes.hoehe=axes.quer=0;disengage('MANUELL · Neigungssteuerung');gyro=true;gyroStamp=Date.now();gyroNeutral=null;gyroLast=null;
 $('flightGyro').setAttribute('aria-pressed','true');$('flightGyro').textContent='Zur klassischen Steuerung';$('flightGyroCenter').disabled=false;$('flightGyroStatus').textContent='iPhone ruhig halten – warte auf Sensordaten …';
 render();gyroTimer=window.setInterval(()=>{if(Date.now()-gyroStamp>1800)gyroOff('Keine aktuellen Sensordaten · zurück zu klassisch')},300);
 }catch{if(epoch===gyroEpoch)gyroOff('Sensorzugriff nicht erlaubt · klassische Steuerung bleibt aktiv')}
};
$('flightGyroCenter').onclick=()=>{if(gyro&&gyroLast){gyroNeutral={...gyroLast};axes.seite=axes.hoehe=axes.quer=0;render();$('flightGyroStatus').textContent='Neutralstellung gesetzt · Zusatzhebel bleibt manuell'}};
window.addEventListener('orientationchange',()=>{if(gyro)gyroOff('Ausrichtung geändert · Neigung neu einschalten')});
function apReadouts(){ $('flightCourse').textContent=String(Math.round((course+360)%360)).padStart(3,'0')+'°';$('flightAltitude').textContent=altitude.toFixed(1)+' m'; }
function disengage(reason='MANUELL · AP aus'){
 autopilot=false;if(apTimer!==null){window.clearInterval(apTimer);apTimer=null}
 panel.dataset.autopilot='false';$('flightAP').setAttribute('aria-pressed','false');$('flightAPStatus').textContent=reason;
 $('flightCorrection').textContent='Keine automatischen Korrekturen';$('flightAPTarget').textContent='Nur erzeugte Beispieldaten';
}
function apStep(){if(!autopilot||document.hidden)return;
 const still=document.body.dataset.reducedMotion==='true';apTime+=.2;
 const wind=still?0:Math.sin(apTime*1.3)*.045;
 const yaw=(((targetCourse-course+540)%360)-180)*.22,pitch=(targetAltitude-altitude)*.22;
 course=(course+yaw+wind+360)%360;altitude=Math.max(.2,altitude+pitch+wind*.08);
 const roll=Math.max(-12,Math.min(12,-yaw*7)),tilt=Math.max(-10,Math.min(10,pitch*18));
 $('flightSky').style.transform=still?'rotate(0deg) translateY(0px)':`rotate(${roll}deg) translateY(${tilt}px)`;
 $('flightCorrection').textContent=`Korrektur: ${mode==='indoor'?'Seite':'Quer'} ${Math.max(-100,Math.min(100,Math.round(yaw*10)))} % · Höhe ${Math.max(-100,Math.min(100,Math.round(pitch*35)))} %`;
 apReadouts();
}
$('flightAP').onclick=()=>{if(autopilot){disengage();render();return}
 for(const cancel of cancelGestures)cancel();gyroOff();autopilot=true;targetCourse=course;targetAltitude=altitude;panel.dataset.autopilot='true';$('flightAP').setAttribute('aria-pressed','true');$('flightAPStatus').textContent='AP AKTIV · Kurs + Höhe halten (Demo)';
 $('flightAPTarget').textContent=`Soll: ${Math.round(targetCourse)}° / ${targetAltitude.toFixed(1)} m · Beispieldaten`;
 apTimer=window.setInterval(apStep,200);apStep();
};
$('flightGust').onclick=()=>{if(gyro)return;course=(course+8)%360;altitude=Math.max(.2,altitude-(mode==='indoor'?.3:1.2));apReadouts();
 if(autopilot)apStep();else{$('flightSky').style.transform=document.body.dataset.reducedMotion==='true'?'rotate(0deg) translateY(0px)':'rotate(-12deg) translateY(-8px)';$('flightAPStatus').textContent='BÖE · Demo-Abweichung, AP aus'}
};
function renderLights(){panel.dataset.lights=String(lights);$('flightLights').setAttribute('aria-pressed',String(lights));
 const label=mode==='indoor'?'Flügelbeleuchtung':'Positionslichter';$('flightLights').setAttribute('aria-label',label+(lights?' ausschalten':' einschalten'));$('flightLightStatus').textContent=label+(lights?' an · simuliert':' aus');}
function appearance(){$('flightHandLabel').textContent=(mode==='glider'?'KLAPPEN':'GAS')+(document.body.dataset.hand==='left'?' RECHTS · SENDERDEMO':' LINKS · SENDERDEMO');document.body.dataset.flightStyle=active()?flightStyle:'classic';styleChoice.hidden=!active();$('flightStyle').value=flightStyle;}
$('flightStyle').addEventListener('change',e=>{flightStyle=['classic','riveted','brushed'].includes(e.target.value)?e.target.value:'aviation';appearance();render()});
$('flightLights').onclick=()=>{lights=!lights;renderLights()};
function stop(){for(const cancel of cancelGestures)cancel();for(const k of Object.keys(trim))trim[k]=0;gyroOff();disengage();lights=false;renderLights();for(const k of Object.keys(axes))axes[k]=0;render()}
function select(value){mode=['indoor','plane','glider'].includes(value)?value:'boat';$('stop').click();stop();$('demoLayout').value=mode;panel.hidden=!active();document.body.dataset.flight=String(active());document.documentElement.dataset.flight=String(active());appearance();renderLights();render();course=90;altitude=mode==='indoor'?1.5:30;apReadouts();
 const sail=mode==='glider';panel.dataset.aircraft=mode;
 $('flightName').textContent=sail?'SAILPLANE':mode==='indoor'?'INDOOR FLYER':'LIGHT AIRCRAFT';
 $('flightLeftTitle').textContent=sail?'Störklappen / Seite':'Gas / Seite';$('gasLabel').textContent=sail?'Störklappen':'Gas';
 $('flightStop').textContent=sail?'STOPP · Neutral':'STOPP · Gas aus';
 $('flightNote').textContent=sail?'Segler ohne Motor: Störklappen 0 % = eingefahren, 100 % = ausgefahren. Ruder zentrieren. Fluglage und Autopilot sind reine Showdemo, keine Flugphysik.':'Gas bleibt stehen, Ruder zentrieren beim Loslassen der Knüppel. Fluglage nur illustriert; keine Flugphysik oder echten Messwerte.';
 $('flightOutline').setAttribute('d',sail?'M110 7 Q114 10 114 35 L210 49 L210 55 L114 48 L113 86 L136 98 L136 102 L110 95 L84 102 L84 98 L107 86 L106 48 L10 55 L10 49 L106 35 Q106 10 110 7Z':'M110 8 Q116 12 116 33 L198 66 L198 73 L116 60 L116 84 L140 96 L140 101 L110 95 L80 101 L80 96 L104 84 L104 60 L22 73 L22 66 L104 33 Q104 12 110 8Z');
 $('flightFrameLines').setAttribute('d',sail?'M110 20V85 M15 52H105 M115 52H205':'M110 26V83 M30 69L104 47 M190 69L116 47');
 $('flightLampRed').setAttribute('cx',sail?'11':'23');$('flightLampRed').setAttribute('cy',sail?'52':'68');$('flightLampGreen').setAttribute('cx',sail?'209':'197');$('flightLampGreen').setAttribute('cy',sail?'52':'68');
 appearance();$('flightRightTitle').textContent=mode==='indoor'?'Höhe':'Quer / Höhe';document.querySelector('[data-axis="quer"]').hidden=mode==='indoor';document.querySelector('[data-trim-axis="quer"]').hidden=mode==='indoor';if(mode==='indoor')trim.quer=0;
 try{sessionStorage.setItem(key,mode)}catch{} }
$('demoLayout').addEventListener('change',e=>select(e.target.value));$('flightStop').onclick=stop;
for(const k of Object.keys(axes)){
 const el=$('flight-'+k);let held=false,blocked=false;
 cancelGestures.push(()=>{if(held)blocked=true;held=false});
 for(const event of ['change','pointerup','pointercancel','blur'])el.addEventListener(event,()=>{held=false});
 el.addEventListener('pointerdown',()=>{held=true;blocked=false});el.addEventListener('keydown',()=>{blocked=false});
 el.addEventListener('input',e=>{if(blocked){render();return}const value=Number(e.target.value);cancelGyroPending();disengage('MANUELL · Steuerung übernommen');if(gyro&&k!=='gas'&&!(k==='seite'&&mode!=='indoor'))gyroOff();axes[k]=value;render()});
 if(k!=='gas'){
  const center=()=>{held=false;axes[k]=0;render()};
  for(const event of ['change','pointerup','pointercancel','lostpointercapture','blur','keyup'])el.addEventListener(event,center);
  el.addEventListener('pointerdown',()=>{activeSlider=k});
 }
}
let activeSlider=null;
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>{if(activeSlider){axes[activeSlider]=0;activeSlider=null;render()}});
for(const k of Object.keys(trim))$('trim-'+k).addEventListener('input',e=>{cancelGyroPending();disengage('MANUELL · Trimmung geändert');trim[k]=Math.max(-15,Math.min(15,Number(e.target.value)));render()});
$('flightTrimReset').onclick=()=>{disengage('MANUELL · Trimmung genullt');cancelGyroPending();for(const k of Object.keys(trim))trim[k]=0;render()};
for(const [id,left] of [['flightLeft',true],['flightRight',false]]){const el=$(id);let pointer=null;cancelGestures.push(()=>{pointer=null});
 const move=e=>{const r=el.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.35))),y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.35)));
 if(left){axes.gas=Math.round((1-y)*50);if(!gyro||mode!=='indoor')axes.seite=Math.round(x*100)}else{axes.hoehe=Math.round(y*100);axes.quer=mode!=='indoor'?Math.round(x*100):0}render()};
 el.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;cancelGyroPending();if(gyro&&!left)gyroOff('Klassisch · Knüppel übernommen');disengage('MANUELL · Steuerung übernommen');el.setPointerCapture(pointer);move(e)});
 el.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e)});
 const release=e=>{if(e.pointerId!==pointer)return;pointer=null;if(left)axes.seite=0;else axes.hoehe=axes.quer=0;render()};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);
}
window.addEventListener('resize',render);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
$('demoReset').addEventListener('click',()=>{try{sessionStorage.removeItem(key)}catch{};stop()});
// Returning from demo settings retains only layout choice, never throttle values.
let saved='boat';try{saved=sessionStorage.getItem(key)||'boat'}catch{}
const requested=new URLSearchParams(location.search).get('layout');select(requested||saved);
})();
