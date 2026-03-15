console.log("CHATBOT FUNCIONANDO");

let knowledge = [];
let fuse;

/* normalizar texto */

function normalize(text){
return text
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"");
}

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


/* conversación básica */

const smallTalk = {

hola:[
"Hola 👋 ¿En qué puedo ayudarte?",
"¡Hola! ¿Qué necesitas?",
"Bienvenido ¿cómo puedo ayudarte?"
],

"como estas":[
"Estoy funcionando perfectamente 😄",
"Todo bien por aquí ¿y tú?",
"Listo para ayudarte 👍"
],

gracias:[
"¡Con gusto!",
"Para eso estoy 😄",
"Cuando necesites ayuda aquí estaré."
],

adios:[
"Hasta luego 👋",
"Que tengas un buen día",
"Nos vemos pronto"
]

};


/* sinónimos */

const synonyms = {

"login":"iniciar sesion",
"entrar":"iniciar sesion",
"acceso":"iniciar sesion",
"sesion":"iniciar sesion",

"pagar":"metodos de pago",
"pago":"metodos de pago",

"envio":"envios",
"entrega":"envios",

"comprar":"comprar producto",
"producto":"comprar producto"

};


/* animación escribiendo */

function typingAnimation(callback){

chatbox.innerHTML += `<div id="typing"><b>Bot:</b> escribiendo...</div>`;

chatbox.scrollTop = chatbox.scrollHeight;

setTimeout(()=>{

document.getElementById("typing").remove();
callback();

},800);

}


/* guardar preguntas desconocidas */

function saveUnknown(question){

fetch("/api/chatbot/unknown",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({question})
})
.then(res=>res.json())
.then(data=>{
console.log("Pregunta guardada:",data);
})
.catch(err=>{
console.error("Error guardando pregunta:",err);
});

}


/* enviar mensaje */

function sendMessage(){

let text = userInput.value.trim();

if(text==="") return;

let normalized = normalize(text);

chatbox.innerHTML += `<div><b>Tú:</b> ${text}</div>`;

chatbox.scrollTop = chatbox.scrollHeight;

userInput.value = "";

let response = null;


/* 1 conversación básica */

for(let key in smallTalk){

if(normalized.includes(key)){

let answers = smallTalk[key];

response = answers[Math.floor(Math.random()*answers.length)];

}

}


/* 2 sinónimos */

if(!response){

for(let word in synonyms){

if(normalized.includes(word)){

normalized = synonyms[word];

}

}

}


/* 3 búsqueda inteligente */

if(!response && fuse){

let result = fuse.search(normalized);

if(result.length>0){

response = result[0].item.answer;

}

}


/* 4 búsqueda por palabra */

if(!response){

for(let item of knowledge){

if(normalized.includes(item.question)){

response = item.answer;

}

}

}


/* 5 si no entiende */

if(!response){

response = `No entendí tu pregunta 🤔

Puedes preguntarme sobre:
• crear cuenta
• iniciar sesión
• comprar productos
• envíos
• métodos de pago`;

saveUnknown(text);

}


/* mostrar respuesta */

typingAnimation(()=>{

chatbox.innerHTML += `<div><b>Bot:</b> ${response}</div>`;

chatbox.scrollTop = chatbox.scrollHeight;

});

}


/* botón */

sendBtn.addEventListener("click",sendMessage);


/* ENTER */

userInput.addEventListener("keypress",(e)=>{

if(e.key==="Enter") sendMessage();

});

});