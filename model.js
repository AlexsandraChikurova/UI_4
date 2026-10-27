export const KEY='mops-mat:v1';
export const dogs=[
{id:'ponchik',name:'Пончик',coat:'#c8a87a',face:'#53463a',light:'#e7d0aa',shirt:'#8f9b77',mood:'Медленная йога',tags:['спокойный','немного философ'],quote:'Спешить? Я такого слова не знаю',match:'Он никуда не спешит. И тебе разрешает.',habit:'Любит лежать на самом краешке коврика.'},
{id:'businka',name:'Бусинка',coat:'#444742',face:'#292c29',light:'#77796e',shirt:'#d8a69b',mood:'Знакомство и общение',tags:['общительная','любит знакомиться'],quote:'Сначала познакомимся!',match:'Она уже придумала, как с тобой подружиться.',habit:'Всегда первой приходит знакомиться.'},
{id:'persik',name:'Персик',coat:'#e0c49b',face:'#645044',light:'#f1ddbd',shirt:'#c89979',mood:'Расслабление',tags:['сонный','профессионал отдыха'],quote:'Главное упражнение — полежать',match:'Он уже устал, хотя ещё ничего не началось.',habit:'План Персика — занять половину твоего коврика.'},
{id:'trufel',name:'Трюфель',coat:'#706354',face:'#3b3831',light:'#a8977b',shirt:'#86988a',mood:'Разминка и игры',tags:['игривый','главный исследователь'],quote:'Проверю каждый коврик',match:'Он проверил все варианты. Ты — лучший.',habit:'Считает каждый коврик новым открытием.'},
{id:'pugovka',name:'Пуговка',mood:'Спокойное знакомство',tags:['нежная','немного любопытная'],quote:'Можно я посижу рядом?',match:'У неё маленький бантик и большие планы на дружбу.',habit:'Любит слушать, наклонив голову набок.'}
];
export const locations=[{id:'studio',name:'Тёплая студия',image:'studio.jpeg',desc:'Большие окна, деревянный пол и мягкий дневной свет.',zones:['У окна','Ближе к инструктору','Свободная зона']},{id:'garden',name:'Тихий сад',image:'garden.jpeg',desc:'Зелень, свежий воздух и время, которое никуда не спешит.',zones:['В тени','Ближе к инструктору','Открытая лужайка']}];
export const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
export function dateKey(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
export function sessionFromId(id){if(typeof id!=='string')return null;const m=id.match(/^(\d{4}-\d{2}-\d{2})_(ponchik|businka|persik|trufel|pugovka)_(studio|garden)$/);if(!m)return null;const date=new Date(m[1]+'T12:00:00');if(Number.isNaN(+date)||dateKey(date)!==m[1])return null;return {id,date:m[1],dog:m[2],location:m[3],time:['09:00','11:00','13:00','15:00','17:00'][dogs.findIndex(d=>d.id===m[2])],duration:60}}
export function makeSessions(now=new Date()){const out=[];for(let offset=1;offset<=3;offset++){const date=new Date(now);date.setDate(date.getDate()+offset);for(const dog of dogs)for(const loc of locations)out.push(sessionFromId(`${dateKey(date)}_${dog.id}_${loc.id}`))}return out}
export function places(location){return Array.from({length:8},(_,i)=>{const id=i+1;return {id,zone:id<=2?0:id<=4?1:2,price:[1,4,8].includes(id)?1500:1200,premium:[1,4,8].includes(id),location}})}
export const initiallyBusy=[2,7];
export function occupied(sessionId,bookings){return new Set([...initiallyBusy,...bookings.filter(b=>b.sessionId===sessionId).flatMap(b=>b.seats)])}
export function createBooking(session,seatIds,bookings,id){if(!session)throw Error('Сначала выбери встречу.');if(!Array.isArray(seatIds)||!seatIds.length)throw Error('Выбери один или два коврика на схеме или в списке.');if(seatIds.length>2||new Set(seatIds).size!==seatIds.length||seatIds.some(n=>!Number.isInteger(n)||n<1||n>8))throw Error('Можно выбрать один или два разных коврика.');if(seatIds.some(n=>occupied(session.id,bookings).has(n)))throw Error('Одно из мест уже занято. Выбери другое.');return {id,sessionId:session.id,dog:session.dog,location:session.location,date:session.date,time:session.time,seats:[...seatIds].sort((a,b)=>a-b),total:places(session.location).filter(p=>seatIds.includes(p.id)).reduce((n,p)=>n+p.price,0)}}
export function parseState(raw){if(raw===null)return [];const state=JSON.parse(raw);if(state?.version!==1||!Array.isArray(state.bookings)||state.bookings.length>500)throw Error('Неверный формат');const out=[];for(const b of state.bookings){if(!b||typeof b.id!=='string'||!/^MM-[A-Z0-9-]{4,70}$/.test(b.id)||out.some(v=>v.id===b.id))throw Error('Неверная бронь');const s=sessionFromId(b.sessionId);const rebuilt=createBooking(s,b.seats,out,b.id);if(rebuilt.total!==b.total||rebuilt.date!==b.date||rebuilt.dog!==b.dog||rebuilt.location!==b.location||rebuilt.time!==b.time)throw Error('Неверные данные брони');out.push(rebuilt)}return out}
export const photo = dog => `./assets/${dog.id}-cutout.png`;
export function pug(dog){return `<img class="pug-photo" src="${photo(dog)}" alt="Мопс ${dog.name}" draggable="false" width="1024" height="1024">`}

// Local motion regions; the complete original photograph is always retained.
export const rigs={
 ponchik:{kind:'ear',pivot:[.33,.10],region:[[.25,.08],[.39,.035],[.38,.14],[.29,.22],[.25,.18]],pawTip:[.55,.94],angle:-60,pawPivot:[.61,.65],paw:[[.53,.64],[.63,.64],[.65,.76],[.63,.88],[.61,.97],[.48,.97],[.47,.91],[.51,.83],[.52,.72]]},
 businka:{kind:'head',pivot:[.51,.51],region:[[.19,.02],[.87,.02],[.91,.34],[.77,.53],[.42,.57],[.23,.47]],pawTip:[.59,.94],angle:-65,pawPivot:[.62,.74],paw:[[.57,.72],[.72,.74],[.72,.99],[.50,.99],[.49,.88]]},
 persik:{kind:'paw',pivot:[.65,.36],region:[[.64,.34],[.74,.35],[.90,.39],[.89,.48],[.75,.48],[.64,.44]],pawTip:[.83,.44],angle:25,pawPivot:[.65,.36],paw:[[.64,.34],[.74,.35],[.90,.39],[.89,.48],[.75,.48],[.64,.44]]},
 trufel:{kind:'head',pivot:[.54,.43],region:[[.29,.02],[.74,.02],[.77,.25],[.75,.40],[.63,.45],[.42,.45],[.28,.35]],pawTip:[.76,.86],angle:-65,pawPivot:[.67,.62],paw:[[.63,.60],[.72,.61],[.77,.78],[.84,.88],[.82,.94],[.69,.95],[.68,.84]]},
 pugovka:{kind:'ear',pivot:[.36,.23],region:[[.28,.24],[.35,.20],[.39,.22],[.36,.34],[.31,.36],[.28,.31]],pawTip:[.735,.80],angle:-50,pawPivot:[.61,.58],paw:[[.58,.57],[.66,.59],[.71,.68],[.78,.74],[.79,.84],[.69,.86],[.62,.76]]}
};
// Whole photographs are retained. A soft displacement field moves only a small region.
export function rigPhoto(dog,mode='idle'){
 const rig=rigs[dog.id],id=`photo-warp-${dog.id}-${mode}`;
 const region=mode==='stamp'?rig.paw:rig.region;
 const center=mode==='stamp'?rig.pawTip:region.reduce((a,p)=>[a[0]+p[0]/region.length,a[1]+p[1]/region.length],[0,0]);
 const cx=center[0]*100,cy=center[1]*100;
 const rx=mode==='stamp'?24:rig.kind==='head'?29:12,ry=mode==='stamp'?36:rig.kind==='head'?27:18;
 const field=`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><radialGradient id="g"><stop offset="0" stop-color="#80ff80"/><stop offset="1" stop-color="#808080"/></radialGradient></defs><rect width="100" height="100" fill="#808080"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/></svg>`;
 const map='data:image/svg+xml,'+encodeURIComponent(field);
 return `<span class="photo-rig ${mode==='idle'?'idle-rig':'stamp-rig'}" data-rig="${dog.id}" role="img" aria-label="Мопс ${dog.name}"><svg class="rig-defs" aria-hidden="true"><defs><filter id="${id}" x="-.1" y="-.1" width="1.2" height="1.2" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB"><feImage href="${map}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="movement"/><feDisplacementMap in="SourceGraphic" in2="movement" scale="0" xChannelSelector="R" yChannelSelector="G" data-paw-deform></feDisplacementMap></filter></defs></svg><img class="pug-photo ${mode==='stamp'?'dog-body':''}" src="${photo(dog)}" alt="" style="--dog-filter:url(#${id});${mode==='stamp'?`filter:url(#${id})`:''}"></span>`;
}

