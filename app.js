"use strict";
const $ = s => document.querySelector(s);
const cop = n => new Intl.NumberFormat("es-CO", {style: "currency", currency: "COP", maximumFractionDigits: 0}).format(n);
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const say = (el, text, ok) => { el.textContent = text; el.className = "msg " + (ok ? "ok" : "err"); };

/* ---------- Texto interactivo (efecto de escritura) ---------- */
const frases = ["sin filas.", "desde tu celular.", "listo en minutos.", "a buen precio."];
const typed = $("#typed");
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  typed.textContent = frases[0]; typed.style.borderRight = "0";
} else {
  let f = 0, i = 0, borrando = false;
  const tick = () => {
    const t = frases[f];
    i += borrando ? -1 : 1;
    typed.textContent = t.slice(0, i);
    let d = borrando ? 40 : 90;
    if (!borrando && i === t.length) { borrando = true; d = 1400; }
    else if (borrando && i === 0) { borrando = false; f = (f + 1) % frases.length; d = 400; }
    setTimeout(tick, d);
  };
  tick();
}

/* ---------- Breadcrumbs dinámicos ---------- */
const nombres = {"#catalogo": "Productos", "#resenas": "Reseñas", "#registro": "Registro"};
function crumbs() {
  const n = nombres[location.hash];
  $("#crumbs").innerHTML = '<li><a href="index.html" style="color:#ffffff">Inicio</a></li>' + (n ? `<li aria-current="page">${n}</li>` : "");
}
addEventListener("hashchange", crumbs); crumbs();

/* ---------- CRUD de productos ---------- */
let productos = load("sicof_productos", null) || [
  {id: 1, nombre: "Plátano hartón (kg)", cat: "Frutas y verduras", precio: 3200, stock: 80},
  {id: 2, nombre: "Leche entera 1 L", cat: "Lácteos", precio: 4300, stock: 120},
  {id: 3, nombre: "Arroz 500 g", cat: "Despensa", precio: 2900, stock: 200},
  {id: 4, nombre: "Café molido 250 g", cat: "Despensa", precio: 11500, stock: 60},
  {id: 5, nombre: "Detergente 1 kg", cat: "Aseo", precio: 15800, stock: 40}
];
save("sicof_productos", productos);

function pintar() {
  const q = $("#psearch").value.trim().toLowerCase();
  const lista = productos.filter(p => (p.nombre + " " + p.cat).toLowerCase().includes(q));
  $("#ptable").innerHTML = lista.length ? lista.map(p => `<tr>
    <td>${esc(p.nombre)}</td><td>${esc(p.cat)}</td><td class="num">${cop(p.precio)}</td><td class="num">${p.stock}</td>
    <td class="acts"><button class="btn small sec" data-edit="${p.id}">Editar</button> <button class="btn danger" data-del="${p.id}">Eliminar</button></td></tr>`).join("")
    : '<tr><td colspan="5" class="empty">No hay productos. Agrega el primero con el formulario.</td></tr>';
  $("#pcount").textContent = lista.length + " producto" + (lista.length === 1 ? "" : "s");
}
function limpiar() {
  $("#pform").reset(); $("#pid").value = "";
  $("#psave").textContent = "Agregar producto"; $("#pcancel").hidden = true;
}
$("#pform").addEventListener("submit", e => {
  e.preventDefault();
  const nombre = $("#pname").value.trim(), precio = Number($("#pprice").value), stock = Number($("#pstock").value);
  if (nombre.length < 2) return say($("#pmsg"), "Escribe un nombre de al menos 2 letras.");
  if (!Number.isInteger(precio) || precio <= 0) return say($("#pmsg"), "El precio debe ser un número entero mayor a 0.");
  if (!Number.isInteger(stock) || stock < 0) return say($("#pmsg"), "El stock debe ser un número entero, 0 o más.");
  const id = Number($("#pid").value), cat = $("#pcat").value;
  if (id) {
    productos = productos.map(p => p.id === id ? {...p, nombre, cat, precio, stock} : p);
    say($("#pmsg"), "Producto actualizado.", true);
  } else {
    productos.push({id: Date.now(), nombre, cat, precio, stock});
    say($("#pmsg"), "Producto agregado.", true);
  }
  save("sicof_productos", productos); limpiar(); pintar();
});
$("#ptable").addEventListener("click", e => {
  const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) {
    const p = productos.find(x => x.id === Number(ed)); if (!p) return;
    $("#pid").value = p.id; $("#pname").value = p.nombre; $("#pcat").value = p.cat;
    $("#pprice").value = p.precio; $("#pstock").value = p.stock;
    $("#psave").textContent = "Guardar cambios"; $("#pcancel").hidden = false; $("#pname").focus();
  }
  if (del) {
    const p = productos.find(x => x.id === Number(del));
    if (p && confirm(`¿Eliminar "${p.nombre}"?`)) {
      productos = productos.filter(x => x.id !== p.id); save("sicof_productos", productos);
      if ($("#pid").value == p.id) limpiar();
      say($("#pmsg"), "Producto eliminado.", true); pintar();
    }
  }
});
$("#pcancel").addEventListener("click", () => { limpiar(); say($("#pmsg"), ""); });
$("#psearch").addEventListener("input", pintar);
pintar();

/* ---------- Reseñas (solo las que escriben los clientes) ---------- */
let reseñas = load("sicof_resenas", []);
function pintarReseñas() {
  $("#rlist").innerHTML = reseñas.map(r => `<article class="rev"><div class="stars" aria-label="${r.estrellas} de 5">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</div>
    <p>${esc(r.texto)}</p><small>${esc(r.nombre)} · ${new Date(r.fecha).toLocaleDateString("es-CO")}</small></article>`).join("");
  const prom = reseñas.reduce((a, r) => a + r.estrellas, 0) / (reseñas.length || 1);
  $("#ravg").textContent = reseñas.length ? `${prom.toFixed(1)} de 5 · ${reseñas.length} reseña${reseñas.length === 1 ? "" : "s"}` : "Aún no hay reseñas. Cuéntanos tu experiencia y sé el primero.";
}
$("#rform").addEventListener("submit", e => {
  e.preventDefault();
  const nombre = $("#rname").value.trim(), texto = $("#rtext").value.trim();
  if (!nombre || texto.length < 10) return say($("#rmsg"), "Escribe tu nombre y una reseña de al menos 10 caracteres.");
  reseñas.unshift({nombre, texto, estrellas: Number($("#rstars").value), fecha: Date.now()});
  save("sicof_resenas", reseñas); $("#rform").reset(); pintarReseñas();
  say($("#rmsg"), "Gracias, tu reseña ya está publicada.", true);
});
pintarReseñas();

/* ---------- Registro ---------- */
async function hash(t) {
  if (!crypto.subtle) return btoa(unescape(encodeURIComponent(t)));
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
$("#regform").addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = $("#uname").value.trim(), email = $("#uemail").value.trim().toLowerCase(), p1 = $("#upass").value, p2 = $("#upass2").value;
  if (nombre.length < 3) return say($("#umsg"), "Escribe tu nombre completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say($("#umsg"), "Escribe un correo válido, por ejemplo nombre@correo.com.");
  if (p1.length < 8) return say($("#umsg"), "La contraseña debe tener mínimo 8 caracteres.");
  if (p1 !== p2) return say($("#umsg"), "Las contraseñas no coinciden.");
  const usuarios = load("sicof_usuarios", []);
  if (usuarios.some(u => u.email === email)) return say($("#umsg"), "Ese correo ya está registrado.");
  usuarios.push({nombre, email, clave: await hash(p1), creado: Date.now()});
  save("sicof_usuarios", usuarios);
  location.href = "gracias.html?n=" + encodeURIComponent(nombre.split(" ")[0]);
});
