"use strict";
/* core/bus.js — barramento de eventos mínimo.
   A simulação emite (emit("achievement", …)) sem conhecer a UI; a UI e o
   áudio assinam (on("achievement", fn)). Mantém o motor testável sem DOM. */
const BUS = {};
function on(name, fn){ (BUS[name] = BUS[name] || []).push(fn); }
function emit(name, data){ for (const fn of BUS[name] || []) { try { fn(data); } catch(e){ console.warn("bus", name, e); } } }
