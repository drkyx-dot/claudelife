"use strict";
/* core/settings.js — preferências do jogador (por dispositivo, não vão no save).
   lang: "forte" (falas realistas com palavrões moderados) | "leve" (filtrado). */
const SETTINGS = { lang:"forte", sound:true, volume:0.55, loading:true, fullscreen:false }; // fullscreen: abrir sempre em tela cheia
try { Object.assign(SETTINGS, JSON.parse(localStorage.getItem("claudilife.settings") || "{}")); } catch(e){}
function saveSettings(){ try { localStorage.setItem("claudilife.settings", JSON.stringify(SETTINGS)); } catch(e){} }
