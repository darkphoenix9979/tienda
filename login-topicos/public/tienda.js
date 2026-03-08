// ==========================
// CARRUSEL
// ==========================

async function cargarCarrusel(){

const response = await fetch("/api/carousel");

const images = await response.json();

const hero = document.getElementById("heroCarousel");

images.forEach((item,index)=>{

const img=document.createElement("img");

img.src=item.image;

if(index===0) img.classList.add("active");

hero.appendChild(img);

});

let slides=document.querySelectorAll(".hero img");

let i=0;

setInterval(()=>{

slides[i].classList.remove("active");

i=(i+1)%slides.length;

slides[i].classList.add("active");

},5000);

}

cargarCarrusel();


// ==========================
// CARGAR PRODUCTOS
// ==========================

async function cargarProductos(){

const response=await fetch("/api/products");

const products=await response.json();

const contenedor=document.getElementById("productos");

contenedor.innerHTML="";

products.forEach(product=>{

const card=document.createElement("div");

card.classList.add("card");

card.innerHTML=`

<img src="${product.image}">

<div class="card-info">

<h3>${product.name}</h3>

<div>$${product.price} MXN</div>

<button onclick='addToCart(${JSON.stringify(product)})'>
Agregar al carrito
</button>

</div>

`;

contenedor.appendChild(card);

});

}

cargarProductos();


// ==========================
// CARRITO
// ==========================

const cartIcon=document.querySelector(".cart-icon");

const cartModal=document.getElementById("cartModal");

const closeCart=document.getElementById("closeCart");

cartIcon.addEventListener("click",()=>{

cartModal.classList.add("active");

cargarCarrito();

});

closeCart.addEventListener("click",()=>{

cartModal.classList.remove("active");

});


// ==========================
// AGREGAR
// ==========================

function addToCart(product){

let cart=JSON.parse(localStorage.getItem("cart"))||[];

const index=cart.findIndex(i=>i._id===product._id);

if(index!==-1){

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

animarCarrito();

actualizarContador();

cargarCarrito();

}


// ==========================
// ANIMACION
// ==========================

function animarCarrito(){

cartIcon.classList.add("cart-bounce");

setTimeout(()=>{

cartIcon.classList.remove("cart-bounce");

},400);

}


// ==========================
// CONTADOR
// ==========================

function actualizarContador(){

let cart=JSON.parse(localStorage.getItem("cart"))||[];

let total=0;

cart.forEach(i=>{

total+=i.quantity;

});

document.getElementById("cartCount").innerText=total;

}


// ==========================
// MOSTRAR CARRITO
// ==========================

function cargarCarrito(){

let cart=JSON.parse(localStorage.getItem("cart"))||[];

const contenedor=document.getElementById("cartItems");

const totalText=document.getElementById("cartTotal");

contenedor.innerHTML="";

let total=0;

cart.forEach((item,index)=>{

total+=item.price*item.quantity;

const div=document.createElement("div");

div.classList.add("cart-item");

div.innerHTML=`

<img src="${item.image}">

<div class="cart-info">

${item.name}

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

totalText.innerText="Total: $"+total+" MXN";

}


// ==========================
// CANTIDAD
// ==========================

function cambiarCantidad(index,cambio){

let cart=JSON.parse(localStorage.getItem("cart"))||[];

cart[index].quantity+=cambio;

if(cart[index].quantity<=0){

cart.splice(index,1);

}

localStorage.setItem("cart",JSON.stringify(cart));

cargarCarrito();

actualizarContador();

}


// ==========================
// VACIAR
// ==========================

function vaciarCarrito(){

localStorage.removeItem("cart");

cargarCarrito();

actualizarContador();

}


// ==========================
// COMPRA
// ==========================

function simularCompra(){

let cart=JSON.parse(localStorage.getItem("cart"))||[];

if(cart.length===0){

alert("El carrito está vacío");

return;

}

alert("Compra realizada 🎉");

localStorage.removeItem("cart");

cargarCarrito();

actualizarContador();

}


// ==========================
// INICIAR
// ==========================

actualizarContador();