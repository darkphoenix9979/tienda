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

    const response = await fetch("/api/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({username,email,password})
    });

    const data = await response.json();

    if(response.ok){

        alert("Registro exitoso 🌸");

        switchForm();

    }else{

        alert(data.message);

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