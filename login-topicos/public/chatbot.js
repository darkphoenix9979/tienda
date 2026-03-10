let knowledge = [];
let fuse;

/* Cargar base de conocimiento */

fetch("knowledge.json")
.then(res => res.json())
.then(data => {

knowledge = data;

fuse = new Fuse(knowledge,{
keys:["question"],
threshold:0.4
});

});

/* Botón flotante */

const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");

chatButton.onclick = () =>{
chatContainer.classList.toggle("active");
}

closeChat.onclick = () =>{
chatContainer.classList.remove("active");
}

/* Enviar mensaje */

function sendMessage(){

let input = document.getElementById("userInput").value.toLowerCase();

if(input === "") return;

addMessage(input,"user");

let response = findResponse(input);

setTimeout(()=>{
addMessage(response,"bot");
},400);

document.getElementById("userInput").value="";

}

/* Mostrar mensaje */

function addMessage(text,type){

let chatbox = document.getElementById("chatbox");

let msg = document.createElement("div");

msg.className = type;

msg.innerText = text;

chatbox.appendChild(msg);

chatbox.scrollTop = chatbox.scrollHeight;

}

/* Buscar respuesta */

function findResponse(input){

let result = fuse.search(input);

if(result.length > 0){

return result[0].item.answer;

}

saveUnknownQuestion(input);

return "No tengo una respuesta para eso todavía, pero guardaré tu pregunta para mejorar el sistema.";

}

/* Guardar preguntas desconocidas */

function saveUnknownQuestion(question){

fetch("/save_question",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({question:question})

});

}