/* Public demo preferences only. No device, credentials, network or physical calibration. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MicroMotionDemoConfig=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const KEY='micromotion-public-demo-settings-v1',PROFILES=['sail','single','twin'],THEMES=['walnut','maritime','neutral'];
const clone=x=>JSON.parse(JSON.stringify(x));
function model(){return {power:100,steering:100,expo:0,deadzone:0,reverse:false,theme:'walnut',telemetry:true}}
function defaults(){return {version:1,person:{name:'Standard',hand:'right',reducedMotion:false},activeProfile:'sail',models:{sail:model(),single:model(),twin:model()}}}
function record(x,keys){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==keys.length||keys.some(k=>!Object.hasOwn(x,k)))throw Error('Unbekannte oder fehlende Einstellfelder')}
function range(x,a,b){if(!Number.isFinite(x)||x<a||x>b)throw Error('Wert außerhalb des erlaubten Bereichs')}
function validate(x){
 record(x,['version','person','activeProfile','models']);if(x.version!==1||!PROFILES.includes(x.activeProfile))throw Error('Einstellformat nicht unterstützt');
 record(x.person,['name','hand','reducedMotion']);if(typeof x.person.name!=='string'||!x.person.name.trim()||x.person.name.length>40||!['left','right'].includes(x.person.hand)||typeof x.person.reducedMotion!=='boolean')throw Error('Ungültiges Bedienprofil');
 record(x.models,PROFILES);for(const p of PROFILES){const m=x.models[p];record(m,['power','steering','expo','deadzone','reverse','theme','telemetry']);range(m.power,20,100);range(m.steering,10,100);range(m.expo,0,80);range(m.deadzone,0,20);if(!THEMES.includes(m.theme)||typeof m.reverse!=='boolean'||typeof m.telemetry!=='boolean')throw Error('Ungültige Modelleinstellung')}
 return clone(x);
}
function load(storage){const s=storage.getItem(KEY);return s?validate(JSON.parse(s)):defaults()}
function save(storage,x){const v=validate(x);storage.setItem(KEY,JSON.stringify(v));return v}
function steer(value,m){range(value,-1,1);const a=Math.abs(value),dz=m.deadzone/100;if(a<=dz)return 0;const n=(a-dz)/(1-dz),e=m.expo/100;return Math.sign(value)*((1-e)*n+e*n*n*n)*(m.steering/100)*(m.reverse?-1:1)}
return Object.freeze({KEY,PROFILES,THEMES,defaults,validate,load,save,steer});
});
