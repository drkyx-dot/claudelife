"use strict";
/* =====================================================================
   state/persistence.js — SLOTS de vidas salvas + HALL DOS LEGADOS.
   • Cada vida fica em claudilife.slot.<id>; o índice (nome, idade, país,
     avatar, data) fica em claudilife.slots; a vida aberta, em curslot.
   • Saves antigos (chave única v3–v6) viram um slot automaticamente.
   • Toda morte registra a vida no Hall (claudilife.hall): título,
     pontuação, causa e conquistas — o histórico entre vidas do hub.
   • NO_PERSIST (testes/demos) impede qualquer escrita.
   ===================================================================== */
const SLOTS_KEY = "claudilife.slots", SLOT_PREFIX = "claudilife.slot.", CUR_SLOT_KEY = "claudilife.curslot", HALL_KEY = "claudilife.hall";
const MAX_SLOTS = 6;
let CUR_SLOT = null, NO_PERSIST = false;

function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } }
function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }
function listSlots(){ try { const a = JSON.parse(lsGet(SLOTS_KEY)); return Array.isArray(a) ? a : []; } catch(e){ return []; } }
function writeSlots(a){ lsSet(SLOTS_KEY, JSON.stringify(a.slice(0, 20))); }
function newSlotId(){ return "s" + Date.now().toString(36) + Math.floor(Math.random()*1e5).toString(36); }
function metaOf(st, id){
  const p = st.player;
  return { id, name:`${p.first} ${p.last}`, age:p.age, alive:p.alive, country:p.country, cls:p.cls, gender:p.gender, tone: st.look?.tone || "",
           savedAt: Date.now(), gen: (st.lineage || []).length + 1, title: st.final?.title || null };
}

function saveGame(silent){
  if (NO_PERSIST || !S) return false;
  if (!CUR_SLOT) CUR_SLOT = newSlotId();
  try {
    localStorage.setItem(SLOT_PREFIX + CUR_SLOT, JSON.stringify({ v:SAVE_VERSION, savedAt:Date.now(), state:S }));
    const slots = listSlots().filter(x => x.id !== CUR_SLOT); slots.unshift(metaOf(S, CUR_SLOT)); writeSlots(slots);
    lsSet(CUR_SLOT_KEY, CUR_SLOT);
    if (!silent) toast("Jogo salvo 💾"); return true;
  } catch(e){ if (!silent) toast("Não foi possível salvar (armazenamento cheio ou indisponível)."); return false; }
}
/* Mínimo para dar para recuperar uma vida: o jogador existe. O resto o
   normalizador (state.js) reconstrói. */
function validateState(st){
  return !!(st && typeof st === "object" && st.player && typeof st.player === "object" && typeof st.player.first === "string");
}
function migrate(st){
  // ponto central de migração entre versões de save (ensureState preenche/converte campos)
  ensureState(st); repairState(st);
  st.version = SAVE_VERSION; return st;
}
/* Save de chave única (v3–v6) → slot. Roda uma vez. */
function migrateLegacySave(){
  if (NO_PERSIST || lsGet("claudilife.legacyMigrated")) return;
  for (const key of [SAVE_KEY, ...LEGACY_SAVE_KEYS]){
    const raw = lsGet(key); if (!raw) continue;
    try { const o = JSON.parse(raw); if (!validateState(o.state)) continue;
      const id = newSlotId(); lsSet(SLOT_PREFIX + id, raw);
      const slots = listSlots(); slots.unshift(metaOf(o.state, id)); writeSlots(slots); lsSet(CUR_SLOT_KEY, id);
      break;
    } catch(e){}
  }
  lsSet("claudilife.legacyMigrated", "1");
}
function loadGame(slotId){
  migrateLegacySave();
  const id = slotId || lsGet(CUR_SLOT_KEY) || listSlots()[0]?.id; if (!id) return false;
  try {
    const raw = lsGet(SLOT_PREFIX + id); if (!raw) return false;
    const o = JSON.parse(raw); if (!validateState(o.state)) return false;
    S = migrate(o.state); sanitize(); CUR_SLOT = id; lsSet(CUR_SLOT_KEY, id);
    return true;
  } catch(e){ console.warn("save inválido", e); return false; }
}
function deleteSlot(id){
  lsDel(SLOT_PREFIX + id); writeSlots(listSlots().filter(x => x.id !== id));
  if (CUR_SLOT === id){ CUR_SLOT = null; lsDel(CUR_SLOT_KEY); }
}
function startNewSlot(){ CUR_SLOT = newSlotId(); }
const slotsFull = () => listSlots().length >= MAX_SLOTS;

/* ---------- Hall dos legados ---------- */
function readHall(){ try { const h = JSON.parse(lsGet(HALL_KEY)); return h && Array.isArray(h.lives) ? h : { lives:[], ach:{} }; } catch(e){ return { lives:[], ach:{} }; } }
function recordHall(){
  if (NO_PERSIST || !S || !S.final) return;
  const p = P(), h = readHall();
  h.lives.unshift({ name:`${p.first} ${p.last}`, gender:p.gender, tone:S.look?.tone || "", title:S.final.title, score:S.final.score?.total ?? 0, age:p.age, cause:p.cause,
    born:p.birthYear, died:p.birthYear + p.age, country:p.country, cls:DATA.classes[p.cls]?.name, nw:S.final.netWorth, ach:S.achievements.length, ts:Date.now() });
  h.lives = h.lives.slice(0, 80);
  for (const a of S.achievements) h.ach[a.text] = num(h.ach[a.text]) + 1;
  lsSet(HALL_KEY, JSON.stringify(h));
}

function exportSave(){
  const blob = new Blob([JSON.stringify({ v:SAVE_VERSION, state:S }, null, 1)], { type:"application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `claudilife-${P().first}-${P().last}-${P().age}anos.json`.replace(/\s+/g,"_");
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function importSave(file, done){
  const fr = new FileReader();
  fr.onload = () => { try { const o = JSON.parse(fr.result); const st = o.state || o; if (!validateState(st)) throw 0; S = migrate(st); sanitize(); startNewSlot(); saveGame(true); done(true); } catch(e){ done(false); } };
  fr.readAsText(file);
}
