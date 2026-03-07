// Protección login
if(!localStorage.getItem("token")){
    window.location.href="login.html";
}

// Bloquear volver atrás después de logout
window.addEventListener("pageshow", function (event) {
    if (!localStorage.getItem("token")) {
        window.location.href = "login.html";
    }
});

// Carrusel
async function cargarCarrusel() {
  try {
    const response = await fetch("/api/carousel");
    const images = await response.json();

    const hero = document.getElementById("heroCarousel");

    images.forEach((item, index) => {
      const img = document.createElement("img");
      img.src = item.image;
      if(index === 0) img.classList.add("active");
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

  setInterval(()=>{
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
  }, 5000);
}

cargarCarrusel();

// Usuario
const username = localStorage.getItem("username") || "Usuario";
document.getElementById("usernameDisplay").innerText = username;
document.getElementById("avatar").innerText = username.charAt(0).toUpperCase();

// Dropdown
const userMenu = document.getElementById("userMenu");
const dropdown = document.getElementById("dropdown");
const arrow = document.getElementById("arrow");

userMenu.addEventListener("click", ()=>{
    dropdown.classList.toggle("active");
    arrow.style.transform = dropdown.classList.contains("active") ? "rotate(180deg)" : "rotate(0deg)";
});

function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href="login.html";
}

// Cargar productos dinámicamente
async function cargarProductos() {
  try {
    const response = await fetch("/api/products");
    const products = await response.json();

    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${product.image}">
        <div class="card-info">
            ${product.name}
            <div class="price">$${product.price} MXN</div>
        </div>
      `;

      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// Función para agregar producto al carrito
async function addToCart(productId){
    try {
        const response = await fetch("/api/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        if(response.ok){
            cargarCarrito();
        } else {
            const data = await response.json();
            alert(data.message || "Error agregando al carrito");
        }
    } catch(err){
        console.error(err);
    }
}

// Mostrar carrito
async function cargarCarrito(){
    try{
        const response = await fetch("/api/cart",{
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });
        const cart = await response.json();
        const contenedor = document.getElementById("carrito");
        contenedor.innerHTML = "";

        if(!cart || !cart.products) return;

        cart.products.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <img src="${item.productId.image}">
                <div class="card-info">
                    ${item.productId.name} - $${item.productId.price} MXN
                    <div class="quantity-control">
                        <button onclick="updateQuantity('${item.productId._id}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.productId._id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button onclick="updateQuantity('${item.productId._id}', 0)">Eliminar</button>
                </div>
            `;
            contenedor.appendChild(card);
        });

    } catch(err){
        console.error(err);
    }
}

// Actualizar cantidad o eliminar
async function updateQuantity(productId, quantity){
    try{
        const response = await fetch("/api/cart/update",{
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+localStorage.getItem("token")
            },
            body: JSON.stringify({productId, quantity})
        });
        if(response.ok){
            cargarCarrito();
        }
    }catch(err){
        console.error(err);
    }
}

// Vaciar carrito
document.getElementById("clearCartBtn").addEventListener("click", async ()=>{
    try{
        const response = await fetch("/api/cart/clear",{
            method:"DELETE",
            headers:{
                "Authorization":"Bearer "+localStorage.getItem("token")
            }
        });
        if(response.ok){
            cargarCarrito();
        }
    }catch(err){
        console.error(err);
    }
});

// Modificar la función cargarProductos para agregar botón "Agregar al carrito"
async function cargarProductos() {
  try {
    const response = await fetch("/api/products");
    const products = await response.json();

    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${product.image}">
        <div class="card-info">
            ${product.name}
            <div class="price">$${product.price} MXN</div>
            <button onclick="addToCart('${product._id}')">Agregar al carrito</button>
        </div>
      `;

      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

cargarProductos();
cargarCarrito();
cargarProductos();