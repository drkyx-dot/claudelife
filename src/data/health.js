"use strict";
/* data/health.js — doenças, planos de saúde, vícios e tiers de tratamento.
   Campos de doença:
     sev      dano anual de saúde no estágio 1 sem tratamento
     cure     chance anual de cura COM tratamento (estágio 1, idade ≤ 50)
     cost     custo base anual do tratamento privado
     chronic  nunca cura; tratamento só controla (reduz dano)
     detect   chance base de um check-up detectar a doença antes dos sintomas
     symptoms estágio em que os sintomas aparecem (diagnóstico automático, mais tarde e pior)
     progress chance anual de avançar um estágio quando não tratada
     risk     pesos de fatores de risco (multiplicam a chance de contrair) */
DATA.illnesses = [
  { id:"flu",       name:"Gripe forte",           sev:3,  cure:0.95, cost:150,   chronic:false, detect:1,    symptoms:1, progress:0.05, minAge:0,
    risk:{ stress:0.3 } },
  { id:"pneumonia", name:"Pneumonia",             sev:12, cure:0.85, cost:3000,  chronic:false, detect:0.6,  symptoms:1, progress:0.4,  minAge:55,
    risk:{ smoke:1.2, age:1 } },
  { id:"diabetes",  name:"Diabetes tipo 2",       sev:4,  cure:0,    cost:1400,  chronic:true,  detect:0.85, symptoms:3, progress:0.12, minAge:30,
    risk:{ sedentary:1.5, alcohol:0.5, lux:0.6 } },
  { id:"hypert",    name:"Hipertensão",           sev:4,  cure:0,    cost:700,   chronic:true,  detect:0.9,  symptoms:3, progress:0.12, minAge:30,
    risk:{ stress:1.5, smoke:0.6, alcohol:0.6, sedentary:0.8 } },
  { id:"depress",   name:"Depressão",             sev:4,  cure:0.55, cost:2200,  chronic:false, detect:0.5,  symptoms:1, progress:0.3,  minAge:12, mood:true,
    risk:{ stress:2, alcohol:0.8 } },
  { id:"heart",     name:"Doença cardíaca",       sev:9,  cure:0.3,  cost:35000, chronic:true,  detect:0.7,  symptoms:2, progress:0.25, minAge:42,
    risk:{ stress:1.2, smoke:1.5, sedentary:1, alcohol:0.6, lux:0.4 } },
  { id:"lung",      name:"Doença pulmonar (DPOC)",sev:8,  cure:0,    cost:9000,  chronic:true,  detect:0.75, symptoms:2, progress:0.35, minAge:35,
    risk:{ smoke:3 } },
  { id:"liver",     name:"Cirrose hepática",      sev:10, cure:0.15, cost:28000, chronic:false, detect:0.65, symptoms:2, progress:0.4,  minAge:30,
    risk:{ alcohol:3 } },
  { id:"cancer",    name:"Câncer",                sev:14, cure:0.55, cost:70000, chronic:false, detect:0.6,  symptoms:2, progress:0.5,  minAge:28,
    risk:{ smoke:1.6, alcohol:0.6, age:1.2 } },
  { id:"alzheimer", name:"Alzheimer",             sev:7,  cure:0,    cost:18000, chronic:true,  detect:0.5,  symptoms:2, progress:0.4,  minAge:65,
    risk:{ age:1.5 } },
];

/* Multiplicadores por estágio: dano e eficácia da cura. Estágio 4 é terminal. */
DATA.stages = [
  null,
  { name:"inicial",   dmg:1.0, cure:1.0,  cost:1.0 },
  { name:"moderado",  dmg:1.5, cure:0.7,  cost:1.5 },
  { name:"avançado",  dmg:2.2, cure:0.4,  cost:2.4 },
  { name:"terminal",  dmg:3.2, cure:0.12, cost:3.5 },
];

/* Tiers de tratamento: eficácia, custo relativo e risco de complicação. */
DATA.treatments = [
  { id:"public",       name:"Rede pública",        eff:0.7,  costMult:0.08, risk:0.02, desc:"Barato, com fila: eficácia menor" },
  { id:"private",      name:"Hospital particular", eff:1.0,  costMult:1.0,  risk:0.02, desc:"Padrão de mercado" },
  { id:"experimental", name:"Terapia experimental",eff:1.35, costMult:3.0,  risk:0.12, desc:"Só estágios 3–4: caro e arriscado", minStage:3 },
];

/* Planos de saúde: mensalidade anual base (sobe com a idade), cobertura
   dos tratamentos e bônus de detecção no check-up. */
DATA.healthPlans = [
  { id:"none",    name:"Sem plano",        cost:0,    coverage:0,    detect:0.65 },
  { id:"basic",   name:"Plano básico",     cost:900,  coverage:0.55, detect:0.85 },
  { id:"premium", name:"Plano premium",    cost:3200, coverage:0.85, detect:1.0  },
];

/* Vícios: escala 0–100. "grip" = quanto o vício se auto-reforça por ano. */
DATA.addictions = [
  { id:"smoke",    name:"Tabagismo",   emoji:"🚬", grip:3, healthDmg:0.03, desc:"Pulmão, coração, câncer" },
  { id:"alcohol",  name:"Alcoolismo",  emoji:"🍺", grip:3, healthDmg:0.025, desc:"Fígado, desempenho, relações" },
  { id:"gambling", name:"Jogo compulsivo", emoji:"🎰", grip:4, healthDmg:0, desc:"Perdas financeiras e estresse" },
];
