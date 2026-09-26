(function(){
'use strict';
const M=window.Chema,KEY='chema-slow-v1',A='/miniprogram/assets/';
let state;
try{state=M.load(localStorage.getItem(KEY),Date.now());}catch(e){state=M.initial(Date.now());}
let tab='home',filter='received',selected='chestnut',modal=null,lastFocus=null;
const app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(asset,cls)=>'<img class="'+(cls||'')+'" src="'+A+asset+'" alt="">';
const me=()=>state.people[state.role],partner=()=>state.people[M.other(state.role)];
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(state));}
  catch(e){const n=document.getElementById('notice');n.hidden=false;n.textContent='浏览器无法保存记录，请先不要关闭此页。';}
}
function toast(text){const e=document.getElementById('toast');e.textContent=text;e.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('visible'),3000);}
function relation(){
 const r=state.relationship;
 if(r.status==='accepted')return '<div class="relationship"><span>与 '+esc(partner().name)+' 的体验信箱已连通</span><span>✧</span></div>';
 if(r.status==='pending'&&r.inviter!==state.role)return '<div class="relationship"><span>'+esc(partner().name)+' 邀请你互相寄信</span><button data-action="accept">接受邀请 →</button></div>';
 if(r.status==='pending')return '<div class="relationship"><span>体验邀请已发出</span><button data-action="switch">切换身份去接受 →</button></div>';
 return '<div class="relationship"><span>让第一封信，有一个去处。</span><button data-action="invite">邀请对方 →</button></div>';
}
function card(l){
 const who=filter==='sent'?'寄给 '+l.toName:l.fromName+' 寄来的信';
 return '<button class="letter-card" data-action="letter" data-id="'+l.id+'" aria-label="'+esc(who+(l.sample?'，示例信件':''))+'"><div class="letter-top"><div><div class="tiny">'+(l.sample?'示例信件 · 可以拆开看看':l.arrived?'心意已抵达':'心意正在路上')+'</div><h4>'+esc(who)+'</h4><span class="tiny">'+esc(l.fromCity)+' → '+esc(l.toCity)+' · '+l.km+' km</span></div><div class="stamp">'+img(l.asset)+'尺素</div></div>'+(!l.arrived?'<div class="progress"><i style="width:'+l.progress+'%"></i></div>':'')+'<div class="letter-foot"><span class="'+(l.arrived?'arrived':'')+'">'+(l.arrived?'心意已经抵达':l.eta+' 抵达')+'</span><span>'+(l.arrived?'拆开看看 ↗':'看看旅程 ↗')+'</span></div></button>';
}
function home(){
 const now=Date.now(),letters=M.list(state,filter,now);
 return '<section class="hero"><div class="hero-copy"><div class="eyebrow">LETTERS TAKE THEIR TIME</div><h2>有一份惦记，<br>还在路上。</h2><p>慢一点，心意也会好好抵达。</p></div><span class="vertical">山海有期 · 来信可待</span>'+img('landscape.svg','landscape')+img('horse-chestnut.svg','scene-animal')+'</section><section class="section"><div class="section-top"><h3>两个人的信箱</h3><small>'+esc(me().name)+' · '+M.city(me().city).name+'</small></div><div class="filters">'+[['road','在路上'],['received','已收到'],['sent','已寄出']].map(([id,name])=>'<button class="'+(filter===id?'active':'')+'" data-action="filter" data-filter="'+id+'">'+name+' '+M.list(state,id,now).length+'</button>').join('')+'</div>'+(letters.length?letters.map(card).join(''):'<div class="empty"><div class="symbol">✉</div><p>'+(filter==='road'?'此刻，路上还没有新的信。':filter==='sent'?'第一封信，从你开始。':'信箱空着，也装得下期待。')+'</p><button data-action="tab" data-tab="write">写下今天想说的话</button></div>')+relation()+'<button class="btn" data-action="tab" data-tab="write">✎ &nbsp; 写一封信</button><p class="quiet">不必急着回，只要记得你。</p></section>';
}
function available(c){return M.city(me().city).land===M.city(partner().city).land||c.kind==='信鸽';}
function quoteBox(q){return '<div class="quote"><div class="row"><span>'+q.from.name+' → '+q.to.name+'</span><strong>'+q.km.toFixed(1)+' km</strong></div><div class="row"><span>'+q.courier.name+' · '+Number(q.courier.speed.toFixed(2))+' km/h</span><span>需 '+M.duration(q.duration)+'</span></div><div class="row"><span>预计抵达</span><strong>'+M.date(q.arrivesAt)+'</strong></div><p>寄出后，终点与抵达时间固定。</p></div>';}
function notes(){return '<details class="native-details"><summary>体验版的距离与速度怎么算？</summary><p>位置来自体验设置中的城市参考坐标，不是双方实时定位。距离按地球表面两点最短距离计算，尚未接入陆路路线。固定参考速度计算，不缩短等待；目前未计休息、天气与信鸽航程限制，不能当作真实动物连续长途行程。</p><p>小栗 6 km/h、照夜 12 km/h，分别参考马的常步、快步，名字不是马的品种。小鸽参考赛鸽 50 mph（80.4672 km/h）。<a href="'+M.COURIERS[0].source+'" target="_blank" rel="noreferrer">马速来源</a> · <a href="'+M.COURIERS[2].source+'" target="_blank" rel="noreferrer">鸽速来源</a>。均为待进一步确认的模型参数。</p></details>';}
function write(){
 if(!available(M.courier(selected)))selected='pigeon';
 const q=M.quote(me().city,partner().city,selected,Date.now());
 return '<div class="page-head"><div class="eyebrow">A LETTER, JUST FOR YOU</div><h2 class="page-title">见字如面</h2><p>把今天没说完的话，慢慢写下来。</p></div><section class="form-section">'+relation()+'<div class="paper"><div class="salutation">致 '+esc(partner().name)+'：</div><textarea id="letter-text" maxlength="2000" aria-label="信的正文" placeholder="今天，有什么想告诉你……">'+esc(state.drafts[state.role])+'</textarea><div class="signature">写信人 / '+esc(me().name)+'</div></div><div class="count"><span id="char-count">'+state.drafts[state.role].length+'</span> / 2000 · 自动存为本机草稿</div><div class="label-row" style="margin-top:25px"><span>让谁替你送这封信？</span><button class="tiny" data-action="settings">修改体验位置 ↗</button></div><div class="courier-options">'+M.COURIERS.map(c=>'<button class="courier-option '+(selected===c.id?'selected':'')+'" data-action="courier" data-id="'+c.id+'" '+(!available(c)?'disabled':'')+'>'+img(c.asset)+'<strong>'+c.name+'</strong><small>'+(available(c)?Number(c.speed.toFixed(2))+' km/h':'跨海不可选')+'</small></button>').join('')+'</div>'+quoteBox(q)+'<button class="btn" data-action="prepare" '+(state.relationship.status!=='accepted'?'disabled':'')+'>封好这封信 →</button>'+notes()+'</section>';
}
function stable(){return '<div class="page-head"><div class="eyebrow">YOUR LITTLE MESSENGERS</div><h2 class="page-title">替你走过山海</h2><p>每一程，都带着一点你的心意。</p></div><section class="section">'+M.COURIERS.map(c=>{
const count=state.letters.filter(l=>!l.sample&&l.fromRole===state.role&&l.courier.id===c.id).length;
return '<article class="stable-card"><div class="animal-portrait">'+img(c.asset)+'</div><div><h3>'+c.name+'<span>'+c.tag+'</span></h3><p>'+c.desc+'</p><small>'+Number(c.speed.toFixed(2))+' km/h · 已托付 '+count+' 封信</small><br><button data-action="choose" data-id="'+c.id+'">请它送一封 →</button></div></article>';
}).join('')+'<p class="note">此版先体验选择信使与送信记录。共同饲养、成长和返程，留待一起慢慢设计。</p>'+notes()+'</section>';}
function render(){
 document.getElementById('role-name').textContent=me().name;
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 app.innerHTML=tab==='home'?home():tab==='write'?write():stable();
}
function closeModal(){document.getElementById('modal-root').innerHTML='';modal=null;if(lastFocus&&document.contains(lastFocus))lastFocus.focus();}
function showModal(title,body,kind){
 lastFocus=document.activeElement;modal=kind||'info';
 document.getElementById('modal-root').innerHTML='<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modal-top"><h2>'+esc(title)+'</h2><button class="round" data-action="close" aria-label="关闭">×</button></div>'+body+'</section></div>';
 document.querySelector('.modal button').focus();
}
function settings(){
 showModal('体验设置','<p>这是保存在本机的双人模拟。切换身份，体验彼此寄信；不会向真实微信好友发送消息。</p><div class="quote">当前：'+me().name+'<br>对方：'+partner().name+'</div><button class="btn light" data-action="switch">切换为 '+partner().name+'</button>'+['a','b'].map(r=>'<label for="city-'+r+'">'+state.people[r].name+' 的体验城市</label><select id="city-'+r+'" data-person="'+r+'">'+M.CITIES.map(c=>'<option value="'+c.id+'" '+(state.people[r].city===c.id?'selected':'')+'>'+c.name+'</option>').join('')+'</select>').join('')+'<p class="note">坐标为城市参考点，非实时定位。这里修改位置，只影响之后寄出的信。跨海限制仅覆盖这些预设城市组合，尚未接入全球路线判断。</p><button class="btn" data-action="close">好了，继续体验</button>','settings');
}
function openLetter(id){
 const l=state.letters.find(l=>l.id===id);if(!l)return;
 const now=Date.now();
 if(l.toRole===state.role&&now<l.arrivesAt){
 showModal('它正向你走来','<div class="journey-art">'+img('landscape.svg','landscape')+img(l.courier.asset,'journey-animal')+'</div><p>来自 '+esc(state.people[l.fromRole].name)+' 的一封信。<br>内容还封在信里，等抵达再慢慢读。</p>'+quoteBox(l)+'<p class="quiet">还有 '+M.duration(l.arrivesAt-now)+'</p><button class="btn" data-action="reply">我也写一封</button>','journey');return;
 }
 const letter=M.read(state,id,now);
 showModal(letter.sample?'一封示例来信':'见字如面','<div class="tiny">'+esc(state.people[letter.fromRole].name)+' 寄给 '+esc(state.people[letter.toRole].name)+(letter.sample?' · 示例内容':'')+'</div><div class="read-body">'+esc(letter.body)+'</div><div class="signature">'+esc(state.people[letter.fromRole].name)+'<br>'+M.date(letter.sentAt)+'</div><p class="read-meta">'+letter.from.name+' → '+letter.to.name+' · '+letter.km.toFixed(1)+' km · '+letter.courier.name+'送达'+(now<letter.arrivesAt?'（当前为寄信人查看，尚在路上）':'')+'</p><button class="btn light" data-action="reply">我也写一封</button>','read');
}
document.addEventListener('input',e=>{
 if(e.target.id==='letter-text'){state.drafts[state.role]=e.target.value;document.getElementById('char-count').textContent=e.target.value.length;persist();}
});
document.addEventListener('change',e=>{
 if(e.target.dataset.person){state.people[e.target.dataset.person].city=e.target.value;persist();render();}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b||b.disabled)return;
 try{
 switch(b.dataset.action){
 case 'tab':tab=b.dataset.tab;render();break;
 case 'filter':filter=b.dataset.filter;render();break;
 case 'settings':settings();break;
 case 'close':closeModal();render();break;
 case 'switch':closeModal();state.role=M.other(state.role);persist();tab='home';filter='road';render();toast('现在是 '+me().name+' 的视角');break;
 case 'invite':M.invite(state);persist();render();toast('体验邀请已发出，切换到对方身份即可接受');break;
 case 'accept':M.accept(state);persist();render();toast('从现在起，可以互相寄信了');break;
 case 'courier':selected=b.dataset.id;render();break;
 case 'choose':selected=b.dataset.id;if(!available(M.courier(selected))){toast('这段体验路线需要跨海，请选择小鸽');return;}tab='write';render();break;
 case 'prepare':if(!state.drafts[state.role].trim()){toast('先写下想说的话吧');return;}
 showModal('把心意交给它',quoteBox(M.quote(me().city,partner().city,selected,Date.now()))+'<p>信寄出后，'+esc(partner().name)+' 会先知道有信在路上，到达时才能读到内容。</p><button class="btn" data-action="send">确认寄出</button><button class="btn light" data-action="close">再读一遍</button>','send');break;
 case 'send':if(modal!=='send')return;M.send(state,state.drafts[state.role],selected,Date.now());persist();closeModal();tab='home';filter='sent';render();toast('信已经出发。让想念，走一会儿。');break;
 case 'letter':openLetter(b.dataset.id);break;
 case 'reply':closeModal();tab='write';render();break;
 }
 if(['tab','choose','reply','send','switch'].includes(b.dataset.action))window.scrollTo(0,0);
 }catch(err){toast(err.message);}
});
document.addEventListener('keydown',e=>{
 if(!modal)return;
 if(e.key==='Escape'){closeModal();return;}
 if(e.key==='Tab'){
 const els=[...document.querySelectorAll('.modal button:not(:disabled),.modal select,.modal a')];
 const first=els[0],last=els[els.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
let lastTick=Date.now();
setInterval(()=>{const now=Date.now();const crossed=state.letters.some(l=>l.arrivesAt>lastTick&&l.arrivesAt<=now);lastTick=now;if(crossed&&!modal&&tab==='home')render();},1000);
persist();render();
})();
