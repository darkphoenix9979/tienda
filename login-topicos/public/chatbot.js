console.log("CHATBOT FUNCIONANDO");

document.addEventListener("DOMContentLoaded", function(){

const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");
const userInput = document.getElementById("userInput");
const chatbox = document.getElementById("chatbox");

/* abrir chat */

chatButton.addEventListener("click", () => {
    chatContainer.classList.toggle("active");
});

/* cerrar chat */

closeChat.addEventListener("click", () => {
    chatContainer.classList.remove("active");
});

/* enviar mensaje */

window.sendMessage = function(){

let text = userInput.value.trim().toLowerCase();

if(text === "") return;

chatbox.innerHTML += `<div><b>Tú:</b> ${text}</div>`;

let response = "No entendí la pregunta.";

if(text.includes("crear cuenta")){
response = "Para crear una cuenta ve a la página de registro.";
}

if(text.includes("iniciar sesion")){
response = "Ingresa tu correo y contraseña en la página de login.";
}

if(text.includes("comprar")){
response = "Selecciona un producto y agrégalo al carrito.";
}

chatbox.innerHTML += `<div><b>Bot:</b> ${response}</div>`;

chatbox.scrollTop = chatbox.scrollHeight;

userInput.value = "";

}

/* enviar con ENTER */

userInput.addEventListener("keypress",function(e){
if(e.key === "Enter"){
sendMessage();
}
});

});