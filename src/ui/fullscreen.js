"use strict";
/* =====================================================================
   ui/fullscreen.js — TELA CHEIA (PC e celular) + MODO APP anti-rolagem.
   • Fullscreen API nativa (requestFullscreen / webkitRequestFullscreen).
   • Onde a API não existe (iPhone) ou é bloqueada (iframe/webview), entra
     o MODO APP (pseudo tela cheia): a página inteira para de rolar; só o
     conteúdo do jogo rola por dentro, sem "puxar para atualizar", sem
     efeito elástico e sem zoom de pinça acidental.
   • Instalado na tela inicial (display-mode: standalone) → modo app
     automático.
   • pageTop(): volta ao topo funcionando nos dois modos de rolagem.
   ===================================================================== */
const FS = (() => {
  const d = document, root = d.documentElement;
  let pseudo = false;
  const nativeEl = () => d.fullscreenElement || d.webkitFullscreenElement || null;
  const nativeOk = () => !!(root.requestFullscreen || root.webkitRequestFullscreen) && (d.fullscreenEnabled ?? d.webkitFullscreenEnabled ?? true);
  const standalone = () => (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const active = () => !!nativeEl() || pseudo;

  function apply(){
    const on = active() || standalone();
    root.classList.toggle("app-mode", on);
    root.classList.toggle("is-fullscreen", !!nativeEl());
    for (const b of d.querySelectorAll("[data-fs-btn]")){
      b.innerHTML = active() ? FS_ICON.exit : FS_ICON.enter;
      b.setAttribute("aria-label", active() ? "Sair da tela cheia" : "Tela cheia");
      b.setAttribute("aria-pressed", active() ? "true" : "false");
      b.title = active() ? "Sair da tela cheia" : "Tela cheia";
    }
  }
  async function enter(){
    let ok = false;
    if (nativeOk()){
      try { await (root.requestFullscreen ? root.requestFullscreen({ navigationUI:"hide" }) : root.webkitRequestFullscreen()); ok = true; } catch(e){ ok = false; }
    }
    if (!ok){
      pseudo = true;
      toast(/iPhone|iPod/.test(navigator.userAgent) ? "Modo app ativado. Para tela cheia total no iPhone: Compartilhar → Adicionar à Tela de Início." : "Modo app ativado (o navegador bloqueou a tela cheia nativa).");
    }
    apply(); Sound.play("expand");
  }
  async function exit(){
    try { if (nativeEl()) await (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen()); } catch(e){}
    pseudo = false; apply(); Sound.play("collapse");
  }
  function toggle(){ return active() ? exit() : enter(); }
  /* Preferência "abrir sempre em tela cheia": o modo app (sem rolagem
     acidental) liga na hora; a tela cheia nativa só pode ser pedida num
     gesto do usuário, então é solicitada no PRIMEIRO toque/clique. */
  function setAlways(on){
    SETTINGS.fullscreen = !!on; saveSettings();
    if (on && !active()) enter(); else apply();
    return SETTINGS.fullscreen;
  }
  if (SETTINGS.fullscreen){
    pseudo = true;
    const firstTap = async () => {
      removeEventListener("pointerdown", firstTap, true);
      if (!nativeEl() && nativeOk()){ try { await (root.requestFullscreen ? root.requestFullscreen({ navigationUI:"hide" }) : root.webkitRequestFullscreen()); } catch(e){} }
      apply();
    };
    addEventListener("pointerdown", firstTap, true);
  }
  d.addEventListener("fullscreenchange", apply); d.addEventListener("webkitfullscreenchange", apply);
  if (typeof matchMedia === "function"){ const mq = matchMedia("(display-mode: standalone)"); mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener?.(apply); }
  // F11/ESC também passam por aqui: o "F" alterna (fora de campos de texto)
  d.addEventListener("keydown", e => { if (e.key === "f" && !e.ctrlKey && !e.metaKey && !/input|textarea|select/i.test(e.target.tagName) && !d.querySelector("#modalRoot .escgrid")) toggle(); });
  setTimeout(apply, 0);
  /* Botões de configuração (hub e menu do jogo). */
  function settingsHTML(after){
    return `<div class="section-label">📱 Tela</div>
      <button onclick="FS.toggle().then(()=>${after})">${active() ? "🗗 Sair da tela cheia" : "⛶ Entrar em tela cheia agora"}<small>${nativeOk() ? "tela cheia do aparelho" : "este navegador não permite tela cheia nativa: usa o modo app (sem rolagem acidental)"}</small></button>
      <button onclick="FS.setAlways(!SETTINGS.fullscreen);${after}">${SETTINGS.fullscreen ? "✅" : "⬜"} Abrir sempre em tela cheia<small>ativa ao abrir o jogo (no 1º toque, no celular)</small></button>
      ${/iPhone|iPod/.test(navigator.userAgent) && !standalone() ? `<div class="oddsline">No iPhone, a tela cheia total só existe instalando o jogo: <b>Compartilhar → Adicionar à Tela de Início</b>.</div>` : ""}`;
  }
  return { toggle, enter, exit, active, apply, setAlways, settingsHTML };
})();
const FS_ICON = {
  enter: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`,
  exit:  `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>`,
};
const fsButton = (cls = "iconbtn") => `<button class="${cls} fsbtn" data-fs-btn onclick="FS.toggle()" aria-label="Tela cheia" title="Tela cheia">${FS.active() ? FS_ICON.exit : FS_ICON.enter}</button>`;
/* Topo da página em qualquer modo (no modo app quem rola é o <body>). */
function pageTop(smooth = false){
  const opt = { top:0, behavior: smooth && !REDUCED() ? "smooth" : "auto" };
  window.scrollTo(opt); if (document.body) document.body.scrollTo?.(opt);
}
