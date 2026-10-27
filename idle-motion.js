import {rigs} from './model.js';
// Keep the entire original photo visible while gently displacing a local region.
export function startIdleMotion(){let last=0;function tick(now){if(now-last>32){last=now;const active=document.body.classList.contains('motion-enabled')&&!document.hidden;document.querySelectorAll('.idle-rig').forEach(el=>{const r=rigs[el.dataset.rig],filter=el.querySelector('[data-paw-deform]'),phase=(now/1000)%5.4;const gesture=phase<1.25?Math.sin(phase/1.25*Math.PI*2)*Math.sin(phase/1.25*Math.PI):0;filter?.setAttribute('scale',String(active?gesture*(r.kind==='head'?.045:.055):0));});}requestAnimationFrame(tick);}requestAnimationFrame(tick);}

