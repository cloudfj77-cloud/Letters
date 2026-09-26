const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../miniprogram/utils/model');
const now=Date.UTC(2026,8,26,12);
function paired(){const s=M.initial(now);M.invite(s);s.role='b';M.accept(s);s.role='a';return s;}
test('distance uses great-circle coordinates and remains symmetric, including antipodes',()=>{
 assert.equal(M.distance({lat:0,lon:0},{lat:0,lon:0}),0);
 assert.ok(Math.abs(M.distance({lat:0,lon:0},{lat:0,lon:1})-111.195)<.001);
 assert.ok(Math.abs(M.distance({lat:0,lon:0},{lat:0,lon:180})-20015.114)<.01);
 const a=M.city('shanghai'),b=M.city('hangzhou');
 assert.ok(M.distance(a,b)>160&&M.distance(a,b)<170);
 assert.equal(M.distance(a,b),M.distance(b,a));
 assert.throws(()=>M.distance({lat:91,lon:0},b));
});
test('duration has no artificial lower or upper bound',()=>{
 assert.equal(M.durationMs(0,6),0);
 assert.equal(M.durationMs(.001,6),600);
 assert.equal(M.durationMs(10000,6),6000000000);
 assert.throws(()=>M.durationMs(2,0));assert.throws(()=>M.durationMs(-1,6));
});
test('courier speeds determine time, cross-sea horse routes are rejected',()=>{
 const slow=M.quote('hangzhou','shanghai','chestnut',now);
 const fast=M.quote('hangzhou','shanghai','white',now);
 assert.ok(Math.abs(slow.duration-2*fast.duration)<=1);
 assert.throws(()=>M.quote('shanghai','tokyo','white',now),/跨海/);
 assert.ok(M.quote('shanghai','tokyo','pigeon',now).duration>0);
});
test('a person cannot self-accept; unaccepted relationships cannot send',()=>{
 const s=M.initial(now);
 assert.throws(()=>M.send(s,'你好','white',now));
 M.invite(s);assert.throws(()=>M.accept(s));assert.throws(()=>M.invite(s));
 s.role='b';M.accept(s);assert.equal(s.relationship.status,'accepted');
});
test('sent position, speed and ETA are snapshots, not live references',()=>{
 const s=paired(),l=M.send(s,'一份心意','white',now),eta=l.arrivesAt;
 s.people.a.city='beijing';s.people.b.city='tokyo';
 assert.equal(l.from.id,'hangzhou');assert.equal(l.to.id,'shanghai');
 assert.equal(l.arrivesAt,eta);
 l.courier.speed=99;
 assert.equal(M.courier('white').speed,12);
});
test('recipient cannot read before arrival; exact arrival unlocks and moves inbox',()=>{
 const s=paired(),l=M.send(s,'只在抵达后阅读','white',now);
 s.role='b';
 assert.throws(()=>M.read(s,l.id,l.arrivesAt-1),/还在路上/);
 const road=M.list(s,'road',l.arrivesAt-1).find(x=>x.id===l.id);
 assert.ok(road);assert.equal('body' in road,false);
 assert.equal(M.read(s,l.id,l.arrivesAt).body,'只在抵达后阅读');
 assert.ok(!M.list(s,'road',l.arrivesAt).find(x=>x.id===l.id));
 assert.ok(M.list(s,'received',l.arrivesAt).find(x=>x.id===l.id));
});
test('mutual letters can cross and drafts clear only for the sender',()=>{
 const s=paired();s.drafts.a='给你';s.drafts.b='还没写完';
 const a=M.send(s,s.drafts.a,'chestnut',now);
 assert.equal(s.drafts.a,'');assert.equal(s.drafts.b,'还没写完');
 s.role='b';const b=M.send(s,'我也想到你','white',now+1000);
 assert.equal(a.toRole,b.fromRole);assert.equal(a.fromRole,b.toRole);
 assert.ok(M.list(s,'road',now+2000).find(x=>x.id===a.id));
});
test('invalid and empty input cannot create letters; state survives serialization',()=>{
 const s=paired(),n=s.letters.length;
 assert.throws(()=>M.send(s,'  ','white',now));assert.throws(()=>M.send(s,'字'.repeat(2001),'white',now));
 assert.equal(s.letters.length,n);
 const l=M.send(s,'正文\n第二行','white',now);
 assert.equal(M.load(JSON.stringify(s),now+1000).letters[0].arrivesAt,l.arrivesAt);
 assert.equal(M.load('broken json',now).version,1);
});
test('zero-distance delivery is immediately readable without minimum wait',()=>{
 const s=paired();s.people.b.city=s.people.a.city;
 const l=M.send(s,'就在身边','chestnut',now);s.role='b';
 assert.equal(l.arrivesAt,now);assert.equal(M.read(s,l.id,now).body,'就在身边');
});
