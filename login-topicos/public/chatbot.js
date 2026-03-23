console.log("🤖 CHATBOT BOUNTY FUNCIONANDO");

let knowledge = [];
let fuse;
let welcomeSent = false;
let resetBtn = null;

/* ==========================================
   🧹 NORMALIZAR TEXTO
   ========================================== */
function normalize(text){
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/* ==========================================
   📚 CARGAR CONOCIMIENTO
   ========================================== */
fetch("knowledge.json")
    .then(res => res.json())
    .then(data => {
        knowledge = data;

        fuse = new Fuse(knowledge, {
            keys: ["question"],
            threshold: 0.3,
            ignoreLocation: true,
            distance: 100
        });

        console.log("✅ Knowledge cargado:", knowledge.length, "entradas");
    })
    .catch(err => {
        console.error("❌ Error cargando knowledge:", err);
    });

/* ==========================================
   🎬 INICIALIZAR CHAT AL CARGAR DOM
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {

    /* --- ELEMENTOS DEL DOM --- */
    const chatButton = document.getElementById("chatButton");
    const chatContainer = document.getElementById("chatContainer");
    const closeChat = document.getElementById("closeChat");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.querySelector(".chat-input button");
    const chatbox = document.getElementById("chatbox");

    if (!chatButton || !chatContainer || !chatbox) {
        console.warn("⚠️ Elementos del chat no encontrados. Verifica tu HTML.");
        return;
    }

    /* ==========================================
       🔘 CREAR BOTÓN DE REINICIAR (DINÁMICO)
       ========================================== */
    function createResetButton() {
        if (resetBtn) return resetBtn;
        
        resetBtn = document.createElement("button");
        resetBtn.id = "resetChat";
        resetBtn.innerHTML = "🔄";
        resetBtn.title = "Reiniciar conversación";
        resetBtn.style.cssText = `
            background: #6c757d;
            color: black;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            margin-right: 8px;
            font-size: 14px;
            transition: background 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;
        
        resetBtn.onmouseenter = () => resetBtn.style.background = "#5a6268";
        resetBtn.onmouseleave = () => resetBtn.style.background = "#6c757d";
        
        return resetBtn;
    }

    /* ==========================================
       👋 MENSAJE DE BIENVENIDA
       ========================================== */
    function sendWelcomeMessage() {
        if (!welcomeSent) {
            setTimeout(() => {
                const welcomeMsg = document.createElement("div");
                welcomeMsg.style.cssText = `
                    margin: 10px 0;
                    padding: 10px 14px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    font-size: 14px;
                    animation: fadeIn 0.3s ease;
                `;
                welcomeMsg.innerHTML = `<b>🤖 Bounty:</b> Hola soy Bounty tu asistente en esta página web 👋`;
                chatbox.appendChild(welcomeMsg);
                chatbox.scrollTop = chatbox.scrollHeight;
                welcomeSent = true;
            }, 400);
        }
    }

    /* ==========================================
       🔄 REINICIAR CONVERSACIÓN
       ========================================== */
    function resetConversation() {
        chatbox.innerHTML = "";
        welcomeSent = false;
        userInput.value = "";
        
        setTimeout(() => {
            const resetMsg = document.createElement("div");
            resetMsg.style.cssText = `
                margin: 10px 0;
                padding: 10px 14px;
                background: #fff3e0;
                border-left: 4px solid #ff9800;
                border-radius: 8px;
                font-size: 14px;
            `;
            resetMsg.innerHTML = `<b>🔄 Bot:</b> Conversación reiniciada. ¿En qué puedo ayudarte ahora?`;
            chatbox.appendChild(resetMsg);
            chatbox.scrollTop = chatbox.scrollHeight;
        }, 200);
    }

    /* ==========================================
       ✨ ANIMACIÓN "ESCRIBIENDO..."
       ========================================== */
    function typingAnimation(callback){
        const typingDiv = document.createElement("div");
        typingDiv.id = "typing";
        typingDiv.style.cssText = `
            margin: 8px 0;
            padding: 10px 14px;
            background: #f1f1f1;
            border-radius: 18px;
            font-style: italic;
            color: #666;
            max-width: 80%;
        `;
        typingDiv.innerHTML = `<b>🤖 Bounty:</b> escribiendo<span class="dots">...</span>`;
        chatbox.appendChild(typingDiv);
        chatbox.scrollTop = chatbox.scrollHeight;

        // Animación de puntos
        let dots = 0;
        const dotInterval = setInterval(() => {
            const dotsEl = typingDiv.querySelector(".dots");
            if (dotsEl) {
                dots = (dots + 1) % 4;
                dotsEl.textContent = ".".repeat(dots);
            }
        }, 300);

        setTimeout(() => {
            clearInterval(dotInterval);
            if (typingDiv.parentNode) typingDiv.remove();
            callback();
        }, 800 + Math.random() * 400);
    }

    /* ==========================================
       💾 GUARDAR PREGUNTAS DESCONOCIDAS
       ========================================== */
    function saveUnknown(question){
        fetch("/api/chatbot/unknown", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, timestamp: new Date().toISOString() })
        })
        .then(res => res.json())
        .then(data => console.log("✅ Pregunta guardada:", data))
        .catch(err => console.warn("⚠️ Backend no disponible para guardar pregunta:", err));
    }

    /* ==========================================
       💬 BASE DE CONVERSACIÓN BÁSICA
       ========================================== */
    const smallTalk = {
        hola: ["Hola 👋 ¿En qué puedo ayudarte?", "¡Hola! ¿Qué necesitas?", "Bienvenido ¿cómo puedo ayudarte?"],
        "como estas": ["Estoy funcionando perfectamente 😄", "Todo bien por aquí ¿y tú?", "Listo para ayudarte 👍"],
        gracias: ["¡Con gusto!", "Para eso estoy 😄", "Cuando necesites ayuda aquí estaré."],
        adios: ["Hasta luego 👋", "Que tengas un buen día", "Nos vemos pronto"],
        "buenos dias": ["¡Buenos días! ☀️ ¿Cómo puedo ayudarte hoy?", "Buenos días, estoy listo para asistirte"],
        "buenas tardes": ["¡Buenas tardes! 🌤️ ¿Qué necesitas?", "Buenas tardes, en qué te ayudo"],
        "buenas noches": ["¡Buenas noches! 🌙 ¿En qué puedo servirte?", "Buenas noches, aquí para ayudarte"]
    };

    /* ==========================================
       🎯 GRUPOS DE INTENCIONES
       ========================================== */
    const intentGroups = {
        "iniciar_sesion": ["iniciar sesion", "login", "entrar", "acceso", "loguear", "ingresar", "cuenta", "registrarme"],
        "metodos_pago": ["pagar", "pago", "tarjeta", "dinero", "paypal", "transferencia", "oxxo", "spei", "mercado pago"],
        "envios": ["envio", "entrega", "paquete", "llegada", "tiempo envio", "guia", "rastreo", "seguimiento"],
        "comprar": ["comprar", "producto", "adquirir", "precio", "costo", "catalogo", "tienda"],
        "devolucion": ["devolver", "devolucion", "reembolso", "cambiar", "garantia"],
        "soporte": ["ayuda", "soporte", "problema", "error", "no funciona", "asistencia"]
    };

    const locationContactKeywords = {
        "contacto": [
            "contacto", "contactar", "whatsapp", "teléfono", "telefono", 
            "llamar", "mensaje", "correo", "email", "atención", "soporte",
            "hablar con ustedes", "comunicarme", "los contacto", "atencion al cliente"
        ],
        "ubicacion": [
            "donde se encuentran", "donde estan", "ubicación", "ubicacion",
            "dirección", "direccion", "oficinas", "tienda", "sucursal",
            "visitarlos", "ir a verlos", "ciudad de méxico", "cdmx",
            "eje central", "centro", "méxico", "address", "location", "direccion fisica"
        ]
    };

    /* ==========================================
       🎯 FUNCIÓN PRINCIPAL: ENVIAR MENSAJE
       ========================================== */
    function sendMessage(){
        let text = userInput.value.trim();
        if(text === "") return;

        let normalized = normalize(text);

        // Mostrar mensaje del usuario
        const userMsg = document.createElement("div");
        userMsg.style.cssText = `
            margin: 8px 0;
            padding: 10px 14px;
            background: #007bff;
            color: white;
            border-radius: 18px 18px 4px 18px;
            max-width: 85%;
            margin-left: auto;
            word-wrap: break-word;
        `;
        userMsg.innerHTML = `<b>Tú:</b> ${text}`;
        chatbox.appendChild(userMsg);
        chatbox.scrollTop = chatbox.scrollHeight;
        
        userInput.value = "";

        let response = null;

        /* 🔹 1. Conversación básica (Saludos) */
        for(let key in smallTalk){
            if(normalized.includes(key)){
                let answers = smallTalk[key];
                response = answers[Math.floor(Math.random() * answers.length)];
                break; 
            }
        }

        /* 🔹 2. Detección de Intención por Palabras Clave */
        if(!response){
            for (const [intent, keywords] of Object.entries(intentGroups)) {
                const foundKeyword = keywords.find(keyword => normalized.includes(keyword));
                
                if (foundKeyword) {
                    let result = fuse?.search(foundKeyword);
                    
                    if(result?.length > 0){
                        response = result[0].item.answer;
                        break;
                    }

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

        /* 🔹 2.5. Contacto y Ubicación */
        if(!response){
            const contactoMatch = locationContactKeywords.contacto.some(kw => normalized.includes(kw));
            if(contactoMatch){
                const contactoEntry = knowledge.find(k => 
                    normalize(k.question).includes("contacto") || 
                    normalize(k.answer).includes("whatsapp") ||
                    normalize(k.answer).includes("+52") ||
                    normalize(k.answer).includes("correo") ||
                    normalize(k.answer).includes("email")
                );
                if(contactoEntry){
                    response = contactoEntry.answer;
                }
            }
        
            const ubicacionMatch = locationContactKeywords.ubicacion.some(kw => normalized.includes(kw));
            if(ubicacionMatch && !response){
                const ubicacionEntry = knowledge.find(k => 
                    normalize(k.question).includes("donde") || 
                    normalize(k.question).includes("encuentran") ||
                    normalize(k.answer).includes("eje central") ||
                    normalize(k.answer).includes("ciudad de méxico") ||
                    normalize(k.answer).includes("cdmx") ||
                    normalize(k.answer).includes("dirección")
                );
                if(ubicacionEntry){
                    response = ubicacionEntry.answer;
                }
            }
        }

        /* 🔹 3. Búsqueda Inteligente con Fuse.js */
        if(!response && fuse){
            let result = fuse.search(normalized);
            if(result.length > 0 && result[0].score < 0.5){
                response = result[0].item.answer;
            }
        }

        /* 🔹 4. Búsqueda inversa (contiene pregunta) */
        if(!response){
            for(let item of knowledge){
                if(normalized.includes(normalize(item.question))){
                    response = item.answer;
                    break;
                }
                if(normalize(item.question).includes(normalized) && normalized.length > 3){
                     response = item.answer;
                     break;
                }
            }
        }

        /* 🔹 5. Respuesta por defecto si no entiende */
        if(!response){
            response = `No entendí tu pregunta 🤔

Puedes preguntarme sobre:
• crear cuenta
• iniciar sesión
• comprar productos
• envíos y rastreo
• métodos de pago
• devoluciones
• contacto y soporte
• ubicación de oficinas`;
            
            if(normalized.length > 3) saveUnknown(text);
        }

        /* 🔹 Mostrar respuesta con animación */
        typingAnimation(() => {
            const botMsg = document.createElement("div");
            botMsg.style.cssText = `
                margin: 8px 0;
                padding: 10px 14px;
                background: #f1f1f1;
                border-radius: 18px 18px 18px 4px;
                max-width: 85%;
                word-wrap: break-word;
                line-height: 1.4;
            `;
            botMsg.innerHTML = `<b>🤖 Bounty:</b> ${response.replace(/\n/g, '<br>')}`;
            chatbox.appendChild(botMsg);
            chatbox.scrollTop = chatbox.scrollHeight;
        });
    }

    /* ==========================================
       🎯 EVENTOS DEL CHAT
       ========================================== */

    /* 👉 Abrir chat + bienvenida + botón reiniciar */
    chatButton.addEventListener("click", (e) => {
        e.stopPropagation();
        chatContainer.classList.add("active");
        
        // Insertar botón de reiniciar en el header
        const chatHeader = chatContainer.querySelector(".chat-header");
        if (chatHeader && !chatHeader.contains(resetBtn)) {
            const btn = createResetButton();
            const closeBtn = chatHeader.querySelector("#closeChat");
            if (closeBtn) {
                chatHeader.insertBefore(btn, closeBtn);
            } else {
                chatHeader.appendChild(btn);
            }
            
            btn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                resetConversation();
            });
        }
        
        sendWelcomeMessage();
    });

    /* ❌ Cerrar chat con botón X */
    if (closeChat) {
        closeChat.addEventListener("click", (e) => {
            e.stopPropagation();
            chatContainer.classList.remove("active");
        });
    }

    /* 🔄 Botón de enviar mensaje */
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    /* ⌨️ Enviar con Enter */
    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if(e.key === "Enter") sendMessage();
        });
    }

    /* 🖱️ Cerrar chat al hacer clic FUERA */
    document.addEventListener("click", (e) => {
        if (chatContainer.classList.contains("active") && 
            !chatContainer.contains(e.target) && 
            e.target !== chatButton &&
            !chatButton.contains(e.target)) {
            chatContainer.classList.remove("active");
        }
    });

    /* 🛡️ Evitar que clicks internos cierren el chat */
    chatContainer.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    /* 📱 Soporte táctil para móviles */
    document.addEventListener("touchstart", (e) => {
        if (chatContainer.classList.contains("active") && 
            !chatContainer.contains(e.target) && 
            e.target !== chatButton &&
            !chatButton.contains(e.target)) {
            chatContainer.classList.remove("active");
        }
    }, { passive: true });

    console.log("✅ Chatbot Bounty inicializado correctamente");
});