let knowledge = [];
let fuse;

/* cargar conocimiento */

fetch("/knowledge.json")
.then(res => res.json())
.then(data => {

knowledge = data;

fuse = new Fuse(knowledge,{
keys:["question"],
threshold:0.4
});

})
.catch(err=>{
console.error("Error cargando knowledge:",err);
});

/* botones */

const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");

chatButton.onclick = () =>{
chatContainer.classList.toggle("active");
}

closeChat.onclick = () =>{
chatContainer.classList.remove("active");
}

/* enviar mensaje */

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

/* mostrar mensajes */

function addMessage(text,type){

let chatbox = document.getElementById("chatbox");

let msg = document.createElement("div");

msg.className = type;

msg.innerText = text;

chatbox.appendChild(msg);

chatbox.scrollTop = chatbox.scrollHeight;

}

/* buscar respuesta */

function findResponse(input){

if(!fuse){
return "El asistente aún está cargando...";
}

let result = fuse.search(input);

if(result.length > 0){
return result[0].item.answer;
}

return "No tengo respuesta para eso todavía.";

}