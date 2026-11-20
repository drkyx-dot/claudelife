"use strict";
/* core/utils.js */

const clamp = (v,a=0,b=100) => { v = Number(v); if(!isFinite(v)) v = a; return Math.max(a, Math.min(b, v)); };

const num = (v, d=0) => (typeof v === "number" && isFinite(v)) ? v : d;

const byId = (list, id) => list.find(x => x.id === id);

/* hash estável de string (atribuições determinísticas em migrações) */
function hashStr(s){ let h = 0; for (const ch of String(s)) h = (h*31 + ch.charCodeAt(0)) | 0; return h; }
