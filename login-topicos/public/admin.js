// 🔒 seguridad admin
if(localStorage.getItem("role") !== "admin"){
window.location.href = "login.html";
}

const form = document.getElementById("productForm");
const preview = document.getElementById("preview");
const imageInput = document.getElementById("image");
const message = document.getElementById("message");


// ==========================
// PREVIEW IMAGEN
// ==========================

imageInput.addEventListener("change", () => {

const file = imageInput.files[0];

if(file){
preview.src = URL.createObjectURL(file);
preview.style.display = "block";
}

});


// ==========================
// CREAR PRODUCTO
// ==========================

form.addEventListener("submit", async (e)=>{

e.preventDefault();

const name = document.getElementById("name").value;
const price = document.getElementById("price").value;
const stock = document.getElementById("stock").value;
const file = imageInput.files[0];

if(!file){

message.innerText="❌ Debes seleccionar imagen";
return;

}

message.innerText="Subiendo imagen...";

try{

const formData = new FormData();

formData.append("file",file);
formData.append("upload_preset","anime_store");

const cloudResponse = await fetch(
"https://api.cloudinary.com/v1_1/dvmkwrelz/image/upload",
{method:"POST",body:formData}
);

const cloudData = await cloudResponse.json();

message.innerText="Guardando producto...";

const productResponse = await fetch("/api/products",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name,
price,
stock,
image:cloudData.secure_url

})

});

const data = await productResponse.json();

if(!productResponse.ok) throw new Error(data.message);

message.innerText="✅ Producto creado";

form.reset();
preview.style.display="none";

cargarProductos();

}catch(error){

console.error(error);

message.innerText="❌ "+error.message;

}

});


// ==========================
// CARGAR PRODUCTOS
// ==========================

async function cargarProductos(){

const res = await fetch("/api/products");

const productos = await res.json();

const list = document.getElementById("productList");

list.innerHTML="";

productos.forEach(p=>{

const div = document.createElement("div");

div.classList.add("product-item");

div.innerHTML=`

<img src="${p.image}" width="80">

<span>${p.name}</span>

<span>$${p.price}</span>

<span>Stock: ${p.stock}</span>

<button onclick="eliminarProducto('${p._id}')">Eliminar</button>

`;

list.appendChild(div);

});

}


// ==========================
// ELIMINAR PRODUCTO
// ==========================

async function eliminarProducto(id){

if(!confirm("Eliminar producto?")) return;

await fetch("/api/products/"+id,{
method:"DELETE"
});

cargarProductos();

}



// ==========================
// CARRUSEL
// ==========================

async function subirImagenCarrusel(){

const fileInput = document.getElementById("carouselImage");

if(!fileInput.files.length){

alert("Selecciona una imagen");
return;

}

const file = fileInput.files[0];

const formData = new FormData();

formData.append("file",file);
formData.append("upload_preset","anime_store");

const cloudResponse = await fetch(
"https://api.cloudinary.com/v1_1/dvmkwrelz/image/upload",
{method:"POST",body:formData}
);

const cloudData = await cloudResponse.json();

await fetch("/api/carousel",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({image:cloudData.secure_url})

});

cargarCarruselAdmin();

}


async function cargarCarruselAdmin(){

const response = await fetch("/api/carousel");

const images = await response.json();

const list = document.getElementById("carouselList");

list.innerHTML="";

images.forEach(img=>{

const div = document.createElement("div");

div.classList.add("carousel-item");

div.dataset.id=img._id;

div.innerHTML=`

<img src="${img.image}" width="120">

<button onclick="eliminarImagen('${img._id}')">Eliminar</button>

`;

list.appendChild(div);

});

}


async function eliminarImagen(id){

await fetch("/api/carousel/"+id,{
method:"DELETE"
});

cargarCarruselAdmin();

}


// ==========================
// PREGUNTAS CHATBOT
// ==========================

async function cargarPreguntas(){

try{

const res = await fetch("/unknown_questions.json");

const preguntas = await res.json();

const list = document.getElementById("questionsList");

list.innerHTML="";

preguntas.forEach(p=>{

const li = document.createElement("li");

li.textContent = p;

list.appendChild(li);

});

}catch{

console.log("No hay preguntas registradas");

}

}

function mostrarPanel(panel){

document.querySelectorAll(".panel").forEach(p=>{
p.classList.add("hidden")
})

document.getElementById(panel).classList.remove("hidden")

}

function logout(){

localStorage.clear()

window.location.href="login.html"

}


// ==========================
// INICIO
// ==========================

cargarProductos();
cargarCarruselAdmin();
cargarPreguntas();