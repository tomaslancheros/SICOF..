"use strict";
const $ = s => document.querySelector(s);
const cop = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const load = (k,d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } };
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const say = (el,t,ok) => { el.textContent = t; el.className = "msg " + (ok ? "ok" : "err"); };
const CATS = ["Frutas y verduras","Lácteos","Despensa","Aseo","Bebidas"];
const SEED = [
 {id:1,nombre:"Plátano hartón (kg)",cat:"Frutas y verduras",precio:3200,stock:80},
 {id:2,nombre:"Leche entera 1 L",cat:"Lácteos",precio:4300,stock:120},
 {id:3,nombre:"Arroz 500 g",cat:"Despensa",precio:2900,stock:200},
 {id:4,nombre:"Café molido 250 g",cat:"Despensa",precio:11500,stock:60},
 {id:5,nombre:"Detergente 1 kg",cat:"Aseo",precio:15800,stock:40},
 {id:6,nombre:"Jugo de naranja 1 L",cat:"Bebidas",precio:6900,stock:50}];
const getP = () => load("sicof_productos", null) || (save("sicof_productos", SEED), SEED);
async function hash(t){
  if(!crypto.subtle) return btoa(unescape(encodeURIComponent(t)));
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("");
}
/* ---- Sesión y roles (se guarda en el navegador hasta que la persona pulse «Salir») ---- */
const sesion = () => load("sicof_sesion", null);
const destino = s => s.rol === "admin" ? "admin.html" : "index.html";
function exigir(rol) {
  const s = sesion();
  if (!s) { location.replace("acceso.html"); return null; }
  if (s.rol !== rol) { location.replace(destino(s)); return null; }
  return s;
}
const salir = () => { localStorage.removeItem("sicof_sesion"); location.replace("acceso.html"); };
