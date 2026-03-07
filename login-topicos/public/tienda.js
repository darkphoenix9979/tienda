// Protección login
//if(!localStorage.getItem("token")){
//    window.location.href="login.html";
//}

// Bloquear volver atrás después de logout
//window.addEventListener("pageshow", function (event) {
//  if (!localStorage.getItem("token")) {
//        window.location.href = "login.html";
//    }
//});

// ==========================
// CARRUSEL
// ==========================
async function cargarCarrusel() {
  try {
    const response = await fetch("/api/carousel");
    const images = await response.json();

    const hero = document.getElementById("heroCarousel");

    images.forEach((item, index) => {
      const img = document.createElement("img");
      img.src = item.image;
      if (index === 0) img.classList.add("active");
      hero.appendChild(img);
    });

    iniciarCarrusel();

  } catch (error) {
    console.error("Error cargando carrusel:", error);
  }
}

function iniciarCarrusel() {
  let slides = document.querySelectorAll(".hero img");
  let index = 0;

  setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 5000);
}

cargarCarrusel();

// ==========================
// CARGAR PRODUCTOS
// ==========================
async function cargarProductos(){

  try{

    const response = await fetch("/api/products");
    const products = await response.json();

    const contenedor = document.getElementById("productos");

    contenedor.innerHTML = "";

    products.forEach(product =>{

      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
      <img src="${product.image}">
      
      <div class="card-info">

      <h3>${product.name}</h3>

      <div>$${product.price} MXN</div>

      <div>Stock: ${product.stock}</div>

      <button onclick='addToCart(${JSON.stringify(product)})'>
      Agregar al carrito
      </button>

      </div>
      `;

      contenedor.appendChild(card);

    });

  }catch(error){
    console.error("Error cargando productos:",error);
  }

}


// ==========================
// USUARIO / ESTADO DE SESION
// ==========================

const username = localStorage.getItem("username");
const token = localStorage.getItem("token");

const usernameDisplay = document.getElementById("usernameDisplay");
const avatar = document.getElementById("avatar");
const dropdown = document.getElementById("dropdown");

// Si hay sesión iniciada
if(token && username){

    usernameDisplay.innerText = username;
    avatar.innerText = username.charAt(0).toUpperCase();

    dropdown.innerHTML = `
    <button class="menu-btn" onclick="logout()">Cerrar sesión</button>
    `;

}else{

    // Usuario invitado
    usernameDisplay.innerText = "Invitado";
    avatar.innerText = "?";

    dropdown.innerHTML = `
    <button class="menu-btn" onclick="irLogin()">Iniciar sesión</button>
    `;
}

// ==========================
// DROPDOWN USUARIO
// ==========================
const userMenu = document.getElementById("userMenu");
const arrow = document.getElementById("arrow");

if (userMenu) {
  userMenu.addEventListener("click", () => {
    dropdown.classList.toggle("active");
    arrow.style.transform = dropdown.classList.contains("active")
      ? "rotate(180deg)"
      : "rotate(0deg)";
  });
}


// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.replace("tienda.html");
}


// ==========================
// IR A LOGIN
// ==========================
function irLogin() {
  window.location.href = "login.html";
}

// ==========================
// AGREGAR AL CARRITO
// ==========================
function addToCart(product) {

  if (!localStorage.getItem("token")) {
    alert("Debes iniciar sesión para comprar");
    window.location.href = "login.html";
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const index = cart.findIndex(item => item._id === product._id);

  if (index !== -1) {
    cart[index].quantity += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Producto agregado al carrito 🛒");

  cargarCarrito();
}


// ==========================
// MOSTRAR CARRITO
// ==========================
function cargarCarrito(){

const contenedor = document.getElementById("carrito");
const cartCount = document.getElementById("cartCount");

if(!contenedor) return;

let cart = JSON.parse(localStorage.getItem("cart")) || [];

contenedor.innerHTML="";

let total = 0;
let totalItems = 0;

cart.forEach((item,index)=>{

total += item.price * item.quantity;
totalItems += item.quantity;

const card = document.createElement("div");
card.classList.add("card");

card.innerHTML = `
<div class="cart-img">
<img src="${item.image}">
</div>

<div class="card-info">

<div class="product-name">${item.name}</div>

<div class="price">$${item.price} MXN</div>

<div class="quantity-control">
<button onclick="cambiarCantidad(${index},-1)">-</button>
<span>${item.quantity}</span>
<button onclick="cambiarCantidad(${index},1)">+</button>
</div>

<button onclick="eliminarProducto(${index})">Eliminar</button>

</div>
`;

contenedor.appendChild(card);

});

if(cartCount){
cartCount.innerText = totalItems;
}

const totalHTML = document.createElement("div");

totalHTML.innerHTML = `
<h3>Total: $${total} MXN</h3>
<button onclick="simularCompra()">Comprar</button>
`;

contenedor.appendChild(totalHTML);

}


// ==========================
// CAMBIAR CANTIDAD
// ==========================
function cambiarCantidad(index,cambio){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

cart[index].quantity += cambio;

if(cart[index].quantity <= 0){
cart.splice(index,1);
}

localStorage.setItem("cart",JSON.stringify(cart));

cargarCarrito();

}


// ==========================
// ELIMINAR PRODUCTO
// ==========================
function eliminarProducto(index){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

cart.splice(index,1);

localStorage.setItem("cart",JSON.stringify(cart));

cargarCarrito();

}


// ==========================
// SIMULAR COMPRA
// ==========================
function simularCompra(){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

if(cart.length === 0){
alert("El carrito está vacío");
return;
}

alert("Compra realizada con éxito 🎉");

localStorage.removeItem("cart");

cargarCarrito();

}

// ==========================
// VACIAR CARRITO
// ==========================
const clearCartBtn = document.getElementById("clearCartBtn");

if(clearCartBtn){

clearCartBtn.addEventListener("click",()=>{

localStorage.removeItem("cart");

cargarCarrito();

});

}


// ==========================
// INICIAR
// ==========================
cargarProductos();
cargarCarrito();