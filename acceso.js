/* Demo: el código de administrador está en el navegador. En producción se valida en un servidor. */
const CODIGO_ADMIN = "SICOF-ADMIN-2026";
const yaDentro = sesion(); if (yaDentro) location.replace(destino(yaDentro));
const okMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
const msg = $("#amsg");
function ver(v) {
  $("#floginf").hidden = v !== "login"; $("#fregf").hidden = v !== "reg";
  $("#tlogin").setAttribute("aria-pressed", v === "login"); $("#treg").setAttribute("aria-pressed", v === "reg"); say(msg, "");
}
$("#tlogin").onclick = () => ver("login"); $("#treg").onclick = () => ver("reg");
$("#rrol").onchange = () => { $("#rcw").hidden = $("#rrol").value !== "admin"; };
if (location.hash === "#registro") ver("reg");
$("#fregf").onsubmit = async e => { e.preventDefault();
  const nombre = $("#rn").value.trim(), email = $("#rm").value.trim().toLowerCase(), rol = $("#rrol").value, p1 = $("#rp1").value, p2 = $("#rp2").value;
  if (nombre.length < 3) return say(msg, "Escribe tu nombre completo.");
  if (!okMail(email)) return say(msg, "Escribe un correo válido, por ejemplo nombre@correo.com.");
  if (rol === "admin" && $("#rcode").value !== CODIGO_ADMIN) return say(msg, "El código de administrador no es correcto.");
  if (p1.length < 8) return say(msg, "La contraseña debe tener mínimo 8 caracteres.");
  if (p1 !== p2) return say(msg, "Las contraseñas no coinciden.");
  const us = load("sicof_usuarios", []);
  if (us.some(u => u.email === email)) return say(msg, "Ese correo ya está registrado. Inicia sesión.");
  us.push({nombre, email, rol, clave: await hash(p1), creado: Date.now()}); save("sicof_usuarios", us);
  location.href = "gracias.html?n=" + encodeURIComponent(nombre.split(" ")[0]); };
$("#floginf").onsubmit = async e => { e.preventDefault();
  const email = $("#lmail").value.trim().toLowerCase(), pass = $("#lpass").value;
  if (!okMail(email) || !pass) return say(msg, "Escribe tu correo y tu contraseña.");
  const u = load("sicof_usuarios", []).find(x => x.email === email);
  if (!u) return say(msg, "Esa cuenta no existe. Primero regístrate.");
  if (u.clave !== await hash(pass)) return say(msg, "La contraseña es incorrecta.");
  const s = {nombre: u.nombre, email, rol: u.rol || "cliente"}; save("sicof_sesion", s); location.href = destino(s); };
