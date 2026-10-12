(function(){
'use strict';
const D=window.DATA, $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoy=()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fechaEs=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v||'');return m?(+m[3])+' '+MES[+m[2]-1]+' '+m[1]:(v||'—')};
const dias=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v||'');if(!m)return null;const t=new Date();const a=new Date(+m[1],+m[2]-1,+m[3]),b=new Date(t.getFullYear(),t.getMonth(),t.getDate());return Math.round((a-b)/864e5)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2200)}

/* ---------- Base de datos local (localStorage) ---------- */
const KEY='prosig_db_v1';
let DB;
try{DB=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){DB=null}
if(!DB)DB={rec:{},aj:{empresa:'Mi empresa',igv:'18'}};
DB.rec=DB.rec||{};DB.aj=DB.aj||{};
let saveT;function save(){clearTimeout(saveT);saveT=setTimeout(flush,200)}
function flush(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('No se pudo guardar: almacenamiento lleno. Exporta un respaldo.')}}
window.addEventListener('pagehide',flush);
const APP={ajuste:k=>DB.aj[k]};window.APP=APP;

/* ---------- Catálogo y configuración de módulos ---------- */
const CAT=D.cats, ALL={};
CAT.forEach(g=>g.items.forEach(m=>{ALL[m.slug]=Object.assign({cat:g},m)}));
Object.keys(D.cfg).forEach(s=>{if(!ALL[s]){const c=D.cfg[s];ALL[s]={slug:s,i:'📄',n:c.titulo,norma:'',d:'',f:[],cat:null,sub:true,menu:c.menu}}});
const SUBS={};Object.keys(D.cfg).forEach(s=>{const m=D.cfg[s].menu;if(m){(SUBS[m]=SUBS[m]||[]).push(s)}});
const NORMAS_MAP={biblioteca_de_normas_peruanas:null,normas_de_mineria:['Minería'],normas_de_construccion:['Construcción'],normas_de_electricidad:['Eléctrico'],normas_de_hidrocarburos:['Hidrocarburos'],normas_de_industria_y_manufactura:['Industria y manufactura'],normas_de_transporte_y_mercancias_peligrosas:['Transporte'],normas_ambientales:['Ambiental'],normas_de_salud_ocupacional:['Salud ocupacional']};
const AMBITOS=['Transversal SST','Salud ocupacional','Minería','Construcción','Eléctrico','Hidrocarburos','Transporte','Ambiental','Emergencias y Defensa Civil','Sistemas de gestión (ISO)','Industria y manufactura'];
const cap=s=>s.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
const IPERC=['matriz_iperc_de_mineria','matriz_iperc_de_construccion','matriz_iperc_industrial_y_mantenimiento','matriz_iperc_administrativa'];
const cfgCache={};
function getCfg(slug){
  if(cfgCache[slug])return cfgCache[slug];
  const m=ALL[slug];let c;
  if(D.cfg[slug]){c=Object.assign({store:slug,slug},D.cfg[slug]);c.titulo=c.titulo||m.n}
  else if(slug in NORMAS_MAP){
    const amb=NORMAS_MAP[slug];
    c={slug,store:'normas_biblioteca',titulo:m.n,singular:'Norma',filtro:r=>amb===null||amb.includes(r.ambito),fijo:amb&&amb.length===1?{ambito:amb[0]}:null,
      campos:[{n:'norma',l:'Norma',t:'text',req:1,lista:1,busca:1},{n:'tipo',l:'Tipo',t:'text',lista:1},{n:'ambito',l:'Ámbito',t:'select',op:AMBITOS.map(a=>[a,a]),lista:1},{n:'titulo',l:'Título',t:'text',busca:1,lista:1},{n:'anio',l:'Año',t:'number'},{n:'autoridad',l:'Autoridad',t:'text'},{n:'requisito',l:'Requisito',t:'textarea',rows:5},{n:'accion',l:'Acción a implementar',t:'textarea'},{n:'evidencia',l:'Evidencia',t:'textarea'},{n:'responsable',l:'Responsable',t:'text'},{n:'frecuencia',l:'Frecuencia',t:'text'},{n:'vence',l:'Próxima revisión',t:'date',fx:'venc'}],
      semilla:()=>D.normas.map(n=>Object.assign({},n))};
  }else if(D.matrices[slug]){
    const seed=D.matrices[slug];
    if(IPERC.includes(slug)){
      c={slug,store:slug,titulo:m.n,singular:'Peligro',campos:[{n:'proceso',l:'Proceso',t:'text',req:1,lista:1,busca:1},{n:'actividad',l:'Actividad',t:'text'},{n:'peligro',l:'Peligro',t:'text',req:1,lista:1,busca:1},{n:'riesgo',l:'Riesgo',t:'text'},{n:'consecuencia',l:'Consecuencia',t:'text'},{n:'controles',l:'Controles existentes',t:'textarea'},{n:'p',l:'Probabilidad (1-5)',t:'number',req:1},{n:'s',l:'Severidad (1-5)',t:'number',req:1},{t:'calc',calc:'nivel',a:'p',b:'s',l:'Nivel de riesgo',lista:1},{n:'adicionales',l:'Medidas adicionales',t:'textarea'},{n:'responsable',l:'Responsable',t:'text'},{n:'plazo',l:'Plazo',t:'date',fx:'venc'},{n:'estado',l:'Estado',t:'select',lista:1,def:'Pendiente',op:[['Implementada','Implementada'],['En proceso','En proceso'],['Pendiente','Pendiente']],col:{Implementada:'ok','En proceso':'warn',Pendiente:'info'}}],
        leyenda:'P × S: Trivial 1-2 · Tolerable 3-6 · Moderado 7-12 · Importante 13-16 · Intolerable 17-25'};
    }else{
      const keys=[];(seed||[]).forEach(r=>Object.keys(r).forEach(k=>{if(!keys.includes(k))keys.push(k)}));
      c={slug,store:slug,titulo:m.n,singular:'Fila',campos:keys.map((k,i)=>({n:k,l:cap(k),t:'text',lista:i<4?1:0,busca:1,req:i==0?1:0}))};
    }
    c.semilla=()=>(seed||[]).map(r=>Object.assign({},r));
  }else{
    const fm=[['','— Selecciona el formato —']].concat((m.f||[]).map(f=>[f,f]));
    c={slug,store:slug,titulo:m.n,singular:'Registro',doc:{codigo:slug.slice(0,3).toUpperCase()+'-FOR-001',version:'01',norma:m.norma},titulo_doc:(m.n||'').toUpperCase(),
      campos:[{n:'formato',l:'Formato',t:'select',req:1,lista:1,op:fm},{n:'codigo',l:'Código',t:'text',lista:1,busca:1},{n:'titulo',l:'Título / descripción corta',t:'text',req:1,lista:1,busca:1},{n:'responsable',l:'Responsable',t:'text',lista:1},{n:'fecha',l:'Fecha',t:'date',lista:1,def:'@hoy'},{n:'vence',l:'Vence / próxima revisión',t:'date',lista:1,fx:'venc'},{n:'estado',l:'Estado',t:'select',req:1,lista:1,def:'Borrador',op:[['Borrador','Borrador'],['En revisión','En revisión'],['Aprobado','Aprobado'],['Vencido','Vencido']],col:{Borrador:'na','En revisión':'warn',Aprobado:'ok',Vencido:'bad'}},{n:'detalle',l:'Contenido / observaciones',t:'textarea',rows:6}]};
  }
  c.titulo=c.titulo||m.n;c.campos=c.campos||[];
  return cfgCache[slug]=c;
}
function rows(c){
  const st=c.store;
  if(!DB.rec[st]){DB.rec[st]=[];if(c.semilla){DB.rec[st]=c.semilla().map(r=>Object.assign({id:uid(),_c:Date.now()},r));save()}}
  let r=DB.rec[st];if(c.filtro)r=r.filter(c.filtro);else if(st!==c.slug)r=r;
  return r;
}
function getRec(c,id){return (DB.rec[c.store]||[]).find(r=>r.id===id)}
function defVal(f){let d=f.def;if(d==='@hoy')return hoy();if(d==='@anio')return String(new Date().getFullYear());return d==null?(f.t==='check'?false:''):d}

/* ---------- Render de valores ---------- */
function bd(cl,t){return '<span class="bd bd-'+cl+'">'+esc(t)+'</span>'}
function optLabel(f,v){const o=(f.op||[]).find(x=>x[0]===String(v));return o?o[1]:v}
function celda(f,v,r){
  const t=f.t||'text',fx=f.fx;
  if(t==='calc'){return calcHtml(f,r)}
  if(fx==='venc'){const d=dias(v);if(d===null)return '<span class="muted">—</span>';return (d<0?bd('bad','VENCIDO ('+d+' d)'):d<=30?bd('warn','POR VENCER ('+d+' d)'):bd('ok','VIGENTE'))+' <small class="muted">'+esc(fechaEs(v))+'</small>'}
  if(fx==='pct'){if(v===''||v==null)return '<span class="muted">—</span>';const n=parseFloat(v);return bd(n>=90?'ok':n>=70?'warn':'bad',n.toFixed(1)+'%')}
  if(fx==='dinero'){return v===''||v==null?'—':Number(v).toLocaleString('es-PE',{minimumFractionDigits:2})}
  if(t==='check')return v?'✔':'✘';
  if(t==='select'){const tx=optLabel(f,v);if(f.col){return bd(f.col[v]||'na',tx===''?'—':tx)}return esc(tx===''?'—':tx)}
  if(t==='date')return esc(fechaEs(v));
  if(t==='time')return esc(String(v||'').slice(0,5));
  if(t==='firma')return v?'<img class="firma" src="'+esc(v)+'">':'<span class="muted">Sin firma</span>';
  if(t==='color')return '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:'+esc(v)+'"></span> '+esc(v);
  if(t==='password')return '••••';
  if(t==='textarea')return esc(v).replace(/\n/g,'<br>');
  return v===''||v==null?'<span class="muted">—</span>':esc(v);
}
function calcHtml(f,r){
  if(f.calc==='nivel'){const [v,nom,n]=NIVEL(r[f.a],r[f.b]);return v?'<span class="bd lv'+n+'">'+v+' · '+nom+'</span>':'<span class="muted">—</span>'}
  if(f.calc==='stock'){const a=parseFloat(r[f.a])||0,b=parseFloat(r[f.b])||0;return a<=0?bd('bad','SIN STOCK'):a<=b?bd('warn','STOCK BAJO'):bd('ok','OK')}
  if(f.calc==='item_estado'){const c=parseInt(r.cantidad)||0,m=parseInt(r.minimo)||0;return c>=m?bd('ok','COMPLETO'):c>0?bd('warn','INCOMPLETO'):bd('bad','FALTANTE')}
  if(f.calc==='cumpl'){let e=0,d=0;for(let i=1;i<=12;i++){const x=r['m'+String(i).padStart(2,'0')];if(x==='E'){e++;d++}else if(x==='R'||x==='X')d++}if(!d)return '—';const p=Math.round(e/d*100);return bd(p>=90?'ok':p>=60?'warn':'bad',p+'%')}
  return '';
}

/* ---------- Navegación ---------- */
const stack=[];
function go(h){location.hash=h}
$('#back').onclick=()=>{if(location.hash&&location.hash!=='#/'&&location.hash!=='#')history.back();else if(window.Android)Android.salir();};
$('#menu').onclick=()=>modal('<a class="mi" href="#/">🏠 Inicio</a><a class="mi" href="#/alertas">🔔 Alertas de vencimiento</a><a class="mi" href="#/buscar">🔎 Buscar en todo</a><a class="mi" href="#/ajustes">⚙️ Ajustes y respaldo</a>');
function modal(html,onclose){const m=$('#modal');m.innerHTML='<div class="box">'+html+'</div>';m.hidden=false;m.onclick=e=>{if(e.target===m||e.target.closest('a.mi'))closeModal()}}
function closeModal(){$('#modal').hidden=true;$('#modal').innerHTML=''}
function setTitle(t){$('#title').textContent=t;document.title=t}
function route(){
  closeModal();window.scrollTo(0,0);
  const h=(location.hash||'#/').slice(1).split('/').filter(Boolean).map(decodeURIComponent);
  if(!h.length)return home();
  if(h[0]==='alertas')return alertas();
  if(h[0]==='buscar')return buscar();
  if(h[0]==='ajustes')return ajustes();
  if(h[0]==='m'&&ALL[h[1]]){
    const c=getCfg(h[1]);
    if(!h[2])return lista(c);
    if(h[2]==='nuevo')return form(c,null);
    if(h[3]==='editar')return form(c,h[2]);
    return ver(c,h[2]);
  }
  home();
}
window.addEventListener('hashchange',route);

/* ---------- Alertas (vencimientos) ---------- */
function todasAlertas(){
  const out=[];
  Object.keys(ALL).forEach(slug=>{
    const c=getCfg(slug);if(c.store!==slug&&!c.filtro)return;
    const fs=c.campos.filter(f=>f.fx==='venc'&&f.n);if(!fs.length)return;
    (DB.rec[c.store]||[]).forEach(r=>{
      if(c.filtro&&!c.filtro(r))return;
      fs.forEach(f=>{const d=dias(r[f.n]);if(d!==null&&d<=30)out.push({slug,c,r,f,d})});
    });
  });
  return out.sort((a,b)=>a.d-b.d);
}
function tituloReg(c,r){
  const f=c.campos.filter(x=>x.lista&&x.n&&x.t!=='check'&&x.t!=='date'&&x.t!=='select').concat(c.campos.filter(x=>x.n&&x.t==='text'));
  for(const x of f){if(r[x.n])return String(r[x.n])}
  return c.singular+' '+(r.id||'').slice(-4);
}
function alertas(){
  setTitle('Alertas');const a=todasAlertas();
  app.innerHTML='<div class="kpis"><div class="kpi bad"><b>'+a.filter(x=>x.d<0).length+'</b><span>Vencidos</span></div><div class="kpi warn"><b>'+a.filter(x=>x.d>=0).length+'</b><span>Por vencer (30 d)</span></div><div class="kpi"><b>'+a.length+'</b><span>Total</span></div></div>'+
  (a.length?a.map(x=>'<a class="item" style="display:block;text-decoration:none;color:inherit" href="#/m/'+x.slug+'/'+x.r.id+'"><div class="t">'+esc(tituloReg(x.c,x.r))+'</div><div class="m"><span>'+esc(ALL[x.slug].n)+'</span><span>'+esc(x.f.l)+': '+celda(x.f,x.r[x.f.n],x.r)+'</span></div></a>').join(''):'<div class="empty">✅ No hay vencimientos en los próximos 30 días.</div>');
}

/* ---------- Inicio ---------- */
function totalRec(){return Object.values(DB.rec).reduce((a,b)=>a+b.length,0)}
function home(){
  setTitle('PROSIG · '+(DB.aj.empresa||''));
  const al=todasAlertas();
  let h='<div class="kpis"><div class="kpi"><b>'+Object.keys(ALL).filter(s=>!ALL[s].sub).length+'</b><span>Módulos</span></div><div class="kpi"><b>'+totalRec()+'</b><span>Registros</span></div><a class="kpi '+(al.length?'bad':'ok')+'" href="#/alertas" style="text-decoration:none;color:inherit"><b>'+al.length+'</b><span>Alertas</span></a></div>';
  h+='<input id="q" type="search" placeholder="🔎 Buscar módulo (ej. IPERC, extintores, ATS)…" autocomplete="off"><div id="mods"></div>';
  app.innerHTML=h;
  const draw=()=>{const q=$('#q').value.trim().toLowerCase();let o='';
    CAT.forEach(g=>{const it=g.items.filter(m=>!q||(m.n+' '+m.slug+' '+(m.d||'')+' '+(m.f||[]).join(' ')).toLowerCase().includes(q));if(!it.length)return;
      o+='<div class="cat"><span class="ic">'+g.i+'</span><span>'+esc(g.n)+'</span></div><div class="grid">'+it.map(m=>{const c=getCfg(m.slug);const n=countOf(m.slug);return '<a class="tile" style="--cc:'+g.c+';text-decoration:none;color:inherit" href="#/m/'+m.slug+'">'+(n?'<span class="n">'+n+'</span>':'')+'<span class="ic">'+m.i+'</span><b>'+esc(m.n)+'</b></a>'}).join('')+'</div>'});
    $('#mods').innerHTML=o||'<div class="empty">Sin resultados.</div>'};
  $('#q').oninput=draw;draw();
}
function countOf(slug){const c=ALL[slug]&&(D.cfg[slug]||slug in NORMAS_MAP||D.matrices[slug])?getCfg(slug):null;
  const st=c?c.store:slug;const r=DB.rec[st];if(!r)return (D.matrices[slug]||slug in NORMAS_MAP)?(slug in NORMAS_MAP?(NORMAS_MAP[slug]?D.normas.filter(n=>NORMAS_MAP[slug].includes(n.ambito)).length:D.normas.length):D.matrices[slug].length):0;
  return c&&c.filtro?r.filter(c.filtro).length:r.length}

/* ---------- Lista ---------- */
function tabsHtml(slug){
  const parent=ALL[slug].menu||slug;const subs=SUBS[parent];if(!subs&&!ALL[slug].menu)return '';
  const list=[parent].concat(SUBS[parent]||[]);if(list.length<2)return '';
  return '<div class="tabs">'+list.map(s=>'<a class="'+(s===slug?'on':'')+'" href="#/m/'+s+'">'+esc((ALL[s]||{}).n||s)+'</a>').join('')+'</div>';
}
let filtroEstado={};
function lista(c){
  setTitle(c.titulo);
  const m=ALL[c.slug];
  let all=rows(c).slice();
  const ord=c.campos.find(f=>f.t==='date'&&f.lista);
  all.sort((a,b)=>ord?String(b[ord.n]||'').localeCompare(String(a[ord.n]||'')):(b._c||0)-(a._c||0));
  const lf=c.campos.filter(f=>f.lista&&(f.n||f.t==='calc'));
  const sel=c.campos.find(f=>f.t==='select'&&f.lista&&f.op&&f.op.length>1&&f.op.length<=8);
  let head=tabsHtml(c.slug);
  head+='<div class="card"><div style="font-weight:700">'+esc(m.i||'')+' '+esc(c.titulo)+'</div>'+(m.d?'<small class="muted">'+esc(m.d)+'</small>':'')+(m.norma?'<div style="margin-top:6px">'+bd('info',m.norma)+'</div>':'')+(c.leyenda?'<small class="muted" style="display:block;margin-top:6px">'+esc(c.leyenda)+'</small>':'')+'</div>';
  head+='<div class="row" style="margin-bottom:10px"><input id="q" type="search" placeholder="Buscar…" style="flex:1;min-width:140px">'+(sel?'<select id="fs" style="width:auto;max-width:48%"><option value="">'+esc(sel.l)+': todos</option>'+sel.op.filter(o=>o[0]!=='').map(o=>'<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>').join('')+'</select>':'')+'</div>';
  head+='<div class="row noprint" style="margin-bottom:10px"><button class="btn sec sm" id="csv">⬇ CSV</button><span class="muted" id="cnt"></span></div><div id="lst"></div><button class="fab" id="nw" aria-label="Nuevo">+</button>';
  app.innerHTML=head;
  const draw=()=>{
    const q=$('#q').value.trim().toLowerCase(),fv=sel?$('#fs').value:'';
    const bf=c.campos.filter(f=>f.busca&&f.n);const useAll=!bf.length;
    const out=all.filter(r=>{
      if(fv&&r[sel.n]!==fv)return false;
      if(!q)return true;
      const fs=useAll?c.campos.filter(f=>f.n):bf;
      return fs.some(f=>String(r[f.n]||'').toLowerCase().includes(q));
    });
    $('#cnt').textContent=out.length+' registro'+(out.length===1?'':'s');
    $('#lst').innerHTML=out.length?out.map(r=>{
      const ttl=lf.find(f=>f.n&&f.t!=='date'&&f.t!=='select'&&f.t!=='check'&&f.t!=='number'&&f.t!=='decimal');
      const rest=lf.filter(f=>f!==ttl);
      return '<a class="item" style="display:block;text-decoration:none;color:inherit" href="#/m/'+c.slug+'/'+r.id+'"><div class="t">'+(ttl?esc(r[ttl.n]||'—'):esc(tituloReg(c,r)))+'</div><div class="m">'+rest.map(f=>'<span>'+(f.t==='calc'||f.t==='select'||f.fx==='venc'?'':esc(f.l)+': ')+celda(f,r[f.n],r)+'</span>').join('')+'</div></a>';
    }).join(''):'<div class="empty">Aún no hay registros.<br>Toca <b>+</b> para crear el primero.</div>';
  };
  $('#q').oninput=draw;if(sel)$('#fs').onchange=draw;draw();
  $('#nw').onclick=()=>go('#/m/'+c.slug+'/nuevo');
  $('#csv').onclick=()=>{const fs=c.campos.filter(f=>f.n);const lines=[fs.map(f=>f.l).join(';')].concat(all.map(r=>fs.map(f=>'"'+String(r[f.n]==null?'':(f.t==='firma'?'':r[f.n])).replace(/"/g,'""')+'"').join(';')));exportar(c.slug+'.csv','text/csv','\ufeff'+lines.join('\r\n'))};
}

/* ---------- Formulario ---------- */
function inputHtml(f,v,pre){
  const t=f.t||'text',nm=pre+f.n,rq=f.req?' required':'',ro=f.ro?' readonly':'';
  if(t==='textarea')return '<textarea name="'+nm+'" rows="'+(f.rows||3)+'"'+rq+ro+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+'>'+esc(v)+'</textarea>';
  if(t==='select')return '<select name="'+nm+'"'+rq+'>'+(f.op||[]).map(o=>'<option value="'+esc(o[0])+'"'+(String(v)===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
  if(t==='check')return '<input type="checkbox" name="'+nm+'"'+(v?' checked':'')+'>';
  if(t==='firma')return '<div data-firma="'+nm+'"><input type="hidden" name="'+nm+'" value="'+esc(v)+'"><div class="fprev">'+(v?'<img class="firma" style="max-height:70px;background:#fff;border-radius:6px" src="'+esc(v)+'">':'<span class="muted">Sin firma</span>')+'</div><button type="button" class="btn sec sm" data-sig="'+nm+'">✍️ Firmar</button></div>';
  const ty={number:'number',decimal:'number',date:'date',time:'time',email:'email',color:'color',password:'password'}[t]||'text';
  return '<input type="'+ty+'" name="'+nm+'" value="'+esc(v)+'"'+((t==='number'||t==='decimal')?' step="'+(t==='number'?'any':'0.01')+'" inputmode="decimal"':'')+rq+ro+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+'>';
}
function fieldBlock(f,v,pre){
  if(f.t==='calc')return '';
  const chk=f.t==='check';
  return '<label>'+esc(f.l||f.n)+(f.req?' <span class="rq">*</span>':'')+'</label>'+(chk?'<div>'+inputHtml(f,v,pre)+'</div>':inputHtml(f,v,pre))+(f.ayuda?'<small class="muted">'+esc(f.ayuda)+'</small>':'');
}
function form(c,id){
  const r=id?getRec(c,id):null;if(id&&!r){toast('Registro no encontrado');return history.back()}
  setTitle((r?'Editar ':'Nuevo ')+c.singular);
  const det=(c.detalles||[]);
  let h='<form id="f" class="card" autocomplete="off">';
  c.campos.forEach(f=>{h+=fieldBlock(f,r?(r[f.n]==null?'':r[f.n]):defVal(f),'')});
  det.forEach((d,di)=>{
    const rowsInit=r?((r._d||{})[d.key]||[]):((d.plantilla||[]).map(x=>Object.assign({},x)));
    h+='<h4>'+esc(d.titulo)+'</h4><div id="dt'+di+'">'+rowsInit.map((x,i)=>detRow(d,di,x)).join('')+'</div><button type="button" class="btn sec sm" data-add="'+di+'">+ Agregar fila</button>';
  });
  h+='<div class="row" style="margin-top:18px"><button class="btn" type="submit">💾 Guardar</button><button type="button" class="btn sec" id="cx">Cancelar</button></div></form>';
  app.innerHTML=h;
  $('#cx').onclick=()=>history.back();
  app.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const di=+b.dataset.add;const d=det[di];const tmp=document.createElement('div');tmp.innerHTML=detRow(d,di,{});$('#dt'+di).appendChild(tmp.firstChild)});
  app.onclick=e=>{const x=e.target.closest('[data-del]');if(x){x.closest('.dtrow').remove()}const s=e.target.closest('[data-sig]');if(s)firmar(s.dataset.sig)};
  $('#f').onsubmit=e=>{e.preventDefault();guardar(c,r,det)};
}
function detRow(d,di,x){
  let h='<div class="dtrow" data-di="'+di+'">';
  d.campos.forEach(f=>{if(f.t==='calc')return;h+='<label>'+esc(f.l)+'</label>'+inputHtml(f,x[f.n]==null?defVal(f):x[f.n],'d'+di+'__')});
  return h+'<button type="button" class="btn bad sm" data-del style="margin-top:8px">Quitar</button></div>';
}
function readVal(f,el){
  if(!el)return '';
  if(f.t==='check')return el.checked;
  return el.value;
}
function guardar(c,r,det){
  const F=$('#f');const d={};
  c.campos.forEach(f=>{if(f.n&&f.t!=='calc'){d[f.n]=readVal(f,F.elements[f.n])}});
  const D={};
  det.forEach((dd,di)=>{D[dd.key]=[...document.querySelectorAll('#dt'+di+' .dtrow')].map(row=>{const o={};dd.campos.forEach(f=>{if(f.t==='calc')return;const el=row.querySelector('[name="d'+di+'__'+f.n+'"]');o[f.n]=readVal(f,el)});return o})});
  try{const fn=window.CALC[c.slug];if(fn)fn(d,D)}catch(e){toast(e.message);return}
  if(c.fijo)Object.assign(d,c.fijo);
  const st=c.store;DB.rec[st]=DB.rec[st]||[];
  if(r){Object.assign(r,d);r._d=D;r._u=Date.now()}else{const n=Object.assign({id:uid(),_c:Date.now(),_d:D},d);DB.rec[st].push(n);r=n}
  save();toast('Guardado');
  history.replaceState(null,'','#/m/'+c.slug+'/'+r.id);route();
}
function firmar(nm){
  modal('<h3>Firma</h3><canvas class="sig" id="cv"></canvas><div class="row" style="margin-top:10px"><button class="btn" id="sok">Aceptar</button><button class="btn sec" id="scl">Borrar</button><button class="btn sec" id="sca">Cancelar</button></div>');
  const cv=$('#cv');const ratio=window.devicePixelRatio||1;cv.width=cv.clientWidth*ratio;cv.height=cv.clientHeight*ratio;
  const x=cv.getContext('2d');x.scale(ratio,ratio);x.lineWidth=2.2;x.lineCap='round';x.strokeStyle='#000';let dr=false;
  const pt=e=>{const b=cv.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top]};
  cv.onpointerdown=e=>{dr=true;cv.setPointerCapture(e.pointerId);const[a,b]=pt(e);x.beginPath();x.moveTo(a,b)};
  cv.onpointermove=e=>{if(!dr)return;const[a,b]=pt(e);x.lineTo(a,b);x.stroke()};
  cv.onpointerup=()=>dr=false;
  $('#scl').onclick=()=>x.clearRect(0,0,cv.width,cv.height);
  $('#sca').onclick=closeModal;
  $('#sok').onclick=()=>{const url=cv.toDataURL('image/png');const w=document.querySelector('[data-firma="'+nm+'"]');w.querySelector('input').value=url;w.querySelector('.fprev').innerHTML='<img class="firma" style="max-height:70px;background:#fff;border-radius:6px" src="'+url+'">';closeModal()};
}

/* ---------- Ver registro (documento) ---------- */
function ver(c,id){
  const r=getRec(c,id);if(!r){setTitle('No encontrado');app.innerHTML='<div class="empty">Registro no encontrado.</div>';return}
  setTitle(c.singular);
  const doc=c.doc||{};
  let h='<div class="doc"><h2>'+esc(c.titulo_doc||c.titulo.toUpperCase())+'</h2><div class="meta">'+esc([doc.codigo,doc.version?'Versión '+doc.version:'',doc.norma].filter(Boolean).join(' · '))+'<br>Empresa: '+esc(DB.aj.empresa||'')+'</div><table>';
  c.campos.forEach(f=>{if(!f.n&&f.t!=='calc')return;const v=r[f.n];if(f.t!=='calc'&&(v===''||v==null||v===false)&&f.t!=='check')return;h+='<tr><th>'+esc(f.l)+'</th><td>'+celda(f,v,r)+'</td></tr>'});
  h+='</table>';
  (c.detalles||[]).forEach(d=>{const rr=(r._d||{})[d.key]||[];h+='<h4>'+esc(d.titulo)+'</h4><div class="tw"><table><thead><tr><th>N°</th>'+d.campos.filter(f=>f.n).map(f=>'<th>'+esc(f.l)+'</th>').join('')+'</tr></thead><tbody>'+(rr.length?rr.map((x,i)=>'<tr><td>'+(i+1)+'</td>'+d.campos.filter(f=>f.n).map(f=>'<td>'+celda(f,x[f.n],x)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+(d.campos.length+1)+'">Sin registros.</td></tr>')+'</tbody></table></div>'});
  const fr=c.firmas||(c.doc?['Elaborado por','Revisado por','Aprobado por']:[]);
  if(fr.length)h+='<div class="firmas">'+fr.map(x=>'<div>'+esc(x)+'</div>').join('')+'</div>';
  h+='</div><div class="row noprint" style="margin-top:14px"><button class="btn" id="pr">🖨️ Imprimir / PDF</button><a class="btn sec" href="#/m/'+c.slug+'/'+id+'/editar">✏️ Editar</a><button class="btn bad" id="dl">🗑 Eliminar</button></div>';
  app.innerHTML=h;
  $('#pr').onclick=()=>{if(window.Android&&Android.imprimir)Android.imprimir(c.singular+'_'+id);else window.print()};
  $('#dl').onclick=()=>{if(confirm('¿Eliminar este registro?')){DB.rec[c.store]=DB.rec[c.store].filter(x=>x.id!==id);save();toast('Eliminado');history.replaceState(null,'','#/m/'+c.slug);route()}};
}

/* ---------- Búsqueda global ---------- */
function buscar(){
  setTitle('Buscar');
  app.innerHTML='<input id="q" type="search" placeholder="Buscar en todos los registros…" autofocus><div id="res" style="margin-top:12px"></div>';
  $('#q').oninput=()=>{const q=$('#q').value.trim().toLowerCase();if(q.length<2){$('#res').innerHTML='<div class="empty">Escribe al menos 2 letras.</div>';return}
    let out=[];Object.keys(ALL).forEach(slug=>{const c=getCfg(slug);if(c.store!==slug&&!c.filtro)return;(DB.rec[c.store]||[]).forEach(r=>{if(c.filtro&&!c.filtro(r))return;if(c.campos.some(f=>f.n&&f.t!=='firma'&&String(r[f.n]||'').toLowerCase().includes(q)))out.push({slug,c,r})})});
    $('#res').innerHTML=out.slice(0,60).map(x=>'<a class="item" style="display:block;text-decoration:none;color:inherit" href="#/m/'+x.slug+'/'+x.r.id+'"><div class="t">'+esc(tituloReg(x.c,x.r))+'</div><div class="m"><span>'+esc(ALL[x.slug].n)+'</span></div></a>').join('')||'<div class="empty">Sin resultados.</div>'};
  $('#q').oninput();
}

/* ---------- Ajustes y respaldo ---------- */
function exportar(nombre,mime,texto){
  if(window.Android&&Android.guardarArchivo){Android.guardarArchivo(nombre,mime,texto);return}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texto],{type:mime}));a.download=nombre;document.body.appendChild(a);a.click();a.remove();toast('Descargado '+nombre);
}
function ajustes(){
  setTitle('Ajustes');
  app.innerHTML='<div class="card"><h3>Empresa</h3><label>Nombre / razón social</label><input id="emp" value="'+esc(DB.aj.empresa||'')+'"><label>IGV (%)</label><input id="igv" type="number" value="'+esc(DB.aj.igv||'18')+'"><div style="margin-top:12px"><button class="btn" id="sv">Guardar</button></div></div>'+
  '<div class="card"><h3>Respaldo de datos</h3><p class="muted">Todos los datos viven solo en este teléfono. Haz respaldos periódicos: si desinstalas la app o borras sus datos, se pierden.</p><div class="row"><button class="btn" id="ex">⬇ Exportar respaldo</button><button class="btn sec" id="im">⬆ Importar respaldo</button></div><input type="file" id="fi" accept=".json,application/json" hidden></div>'+
  '<div class="card"><h3>Datos</h3><p class="muted">'+totalRec()+' registros guardados.</p><button class="btn bad" id="rs">Borrar todos los datos</button></div>'+
  '<div class="card"><small class="muted">PROSIG App · 100 % sin conexión · '+Object.keys(ALL).filter(s=>!ALL[s].sub).length+' módulos</small></div>';
  $('#sv').onclick=()=>{DB.aj.empresa=$('#emp').value.trim();DB.aj.igv=$('#igv').value||'18';save();toast('Guardado')};
  $('#ex').onclick=()=>exportar('prosig_respaldo_'+hoy()+'.json','application/json',JSON.stringify(DB));
  $('#im').onclick=()=>$('#fi').click();
  $('#fi').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);if(!x.rec)throw 0;if(!confirm('Esto reemplaza los datos actuales. ¿Continuar?'))return;DB=x;flush();toast('Respaldo importado');location.hash='#/';route()}catch(_){toast('Archivo no válido')}};rd.readAsText(f)};
  $('#rs').onclick=()=>{if(confirm('¿Borrar TODOS los datos de la app? No se puede deshacer.')){DB={rec:{},aj:{empresa:'Mi empresa',igv:'18'}};flush();Object.keys(cfgCache).forEach(k=>delete cfgCache[k]);toast('Datos borrados');location.hash='#/';route()}};
}
window.addEventListener('DOMContentLoaded',route);
if(document.readyState!=='loading')route();
})();
