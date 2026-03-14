console.log("CHATBOT FUNCIONANDO");

let knowledge = [];
let fuse;

/* cargar conocimiento */

fetch("knowledge.json")
.then(res => res.json())
.then(data => {

knowledge = data;

fuse = new Fuse(knowledge,{
    keys:["question"],
    threshold:0.4
});

console.log("Knowledge cargado:", knowledge);

})
.catch(err=>{
console.error("Error cargando knowledge:",err);
});


document.addEventListener("DOMContentLoaded", () => {

const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");
const userInput = document.getElementById("userInput");
const sendBtn = document.querySelector(".chat-input button");
const chatbox = document.getElementById("chatbox");


/* abrir chat */

chatButton.addEventListener("click", () => {
    chatContainer.classList.toggle("active");
});


/* cerrar chat */

closeChat.addEventListener("click", () => {
    chatContainer.classList.remove("active");
});


/* respuestas conversacionales */

const smallTalk = {

"hola":"¡Hola! ¿En qué puedo ayudarte?",
"buenas":"Hola 👋 ¿Qué necesitas?",
"como estas":"Estoy bien 😊 gracias por preguntar.",
"quien eres":"Soy el asistente virtual de la tienda.",
"gracias":"¡Con gusto! Si necesitas algo más dime.",
"adios":"Hasta luego 👋"

};


/* enviar mensaje */

function sendMessage(){

let text = userInput.value.trim().toLowerCase();

if(text === "") return;

chatbox.innerHTML += `<div><b>Tú:</b> ${text}</div>`;

let response = "No entendí tu pregunta 🤔";

/* 1️⃣ conversación básica */

for(let key in smallTalk){

if(text.includes(key)){
response = smallTalk[key];
break;
}

}


/* 2️⃣ buscar en knowledge.json */

if(response === "No entendí tu pregunta 🤔" && fuse){

let result = fuse.search(text);

if(result.length > 0){

response = result[0].item.answer;

}

}


/* 3️⃣ coincidencia por palabra clave */

if(response === "No entendí tu pregunta 🤔"){

for(let item of knowledge){

if(text.includes(item.question)){
response = item.answer;
break;
}

}

}


/* mostrar respuesta */

chatbox.innerHTML += `<div><b>Bot:</b> ${response}</div>`;

chatbox.scrollTop = chatbox.scrollHeight;

userInput.value = "";

}


/* botón enviar */

sendBtn.addEventListener("click", sendMessage);


/* ENTER */

userInput.addEventListener("keypress", (e)=>{

if(e.key === "Enter"){
sendMessage();
}

});

});