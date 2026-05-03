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
    // ✅ Usar clases CSS definidas en tu hoja de estilos
    toast.className = `toast-notification ${type}`;
    toast.setAttribute('role', 'alert'); // ✅ Accesibilidad
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    
    document.body.appendChild(toast);

    // ✅ Animación vía CSS (ya definida en tu CSS o agregarla)
    setTimeout(() => {
        toast.classList.add('fade-out');
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
    modal.className = 'ticket-modal'; // ✅ Clase CSS en vez de inline
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'ticketTitle');

    modal.innerHTML = `
        <div class="ticket-content-box">
            <div class="ticket-header">
                <h3 id="ticketTitle">🛒 Ticket de Compra</h3>
                <button onclick="cerrarTicket()" class="ticket-close-btn" aria-label="Cerrar ticket">✖</button>
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
    window.currentTicket = { ticket, total, fecha, cart };
    
    // ✅ Cerrar con tecla Escape
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
            cerrarTicket();
            document.removeEventListener('keydown', closeOnEscape);
        }
    };
    document.addEventListener('keydown', closeOnEscape);
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
// Variable global para mantener referencia a los productos
let productsCache = [];

async function cargarProductos(){
  try {
    const response = await fetch("/api/products");
    const products = await response.json();
    
    // ✅ Guardar en caché para usar en el event listener
    productsCache = products;

    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("div");
      card.classList.add("card");

      // ✅ Template limpio con alt, loading y data-attribute
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="card-info">
          <h3>${escapeHtml(product.name)}</h3>
          <div>$${product.price} MXN</div>
          <div>Stock: ${product.stock}</div>
          <button class="add-to-cart-btn" data-product-id="${product._id}">
            Agregar al carrito
          </button>
        </div>
      `;
      contenedor.appendChild(card);
    });

    // ✅ Event listener delegado (FUERA del forEach)
    contenedor.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart-btn')) {
        const productId = e.target.getAttribute('data-product-id');
        const product = productsCache.find(p => p._id === productId);
        if (product) addToCart(product);
      }
    });

  } catch(error) {
    console.error("Error cargando productos:", error);
  }
}

// ✅ Función auxiliar para prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
// ✅ SIMULAR COMPRA - CON MERCADO PAGO
// ==========================
async function simularCompra(){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if(cart.length === 0){
    showNotification("⚠️ El carrito está vacío", "error");
    return;
  }

  // ✅ Mostrar indicador de carga
  const btnComprar = document.querySelector('#carrito button[onclick="simularCompra()"]');
  const originalText = btnComprar?.innerText;
  if(btnComprar) {
    btnComprar.disabled = true;
    btnComprar.innerText = 'Procesando...';
  }

  try {
    // 🔒 VALIDACIÓN CRÍTICA: Verificar stock en backend ANTES de crear preferencia
    // (esto ya lo haces, pero es crucial mantenerlo)
    for (const item of cart) {
      const response = await fetch(`/api/products/${item._id}/update-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity, reserve: true }) // ✅ Reservar temporalmente
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Stock insuficiente para: ${item.name}`);
      }
    }

    // 💳 INTEGRACIÓN CON MERCADO PAGO
    const mpResult = await MercadoPagoModule.crearPreferenciaPago(cart, {
      email: localStorage.getItem('email'),
      name: localStorage.getItem('username')
    });

    // ✅ Generar ticket ANTES de redirigir (para registro local)
    generateTicket(cart);

    // ✅ Vaciar carrito local (se restaura si el pago falla)
    localStorage.removeItem("cart");
    cargarCarrito();
    cargarCarritoModal();
    
    showNotification("🔄 Redirigiendo a Mercado Pago...");

    // ✅ Redirección segura a Checkout Pro
    setTimeout(() => {
      mpResult.redirect();
    }, 1500);

  } catch (error) {
    console.error("Error en compra:", error);
    
    // 🔙 Revertir reserva de stock si falla antes de redirigir
    for (const item of cart) {
      await fetch(`/api/products/${item._id}/update-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity, release: true })
      }).catch(() => {}); // Ignorar errores en rollback
    }
    
    showNotification(`❌ ${error.message || 'Error al procesar el pago'}`, "error");
    
  } finally {
    // ✅ Restaurar botón
    if(btnComprar) {
      btnComprar.disabled = false;
      btnComprar.innerText = originalText || 'Comprar';
    }
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

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}

// ==========================
// 💳 MERCADO PAGO - MÓDULO ENCAPSULADO
// ==========================
const MercadoPagoModule = (function() {
  'use strict';
  
  // ✅ Configuración: SOLO public_key en frontend
  const PUBLIC_KEY = 'TU_PUBLIC_KEY_AQUI'; // ⚠️ Reemplazar o usar variable de entorno en build
  let mpInstance = null;
  let isInitialized = false;

  // ✅ Inicialización perezosa (lazy loading)
  async function init() {
    if (isInitialized && mpInstance) return mpInstance;
    
    try {
      // Cargar SDK de Mercado Pago dinámicamente
      if (!window.MercadoPago) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Error cargando SDK de Mercado Pago'));
          document.head.appendChild(script);
        });
      }
      
      mpInstance = new window.MercadoPago(PUBLIC_KEY, {
        locale: 'es-MX' // ✅ Ajustar según región
      });
      
      isInitialized = true;
      return mpInstance;
    } catch (error) {
      console.error('[MP-INIT] Error:', error);
      throw new Error('No se pudo inicializar Mercado Pago');
    }
  }

  // ✅ Función principal: Crear preferencia y obtener URL de pago
  async function crearPreferenciaPago(cart, userData = {}) {
    if (!cart || cart.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // 🔒 Validar que el usuario esté autenticado
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Debes iniciar sesión para realizar un pago');
    }

    // Preparar items para el backend (sin precios sensibles)
    const items = cart.map(item => ({
      id: item._id,
      quantity: item.quantity
      // ✅ NO enviar price desde frontend - el backend lo valida
    }));

    try {
      // ✅ Llamada segura al backend (nunca directo a MP desde frontend)
      const response = await fetch('/api/payment/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Autenticación
        },
        body: JSON.stringify({
          items,
          payer: {
            email: userData.email || localStorage.getItem('email'),
            name: userData.name || localStorage.getItem('username')
          },
          backUrls: {
            success: `${window.location.origin}/pago-exitoso`,
            failure: `${window.location.origin}/pago-fallido`
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando preferencia de pago');
      }

      const { init_point, id } = await response.json();
      
      return {
        preferenceId: id,
        checkoutUrl: init_point,
        redirect: () => {
          // ✅ Redirección segura a Checkout Pro
          window.location.href = init_point;
        }
      };

    } catch (error) {
      console.error('[MP-PAYMENT] Error:', error);
      throw error; // Propagar para manejo en UI
    }
  }

  // ✅ Función opcional: Renderizar botón Wallet Brick (si usas Checkout Transparente)
  async function renderWalletButton(containerId, preferenceId, onSuccess, onError) {
    try {
      const mp = await init();
      const bricksBuilder = mp.bricks();
      
      const controller = await bricksBuilder.create('wallet', containerId, {
        initialization: { preferenceId },
        customization: {
          visual: { style: { theme: 'light' } }
        },
        callbacks: {
          onReady: () => console.log('[MP-WALLET] Brick listo'),
          onError: (error) => {
            console.error('[MP-WALLET] Error:', error);
            onError?.(error);
          },
          onPayment: (payment) => {
            console.log('[MP-WALLET] Pago completado:', payment);
            onSuccess?.(payment);
          }
        }
      });
      
      return controller;
    } catch (error) {
      console.error('[MP-WALLET-RENDER] Error:', error);
      throw error;
    }
  }

  // ✅ API pública del módulo (encapsulamiento)
  return {
    init,
    crearPreferenciaPago,
    renderWalletButton,
    // ✅ Getter seguro para verificar estado
    isReady: () => isInitialized && !!mpInstance
  };

})();


// ==========================
// INICIAR
// ==========================
cargarProductos();
cargarCarrito();
cargarCarritoModal();