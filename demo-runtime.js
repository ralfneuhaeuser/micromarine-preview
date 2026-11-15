/* In-memory demo state with optional browser persistence. Never an actuator adapter. */
(()=>{'use strict';const C=window.MicroMotionDemoConfig;let storage=null,state=C.defaults(),message='';
try{storage=window.localStorage;state=C.load(storage)}catch(e){message='Browserdaten nicht geladen. Die Demo nutzt Ausgangswerte im Arbeitsspeicher.'}
function persist(){try{if(!storage)throw Error();state=C.save(storage,state)}catch{message='Änderungen gelten nur für diese Ansicht; Browserspeicher nicht verfügbar.'}}
window.MicroMotionDemo=Object.freeze({get state(){return C.validate(state)},get message(){return message},model(){return {...state.models[state.activeProfile]}},steer(x){return C.steer(x,state.models[state.activeProfile])},select(p){if(!C.PROFILES.includes(p))return;const changed=p!==state.activeProfile;state.activeProfile=p;if(changed)persist();document.body.dataset.demoHideTelemetry=String(!this.model().telemetry)},theme(t){if(!C.THEMES.includes(t))return;state.models[state.activeProfile].theme=t;persist()},reset(){state=C.defaults();persist()}});
})();
