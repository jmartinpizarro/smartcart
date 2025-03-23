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

        // Limpiar el campo de entrada
        input.value = "";
    } else {
        alert("Por favor, escribe un artículo.");
    }
}

function borrarArticulo(boton) {
    const li = boton.parentElement;
    li.remove();
}

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
}

function volverAlMenu() {
    window.location.href = "../pages/mobile.html";  // Redirigir al menú principal
}