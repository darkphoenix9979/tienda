// Cambiar entre login y register
function switchForm(){
    document.getElementById("loginForm").classList.toggle("hidden");
    document.getElementById("loginForm").classList.toggle("active");
    document.getElementById("registerForm").classList.toggle("hidden");
    document.getElementById("registerForm").classList.toggle("active");
}

// Mostrar contraseña
function togglePassword(id){
    const input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
}

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        const res = await fetch("/api/auth/login",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({email,password})
        });

        const data = await res.json();

        // 🔹 LOGIN - Sección corregida (dentro de if(res.ok))
    if(res.ok){

        // ✅ CORREGIDO: Usar el token REAL que envía el backend
        localStorage.setItem("token", data.token);  // ← Cambiar "autenticado" por data.token
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userId", data.userId); // ← Opcional pero útil

        // redirección según rol
        if(data.role === "admin"){
            window.location.href = "admin.html";
        }else{
            window.location.href = "tienda.html";
        }

    }else{
    alert(data.message);
}

    }catch(error){

        console.error("Error:",error);

    }

});


// REGISTER
async function register(){
    console.log("🔍 [DEBUG] register() ejecutado");
    
    const username = document.getElementById("registerUsername")?.value?.trim();
    const email = document.getElementById("registerEmail")?.value?.trim();
    const password = document.getElementById("registerPassword")?.value;

    console.log("📦 Datos a enviar:", { username, email, password: "***" });

    // Validación básica frontend
    if (!username || !email || !password) {
        console.warn("⚠️ Campos vacíos");
        alert("Todos los campos son obligatorios");
        return;
    }

    try {
        console.log("🌐 Enviando request a /api/auth/register...");
        
        const response = await fetch("/api/auth/register",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({username, email, password})
        });

        console.log("📡 Respuesta recibida:", response.status, response.statusText);

        // 🔍 Verificar tipo de contenido antes de parsear
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
            console.log("📄 JSON parsed:", data);
        } else {
            const text = await response.text();
            console.error("❌ Respuesta no es JSON:", text.substring(0, 200));
            throw new Error(`Servidor respondió con ${response.status}: ${text.substring(0, 100)}`);
        }

        if(response.ok){
            console.log("✅ Registro exitoso (backend)");
            
            if(data.requires2FA){
                console.log("🔐 Requiere 2FA, mostrando modal...");
                sessionStorage.setItem("tempToken", data.tempToken);
                sessionStorage.setItem("pendingEmail", email);
                show2FAVerification(data.method);
                return;
            }
            
            alert("Registro exitoso 🌸");
            switchForm();
        } else {
            console.warn("⚠️ Error del backend:", data.message);
            alert(data.message || "Error en el registro");
        }
    } catch(error){
        console.error("💥 ERROR en register():", error);
        alert(`Error: ${error.message}. Revisa la consola (F12) para más detalles.`);
    }
}

// Función para mostrar el formulario de verificación 2FA
async function verify2FACode(code){
    const tempToken = sessionStorage.getItem("tempToken");
    const email = sessionStorage.getItem("pendingEmail");
    
    if(!tempToken){
        alert("Sesión expirada. Regístrate nuevamente.");
        switchForm();
        return;
    }

    try {
        const res = await fetch("/api/auth/verify-2fa", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                tempToken,
                email,
                code: code.trim()
            })
        });

        const data = await res.json();

        if(res.ok){
            // ✅ Verificación exitosa: activar sesión
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);
            
            // Limpiar datos temporales
            sessionStorage.removeItem("tempToken");
            sessionStorage.removeItem("pendingEmail");
            
            alert("¡Cuenta verificada! 🎉");
            window.location.href = data.role === "admin" ? "admin.html" : "tienda.html";
        } else {
            alert(data.message || "Código inválido");
        }
    } catch(error){
        console.error("Error en verificación:", error);
        alert("Error al verificar el código");
    }
}

// 🔹 Función para mostrar el modal de verificación 2FA
function show2FAVerification(method) {
    // Verificar que no haya un modal abierto ya
    const existingModal = document.getElementById('twoFAModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div id="twoFAModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;">
            <div style="background:white;padding:30px;border-radius:12px;max-width:450px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <h2 style="margin-top:0;color:#333;">🔐 Verificación de Seguridad</h2>
                <p style="color:#666;margin:15px 0;">
                    Hemos enviado un código de verificación a tu correo electrónico.
                </p>
                
                <!-- ✅ IMPORTANTE: id="twoFACode" exacto -->
                <input 
                    type="text" 
                    id="twoFACode"
                    placeholder="000000" 
                    maxlength="6" 
                    pattern="[0-9]{6}"
                    autocomplete="one-time-code"
                    style="width:100%;padding:15px;font-size:24px;text-align:center;letter-spacing:10px;border:2px solid #ddd;border-radius:8px;margin:20px 0;box-sizing:border-box;"
                    oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                >
                
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button 
                        onclick="submit2FA()" 
                        style="flex:1;background:#ff00cc;color:white;padding:12px 20px;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold;"
                    >
                        Verificar
                    </button>
                    <button 
                        onclick="resendCode()" 
                        style="background:#6c757d;color:white;padding:12px 20px;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
                    >
                        Reenviar código
                    </button>
                    <button 
                        onclick="close2FAModal()" 
                        style="background:#dc3545;color:white;padding:12px 20px;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
                    >
                        Cancelar
                    </button>
                </div>
                <p id="twoFAError" style="color:#dc3545;margin-top:15px;text-align:center;display:none;"></p>
                <p id="twoFAMessage" style="color:#28a745;margin-top:10px;text-align:center;display:none;"></p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 🔧 Enfocar el input después de un pequeño delay para asegurar que esté en el DOM
    setTimeout(() => {
        const input = document.getElementById('twoFACode');
        if (input) {
            input.focus();
            console.log("✅ Input #twoFACode enfocado");
        } else {
            console.error("❌ No se pudo enfocar #twoFACode - elemento no encontrado");
        }
    }, 100);
}

// 🔹 Función para cerrar el modal
function close2FAModal() {
    const modal = document.getElementById('twoFAModal');
    if (modal) {
        modal.remove();
        // Limpiar datos temporales
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('pendingEmail');
    }
}

// 🔹 Función para verificar el código (versión con debug)
async function submit2FA() {
    console.log("🔍 [DEBUG] submit2FA() ejecutado");
    
    // 🔧 Verificar que el input existe antes de usarlo
    const codeInput = document.getElementById('twoFACode');
    
    if (!codeInput) {
        console.error("❌ ERROR: No se encontró el input #twoFACode");
        alert("Error: El formulario de verificación no se cargó correctamente. Intenta de nuevo.");
        close2FAModal();
        return;
    }
    
    const code = codeInput.value.trim();
    console.log("🔑 Código ingresado:", code ? `${code[0]}***${code.slice(-1)}` : "VACÍO");
    console.log("🔍 Input encontrado:", codeInput, "Value:", codeInput.value);
    
    // Validar formato del código
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        console.warn("⚠️ Código inválido:", code);
        showError(document.getElementById('twoFAError'), 'Ingresa un código válido de 6 dígitos');
        codeInput.focus(); // Enfocar para que el usuario pueda escribir
        return;
    }
    
    const tempToken = sessionStorage.getItem('tempToken');
    const email = sessionStorage.getItem('pendingEmail');
    
    console.log("📦 Datos de sesión:", {
        tempToken: tempToken ? `${tempToken.slice(0, 10)}...` : "NO EXISTE",
        email: email || "NO EXISTE"
    });
    
    if (!tempToken || !email) {
        showError(document.getElementById('twoFAError'), 'Sesión expirada. Regístrate nuevamente.');
        setTimeout(() => { close2FAModal(); switchForm(); }, 2000);
        return;
    }
    
    try {
        console.log("🌐 Enviando verify a /api/auth/verify-2fa...");
        
        codeInput.disabled = true;
        showError(document.getElementById('twoFAError'), '', false);
        const messageElement = document.getElementById('twoFAMessage');
        messageElement.textContent = "Verificando...";
        messageElement.style.display = 'block';
        
        const res = await fetch('/api/auth/verify-2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, email, code })
        });
        
        console.log("📡 Respuesta:", res.status, res.statusText);
        
        const contentType = res.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
            console.log("📄 JSON:", data);
        } else {
            const text = await res.text();
            throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}`);
        }
        
        if (res.ok) {
            console.log("✅ Verificación exitosa");
            showMessage(messageElement, '¡Cuenta verificada! Redirigiendo... 🎉');
            
            localStorage.setItem('token', data.token || 'autenticado');
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            
            sessionStorage.removeItem('tempToken');
            sessionStorage.removeItem('pendingEmail');
            
            setTimeout(() => {
                const redirectUrl = data.role === 'admin' ? 'admin.html' : 'tienda.html';
                console.log("🔄 Redirigiendo a:", redirectUrl);
                window.location.href = redirectUrl;
            }, 1500);
        } else {
            console.warn("⚠️ Error backend:", data.message);
            showError(document.getElementById('twoFAError'), data.message || 'Código incorrecto');
            codeInput.value = '';
            codeInput.disabled = false;
            codeInput.focus();
            messageElement.style.display = 'none';
        }
    } catch (error) {
        console.error("💥 ERROR en submit2FA():", error);
        showError(document.getElementById('twoFAError'), `Error: ${error.message}`);
        codeInput.disabled = false;
        document.getElementById('twoFAMessage').style.display = 'none';
    }
}

// 🔹 Función para reenviar código
async function resendCode() {
    const email = sessionStorage.getItem('pendingEmail');
    const messageElement = document.getElementById('twoFAMessage');
    const errorElement = document.getElementById('twoFAError');
    
    if (!email) {
        showError(errorElement, 'No se pudo reenviar. Intenta registrarte de nuevo.');
        return;
    }
    
    try {
        const res = await fetch('/api/auth/resend-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showMessage(messageElement, '✅ Nuevo código enviado a tu correo');
            showError(errorElement, '', false);
        } else {
            showError(errorElement, data.message || 'No se pudo reenviar el código');
        }
    } catch (error) {
        console.error('Error al reenviar:', error);
        showError(errorElement, 'Error de conexión');
    }
}

// 🔹 Helper: Mostrar error
function showError(element, message, show = true) {
    if (element) {
        element.textContent = message;
        element.style.display = show ? 'block' : 'none';
    }
}

// 🔹 Helper: Mostrar mensaje exitoso
function showMessage(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// 🔹 Permitir verificar con tecla Enter
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const modal = document.getElementById('twoFAModal');
            if (modal) {
                submit2FA();
            }
        }
    });
});


// PARTICULAS
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles=[];

for(let i=0;i<80;i++){

    particles.push({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        r:Math.random()*2,
        dx:(Math.random()-0.5),
        dy:(Math.random()-0.5)
    });

}

function animate(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="#ff00cc";

    particles.forEach(p=>{

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();

        p.x+=p.dx;
        p.y+=p.dy;

        if(p.x<0||p.x>canvas.width)p.dx*=-1;
        if(p.y<0||p.y>canvas.height)p.dy*=-1;

    });

    requestAnimationFrame(animate);

}

animate();