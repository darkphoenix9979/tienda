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
// NOTIFICACIÓN FLOTANTE (TOAST) - MEJORA #1
// ==========================
function showNotification(message, type = "success") {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    // ✅ Usa variables CSS en lugar de colores fijos
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--toast-success, #22c55e)' : 'var(--toast-error, #ef4444)'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px var(--shadow-card, rgba(0,0,0,0.15));
        z-index: 9999;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        transition: background-color 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(150px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================
// GENERAR TICKET DE COMPRA - MEJORA #4
// ==========================
function generateTicket(cart) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const fecha = new Date().toLocaleString('es-MX', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });

    const ticket = `
╔════════════════════════════════╗
║     🛒 TICKET DE COMPRA        ║
╠════════════════════════════════╣
║ Fecha: ${fecha}
║ Usuario: ${localStorage.getItem("username") || "Invitado"}
╠════════════════════════════════╣
║ DETALLES:
╟────────────────────────────────╢
${cart.map(item => 
    `║ • ${item.name.substring(0, 25).padEnd(25)} ║
║   $${item.price} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)} MXN`
).join('\n')}
╠════════════════════════════════╣
║ TOTAL: $${total.toFixed(2)} MXN
╚════════════════════════════════╝
    `;

    // Mostrar en modal// Dentro de generateTicket(), reemplaza la creación del modal por esto:

// Mostrar en modal
const modal = document.createElement('div');
modal.id = 'ticketModal';
modal.className = 'ticket-modal';
modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: var(--modal-overlay, rgba(0,0,0,0.7));
    display: flex; justify-content: center;
    align-items: center; z-index: 10000; font-family: monospace;
`;

modal.innerHTML = `
    <div class="ticket-content-box">
        <div class="ticket-header">
            <h3>🛒 Ticket de Compra</h3>
            <button onclick="cerrarTicket()" class="ticket-close-btn">✖</button>
        </div>
        <pre class="ticket-text">${ticket}</pre>
        <div class="ticket-actions">
            <button onclick="imprimirTicket()" class="ticket-btn ticket-btn-success">🖨️ Imprimir</button>
            <button onclick="descargarTicket()" class="ticket-btn ticket-btn-info">💾 Descargar</button>
            <button onclick="cerrarTicket()" class="ticket-btn ticket-btn-close">Cerrar</button>
        </div>
    </div>
`;

document.body.appendChild(modal);

    // Guardar para imprimir/descargar
    window.currentTicket = { ticket, total, fecha, cart };
}

function cerrarTicket() {
    const modal = document.getElementById('ticketModal');
    if (modal) modal.remove();
}

function imprimirTicket() {
    if (!window.currentTicket) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Ticket de Compra</title>
        <style>body{font-family:monospace; white-space:pre; padding:20px;}</style>
        </head><body>${window.currentTicket.ticket}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function descargarTicket() {
    if (!window.currentTicket) return;
    const blob = new Blob([window.currentTicket.ticket], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

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
// AGREGAR AL CARRITO - MEJORA #1 (Notificación flotante)
// ==========================
function addToCart(product) {

  if (!localStorage.getItem("token")) {
    showNotification("⚠️ Debes iniciar sesión para comprar", "error");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
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

  // ✅ MEJORA #1: Notificación flotante en lugar de alert
  showNotification("✅ Producto agregado al carrito");

  cargarCarrito();
  cargarCarritoModal();
}

// ==========================
// MOSTRAR CARRITO (SECCIÓN)
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
<h3>Total: $${total.toFixed(2)} MXN</h3>
<button onclick="simularCompra()">Comprar</button>
`;

contenedor.appendChild(totalHTML);

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
totalText.innerText = "Total: $" + total.toFixed(2) + " MXN";
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
// SIMULAR COMPRA - MEJORAS #2 y #4
// ==========================
async function simularCompra(){

let cart = JSON.parse(localStorage.getItem("cart")) || [];

if(cart.length === 0){
    showNotification("⚠️ El carrito está vacío", "error");
    return;
}

try {
    // ✅ MEJORA #2: Actualizar stock de cada producto en la BD
    for (const item of cart) {
        const response = await fetch(`/api/products/${item._id}/update-stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: item.quantity })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error actualizando stock");
        }
    }

    // ✅ MEJORA #4: Generar ticket antes de vaciar carrito
    generateTicket(cart);

    // ✅ Vaciar carrito
    localStorage.removeItem("cart");
    cargarCarrito();
    cargarCarritoModal();
    
    showNotification("🎉 Compra realizada con éxito");

    // ✅ Recargar productos para ver stock actualizado
    cargarProductos();

} catch (error) {
    console.error("Error en compra:", error);
    showNotification("❌ Error al procesar la compra", "error");
}

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
// 🌙/☀️ TOGGLE MODO OSCURO/CLARO
// ==========================
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  
  if (!toggle) return;
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    root.setAttribute('data-theme', 'light');
    toggle.textContent = '🌙';
  } else {
    toggle.textContent = '☀️';
  }

  toggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') !== 'light';
    if (isDark) {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      toggle.textContent = '🌙';
      if (typeof showNotification === 'function') {
        showNotification('☀️ Modo claro activado');
      }
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      toggle.textContent = '☀️';
      if (typeof showNotification === 'function') {
        showNotification('🌙 Modo nocturno activado');
      }
    }
  });
}

// ==========================
// ⌨️ NAVEGACIÓN POR TECLADO
// ==========================

function initKeyboardNavigation() {
    console.log('⌨️ Navegación por teclado inicializada');
    
    // 1. Indicadores de foco visibles para accesibilidad
    const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(el => {
        el.addEventListener('focus', () => {
            el.classList.add('keyboard-focus');
        });
        el.addEventListener('blur', () => {
            el.classList.remove('keyboard-focus');
        });
    });
    
    // 2. Atajos de teclado globales
    document.addEventListener('keydown', (e) => {
        // Ignorar si el usuario está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // === ATAJOS GLOBALES ===
        
        // 'C' = Abrir/Cerrar Carrito
        if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            const cartModal = document.getElementById('cartModal');
            const cartIcon = document.querySelector('.cart-icon');
            if (cartModal && cartIcon) {
                if (cartModal.style.display === 'flex') {
                    cartModal.style.display = 'none';
                } else {
                    cartModal.style.display = 'flex';
                    if (typeof cargarCarritoModal === 'function') {
                        cargarCarritoModal();
                    }
                }
                showNotification('🛒 Carrito ' + (cartModal.style.display === 'flex' ? 'abierto' : 'cerrado'));
            }
        }
        
        // 'T' = Cambiar Tema (Oscuro/Claro)
        if (e.key === 't' || e.key === 'T') {
            e.preventDefault();
            const toggle = document.getElementById('theme-toggle');
            if (toggle) {
                toggle.click();
            }
        }
        
        // 'Escape' = Cerrar modales
        if (e.key === 'Escape') {
            e.preventDefault();
            
            // Cerrar modal del carrito
            const cartModal = document.getElementById('cartModal');
            if (cartModal && cartModal.style.display === 'flex') {
                cartModal.style.display = 'none';
                showNotification('🛒 Carrito cerrado');
            }
            
            // Cerrar modal del ticket
            const ticketModal = document.getElementById('ticketModal');
            if (ticketModal) {
                ticketModal.remove();
                showNotification('🎫 Ticket cerrado');
            }
            
            // Cerrar dropdown de usuario
            const dropdown = document.getElementById('dropdown');
            if (dropdown && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
                const arrow = document.getElementById('arrow');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }
        
        // 'Enter' en elementos focuseados = Activar click
        if (e.key === 'Enter') {
            const focused = document.activeElement;
            if (focused && (focused.tagName === 'BUTTON' || focused.classList.contains('card'))) {
                focused.click();
            }
        }
        
        // '/' = Enfocar búsqueda (si existe)
        if (e.key === '/') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="text"], input[type="search"]');
            if (searchInput) {
                searchInput.focus();
                showNotification('🔍 Búsqueda enfocada (escribe para buscar)');
            }
        }
        
        // '1-4' = Navegar a secciones del navbar
        if (e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const navLinks = document.querySelectorAll('.nav-links span');
            const index = parseInt(e.key) - 1;
            if (navLinks[index]) {
                navLinks[index].click();
                showNotification('📍 Navegando a: ' + navLinks[index].textContent);
            }
        }
    });
    
    // 3. Navegación entre tarjetas de productos con flechas
    const productRow = document.querySelector('#productos.row');
    if (productRow) {
        productRow.addEventListener('keydown', (e) => {
            const cards = productRow.querySelectorAll('.card');
            const currentIndex = Array.from(cards).findIndex(card => card === document.activeElement);
            
            if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
                e.preventDefault();
                cards[currentIndex + 1].focus();
            }
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                e.preventDefault();
                cards[currentIndex - 1].focus();
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardNavigation);
} else {
    initKeyboardNavigation();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}


// ==========================
// INICIAR
// ==========================
cargarProductos();
cargarCarrito();
cargarCarritoModal();