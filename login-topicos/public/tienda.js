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

    arrow.style.transform =
      dropdown.classList.contains("active")
      ? "rotate(180deg)"
      : "rotate(0deg)";

  });
}


// ==========================
// LOGOUT
// ==========================

function logout(){

localStorage.removeItem("token");
localStorage.removeItem("username");

window.location.replace("tienda.html");

}


// ==========================
// IR A LOGIN
// ==========================

function irLogin(){

window.location.href="login.html";

}



// ==========================
// CARRITO
// ==========================

const cartIcon = document.querySelector(".cart-icon");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");

if(cartIcon){

cartIcon.addEventListener("click",()=>{

cartModal.classList.add("active");
cargarCarrito();

});

}

if(closeCart){

closeCart.addEventListener("click",()=>{

cartModal.classList.remove("active");

});

}


// ==========================
// AGREGAR PRODUCTO
// ==========================

function addToCart(product){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const index = cart.findIndex(item=>item._id === product._id);

if(index !== -1){

cart[index].quantity++;

}else{

cart.push({
_id:product._id,
name:product.name,
price:product.price,
image:product.image,
quantity:1
});

}

localStorage.setItem("cart",JSON.stringify(cart));

actualizarContador();

animarCarrito();

cargarCarrito();

}



// ==========================
// ANIMACION CARRITO
// ==========================

function animarCarrito(){

const icon = document.querySelector(".cart-icon");

if(!icon) return;

icon.classList.add("cart-bounce");

setTimeout(()=>{

icon.classList.remove("cart-bounce");

},400);

}



// ==========================
// CONTADOR
// ==========================

function actualizarContador(){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let total = 0;

cart.forEach(item=>{
total += item.quantity;
});

const contador = document.getElementById("cartCount");

if(contador){
contador.innerText = total;
}

}



// ==========================
// MOSTRAR CARRITO
// ==========================

function cargarCarrito(){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const contenedor = document.getElementById("cartItems");
const totalText = document.getElementById("cartTotal");

if(!contenedor) return;

contenedor.innerHTML="";

let total=0;

cart.forEach((item,index)=>{

total += item.price * item.quantity;

const div = document.createElement("div");

div.classList.add("cart-item");

div.innerHTML=`

<img src="${item.image}">

<div class="cart-info">

<strong>${item.name}</strong>

<div>$${item.price} MXN</div>

<div class="quantity">

<button class="qty-btn" onclick="cambiarCantidad(${index},-1)">-</button>

<span>${item.quantity}</span>

<button class="qty-btn" onclick="cambiarCantidad(${index},1)">+</button>

</div>

</div>

`;

contenedor.appendChild(div);

});

if(totalText){

totalText.innerText="Total: $"+total+" MXN";

}

actualizarContador();

}



// ==========================
// CAMBIAR CANTIDAD
// ==========================

function cambiarCantidad(index,cambio){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

cart[index].quantity += cambio;

if(cart[index].quantity <=0){

cart.splice(index,1);

}

localStorage.setItem("cart",JSON.stringify(cart));

cargarCarrito();

}



// ==========================
// VACIAR CARRITO
// ==========================

function vaciarCarrito(){

localStorage.removeItem("cart");

cargarCarrito();

}



// ==========================
// COMPRA SIMULADA
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
// INICIAR CONTADOR
// ==========================

actualizarContador();