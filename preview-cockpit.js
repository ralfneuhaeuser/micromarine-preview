(()=>{'use strict';const $=id=>document.getElementById(id),D=window.MicroMotionDemo;
const fullscreen=$('fullscreen');
const appMode=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(fullscreen&&(appMode||typeof document.documentElement.requestFullscreen!=='function'||document.fullscreenEnabled===false))fullscreen.hidden=true;
$('demoSettings').textContent='Einstellungen';$('demoSettings').onclick=()=>{$('stop').click();location.href='settings.html'};
$('demoReset').onclick=()=>{$('stop').click();D.reset();location.reload()};
document.querySelector('[data-profile="'+D.state.activeProfile+'"]')?.click();
const p=D.state.person;document.body.dataset.hand=p.hand;document.body.dataset.reducedMotion=String(p.reducedMotion);document.body.dataset.demoHideTelemetry=String(!D.model().telemetry);
if(D.message){const note=document.createElement('p');note.textContent=D.message;document.querySelector('.warning').append(note)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)$('stop').click()});window.addEventListener('blur',()=>$('stop').click());
})();
