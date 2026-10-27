import {rigs} from './model.js';
let controller;
export const cancelApproval=()=>controller?.abort();
export async function animateApproval(root,instant=false,atTime=null,force=false){
 cancelApproval();controller=new AbortController();const {signal}=controller;
 const scene=root.querySelector('[data-scene]'),caption=root.querySelector('[data-approval-caption]'),replay=root.querySelector('[data-replay]');if(!scene)return;
 const body=scene.querySelector('.stamp-dog'),deform=scene.querySelector('[data-paw-deform]'),ink=scene.querySelector('.paw-stamp'),area=scene.querySelector('.stamp-area'),rig=rigs[scene.dataset.dog];
 let animations=[],frameId;
 const finish=()=>{deform.setAttribute('scale','0');scene.classList.add('approved');caption.classList.add('visible');replay.disabled=false};
 signal.addEventListener('abort',()=>{cancelAnimationFrame(frameId);animations.forEach(a=>a.cancel());finish()},{once:true});
 scene.classList.remove('approved');caption.classList.remove('visible');replay.disabled=true;
 try{await scene.querySelector('.dog-body').decode()}catch{finish();return}if(signal.aborted)return;
 const sr=body.parentElement.getBoundingClientRect(),br=body.getBoundingClientRect();
 area.style.left=(br.left-sr.left+rig.pawTip[0]*br.width-23)+'px';area.style.top=(br.top-sr.top+rig.pawTip[1]*br.height-20)+'px';
 if(instant||(!force&&!Number.isFinite(atTime)&&!document.body.classList.contains('motion-enabled'))){finish();return}
 const opts={duration:3200,fill:'none',easing:'linear'};
 const lean=body.animate([{transform:'translateY(0) rotate(0deg)',offset:0},{transform:'translateY(-5px) rotate(-3deg)',offset:.22},{transform:'translateY(-10px) rotate(-2deg)',offset:.42},{transform:'translateY(3px) rotate(1deg)',offset:.58},{transform:'translateY(3px) rotate(1deg)',offset:.69},{transform:'translateY(0) rotate(0deg)',offset:.92},{transform:'none',offset:1}],opts);animations.push(lean);
 animations.push(ink.animate([{opacity:0,transform:'rotate(-18deg) scale(.6)',offset:0},{opacity:0,transform:'rotate(-18deg) scale(.6)',offset:.575},{opacity:.85,transform:'rotate(-18deg) scale(1.15)',offset:.61},{opacity:.85,transform:'rotate(-18deg) scale(1)',offset:.72},{opacity:.85,transform:'rotate(-18deg) scale(1)',offset:1}],opts));
 const keys=[[0,0],[.18,0],[.42,.065],[.58,0],[.69,0],[.80,.025],[.92,0],[1,0]];
 function pose(t){const p=Math.min(1,t/3200);let v=0;for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){const [a,x]=keys[i-1],[b,y]=keys[i];v=x+(y-x)*(p-a)/(b-a);break}deform.setAttribute('scale',String(v))}
 if(Number.isFinite(atTime)){animations.forEach(a=>{a.pause();a.currentTime=atTime});pose(atTime);if(atTime>=3200)finish();replay.disabled=false;return}
 const started=performance.now();function tick(now){if(signal.aborted)return;const t=now-started;pose(t);if(t<3200)frameId=requestAnimationFrame(tick)}frameId=requestAnimationFrame(tick);
 try{await lean.finished;if(!signal.aborted)finish()}catch{}
}


