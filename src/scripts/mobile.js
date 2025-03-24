// Funciones para mobile.html

const socket = io();
console.log("Holaaa");

function escanearArticulo() {
    alert("Escaneando artículo...");
    socket.emit("escanear", { articulo: "Artículo escaneado" });
}

function verListaCompra() {
    window.location.href = "listacompra.html";  // Redirigir a la lista de la compra
}

function abrirAjustes() {
    alert("Abriendo ajustes...");
}

function activarMicrofono() {
    alert("Micrófono activado...");
    // Aquí podrías integrar un servicio de reconocimiento de voz
}

// Funciones para listacompra.html
// Función para cargar la lista desde localStorage
function cargarLista() {
    const lista = document.getElementById("listaArticulos");
    const articulosGuardados = JSON.parse(localStorage.getItem("listaCompra")) || [];

    articulosGuardados.forEach(articulo => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${articulo}</span>
            <button onclick="borrarArticulo(this)">Borrar</button>
        `;
        lista.appendChild(li);
    });
}

// Función para guardar la lista en localStorage
function guardarLista() {
    const lista = document.getElementById("listaArticulos");
    const articulos = Array.from(lista.getElementsByTagName("li")).map(li => li.querySelector("span").textContent);
    localStorage.setItem("listaCompra", JSON.stringify(articulos));
}

// Función para añadir un artículo a la lista
function agregarArticulo() {
    const input = document.getElementById("nuevoArticulo");
    const articulo = input.value.trim();

    if (articulo !== "") {
        // Añadir el artículo a la lista
        const lista = document.getElementById("listaArticulos");
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${articulo}</span>
            <button onclick="borrarArticulo(this)">Borrar</button>
        `;
        lista.appendChild(li);

        // Ordenar la lista alfabéticamente
        ordenarLista();

        // Guardar la lista en localStorage
        guardarLista();

        // Limpiar el campo de entrada
        input.value = "";
    } else {
        alert("Por favor, escribe un artículo.");
    }
}

// Función para borrar un artículo de la lista
function borrarArticulo(boton) {
    const li = boton.parentElement;
    li.remove();

    // Guardar la lista en localStorage después de borrar
    guardarLista();
}

// Función para ordenar la lista alfabéticamente
function ordenarLista() {
    const lista = document.getElementById("listaArticulos");
    const items = Array.from(lista.getElementsByTagName("li"));

    items.sort((a, b) => {
        const textoA = a.querySelector("span").textContent.toLowerCase();
        const textoB = b.querySelector("span").textContent.toLowerCase();
        return textoA.localeCompare(textoB);
    });

    // Limpiar la lista y volver a añadir los elementos ordenados
    lista.innerHTML = "";
    items.forEach(item => lista.appendChild(item));

    // Guardar la lista en localStorage después de ordenar
    guardarLista();
}

// Función para volver al menú principal
function volverAlMenu() {
    window.location.href = "/";  // Redirigir a la pantalla principal
}

// Función para activar el micrófono (simulada)
function activarMicrofono() {
    alert("Micrófono activado...");
    // Aquí podrías integrar un servicio de reconocimiento de voz
}

// Cargar la lista al iniciar la página
document.addEventListener("DOMContentLoaded", cargarLista);