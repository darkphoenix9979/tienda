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

if(token && username){

    usernameDisplay.innerText = username;
    avatar.innerText = username.charAt(0).toUpperCase();

    dropdown.innerHTML = `
    <button class="menu-btn" onclick="logout()">Cerrar sesión</button>
    `;

}else{

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
  cargarCarritoModal();
}


// ==========================
// MODAL DEL CARRITO
// ==========================
const cartIcon = document.querySelector(".cart-icon");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");

if(cartIcon && cartModal){

cartIcon.addEventListener("click", () => {

cartModal.style.display = "flex";
cargarCarritoModal();

});

}

if(closeCart){

closeCart.addEventListener("click", () => {

cartModal.style.display = "none";

});

}


function cargarCarritoModal(){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const contenedor = document.getElementById("cartItems");
const totalText = document.getElementById("cartTotal");

if(!contenedor) return;

contenedor.innerHTML = "";

let total = 0;

cart.forEach((item,index)=>{

total += item.price * item.quantity;

const div = document.createElement("div");

div.classList.add("cart-item");

div.innerHTML = `

<img src="${item.image}">

<div>

${item.name}

<div>$${item.price} MXN</div>

<div>

<button onclick="cambiarCantidad(${index},-1)">-</button>

${item.quantity}

<button onclick="cambiarCantidad(${index},1)">+</button>

</div>

</div>

`;

contenedor.appendChild(div);

});

if(totalText){
totalText.innerText = "Total: $" + total + " MXN";
}

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
cargarCarritoModal();

}


// ==========================
// ELIMINAR PRODUCTO
// ==========================
function eliminarProducto(index){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

cart.splice(index,1);

localStorage.setItem("cart",JSON.stringify(cart));

cargarCarrito();
cargarCarritoModal();

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
cargarCarritoModal();

}


// ==========================
// VACIAR CARRITO
// ==========================
const clearCartBtn = document.getElementById("clearCartBtn");

if(clearCartBtn){

clearCartBtn.addEventListener("click",()=>{

localStorage.removeItem("cart");

cargarCarrito();
cargarCarritoModal();

});

}


// ==========================
// INICIAR
// ==========================
cargarProductos();
cargarCarrito();
cargarCarritoModal();