import {startIdleMotion} from './idle-motion.js';
import {animateApproval,cancelApproval} from './motion.js';
import {ticketHTML,detailRows} from './tickets.js';
import {KEY,dogs,locations,money,makeSessions,places,occupied,createBooking,parseState,pug,photo,rigPhoto} from './model.js';
const $=id=>document.getElementById(id);
const sessions=makeSessions();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let dogIndex=0,loc='studio',sessionId='',selected=[],bookings=[],step=1,paidTicket=null;
let confirming=false,matchBusy=false,storageAvailable=true,noticeTimer,matchTimer,lastFocus;
let flowVisible=false;
const dog=()=>dogs[dogIndex];
const location=()=>locations.find(l=>l.id===loc);
const session=()=>sessions.find(s=>s.id===sessionId);
const dateLabel=(date,long=false)=>new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',...(long?{weekday:'short'}:{})});
const companion=d=>({ponchik:'Пончиком',businka:'Бусинкой',persik:'Персиком',trufel:'Трюфелем',pugovka:'Пуговкой'})[d.id];
const chosen=()=>places(loc).filter(p=>selected.includes(p.id));
const total=()=>chosen().reduce((sum,p)=>sum+p.price,0);
function tell(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,4500)}
function warning(message){$('storage-warning').textContent=message;$('storage-warning').hidden=false}
function read(){if(!storageAvailable)return null;try{return parseState(localStorage.getItem(KEY))}catch{storageAvailable=false;warning('Не удалось прочитать сохранённые брони. Новые записи останутся в этом окне. Сброс демо восстановит сохранение.');return null}}
function save(){if(!storageAvailable){warning('Сохранение недоступно: бронь останется только до обновления страницы. Сохрани билет через печать.');return false}try{localStorage.setItem(KEY,JSON.stringify({version:1,bookings}));$('storage-warning').hidden=true;return true}catch{storageAvailable=false;warning('Сохранение недоступно: бронь останется только до обновления страницы. Сохрани билет через печать.');return false}}
bookings=read()??[];

function renderDog(){
 $('character').innerHTML=rigPhoto(dog());$('side-prev').innerHTML=pug(dogs[(dogIndex+dogs.length-1)%dogs.length]);$('side-next').innerHTML=pug(dogs[(dogIndex+1)%dogs.length]);
 $('dog-name').textContent=dog().name;$('dog-counter').textContent=`${String(dogIndex+1).padStart(2,'0')} / ${String(dogs.length).padStart(2,'0')}`;
 $('dog-tags').innerHTML=dog().tags.map(t=>`<span>${t}</span>`).join('');$('dog-quote').textContent=`«${dog().quote}»`;
 $('dog-dots').innerHTML=dogs.map((d,i)=>`<button data-dog="${i}" aria-label="Выбрать: ${d.name}" aria-pressed="${i===dogIndex}"><span>${String(i+1).padStart(2,'0')}</span></button>`).join('');
 $('session-dog').textContent=`Встреча с ${companion(dog())}`;
}
function chooseDog(index){if(confirming)return;const had=selected.length;dogIndex=(index+dogs.length)%dogs.length;selected=[];paidTicket=null;step=1;renderDog();updateSessions();renderStep(false);if(had)tell('Напарник изменён. Коврики сброшены — выбери места на новой встрече.')}
function renderLocations(){
 $('locations').innerHTML=locations.map(l=>`<button class="location ${l.id===loc?'active':''}" data-location="${l.id}" aria-pressed="${l.id===loc}"><img src="./assets/${l.image}" alt="${l.name}" width="700" height="440" loading="lazy"><span class="location-check" aria-hidden="true">${l.id===loc?'✓':'+'}</span><span class="location-copy"><strong>${l.name}</strong><span>${l.desc}</span></span></button>`).join('');
}
function updateSessions(keepDate){
 const available=sessions.filter(s=>s.dog===dog().id&&s.location===loc);
 sessionId=(available.find(s=>s.date===keepDate)??available.find(s=>occupied(s.id,bookings).size<8)??available[0])?.id??'';
 $('zone').innerHTML='<option value="all">Все зоны</option>'+location().zones.map((z,i)=>`<option value="${i}">${z}</option>`).join('');$('price').value='1500';
 renderLocations();renderSchedule();renderPlaces();
}
function renderSchedule(){
 const available=sessions.filter(s=>s.dog===dog().id&&s.location===loc),current=session();
 $('dates').innerHTML=available.map(s=>`<button class="date-chip ${s.id===sessionId?'active':''}" data-session="${s.id}" aria-pressed="${s.id===sessionId}" ${occupied(s.id,bookings).size===8?'disabled':''}><strong>${dateLabel(s.date)}</strong><span>${new Date(s.date+'T12:00').toLocaleDateString('ru-RU',{weekday:'long'})}</span></button>`).join('');
 $('times').innerHTML=current?`<button class="time-chip active" aria-pressed="true" ${occupied(sessionId,bookings).size===8?'disabled':''}>${current.time} <span>— ${String(Number(current.time.slice(0,2))+1).padStart(2,'0')}:00</span><small>${8-occupied(sessionId,bookings).size} свободных мест</small></button>`:'<p>Встреч пока нет.</p>';
}
function visiblePlaces(){return places(loc).filter(p=>($('zone').value==='all'||p.zone===Number($('zone').value))&&p.price<=Number($('price').value))}
function renderPlaces(){
 const busy=occupied(sessionId,bookings),visible=visiblePlaces(),ids=new Set(visible.map(p=>p.id));
 $('map').classList.toggle('garden',loc==='garden');$('map-name').textContent=location().name+' · вид сверху';$('map-edge').textContent=loc==='studio'?'ПАНОРАМНЫЕ ОКНА':'ТЕНЬ ДЕРЕВЬЕВ';$('found').textContent=`Показано ${visible.length} из 8`;$('empty-filter').hidden=visible.length>0;
 $('mats').innerHTML=places(loc).map(p=>{const b=busy.has(p.id),sel=selected.includes(p.id),state=b?'Занято':sel?'Выбрано':'Свободно';return `<div class="mat-slot ${ids.has(p.id)?'':'filtered'}"><button class="mat ${b?'occupied':''} ${sel?'selected':''} ${p.premium?'premium':''}" data-seat="${p.id}" aria-label="Коврик ${p.id}, ${location().zones[p.zone]}, ${money(p.price)}, ${state}" aria-pressed="${sel}" ${b?'disabled':''} ${ids.has(p.id)?'':'tabindex="-1" aria-hidden="true"'}><strong>${sel?'✓':b?'×':p.id}</strong><span class="mat-texture" aria-hidden="true"></span></button><span class="mat-caption">№ ${p.id} · ${state}</span></div>`}).join('');
 $('mat-list').innerHTML=visible.map(p=>{const b=busy.has(p.id),sel=selected.includes(p.id);return `<button class="list-mat ${b?'occupied':''} ${sel?'selected':''}" data-seat="${p.id}" aria-pressed="${sel}" aria-label="Коврик ${p.id}, ${b?'занято':sel?'выбрано':'свободно'}" ${b?'disabled':''}><span class="list-number">${sel?'✓':p.id}</span><span><strong>Коврик № ${p.id}</strong><small>${location().zones[p.zone]}</small><small>${b?'Занято':sel?'Выбрано':p.premium?'Больше пространства':'Стандартное'}</small></span><span class="list-price">${money(p.price)}</span></button>`}).join('');
 $('participant-count').textContent=`${selected.length} / 2 места`;renderSummary();renderActions();
}
function renderSummary(){
 const s=session();$('summary-dog').innerHTML=pug(dog());$('summary-title').textContent=dog().name+' ждёт';$('summary-mood').textContent=dog().mood;
 $('summary-details').innerHTML=s?detailRows(s,selected):'';
 $('selected-mats').innerHTML=chosen().map(p=>`<div class="selected-row"><span>Коврик № ${p.id}</span><span>${money(p.price)}</span></div>`).join('')||'Выбери коврик на следующем шаге.';
 $('total').textContent=money(total());if(step===3&&s)$('review').innerHTML=`<dl class="review-details">${detailRows(s,selected,total())}</dl><button data-edit="2" class="text-button">Изменить коврики</button>`;
}
function renderActions(){
 const labels={1:'Выбрать коврики →',2:`Продолжить · ${money(total())}`,3:`Оплатить в демо · ${money(total())}`};
 $('continue').textContent=confirming?'Подтверждаем встречу…':labels[step]||'Готово';$('mobile-next').textContent=confirming?'Подтверждаем…':step===1?'Выбрать коврики →':step===2?'Продолжить →':'Оплатить в демо →';
 const disabled=confirming||(step===1&&(!session()||occupied(sessionId,bookings).size===8))||(step>1&&step<4&&!selected.length);
 $('continue').disabled=disabled;$('mobile-next').disabled=disabled;
 $('mobile-total').textContent=selected.length?money(total()):'от 1 200 ₽';$('mobile-caption').textContent=step===1?'Твоя встреча':`${selected.length} ${selected.length===1?'коврик':selected.length===0?'ковриков':'коврика'}`;
 $('back-step').hidden=step===1;$('flow-actions').hidden=step===4;
 $('mobile-bar').hidden=!flowVisible||step===4;
 document.querySelectorAll('[data-step]').forEach(b=>{const n=Number(b.dataset.step);b.disabled=confirming||n>step;b.classList.toggle('done',n<step);if(n===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
}
function renderStep(focus=true){
 for(let n=1;n<=4;n++)$('step-'+n).hidden=n!==step;
 document.querySelector('.summary').hidden=step===4;document.querySelector('.booking-layout').classList.toggle('show-ticket',step===4);
 $('booking-error').textContent='';renderSummary();renderActions();
 if(focus){$('meeting').scrollIntoView({behavior:'instant',block:'start'});$('step-title-'+step).focus({preventScroll:true})}
}
function goStep(n){if(confirming||n>step)return;if(step===4&&n<4){cancelApproval();paidTicket=null;selected=[];n=1;renderPlaces()}step=n;renderStep()}
function toggleSeat(id,fromList){
 if(confirming)return;$('booking-error').textContent='';if(occupied(sessionId,bookings).has(id)){tell('Этот коврик занят. Выбери свободный.');return}
 if(selected.includes(id))selected=selected.filter(n=>n!==id);else if(selected.length===2){$('booking-error').textContent='Для одной брони можно выбрать максимум два коврика.';return}else selected.push(id);
 renderPlaces();(fromList?$('mat-list'):$('mats')).querySelector(`[data-seat="${id}"]`)?.focus({preventScroll:true});
}
function applyFilters(){$('booking-error').textContent='';const ids=new Set(visiblePlaces().map(p=>p.id));if(selected.some(n=>!ids.has(n))){selected=[];tell('Коврики сброшены: они не соответствуют фильтрам.')}renderPlaces()}
function resetFilters(){$('zone').value='all';$('price').value='1500';renderPlaces()}

function openModal(){if(!$('modal').open){lastFocus=document.activeElement;$('modal').showModal()}$('close-modal').focus()}
function closeModal(){clearTimeout(matchTimer);matchBusy=false;$('match').disabled=false;cancelApproval();$('modal').close();lastFocus?.focus({preventScroll:true})}
$('close-modal').onclick=closeModal;$('modal').addEventListener('cancel',e=>{e.preventDefault();closeModal()});
function ask(title,body,label,action){$('modal').classList.remove('wide-modal');$('modal-content').innerHTML=`<h2 id="modal-title">${title}</h2><p>${body}</p><div class="modal-actions"><button class="button primary" id="ask-yes">${label}</button><button class="button outline" id="ask-no">Вернуться</button></div>`;openModal();$('ask-yes').onclick=()=>{action();closeModal()};$('ask-no').onclick=closeModal}
function startMatch(){
 if(matchBusy||confirming)return;const possible=dogs.filter(d=>sessions.some(s=>s.dog===d.id&&occupied(s.id,bookings).size<8));if(!possible.length){tell('Все встречи заняты. Загляни позже.');return}
 matchBusy=true;$('match').disabled=true;$('modal').classList.remove('wide-modal');$('modal-content').innerHTML=`<h2 id="modal-title">Кто-то присматривается…</h2><div class="match-loading">${dogs.slice(0,3).map(d=>`<div>${pug(d)}</div>`).join('')}</div><p>Мопсы принимают важное решение.</p>`;openModal();
 const picked=possible[Math.floor(Math.random()*possible.length)];matchTimer=setTimeout(()=>{matchBusy=false;$('match').disabled=false;$('modal-content').innerHTML=`<span class="eyebrow">КАЖЕТСЯ, ЭТО СУДЬБА</span><div class="modal-dog">${pug(picked)}</div><h2 id="modal-title">Тебя ${['businka','pugovka'].includes(picked.id)?'выбрала':'выбрал'} ${picked.name}</h2><p>${picked.match}</p><div class="modal-actions"><button class="button primary" id="accept-match">Пойти с ${companion(picked)} ↗</button><button class="button outline" id="retry-match">Ещё раз</button></div>`;
 $('accept-match').onclick=()=>{chooseDog(dogs.indexOf(picked));const s=sessions.find(s=>s.dog===picked.id&&occupied(s.id,bookings).size<8);loc=s.location;updateSessions(s.date);sessionId=s.id;renderSchedule();renderPlaces();closeModal();renderStep()};$('retry-match').onclick=startMatch;$('accept-match').focus();},reduced()?0:1200);
}
function wireTicket(root,b,play){
 root.querySelector('[data-replay]').onclick=()=>animateApproval(root,false,null,true);
 root.querySelector('[data-my-bookings]').onclick=()=>{if($('modal').open)closeModal();$('bookings').scrollIntoView({behavior:'instant'});$('bookings').querySelector('[data-ticket]')?.focus({preventScroll:true})};
 root.querySelector('[data-new]').onclick=()=>{if($('modal').open)closeModal();cancelApproval();step=1;selected=[];paidTicket=null;renderPlaces();renderStep()};
 root.querySelector('[data-print]').onclick=()=>printTicket(root);
 if(play)animateApproval(root);else animateApproval(root,true)
}
function printTicket(root){document.querySelectorAll('.print-target').forEach(e=>e.classList.remove('print-target'));root.classList.add('print-target');window.print()}
function showTicket(b){$('modal').classList.add('wide-modal');$('modal-content').innerHTML=ticketHTML(b);openModal();wireTicket($('modal-content'),b,false)}
async function pay(){
 if(confirming)return;if(!selected.length){$('booking-error').textContent='Сначала выбери один или два коврика.';return}
 confirming=true;renderActions();const seats=[...selected],s=session();
 try{
  await new Promise(resolve=>setTimeout(resolve,reduced()?0:650));
  const fresh=read();if(fresh!==null)bookings=fresh;
  const b=createBooking(s,seats,bookings,`MM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`);
  bookings.push(b);save();paidTicket=b;renderBookings();renderSchedule();step=4;renderStep();$('inline-ticket').innerHTML=ticketHTML(b);wireTicket($('inline-ticket'),b,true);
 }catch(e){$('booking-error').textContent=e.message;selected=selected.filter(n=>!occupied(sessionId,bookings).has(n));renderPlaces();renderBookings()}
 finally{confirming=false;renderActions()}
}
function nextStep(){if(confirming)return;if(step===3){pay();return}if(step===1&&(!session()||occupied(sessionId,bookings).size===8)){tell('Выбери встречу со свободными ковриками.');return}if(step===2&&!selected.length){$('booking-error').textContent='Выбери один или два коврика.';return}step++;renderStep()}
function renderBookings(){
 $('book-count').textContent=bookings.length;
 $('booking-list').innerHTML=bookings.length?bookings.map(b=>{const d=dogs.find(d=>d.id===b.dog),l=locations.find(l=>l.id===b.location);return `<article class="booking-card"><div class="mini-dog">${pug(d)}</div><div><h3>Встреча с ${companion(d)}</h3><p>${l.name} · ${dateLabel(b.date)} · ${b.time}</p><p>Коврики № ${b.seats.join(', ')} · ${money(b.total)}</p><small>${b.id}</small></div><div class="booking-actions"><button class="button outline" data-ticket="${b.id}">Билет ↗</button><button class="text-button" data-cancel="${b.id}">Отменить</button></div></article>`}).join(''):'<div class="empty-bookings"><span aria-hidden="true">✳</span><div><h3>Пока никаких планов.</h3><p>Твой первый большой выдох начинается с маленькой встречи.</p><a href="#meeting" class="text-button">Выбрать встречу ↗</a></div></div>';
}
$('prev').onclick=$('side-prev').onclick=()=>chooseDog(dogIndex-1);$('next').onclick=$('side-next').onclick=()=>chooseDog(dogIndex+1);
$('dog-dots').onclick=e=>{const b=e.target.closest('[data-dog]');if(b)chooseDog(Number(b.dataset.dog))};
$('character').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();chooseDog(dogIndex+(e.key==='ArrowRight'?1:-1))}};
let touchX;$('character').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});$('character').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>40)chooseDog(dogIndex+(dx<0?1:-1))},{passive:true});
$('locations').onclick=e=>{const b=e.target.closest('[data-location]');if(!b||b.dataset.location===loc||confirming)return;const date=session()?.date,had=selected.length;loc=b.dataset.location;selected=[];updateSessions(date);$('locations').querySelector(`[data-location="${loc}"]`)?.focus({preventScroll:true});if(had)tell('Локация изменена. Выбери коврики заново.')};
$('dates').onclick=e=>{const b=e.target.closest('[data-session]');if(!b||b.dataset.session===sessionId||confirming)return;const had=selected.length;sessionId=b.dataset.session;selected=[];renderSchedule();renderPlaces();$('dates').querySelector(`[data-session="${sessionId}"]`)?.focus({preventScroll:true});if(had)tell('Дата изменена. Выбор ковриков сброшен.')};
$('zone').onchange=$('price').onchange=applyFilters;$('reset-filter').onclick=$('empty-reset').onclick=resetFilters;
$('mats').onclick=e=>{const b=e.target.closest('[data-seat]');if(b)toggleSeat(Number(b.dataset.seat),false)};$('mat-list').onclick=e=>{const b=e.target.closest('[data-seat]');if(b)toggleSeat(Number(b.dataset.seat),true)};
$('continue').onclick=$('mobile-next').onclick=nextStep;$('back-step').onclick=()=>goStep(step-1);
$('meeting').addEventListener('click',e=>{const b=e.target.closest('[data-step],[data-edit]');if(b&&!b.disabled)goStep(Number(b.dataset.step||b.dataset.edit))});
$('match').onclick=startMatch;
$('booking-list').onclick=e=>{const t=e.target.closest('[data-ticket]'),c=e.target.closest('[data-cancel]');if(t){const b=bookings.find(b=>b.id===t.dataset.ticket);if(b)showTicket(b)}if(c)ask('Отменить встречу?','Твои коврики снова станут свободными. Записаться заново можно в любое время.','Да, отменить',()=>{const fresh=read();if(fresh!==null)bookings=fresh;bookings=bookings.filter(b=>b.id!==c.dataset.cancel);save();if(paidTicket?.id===c.dataset.cancel){step=1;selected=[];paidTicket=null;renderStep(false)}renderBookings();renderSchedule();renderPlaces();tell('Бронь отменена. Коврики снова свободны.')})};
$('reset-demo').onclick=()=>ask('Начать с чистого коврика?','Удалятся только учебные брони этого сайта. Демонстрационные занятые места останутся.','Сбросить демо',()=>{bookings=[];selected=[];paidTicket=null;step=1;try{localStorage.removeItem(KEY);storageAvailable=true;$('storage-warning').hidden=true}catch{warning('Демо сброшено только в этом окне: хранилище недоступно.')}renderBookings();renderSchedule();renderPlaces();renderStep(false);tell('Можно планировать новую встречу.')});
window.addEventListener('storage',e=>{if(e.key===KEY){const fresh=read();if(fresh!==null){bookings=fresh;const before=selected.length;selected=selected.filter(n=>!occupied(sessionId,bookings).has(n));if(step<4&&before!==selected.length){step=2;renderStep(false);tell('Коврик заняли в другом окне. Выбери другой.')}renderBookings();renderSchedule();renderPlaces()}}});
renderDog();updateSessions();renderBookings();renderStep(false);
new IntersectionObserver(entries=>{flowVisible=entries[0].isIntersecting;renderActions()},{threshold:0,rootMargin:'-50px 0px -80px 0px'}).observe($('meeting'));
for(const d of dogs){const img=new Image();img.src=photo(d)}

function setMotion(enabled){document.body.classList.toggle('motion-enabled',enabled);$('motion-toggle').setAttribute('aria-pressed',String(enabled));$('motion-toggle').textContent=enabled?'Ⅱ Приостановить движения':'▷ Оживить мопсов';try{localStorage.setItem('mops-motion',enabled?'on':'off')}catch{}}
let motionOn=true;try{motionOn=localStorage.getItem('mops-motion')!=='off'}catch{}
setMotion(motionOn);$('motion-toggle').onclick=()=>setMotion(!document.body.classList.contains('motion-enabled'));
startIdleMotion();
