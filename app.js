import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, addDoc, updateDoc, orderBy, query, getDocs, getDoc, limit, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── SECURITY: HTML escape helper — use on ALL Firestore strings in innerHTML ──
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── PWA VERSION CHECK — incrementá APP_VERSION con cada deploy ──
const APP_VERSION = '1.1.0';
if (window.navigator.standalone) {
  const lastVersion = localStorage.getItem('app-version');
  if (lastVersion !== APP_VERSION) {
    localStorage.setItem('app-version', APP_VERSION);
    window.location.reload(true);
  }
}

const app = initializeApp({
  apiKey:"AIzaSyD9TVjeoxeOGCDYaxY6Kx_mXUOn6Cs7g0A",
  authDomain:"tripplanner-a1f5c.firebaseapp.com",
  projectId:"tripplanner-a1f5c",
  storageBucket:"tripplanner-a1f5c.firebasestorage.app",
  messagingSenderId:"82332333762",
  appId:"1:82332333762:web:956ab3770a8ddc7d182d5b"
});
const db = getFirestore(app);
const auth = getAuth(app);

// ── TRIP CONTEXT ──────────────────────────────────────────
// Get tripId from URL hash or sessionStorage
function getTripId(){
  if(location.hash && location.hash.length > 1) return location.hash.slice(1);
  try{ return sessionStorage.getItem('tp_tripId')||''; }catch(e){ return ''; }
}
const TRIP_ID = getTripId();

// Collection helper — scoped to trip if tripId exists, else legacy root
function col(name){
  if(TRIP_ID) return collection(db, 'trips', TRIP_ID, name);
  return collection(db, name); // legacy fallback for existing trip
}
function dref(colName, id){
  if(TRIP_ID) return doc(db, 'trips', TRIP_ID, colName, id);
  return doc(db, colName, id);
}

// ── LOAD TRIP CONFIG + ROLE — single getDoc ──────────────
async function loadTripInit(){
  if(!TRIP_ID) return 'owner'; // legacy mode = full access
  try{
    const snap = await getDoc(doc(db,'trips',TRIP_ID));
    if(!snap.exists()) return 'editor';
    const t = snap.data();

    // ── Hero title ──
    const titleEl = document.getElementById('hero-title');
    const destEl = document.getElementById('hero-dest');
    const subEl = document.getElementById('hero-sub');
    const pillsEl = document.getElementById('hero-pills');
    if(t.nombre && titleEl){
      const normNombre = t.nombre.replace(/Amsterdam/gi,'Países Bajos');
      const parts = normNombre.split('·').map(p=>p.trim()).filter(Boolean);
      if(parts.length >= 2){
        titleEl.innerHTML = `${parts[0]}<br><em>${parts.slice(1).join(' · ')}</em>`;
      } else {
        titleEl.innerHTML = normNombre;
      }
    }
    if(t.destinos?.length && destEl){
      const normalize = d => {
        if(/amsterdam/i.test(d)) return 'Países Bajos';
        if(/atenas|mykonos|naxos|santorini|milos|paros|koufonisia/i.test(d)) return 'Grecia';
        if(/estambul|capadocia|estanbul/i.test(d)) return 'Turquía';
        return d;
      };
      const destNorm = [...new Set(t.destinos.map(normalize))];
      destEl.textContent = '🌍 ' + destNorm.slice(0,3).join(' · ') + (destNorm.length > 3 ? ' & más' : '');
    }
    if(t.members?.length){
      const seen = new Map();
      const deduped = [];
      t.members.forEach(m => {
        const key = (m.name||'').toLowerCase().trim();
        if(!seen.has(key)){
          seen.set(key, deduped.length);
          deduped.push({...m});
        } else {
          const existingIdx = seen.get(key);
          if(m.uid && !deduped[existingIdx].uid){ deduped[existingIdx] = {...m}; }
        }
      });
      window.TVL_OVERRIDE = deduped.map((m,i)=>({
        i: m.uid||`T${i}`,
        n: m.name?.split(' ')[0]||`V${i+1}`,
        fn: m.name||`Viajero ${i+1}`,
        a: `av${(i%4)+1}`
      }));
      // Update FN and AV from TVL_OVERRIDE
      FN={};window.TVL_OVERRIDE.forEach(x=>FN[x.i]=x.fn||x.n);
      AV={};window.TVL_OVERRIDE.forEach((x,i)=>AV[x.i]='av'+(i+1));
    }
    // ── Hero sub (fechas + días + viajeros) ──
    if(subEl){
      const from = t.fechaSalida ? fmtDateDisplay(t.fechaSalida) : '';
      const to = t.fechaRegreso ? fmtDateDisplay(t.fechaRegreso) : '';
      const tvlList = window.TVL_OVERRIDE || TVL;
      const dateStr = from && to ? `${from} → ${to}` : from || '';
      let diasStr = '';
      if(t.fechaSalida && t.fechaRegreso){
        const d1=new Date(t.fechaSalida);const d2=new Date(t.fechaRegreso);
        const dias=Math.round((d2-d1)/(1000*60*60*24))+1;
        diasStr=`${dias} días`;
      }
      subEl.textContent = [dateStr, diasStr, tvlList.length ? `${tvlList.length} viajeros` : ''].filter(Boolean).join(' · ');
    }
    // ── Hero pills (destinos dinámicos) ──
    if(pillsEl && t.destinos?.length){
      const FLAG={Amsterdam:'🇳🇱',Ámsterdam:'🇳🇱','Países Bajos':'🇳🇱',Grecia:'🇬🇷',Turquía:'🇹🇷'};
      const normalize = d => {
        if(/amsterdam/i.test(d)) return 'Países Bajos';
        if(/atenas|mykonos|naxos|santorini|milos|paros|koufonisia/i.test(d)) return 'Grecia';
        if(/estambul|capadocia|estanbul/i.test(d)) return 'Turquía';
        return d;
      };
      const destNorm = [...new Set(t.destinos.map(normalize))];
      pillsEl.innerHTML = destNorm.map(d=>`<div class="dest-chip">${escapeHtml((FLAG[d]||'🌍')+' '+d)}</div>`).join('');
    }
    // ── Countdown departure date ──
    if(t.fechaSalida) TRIP_DEPARTURE=new Date(t.fechaSalida+'T00:00:00');

    // ── Role ──
    const user = getAuth().currentUser;
    if(!user) return 'viewer';
    if(t.ownerId === user.uid){sessionStorage.setItem('tp_role','owner');return 'owner';}
    const member = (t.members||[]).find(m=>m.uid===user.uid);
    const role=member?.role||'editor';
    sessionStorage.setItem('tp_role',role);
    return role;
  }catch(e){ console.warn('Could not load trip config', e); return sessionStorage.getItem('tp_role')||'viewer'; }
}

let USER_ROLE = 'editor'; // will be set on load

const setSS=(s,m)=>{document.getElementById('stxt').textContent=m;document.getElementById('sdot').className='sdot'+(s==='ok'?'':s==='warn'?' warn':' err');};

// ── STATE ─────────────────────────────────────────────────
let EM=false,EVTIPO='vuelo',PAGADO='na',HOTEL_PAGO='na';
let AP={i:'ER',a:'av1',n:'Eugenia Romero'};
let PAP={i:'ER',a:'av1',n:'Eugenia Romero'};
let DAYS=[],HOTELS=[],CHECKLIST={},CHECKS={},NOTES=[],PHOTOS=[],PROFILES={},AVATARS={};
let ACTIVITY=[];
let CURRENT_USER_UID=null;
let WEATHER_CACHE={};

const TVL=[{i:'ER',n:'Eugenia',fn:'Eugenia Romero',a:'av1'},{i:'JN',n:'Juan José',fn:'Juan José Noguera',a:'av2'},{i:'VS',n:'Valeria',fn:'Valeria Secchi',a:'av3'},{i:'GG',n:'Gustavo',fn:'Gustavo García',a:'av4'}];
let FN={};TVL.forEach(t=>FN[t.i]=t.fn||t.n);
let AV={};TVL.forEach((t,i)=>AV[t.i]='av'+(i+1));
let TRIP_DEPARTURE=new Date('2026-06-21T00:00:00');

function logActivity(accion,tipo,nombre_item){
  const tvl=window.TVL_OVERRIDE||TVL;
  const yo=tvl.find(t=>t.uid===CURRENT_USER_UID)||tvl[0];
  addDoc(col('activity'),{
    uid:CURRENT_USER_UID,
    initials:yo?.i||'?',
    nombre:yo?.n||'Alguien',
    accion,tipo,nombre_item,
    ts:Date.now()
  }).catch(()=>{});
}
const CL={amsterdam:'Países Bajos',grecia:'Grecia',turquia:'Turquía',transito:'Tránsito'};
const TIPO_COLOR={vuelo:'#2563EB',hotel:'#7C3AED',actividad:'#059669',restaurante:'#DC2626',traslado:'#D97706',otro:'#64748B'};
const TIPO_LABEL={vuelo:'Vuelo',hotel:'Hotel',actividad:'Actividad',restaurante:'Restaurante',traslado:'Traslado',otro:'Otro'};
const TIPO_ICO={vuelo:'✈',hotel:'🏨',actividad:'🎯',restaurante:'🍽',traslado:'🚕',otro:'📌'};
const TIPO_CLS={vuelo:'etype-vuelo',hotel:'etype-hotel',actividad:'etype-actividad',restaurante:'etype-restaurante',traslado:'etype-traslado',otro:'etype-otro'};
const DEST_COLOR={amsterdam:'#B5621E',grecia:'#0891B2',turquia:'#DC4626',transito:'#9C876E'};
const DEST_FLAG={amsterdam:'🇳🇱',grecia:'🇬🇷',turquia:'🇹🇷',transito:'✈'};
const DEST_LABEL={amsterdam:'Países Bajos',grecia:'Grecia',turquia:'Turquía',transito:'Tránsito'};
const PAGO_COLOR={si:'#059669',no:'#D97706',na:null};
let CURRENT_DAY_IDX=0;

// CITY COORDS para clima
const CITY_COORDS={
  amsterdam:{lat:52.37,lon:4.89},
  grecia:{lat:37.97,lon:23.73},
  turquia:{lat:41.01,lon:28.97},
  transito:{lat:null,lon:null}
};

// TEMA
const TM={
  amsterdam:{dest:'🇳🇱 Países Bajos · Amsterdam',title:'Países Bajos<br><em>& Amsterdam</em>'},
  grecia:{dest:'🇬🇷 Grecia & sus Islas',title:'Grecia<br><em>& sus Islas</em>'},
  turquia:{dest:'🇹🇷 Turquía · Estambul & Capadocia',title:'Turquía<br><em>Estambul & Capadocia</em>'}
};
window.setTheme=(t,el)=>{
  document.body.setAttribute('data-theme',t);
  document.querySelectorAll('.tbtn').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  const m=TM[t];if(m){const hd=document.getElementById('hero-dest');const ht=document.getElementById('hero-title');if(hd)hd.textContent=m.dest;if(ht)ht.innerHTML=m.title;}
  try{localStorage.setItem('tp_theme',t);localStorage.setItem('tp_theme_m','1');}catch(e){}
};
try{const s=localStorage.getItem('tp_theme');if(s){const b=document.querySelector(`[data-t="${s}"]`);if(b)setTheme(s,b);}}catch(e){}

// ── WEATHER ───────────────────────────────────────────────
async function getWeather(city, dateStr){
  // dateStr format: "2026-06-22"
  const coords=CITY_COORDS[city];
  if(!coords||!coords.lat||!dateStr||!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const key=`${city}_${dateStr}`;
  if(WEATHER_CACHE[key]) return WEATHER_CACHE[key];
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
    const r=await fetch(url);
    const d=await r.json();
    if(!d.daily||!d.daily.temperature_2m_max||!d.daily.temperature_2m_max[0]) return null;
    const wc=d.daily.weathercode[0];
    const tmax=Math.round(d.daily.temperature_2m_max[0]);
    const tmin=Math.round(d.daily.temperature_2m_min[0]);
    const rain=d.daily.precipitation_probability_max[0];
    const ico=wc<=1?'☀️':wc<=3?'⛅':wc<=48?'🌫':wc<=67?'🌧':wc<=77?'🌨':wc<=82?'🌧':wc<=99?'⛈':'☀️';
    const result={ico,tmax,tmin,rain};
    WEATHER_CACHE[key]=result;
    return result;
  }catch(e){return null;}
}

function fmtDateISO(dateStr){
  // Convert "22 jun" or "2026-06-22" to ISO "2026-06-22"
  if(!dateStr) return null;
  if(dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  // Try to parse "22 jun" style
  const months={ene:'01',feb:'02',mar:'03',abr:'04',may:'05',jun:'06',jul:'07',ago:'08',sep:'09',oct:'10',nov:'11',dic:'12'};
  const m=dateStr.trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]{3})/);
  if(m){const mo=months[m[2]];if(mo)return `2026-${mo}-${m[1].padStart(2,'0')}`;}
  return null;
}

// ── DURATION CALC ─────────────────────────────────────────
window.autoFillVueloTitulo=()=>{
  const orig=document.getElementById('v-cod-origen')?.value.trim()||'';
  const dest=document.getElementById('v-cod-destino')?.value.trim()||'';
  const al=document.getElementById('v-aerolinea')?.value.trim()||'';
  const tit=document.getElementById('ev-titulo');
  if(tit&&(orig||dest)){
    const parts=[al,orig&&dest?orig+'→'+dest:''].filter(Boolean);
    tit.value=parts.join(' · ');
  }
};
window.syncVueloHora=()=>{
  // Sync v-salida → ev-hora so the event time matches departure
  const sal=document.getElementById('v-salida')?.value;
  if(sal) document.getElementById('ev-hora').value=sal;
};
window.calcDuracion=()=>{
  const s=document.getElementById('v-salida').value;
  const l=document.getElementById('v-llegada').value;
  if(!s||!l) return;
  const nextDay=document.getElementById('v-next-day')?.checked?1440:0;
  const [sh,sm]=s.split(':').map(Number);
  const [lh,lm]=l.split(':').map(Number);
  let mins=(lh*60+lm+nextDay)-(sh*60+sm);
  if(mins<0) mins+=24*60;
  const h=Math.floor(mins/60);const m=mins%60;
  const dur=`${h}h ${m>0?m+'m':''}`.trim();
  document.getElementById('v-duracion').value=dur;
  document.getElementById('duracion-auto').textContent=`→ ${dur}${nextDay?'  (+1 día)':''}`;
  document.getElementById('duracion-auto').className='auto-calc';
};

window.calcDuracionTraslado=()=>{
  const s=document.getElementById('ev-hora').value;
  const l=document.getElementById('tr-llegada').value;
  if(!s||!l) return;
  const [sh,sm]=s.split(':').map(Number);
  const [lh,lm]=l.split(':').map(Number);
  let mins=(lh*60+lm)-(sh*60+sm);
  if(mins<0) mins+=24*60;
  const h=Math.floor(mins/60);const m=mins%60;
  const dur=h>0?`${h}h ${m>0?m+'m':''}`.trim():`${m} min`;
  document.getElementById('tr-duracion').value=dur;
  document.getElementById('duracion-traslado-auto').textContent=`→ ${dur}`;
  document.getElementById('duracion-traslado-auto').className='auto-calc';
};

// ── SORT EVENTS BY TIME ───────────────────────────────────
function sortEvents(events){
  // Tag each event with its original index before sorting
  return events.map((e,i)=>({...e,_origIdx:i})).sort((a,b)=>{
    // Sort by fecha+hora combined so cross-day events sort correctly
    const fa=a.fecha||'9999-99-99';const fb=b.fecha||'9999-99-99';
    const ta=a.hora||'99:99';const tb=b.hora||'99:99';
    const ka=`${fa} ${ta}`;const kb=`${fb} ${tb}`;
    return ka.localeCompare(kb);
  });
}

function fmtTimeDisplay(hora){
  if(!hora) return '';
  // hora can be "HH:MM" from time input
  return hora;
}

function fmtDateDisplay(fecha){
  if(!fecha) return '';
  if(fecha.match(/^\d{4}-\d{2}-\d{2}$/)){
    const [y,m,d]=fecha.split('-');
    const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(d)} ${months[parseInt(m)-1]}`;
  }
  return fecha;
}

// Devuelve un Date para un día, usando d.fecha o parseando d.date ("22 jun", "25-26 jun")
function getDateObjFromDay(d){
  if(d.fecha&&d.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(d.fecha+'T12:00:00');
  const str=(d.date||'').trim();
  const months={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
  const m=str.match(/^(\d+)(?:-\d+)?\s+([a-záéíóú]+)/i);
  if(m){
    const day=parseInt(m[1]);
    const mon=months[m[2].toLowerCase()];
    if(!isNaN(day)&&mon!==undefined){
      const yr=parseInt((DAYS.find(x=>x.fecha&&x.fecha.length>=4)?.fecha||'2026').slice(0,4));
      return new Date(yr+'-'+String(mon+1).padStart(2,'0')+'-'+String(day).padStart(2,'0')+'T12:00:00');
    }
  }
  return null;
}

// Normaliza rangos ("25–26 jun") mostrando solo el día de inicio por card
function getDisplayDays(){
  const MNUM={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12};
  const MNAME=['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const yr=parseInt((DAYS.find(x=>x.fecha?.match(/^\d{4}/))?.fecha||'2026').slice(0,4));
  return DAYS.map(d=>{
    const rm=(d.date||'').match(/^(\d+)[-–](\d+)(?:\s*([a-záéíóú]+))?/i);
    if(rm){
      const s=parseInt(rm[1]);
      let mon=rm[3]?MNUM[rm[3].toLowerCase()]:null;
      if(!mon){
        for(const x of DAYS){
          if(x.fecha?.match(/^\d{4}-\d{2}-\d{2}$/)){mon=parseInt(x.fecha.slice(5,7));break;}
          const mm=(x.date||'').match(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i);
          if(mm){mon=MNUM[mm[1].toLowerCase()];break;}
        }
      }
      if(mon&&!isNaN(s)){
        const fecha=`${yr}-${String(mon).padStart(2,'0')}-${String(s).padStart(2,'0')}`;
        return {...d,fecha,date:`${s} ${MNAME[mon]}`,_displayId:d._id};
      }
    }
    return {...d,_displayId:d._id};
  });
}

// ── HOTEL SELECTOR IN EVENT FORM ─────────────────────────
function populateHotelSelector(){
  const sel=document.getElementById('h-selector');
  sel.innerHTML='<option value="">— Elegir hotel guardado —</option>';
  HOTELS.forEach(h=>{
    const o=document.createElement('option');
    o.value=h._id;
    o.textContent=`${h.name} — ${h.city}`;
    sel.appendChild(o);
  });
}

window.fillHotelFromSelector=()=>{
  const id=document.getElementById('h-selector').value;
  if(!id) return;
  const h=HOTELS.find(x=>x._id===id);
  if(!h) return;
  // Auto-fill title with hotel name + city
  const titleEl=document.getElementById('ev-titulo');
  if(h.name && (!titleEl.value || titleEl.value==='Sin título')) titleEl.value=h.name;
  else if(h.name) titleEl.value=h.name;
  if(h.name) document.getElementById('h-nombre').value=h.name;
  if(h.city) document.getElementById('h-ciudad').value=h.city;
  if(h.dir) document.getElementById('h-dir').value=h.dir||'';
  if(h.maps) document.getElementById('h-maps').value=h.maps||'';
  if(h.cinFecha){ document.getElementById('h-cin-fecha').value=h.cinFecha||''; document.getElementById('ev-fecha').value=h.cinFecha||'';}
  if(h.cinHora){ document.getElementById('h-cin-hora').value=h.cinHora||''; document.getElementById('ev-hora').value=h.cinHora||'';}
  if(h.coutFecha) document.getElementById('h-cout-fecha').value=h.coutFecha||'';
  if(h.coutHora) document.getElementById('h-cout-hora').value=h.coutHora||'';
  if(h.conf) document.getElementById('h-conf').value=h.conf||'';
  if(h.tel) document.getElementById('h-tel').value=h.tel||'';
  if(h.notas||h.obs) document.getElementById('h-notas').value=h.notas||h.obs||'';
  if(h.plat) {} // platform not in event form but stored in hotel
};

// ── SEED DATA ─────────────────────────────────────────────
async function seedIfEmpty(){
  if(TRIP_ID) return;
  const s=await getDocs(col('days'));
  if(!s.empty) return;
  const {SD,SH,SC,SN}=await import('./seed.js');
  for(const d of SD) await setDoc(dref('days',d.id),d);
  for(const h of SH) await setDoc(dref('hotels',h.id),h);
  for(const c of SC) await setDoc(dref('checklist',c.id),c);
  for(const n of SN) await addDoc(col('notes'),n);
}
function cacheKey(name){return'tp_cache_'+(TRIP_ID||'root')+'_'+name;}
function saveCache(name,data){try{localStorage.setItem(cacheKey(name),JSON.stringify(data));}catch(e){}}
function loadCache(name){try{const d=localStorage.getItem(cacheKey(name));return d?JSON.parse(d):null;}catch(e){return null;}}

// Tracks which lazy listeners have been registered
const _L={};
// Stores unsubscribe functions for all active Firestore listeners
const _UNSUB={};

// Register listeners for secondary tabs on first visit
function ensureListeners(tab){
  if(tab==='ht'&&!_L.ht){
    _L.ht=true;
    const cachedHT=loadCache('hotels');
    if(cachedHT&&cachedHT.length){HOTELS=cachedHT;renderHotels();updateStats();populateHotelSelector();}
    _UNSUB.hotels=onSnapshot(query(col('hotels'),orderBy('order')),s=>{
      HOTELS=s.docs.map(d=>({...d.data(),_id:d.id}));
      saveCache('hotels',HOTELS);
      renderHotels();updateStats();populateHotelSelector();
    });
  }
  if(tab==='pr'&&!_L.pr){
    _L.pr=true;
    const cachedPR=loadCache('profiles');
    if(cachedPR&&Object.keys(cachedPR).length){PROFILES=cachedPR;renderProfiles();}
    _UNSUB.profiles=onSnapshot(col('profiles'),s=>{
      PROFILES={};s.docs.forEach(d=>PROFILES[d.id]=d.data());
      saveCache('profiles',PROFILES);
      renderProfiles();
    });
  }
  if(tab==='ck'&&!_L.ck){
    _L.ck=true;
    const cachedCL=loadCache('checklist');
    if(cachedCL&&Object.keys(cachedCL).length){CHECKLIST=cachedCL;renderChecklist();}
    const cachedCK=loadCache('checks');
    if(cachedCK&&Object.keys(cachedCK).length){CHECKS=cachedCK;renderChecklist();}
    _UNSUB.checklist=onSnapshot(col('checklist'),s=>{
      const items=s.docs.map(d=>({...d.data(),_id:d.id})).sort((a,b)=>(a.order||0)-(b.order||0));
      CHECKLIST={};items.forEach(i=>{if(!CHECKLIST[i.group])CHECKLIST[i.group]=[];CHECKLIST[i.group].push(i);});
      saveCache('checklist',CHECKLIST);
      renderChecklist();
    });
    _UNSUB.checks=onSnapshot(col('checks'),s=>{
      CHECKS={};s.docs.forEach(d=>CHECKS[d.id]=d.data().done);
      saveCache('checks',CHECKS);
      renderChecklist();
    });
  }
  if(tab==='nt'&&!_L.nt){
    _L.nt=true;
    const cachedNT=loadCache('notes');
    if(cachedNT&&cachedNT.length){NOTES=cachedNT;renderNotes();}
    _UNSUB.notes=onSnapshot(query(col('notes'),orderBy('ts','desc')),s=>{
      NOTES=s.docs.map(d=>({...d.data(),_id:d.id}));
      saveCache('notes',NOTES);
      renderNotes();
      updateMasBadge();
    });
  }
  if(tab==='ft'&&!_L.ft){
    _L.ft=true;
    const cachedFT=loadCache('photos');
    if(cachedFT&&cachedFT.length){PHOTOS=cachedFT;renderPhotos();}
    _UNSUB.photos=onSnapshot(query(col('photos'),orderBy('ts','desc')),s=>{
      PHOTOS=s.docs.map(d=>({...d.data(),_id:d.id}));
      saveCache('photos',PHOTOS);
      renderPhotos();
      updateMasBadge();
    });
  }
  if(tab==='ac'&&!_UNSUB.activity){
    _UNSUB.activity=onSnapshot(query(col('activity'),orderBy('ts','desc'),limit(30)),s=>{
      ACTIVITY=s.docs.map(d=>({_id:d.id,...d.data()}));
      if(document.getElementById('feed-activity'))renderActivity();
    });
  }
}

function initListeners(){
  _UNSUB.days=onSnapshot(query(col('days'),orderBy('order')),s=>{
    DAYS=s.docs.map(d=>({...d.data(),_id:d.id}));
    saveCache('days',DAYS);
    renderDays();updateStats();autoTheme();
  });
  _UNSUB.avatars=onSnapshot(col('avatars'),s=>{
    AVATARS={};s.docs.forEach(d=>AVATARS[d.id]=d.data().data);
    saveCache('avatars',AVATARS);
    renderTvl();renderNotesPbtns();renderPhotoPbtns();renderProfiles();
  });
  setSS('ok','Sincronizado en tiempo real');
  if(USER_ROLE==='viewer'){
    document.getElementById('stxt').innerHTML='👁 Solo lectura';
    document.getElementById('sdot').style.background='#FF9800';
  }
}

function autoTheme(){
  try{if(localStorage.getItem('tp_theme_m'))return;}catch(e){}
  const c={amsterdam:0,grecia:0,turquia:0};
  DAYS.forEach(d=>{if(c[d.city]!==undefined)c[d.city]++;});
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
  if(top&&top[1]>0){const b=document.querySelector(`[data-t="${top[0]}"]`);if(b)window.setTheme(top[0],b);}
}

// ── AUTH GUARD — redirect to index.html if not logged in ─────
await new Promise((resolve) => {
  const _authUnsub = onAuthStateChanged(auth, user => {
    _authUnsub();
    if (!user) {
      window.location.href = 'index.html';
    } else {
      CURRENT_USER_UID = user.uid;
      resolve(user);
    }
  });
});

USER_ROLE = await loadTripInit();
// Hide edit tab for viewers
if(USER_ROLE === 'viewer'){
  const etab = document.getElementById('etab');
  if(etab) etab.style.display = 'none';
}
try{await seedIfEmpty();initListeners();}
catch(e){setSS('err','⚠ Error de conexión');console.error(e);}

// ── AVATARES ──────────────────────────────────────────────
function avHtml(i,cls='',sz=34){
  // Look up avatar by UID, then by legacy key position
  let d = AVATARS[i];
  if(!d){
    // Try legacy keys by matching TVL position
    const tvlList = window.TVL_OVERRIDE || TVL;
    const legacyKeys = ['ER','JN','VS','GG'];
    const idx = tvlList.findIndex(t => t.i === i);
    if(idx >= 0 && idx < legacyKeys.length) d = AVATARS[legacyKeys[idx]];
  }
  // Get initials from TVL_OVERRIDE or fallback
  const tvlList = window.TVL_OVERRIDE || TVL;
  const tvlItem = tvlList.find(t => t.i === i);
  const initials = tvlItem ? tvlItem.fn.split(' ').map(w=>w[0]).slice(0,2).join('') : i.slice(0,2).toUpperCase();
  const av = AV[i] || `av${(tvlList.findIndex(t=>t.i===i)%4)+1 || 1}`;
  if(d)return `<div class="av ${av} ${cls}" style="width:${sz}px;height:${sz}px" onclick="triggerAv('${i}')"><img src="${d}" alt="${i}"><div class="av-up">📷</div></div>`;
  return `<div class="av ${av} np ${cls}" style="width:${sz}px;height:${sz}px" onclick="triggerAv('${i}')">${initials}<div class="av-up">📷</div></div>`;
}
window.triggerAv=key=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=async e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async ev=>{const c=await compressImg(ev.target.result,200,.8);// Save under both the key and legacy key if applicable
await setDoc(dref('avatars',key),{data:c});
// Also save under legacy key for backward compat
const tvlList=window.TVL_OVERRIDE||TVL;
const legacyKeys=['ER','JN','VS','GG'];
const idx=tvlList.findIndex(t=>t.i===key);
if(idx>=0&&idx<legacyKeys.length&&legacyKeys[idx]!==key){await setDoc(dref('avatars',legacyKeys[idx]),{data:c});}
};r.readAsDataURL(f);};inp.click();};
function renderTvl(){
  const tvl = window.TVL_OVERRIDE || TVL;
  const names = tvl.map(t=>t.fn.split(' ')[0]).join(', ');
  document.getElementById('tvl-list').innerHTML=
    tvl.map((t,i)=>`<div class="traveler">${avHtml(t.i,'',30)}</div>`).join('')+
    `<span class="traveler-names">${names}</span>`;}
function renderNotesPbtns(){const tvlList=window.TVL_OVERRIDE||TVL;document.getElementById('note-pbtns').innerHTML=tvlList.map(t=>`<div onclick="selP('${t.i}','${t.a||'av1'}','${t.fn}',this)">${avHtml(t.i,'pbtn'+(AP.i===t.i?' sel':''),36)}</div>`).join('');}
function renderPhotoPbtns(){const tvlList=window.TVL_OVERRIDE||TVL;document.getElementById('photo-pbtns').innerHTML=tvlList.map(t=>`<div onclick="selPhotoP('${t.i}','${t.a||'av1'}','${t.fn}',this)">${avHtml(t.i,'pbtn'+(PAP.i===t.i?' sel':''),36)}</div>`).join('');}

// ── HELPERS ───────────────────────────────────────────────
window.cm=id=>document.getElementById(id).classList.remove('open');
window.om=id=>{
  document.getElementById(id).classList.add('open');
  // Close on backdrop tap
  const el=document.getElementById(id);
  el.onclick=e=>{if(e.target===el)cm(id);};
};

window.resetMasTab=()=>{const t=document.getElementById('main-tab-mas');if(t){t.classList.remove('active');const lbl=t.querySelector('.ntab-label');if(lbl)lbl.textContent='Más';}};
window.toggleMasMenu=(e,el)=>{e.stopPropagation();const d=document.getElementById('mas-dropdown');const o=document.getElementById('mas-overlay');if(d.style.display==='block'){closeMasMenu();return;}const r=el.getBoundingClientRect();// Nav is now fixed at bottom — open dropdown upward
d.style.top='auto';d.style.bottom=(window.innerHeight-r.top+6)+'px';d.style.left=Math.max(8,Math.min(r.left,window.innerWidth-200))+'px';d.style.display='block';o.style.display='block';};
window.closeMasMenu=()=>{document.getElementById('mas-dropdown').style.display='none';document.getElementById('mas-overlay').style.display='none';};
window.showTabMas=(n,label)=>{
  localStorage.setItem('tabi-last-seen',Date.now().toString());
  updateMasBadge();
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById('tab-'+n).classList.add('active');const t=document.getElementById('main-tab-mas');if(t){t.classList.add('active');const lbl=t.querySelector('.ntab-label');if(lbl)lbl.textContent=label;}closeMasMenu();ensureListeners(n);
};
window.showTab=(n,el)=>{document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));document.getElementById('tab-'+n).classList.add('active');el.classList.add('active');ensureListeners(n);if(n==='gs')calcGastos();};
window.toggleEdit=el=>{
  if(USER_ROLE==='viewer'){
    alert('Tenés acceso de solo lectura en este viaje. Pedile al creador que te dé permisos de edición.');
    return;
  }
  EM=!EM;el.textContent=EM?'✓ Listo':'✏ Editar';el.style.color=EM?'#4CAF50':'';renderDays();renderHotels();};
window.selP=(i,a,n,el)=>{AP={i,a,n};document.querySelectorAll('#note-pbtns .pbtn').forEach(b=>b.classList.remove('sel'));el.querySelector('.pbtn')?.classList.add('sel');};
window.selPhotoP=(i,a,n,el)=>{PAP={i,a,n};document.querySelectorAll('#photo-pbtns .pbtn').forEach(b=>b.classList.remove('sel'));el.querySelector('.pbtn')?.classList.add('sel');};
window.togDay=id=>{
  const body=document.getElementById('db'+id);
  const chev=document.getElementById('ch'+id);
  const isOpen=body.classList.contains('open');
  // Close all other open cards (accordion)
  document.querySelectorAll('.day-body.open').forEach(b=>{
    if(b.id!=='db'+id){
      b.classList.remove('open');
      const c=document.getElementById('ch'+b.id.slice(2));
      if(c)c.classList.remove('open');
    }
  });
  // Toggle this card
  body.classList.toggle('open',!isOpen);
  chev.classList.toggle('open',!isOpen);
  const origId=id.replace(/_exp\d+$/,'');
  const d=DAYS.find(x=>x._id===origId);
  if(d&&d.city&&d.city!=='transito'&&!isOpen){
    const b=document.querySelector(`[data-t="${d.city}"]`);
    if(b)window.setTheme(d.city,b);
  }
};

// Auto-open today's day card
function autoOpenToday(){
  const todayISO=new Date().toISOString().slice(0,10);
  const todayDay=DAYS.find(d=>d.fecha===todayISO);
  if(todayDay){
    const body=document.getElementById('db'+todayDay._id);
    const chev=document.getElementById('ch'+todayDay._id);
    if(body&&!body.classList.contains('open')){
      body.classList.add('open');
      if(chev)chev.classList.add('open');
      // Also set theme
      if(todayDay.city&&todayDay.city!=='transito'){
        const b=document.querySelector(`[data-t="${todayDay.city}"]`);
        if(b)window.setTheme(todayDay.city,b);
      }
      // Scroll to it
      setTimeout(()=>body.closest('.day-card')?.scrollIntoView({behavior:'smooth',block:'start'}),300);
    }
  }
}

// ── TIPO & PAGO ───────────────────────────────────────────
window.selTipo=(t,el)=>{
  // Hide/show top hora+fecha for vuelo (they're duplicated by v-salida)
  const topTime = document.querySelector('.f2:has(#ev-hora)');
  if(topTime) topTime.style.display = t==='vuelo' ? 'none' : '';
  EVTIPO=t;
  document.querySelectorAll('.etype-btn').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  ['vuelo','hotel','actividad','restaurante','traslado','otro'].forEach(tp=>{
    const e=document.getElementById('campos-'+tp);if(e)e.style.display=tp===t?'block':'none';
  });
  const labels={vuelo:'Ruta del vuelo',hotel:'Nombre del hotel',actividad:'Nombre de la actividad',restaurante:'Nombre del restaurante',traslado:'Descripción del traslado',otro:'Título'};
  document.getElementById('ev-titulo-lbl').textContent=labels[t]||'Título';
  if(t==='hotel') populateHotelSelector();
};
window.setPago=(v)=>{PAGADO=v;['si','no','na'].forEach(x=>{const b=document.getElementById('pago-'+x);b.className='ptbtn'+(x===v?' '+x:'');});};
window.setHotelPago=(v)=>{HOTEL_PAGO=v;['si','no','na'].forEach(x=>{const b=document.getElementById('ht-pago-'+x);if(b)b.className='ptbtn'+(x===v?' '+x:'');});};

// ── EVENTS ────────────────────────────────────────────────
window.openNewEv=dayId=>{
  document.getElementById('m-ev-t').textContent='Nuevo evento';
  document.getElementById('ev-di').value=dayId;document.getElementById('ev-ei').value='';
  document.getElementById('ev-hora').value='';document.getElementById('ev-fecha').value='';
  const nd=document.getElementById('v-next-day');if(nd)nd.checked=false;
  document.getElementById('ev-titulo').value='';
  ['v-cod-origen','v-cod-destino','v-eq-maleta','v-eq-carry','v-eq-mano','v-aerolinea','v-numero','v-origen','v-destino','v-salida','v-llegada','v-duracion','v-terminal','v-escala','v-pnr','v-clase','v-equipaje','v-asientos','v-notas',
   'h-nombre','h-ciudad','h-dir','h-maps','h-cin-fecha','h-cin-hora','h-cout-fecha','h-cout-hora','h-conf','h-tel','h-notas',
   'a-lugar','a-maps','a-horafin','a-precio','a-conf','a-proveedor','a-link','a-notas',
   'r-nombre','r-dir','r-maps','r-cocina','r-precio','r-conf','r-link','r-notas',
   'tr-origen','tr-destino','tr-maps-o','tr-maps-d','tr-llegada','tr-duracion','tr-precio','tr-conf','tr-notas',
   'o-lugar','o-maps','o-notas'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('r-reserva').value='';document.getElementById('tr-medio').value='';
  document.getElementById('duracion-auto').textContent='';document.getElementById('duracion-traslado-auto').textContent='';
  selTipo('vuelo',document.querySelector('[data-tipo="vuelo"]'));
  setPago('na');
  document.getElementById('b-edel').style.display='none';
  document.getElementById('ev-monto').value='';
  document.getElementById('ev-moneda').value='EUR';
  resetParticipantes();
  document.getElementById('costo-pp').classList.remove('show');
  document.getElementById('costo-pp').textContent='';
  resetSubtipo();
  const docLinkInp=document.getElementById('ev-doc-link');
  if(docLinkInp){docLinkInp.value='';const pr=document.getElementById('ev-doc-link-preview');if(pr)pr.style.display='none';}
  om('m-ev');
};

window.openEditEv=(dayId,ei)=>{
  const d=DAYS.find(x=>x._id===dayId);if(!d)return;const ev=d.events[ei];
  document.getElementById('m-ev-t').textContent='Editar evento';
  document.getElementById('ev-di').value=dayId;document.getElementById('ev-ei').value=ei;
  document.getElementById('ev-hora').value=ev.hora||'';
  document.getElementById('ev-fecha').value=ev.fecha||'';
  document.getElementById('ev-titulo').value=ev.titulo||ev.tt||'';
  const tipo=ev.tipo||'otro';
  const btn=document.querySelector(`[data-tipo="${tipo}"]`);
  if(btn)selTipo(tipo,btn);
  const x=ev.extras||{};
  // Fill fields
  const fieldMap={
    vuelo:['aerolinea','numero','origen','destino','salida','llegada','duracion','terminal','escala','pnr','clase','equipaje','asientos','notas'],
    hotel:['nombre','ciudad','dir','maps','cin-fecha','cin-hora','cout-fecha','cout-hora','conf','tel','notas'],
    actividad:['lugar','maps','horafin','precio','conf','proveedor','link','notas'],
    restaurante:['nombre','dir','maps','cocina','precio','conf','reserva','link','notas'],
    traslado:['origen','destino','maps-o','maps-d','llegada','duracion','precio','conf','notas'],
    otro:['lugar','maps','notas']
  };
  const prefix={vuelo:'v-',hotel:'h-',actividad:'a-',restaurante:'r-',traslado:'tr-',otro:'o-'};
  (fieldMap[tipo]||[]).forEach(f=>{
    const el=document.getElementById((prefix[tipo]||'')+f);
    if(el&&x[f.replace('-','')]!==undefined) el.value=x[f.replace('-','')]||'';
    else if(el&&x[f]!==undefined) el.value=x[f]||'';
  });
  // Special: cinFecha etc
  if(tipo==='hotel'){
    if(x.cinFecha) document.getElementById('h-cin-fecha').value=x.cinFecha;
    if(x.cinHora) document.getElementById('h-cin-hora').value=x.cinHora;
    if(x.coutFecha) document.getElementById('h-cout-fecha').value=x.coutFecha;
    if(x.coutHora) document.getElementById('h-cout-hora').value=x.coutHora;
  }
  if(tipo==='traslado'){
    if(x.mapsO) document.getElementById('tr-maps-o').value=x.mapsO;
    if(x.mapsD) document.getElementById('tr-maps-d').value=x.mapsD;
  }
  setPago(ev.pago||'na');
  document.getElementById('b-edel').style.display='inline-block';
  document.getElementById('ev-monto').value=ev.monto||'';
  document.getElementById('ev-moneda').value=ev.moneda||'EUR';
  setParticipantes(ev.participantes||[]);
  calcCostoPP();
  if(tipo==='actividad')setSubtipo(ev.extras?.subtipo||'actividad');
  const docLinkInput=document.getElementById('ev-doc-link');
  if(docLinkInput){
    const val=ev.extras?.docLink||ev.docLink||'';
    docLinkInput.value=val;
    const preview=document.getElementById('ev-doc-link-preview');
    const btn=document.getElementById('ev-doc-link-btn');
    if(preview&&btn){preview.style.display=val?'block':'none';if(val)btn.href=val;}
  }
  om('m-ev');
};

function collectExtras(){
  const x={};
  if(EVTIPO==='vuelo'){
    ['aerolinea','numero','origen','destino','salida','llegada','duracion','terminal','escala','pnr','clase','equipaje','notas'].forEach(f=>{const el=document.getElementById('v-'+f);if(el)x[f]=el.value;});
  }else if(EVTIPO==='hotel'){
    ['nombre','ciudad','dir','maps'].forEach(f=>{const el=document.getElementById('h-'+f);if(el)x[f]=el.value;});
    x.cinFecha=document.getElementById('h-cin-fecha').value;
    x.cinHora=document.getElementById('h-cin-hora').value;
    x.coutFecha=document.getElementById('h-cout-fecha').value;
    x.coutHora=document.getElementById('h-cout-hora').value;
    ['conf','tel','notas'].forEach(f=>{const el=document.getElementById('h-'+f);if(el)x[f]=el.value;});
  }else if(EVTIPO==='actividad'){
    ['lugar','maps','horafin','precio','conf','proveedor','link','notas'].forEach(f=>{const el=document.getElementById('a-'+f);if(el)x[f]=el.value;});
  }else if(EVTIPO==='restaurante'){
    ['nombre','dir','maps','cocina','precio','conf','reserva','link','notas'].forEach(f=>{const el=document.getElementById('r-'+f);if(el)x[f]=el.value;});
  }else if(EVTIPO==='traslado'){
    ['origen','destino','llegada','duracion','precio','conf','notas'].forEach(f=>{const el=document.getElementById('tr-'+f);if(el)x[f]=el.value;});
    x.mapsO=document.getElementById('tr-maps-o').value;
    x.mapsD=document.getElementById('tr-maps-d').value;
    x.medio=document.getElementById('tr-medio').value;
  }else{
    ['lugar','maps','notas'].forEach(f=>{const el=document.getElementById('o-'+f);if(el)x[f]=el.value;});
  }
  return x;
}

window.savEv=async()=>{
  if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}
  const titulo=document.getElementById('ev-titulo').value.trim();
  if(!titulo){showFieldError('ev-titulo','El título es obligatorio');return;}
  const di=document.getElementById('ev-di').value;const ei=document.getElementById('ev-ei').value;
  const monto=parseFloat(document.getElementById('ev-monto').value)||0;
  const moneda=document.getElementById('ev-moneda').value;
  const participantes=getParticipantes();
  const _tvlMe=TVL.find(t=>t.uid===getAuth().currentUser?.uid);
  const _editorI=_tvlMe?.i||(getAuth().currentUser?.email||'?')[0].toUpperCase();
  const extras=collectExtras();
  if(EVTIPO==='actividad')extras.subtipo=EVSUBTIPO;
  const docLink=document.getElementById('ev-doc-link')?.value.trim()||null;
  const o={tipo:EVTIPO,hora:document.getElementById('ev-hora').value||'',fecha:document.getElementById('ev-fecha').value||'',titulo,pago:PAGADO,extras,monto,moneda,participantes,docLink,_lastEdit:{user:_editorI,ts:Date.now()}};
  const d=DAYS.find(x=>x._id===di);if(!d)return;
  const evs=[...(d.events||[])];
  if(ei!=='')evs[parseInt(ei)]=o;else evs.push(o);
  const sorted=sortEvents(evs);
  const _btn=document.querySelector('#m-ev .bsav');
  if(_btn){_btn.disabled=true;_btn.textContent='Guardando...';}
  try{
    await updateDoc(dref('days',di),{events:sorted});
    cm('m-ev');
    showToast('Evento guardado','success');
    logActivity(ei!==''?'editó':'agregó','evento',titulo);
  }catch(e){
    console.error(e);
    showToast('⚠ Error al guardar el evento','error');
  }finally{
    if(_btn){_btn.disabled=false;_btn.textContent='Guardar';}
  }
};
window.delEv=async()=>{
  if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}
  if(!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.'))return;
  const di=document.getElementById('ev-di').value;const ei=parseInt(document.getElementById('ev-ei').value);const d=DAYS.find(x=>x._id===di);if(!d)return;const evs=[...(d.events||[])];const _titulo=evs[ei]?.titulo||'evento';evs.splice(ei,1);await updateDoc(dref('days',di),{events:evs});cm('m-ev');showToast('Evento eliminado');logActivity('eliminó','evento',_titulo);
};

// ── DAYS ──────────────────────────────────────────────────
window.openNewDay=()=>{document.getElementById('m-day-t').textContent='Nuevo día';document.getElementById('d-idx').value='';document.getElementById('d-label').value='';document.getElementById('d-fecha').value='';document.getElementById('d-city').value='amsterdam';document.getElementById('b-ddel').style.display='none';om('m-day');};
window.openEditDay=id=>{const d=DAYS.find(x=>x._id===id);if(!d)return;document.getElementById('m-day-t').textContent='Editar día';document.getElementById('d-idx').value=id;document.getElementById('d-label').value=d.label;document.getElementById('d-fecha').value=d.fecha||'';document.getElementById('d-city').value=d.city;document.getElementById('b-ddel').style.display='inline-block';om('m-day');};
window.savDay=async()=>{
  if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}
  const label=document.getElementById('d-label').value.trim();
  if(!label){showFieldError('d-label','El título del día es obligatorio');return;}
  const idx=document.getElementById('d-idx').value;
  const fechaISO=document.getElementById('d-fecha').value;
  const dateDisp=fechaISO?fmtDateDisplay(fechaISO):(document.getElementById('d-fecha').value||'');
  const o={date:dateDisp||'—',fecha:fechaISO||'',label,city:document.getElementById('d-city').value,order:idx?(DAYS.find(x=>x._id===idx)?.order||99):DAYS.length+1,events:idx?(DAYS.find(x=>x._id===idx)?.events||[]):[]};
  const _btn=document.querySelector('#m-day .bsav');
  if(_btn){_btn.disabled=true;_btn.textContent='Guardando...';}
  try{
    if(idx)await setDoc(dref('days',idx),o);else await addDoc(col('days'),o);
    cm('m-day');
    showToast('Día guardado','success');
    logActivity(idx?'editó':'agregó','día',label);
  }catch(e){
    console.error(e);
    showToast('⚠ Error al guardar el día','error');
  }finally{
    if(_btn){_btn.disabled=false;_btn.textContent='Guardar';}
  }
};
window.delDay=async()=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}const idx=document.getElementById('d-idx').value;if(idx&&confirm('¿Eliminar este día y todos sus eventos? Esta acción no se puede deshacer.')){await deleteDoc(dref('days',idx));cm('m-day');showToast('Día eliminado');}};

// ── HOTELS ────────────────────────────────────────────────
window.openNewHotel=()=>{
  document.getElementById('m-hotel-t').textContent='Nuevo alojamiento';
  document.getElementById('ht-idx').value='';
  ['ht-name','ht-city','ht-dir','ht-maps','ht-cin-fecha','ht-cin-hora','ht-cout-fecha','ht-cout-hora','ht-conf','ht-tel','ht-hab','ht-desayuno','ht-link','ht-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('ht-plat').value='';
  document.getElementById('b-hdel').style.display='none';
  setHotelPago('no');
  om('m-hotel');
};
window.openEditHotel=id=>{
  const h=HOTELS.find(x=>x._id===id);if(!h)return;
  document.getElementById('m-hotel-t').textContent='Editar alojamiento';
  document.getElementById('ht-idx').value=id;
  document.getElementById('ht-name').value=h.name||'';
  document.getElementById('ht-city').value=h.city||'';
  document.getElementById('ht-dir').value=h.dir||'';
  document.getElementById('ht-maps').value=h.maps||'';
  document.getElementById('ht-cin-fecha').value=h.cinFecha||'';
  document.getElementById('ht-cin-hora').value=h.cinHora||'';
  document.getElementById('ht-cout-fecha').value=h.coutFecha||'';
  document.getElementById('ht-cout-hora').value=h.coutHora||'';
  document.getElementById('ht-conf').value=h.conf||'';
  document.getElementById('ht-plat').value=h.plat||'';
  document.getElementById('ht-tel').value=h.tel||'';
  document.getElementById('ht-hab').value=h.hab||'';
  document.getElementById('ht-desayuno').value=h.desayuno||'';
  document.getElementById('ht-link').value=h.link||'';
  document.getElementById('ht-obs').value=h.obs||'';
  document.getElementById('b-hdel').style.display='inline-block';
  setHotelPago(h.pago||'no');
  om('m-hotel');
};
window.savHotel=async()=>{
  if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}
  const name=document.getElementById('ht-name').value.trim();
  if(!name){showFieldError('ht-name','El nombre del hotel es obligatorio');return;}
  const idx=document.getElementById('ht-idx').value;
  const c=document.getElementById('ht-city').value.toLowerCase();
  const cc=c.includes('amster')?'p-amsterdam':c.includes('santa')||c.includes('aten')||c.includes('mykon')||c.includes('naxo')||c.includes('koufo')||c.includes('paros')||c.includes('milos')||c.includes('grecia')?'p-grecia':c.includes('estam')||c.includes('turq')||c.includes('capado')?'p-turquia':'p-transito';
  const cinF=document.getElementById('ht-cin-fecha').value;const cinH=document.getElementById('ht-cin-hora').value;
  const coutF=document.getElementById('ht-cout-fecha').value;const coutH=document.getElementById('ht-cout-hora').value;
  // Validate checkout is after checkin
  if(cinF && coutF && new Date(coutF) <= new Date(cinF)){showFieldError('ht-cout-fecha','El check-out debe ser posterior al check-in');return;}
  // Calc nights
  let noch='';
  if(cinF&&coutF){const d1=new Date(cinF);const d2=new Date(coutF);const diff=Math.round((d2-d1)/(1000*60*60*24));noch=diff>0?`${diff} noche${diff>1?'s':''}`:'1 noche';}
  const o={
    name:document.getElementById('ht-name').value||'Hotel',
    city:document.getElementById('ht-city').value,cc,
    dir:document.getElementById('ht-dir').value,
    maps:document.getElementById('ht-maps').value,
    cinFecha:cinF,cinHora:cinH,
    coutFecha:coutF,coutHora:coutH,
    noch,
    conf:document.getElementById('ht-conf').value,
    plat:document.getElementById('ht-plat').value,
    tel:document.getElementById('ht-tel').value,
    hab:document.getElementById('ht-hab').value,
    desayuno:document.getElementById('ht-desayuno').value,
    link:document.getElementById('ht-link').value,
    obs:document.getElementById('ht-obs').value,
    pago:HOTEL_PAGO,
    order:idx?(HOTELS.find(x=>x._id===idx)?.order||99):HOTELS.length+1
  };
  const _btn=document.querySelector('#m-hotel .bsav');
  if(_btn){_btn.disabled=true;_btn.textContent='Guardando...';}
  try{
    if(idx)await setDoc(dref('hotels',idx),o);else await addDoc(col('hotels'),o);
    cm('m-hotel');
    showToast('Alojamiento guardado','success');
    logActivity(idx?'editó':'agregó','hotel',o.name);
  }catch(e){
    console.error(e);
    showToast('⚠ Error al guardar el alojamiento','error');
  }finally{
    if(_btn){_btn.disabled=false;_btn.textContent='Guardar';}
  }
};
window.delHotel=async()=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}const idx=document.getElementById('ht-idx').value;if(idx&&confirm('¿Eliminar este alojamiento? Esta acción no se puede deshacer.')){const _hname=HOTELS.find(x=>x._id===idx)?.name||'hotel';await deleteDoc(dref('hotels',idx));cm('m-hotel');showToast('Alojamiento eliminado');logActivity('eliminó','hotel',_hname);}};

// ── CHECKLIST ─────────────────────────────────────────────
window.openNewChk=gk=>{document.getElementById('m-chk-t').textContent='Nueva tarea · '+gk;document.getElementById('ck-gk').value=gk;document.getElementById('ck-idx').value='';document.getElementById('ck-txt').value='';document.getElementById('b-ckdel').style.display='none';om('m-chk');};
window.openEditChk=(gk,id)=>{const item=(CHECKLIST[gk]||[]).find(x=>x._id===id||x.id===id);if(!item)return;document.getElementById('m-chk-t').textContent='Editar tarea';document.getElementById('ck-gk').value=gk;document.getElementById('ck-idx').value=item._id||item.id;document.getElementById('ck-txt').value=item.text;document.getElementById('b-ckdel').style.display='inline-block';om('m-chk');};
window.savChk=async()=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}const gk=document.getElementById('ck-gk').value;const idx=document.getElementById('ck-idx').value;const txt=document.getElementById('ck-txt').value.trim();if(!txt){showFieldError('ck-txt','La descripción es obligatoria');return;}const _btn=document.querySelector('#m-chk .bsav');if(_btn){_btn.disabled=true;_btn.textContent='Guardando...';}try{if(idx)await updateDoc(dref('checklist',idx),{text:txt});else await setDoc(dref('checklist','c'+Date.now()),{id:'c'+Date.now(),group:gk,text:txt,order:100+Date.now()%1000});cm('m-chk');showToast('Tarea guardada','success');}catch(e){console.error(e);showToast('⚠ Error al guardar la tarea','error');}finally{if(_btn){_btn.disabled=false;_btn.textContent='Guardar';}}};
window.delChk=async()=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}const idx=document.getElementById('ck-idx').value;if(idx&&confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')){await deleteDoc(dref('checklist',idx));cm('m-chk');showToast('Tarea eliminada');}};
window.toggleChk=async id=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}await setDoc(dref('checks',id),{done:!CHECKS[id]});};

// ── NOTES ─────────────────────────────────────────────────
window.addNote=async()=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}const inp=document.getElementById('n-inp');const txt=inp.value.trim();if(!txt)return;try{await addDoc(col('notes'),{person:AP.i,personAv:AP.a,personName:AP.n,text:txt,date:new Date().toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),ts:Date.now()});inp.value='';logActivity('agregó','nota',txt.slice(0,30));}catch(e){console.error(e);showToast('⚠ Error al guardar la nota');}};
window.delNote=async id=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}if(confirm('¿Eliminar nota?'))await deleteDoc(dref('notes',id));};

// ── PHOTOS ────────────────────────────────────────────────
window.handlePhotos=async event=>{
  if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}
  const files=[...event.target.files];const caption=document.getElementById('photo-caption').value.trim();const prog=document.getElementById('upload-prog');prog.style.display='block';
  for(let i=0;i<files.length;i++){prog.textContent=`Subiendo ${i+1} de ${files.length}...`;try{const dataUrl=await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(files[i]);});let c=await compressImg(dataUrl,600,.65);if(c.length>900000)c=await compressImg(dataUrl,400,.55);await addDoc(col('photos'),{data:c,caption,person:PAP.i,personAv:PAP.a,personName:PAP.n,ts:Date.now(),date:new Date().toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})});logActivity('agregó','foto',caption||files[i].name);}catch(e){console.error(e);}}
  prog.style.display='none';document.getElementById('photo-caption').value='';event.target.value='';
};
async function compressImg(dataUrl,maxPx,q){return new Promise(res=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>maxPx||h>maxPx){if(w>h){h=Math.round(h*maxPx/w);w=maxPx;}else{w=Math.round(w*maxPx/h);h=maxPx;}}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',q));};img.src=dataUrl;});}
window.delPhoto=async id=>{if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}if(confirm('¿Eliminar?'))await deleteDoc(dref('photos',id));};
window.openViewer=(data,cap)=>{const vimg=document.getElementById('vimg');vimg.src=data;vimg.alt=cap||'Foto del viaje';document.getElementById('vcap').textContent=cap;document.getElementById('vbg').classList.add('open');};
window.closeViewer=()=>document.getElementById('vbg').classList.remove('open');

// ── PROFILES ──────────────────────────────────────────────
// Smart profile lookup: checks by UID, legacy key (JN/ER), and name match
function getProfile(tvlItem){
  // 1. Direct key match (UID or legacy)
  if(PROFILES[tvlItem.i]) return PROFILES[tvlItem.i];
  // 2. Search all profiles for a name match (handles migrated trips)
  const nameLower = tvlItem.fn.toLowerCase().split(' ')[0];
  const match = Object.values(PROFILES).find(p => p._name?.toLowerCase().includes(nameLower));
  if(match) return match;
  // 3. Try legacy keys JN/ER/VS/GG mapped by position
  const legacyKeys = ['ER','JN','VS','GG'];
  const tvlList = window.TVL_OVERRIDE || TVL;
  const idx = tvlList.findIndex(t => t.i === tvlItem.i);
  if(idx >= 0 && idx < legacyKeys.length && PROFILES[legacyKeys[idx]]){
    return PROFILES[legacyKeys[idx]];
  }
  return {};
}

window.openEditProfile = key => {
  const tvlList = window.TVL_OVERRIDE || TVL;
  const tvlItem = tvlList.find(t => t.i === key) || {i:key, fn:key, n:key};
  const p = getProfile(tvlItem);
  const displayName = tvlItem.fn || FN[key] || key;
  document.getElementById('m-profile-t').textContent = 'Perfil de ' + displayName;
  document.getElementById('prof-key').value = key;
  ['comida','shopping','actividades','ritmo','nota'].forEach(f =>
    document.getElementById('prof-'+f).value = p[f]||''
  );
  om('m-profile');
};

window.savProfile = async () => {
  if(USER_ROLE==='viewer'){showToast('Solo lectura — no tenés permisos para editar');return;}
  const key = document.getElementById('prof-key').value;
  const tvlList = window.TVL_OVERRIDE || TVL;
  const tvlItem = tvlList.find(t => t.i === key) || {i:key};
  const saveKey = tvlItem.i;
  const data = {
    comida: document.getElementById('prof-comida').value,
    shopping: document.getElementById('prof-shopping').value,
    actividades: document.getElementById('prof-actividades').value,
    ritmo: document.getElementById('prof-ritmo').value,
    nota: document.getElementById('prof-nota').value,
    _name: tvlItem.fn || key, // store name for lookup
  };
  const _btn=document.querySelector('#m-profile .bsav');
  if(_btn){_btn.disabled=true;_btn.textContent='Guardando...';}
  try{
    await setDoc(dref('profiles', saveKey), data);
    cm('m-profile');
    showToast('Perfil actualizado','success');
  }catch(e){
    console.error(e);
    showToast('⚠ Error al guardar el perfil','error');
  }finally{
    if(_btn){_btn.disabled=false;_btn.textContent='Guardar perfil';}
  }
};

// ── RENDERS ───────────────────────────────────────────────
function pagoBadge(p){if(!p||p==='na')return'';return`<span class="badge-pago ${p==='si'?'si':'no'}">${p==='si'?'✓ Pago':'⏳ Pendiente'}</span>`;}

function buildActionBtns(ev){
  const x=ev.extras||{};
  let primary=''; let secondary='';

  // ── PRIMARY: most important single action per type ──
  if(ev.tipo==='vuelo'&&x.numero){
    const date=ev.fecha?ev.fecha.replace(/-/g,''):'';
    const url=`https://www.flightradar24.com/${x.numero}/${date}`;
    primary=`<a href="${url}" target="_blank" class="action-btn action-primary">✈ Ver estado del vuelo</a>`;
  } else if((ev.tipo==='actividad'||ev.tipo==='restaurante'||ev.tipo==='hotel')&&(x.maps||x.lugar||x.dir||x.nombre)){
    const href=x.maps&&x.maps.startsWith('http')?x.maps:`https://maps.google.com/maps?q=${encodeURIComponent(x.lugar||x.dir||x.nombre||'')}`;
    primary=`<a href="${href}" target="_blank" class="action-btn action-primary">📍 Ver en Maps</a>`;
  } else if(ev.tipo==='traslado'&&x.origen&&x.destino){
    const o=encodeURIComponent(x.origen);const d=encodeURIComponent(x.destino);
    primary=`<a href="https://www.google.com/maps/dir/${o}/${d}" target="_blank" class="action-btn action-primary">🗺 Cómo llegar</a>`;
  }

  // ── SECONDARY: extra actions when relevant ──
  if(ev.tipo==='vuelo'&&ev.docLink){
    secondary+=`<a href="${escapeHtml(ev.docLink)}" target="_blank" rel="noopener noreferrer" class="action-btn action-secondary">📎 Ver documento</a>`;
  }
  if(ev.tipo==='vuelo'&&(x.maps||(x.origen&&x.destino))){
    // Flight already has primary, add maps as secondary if available
  }
  if(ev.tipo==='actividad'&&x.link&&x.link.startsWith('http')){
    secondary+=`<a href="${x.link}" target="_blank" class="action-btn action-secondary">🔗 Ver reserva</a>`;
  }
  if(ev.tipo==='restaurante'&&x.link&&x.link.startsWith('http')){
    secondary+=`<a href="${x.link}" target="_blank" class="action-btn action-secondary">🔗 Web del restaurante</a>`;
  }
  if(ev.tipo==='hotel'&&x.maps&&x.maps.startsWith('http')&&primary){
    // Already showing maps as primary
  }
  if(ev.tipo==='traslado'&&x.mapsO&&x.mapsD){
    secondary+=`<a href="${x.mapsO}" target="_blank" class="action-btn action-secondary">📍 Origen</a>`;
    secondary+=`<a href="${x.mapsD}" target="_blank" class="action-btn action-secondary">📍 Destino</a>`;
  }

  if(!primary&&!secondary) return '';
  return `<div class="ecard-btns">
    ${primary}
    ${secondary}
  </div>`;
}

// Generate a unique card ID for expand/collapse
function ecardId(dayId,j){ return `ec-${dayId}-${j}`; }

function buildDetails(ev){
  const tipo=ev.tipo||'otro';
  const x=ev.extras||{};
  let d='';
  // Show pago + monto at top of details
  if(ev.pago&&ev.pago!=='na'){
    const pagoLabel=ev.pago==='si'?'✓ Pago':'⏳ Pendiente';
    const pagoColor=ev.pago==='si'?'#0D4A20':'#6A3200';
    const pagoBg=ev.pago==='si'?'#C8EED8':'#FFE8C0';
    const montoStr=ev.monto>0?` · ${CURRENCY_SYMBOLS[ev.moneda||'EUR']||''}${ev.monto}`:'';
    d+=`<div class="edetail full" style="background:${pagoBg};border-color:${ev.pago==='si'?'#6BBD90':'#D4900A'}"><label>Estado de pago</label><p style="color:${pagoColor}">${pagoLabel}${montoStr}</p></div>`;
  }
  if(tipo==='vuelo'){
    if(x.origen||x.destino) d+=`<div class="edetail full"><label>Ruta</label><p>${escapeHtml(x.origen||'—')} → ${escapeHtml(x.destino||'—')}</p></div>`;
    if(x.salida||x.llegada) d+=`<div class="edetail"><label>Salida → Llegada</label><p>${escapeHtml(x.salida||'—')} → ${escapeHtml(x.llegada||'—')}${x.duracion?' ('+escapeHtml(x.duracion)+')':''}</p></div>`;
    if(x.escala) d+=`<div class="edetail"><label>Escala</label><p>${escapeHtml(x.escala)}</p></div>`;
    if(x.pnr) d+=`<div class="edetail"><label>Código PNR</label><p style="font-size:15px;letter-spacing:.05em">${escapeHtml(x.pnr)}</p></div>`;
    if(x.clase) d+=`<div class="edetail"><label>Clase</label><p>${escapeHtml(x.clase)}</p></div>`;
    if(x.terminal) d+=`<div class="edetail"><label>Terminal</label><p>${escapeHtml(x.terminal)}</p></div>`;
    if(x.equipaje) d+=`<div class="edetail full"><label>Equipaje</label><p>${escapeHtml(x.equipaje)}</p></div>`;
    if(x.asientos) d+=`<div class="edetail full"><label>Asientos</label><p>${escapeHtml(x.asientos)}</p></div>`;
    if(x.notas) d+=`<div class="edetail full"><label>Notas</label><p>${escapeHtml(x.notas)}</p></div>`;
    if(ev.docLink) d+=`<div class="edetail full"><label>Documento</label><p><a href="${escapeHtml(ev.docLink)}" target="_blank" rel="noopener noreferrer" style="color:#007AFF;text-decoration:none">📎 Abrir boarding pass / documento</a></p></div>`;
  }else if(tipo==='hotel'){
    if(x.dir) d+=`<div class="edetail full"><label>Dirección</label><p>${escapeHtml(x.dir)}${x.maps&&x.maps.startsWith('http')?` <a href="${x.maps}" target="_blank">📍 Maps</a>`:''}</p></div>`;
    if(x.cinFecha||x.cinHora) d+=`<div class="edetail"><label>Check-in</label><p>${x.cinFecha?fmtDateDisplay(x.cinFecha):''} ${escapeHtml(x.cinHora||'')}</p></div>`;
    if(x.coutFecha||x.coutHora) d+=`<div class="edetail"><label>Check-out</label><p>${x.coutFecha?fmtDateDisplay(x.coutFecha):''} ${escapeHtml(x.coutHora||'')}</p></div>`;
    if(x.conf) d+=`<div class="edetail"><label>N° confirmación</label><p>${escapeHtml(x.conf)}</p></div>`;
    if(x.tel) d+=`<div class="edetail"><label>Teléfono</label><p>${escapeHtml(x.tel)}</p></div>`;
    if(x.notas) d+=`<div class="edetail full"><label>Notas</label><p>${escapeHtml(x.notas)}</p></div>`;
  }else if(tipo==='actividad'){
    if(x.lugar) d+=`<div class="edetail full"><label>Lugar</label><p>${escapeHtml(x.lugar)}${x.maps&&x.maps.startsWith('http')?` <a href="${x.maps}" target="_blank">📍</a>`:''}</p></div>`;
    if(x.horafin) d+=`<div class="edetail"><label>Hasta</label><p>${escapeHtml(x.horafin)}</p></div>`;
    if(x.precio) d+=`<div class="edetail"><label>Precio</label><p>${escapeHtml(x.precio)}</p></div>`;
    if(x.conf) d+=`<div class="edetail"><label>Confirmación</label><p>${escapeHtml(x.conf)}</p></div>`;
    if(x.proveedor) d+=`<div class="edetail"><label>Proveedor</label><p>${escapeHtml(x.proveedor)}</p></div>`;
    if(x.link) d+=`<div class="edetail full"><label>Link</label><p><a href="${x.link}" target="_blank">${escapeHtml(x.link)}</a></p></div>`;
    if(x.notas) d+=`<div class="edetail full"><label>Notas / tips</label><p>${escapeHtml(x.notas)}</p></div>`;
  }else if(tipo==='restaurante'){
    if(x.dir||x.nombre) d+=`<div class="edetail full"><label>Dirección</label><p>${escapeHtml(x.dir||x.nombre)}${x.maps&&x.maps.startsWith('http')?` <a href="${x.maps}" target="_blank">📍</a>`:''}</p></div>`;
    if(x.cocina) d+=`<div class="edetail"><label>Cocina</label><p>${escapeHtml(x.cocina)}</p></div>`;
    if(x.precio) d+=`<div class="edetail"><label>Precio est.</label><p>${escapeHtml(x.precio)}</p></div>`;
    if(x.conf) d+=`<div class="edetail"><label>N° reserva</label><p>${escapeHtml(x.conf)}</p></div>`;
    if(x.reserva) d+=`<div class="edetail"><label>Estado</label><p>${escapeHtml(x.reserva)}</p></div>`;
    if(x.link) d+=`<div class="edetail full"><label>Link</label><p><a href="${x.link}" target="_blank">${escapeHtml(x.link)}</a></p></div>`;
    if(x.notas) d+=`<div class="edetail full"><label>Notas</label><p>${escapeHtml(x.notas)}</p></div>`;
  }else if(tipo==='traslado'){
    if(x.origen||x.destino) d+=`<div class="edetail full"><label>Trayecto</label><p>${escapeHtml(x.origen||'—')} → ${escapeHtml(x.destino||'—')}</p></div>`;
    if(x.precio) d+=`<div class="edetail"><label>Precio est.</label><p>${escapeHtml(x.precio)}</p></div>`;
    if(x.conf) d+=`<div class="edetail"><label>N° / línea</label><p>${escapeHtml(x.conf)}</p></div>`;
    if(x.notas) d+=`<div class="edetail full"><label>Notas</label><p>${escapeHtml(x.notas)}</p></div>`;
  }else{
    const det=ev.det||x.notas||'';
    if(det) d+=`<div class="edetail full"><label>Detalle</label><p>${escapeHtml(det)}</p></div>`;
    if(x.lugar) d+=`<div class="edetail full"><label>Lugar</label><p>${escapeHtml(x.lugar)}</p></div>`;
  }
  return d;
}

window.toggleEcard = id => {
  const body = document.getElementById('ecb-'+id);
  const chev = document.getElementById('ecc-'+id);
  if(!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if(chev) chev.style.transform = open ? '' : 'rotate(180deg)';
};

// Route connector between consecutive events with addresses
function routeConnector(ev1, ev2){
  if(!ev1||!ev2) return '';
  const getAddr=ev=>{const x=ev.extras||{};return x.destino||x.dir||x.lugar||x.nombre||'';};
  const getAddrStart=ev=>{const x=ev.extras||{};return x.origen||x.dir||x.lugar||x.nombre||'';};
  const from=getAddr(ev1);const to=getAddrStart(ev2);
  if(!from||!to) return '';
  if(from===to) return '';
  if(from.length>4&&to.length>4&&(from.includes(to.slice(0,6))||to.includes(from.slice(0,6)))) return '';
  const url=`https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
  return `<div class="route-connector"><div class="route-line"></div><a href="${url}" target="_blank" class="route-btn">🗺 Cómo ir de ${from.split(',')[0]} a ${to.split(',')[0]}</a></div>`;
}

window.renderDays=async()=>{
  const wrap=document.getElementById('days-wrap');
  if(!DAYS.length){wrap.innerHTML='<div style="text-align:center;padding:3rem 1rem;color:var(--muted);font-size:13px">El itinerario está vacío</div>';const ob=document.getElementById('onboarding-banner');if(ob&&!TRIP_ID)ob.style.display='block';return;}
  const ob=document.getElementById('onboarding-banner');if(ob)ob.style.display='none';
  renderDateNav();
  renderCurrentDay();
};

// Render only the currently selected day (single-day view)
window.renderCurrentDay=()=>{
  const allDays=getDisplayDays();
  if(!allDays.length)return;
  // Clamp index
  if(CURRENT_DAY_IDX>=allDays.length)CURRENT_DAY_IDX=0;
  const d=allDays[CURRENT_DAY_IDX];
  const wrap=document.getElementById('days-wrap');
  if(!wrap)return;

  const evs=sortEvents(d.events||[]);
  const _dt=getDateObjFromDay(d);
  const ciudad=d.city||d.ciudad||'transito';
  const destCol=DEST_COLOR[ciudad]||'#9C876E';
  const destFlag=DEST_FLAG[ciudad]||'';
  const destLbl=DEST_LABEL[ciudad]||ciudad;

  // Fecha larga
  let fechaLarga='';
  if(_dt){fechaLarga=_dt.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});}

  // Day number (1-indexed, padded)
  const dayNum=String(CURRENT_DAY_IDX+1).padStart(2,'0');

  // Event cards
  const evHtml=evs.length===0
    ?`<div style="padding:10px 0;color:var(--muted);font-size:13px">Sin eventos aún</div>`
    :evs.map((ev,j)=>{
        const ri=ev._origIdx!==undefined?ev._origIdx:j;
        const tipo=ev.tipo||'otro';
        const tc=TIPO_COLOR[tipo]||'#64748B';
        const tlbl=TIPO_LABEL[tipo]||tipo;
        const tit=escapeHtml(ev.titulo||ev.tt||'Sin título');
        const hora=fmtTimeDisplay(ev.hora||ev.t||'');
        const x=ev.extras||{};
        let sub='';
        if(tipo==='vuelo'&&x.origen&&x.destino)sub=`${escapeHtml(x.origen.split('—')[0].trim())} → ${escapeHtml(x.destino.split('—')[0].trim())}${x.pnr?' · PNR: '+escapeHtml(x.pnr):''}`;
        else if(tipo==='hotel')sub=`Check-in${x.cinHora?' '+escapeHtml(x.cinHora):''}${x.noch?' · '+escapeHtml(x.noch):''}`;
        else if(tipo==='traslado'&&x.medio)sub=`${escapeHtml(x.medio)}${x.duracion?' · '+escapeHtml(x.duracion):''}`;
        else if(tipo==='actividad'&&x.lugar)sub=escapeHtml(x.lugar);
        else if(tipo==='restaurante'&&(x.nombre||x.dir))sub=escapeHtml(x.nombre||x.dir);
        const pagoCol=PAGO_COLOR[ev.pago||'na'];
        return `<div class="ev-card" onclick="openEditEv('${d._id}',${ri})">
          <div class="ev-top">
            <div class="ev-type-pill" style="color:${tc};--dot-bg:${tc}">
              <div class="ev-type-dot"></div>
              <span>${tlbl}</span>
            </div>
            ${hora?`<span class="ev-hora">${hora}</span>`:''}
          </div>
          <div class="ev-titulo">${tit}</div>
          ${sub?`<div class="ev-sub">${sub}</div>`:''}
          ${ev.docLink?`<a href="${escapeHtml(ev.docLink)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" style="font-size:11px;color:#007AFF;text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-top:2px">📎 Ver documento</a>`:''}
          ${pagoCol?`<div class="ev-pago-dot" style="background:${pagoCol}"></div>`:`<div class="ev-pago-dot na"></div>`}
        </div>`;
      }).join('');

  const editBtn=EM?`<button class="ibtn" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="event.stopPropagation();openEditDay('${d._id}')">✏</button>`:'';
  const addBtn=EM?`<button class="ev-add-btn" onclick="openNewEv('${d._id}')">+ Agregar evento</button>`:'';

  wrap.innerHTML=`
    <div id="day-card-${d._displayId}" data-day-id="${d._displayId}">
      <div class="day-header">
        <div class="day-dest-label" style="color:${destCol}">
          <div class="day-dest-dot" style="background:${destCol}"></div>
          <span>${destFlag} ${destLbl}</span>
          ${editBtn}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="day-title">${escapeHtml(d.label||'')}</div>
            <div class="day-fecha">${fechaLarga}</div>
          </div>
          <div class="day-num">${dayNum}</div>
        </div>
      </div>
      <div style="padding:0 16px 8px">
        ${evHtml}
        ${addBtn}
      </div>
    </div>`;
};

// Switch to a different day (called from date nav buttons)
window.showDay=(idx)=>{
  CURRENT_DAY_IDX=idx;
  // Update date nav active state
  const allDays=getDisplayDays();
  document.querySelectorAll('.date-btn').forEach((btn,i)=>{
    const isActive=i===idx;
    btn.classList.toggle('active',isActive);
    const ciudad=(allDays[i]||{}).city||(allDays[i]||{}).ciudad||'transito';
    btn.style.background=isActive?(DEST_COLOR[ciudad]||'#9C876E'):'transparent';
  });
  renderCurrentDay();
  // Scroll content to top
  const main=document.querySelector('.main');
  if(main)main.scrollTop=0;
  window.scrollTo(0,0);
};
window.toggleHotel=id=>{
  const body=document.getElementById('hb-'+id);
  const chev=document.getElementById('hc-'+id);
  if(!body)return;
  const open=body.style.display!=='none';
  body.style.display=open?'none':'block';
  if(chev)chev.style.transform=open?'':'rotate(180deg)';
};

window.renderHotels=()=>{
  const wrap=document.getElementById('htl-wrap');
  if(!HOTELS.length){wrap.innerHTML='<div style="text-align:center;padding:3rem 1rem;color:var(--muted);font-size:13px">Sin alojamientos aún</div>';return;}
  wrap.innerHTML=HOTELS.map(h=>{
    const cin=h.cinFecha?fmtDateDisplay(h.cinFecha):(h.cin||'—');
    const cout=h.coutFecha?fmtDateDisplay(h.coutFecha):(h.cout||'—');
    const noch=h.noch||(h.cinFecha&&h.coutFecha?Math.round((new Date(h.coutFecha)-new Date(h.cinFecha))/86400000):'')||'';
    const ciudad=h.city||'';
    const dest=(h.destino||h.city||'').toLowerCase();
    const destKey=Object.keys(DEST_COLOR).find(k=>dest.includes(k))||'transito';
    const destCol=DEST_COLOR[destKey]||'#9C876E';
    const destLbl=DEST_LABEL[destKey]||(h.city||'');
    const si=h.pago==='si',no=h.pago==='no';
    const estado=si?'Confirmado':no?'Pendiente pago':'A confirmar';
    return `<div class="hotel-card" onclick="openEditHotel('${h._id}')">
      <div class="hotel-card-header">
        <div class="hotel-card-meta">
          <div class="hotel-dest-label" style="color:${destCol}">
            <div style="width:5px;height:5px;border-radius:50%;background:${destCol};flex-shrink:0"></div>
            <span>${destLbl}</span>
          </div>
          <div class="hotel-nombre">${escapeHtml(h.name||'')}</div>
          <div class="hotel-ciudad">${escapeHtml(ciudad)}</div>
        </div>
        <div class="hotel-estado">${estado}</div>
      </div>
      <div class="hotel-dates">
        <div class="hotel-date-col">
          <div class="hotel-date-label">Check-in</div>
          <div class="hotel-date-val">${cin}</div>
        </div>
        <div class="hotel-date-divider"></div>
        <div class="hotel-date-col">
          <div class="hotel-date-label">Check-out</div>
          <div class="hotel-date-val">${cout}</div>
        </div>
        <div class="hotel-date-divider"></div>
        <div class="hotel-date-col">
          <div class="hotel-date-label">Noches</div>
          <div class="hotel-date-val">${noch||'—'}</div>
        </div>
      </div>
    </div>`;
  }).join('');
};
window.renderChecklist=()=>{
  const c=document.getElementById('chk-wrap');
  if(!Object.keys(CHECKLIST).length){c.innerHTML='<div class="loading">Cargando...</div>';return;}
  c.innerHTML=Object.entries(CHECKLIST).map(([g,items])=>`
    <div class="cgroup">
      <div class="cg-title"><span>${g}</span>${EM?`<button class="ibtn" onclick="openNewChk('${g}')">+ tarea</button>`:''}</div>
      ${items.map(item=>`
        <div class="citem${CHECKS[item._id||item.id]?' done':''}">
          <input type="checkbox" ${CHECKS[item._id||item.id]?'checked':''} onclick="toggleChk('${item._id||item.id}')">
          <label onclick="toggleChk('${item._id||item.id}')">${escapeHtml(item.text)}</label>
          ${EM?`<button class="ibtn" onclick="openEditChk('${g}','${item._id||item.id}')">✏</button>`:''}
        </div>`).join('')}
    </div>`).join('');
  const all=Object.values(CHECKLIST).flat();const done=all.filter(i=>CHECKS[i._id||i.id]).length;const pct=all.length?Math.round(done/all.length*100):0;
  document.getElementById('pbar').style.width=pct+'%';document.getElementById('ptxt').textContent=`${done} de ${all.length} tareas completadas`;document.getElementById('ppct').textContent=pct+'%';
};

window.renderNotes=()=>{
  const c=document.getElementById('nt-wrap');
  if(!NOTES.length){c.innerHTML='<div style="padding:1rem;color:var(--muted);font-size:15px;font-weight:700">Sin notas aún.</div>';return;}
  c.innerHTML=NOTES.map(n=>`
    <div class="note-card">
      <div class="note-hd">
        ${avHtml(n.person,'',32)}<strong>${escapeHtml(n.personName||FN[n.person]||n.person)}</strong>
        <time>${n.date}</time>
        ${EM?`<button class="xbtn" onclick="delNote('${n._id}')">×</button>`:''}
      </div>
      <p class="note-text">${escapeHtml(n.text)}</p>
    </div>`).join('');
};

window.renderPhotos=()=>{
  const grid=document.getElementById('photos-grid');const empty=document.getElementById('no-photos');
  if(!PHOTOS.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  grid.innerHTML=PHOTOS.map(p=>`
    <div class="photo-thumb" onclick="openViewer('${p.data}','${(p.caption?p.caption+' — ':'')+p.personName+' · '+p.date}')">
      <img src="${p.data}" alt="${p.caption||'Foto'}" loading="lazy">
      <div class="photo-owner">${escapeHtml(p.personName||FN[p.person]||p.person)}</div>
      <button class="photo-del" onclick="event.stopPropagation();delPhoto('${p._id}')">×</button>
    </div>`).join('');
};

window.renderProfiles=()=>{
  const tvlList = window.TVL_OVERRIDE || TVL;
  document.getElementById('profiles-wrap').innerHTML=tvlList.map(t=>{
    const p=getProfile(t);const has=p.comida||p.shopping||p.actividades||p.ritmo||p.nota;
    return `
    <div class="profile-card">
      <div class="profile-hd">
        ${avHtml(t.i,'profile-av',56)}
        <div><div class="profile-name">${t.fn}</div><div class="profile-sub${has?'':' incomplete'}">${has?'✓ Perfil completo':'Sin completar'}</div></div>
      </div>
      <div class="profile-fields">
        <div class="pf"><div class="pf-lbl">🍽 Comida</div><div class="pf-val${!p.comida?' pf-empty':''}">${escapeHtml(p.comida)||'Sin completar'}</div></div>
        <div class="pf"><div class="pf-lbl">🛍 Shopping</div><div class="pf-val${!p.shopping?' pf-empty':''}">${escapeHtml(p.shopping)||'Sin completar'}</div></div>
        <div class="pf"><div class="pf-lbl">🎯 Actividades</div><div class="pf-val${!p.actividades?' pf-empty':''}">${escapeHtml(p.actividades)||'Sin completar'}</div></div>
        <div class="pf"><div class="pf-lbl">😴 Ritmo</div><div class="pf-val${!p.ritmo?' pf-empty':''}">${escapeHtml(p.ritmo)||'Sin completar'}</div></div>
        ${p.nota?`<div class="pf full"><div class="pf-lbl">💬 Nota para el grupo</div><div class="pf-val">${escapeHtml(p.nota)}</div></div>`:''}
      </div>
      <button class="edit-prof-btn" onclick="openEditProfile('${t.i}')">✏ Editar perfil de ${t.fn.split(' ')[0]}</button>
    </div>`;
  }).join('');
};

window.updateStats=()=>{
  const evs=DAYS.flatMap(d=>d.events||[]);
  const v=evs.filter(e=>e.tipo==='vuelo').length;
  const a=evs.filter(e=>e.tipo==='actividad').length;
  // Count real cities from hotel events (ciudad field) + hotel collection
  const citiesFromEvents=evs
    .filter(e=>e.tipo==='hotel'&&e.extras?.ciudad)
    .map(e=>e.extras.ciudad.trim().toLowerCase());
  const citiesFromHotels=HOTELS
    .filter(h=>h.city)
    .map(h=>h.city.split('·')[0].trim().toLowerCase().split('/')[0].trim());
  const allCities=[...new Set([...citiesFromEvents,...citiesFromHotels])].filter(Boolean);
  const ci=allCities.length||[...new Set(DAYS.map(d=>d.city).filter(c=>c!=='transito'))].length;
  ['hs-d','sc-d'].forEach(id=>document.getElementById(id).textContent=DAYS.length);
  ['hs-v','sc-v'].forEach(id=>document.getElementById(id).textContent=v);
  ['hs-c','sc-c'].forEach(id=>document.getElementById(id).textContent=ci);
  document.getElementById('hs-h').textContent=HOTELS.length;
  document.getElementById('sc-a').textContent=a;
};

// ── PRECIO & PARTICIPANTES ────────────────────────────────
const CURRENCY_SYMBOLS = {USD:'$',EUR:'€',TRY:'₺',ARS:'$',GBP:'£'};
let EXCHANGE_RATES = {USD:1,EUR:1.08,TRY:0.031,ARS:0.00105,GBP:1.27}; // fallback: USD per 1 unit

async function loadExchangeRates(){
  try{
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const d = await r.json();
    if(d.rates){
      // Store as: how many USD is 1 unit of currency
      EXCHANGE_RATES = {
        USD: 1,
        EUR: 1/(d.rates.EUR||0.93),   // 1 EUR = ~1.08 USD
        TRY: 1/(d.rates.TRY||32),     // 1 TRY = ~0.03 USD
        ARS: 1/(d.rates.ARS||900),    // 1 ARS = ~0.001 USD
        GBP: 1/(d.rates.GBP||0.79),  // 1 GBP = ~1.27 USD
      };
    }
  }catch(e){ /* use fallback rates */ }
}
loadExchangeRates();

function toUSD(amount, currency){
  if(!amount || isNaN(amount)) return 0;
  const rate = EXCHANGE_RATES[currency||'EUR'] || 1;
  // rate = USD per 1 unit of currency, so multiply
  return parseFloat(amount) * rate;
}

function formatMoney(amount, currency){
  const sym = CURRENCY_SYMBOLS[currency]||'';
  return `${sym}${parseFloat(amount).toFixed(2)}`;
}

function getParticipantes(){
  const btns = document.querySelectorAll('#part-grid .part-btn');
  return [...btns].filter(b=>b.classList.contains('sel')).map(b=>b.dataset.p);
}

window.togglePart = (evt, el) => {
  evt.preventDefault();
  el.classList.toggle('sel');
  calcCostoPP();
};

window.calcCostoPP = () => {
  const monto = parseFloat(document.getElementById('ev-monto').value) || 0;
  const moneda = document.getElementById('ev-moneda').value;
  const parts = getParticipantes();
  const el = document.getElementById('costo-pp');
  if(!monto || parts.length === 0){ el.classList.remove('show'); el.textContent=''; return; }
  const pp = monto / parts.length;
  const tvlList = window.TVL_OVERRIDE || TVL;
  const nameMap = Object.fromEntries(tvlList.map(t => [t.i, t.n]));
  el.classList.add('show');
  el.textContent = `${formatMoney(pp, moneda)} por persona (${parts.map(p=>nameMap[p]||p).join(', ')})`;
};

// Reset participantes to all selected
function resetParticipantes(){
  document.querySelectorAll('#part-grid .part-btn').forEach(b=>b.classList.add('sel'));
}

// Set participantes from saved data
function setParticipantes(arr){
  document.querySelectorAll('#part-grid .part-btn').forEach(b=>{
    b.classList.toggle('sel', !arr || arr.length===0 || arr.includes(b.dataset.p));
  });
}

// ── GASTOS RENDER ─────────────────────────────────────────
const TIPO_LABELS = {vuelo:'✈ Vuelos',hotel:'🏨 Hoteles',actividad:'🎯 Actividades',restaurante:'🍽 Comida',traslado:'🚕 Traslados',otro:'📌 Otros'};
const CITY_LABELS = {amsterdam:'🇳🇱 Países Bajos',grecia:'🇬🇷 Grecia',turquia:'🇹🇷 Turquía',transito:'Tránsito'};
window.calcGastos = async () => {
  await loadExchangeRates();
  const tvl = window.TVL_OVERRIDE || TVL;
  const tvlKeys = tvl.map(t => t.i);
  const allEvents = DAYS.flatMap(d => (d.events||[]).map(e=>({...e, _city:d.city, _dayLabel:d.label})));
  const eventsWithPrice = allEvents.filter(e=>e.monto>0);

  // Totals by category (in USD)
  const byCat = {};
  const byCity = {};
  const byPerson = Object.fromEntries(tvlKeys.map(k=>[k,0]));
  const byPersonItems = Object.fromEntries(tvlKeys.map(k=>[k,[]]));
  let grandTotal = 0;

  eventsWithPrice.forEach(ev => {
    const usd = toUSD(ev.monto, ev.moneda||'EUR');
    const parts = ev.participantes?.length > 0 ? ev.participantes : tvlKeys;
    const ppUSD = usd / parts.length;

    // By category
    const cat = ev.tipo||'otro';
    byCat[cat] = (byCat[cat]||0) + usd;

    // By city
    const city = ev._city||'transito';
    byCity[city] = (byCity[city]||0) + usd;

    // By person
    parts.forEach(p => {
      byPerson[p] = (byPerson[p]||0) + ppUSD;
      byPersonItems[p].push({
        titulo: ev.titulo||'',
        monto: ev.monto,
        moneda: ev.moneda||'EUR',
        pp: ppUSD,
        city: ev._city
      });
    });

    grandTotal += usd;
  });

  const fmt = usd => `$${usd.toFixed(0)}`;

  let html = '';

  // Grand total card
  html += `<div class="gasto-total-bar">
    <h3>💰 Resumen total del viaje</h3>
    <div class="gasto-grid">
      <div class="gasto-card"><label>Total del grupo</label><p>${fmt(grandTotal)} <small>USD</small></p></div>
      <div class="gasto-card"><label>Promedio por persona</label><p>${fmt(grandTotal/tvl.length)} <small>USD</small></p></div>
      <div class="gasto-card"><label>Eventos con precio</label><p>${eventsWithPrice.length} <small>de ${allEvents.length}</small></p></div>
      <div class="gasto-card"><label>Tipo de cambio</label><p style="font-size:0.9rem">€1 = $${(EXCHANGE_RATES.EUR).toFixed(2)}</p></div>
    </div>
  </div>`;

  // By category
  html += `<div class="gasto-section-lbl">Por categoría</div>`;
  html += `<div class="gasto-by-cat"><h4>Por categoría</h4>`;
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).forEach(([cat,usd])=>{
    const pct = grandTotal > 0 ? Math.round(usd/grandTotal*100) : 0;
    html += `<div class="gasto-row">
      <span>${TIPO_LABELS[cat]||cat}</span>
      <span>${fmt(usd)} <span class="badge-moneda">${pct}%</span></span>
    </div>`;
  });
  html += '</div>';

  // By destination
  html += `<div class="gasto-section-lbl">Por destino</div>`;
  html += `<div class="gasto-by-cat"><h4>Por destino</h4>`;
  Object.entries(byCity).sort((a,b)=>b[1]-a[1]).forEach(([city,usd])=>{
    html += `<div class="gasto-row">
      <span>${CITY_LABELS[city]||city}</span>
      <span>${fmt(usd)}</span>
    </div>`;
  });
  html += '</div>';

  // By person
  html += `<div class="gasto-section-lbl">Por viajero</div>`;
  html += `<div class="gasto-by-cat"><h4>Por viajero</h4>`;
  tvl.forEach(t => {
    const p = t.i;
    const total = byPerson[p] || 0;
    const items = byPersonItems[p] || [];
    html += `<div class="gasto-person-card">
      <div class="gasto-person-hd">
        ${avHtml(p,'',32)}
        <strong>${escapeHtml(t.fn)}</strong>
        <span>${fmt(total)}</span>
      </div>
      <div class="gasto-person-items">
        ${items.slice(0,5).map(i=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border-s)"><span>${i.titulo}</span><span style="font-weight:700">$${i.pp.toFixed(0)}</span></div>`).join('')}
        ${items.length > 5 ? `<div style="color:var(--muted);font-size:12px;margin-top:4px">+ ${items.length-5} eventos más</div>` : ''}
      </div>
    </div>`;
  });
  html += '</div>';

  // Warning if events without price — show list
  const sinPrecio = allEvents.filter(e => !(e.monto > 0));
  if (sinPrecio.length > 0) {
    const listaItems = sinPrecio.slice(0, 15).map(ev => {
      const dia = DAYS.find(d => (d.events||[]).some(e => e === ev));
      const diaLabel = dia ? (dia.label || dia.fecha || '') : '';
      return `<li style="padding:3px 0;border-bottom:.5px solid rgba(0,0,0,.06)">
        <strong>${escapeHtml(ev.titulo || 'Sin título')}</strong>
        <span style="color:rgba(60,60,67,.5);font-size:11px;margin-left:6px">
          ${escapeHtml(diaLabel)} · ${ev.tipo || ''}
        </span>
      </li>`;
    }).join('');

    const masItems = sinPrecio.length > 15
      ? `<li style="color:rgba(60,60,67,.4);font-size:12px;padding-top:4px">
          ... y ${sinPrecio.length - 15} eventos más sin monto
         </li>`
      : '';

    html += `
      <div style="background:#FFF8E7;border:1.5px solid #E8A020;border-radius:12px;
                  padding:14px 16px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:#7A4A00;margin-bottom:8px">
          ⚠ ${sinPrecio.length} evento${sinPrecio.length > 1 ? 's' : ''}
          sin monto — el total está incompleto
        </div>
        <div style="font-size:12px;color:#7A4A00;margin-bottom:8px">
          Abrí cada evento y completá el campo <strong>Monto</strong>
          con el número para que aparezca en el resumen:
        </div>
        <ul style="margin:0;padding:0;list-style:none;font-size:13px">
          ${listaItems}${masItems}
        </ul>
      </div>`;
  }

  document.getElementById('gastos-wrap').innerHTML = html;
};

// ── SUBTIPO ACTIVIDAD ─────────────────────────────────────
let EVSUBTIPO = 'actividad';
const SUBTIPO_ICO = {
  actividad:'🎯',playa:'🏖',pueblo:'🏘',mirador:'🗺',
  monumento:'🏛',naturaleza:'🌿',museo:'🏺',restaurante_bar:'🍷'
};
const SUBTIPO_LABEL = {
  actividad:'Actividad',playa:'Playa',pueblo:'Pueblo',mirador:'Mirador',
  monumento:'Monumento',naturaleza:'Naturaleza',museo:'Museo',restaurante_bar:'Bar / café'
};

window.selSubtipo = (s, el) => {
  EVSUBTIPO = s;
  document.querySelectorAll('.subtipo-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
};

function resetSubtipo(){
  EVSUBTIPO = 'actividad';
  document.querySelectorAll('.subtipo-btn').forEach(b => {
    b.classList.toggle('sel', b.dataset.s === 'actividad');
  });
}

function setSubtipo(s){
  EVSUBTIPO = s || 'actividad';
  document.querySelectorAll('.subtipo-btn').forEach(b => {
    b.classList.toggle('sel', b.dataset.s === EVSUBTIPO);
  });
}


// ── RESUMEN / TRAVEL BOOK ─────────────────────────────────
let mapInstance = null;

window.initResumen = () => {
  renderResumen();
  setTimeout(initMap, 100);
};

function getAllEvents(){
  return DAYS.flatMap(d => (d.events||[]).map(e=>({...e,_city:d.city,_dayLabel:d.label,_dayFecha:d.fecha})));
}

function renderResumen(){
  const evs = getAllEvents();
  const actividades = evs.filter(e=>e.tipo==='actividad');

  // Count by subtipo
  const counts = {};
  actividades.forEach(e => {
    const s = e.extras?.subtipo || 'actividad';
    counts[s] = (counts[s]||0) + 1;
  });

  // Unique cities from hotels
  const citySet = new Set();
  HOTELS.forEach(h => { if(h.city) citySet.add(h.city.split('·')[0].trim()); });
  evs.filter(e=>e.tipo==='hotel'&&e.extras?.ciudad).forEach(e=>citySet.add(e.extras.ciudad.trim()));

  // Unique countries
  const paisSet = new Set(
    DAYS.map(d => d.city==='amsterdam'?'nl':d.city==='grecia'?'gr':d.city==='turquia'?'tr':null)
        .filter(Boolean)
  );

  // Unique lugares from actividades (extras.lugar field)
  const lugarSet = new Set(
    DAYS.flatMap(d=>(d.events||[])
      .filter(e=>e.tipo==='actividad'&&e.extras?.lugar)
      .map(e=>e.extras.lugar)
    )
  );


  const counters = [
    {ico:'🌍',num:paisSet.size||3,lbl:'Países'},
    {ico:'🏙',num:citySet.size,lbl:'Ciudades'},
    {ico:'🏨',num:HOTELS.length,lbl:'Hoteles'},
    {ico:'🏖',num:counts.playa||0,lbl:'Playas'},
    {ico:'🏘',num:counts.pueblo||0,lbl:'Pueblos'},
    {ico:'🗺',num:counts.mirador||0,lbl:'Miradores'},
    {ico:'🏛',num:(counts.monumento||0)+(counts.museo||0),lbl:'Monumentos'},
    {ico:'✈',num:evs.filter(e=>e.tipo==='vuelo').length,lbl:'Vuelos'},
    {ico:'🍽',num:evs.filter(e=>e.tipo==='restaurante').length+(counts.restaurante_bar||0),lbl:'Restaurantes'},
    {ico:'🚕',num:evs.filter(e=>e.tipo==='traslado').length,lbl:'Traslados'},
    {ico:'📍',num:actividades.length,lbl:'Lugares visitados'},
    {ico:'📅',num:DAYS.length,lbl:'Días de viaje'},
  ];

  document.getElementById('rs-counters').innerHTML = counters.map(c=>`
    <div class="counter-card">
      <div class="ico">${c.ico}</div>
      <span class="num">${c.num}</span>
      <span class="lbl">${c.lbl}</span>
    </div>`).join('');

  // List lugares by subtipo
  const subtipos = ['playa','pueblo','mirador','monumento','museo','naturaleza','restaurante_bar','actividad'];
  let lugaresHtml = '';
  subtipos.forEach(s => {
    const items = actividades.filter(e=>(e.extras?.subtipo||'actividad')===s);
    if(!items.length) return;
    lugaresHtml += `<div style="margin-bottom:1.25rem">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--stat);font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--border)">${SUBTIPO_ICO[s]} ${SUBTIPO_LABEL[s]}s visitad${s==='playa'||s==='naturaleza'?'a':'o'}s (${items.length})</div>
      ${items.map(e=>`
        <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border-s)">
          <span style="font-size:13px;flex:1;font-weight:700;color:var(--ink)">${e.titulo||'Sin nombre'}</span>
          ${e.fecha?`<span style="font-size:11px;color:var(--muted);font-weight:700">${fmtDateDisplay(e.fecha)}</span>`:''}
          ${e.extras?.maps&&e.extras.maps.startsWith('http')?`<a href="${e.extras.maps}" target="_blank" style="font-size:11px;font-weight:700;color:var(--accent);text-decoration:none">📍</a>`:''}
        </div>`).join('')}
    </div>`;
  });
  document.getElementById('rs-lugares').innerHTML = lugaresHtml;
}

function initMap(){
  const mapEl = document.getElementById('rs-map');
  if(!mapEl) return;
  // Load Leaflet
  if(!window.L){
    const link = document.createElement('link');
    link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => buildMap(mapEl);
    document.head.appendChild(script);
  } else {
    buildMap(mapEl);
  }
}

const CITY_LATLNG = {
  amsterdam:[52.37,4.89],atenas:[37.97,23.73],mykonos:[37.44,25.35],
  naxos:[37.10,25.38],koufonisia:[36.93,25.60],paros:[37.08,25.15],
  milos:[36.72,24.43],santorini:[36.39,25.46],estambul:[41.01,28.97],
  capadocia:[38.64,34.83],antiparos:[36.98,25.08]
};

function buildMap(el){
  // If map already mounted, just refresh markers instead of destroying/recreating
  if(mapInstance && mapInstance._container){
    mapInstance.eachLayer(l => { if(l instanceof L.Marker || l instanceof L.CircleMarker || l instanceof L.Polyline) l.remove(); });
  } else {
    if(mapInstance){ try{ mapInstance.remove(); }catch(e){} mapInstance=null; }
    mapInstance = L.map(el).setView([39,22],5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap',maxZoom:18
    }).addTo(mapInstance);
  }

  const evs = getAllEvents();
  const points = [];

  // Add markers from hotel cities
  HOTELS.forEach(h => {
    const cityName = h.city.split('·')[0].trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/\s+/g,'');
    const ll = CITY_LATLNG[cityName];
    if(ll){
      L.circleMarker(ll,{radius:8,color:'#fff',weight:2,fillColor:'var(--accent,#2874A6)',fillOpacity:1})
        .addTo(mapInstance)
        .bindPopup(`<strong>${h.name}</strong><br>${h.city}`);
      points.push(ll);
    }
  });

  // Add markers for activities with maps links (extract coords)
  evs.filter(e=>e.tipo==='actividad'&&e.extras?.maps).forEach(e=>{
    const url = e.extras.maps;
    const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if(m){
      const ll = [parseFloat(m[1]),parseFloat(m[2])];
      const ico = SUBTIPO_ICO[e.extras?.subtipo||'actividad']||'📍';
      L.marker(ll, {icon: L.divIcon({className:'',html:`<div style="font-size:20px;line-height:1">${ico}</div>`,iconSize:[24,24],iconAnchor:[12,12]})})
        .addTo(mapInstance)
        .bindPopup(`<strong>${e.titulo}</strong>`);
      points.push(ll);
    }
  });

  // Draw route line between hotel cities
  const routePoints = Object.values(CITY_LATLNG).filter(ll=>points.some(p=>Math.abs(p[0]-ll[0])<0.5&&Math.abs(p[1]-ll[1])<0.5));
  if(points.length > 1){
    L.polyline(points.slice(0,20),{color:'#2874A6',weight:2,opacity:0.5,dashArray:'6,6'}).addTo(mapInstance);
    mapInstance.fitBounds(points.map(p=>L.latLng(p[0],p[1])));
  }
}

// ── EXPORT TRAVEL BOOK ────────────────────────────────────
window.exportTravelBook = () => {
  const evs = getAllEvents();
  const actividades = evs.filter(e=>e.tipo==='actividad');
  const counts = {};
  actividades.forEach(e=>{ const s=e.extras?.subtipo||'actividad'; counts[s]=(counts[s]||0)+1; });
  const photos = PHOTOS.slice(0,20); // first 20 photos

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Travel Book — Países Bajos · Grecia · Turquía 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Lato',sans-serif;background:#F5EFE0;color:#0A1628;font-size:16px}
.cover{background:linear-gradient(160deg,#0A3D62,#0D2B4E);color:#fff;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem 2rem;position:relative}
.cover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#C0522A,#1B6CA8,#2ECC71)}
.cover h1{font-family:'Playfair Display',serif;font-size:clamp(2rem,6vw,4rem);font-weight:700;margin-bottom:.5rem}
.cover h1 em{font-style:italic;font-weight:400;color:rgba(255,255,255,.7)}
.cover p{font-size:16px;color:rgba(255,255,255,.6);margin-bottom:.3rem}
.section{max-width:860px;margin:0 auto;padding:2rem}
.section h2{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;margin-bottom:1.5rem;color:#0A3D62;border-bottom:3px solid #1B6CA8;padding-bottom:.5rem}
.counters{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:2rem}
.counter{background:#fff;border-radius:12px;padding:1rem;text-align:center;border:1.5px solid #B8CCE0}
.counter .ico{font-size:2rem;margin-bottom:6px}
.counter .num{font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:#0A3D62;display:block}
.counter .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#4A5F72;font-weight:700}
.photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:2rem}
.photo-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}
.lugar-group{margin-bottom:1.5rem}
.lugar-group h3{font-size:14px;text-transform:uppercase;letter-spacing:.1em;color:#1B6CA8;font-weight:700;margin-bottom:8px}
.lugar-item{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #DDE8F2;font-size:14px}
.footer{background:#0D2B4E;color:rgba(255,255,255,.6);text-align:center;padding:2rem;font-size:13px}
@media print{.cover{min-height:40vh}}
</style></head><body>
<div class="cover">
  <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:1rem">Travel Book · Verano 2026</p>
  <h1>Países Bajos · Grecia<br><em>& Turquía</em></h1>
  <p>Eugenia · Juan José · Valeria · Gustavo</p>
  <p>${DAYS.length} días · ${new Date().toLocaleDateString('es-AR')}</p>
</div>

<div class="section">
  <h2>El viaje en números</h2>
  <div class="counters">
    <div class="counter"><div class="ico">🌍</div><span class="num">3</span><span class="lbl">Países</span></div>
    <div class="counter"><div class="ico">🏙</div><span class="num">${document.getElementById('rs-counters')?.querySelectorAll('.num')[1]?.textContent||'—'}</span><span class="lbl">Ciudades</span></div>
    <div class="counter"><div class="ico">📅</div><span class="num">${DAYS.length}</span><span class="lbl">Días</span></div>
    <div class="counter"><div class="ico">✈</div><span class="num">${evs.filter(e=>e.tipo==='vuelo').length}</span><span class="lbl">Vuelos</span></div>
    <div class="counter"><div class="ico">🏨</div><span class="num">${HOTELS.length}</span><span class="lbl">Hoteles</span></div>
    <div class="counter"><div class="ico">🏖</div><span class="num">${counts.playa||0}</span><span class="lbl">Playas</span></div>
    <div class="counter"><div class="ico">🏘</div><span class="num">${counts.pueblo||0}</span><span class="lbl">Pueblos</span></div>
    <div class="counter"><div class="ico">🍽</div><span class="num">${evs.filter(e=>e.tipo==='restaurante').length}</span><span class="lbl">Restaurantes</span></div>
    <div class="counter"><div class="ico">📍</div><span class="num">${actividades.length}</span><span class="lbl">Lugares</span></div>
  </div>
</div>

${photos.length>0?`<div class="section"><h2>Fotos del viaje</h2><div class="photo-grid">${photos.map(p=>`<img src="${p.data}" alt="${p.caption||''}">`).join('')}</div></div>`:''}

<div class="section">
  <h2>Lugares visitados</h2>
  ${['playa','pueblo','mirador','monumento','museo','naturaleza','actividad'].map(s=>{
    const items = actividades.filter(e=>(e.extras?.subtipo||'actividad')===s);
    if(!items.length) return '';
    return `<div class="lugar-group"><h3>${SUBTIPO_ICO[s]} ${SUBTIPO_LABEL[s]}s (${items.length})</h3>
      ${items.map(e=>`<div class="lugar-item"><span>${e.titulo||'Sin nombre'}</span><span style="color:#4A5F72">${e.fecha?fmtDateDisplay(e.fecha):''}</span></div>`).join('')}
    </div>`;
  }).join('')}
</div>

<div class="section">
  <h2>Itinerario completo</h2>
  ${DAYS.map(d=>`<div style="margin-bottom:1rem;padding:1rem;background:#fff;border-radius:10px;border:1px solid #B8CCE0">
    <div style="font-weight:700;color:#0A3D62;margin-bottom:.5rem">${d.fecha?fmtDateDisplay(d.fecha):d.date} — ${d.label}</div>
    ${(d.events||[]).map(e=>`<div style="font-size:13px;padding:3px 0;color:#2C3E50">${TIPO_ICO[e.tipo]||'📌'} ${e.hora?e.hora+' · ':''}<strong>${e.titulo||''}</strong></div>`).join('')}
  </div>`).join('')}
</div>

<div class="footer">
  <p>Travel Book generado el ${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}</p>
  <p style="margin-top:4px">Países Bajos · Grecia · Turquía · Verano 2026</p>
</div>
</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='travel-book-2026.html';
  a.click(); URL.revokeObjectURL(url);
};

window.exportPDF = () => {
  // Generate HTML and open print dialog
  window.exportTravelBook();
  setTimeout(()=>{
    alert('El archivo HTML se descargó. Abrilo en el navegador y usá Archivo → Imprimir → Guardar como PDF para obtener el PDF.');
  }, 500);
};


// ── INSTAGRAM STORY GENERATOR ─────────────────────────────
let STORY_TYPE = 'dia';
let STORY_STYLE = 'mediterraneo';
let STORY_PHOTO = null;

window.selStoryType = (t, el) => {
  STORY_TYPE = t;
  document.querySelectorAll('[data-story]').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  document.getElementById('story-config-dia').style.display = t==='dia' ? 'block' : 'none';
  document.getElementById('story-config-llegada').style.display = t==='llegada' ? 'block' : 'none';
};

window.selStoryStyle = (s, el) => {
  STORY_STYLE = s;
  document.querySelectorAll('[data-style]').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  const fotoSel = document.getElementById('story-foto-sel');
  if(s === 'foto'){
    fotoSel.style.display = 'block';
    renderStoryPhotos();
  } else {
    fotoSel.style.display = 'none';
  }
};

function renderStoryPhotos(){
  const grid = document.getElementById('story-photos-grid');
  const noPhotos = document.getElementById('story-no-photos');
  if(!PHOTOS.length){ grid.innerHTML=''; noPhotos.style.display='block'; return; }
  noPhotos.style.display='none';
  grid.innerHTML = PHOTOS.slice(0,12).map((p,i) => `
    <div onclick="selectStoryPhoto(${i},this)" style="aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;border:3px solid transparent;transition:border-color .15s" id="sph-${i}">
      <img src="${p.data}" style="width:100%;height:100%;object-fit:cover">
    </div>`).join('');
  // Auto-select first
  if(PHOTOS.length){ selectStoryPhoto(0, document.getElementById('sph-0')); }
}

window.selectStoryPhoto = (i, el) => {
  STORY_PHOTO = PHOTOS[i]?.data || null;
  document.querySelectorAll('#story-photos-grid > div').forEach(d => d.style.borderColor='transparent');
  if(el) el.style.borderColor = 'var(--accent)';
};

// Populate day selector
function populateDaySel(){
  const sel = document.getElementById('story-day-sel');
  sel.innerHTML = '<option value="">— Elegir día —</option>';
  DAYS.forEach((d,i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${d.fecha ? fmtDateDisplay(d.fecha) : d.date} — ${d.label}`;
    sel.appendChild(o);
  });
}

// Patch initResumen to also populate story selectors
const _origInitResumen = window.initResumen;
window.initResumen = () => {
  _origInitResumen();
  populateDaySel();
  renderStoryPhotos();
};

// ── CANVAS DRAWING ────────────────────────────────────────
const W = 1080, H = 1920;

function wrapText(ctx, text, x, y, maxW, lineH){
  const words = text.split(' ');
  let line = '';
  let lines = [];
  words.forEach(word => {
    const test = line + word + ' ';
    if(ctx.measureText(test).width > maxW && line !== ''){
      lines.push(line.trim());
      line = word + ' ';
    } else { line = test; }
  });
  if(line.trim()) lines.push(line.trim());
  lines.forEach((l,i) => ctx.fillText(l, x, y + i*lineH));
  return lines.length;
}

function drawGradientBg(ctx, style, photoData){
  ctx.clearRect(0,0,W,H);
  if(style === 'foto' && photoData){
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        // Cover fill
        const scale = Math.max(W/img.width, H/img.height);
        const sw = img.width*scale, sh = img.height*scale;
        const sx = (W-sw)/2, sy = (H-sh)/2;
        ctx.drawImage(img, sx, sy, sw, sh);
        // Dark overlay
        const grad = ctx.createLinearGradient(0,0,0,H);
        grad.addColorStop(0,'rgba(0,0,0,0.55)');
        grad.addColorStop(0.5,'rgba(0,0,0,0.2)');
        grad.addColorStop(1,'rgba(0,0,0,0.75)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,W,H);
        res();
      };
      img.src = photoData;
    });
  }
  if(style === 'minimal'){
    ctx.fillStyle = '#0A1628';
    ctx.fillRect(0,0,W,H);
    // Subtle dots
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let i=0;i<80;i++){
      const x=Math.random()*W, y=Math.random()*H, r=Math.random()*3+1;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
  } else {
    // Mediterráneo gradient
    const grad = ctx.createLinearGradient(0,0,W,H);
    grad.addColorStop(0,'#0A3D62');
    grad.addColorStop(0.4,'#0D2B4E');
    grad.addColorStop(0.7,'#1A3F6B');
    grad.addColorStop(1,'#0A3D62');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);
    // Waves decoration
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for(let i=0;i<5;i++){
      ctx.beginPath();
      ctx.arc(W/2, H*0.85+i*80, 600+i*150, Math.PI, 0);
      ctx.stroke();
    }
  }
  return Promise.resolve();
}

function drawAccentBar(ctx, style){
  // Bottom gradient bar
  const colors = style==='minimal'
    ? ['#C0522A','#00838F','#F5C842']
    : ['#C0522A','#1B6CA8','#2ECC71'];
  const bw = W/3;
  colors.forEach((c,i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i*bw, H-12, bw, 12);
  });
}

function drawLogo(ctx, style){
  const tc = style==='minimal'?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.4)';
  ctx.font = 'bold 36px Lato, sans-serif';
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  ctx.fillText('El Gran Viaje Mediterráneo', W/2, H-60);
}

async function drawStoryDia(ctx, dayIdx, style, photoData){
  await drawGradientBg(ctx, style, photoData);
  const d = DAYS[dayIdx];
  if(!d) return;
  const evs = sortEvents(d.events||[]);
  const tc = '#ffffff';
  const muted = 'rgba(255,255,255,0.65)';

  // Date pill
  ctx.font = 'bold 42px Lato, sans-serif';
  ctx.fillStyle = style==='minimal'?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.12)';
  const dateText = d.fecha ? fmtDateDisplay(d.fecha).toUpperCase() : (d.date||'').toUpperCase();
  const dw = ctx.measureText(dateText).width + 60;
  ctx.beginPath();
  ctx.roundRect(W/2-dw/2, 160, dw, 80, 40);
  ctx.fill();
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  ctx.fillText(dateText, W/2, 215);

  // Day title
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  wrapText(ctx, d.label, W/2, 340, W-120, 88);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(100, 520); ctx.lineTo(W-100, 520); ctx.stroke();

  // Events list
  let y = 590;
  evs.slice(0,6).forEach(ev => {
    const ico = (ev.tipo==='actividad'&&ev.extras?.subtipo) ? (SUBTIPO_ICO[ev.extras.subtipo]||'🎯') : (TIPO_ICO[ev.tipo]||'📌');
    ctx.font = 'bold 44px Lato, sans-serif';
    ctx.fillStyle = muted;
    ctx.textAlign = 'left';
    if(ev.hora) ctx.fillText(ev.hora, 80, y);
    ctx.font = 'bold 52px Lato, sans-serif';
    ctx.fillStyle = tc;
    ctx.textAlign = 'left';
    // Emoji icon
    ctx.font = '52px serif';
    ctx.fillText(ico, ev.hora?220:80, y);
    ctx.font = 'bold 50px Lato, sans-serif';
    ctx.fillStyle = tc;
    const titleX = ev.hora ? 300 : 160;
    const maxW = W - titleX - 80;
    const title = ev.titulo || '';
    const shortTitle = title.length > 28 ? title.slice(0,25)+'...' : title;
    ctx.fillText(shortTitle, titleX, y);
    y += 130;
  });

  // Weather if available
  const wKey = `${d.city}_${d.fecha||''}`;
  const w = WEATHER_CACHE[wKey];
  if(w){
    ctx.font = '64px serif';
    ctx.textAlign = 'right';
    ctx.fillText(w.ico, W-100, 230);
    ctx.font = 'bold 42px Lato, sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(`${w.tmax}° / ${w.tmin}°`, W-100, 280);
  }

  drawAccentBar(ctx, style);
  drawLogo(ctx, style);
}

async function drawStoryLlegada(ctx, destino, frase, style, photoData){
  await drawGradientBg(ctx, style, photoData);
  const tc = '#ffffff';
  const muted = 'rgba(255,255,255,0.65)';

  // "Llegamos a"
  ctx.font = 'bold 56px Lato, sans-serif';
  ctx.fillStyle = muted;
  ctx.textAlign = 'center';
  ctx.fillText('Llegamos a', W/2, H*0.38);

  // Destination
  ctx.font = 'bold 110px Georgia, serif';
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  const dest = destino || 'Santorini 🌅';
  wrapText(ctx, dest, W/2, H*0.45, W-80, 130);

  // Frase
  if(frase){
    ctx.font = 'italic 54px Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'center';
    wrapText(ctx, frase, W/2, H*0.68, W-120, 70);
  }

  // Traveler avatars row
  const names = ['ER','JN','VS','GG'];
  const colors = ['#1B5E8E','#A03020','#155A30','#5E2E8E'];
  const r = 70, spacing = 200, startX = W/2 - (names.length-1)*spacing/2;
  names.forEach((n,i) => {
    const x = startX + i*spacing;
    const y = H*0.80;
    // Check for avatar photo
    const av = AVATARS[n];
    if(av){
      const img = new Image();
      img.src = av;
      ctx.save();
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.clip();
      ctx.drawImage(img, x-r, y-r, r*2, r*2);
      ctx.restore();
    } else {
      ctx.fillStyle = colors[i];
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.font = 'bold 40px Lato, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(n, x, y+14);
    }
    // White ring
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x,y,r+4,0,Math.PI*2); ctx.stroke();
  });

  drawAccentBar(ctx, style);
  drawLogo(ctx, style);
}

async function drawStoryStats(ctx, style, photoData){
  await drawGradientBg(ctx, style, photoData);
  const tc = '#ffffff';
  const muted = 'rgba(255,255,255,0.65)';
  const evs = getAllEvents();
  const acts = evs.filter(e=>e.tipo==='actividad');
  const counts = {};
  acts.forEach(e=>{ const s=e.extras?.subtipo||'actividad'; counts[s]=(counts[s]||0)+1; });

  ctx.font = 'bold 52px Lato, sans-serif';
  ctx.fillStyle = muted;
  ctx.textAlign = 'center';
  ctx.fillText('Hasta ahora...', W/2, 240);

  ctx.font = 'bold 88px Georgia, serif';
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  ctx.fillText('Nuestro viaje', W/2, 350);
  ctx.font = 'italic bold 88px Georgia, serif';
  ctx.fillText('en números', W/2, 455);

  const stats = [
    {ico:'📅', num:DAYS.length, lbl:'días de aventura'},
    {ico:'🌍', num:3, lbl:'países recorridos'},
    {ico:'✈', num:evs.filter(e=>e.tipo==='vuelo').length, lbl:'vuelos'},
    {ico:'🏨', num:HOTELS.length, lbl:'hoteles'},
    {ico:'🏖', num:counts.playa||0, lbl:'playas'},
    {ico:'🏘', num:counts.pueblo||0, lbl:'pueblos'},
    {ico:'🍽', num:evs.filter(e=>e.tipo==='restaurante').length, lbl:'restaurantes'},
    {ico:'📍', num:acts.length, lbl:'lugares visitados'},
  ].filter(s=>s.num>0);

  let y = 580;
  const cols = 2, colW = W/cols;
  stats.slice(0,8).forEach((s,i) => {
    const col = i%cols, row = Math.floor(i/cols);
    const x = col*colW + colW/2;
    const ry = y + row*220;

    // Card bg
    ctx.fillStyle = style==='minimal'?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(col*colW+30, ry-80, colW-60, 190, 20);
    ctx.fill();

    ctx.font = '56px serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.ico, x, ry-10);

    ctx.font = 'bold 80px Lato, sans-serif';
    ctx.fillStyle = tc;
    ctx.textAlign = 'center';
    ctx.fillText(s.num, x, ry+70);

    ctx.font = 'bold 34px Lato, sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(s.lbl, x, ry+115);
  });

  drawAccentBar(ctx, style);
  drawLogo(ctx, style);
}

async function drawStoryCierre(ctx, style, photoData){
  await drawGradientBg(ctx, style, photoData);
  const tc = '#ffffff';
  const muted = 'rgba(255,255,255,0.65)';
  const gold = style==='minimal' ? '#F5C842' : '#F0C040';
  const evs = getAllEvents();
  const acts = evs.filter(e=>e.tipo==='actividad');
  const counts = {};
  acts.forEach(e=>{ const s=e.extras?.subtipo||'actividad'; counts[s]=(counts[s]||0)+1; });

  // Stars decoration
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ['✦','✧','✦'].forEach((s,i) => ctx.fillText(s, W/2-80+i*80, 200));

  ctx.font = 'italic bold 64px Georgia, serif';
  ctx.fillStyle = muted;
  ctx.textAlign = 'center';
  ctx.fillText('Fin del viaje', W/2, 300);

  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  ctx.fillText('Amsterdam', W/2, 420);
  ctx.font = 'italic 80px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Grecia & Turquía', W/2, 520);

  // Big number highlight
  ctx.font = 'bold 220px Lato, sans-serif';
  ctx.fillStyle = gold;
  ctx.textAlign = 'center';
  ctx.fillText(DAYS.length, W/2, 810);
  ctx.font = 'bold 52px Lato, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('días inolvidables', W/2, 870);

  // Stats row
  const row = [
    {ico:'🌍',n:3,l:'países'},{ico:'🏖',n:counts.playa||0,l:'playas'},
    {ico:'🏘',n:counts.pueblo||0,l:'pueblos'},{ico:'🍽',n:evs.filter(e=>e.tipo==='restaurante').length,l:'restaurantes'},
  ];
  const rw = W/row.length;
  row.forEach((s,i) => {
    const x = i*rw + rw/2;
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.ico, x, 1000);
    ctx.font = 'bold 64px Lato, sans-serif';
    ctx.fillStyle = tc;
    ctx.fillText(s.n, x, 1080);
    ctx.font = 'bold 32px Lato, sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(s.l, x, 1125);
  });

  // Traveler names
  ctx.font = 'bold 48px Lato, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('Eugenia · Juan José · Valeria · Gustavo', W/2, 1260);

  // Quote
  ctx.font = 'italic 44px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  wrapText(ctx, '"Viajar es la única cosa en la que gastás dinero y te hace más rico"', W/2, 1380, W-120, 58);

  // Dates
  if(DAYS.length > 0){
    const first = DAYS[0].fecha ? fmtDateDisplay(DAYS[0].fecha) : DAYS[0].date;
    const last = DAYS[DAYS.length-1].fecha ? fmtDateDisplay(DAYS[DAYS.length-1].fecha) : DAYS[DAYS.length-1].date;
    ctx.font = 'bold 46px Lato, sans-serif';
    ctx.fillStyle = gold;
    ctx.textAlign = 'center';
    ctx.fillText(`${first} → ${last}`, W/2, 1600);
  }

  drawAccentBar(ctx, style);
  drawLogo(ctx, style);
}

window.generateStory = async () => {
  const canvas = document.getElementById('story-canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('story-preview-wrap');
  wrap.style.display = 'none';

  try {
    if(STORY_TYPE === 'dia'){
      const idx = parseInt(document.getElementById('story-day-sel').value);
      if(isNaN(idx)){ alert('Elegí un día primero'); return; }
      await drawStoryDia(ctx, idx, STORY_STYLE, STORY_PHOTO);
    } else if(STORY_TYPE === 'llegada'){
      const dest = document.getElementById('story-destino').value || 'Santorini 🌅';
      const frase = document.getElementById('story-frase').value;
      await drawStoryLlegada(ctx, dest, frase, STORY_STYLE, STORY_PHOTO);
    } else if(STORY_TYPE === 'stats'){
      await drawStoryStats(ctx, STORY_STYLE, STORY_PHOTO);
    } else if(STORY_TYPE === 'cierre'){
      await drawStoryCierre(ctx, STORY_STYLE, STORY_PHOTO);
    }
    wrap.style.display = 'block';
    wrap.scrollIntoView({behavior:'smooth',block:'start'});
  } catch(e){
    console.error(e);
    alert('Error al generar la story. Revisá la consola.');
  }
};

window.downloadStory = () => {
  const canvas = document.getElementById('story-canvas');
  const a = document.createElement('a');
  a.download = `story-${STORY_TYPE}-${Date.now()}.png`;
  a.href = canvas.toDataURL('image/png',1.0);
  a.click();
};


// ── DATE NAV BAR ──────────────────────────────────────────
function renderDateNav(){
  const nav = document.getElementById('date-nav');
  if(!nav) return;
  const todayISO = new Date().toISOString().slice(0,10);
  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const allDays = getDisplayDays();

  nav.innerHTML = allDays.map((d, idx) => {
    const _dt = getDateObjFromDay(d);
    const dayName = _dt ? dayNames[_dt.getDay()] : '';
    const dayNum = _dt ? _dt.getDate() : (d.fecha||'').split('-')[2]||'';
    const ciudad = d.city || d.ciudad || 'transito';
    const destCol = DEST_COLOR[ciudad] || '#9C876E';
    const isActive = idx === CURRENT_DAY_IDX;
    const bg = isActive ? destCol : 'transparent';
    return `<button class="date-btn${isActive?' active':''}" style="background:${bg}"
      onclick="showDay(${idx})">
      <span class="dw">${dayName}</span>
      <span class="dn">${dayNum}</span>
      <span class="dd" style="background:${isActive?'rgba(255,255,255,.5)':destCol}"></span>
    </button>`;
  }).join('');

  // Auto-scroll active button into view
  const activeBtn = nav.querySelector('.date-btn.active');
  if(activeBtn) activeBtn.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
}

let _jumpLock = false;
window.jumpToDay = function jumpToDay(id){
  // Ensure itinerary tab is active (pills can be visible from any tab)
  const tabEl = document.getElementById('main-tab-it');
  if(tabEl && !tabEl.classList.contains('active')){
    showTab('it', tabEl);
    resetMasTab();
  }
  const el = document.getElementById('day-card-'+id);
  if(!el) return;
  // Close all other open cards, open this one
  document.querySelectorAll('.day-body.open').forEach(b=>{
    if(b.id!=='db'+id){
      b.classList.remove('open');
      const c=document.getElementById('ch'+b.id.slice(2));
      if(c)c.classList.remove('open');
    }
  });
  const body = document.getElementById('db'+id);
  if(body){
    body.classList.add('open');
    const chev = document.getElementById('ch'+id);
    if(chev) chev.classList.add('open');
  }
  // Lock observer so it doesn't override the active pill during scroll animation
  _jumpLock = true;
  setActiveDatePill(id);
  el.scrollIntoView({behavior:'smooth', block:'start'});
  setTimeout(()=>{ _jumpLock = false; }, 700);
}

function setActiveDatePill(id){
  document.querySelectorAll('.date-pill').forEach(p=>p.classList.remove('active'));
  const pill = document.getElementById('dp-'+id);
  if(pill){
    pill.classList.add('active');
    // Scroll pill into view in nav
    pill.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
  }
}

// Intersection observer to highlight current day in nav
let dayObserver = null;
function observeDays(){
  if(dayObserver) dayObserver.disconnect();
  dayObserver = new IntersectionObserver(entries=>{
    if(_jumpLock) return; // Don't override during programmatic scroll
    entries.forEach(e=>{
      if(e.isIntersecting && e.intersectionRatio > 0.3){
        const id = e.target.dataset.dayId;
        if(id) setActiveDatePill(id);
      }
    });
  },{threshold:0.3, rootMargin:'-100px 0px -60% 0px'});
  
  document.querySelectorAll('[data-day-id]').forEach(el=>dayObserver.observe(el));
}

// Render cached data immediately — called after all render functions are defined
function renderFromCache(){
  const cachedDays=loadCache('days');
  if(cachedDays&&cachedDays.length){DAYS=cachedDays;renderDays();updateStats();autoTheme();}
  const cachedHotels=loadCache('hotels');
  if(cachedHotels&&cachedHotels.length){HOTELS=cachedHotels;renderHotels();updateStats();populateHotelSelector();}
  const cachedProfiles=loadCache('profiles');
  if(cachedProfiles&&Object.keys(cachedProfiles).length){PROFILES=cachedProfiles;renderProfiles();}
  const cachedAvatars=loadCache('avatars');
  if(cachedAvatars&&Object.keys(cachedAvatars).length){AVATARS=cachedAvatars;renderTvl();renderNotesPbtns();renderPhotoPbtns();renderProfiles();}
}

renderFromCache();
renderTvl();

// ── COUNTDOWN ─────────────────────────────────────────────
function updateCountdown(){
  const target=TRIP_DEPARTURE;
  const now=new Date();
  const diff=target-now;
  if(diff<=0){const w=document.getElementById('countdown-wrap');if(w)w.style.display='none';return;}
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  document.getElementById('cd-dias').textContent=d;
  document.getElementById('cd-horas').textContent=String(h).padStart(2,'0');
  document.getElementById('cd-mins').textContent=String(m).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown,30000);

// ── COLLAPSIBLE SECTIONS ──────────────────────────────────
window.toggleSep=el=>{const body=el.nextElementSibling;el.classList.toggle('closed');body.classList.toggle('closed');};

// ── TIME AGO ──────────────────────────────────────────────
function timeAgo(ts){
  if(!ts)return'';
  const diff=Date.now()-ts;
  const m=Math.floor(diff/60000);
  const h=Math.floor(diff/3600000);
  const d=Math.floor(diff/86400000);
  if(m<1)return'ahora';
  if(m<60)return`hace ${m}m`;
  if(h<24)return`hace ${h}h`;
  return`hace ${d}d`;
}

// ── MAS BADGE ────────────────────────────────────────────
function updateMasBadge(){
  const tab=document.getElementById('main-tab-mas');
  if(!tab)return;
  const lastSeen=parseInt(localStorage.getItem('tabi-last-seen')||'0');
  const hasNew=NOTES.some(n=>(n.ts||0)>lastSeen)||PHOTOS.some(f=>(f.ts||0)>lastSeen);
  let badge=tab.querySelector('.mas-badge');
  if(hasNew&&!badge){badge=document.createElement('span');badge.className='mas-badge';tab.appendChild(badge);}
  else if(!hasNew&&badge){badge.remove();}
}

// ── TOAST ─────────────────────────────────────────────────
let _toastTimer;
function showToast(msg='Guardado',type='default'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast show';
  if(type==='error')t.classList.add('toast-error');
  if(type==='success')t.classList.add('toast-success');
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>{t.classList.remove('show','toast-error','toast-success');},2500);
}

// ── ACTIVITY FEED ────────────────────────────────────────
function renderActivity(){
  const el=document.getElementById('feed-activity');if(!el)return;
  if(!ACTIVITY.length){
    el.innerHTML=`<div style="text-align:center;padding:32px 16px;color:rgba(60,60,67,.4);font-size:14px">No hay actividad reciente</div>`;
    return;
  }
  const iconos={evento:'📅',hotel:'🏨',nota:'📝',foto:'📷',tarea:'✅','día':'🗓'};
  const tvl=window.TVL_OVERRIDE||TVL;
  el.innerHTML=ACTIVITY.map(a=>{
    const ago=timeAgo(a.ts);
    const idx=tvl.findIndex(t=>t.i===a.initials);
    const avNum=idx>=0?idx+1:1;
    const esYo=a.uid===CURRENT_USER_UID;
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:.5px solid rgba(60,60,67,.08)">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--av${avNum},#8E8E93);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0">${escapeHtml(a.initials)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:#000;line-height:1.4">
          <strong>${esYo?'Vos':escapeHtml(a.nombre)}</strong> ${escapeHtml(a.accion)} ${iconos[a.tipo]||'•'} <span style="color:rgba(60,60,67,.7)">${escapeHtml(a.nombre_item||'')}</span>
        </div>
        <div style="font-size:11px;color:rgba(60,60,67,.4);margin-top:2px">${escapeHtml(a.tipo)} · ${ago}</div>
      </div>
    </div>`;
  }).join('');
}

window.clearOldActivity=async()=>{
  if(!confirm('¿Limpiar actividad de más de 7 días?'))return;
  const cutoff=Date.now()-(7*24*60*60*1000);
  const old=ACTIVITY.filter(a=>a.ts<cutoff);
  if(!old.length){showToast('No hay actividad antigua');return;}
  try{
    const batch=writeBatch(db);
    old.forEach(a=>batch.delete(dref('activity',a._id)));
    await batch.commit();
    showToast(`${old.length} registros eliminados`);
  }catch(e){console.error(e);showToast('⚠ Error al limpiar');}
};

// ── LISTENER CLEANUP ─────────────────────────────────────
window.addEventListener('beforeunload',()=>{
  Object.values(_UNSUB).forEach(unsub=>{if(typeof unsub==='function')unsub();});
});

// ── FIELD ERROR ───────────────────────────────────────────
function showFieldError(fieldId,msg){
  const el=document.getElementById(fieldId);
  if(!el)return;
  el.style.borderColor='#E03030';
  el.style.borderWidth='2px';
  el.focus();
  el.addEventListener('input',()=>{el.style.borderColor='';el.style.borderWidth='';},{once:true});
  showToast('⚠ '+msg);
}

// ── DOC LINK PREVIEW ─────────────────────────────────────
document.getElementById('ev-doc-link')?.addEventListener('input',function(){
  const preview=document.getElementById('ev-doc-link-preview');
  const btn=document.getElementById('ev-doc-link-btn');
  if(this.value.trim()){preview.style.display='block';btn.href=this.value.trim();}
  else{preview.style.display='none';}
});

