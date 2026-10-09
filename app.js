/* ---- Texto interactivo ---- */
const frases = ["sin filas.","desde tu celular.","listo en minutos.","a buen precio."], typed = $("#typed");
if (matchMedia("(prefers-reduced-motion: reduce)").matches) { typed.textContent = frases[0]; typed.style.borderRight = "0"; }
else { let f=0,i=0,b=false; const tick=()=>{const t=frases[f]; i+=b?-1:1; typed.textContent=t.slice(0,i); let d=b?40:90;
  if(!b&&i===t.length){b=true;d=1400}else if(b&&i===0){b=false;f=(f+1)%frases.length;d=400} setTimeout(tick,d)}; tick(); }
/* ---- Breadcrumbs ---- */
const nombres = {"#catalogo":"Productos","#resenas":"Reseñas"};
const crumbs = () => { const n = nombres[location.hash]; $("#crumbs").innerHTML = '<li><a href="index.html">Inicio</a></li>' + (n ? `<li aria-current="page">${n}</li>` : ""); };
addEventListener("hashchange", crumbs); crumbs();
/* ---- Sesión (solo clientes) ---- */
const S = exigir("cliente"); if (!S) throw new Error("Redirigiendo al acceso");
const pintarSesion = () => { const n = S.nombre.split(" ")[0]; $("#quien").textContent = n; $("#hola").textContent = `Hola, ${n}. Arma tu compra y recógela sin fila.`; };
$("#navout").onclick = salir;
/* ---- Catálogo ---- */
let cat = "Todos";
function pintarChips() {
  $("#chips").innerHTML = ["Todos", ...CATS].map(c => `<button class="chip" data-c="${c}" aria-pressed="${c===cat}">${c}</button>`).join("");
}
function pintarCat() {
  const q = $("#psearch").value.trim().toLowerCase();
  const l = getP().filter(p => (cat === "Todos" || p.cat === cat) && p.nombre.toLowerCase().includes(q));
  $("#cards").innerHTML = l.length ? l.map(p => `<article class="card"><span class="cat">${esc(p.cat)}</span><h3>${esc(p.nombre)}</h3>
    <span class="price">${cop(p.precio)}</span><small>${p.stock > 0 ? p.stock + " disponibles" : "Agotado"}</small>
    <button class="btn sec" data-add="${p.id}" ${p.stock < 1 ? "disabled" : ""}>Agregar al carrito</button></article>`).join("")
    : '<p class="empty">No encontramos productos con ese filtro. Prueba con otra categoría.</p>';
}
$("#chips").onclick = e => { if (e.target.dataset.c) { cat = e.target.dataset.c; pintarChips(); pintarCat(); } };
$("#psearch").oninput = pintarCat;
/* ---- Carrito ---- */
const carro = () => load("sicof_carrito", {});
function pintarCarro() {
  const c = carro(), P = getP(); let total = 0, n = 0;
  const html = Object.entries(c).map(([id, q]) => { const p = P.find(x => x.id == id); if (!p) return ""; total += p.precio * q; n += q;
    return `<div class="line"><span>${esc(p.nombre)}<br><small>${cop(p.precio)}</small></span><span class="qty"><button data-m="${id}" aria-label="Quitar uno">−</button> ${q} <button data-p="${id}" aria-label="Agregar uno">+</button></span></div>`; }).join("");
  $("#clines").innerHTML = html || '<p class="empty">Tu carrito está vacío. Agrega productos del catálogo.</p>';
  $("#ctotal").textContent = cop(total); $("#cn").textContent = n;
}
const setQ = (id, d) => { const c = carro(), p = getP().find(x => x.id == id); const q = Math.max(0, Math.min(p.stock, (c[id] || 0) + d)); q ? c[id] = q : delete c[id]; save("sicof_carrito", c); pintarCarro(); };
$("#cards").onclick = e => { if (e.target.dataset.add) { setQ(e.target.dataset.add, 1); $("#cart").showModal(); } };
$("#clines").onclick = e => { if (e.target.dataset.p) setQ(e.target.dataset.p, 1); if (e.target.dataset.m) setQ(e.target.dataset.m, -1); };
$("#cartopen").onclick = () => { say($("#cmsg"), ""); pintarCarro(); $("#cart").showModal(); };
$("#cclose").onclick = () => $("#cart").close();
$("#cbuy").onclick = () => {
  const s = S, c = carro(), P = getP(), msg = $("#cmsg");
  if (!Object.keys(c).length) return say(msg, "Agrega al menos un producto.");
  if (!s) { say(msg, "Inicia sesión o regístrate para confirmar tu pedido."); return; }
  const items = Object.entries(c).map(([id, q]) => { const p = P.find(x => x.id == id); return {nombre: p.nombre, precio: p.precio, cant: q}; });
  const total = items.reduce((a, i) => a + i.precio * i.cant, 0);
  save("sicof_productos", P.map(p => c[p.id] ? {...p, stock: p.stock - c[p.id]} : p));
  const ped = load("sicof_pedidos", []); ped.unshift({id: Date.now(), cliente: s.nombre, email: s.email, items, total, fecha: Date.now(), estado: "Pendiente"});
  save("sicof_pedidos", ped); save("sicof_carrito", {});
  pintarCarro(); pintarCat(); say(msg, "¡Pedido confirmado! Te avisaremos cuando esté listo para recoger.", true);
};
/* ---- Reseñas ---- */
let reseñas = load("sicof_resenas", []);
function pintarReseñas() {
  $("#rlist").innerHTML = reseñas.map(r => `<article class="rev"><div class="stars" aria-label="${r.estrellas} de 5">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</div><p>${esc(r.texto)}</p><small>${esc(r.nombre)} · ${new Date(r.fecha).toLocaleDateString("es-CO")}</small></article>`).join("");
  const prom = reseñas.reduce((a, r) => a + r.estrellas, 0) / (reseñas.length || 1);
  $("#ravg").textContent = reseñas.length ? `${prom.toFixed(1)} de 5 · ${reseñas.length} reseña${reseñas.length === 1 ? "" : "s"}` : "Aún no hay reseñas. Cuéntanos tu experiencia y sé el primero.";
}
$("#rform").onsubmit = e => { e.preventDefault();
  const nombre = $("#rname").value.trim(), texto = $("#rtext").value.trim();
  if (!nombre || texto.length < 10) return say($("#rmsg"), "Escribe tu nombre y una reseña de al menos 10 caracteres.");
  reseñas.unshift({nombre, texto, estrellas: Number($("#rstars").value), fecha: Date.now()});
  save("sicof_resenas", reseñas); $("#rform").reset(); pintarReseñas(); say($("#rmsg"), "Gracias, tu reseña ya está publicada.", true); };
pintarSesion(); pintarChips(); pintarCat(); pintarCarro(); pintarReseñas();
