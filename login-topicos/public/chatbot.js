console.log("CHATBOT FUNCIONANDO");

const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");

chatButton.onclick = () => {
    chatContainer.classList.toggle("active");
};

closeChat.onclick = () => {
    chatContainer.classList.remove("active");
};

function sendMessage(){

    const input = document.getElementById("userInput");
    const chatbox = document.getElementById("chatbox");

    let text = input.value;

    if(text === "") return;

    chatbox.innerHTML += "<p><b>Tú:</b> "+text+"</p>";

    let response = "No entendí la pregunta.";

    if(text.toLowerCase().includes("crear cuenta")){
        response = "Para crear una cuenta debes ir al registro.";
    }

    if(text.toLowerCase().includes("comprar")){
        response = "Solo agrega productos al carrito y presiona comprar.";
    }

    chatbox.innerHTML += "<p><b>Bot:</b> "+response+"</p>";

    input.value="";
}