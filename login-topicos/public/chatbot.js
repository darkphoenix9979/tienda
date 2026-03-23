console.log("CHATBOT FUNCIONANDO");

let knowledge = [];
let fuse;

/* normalizar texto */
function normalize(text){
    return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim(); // Agregué trim para limpiar espacios extra
}

/* cargar conocimiento */
fetch("knowledge.json")
.then(res => res.json())
.then(data => {
    knowledge = data;

    // AJUSTE 1: Bajé el threshold a 0.3 para que sea más flexible con frases largas
    fuse = new Fuse(knowledge, {
        keys: ["question"],
        threshold: 0.3, 
        ignoreLocation: true, // Ignora dónde está la palabra en la frase
        distance: 100
    });

    console.log("Knowledge cargado:", knowledge);
})
.catch(err => {
    console.error("Error cargando knowledge:", err);
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
        hola: ["Hola 👋 ¿En qué puedo ayudarte?", "¡Hola! ¿Qué necesitas?", "Bienvenido ¿cómo puedo ayudarte?"],
        "como estas": ["Estoy funcionando perfectamente 😄", "Todo bien por aquí ¿y tú?", "Listo para ayudarte 👍"],
        gracias: ["¡Con gusto!", "Para eso estoy 😄", "Cuando necesites ayuda aquí estaré."],
        adios: ["Hasta luego 👋", "Que tengas un buen día", "Nos vemos pronto"]
    };

    /* 
       AJUSTE 2: Mapa de Intenciones 
       En lugar de solo sinónimos de palabras, mapeamos grupos de palabras 
       que significan lo mismo para buscar en el JSON.
    */
    const intentGroups = {
        "iniciar_sesion": ["iniciar sesion", "login", "entrar", "acceso", "loguear", "ingresar", "cuenta"],
        "metodos_pago": ["pagar", "pago", "tarjeta", "dinero", "paypal", "transferencia"],
        "envios": ["envio", "entrega", "paquete", "llegada", "tiempo envio", "guia"],
        "comprar": ["comprar", "producto", "adquirir", "precio", "costo"]
    };

    /* Nuevos grupos de intención para contacto y ubicación */
    const locationContactKeywords = {
    "contacto": [
        "contacto", "contactar", "whatsapp", "teléfono", "telefono", 
        "llamar", "mensaje", "correo", "email", "atención", "soporte",
        "hablar con ustedes", "comunicarme", "los contacto"
    ],
    "ubicacion": [
        "donde se encuentran", "donde estan", "ubicación", "ubicacion",
        "dirección", "direccion", "oficinas", "tienda", "sucursal",
        "visitarlos", "ir a verlos", "ciudad de méxico", "cdmx",
        "eje central", "centro", "méxico", "address", "location"
    ]
    };

    /* animación escribiendo */
    function typingAnimation(callback){
        chatbox.innerHTML += `<div id="typing"><b>Bot:</b> escribiendo...</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
        setTimeout(() => {
            const typingDiv = document.getElementById("typing");
            if(typingDiv) typingDiv.remove();
            callback();
        }, 800);
    }

    /* guardar preguntas desconocidas */
    function saveUnknown(question){
        // Nota: Asegúrate de tener este endpoint en tu backend, si no, comentalo para evitar errores
        fetch("/api/chatbot/unknown", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        })
        .then(res => res.json())
        .then(data => console.log("Pregunta guardada:", data))
        .catch(err => console.error("Error guardando pregunta (Backend no disponible?):", err));
    }

    /* enviar mensaje */
    function sendMessage(){
        let text = userInput.value.trim();
        if(text === "") return;

        let normalized = normalize(text);

        // Mostrar mensaje usuario
        chatbox.innerHTML += `<div><b>Tú:</b> ${text}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
        userInput.value = "";

        let response = null;

        /* 1. Conversación básica (Saludos) */
        for(let key in smallTalk){
            if(normalized.includes(key)){
                let answers = smallTalk[key];
                response = answers[Math.floor(Math.random() * answers.length)];
                break; 
            }
        }

        /* 2. Detección de Intención por Palabras Clave (Mejora Principal) */
        if(!response){
            // Buscamos si el texto del usuario contiene palabras de nuestros grupos
            for (const [intent, keywords] of Object.entries(intentGroups)) {
                // Verificamos si alguna palabra clave del grupo está en el mensaje del usuario
                const foundKeyword = keywords.find(keyword => normalized.includes(keyword));
                
                if (foundKeyword) {
                    // Si encontramos una palabra clave (ej: "login"), buscamos en el conocimiento
                    // algo relacionado con esa intención específica.
                    
                    // Opción A: Buscar directamente en Fuse usando la palabra clave encontrada
                    let result = fuse.search(foundKeyword);
                    
                    if(result.length > 0){
                        response = result[0].item.answer;
                        break;
                    }

                    // Opción B: Si Fuse falla, buscamos manualmente en el JSON si la pregunta contiene la intención
                    // Esto es útil si en tu JSON la pregunta es "¿Cómo inicio sesión?" y el usuario dijo "login"
                    const manualMatch = knowledge.find(k => 
                        normalize(k.question).includes(intent) || 
                        keywords.some(k => normalize(k.question).includes(k))
                    );

                    if(manualMatch){
                        response = manualMatch.answer;
                        break;
                    }
                }
            }
        }

        /* 2.5. Detección específica para Contacto y Ubicación */
        if(!response){

            // ¿El usuario pregunta por contacto?
            const contactoMatch = locationContactKeywords.contacto.some(kw => normalized.includes(kw));
            if(contactoMatch){
             // Buscamos en knowledge la entrada relacionada con contacto
            const contactoEntry = knowledge.find(k => 
            normalize(k.question).includes("contacto") || 
            normalize(k.answer).includes("whatsapp") ||
            normalize(k.answer).includes("+52")
         );
         if(contactoEntry){
            response = contactoEntry.answer;
         }
        }
    
          // ¿El usuario pregunta por ubicación?
          const ubicacionMatch = locationContactKeywords.ubicacion.some(kw => normalized.includes(kw));
          if(ubicacionMatch && !response){
         // Buscamos en knowledge la entrada relacionada con ubicación
         const ubicacionEntry = knowledge.find(k => 
             normalize(k.question).includes("donde") || 
                normalize(k.question).includes("encuentran") ||
                normalize(k.answer).includes("eje central") ||
                normalize(k.answer).includes("ciudad de méxico") ||
                normalize(k.answer).includes("cdmx")
            );
            if(ubicacionEntry){
            response = ubicacionEntry.answer;
            }
        }
    }

        /* 3. Búsqueda Inteligente General (Fuse) */
        if(!response && fuse){
            let result = fuse.search(normalized);
            if(result.length > 0){
                // Verificamos que la puntuación no sea terrible (opcional, threshold ya lo hace)
                response = result[0].item.answer;
            }
        }

        /* 4. Búsqueda inversa (Si el JSON tiene preguntas cortas) */
        if(!response){
            for(let item of knowledge){
                // Si la pregunta del usuario es larga y contiene la pregunta del JSON
                if(normalized.includes(normalize(item.question))){
                    response = item.answer;
                    break;
                }
                // O si la pregunta del JSON contiene palabras clave fuertes del usuario
                if(normalize(item.question).includes(normalized) && normalized.length > 3){
                     response = item.answer;
                     break;
                }
            }
        }

        /* 5. Si no entiende */
        if(!response){
            response = `No entendí tu pregunta 🤔

Puedes preguntarme sobre:
• crear cuenta
• iniciar sesión
• comprar productos
• envíos
• métodos de pago
• devoluciones
• contacto
• soporte técnico`;
            
            // Solo guardamos si no es un saludo vacío
            if(normalized.length > 3) saveUnknown(text);
        }

        /* mostrar respuesta */
        typingAnimation(() => {
            chatbox.innerHTML += `<div><b>Bot:</b> ${response}</div>`;
            chatbox.scrollTop = chatbox.scrollHeight;
        });
    }

    /* botón */
    sendBtn.addEventListener("click", sendMessage);

    /* ENTER */
    userInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") sendMessage();
    });
});