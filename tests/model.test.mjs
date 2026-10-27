import assert from 'node:assert/strict';
import {makeSessions,sessionFromId,places,occupied,createBooking,parseState,initiallyBusy,dogs} from '../model.js';
const sessions=makeSessions(new Date('2026-10-21T12:00:00'));
assert.equal(sessions.length,30);assert.equal(new Set(sessions.map(s=>s.id)).size,30);
for(const dog of dogs)for(const location of ['studio','garden'])assert.equal(sessions.filter(s=>s.dog===dog.id&&s.location===location).length,3);
assert.equal(sessions[0].date,'2026-10-22');assert.equal(makeSessions(new Date('2026-10-22T12:00:00'))[0].date,'2026-10-23');
assert.deepEqual(sessionFromId(sessions[0].id),sessions[0]);assert.equal(sessionFromId('2026-02-31_ponchik_studio'),null);assert.equal(sessionFromId('<script>'),null);
const s=sessions[0],next=sessions[1],p=places('studio');assert.equal(p.length,8);assert.equal(p.filter(p=>p.price===1500).length,3);assert.equal(p.filter(p=>p.price<=1200&&p.zone===0).length,1);
for(const seats of [[],[0],[9],[1,1],[1,3,4],['1'],[1.5],[2]])assert.throws(()=>createBooking(s,seats,[],'MM-TEST1'));
const b=createBooking(s,[1,3],[],'MM-TEST1');assert.equal(b.total,2700);assert.deepEqual(b.seats,[1,3]);
assert.equal(occupied(s.id,[b]).size,4);assert.equal(occupied(next.id,[b]).size,2);assert.throws(()=>createBooking(s,[1],[b],'MM-TEST2'));
const other=createBooking(next,[1],[b],'MM-TEST2');assert.equal(other.total,1500);
const raw=JSON.stringify({version:1,bookings:[b,other]});assert.deepEqual(parseState(raw),[b,other]);assert.deepEqual(parseState(null),[]);
for(const raw of ['broken','{}','null','{"version":1,"bookings":{}}',JSON.stringify({version:1,bookings:[{...b,total:1}]}),JSON.stringify({version:1,bookings:[b,b]}),JSON.stringify({version:1,bookings:[{...b,id:'<script>'}]})])assert.throws(()=>parseState(raw));
const cancelled=[b,other].filter(v=>v.id!==b.id);assert.deepEqual([...occupied(s.id,cancelled)],initiallyBusy);assert.equal(createBooking(s,[1],cancelled,'MM-REBOOK').total,1500);assert.equal(occupied(next.id,cancelled).size,3);
assert.equal(parseState(raw)[0].date,'2026-10-22');
console.log('PASS: расписание, календарные ID, выбор и тарифы, ошибки, занятость по сеансам, сохранение, отмена и повторная бронь.');

