/* Shared by the native mini program and the browser preview. No backend in v0.1. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Chema = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const HORSE_SOURCE = 'https://equipedia.ifce.fr/en/equipedia-the-universe-of-the-horse-ifce/equestrian-instruction-and-teaching/didactics-and-equestrian-techniques/interdisciplinary-principles/the-horses-gaits-definitions-and-figures';
  const PIGEON_SOURCE = 'https://www.pigeonracinguk.co.uk/about/pigeon-facts/';
  const CITIES = [
    { id:'hangzhou', name:'杭州', lat:30.2741, lon:120.1551, land:'mainland' },
    { id:'shanghai', name:'上海', lat:31.2304, lon:121.4737, land:'mainland' },
    { id:'shenzhen', name:'深圳', lat:22.5431, lon:114.0579, land:'mainland' },
    { id:'beijing', name:'北京', lat:39.9042, lon:116.4074, land:'mainland' },
    { id:'tokyo', name:'东京', lat:35.6762, lon:139.6503, land:'japan' }
  ];
  // Speeds are references to gaits / racing flight, not claims of sustained endurance.
  const COURIERS = [
    {id:'chestnut',name:'小栗',kind:'小马',speed:6,pace:'常步参考速度',tag:'不疾不徐',desc:'把想说的话，稳稳地带给远方的人。',source:HORSE_SOURCE,asset:'horse-chestnut.svg'},
    {id:'white',name:'照夜',kind:'小马',speed:12,pace:'快步参考速度',tag:'轻快一点',desc:'穿过长长的路，把今天的心事捎给你。',source:HORSE_SOURCE,asset:'horse-white.svg'},
    {id:'pigeon',name:'小鸽',kind:'信鸽',speed:80.4672,pace:'赛鸽平均速度参考（50 mph）',tag:'越过山海',desc:'有些距离，需要一双翅膀。',source:PIGEON_SOURCE,asset:'pigeon.svg'}
  ];
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const city = id => CITIES.find(c=>c.id===id);
  const courier = id => COURIERS.find(c=>c.id===id);
  function distance(a,b) {
    for (const p of [a,b]) if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || Math.abs(p.lat)>90 || Math.abs(p.lon)>180) throw Error('位置无效');
    const rad=n=>n*Math.PI/180, dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);
    const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
    return 6371.0088*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
  }
  function durationMs(km,speed) {
    if(!Number.isFinite(km)||km<0||!Number.isFinite(speed)||speed<=0) throw Error('距离或速度无效');
    return Math.ceil(km/speed*3600000);
  }
  function quote(from,to,courierId,now) {
    const c=courier(courierId),a=city(from),b=city(to);
    if(!c||!a||!b) throw Error('请选择有效的位置和信使');
    if(a.land!==b.land && c.kind!=='信鸽') throw Error('这段体验路线需要跨海，请选择小鸽');
    const km=distance(a,b), ms=durationMs(km,c.speed);
    return {from:clone(a),to:clone(b),courier:clone(c),km,duration:ms,sentAt:now,arrivesAt:now+ms};
  }
  function date(timestamp) {
    const d=new Date(timestamp);
    return (d.getMonth()+1)+'月'+d.getDate()+'日 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  }
  function duration(ms) {
    if(ms<=0) return '已抵达';
    let sec=Math.ceil(ms/1000);
    const days=Math.floor(sec/86400);sec%=86400;
    const hours=Math.floor(sec/3600);sec%=3600;
    const minutes=Math.floor(sec/60);
    return (days?days+'天 ':'')+(hours?hours+'小时 ':'')+(minutes?minutes+'分':(!days&&!hours?sec+'秒':''));
  }
  function initial(now) {
    const q=quote('shanghai','hangzhou','white',now);
    q.sentAt=now-q.duration-4*3600000;q.arrivesAt=now-4*3600000;
    return {version:VERSION,role:'a',people:{a:{name:'阿禾',city:'hangzhou'},b:{name:'小满',city:'shanghai'}},relationship:{status:'none',inviter:null},
      drafts:{a:'',b:''},letters:[Object.assign(q,{id:'sample-letter',fromRole:'b',toRole:'a',body:'今天路过一家花店，看见一束很像晚霞的花。\n\n本来想拍下来发给你，后来想，还是写封信吧。\n\n等这封信到了，你那里的天，或许也刚好暗下来。\n\n不用急着回我。只是想说，今天也有想起你。',sample:true})]};
  }
  function load(raw,now) {
    try {
      const s=typeof raw==='string'?JSON.parse(raw):raw;
      if(s&&s.version===VERSION&&['a','b'].includes(s.role)&&Array.isArray(s.letters)&&s.people.a&&s.people.b&&city(s.people.a.city)&&city(s.people.b.city)&&s.drafts&&s.relationship) return s;
    } catch(e) {}
    return initial(now);
  }
  const other=role=>role==='a'?'b':'a';
  function invite(state) {
    if(state.relationship.status==='accepted') throw Error('已经可以互相寄信了');
    if(state.relationship.status==='pending') throw Error('邀请已经发出，切换到对方身份接受');
    state.relationship={status:'pending',inviter:state.role};
  }
  function accept(state) {
    if(state.relationship.status!=='pending'||state.relationship.inviter===state.role) throw Error('请切换到收到邀请的一方');
    state.relationship.status='accepted';
  }
  function send(state,text,courierId,now) {
    const body=String(text||'').trim();
    if(state.relationship.status!=='accepted') throw Error('请先邀请对方，并切换到对方身份接受');
    if(!body) throw Error('先写下想说的话吧');
    if(body.length>2000) throw Error('这封信最多写 2000 字');
    const fromRole=state.role,toRole=other(fromRole);
    const q=quote(state.people[fromRole].city,state.people[toRole].city,courierId,now);
    const letter=Object.assign(q,{id:'letter-'+now+'-'+Math.random().toString(36).slice(2,9),fromRole,toRole,body,sample:false});
    state.letters.unshift(letter);state.drafts[fromRole]='';
    return letter;
  }
  function list(state,filter,now) {
    return state.letters.filter(l=>filter==='sent'?l.fromRole===state.role: l.toRole===state.role&&(filter==='road'?now<l.arrivesAt:now>=l.arrivesAt))
      .map(l=>({id:l.id,fromRole:l.fromRole,toRole:l.toRole,fromName:state.people[l.fromRole].name,toName:state.people[l.toRole].name,fromCity:l.from.name,toCity:l.to.name,courierName:l.courier.name,asset:l.courier.asset,km:l.km.toFixed(1),arrived:now>=l.arrivesAt,eta:date(l.arrivesAt),remaining:duration(l.arrivesAt-now),sample:l.sample,progress:Math.max(0,Math.min(100,100*(now-l.sentAt)/Math.max(1,l.duration)))}));
  }
  function read(state,id,now) {
    const l=state.letters.find(l=>l.id===id);
    if(!l) throw Error('找不到这封信');
    if(l.toRole!==state.role&&l.fromRole!==state.role) throw Error('这封信不属于当前身份');
    if(l.toRole===state.role&&now<l.arrivesAt) throw Error('信还在路上，到达后才能拆开');
    return clone(l);
  }
  return {VERSION,CITIES,COURIERS,city,courier,clone,distance,durationMs,quote,date,duration,initial,load,other,invite,accept,send,list,read};
});
