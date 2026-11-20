"use strict";
/* =====================================================================
   ui/device.js — comportamento de app em celular/tablet.
   • --app-h: altura real visível (fallback quando não há 100dvh e para a
     barra de endereço do iOS/Android que encolhe e cresce).
   • Áudio: o AudioContext é criado/retomado no 1º toque (exigência do
     iOS/Android) e retomado quando o app volta do segundo plano.
   • Salva ao ir para o segundo plano (mobile mata abas sem aviso).
   • Anti toque duplo: um 2º toque rápido não escolhe a opção do PRÓXIMO
     evento nem envelhece dois anos.
   • Classe html.touch / html.mouse para ajustes finos de interface.
   ===================================================================== */
const Device = (() => {
  const root = document.documentElement;
  const coarse = () => typeof matchMedia === "function" && matchMedia("(pointer:coarse)").matches;
  function setAppHeight(){
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("height", "100dvh")) return; // o CSS já resolve
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    root.style.setProperty("--app-h", Math.round(h) + "px");
  }
  function setPointerClass(){ root.classList.toggle("touch", coarse()); root.classList.toggle("mouse", !coarse()); }
  setAppHeight(); setPointerClass();
  addEventListener("resize", setAppHeight, { passive:true });
  if (window.visualViewport) visualViewport.addEventListener("resize", setAppHeight, { passive:true });
  addEventListener("orientationchange", () => { setTimeout(setAppHeight, 120); setTimeout(keepModalInView, 160); }, { passive:true });
  if (typeof matchMedia === "function"){ const mq = matchMedia("(pointer:coarse)"); (mq.addEventListener ? mq.addEventListener("change", setPointerClass) : mq.addListener(setPointerClass)); }

  /* ao girar a tela, o modal aberto volta ao topo do conteúdo visível (sem perder estado) */
  function keepModalInView(){ const m = document.querySelector("#modalRoot .modal"); if (m && m.scrollTop > m.scrollHeight - m.clientHeight) m.scrollTop = m.scrollHeight; }

  /* ---------- Áudio: desbloqueio no primeiro gesto ---------- */
  const unlock = () => { if (typeof Sound !== "undefined") Sound.unlock(); };
  for (const ev of ["pointerdown","touchend","keydown","click"]) addEventListener(ev, unlock, { capture:true, passive:true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden"){ try { if (typeof S !== "undefined" && S && P().alive) saveGame(true); } catch(e){} if (typeof Sound !== "undefined") Sound.suspend(); }
  });
  addEventListener("pagehide", () => { try { if (typeof S !== "undefined" && S) saveGame(true); } catch(e){} });

  /* ---------- Anti toque duplo ---------- */
  let busyUntil = 0;
  function guard(ms = 320){ const now = performance.now(); if (now < busyUntil) return false; busyUntil = now + ms; return true; }

  return { guard, coarse, setAppHeight };
})();
