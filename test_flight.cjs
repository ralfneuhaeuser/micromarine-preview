const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function demo(query='',hand='right'){
 const nodes={},callbacks={},saved={};let now=1000,nextTimer=0;const timers=new Map();
 function el(id){return nodes[id]??= {value:'0',textContent:'',style:{},dataset:{},hidden:false,clientWidth:150,events:{},addEventListener(k,fn){(this.events[k]??=[]).push(fn)},fire(k,e={}){for(const f of this.events[k]||[])f(e);this['on'+k]?.(e)},click(){this.fire('click')},append(){},after(){},attributes:{},setAttribute(k,v){this.attributes[k]=v},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:150,height:150}},querySelector(){return el(id+'-knob')}}}
 const doc={documentElement:el('html'),hidden:false,body:el('body'),getElementById:el,createElement:()=>el('panel'+Object.keys(nodes).length),querySelector:el,addEventListener(k,fn){callbacks[k]=fn}};
 doc.body.dataset.hand=hand;
 const win={setInterval(fn){const id=++nextTimer;timers.set(id,fn);callbacks.tick=()=>{for(const f of [...timers.values()])f()};return id},clearInterval(id){timers.delete(id);if(!timers.size)delete callbacks.tick},addEventListener(k,fn){callbacks[k]=fn}};
 const context={Date:{now:()=>now},document:doc,window:win,location:{search:query},URLSearchParams,sessionStorage:{getItem:k=>saved[k],setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/flight-demo.js','utf8'),context);
 return {el,callbacks,doc,win,timerCount:()=>timers.size,advance(ms){now+=ms}};
}
test('three/four channels switch, inputs and stop reset',()=>{
 const d=demo('?layout=indoor'),e=d.el;assert.equal(e('demoLayout').value,'indoor');assert.equal(d.doc.body.dataset.flight,'true');assert.equal(e('[data-axis="quer"]').hidden,true);
 e('flight-gas').value='74';e('flight-gas').fire('input',{target:e('flight-gas')});assert.equal(e('gasValue').textContent,'74 %');
 e('flightStop').click();assert.equal(e('gasValue').textContent,'0 %');
 e('demoLayout').fire('change',{target:{value:'plane'}});assert.equal(e('[data-axis="quer"]').hidden,false);
 e('flight-quer').value='50';e('flight-quer').fire('input',{target:e('flight-quer')});assert(e('flightSky').style.transform.includes('-20deg'));
 d.callbacks.blur();assert.equal(e('querValue').textContent,'0 %');
 e('demoLayout').fire('change',{target:{value:'boat'}});assert.equal(d.doc.body.dataset.flight,'false');
});
test('touch release centers rudder, retains gas; cancellation and hiding zero controls',()=>{
 const d=demo('?layout=plane'),e=d.el,p=e('flightLeft');
 p.fire('pointerdown',{pointerId:1,clientX:100,clientY:30,preventDefault(){}});const gas=e('gasValue').textContent;assert.notEqual(gas,'0 %');
 p.fire('pointerup',{pointerId:1});assert.equal(e('seiteValue').textContent,'0 %');assert.equal(e('gasValue').textContent,gas);
 const r=e('flightRight');r.fire('pointerdown',{pointerId:2,clientX:110,clientY:30,preventDefault(){}});assert.notEqual(e('querValue').textContent,'0 %');r.fire('pointercancel',{pointerId:2});assert.equal(e('querValue').textContent,'0 %');assert.equal(e('hoeheValue').textContent,'0 %');
 d.doc.hidden=true;d.callbacks.visibilitychange();assert.equal(e('gasValue').textContent,'0 %');
});
test('flight demo introduces no transport and build includes both assets',()=>{
 const s=fs.readFileSync(__dirname+'/flight-demo.js','utf8');assert(!/fetch\(|WebSocket|navigator\.(serial|bluetooth)|https?:/.test(s));
 const html=fs.readFileSync(__dirname+'/index.html','utf8');assert(html.includes('href="flight-demo.css"'));assert(html.includes('src="flight-demo.js"'));
});

test('both aircraft have switchable lights; stop, focus loss and model switch turn them off',()=>{
 const d=demo('?layout=indoor'),e=d.el;
 assert.equal(d.doc.body.dataset.flightStyle,'aviation');
 for(const mode of ['indoor','plane']){
  e('demoLayout').fire('change',{target:{value:mode}});
  e('flightLights').click();assert.equal(e('flightLights').attributes['aria-pressed'],'true');assert(e('flightLightStatus').textContent.includes('an · simuliert'));
  e('flightStop').click();assert.equal(e('flightLights').attributes['aria-pressed'],'false');
 }
 e('flightLights').click();d.callbacks.blur();assert.equal(e('flightLights').attributes['aria-pressed'],'false');
 e('flightStyle').fire('change',{target:{value:'classic'}});assert.equal(d.doc.body.dataset.flightStyle,'classic');
 e('flightStyle').fire('change',{target:{value:'aviation'}});assert.equal(d.doc.body.dataset.flightStyle,'aviation');
 e('demoLayout').fire('change',{target:{value:'boat'}});assert.equal(d.doc.body.dataset.flightStyle,'classic');
});

test('metal finishes switch independently of model and reset to boat appearance',()=>{
 const d=demo('?layout=plane'),e=d.el;
 for(const style of ['riveted','brushed']){
 e('flightStyle').fire('change',{target:{value:style}});assert.equal(d.doc.body.dataset.flightStyle,style);
 e('demoLayout').fire('change',{target:{value:'indoor'}});assert.equal(d.doc.body.dataset.flightStyle,style);
 }
 e('demoLayout').fire('change',{target:{value:'boat'}});assert.equal(d.doc.body.dataset.flightStyle,'classic');
});

test('flight handedness label follows existing personal preference',()=>{
 const d=demo('?layout=plane','left');assert.equal(d.el('flightHandLabel').textContent,'GAS RECHTS · SENDERDEMO');
 const normal=demo('?layout=indoor','right');assert.equal(normal.el('flightHandLabel').textContent,'GAS LINKS · SENDERDEMO');
});

test('autopilot holds captured example targets, recovers gust and disengages on manual/stop/blur',()=>{
 const d=demo('?layout=plane'),e=d.el;
 e('flightAP').click();assert.equal(e('flightAP').attributes['aria-pressed'],'true');assert(d.callbacks.tick);
 e('flightGust').click();const before=parseFloat(e('flightAltitude').textContent);
 for(let i=0;i<30;i++)d.callbacks.tick();assert(parseFloat(e('flightAltitude').textContent)>before);
 e('flight-hoehe').fire('input',{target:{value:'10'}});assert.equal(e('flightAP').attributes['aria-pressed'],'false');assert.equal(d.callbacks.tick,undefined);
 for(const action of [()=>e('flightStop').click(),()=>d.callbacks.blur(),()=>e('demoLayout').fire('change',{target:{value:'indoor'}})]){e('flightAP').click();action();assert.equal(e('flightAP').attributes['aria-pressed'],'false');assert.equal(d.callbacks.tick,undefined)}
});

test('gyro permission, neutral, portrait/landscape steering and manual gas coexist',async()=>{
 const d=demo('?layout=plane'),e=d.el;d.win.isSecureContext=true;d.win.DeviceOrientationEvent={requestPermission:async()=>'granted'};
 await e('flightGyro').onclick();assert.equal(e('flightGyro').attributes['aria-pressed'],'true');
 d.callbacks.deviceorientation({beta:0,gamma:0});d.callbacks.deviceorientation({beta:10,gamma:10});assert.notEqual(e('querValue').textContent,'0 %');assert.notEqual(e('hoeheValue').textContent,'0 %');
 e('flight-gas').fire('input',{target:{value:'60'}});assert.equal(e('gasValue').textContent,'60 %');assert.equal(e('flightGyro').attributes['aria-pressed'],'true');
 e('flightGyroCenter').click();assert.equal(e('querValue').textContent,'0 %');assert.equal(e('hoeheValue').textContent,'0 %');
 d.callbacks.orientationchange();assert.equal(e('flightGyro').attributes['aria-pressed'],'false');
 d.win.screen={orientation:{angle:90}};await e('flightGyro').onclick();d.callbacks.deviceorientation({beta:0,gamma:0});d.callbacks.deviceorientation({beta:10,gamma:0});assert.notEqual(e('querValue').textContent,'0 %');
 e('flightStop').click();assert.equal(e('flightGyro').attributes['aria-pressed'],'false');assert.equal(e('gasValue').textContent,'0 %');
});
test('gyro denied/unsupported falls back and late permission cannot rearm after stop',async()=>{
 const d=demo('?layout=indoor'),e=d.el;await e('flightGyro').onclick();assert(e('flightGyroStatus').textContent.includes('nicht verfügbar'));
 d.win.isSecureContext=true;d.win.DeviceOrientationEvent={requestPermission:async()=>'denied'};await e('flightGyro').onclick();assert.equal(e('flightGyro').attributes['aria-pressed'],'false');
 let grant;d.win.DeviceOrientationEvent.requestPermission=()=>new Promise(r=>grant=r);const pending=e('flightGyro').onclick();e('flightStop').click();grant('granted');await pending;assert.equal(e('flightGyro').attributes['aria-pressed'],'false');
});

test('gyro ignores invalid samples and falls back when sensor stream stalls',async()=>{
 const d=demo('?layout=indoor'),e=d.el;d.win.isSecureContext=true;d.win.DeviceOrientationEvent={};await e('flightGyro').onclick();
 d.callbacks.deviceorientation({beta:null,gamma:NaN});assert.equal(e('seiteValue').textContent,'0 %');
 d.callbacks.deviceorientation({beta:0,gamma:0});d.callbacks.deviceorientation({beta:0,gamma:10});assert.notEqual(e('seiteValue').textContent,'0 %');
 const gas=e('flightLeft');gas.fire('pointerdown',{pointerId:3,clientX:75,clientY:30,preventDefault(){}});assert.equal(e('flightGyro').attributes['aria-pressed'],'true');
 d.advance(2000);d.callbacks.tick();assert.equal(e('flightGyro').attributes['aria-pressed'],'false');assert.equal(e('seiteValue').textContent,'0 %');
});

test('glider has spoilers instead of motor, long-wing shape and full rudder controls',()=>{
 const d=demo('?layout=glider'),e=d.el;assert.equal(e('demoLayout').value,'glider');assert.equal(e('gasLabel').textContent,'Störklappen');assert.equal(e('flightName').textContent,'SAILPLANE');assert.equal(e('[data-axis="quer"]').hidden,false);
 e('flight-gas').fire('input',{target:{value:'70'}});assert.equal(e('flightSpoilers').attributes.opacity,'0.7');assert.equal(e('gasValue').textContent,'70 %');
 e('flightRight').fire('pointerdown',{pointerId:1,clientX:110,clientY:50,preventDefault(){}});assert.notEqual(e('querValue').textContent,'0 %');
 e('flightStop').click();assert.equal(e('flightSpoilers').attributes.opacity,'0');
 e('demoLayout').fire('change',{target:{value:'plane'}});assert.equal(e('gasLabel').textContent,'Gas');assert.equal(e('flightLampRed').attributes.cy,'68');
});
test('rudder sliders spring back, throttle holds, trim offsets output and STOPP clears trim',()=>{
 const d=demo('?layout=plane'),e=d.el;
 for(const event of ['change','pointerup','pointercancel','blur','keyup']){
  e('flight-hoehe').fire('input',{target:{value:'35'}});assert.equal(e('hoeheValue').textContent,'35 %');e('flight-hoehe').fire(event);assert.equal(e('hoeheValue').textContent,'0 %');
 }
 e('flight-gas').fire('input',{target:{value:'55'}});e('flight-gas').fire('change');assert.equal(e('gasValue').textContent,'55 %');
 e('trim-hoehe').fire('input',{target:{value:'7'}});assert.equal(e('hoeheValue').textContent,'7 %');
 e('flight-hoehe').fire('input',{target:{value:'100'}});assert.equal(e('hoeheValue').textContent,'100 %');e('flight-hoehe').fire('pointerup');assert.equal(e('flight-hoehe').value,0);assert.equal(e('hoeheValue').textContent,'7 %');
 e('flightStop').click();assert.equal(e('hoeheValue').textContent,'0 %');assert.equal(e('trim-hoehe').value,0);
});
test('manual yaw remains available alongside gyro pitch/roll on four-channel aircraft',async()=>{
 const d=demo('?layout=plane'),e=d.el;d.win.isSecureContext=true;d.win.DeviceOrientationEvent={};await e('flightGyro').onclick();d.callbacks.deviceorientation({beta:0,gamma:0});
 e('flight-seite').fire('input',{target:{value:'40'}});assert.equal(e('flightGyro').attributes['aria-pressed'],'true');
 d.callbacks.deviceorientation({beta:5,gamma:10});assert.equal(e('seiteValue').textContent,'40 %');assert.notEqual(e('querValue').textContent,'0 %');
 e('flight-seite').fire('change');assert.equal(e('seiteValue').textContent,'0 %');assert.equal(e('flightGyro').attributes['aria-pressed'],'true');
});
test('STOPP invalidates an already held joystick; subsequent old moves cannot restart gas',()=>{
 const d=demo('?layout=plane'),e=d.el,p=e('flightLeft');p.fire('pointerdown',{pointerId:4,clientX:75,clientY:15,preventDefault(){}});assert.notEqual(e('gasValue').textContent,'0 %');
 e('flightStop').click();p.fire('pointermove',{pointerId:4,clientX:75,clientY:10});assert.equal(e('gasValue').textContent,'0 %');
});
test('AP owns horizon across resize and design change; trim reset returns manual',()=>{
 const d=demo('?layout=plane'),e=d.el;e('flightAP').click();e('flightGust').click();const pose=e('flightSky').style.transform;
 d.callbacks.resize();assert.equal(e('flightSky').style.transform,pose);
 e('flightStyle').fire('change',{target:{value:'riveted'}});assert.equal(e('flightSky').style.transform,pose);
 e('flightTrimReset').click();assert.equal(e('flightAP').attributes['aria-pressed'],'false');
});
test('manual input while gyro permission is pending cannot be overridden by late permission',async()=>{
 const d=demo('?layout=plane'),e=d.el;let grant;d.win.isSecureContext=true;d.win.DeviceOrientationEvent={requestPermission:()=>new Promise(r=>grant=r)};
 const pending=e('flightGyro').onclick();e('flight-gas').fire('input',{target:{value:'45'}});grant('granted');await pending;assert.equal(e('flightGyro').attributes['aria-pressed'],'false');
});
test('gyro remains sole horizon owner: gust button is disabled and ignored',async()=>{
 const d=demo('?layout=plane'),e=d.el;d.win.isSecureContext=true;d.win.DeviceOrientationEvent={};await e('flightGyro').onclick();d.callbacks.deviceorientation({beta:0,gamma:0});const before=e('flightCourse').textContent;
 assert.equal(e('flightGust').disabled,true);e('flightGust').click();assert.equal(e('flightCourse').textContent,before);
});

for(const model of ['indoor','plane','glider'])for(const hand of ['left','right'])test(`mode transitions and timer cleanup: ${model}/${hand}`,async()=>{
 const d=demo('?layout='+model,hand),e=d.el;d.win.isSecureContext=true;d.win.DeviceOrientationEvent={};
 for(let i=0;i<4;i++){
  e('flightAP').click();assert.equal(d.timerCount(),1);e('flightGust').click();d.callbacks.tick();
  await e('flightGyro').onclick();assert.equal(e('flightAP').attributes['aria-pressed'],'false');assert.equal(d.timerCount(),1);
  d.callbacks.deviceorientation({beta:0,gamma:0});d.callbacks.deviceorientation({beta:8,gamma:8});
  e('flightAP').click();assert.equal(e('flightGyro').attributes['aria-pressed'],'false');assert.equal(d.timerCount(),1);
  e('flightStop').click();assert.equal(d.timerCount(),0);for(const k of ['gas','seite','hoehe','quer'])assert.equal(e(k+'Value').textContent,'0 %');
 }
 e('demoLayout').fire('change',{target:{value:'boat'}});assert.equal(d.timerCount(),0);assert.equal(d.doc.documentElement.dataset.flight,'false');
});
test('held range cannot restart after STOPP, new deliberate gesture can',()=>{
 const d=demo('?layout=plane'),e=d.el,r=e('flight-gas');r.fire('pointerdown');r.fire('input',{target:{value:'80'}});e('flightStop').click();r.fire('input',{target:{value:'90'}});assert.equal(e('gasValue').textContent,'0 %');
 r.fire('pointerdown');r.fire('input',{target:{value:'20'}});assert.equal(e('gasValue').textContent,'20 %');
});
test('repeated gust correction percentages stay bounded and low-animation manual gust stays still',()=>{
 const d=demo('?layout=plane'),e=d.el;e('flightAP').click();for(let i=0;i<80;i++)e('flightGust').click();
 for(const v of e('flightCorrection').textContent.matchAll(/(-?\d+) %/g))assert(Math.abs(Number(v[1]))<=100);
 e('flightAP').click();d.doc.body.dataset.reducedMotion='true';e('flightGust').click();assert.equal(e('flightSky').style.transform,'rotate(0deg) translateY(0px)');
});
