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

        if(res.ok){

            // guardar sesión
            localStorage.setItem("token","autenticado");
            localStorage.setItem("username",data.username);
            localStorage.setItem("role",data.role);

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
    const username = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch("/api/auth/register",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({username, email, password})
        });

        const data = await response.json();

        if(response.ok){
            // Caso 1: Registro exitoso sin 2FA (si está desactivado)
            if(!data.requires2FA){
                alert("Registro exitoso 🌸");
                switchForm();
                return;
            }
            
            // Caso 2: Requiere verificación 2FA
            if(data.requires2FA && data.tempToken){
                // Guardar token temporal para el siguiente paso
                sessionStorage.setItem("tempToken", data.tempToken);
                sessionStorage.setItem("pendingEmail", email);
                
                // Mostrar modal/formulario de verificación
                show2FAVerification(data.method); // 'email', 'sms' o 'totp'
            }
        } else {
            alert(data.message);
        }
    } catch(error){
        console.error("Error:", error);
        alert("Error de conexión. Intenta nuevamente.");
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