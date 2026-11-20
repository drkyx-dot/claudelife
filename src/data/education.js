"use strict";
/* data/education.js */

/* Níveis educacionais (ordem importa — o motor compara números). */
DATA.eduLevels = ["Nenhuma","Ensino Fundamental","Ensino Médio","Curso Técnico","Graduação","Mestrado","Doutorado"];

DATA.majors = [
  { id:"cs",   name:"Ciência da Computação", minInt:55, years:4, cost:9000 },
  { id:"med",  name:"Medicina",              minInt:75, years:6, cost:22000 },
  { id:"law",  name:"Direito",               minInt:60, years:5, cost:12000 },
  { id:"eng",  name:"Engenharia",            minInt:62, years:5, cost:11000 },
  { id:"biz",  name:"Administração",         minInt:45, years:4, cost:8000 },
  { id:"fin",  name:"Economia/Finanças",     minInt:58, years:4, cost:10000 },
  { id:"arts", name:"Artes e Comunicação",   minInt:35, years:4, cost:7000 },
  { id:"psy",  name:"Psicologia",            minInt:50, years:5, cost:8500 },
  { id:"nurse",name:"Enfermagem",            minInt:45, years:4, cost:7500 },
  { id:"edu",  name:"Pedagogia/Licenciatura",minInt:38, years:4, cost:5000 },
];

DATA.techCourses = [
  { id:"t_elec", name:"Técnico em Eletrotécnica", cost:2500 },
  { id:"t_it",   name:"Técnico em Informática",   cost:2500 },
  { id:"t_nurse",name:"Técnico em Enfermagem",    cost:2500 },
  { id:"t_mech", name:"Técnico em Mecânica",      cost:2500 },
];

DATA.techCourses.push(
  { id:"t_cook",  name:"Técnico em Gastronomia",    cost:3500 },
  { id:"t_pilot", name:"Formação de Piloto Comercial", cost:16000, minInt:55, minHealth:65 },
);
