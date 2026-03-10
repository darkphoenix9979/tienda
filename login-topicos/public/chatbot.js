console.log("CHATBOT CARGADO");

const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");

chatButton.addEventListener("click", () => {
    chatContainer.classList.toggle("active");
});

closeChat.addEventListener("click", () => {
    chatContainer.classList.remove("active");
});

function sendMessage(){

    const input = document.getElementById("userInput");
    const chatbox = document.getElementById("chatbox");

    let text = input.value.toLowerCase();

    if(text === "") return;

    chatbox.innerHTML += "<div><b>Tú:</b> "+text+"</div>";

    let response = "No entendí tu pregunta.";

    if(text.includes("crear cuenta")){
        response = "Para crear una cuenta ve a la página de registro.";
    }

    if(text.includes("iniciar sesion")){
        response = "Debes ingresar tu correo y contraseña.";
    }

    if(text.includes("comprar")){
        response = "Selecciona un producto y agrégalo al carrito.";
    }

    chatbox.innerHTML += "<div><b>Bot:</b> "+response+"</div>";

    chatbox.scrollTop = chatbox.scrollHeight;

    input.value = "";
}

document.getElementById("userInput").addEventListener("keypress",function(e){
    if(e.key === "Enter"){
        sendMessage();
    }
});