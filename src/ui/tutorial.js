"use strict";
/* =====================================================================
   ui/tutorial.js — TUTORIAL resumido, logo após o carregamento de uma
   nova vida. Travado (não fecha tocando fora nem com Esc): o jogador
   passa pelos 5 cartões. Depois da 1ª vez, pode marcar "não mostrar nas
   próximas vidas". Revisável a qualquer hora: menu ☰ → Guia rápido, ou
   o hub.
   ===================================================================== */
const TUTORIAL = [
  { ic:"⏩", t:"Avance o tempo", b:"Cada toque em <b>Envelhecer 1 ano</b> simula um ano inteiro: salário, contas, saúde, relações e eventos. Não há volta — pense antes." },
  { ic:"📊", t:"Atributos e dinheiro", b:"<b>Saúde, felicidade, inteligência e aparência</b> ficam no topo. Estresse alto adoece; dívida derruba o crédito. Veja o caixa do ano na aba <b>Vida</b> e o patrimônio em <b>Bens</b>." },
  { ic:"💬", t:"Decisões e abordagens", b:"Eventos e pessoas que se aproximam sempre pedem uma escolha: <b>aceitar, recusar, negociar, investigar ou ignorar</b>. Investigar gasta energia e revela quem a pessoa é." },
  { ic:"💼", t:"Trabalhe e invista", b:"Na aba <b>Carreira</b>: estudo, emprego, entrevistas e trabalho autônomo. Em <b>Bens</b>: imóveis, investimentos, coleção. Em <b>Ações</b>: os lugares da cidade (6 de energia por ano)." },
  { ic:"⚠️", t:"Consequências e riscos", b:"Escolhas voltam anos depois (aba <b>Vida → Consequências</b>). Crime, brigas e golpes dão dinheiro rápido, mas trazem polícia, inimigos e prisão. Boa vida!" },
];
const tutorialSkipped = () => { try { return localStorage.getItem("claudilife.tutorialOff") === "1"; } catch(e){ return false; } };
const tutorialSeen = () => { try { return localStorage.getItem("claudilife.tutorialSeen") === "1"; } catch(e){ return false; } };

Object.assign(UI, {
  /* Obrigatório no início de cada vida (exceto se desativado depois da 1ª vez). */
  tutorial(){ if (!S || NO_PERSIST && !/tutorial/.test(location.search) || tutorialSkipped()) return; UI._tut = { i:0, mandatory:true }; UI.tutStep(); },
  /* Guia rápido: mesma sequência, pode fechar. */
  guide(){ UI._tut = { i:0, mandatory:false }; UI.tutStep(); },
  tutStep(){
    const T = UI._tut, s = TUTORIAL[T.i], last = T.i === TUTORIAL.length - 1;
    modal(`<div class="tut">
      <div class="tut-dots" aria-hidden="true">${TUTORIAL.map((_, k) => `<i class="${k === T.i ? "on" : k < T.i ? "done" : ""}"></i>`).join("")}</div>
      <div class="emoji">${s.ic}</div><h3>${s.t}</h3><p>${s.b}</p>
      <div class="oddsline">Passo ${T.i + 1} de ${TUTORIAL.length}${T.mandatory ? " · tutorial inicial" : " · guia rápido"}</div>
      ${last && T.mandatory && tutorialSeen() ? `<label class="tut-off"><input type="checkbox" id="tutoff"> Não mostrar nas próximas vidas</label>` : ""}
      <div class="choices tut-nav">${T.i ? `<button onclick="UI._tut.i--;UI.tutStep()">← Voltar</button>` : ""}
        <button class="primary" onclick="${last ? "UI.tutDone()" : "UI._tut.i++;UI.tutStep()"}">${last ? (T.mandatory ? "🎮 Começar a viver!" : "Fechar guia") : "Próximo →"}</button></div></div>`, { locked: T.mandatory });
    Sound.play("bubble");
  },
  tutDone(){
    const off = document.getElementById("tutoff");
    try { localStorage.setItem("claudilife.tutorialSeen", "1"); if (off && off.checked) localStorage.setItem("claudilife.tutorialOff", "1"); } catch(e){}
    closeModal(); Sound.play("ready");
    if (S && S.queue.length && P().alive) setTimeout(showEvent, 250);
  },
});
