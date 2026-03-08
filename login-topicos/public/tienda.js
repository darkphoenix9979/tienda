document.addEventListener("DOMContentLoaded",()=>{

/* LOGIN */

const username = localStorage.getItem("username")
const token = localStorage.getItem("token")

const usernameDisplay = document.getElementById("usernameDisplay")
const avatar = document.getElementById("avatar")
const dropdown = document.getElementById("dropdown")

if(token && username){

usernameDisplay.innerText=username
avatar.innerText=username[0].toUpperCase()

dropdown.innerHTML=`<button class="menu-btn" onclick="logout()">Cerrar sesión</button>`

}else{

dropdown.innerHTML=`<button class="menu-btn" onclick="login()">Iniciar sesión</button>`

}

/* USER MENU */

document.getElementById("userMenu").onclick=()=>{

dropdown.classList.toggle("active")

}


/* PRODUCTOS */

const productos=[

{_id:1,name:"Figura Naruto",price:500,image:"https://i.imgur.com/1.png",rating:5},
{_id:2,name:"Katana Zoro",price:900,image:"https://i.imgur.com/2.png",rating:4},
{_id:3,name:"Figura Goku",price:700,image:"https://i.imgur.com/3.png",rating:5},
{_id:4,name:"Figura Luffy",price:650,image:"https://i.imgur.com/4.png",rating:4}

]

mostrarProductos(productos)


/* BUSCADOR */

document.getElementById("searchInput").addEventListener("input",e=>{

const texto=e.target.value.toLowerCase()

const filtrados=productos.filter(p=>
p.name.toLowerCase().includes(texto)
)

mostrarProductos(filtrados)

})


actualizarContador()

})


/* MOSTRAR PRODUCTOS */

function mostrarProductos(lista){

const cont=document.getElementById("productsContainer")

cont.innerHTML=""

lista.forEach(p=>{

const div=document.createElement("div")

div.className="product"

div.innerHTML=`

<img src="${p.image}">

<h3>${p.name}</h3>

<div class="rating">${"⭐".repeat(p.rating)}</div>

<p>$${p.price}</p>

<button class="add-btn" onclick='addToCart(${JSON.stringify(p)})'>
Agregar
</button>

`

cont.appendChild(div)

})

}


/* LOGIN SIMPLE */

function login(){

const name=prompt("Ingresa tu nombre")

if(name){

localStorage.setItem("username",name)
localStorage.setItem("token","123")

location.reload()

}

}

function logout(){

localStorage.clear()
location.reload()

}


/* CARRITO */

function addToCart(product){

let cart=JSON.parse(localStorage.getItem("cart"))||[]

const index=cart.findIndex(i=>i._id===product._id)

if(index!=-1){

cart[index].quantity++

}else{

product.quantity=1
cart.push(product)

}

localStorage.setItem("cart",JSON.stringify(cart))

animarCarrito()
actualizarContador()

}


function actualizarContador(){

let cart=JSON.parse(localStorage.getItem("cart"))||[]

let total=0

cart.forEach(i=>total+=i.quantity)

document.getElementById("cartCount").innerText=total

}


/* ANIMACION */

function animarCarrito(){

const icon=document.getElementById("cartIcon")

icon.classList.add("bounce")

setTimeout(()=>icon.classList.remove("bounce"),400)

}


/* ABRIR CARRITO */

document.addEventListener("click",e=>{

if(e.target.id==="cartIcon"){

document.getElementById("cartModal").classList.add("active")
cargarCarrito()

}

if(e.target.id==="closeCart"){

document.getElementById("cartModal").classList.remove("active")

}

})


/* MOSTRAR CARRITO */

function cargarCarrito(){

let cart=JSON.parse(localStorage.getItem("cart"))||[]

const cont=document.getElementById("cartItems")

cont.innerHTML=""

let total=0

cart.forEach((item,index)=>{

total+=item.price*item.quantity

const div=document.createElement("div")

div.className="cart-item"

div.innerHTML=`

<img src="${item.image}">

<div>

${item.name}

<div>$${item.price}</div>

<div class="qty">

<button onclick="cambiarCantidad(${index},-1)">-</button>
${item.quantity}
<button onclick="cambiarCantidad(${index},1)">+</button>

</div>

</div>

`

cont.appendChild(div)

})

document.getElementById("cartTotal").innerText="Total: $"+total

}


/* CANTIDAD */

function cambiarCantidad(index,cambio){

let cart=JSON.parse(localStorage.getItem("cart"))||[]

cart[index].quantity+=cambio

if(cart[index].quantity<=0) cart.splice(index,1)

localStorage.setItem("cart",JSON.stringify(cart))

cargarCarrito()
actualizarContador()

}


/* VACIAR */

function vaciarCarrito(){

localStorage.removeItem("cart")

cargarCarrito()
actualizarContador()

}


/* COMPRA */

function simularCompra(){

alert("Compra realizada 🎉")

localStorage.removeItem("cart")

cargarCarrito()
actualizarContador()

}