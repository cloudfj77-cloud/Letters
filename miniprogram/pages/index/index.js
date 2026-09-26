const M=require('../../utils/model');
const KEY='chema-slow-v1';
Page({
 data:{tab:'home',filter:'received',couriers:M.COURIERS,cities:M.CITIES,selected:'chestnut',dialog:'',reading:null,modalTitle:'',draft:''},
 onLoad(){this.state=M.load(wx.getStorageSync(KEY),Date.now());this.sync();},
 onShow(){if(this.state)this.sync();this.tick=setInterval(()=>{if(this.state&&this.data.tab==='home'&&!this.data.dialog)this.sync();},30000);},
 onHide(){clearInterval(this.tick);},
 onUnload(){clearInterval(this.tick);},
 persist(){try{wx.setStorageSync(KEY,this.state);}catch(e){wx.showToast({title:'本机存储失败，请勿关闭页面',icon:'none'});}},
 sync(){
  const s=this.state,now=Date.now(),me=s.people[s.role],partner=s.people[M.other(s.role)];
  const crossSea=M.city(me.city).land!==M.city(partner.city).land;
  let selected=this.data.selected;if(crossSea&&selected!=='pigeon')selected='pigeon';
  const q=M.quote(me.city,partner.city,selected,now);
  const rel=s.relationship,status=rel.status==='accepted'?'已连通':rel.status==='none'?'未邀请':rel.inviter===s.role?'待对方接受':'收到邀请';
  this.setData({selected,me,partner,status,crossSea,relation:rel.status,canAccept:rel.status==='pending'&&rel.inviter!==s.role,
   draft:s.drafts[s.role],letters:M.list(s,this.data.filter,now),counts:{road:M.list(s,'road',now).length,received:M.list(s,'received',now).length,sent:M.list(s,'sent',now).length},
   quote:{km:q.km.toFixed(1),from:q.from.name,to:q.to.name,speed:Number(q.courier.speed.toFixed(2)),courier:q.courier.name,eta:M.date(q.arrivesAt),duration:M.duration(q.duration)},
   couriers:M.COURIERS.map(c=>Object.assign({},c,{displaySpeed:Number(c.speed.toFixed(2)),disabled:crossSea&&c.id!=='pigeon',count:s.letters.filter(l=>!l.sample&&l.fromRole===s.role&&l.courier.id===c.id).length})),
   cityA:M.CITIES.findIndex(c=>c.id===s.people.a.city),cityB:M.CITIES.findIndex(c=>c.id===s.people.b.city),cityAName:M.city(s.people.a.city).name,cityBName:M.city(s.people.b.city).name});
 },
 onTab(e){this.setData({tab:e.currentTarget.dataset.tab});this.sync();},
 onFilter(e){this.setData({filter:e.currentTarget.dataset.filter});this.sync();},
 onDraft(e){this.state.drafts[this.state.role]=e.detail.value;this.setData({draft:e.detail.value});this.persist();},
 onCourier(e){const id=e.currentTarget.dataset.id;if(this.data.crossSea&&id!=='pigeon')return;this.setData({selected:id});this.sync();},
 choose(e){if(this.data.crossSea&&e.currentTarget.dataset.id!=='pigeon'){wx.showToast({title:'跨海路线请选小鸽',icon:'none'});return;}this.setData({selected:e.currentTarget.dataset.id,tab:'write'});this.sync();},
 switchRole(){this.state.role=M.other(this.state.role);this.persist();this.setData({tab:'home',filter:'road',dialog:'',reading:null});this.sync();},
 invite(){try{M.invite(this.state);this.persist();this.sync();wx.showToast({title:'切换身份，让对方接受邀请',icon:'none'});}catch(e){wx.showToast({title:e.message,icon:'none'});}},
 accept(){try{M.accept(this.state);this.persist();this.sync();}catch(e){wx.showToast({title:e.message,icon:'none'});}},
 settings(){this.setData({dialog:'settings'});},
 close(){this.setData({dialog:'',reading:null});this.sync();},
 cityChange(e){const role=e.currentTarget.dataset.role;this.state.people[role].city=M.CITIES[Number(e.detail.value)].id;this.persist();this.sync();},
 prepare(){if(!this.data.draft.trim()){wx.showToast({title:'先写下想说的话吧',icon:'none'});return;}this.sync();this.setData({dialog:'send'});},
 send(){if(this.data.dialog!=='send')return;try{M.send(this.state,this.state.drafts[this.state.role],this.data.selected,Date.now());this.persist();this.setData({dialog:'',tab:'home',filter:'sent'});this.sync();wx.showToast({title:'信已经出发',icon:'success'});}catch(e){wx.showToast({title:e.message,icon:'none'});}},
 openLetter(e){
  const l=this.state.letters.find(x=>x.id===e.currentTarget.dataset.id);if(!l)return;
  const now=Date.now(),locked=l.toRole===this.state.role&&now<l.arrivesAt;
  try{
   const value=locked?null:M.read(this.state,l.id,now);
   this.setData({dialog:locked?'journey':'read',modalTitle:locked?'它正向你走来':l.sample?'一封示例来信':'见字如面',
    reading:{body:value?value.body:'',fromName:this.state.people[l.fromRole].name,toName:this.state.people[l.toRole].name,fromCity:l.from.name,toCity:l.to.name,asset:l.courier.asset,courier:l.courier.name,km:l.km.toFixed(1),eta:M.date(l.arrivesAt),sentAt:M.date(l.sentAt),remaining:M.duration(l.arrivesAt-now),sample:l.sample}});
  }catch(e){wx.showToast({title:e.message,icon:'none'});}
 },
 reply(){this.setData({dialog:'',reading:null,tab:'write'});this.sync();},
 rules(){wx.showModal({title:'体验版计算说明',content:'位置为城市参考点，不是实时定位。距离按地球表面最短距离计算，未接陆路路线。马速参考常步 6、快步 12 km/h；鸽速参考赛鸽 50 mph（80.4672 km/h）。未计休息、天气和航程限制，非真实动物全程行程。详细来源在项目说明中。',showCancel:false});},
 stop(){}
});
