"use strict";

/* =========================================================
   1. FUNCIONES AUXILIARES
========================================================= */

// Selector de elementos del DOM
const $ = (s) => document.querySelector(s);

// Formatear valores en pesos colombianos (COP)
const cop = (n) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(n);

// Cargar datos desde localStorage
const load = (k, d) => {
    try {
        const v = JSON.parse(localStorage.getItem(k));
        return v === null ? d : v;
    } catch {
        return d;
    }
};

// Guardar datos en localStorage
const save = (k, v) =>
    localStorage.setItem(k, JSON.stringify(v));

// Escapar caracteres HTML para mostrar texto de forma segura
const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);

// Mostrar mensajes de éxito o error
const say = (el, text, ok) => {
    el.textContent = text;
    el.className = "msg " + (ok ? "ok" : "err");
};


/* =========================================================
   2. TEXTO INTERACTIVO: EFECTO DE ESCRITURA
========================================================= */

const frases = [
    "sin filas.",
    "desde tu celular.",
    "listo en minutos.",
    "a buen precio."
];

const typed = $("#typed");

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typed.textContent = frases[0];
    typed.style.borderRight = "0";
} else {
    let f = 0;
    let i = 0;
    let borrando = false;

    const tick = () => {
        const t = frases[f];

        i += borrando ? -1 : 1;
        typed.textContent = t.slice(0, i);

        let d = borrando ? 40 : 90;

        if (!borrando && i === t.length) {
            borrando = true;
            d = 1400;
        } else if (borrando && i === 0) {
            borrando = false;
            f = (f + 1) % frases.length;
            d = 400;
        }

        setTimeout(tick, d);
    };

    tick();
}


/* =========================================================
   3. MIGAS DE PAN DINÁMICAS
========================================================= */

const nombres = {
    "#catalogo": "Productos",
    "#resenas": "Reseñas",
    "#registro": "Registro"
};

function crumbs() {
    const n = nombres[location.hash];

    $("#crumbs").innerHTML =
        '<li><a href="index.html" style="color:#ffffff">Inicio</a></li>' +
        (n ? `<li aria-current="page">${n}</li>` : "");
}

addEventListener("hashchange", crumbs);
crumbs();


/* =========================================================
   4. CRUD DE PRODUCTOS
   Crear, leer, actualizar y eliminar productos
========================================================= */

// Cargar productos guardados o utilizar datos iniciales
let productos = load("sicof_productos", null) || [
    {
        id: 1,
        nombre: "Plátano hartón (kg)",
        cat: "Frutas y verduras",
        precio: 3200,
        stock: 80
    },
    {
        id: 2,
        nombre: "Leche entera 1 L",
        cat: "Lácteos",
        precio: 4300,
        stock: 120
    },
    {
        id: 3,
        nombre: "Arroz 500 g",
        cat: "Despensa",
        precio: 2900,
        stock: 200
    },
    {
        id: 4,
        nombre: "Café molido 250 g",
        cat: "Despensa",
        precio: 11500,
        stock: 60
    },
    {
        id: 5,
        nombre: "Detergente 1 kg",
        cat: "Aseo",
        precio: 15800,
        stock: 40
    }
];

// Guardar los productos iniciales o existentes
save("sicof_productos", productos);


// Renderizar y filtrar la tabla de productos
function pintar() {
    const q = $("#psearch").value.trim().toLowerCase();

    const lista = productos.filter((p) =>
        (p.nombre + " " + p.cat).toLowerCase().includes(q)
    );

    $("#ptable").innerHTML = lista.length
        ? lista.map((p) => `
            <tr>
                <td>${esc(p.nombre)}</td>
                <td>${esc(p.cat)}</td>
                <td class="num">${cop(p.precio)}</td>
                <td class="num">${p.stock}</td>
                <td class="acts">
                    <button class="btn small sec" data-edit="${p.id}">
                        Editar
                    </button>
                    <button class="btn danger" data-del="${p.id}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join("")
        : `
            <tr>
                <td colspan="5" class="empty">
                    No hay productos. Agrega el primero con el formulario.
                </td>
            </tr>
        `;

    $("#pcount").textContent =
        lista.length + " producto" + (lista.length === 1 ? "" : "s");
}


// Limpiar el formulario de productos
function limpiar() {
    $("#pform").reset();
    $("#pid").value = "";

    $("#psave").textContent = "Agregar producto";
    $("#pcancel").hidden = true;
}


// Agregar o actualizar un producto
$("#pform").addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = $("#pname").value.trim();
    const precio = Number($("#pprice").value);
    const stock = Number($("#pstock").value);

    // Validar nombre
    if (nombre.length < 2) {
        return say(
            $("#pmsg"),
            "Escribe un nombre de al menos 2 letras."
        );
    }

    // Validar precio
    if (!Number.isInteger(precio) || precio <= 0) {
        return say(
            $("#pmsg"),
            "El precio debe ser un número entero mayor a 0."
        );
    }

    // Validar inventario
    if (!Number.isInteger(stock) || stock < 0) {
        return say(
            $("#pmsg"),
            "El stock debe ser un número entero, 0 o más."
        );
    }

    const id = Number($("#pid").value);
    const cat = $("#pcat").value;

    if (id) {
        // Actualizar producto existente
        productos = productos.map((p) =>
            p.id === id
                ? { ...p, nombre, cat, precio, stock }
                : p
        );

        say($("#pmsg"), "Producto actualizado.", true);
    } else {
        // Crear un producto nuevo
        productos.push({
            id: Date.now(),
            nombre,
            cat,
            precio,
            stock
        });

        say($("#pmsg"), "Producto agregado.", true);
    }

    save("sicof_productos", productos);

    limpiar();
    pintar();
});


// Gestionar los botones de editar y eliminar
$("#ptable").addEventListener("click", (e) => {
    const ed = e.target.dataset.edit;
    const del = e.target.dataset.del;

    // Editar producto
    if (ed) {
        const p = productos.find((x) => x.id === Number(ed));

        if (!p) return;

        $("#pid").value = p.id;
        $("#pname").value = p.nombre;
        $("#pcat").value = p.cat;
        $("#pprice").value = p.precio;
        $("#pstock").value = p.stock;

        $("#psave").textContent = "Guardar cambios";
        $("#pcancel").hidden = false;

        $("#pname").focus();
    }

    // Eliminar producto
    if (del) {
        const p = productos.find((x) => x.id === Number(del));

        if (p && confirm(`¿Eliminar "${p.nombre}"?`)) {
            productos = productos.filter((x) => x.id !== p.id);

            save("sicof_productos", productos);

            if ($("#pid").value == p.id) {
                limpiar();
            }

            say($("#pmsg"), "Producto eliminado.", true);
            pintar();
        }
    }
});


// Cancelar la edición de un producto
$("#pcancel").addEventListener("click", () => {
    limpiar();
    say($("#pmsg"), "");
});

// Buscar productos mientras se escribe
$("#psearch").addEventListener("input", pintar);

// Mostrar productos al cargar la página
pintar();


/* =========================================================
   5. RESEÑAS DE CLIENTES
========================================================= */

// Cargar reseñas guardadas
let reseñas = load("sicof_resenas", []);


// Mostrar las reseñas y calcular el promedio
function pintarReseñas() {
    $("#rlist").innerHTML = reseñas.map((r) => `
        <article class="rev">
            <div class="stars" aria-label="${r.estrellas} de 5">
                ${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}
            </div>

            <p>${esc(r.texto)}</p>

            <small>
                ${esc(r.nombre)} ·
                ${new Date(r.fecha).toLocaleDateString("es-CO")}
            </small>
        </article>
    `).join("");

    const prom =
        reseñas.reduce((a, r) => a + r.estrellas, 0) /
        (reseñas.length || 1);

    $("#ravg").textContent = reseñas.length
        ? `${prom.toFixed(1)} de 5 · ${reseñas.length} reseña${reseñas.length === 1 ? "" : "s"}`
        : "Aún no hay reseñas. Cuéntanos tu experiencia y sé el primero.";
}


// Registrar una nueva reseña
$("#rform").addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = $("#rname").value.trim();
    const texto = $("#rtext").value.trim();

    if (!nombre || texto.length < 10) {
        return say(
            $("#rmsg"),
            "Escribe tu nombre y una reseña de al menos 10 caracteres."
        );
    }

    reseñas.unshift({
        nombre,
        texto,
        estrellas: Number($("#rstars").value),
        fecha: Date.now()
    });

    save("sicof_resenas", reseñas);

    $("#rform").reset();

    pintarReseñas();

    say(
        $("#rmsg"),
        "Gracias, tu reseña ya está publicada.",
        true
    );
});

// Mostrar reseñas al cargar la página
pintarReseñas();


/* =========================================================
   6. REGISTRO DE USUARIOS
========================================================= */

// Generar hash SHA-256 de una contraseña
async function hash(t) {
    if (!crypto.subtle) {
        return btoa(unescape(encodeURIComponent(t)));
    }

    const b = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(t)
    );

    return [...new Uint8Array(b)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
}


// Procesar el formulario de registro
$("#regform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = $("#uname").value.trim();

    const email = $("#uemail")
        .value
        .trim()
        .toLowerCase();

    const p1 = $("#upass").value;
    const p2 = $("#upass2").value;

    // Validar nombre
    if (nombre.length < 3) {
        return say(
            $("#umsg"),
            "Escribe tu nombre completo."
        );
    }

    // Validar correo electrónico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return say(
            $("#umsg"),
            "Escribe un correo válido, por ejemplo nombre@correo.com."
        );
    }

    // Validar longitud de la contraseña
    if (p1.length < 8) {
        return say(
            $("#umsg"),
            "La contraseña debe tener mínimo 8 caracteres."
        );
    }

    // Confirmar que las contraseñas coincidan
    if (p1 !== p2) {
        return say(
            $("#umsg"),
            "Las contraseñas no coinciden."
        );
    }

    // Consultar usuarios registrados
    const usuarios = load("sicof_usuarios", []);

    // Evitar registros con correos duplicados
    if (usuarios.some((u) => u.email === email)) {
        return say(
            $("#umsg"),
            "Ese correo ya está registrado."
        );
    }

    // Guardar el nuevo usuario
    usuarios.push({
        nombre,
        email,
        clave: await hash(p1),
        creado: Date.now()
    });

    save("sicof_usuarios", usuarios);

    // Redirigir a la página de confirmación
    location.href =
        "gracias.html?n=" +
        encodeURIComponent(nombre.split(" ")[0]);
});
