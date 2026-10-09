const S = exigir("admin"); if (!S) throw new Error("Redirigiendo al acceso");
$("#aquien").textContent = S.nombre;
$("#aout").onclick = salir;
document.querySelector(".side").onclick = e => { const t = e.target.dataset.t; if (!t) return;
  document.querySelectorAll(".side button[data-t]").forEach(b => b.setAttribute("aria-current", b.dataset.t === t));
  document.querySelectorAll("[data-s]").forEach(s => s.hidden = s.dataset.s !== t); todo(); };
$("#pcat").innerHTML = CATS.map(c => `<option>${c}</option>`).join("");
const fecha = t => new Date(t).toLocaleDateString("es-CO");
function resumen() {
  const P = getP(), O = load("sicof_pedidos", []), U = load("sicof_usuarios", []), bajo = P.filter(p => p.stock < 30);
  $("#stats").innerHTML = [["Productos", P.length], ["Pedidos", O.length], ["Ventas", cop(O.reduce((a, o) => a + o.total, 0))], ["Clientes", U.length]]
    .map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("") + `<div class="stat warn"><b>${bajo.length}</b><span>Con stock bajo</span></div>`;
  $("#low").innerHTML = bajo.length ? bajo.map(p => `<tr><td>${esc(p.nombre)}</td><td><span class="tag low">${p.stock}</span></td></tr>`).join("") : '<tr><td colspan="2" class="empty">Todo el inventario está por encima de 30 unidades.</td></tr>';
}
let productos = getP();
function pintar() {
  productos = getP(); const q = $("#psearch").value.trim().toLowerCase();
  const l = productos.filter(p => (p.nombre + " " + p.cat).toLowerCase().includes(q));
  $("#ptable").innerHTML = l.length ? l.map(p => `<tr><td>${esc(p.nombre)}</td><td>${esc(p.cat)}</td><td class="num">${cop(p.precio)}</td><td class="num"><span class="${p.stock < 30 ? "tag low" : "tag"}">${p.stock}</span></td>
    <td class="acts"><button class="btn small" data-edit="${p.id}">Editar</button> <button class="btn danger" data-del="${p.id}">Eliminar</button></td></tr>`).join("")
    : '<tr><td colspan="5" class="empty">No hay productos. Agrega el primero con el formulario.</td></tr>';
  $("#pcount").textContent = l.length + " producto" + (l.length === 1 ? "" : "s");
}
function limpiar() { $("#pform").reset(); $("#pid").value = ""; $("#psave").textContent = "Agregar producto"; $("#pcancel").hidden = true; }
$("#pform").onsubmit = e => { e.preventDefault();
  const nombre = $("#pname").value.trim(), precio = Number($("#pprice").value), stock = Number($("#pstock").value), m = $("#pmsg");
  if (nombre.length < 2) return say(m, "Escribe un nombre de al menos 2 letras.");
  if (!Number.isInteger(precio) || precio <= 0) return say(m, "El precio debe ser un número entero mayor a 0.");
  if (!Number.isInteger(stock) || stock < 0) return say(m, "El stock debe ser un número entero, 0 o más.");
  const id = Number($("#pid").value), cat = $("#pcat").value;
  if (id) { productos = productos.map(p => p.id === id ? {...p, nombre, cat, precio, stock} : p); say(m, "Producto actualizado.", true); }
  else { productos.push({id: Date.now(), nombre, cat, precio, stock}); say(m, "Producto agregado.", true); }
  save("sicof_productos", productos); limpiar(); pintar(); };
$("#ptable").onclick = e => { const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) { const p = productos.find(x => x.id == ed); if (!p) return;
    $("#pid").value = p.id; $("#pname").value = p.nombre; $("#pcat").value = p.cat; $("#pprice").value = p.precio; $("#pstock").value = p.stock;
    $("#psave").textContent = "Guardar cambios"; $("#pcancel").hidden = false; $("#pname").focus(); }
  if (del) { const p = productos.find(x => x.id == del);
    if (p && confirm(`¿Eliminar "${p.nombre}"?`)) { productos = productos.filter(x => x.id !== p.id); save("sicof_productos", productos);
      if ($("#pid").value == p.id) limpiar(); say($("#pmsg"), "Producto eliminado.", true); pintar(); } } };
$("#pcancel").onclick = () => { limpiar(); say($("#pmsg"), ""); };
$("#psearch").oninput = pintar;
const ESTADOS = ["Pendiente", "Listo para recoger", "Entregado", "Cancelado"];
function pedidos() {
  const O = load("sicof_pedidos", []);
  $("#otable").innerHTML = O.length ? O.map(o => `<tr><td>${fecha(o.fecha)}</td><td>${esc(o.cliente)}<br><small>${esc(o.email)}</small></td>
    <td>${o.items.map(i => `${i.cant} × ${esc(i.nombre)}`).join("<br>")}</td><td class="num">${cop(o.total)}</td>
    <td><select data-o="${o.id}" aria-label="Estado del pedido">${ESTADOS.map(s => `<option${s === o.estado ? " selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("")
    : '<tr><td colspan="5" class="empty">Aún no hay pedidos. Aparecerán cuando un cliente confirme su compra.</td></tr>';
}
$("#otable").onchange = e => { if (!e.target.dataset.o) return; save("sicof_pedidos", load("sicof_pedidos", []).map(o => o.id == e.target.dataset.o ? {...o, estado: e.target.value} : o)); };
function usuarios() {
  const U = load("sicof_usuarios", []);
  $("#utable").innerHTML = U.length ? U.map(u => `<tr><td>${esc(u.nombre)}</td><td>${esc(u.email)}</td><td><span class="tag">${u.rol === "admin" ? "Administrador" : "Cliente"}</span></td><td>${fecha(u.creado)}</td><td>${u.email === S.email ? "Tu cuenta" : `<button class="btn danger" data-u="${esc(u.email)}">Eliminar</button>`}</td></tr>`).join("")
    : '<tr><td colspan="5" class="empty">Aún no hay clientes registrados.</td></tr>';
}
$("#utable").onclick = e => { const m = e.target.dataset.u;
  if (m && confirm(`¿Eliminar la cuenta ${m}?`)) { save("sicof_usuarios", load("sicof_usuarios", []).filter(u => u.email !== m)); usuarios(); } };
function todo() { resumen(); pintar(); pedidos(); usuarios(); }
todo();
