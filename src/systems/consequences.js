"use strict";
/* =====================================================================
   systems/consequences.js — consequências de médio/longo prazo.
   Uma escolha agenda um efeito futuro: schedule(kind, anos, ctx, nota).
   A cada ano, consequencesYear() dispara os vencidos. Cada handler
   revalida o estado atual antes de agir (sem efeito contraditório: um
   amigo morto não devolve dinheiro, um diploma inexistente não é
   investigado). O resultado vai para o log e para o histórico de
   consequências exibido na aba Vida.
   ===================================================================== */
function schedule(kind, inYears, ctx = {}, note){
  S.scheduled.push({ kind, at: P().age + Math.max(1, Math.round(inYears)), ctx, from: P().age });
  if (note) remember(note, "pending");
}
function pendingConsequences(){ return S.scheduled.filter(x => x.at > P().age).length; }

const CONSEQ = {
  /* colou em provas: pode ser descoberto e manchar o histórico */
  cheatExposed(ctx){
    if (!chance(0.35)) return;
    if (S.edu.school){ S.edu.perf = clamp(S.edu.perf - 20); addRep(-6); return out(`Uma investigação revelou que colei em provas antigas. Desempenho escolar −20.`, "bad"); }
    if (S.job){ addRep(-10); S.job.perf = clamp(S.job.perf - 10); return out(`Ex-colegas expuseram minhas colas na escola. Minha reputação no trabalho caiu.`, "bad"); }
  },
  /* fugiu de um acidente: câmeras e testemunhas */
  hitAndRun(){
    if (inPrison() || !chance(0.45)) return;
    addNoto(25); enqueue("ev_investigation");
    return out(`Imagens do acidente em que fugi vieram à tona. A polícia reabriu o caso.`, "bad");
  },
  /* emprestou dinheiro: o amigo devolve (ou some) anos depois */
  friendRepay(ctx){
    const f = relBy(ctx.uid);
    if (!f || !f.alive){ return out(`O dinheiro emprestado a ${ctx.name} nunca voltou.`, "bad"); }
    if (chance(0.25 + f.rel/200)){
      const back = Math.round(ctx.amt * rfloat(1.0, 1.3)); addMoney(back); f.rel = clamp(f.rel + 10);
      return out(`${ctx.name} me devolveu ${fmt(back)} — com juros de gratidão.`, "good");
    }
    f.rel = clamp(f.rel - 15); return out(`${ctx.name} sumiu com meu dinheiro. A amizade esfriou.`, "bad");
  },
  /* mentoria rende frutos */
  mentorPayoff(){
    S.flags.mentor = false;
    if (!S.job) return;
    addRep(10); S.job.perf = clamp(S.job.perf + 10);
    return out(`A mentoria que aceitei anos atrás rendeu: mais reputação e desempenho.`, "good");
  },
  /* contato de networking vira proposta de emprego */
  contactOffer(){ if (S.job && !inPrison()) enqueue("ev_contact_offer"); },
  /* pagou a faculdade do filho: retribuição na velhice */
  childGrateful(ctx){
    const k = relBy(ctx.uid); if (!k || !k.alive) return;
    k.rel = clamp(k.rel + 12); k.supportsParent = true;
    return out(`${k.first} se formou e agradeceu por eu ter pago a faculdade. Prometeu me ajudar na velhice.`, "good");
  },
  /* propina aceita: investigação de corrupção */
  corruptionProbe(ctx){
    if (inPrison() || !chance(0.4 + P().notoriety/200)) return;
    enqueue("ev_corruption_probe", { amt: ctx.amt });
  },
  /* voluntariado vira referência profissional */
  volunteerReference(){ S.flags.reference = true; addRep(4); return out(`A ONG onde fui voluntário me deu uma carta de referência.`, "good"); },
  /* cirurgia plástica malfeita: revisão anos depois */
  plasticRevision(){
    if (!chance(0.4)) return;
    addStat("looks", -6); return out(`A cirurgia plástica antiga começou a dar problemas estéticos.`, "bad");
  },
  /* exposição de escândalo antigo para figuras públicas */
  oldScandal(){
    if (P().fame < 40 || !chance(0.5)) return;
    addFame(-10); addRep(-8); return out(`Um escândalo antigo voltou às manchetes.`, "bad");
  },
  /* fumou na adolescência mas parou: risco residual cai com o tempo */
  quitBenefit(){ addStat("health", 3); return out(`Anos sem fumar: meu fôlego voltou.`, "good"); },
};
function out(text, kind){ log("⏳ " + text, kind); remember(text, kind); return text; }

function consequencesYear(){
  const age = P().age, due = S.scheduled.filter(x => x.at <= age);
  S.scheduled = S.scheduled.filter(x => x.at > age);
  for (const c of due){ try { CONSEQ[c.kind]?.(c.ctx || {}); } catch(e){ console.warn("consequência", c.kind, e); } }
}
