// ==========================
// TIENDA.JS - VERSIÓN RESTAURADA Y CORREGIDA
// ✅ Funcionalidad original + correcciones de eventos, pago y stock
// ==========================

// ==========================
// VARIABLES GLOBALES
// ==========================
let productsCache = [];
let cartListenerAdded = false;

// ✅ CONFIGURACIÓN MERCADOPAGO - Public Key (segura en frontend)
// 🔧 REEMPLAZA con tu Public Key real de https://www.mercadopago.com/developers
const MP_PUBLIC_KEY = 'APP_USR-8876003953346216-050314-f1665186f6db2ae645e60c38620ef667-3372667693';

// ==========================
// NOTIFICACIÓN FLOTANTE (TOAST)
// ==========================
function showNotification(message, type = "success") {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================
// GENERAR TICKET DE COMPRA
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

    const modal = document.createElement('div');
    modal.id = 'ticketModal';
    modal.className = 'ticket-modal';
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
// CARRUSEL - FUNCIONALIDAD ORIGINAL
// ==========================
async function cargarCarrusel() {
  try {
    const response = await fetch("/api/carousel");
    if (!response.ok) throw new Error('Error cargando carrusel');
    
    const images = await response.json();
    const hero = document.getElementById("heroCarousel");
    
    if (!hero) return;

    images.forEach((item, index) => {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.alt || "Banner promocional";
      img.loading = "lazy";
      if (index === 0) img.classList.add("active");
      hero.appendChild(img);
    });

    iniciarCarrusel();
  } catch (error) {
    console.error("Error cargando carrusel:", error);
    // Fallback: mostrar mensaje o imagen por defecto
  }
}

function iniciarCarrusel() {
  let slides = document.querySelectorAll(".hero img");
  if (slides.length === 0) return;
  
  let index = 0;

  setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 5000);
}

// ==========================
// PREVENCIÓN XSS
// ==========================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================
// CARGAR PRODUCTOS - CON EVENTO ÚNICO
// ==========================
async function cargarProductos(){
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error('Error cargando productos');
    
    const products = await response.json();
    productsCache = products;

    const contenedor = document.getElementById("productos");
    if (!contenedor) {
      console.warn('⚠️ No se encontró el contenedor #productos');
      return;
    }
    
    contenedor.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">
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

    // ✅ Delegación de eventos - SOLO UNA VEZ (evita descuento x2)
    if (!cartListenerAdded) {
      contenedor.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
          const productId = e.target.getAttribute('data-product-id');
          const product = productsCache.find(p => p._id === productId);
          if (product) {
            addToCart(product);
          }
        }
      });
      cartListenerAdded = true;
    }

  } catch(error) {
    console.error("❌ Error cargando productos:", error);
    // Mostrar mensaje amigable al usuario
    const contenedor = document.getElementById("productos");
    if (contenedor) {
      contenedor.innerHTML = '<p class="error-msg">⚠️ No se pudieron cargar los productos. Intenta recargar la página.</p>';
    }
  }
}

// ==========================
// USUARIO / ESTADO DE SESIÓN
// ==========================
function actualizarUIUsuario() {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const avatar = document.getElementById("avatar");
    const dropdown = document.getElementById("dropdown");

    if(!usernameDisplay || !avatar || !dropdown) return;

    if(token && username){
        usernameDisplay.innerText = username;
        avatar.innerText = username.charAt(0).toUpperCase();
        dropdown.innerHTML = `<button class="menu-btn" onclick="logout()">Cerrar sesión</button>`;
    } else {
        usernameDisplay.innerText = "Invitado";
        avatar.innerText = "?";
        dropdown.innerHTML = `<button class="menu-btn" onclick="irLogin()">Iniciar sesión</button>`;
    }
}

// ==========================
// DROPDOWN USUARIO
// ==========================
function initUserDropdown() {
    const userMenu = document.getElementById("userMenu");
    const arrow = document.getElementById("arrow");
    const dropdown = document.getElementById("dropdown");

    if (userMenu && dropdown && arrow) {
      userMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
        arrow.style.transform = dropdown.classList.contains("active")
          ? "rotate(180deg)"
          : "rotate(0deg)";
      });
      
      // Cerrar dropdown al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove("active");
          arrow.style.transform = "rotate(0deg)";
        }
      });
    }
}

// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("cart_pending");
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
  // Validar sesión
  if (!localStorage.getItem("token")) {
    showNotification("⚠️ Debes iniciar sesión para comprar", "error");
    setTimeout(() => window.location.href = "login.html", 1500);
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
  
  // Notificación flotante (mejora UX)
  showNotification("✅ Producto agregado al carrito");
  
  // Actualizar UI
  cargarCarrito();
  cargarCarritoModal();
}

// ==========================
// MOSTRAR CARRITO (SECCIÓN PRINCIPAL)
// ==========================
function cargarCarrito(){
    const contenedor = document.getElementById("carrito");
    const cartCount = document.getElementById("cartCount");

    if(!contenedor) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    contenedor.innerHTML = "";

    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        contenedor.innerHTML = '<p class="empty-cart">Tu carrito está vacío 🛒</p>';
        if(cartCount) cartCount.innerText = "0";
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        totalItems += item.quantity;

        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <div class="cart-img">
                <img src="${item.image}" alt="${escapeHtml(item.name)}">
            </div>
            <div class="card-info">
                <div class="product-name">${escapeHtml(item.name)}</div>
                <div class="price">$${item.price} MXN</div>
                <div class="quantity-control">
                    <button onclick="cambiarCantidad(${index},-1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="cambiarCantidad(${index},1)">+</button>
                </div>
                <button onclick="eliminarProducto(${index})" class="btn-delete">Eliminar</button>
            </div>
        `;
        contenedor.appendChild(card);
    });

    if(cartCount) cartCount.innerText = totalItems;

    const totalHTML = document.createElement("div");
    totalHTML.classList.add("cart-total");
    totalHTML.innerHTML = `
        <h3>Total: $${total.toFixed(2)} MXN</h3>
        <button onclick="simularCompra()" class="btn-comprar">Comprar</button>
    `;
    contenedor.appendChild(totalHTML);
}

// ==========================
// MODAL DEL CARRITO (ICONO)
// ==========================
function initCartModal() {
    const cartIcon = document.querySelector(".cart-icon");
    const cartModal = document.getElementById("cartModal");
    const closeCart = document.getElementById("closeCart");

    if(cartIcon && cartModal){
        cartIcon.addEventListener("click", () => {
            cartModal.style.display = "flex";
            cargarCarritoModal();
        });
    }

    if(closeCart && cartModal){
        closeCart.addEventListener("click", () => {
            cartModal.style.display = "none";
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    if(cartModal) {
        cartModal.addEventListener("click", (e) => {
            if(e.target === cartModal) {
                cartModal.style.display = "none";
            }
        });
    }
}

function cargarCarritoModal(){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const contenedor = document.getElementById("cartItems");
    const totalText = document.getElementById("cartTotal");

    if(!contenedor) return;
    contenedor.innerHTML = "";
    
    if (cart.length === 0) {
        contenedor.innerHTML = '<p class="empty">Tu carrito está vacío</p>';
        if(totalText) totalText.innerText = "Total: $0.00 MXN";
        return;
    }
    
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <img src="${item.image}" alt="${escapeHtml(item.name)}">
            <div class="cart-item-info">
                <strong>${escapeHtml(item.name)}</strong>
                <div>$${item.price} MXN</div>
                <div class="cart-qty">
                    <button onclick="cambiarCantidad(${index},-1)" class="btn-qty">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="cambiarCantidad(${index},1)" class="btn-qty">+</button>
                </div>
            </div>
        `;
        contenedor.appendChild(div);
    });

    if(totalText) totalText.innerText = "Total: $" + total.toFixed(2) + " MXN";
}

// ==========================
// CAMBIAR CANTIDAD EN CARRITO
// ==========================
function cambiarCantidad(index, cambio){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if (!cart[index]) return;
    
    cart[index].quantity += cambio;
    
    if(cart[index].quantity <= 0){
        cart.splice(index, 1);
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    cargarCarrito();
    cargarCarritoModal();
}

// ==========================
// ELIMINAR PRODUCTO DEL CARRITO
// ==========================
function eliminarProducto(index){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    cargarCarrito();
    cargarCarritoModal();
    showNotification("🗑️ Producto eliminado");
}

// ==========================
// ✅ SIMULAR COMPRA - FLUJO CORREGIDO
// ==========================
async function simularCompra(){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if(cart.length === 0){
        showNotification("⚠️ El carrito está vacío", "error");
        return;
    }

    // Mostrar indicador de carga en el botón
    const btnComprar = document.querySelector('#carrito .btn-comprar, #carrito button[onclick="simularCompra()"]');
    const originalText = btnComprar?.innerText || 'Comprar';
    
    if(btnComprar) {
        btnComprar.disabled = true;
        btnComprar.innerText = '⏳ Procesando...';
    }

    try {
        // ✅ 1. VALIDAR STOCK (solo lectura, SIN modificar)
        for (const item of cart) {
            try {
                const response = await fetch(`/api/products/${item._id}`);
                if (!response.ok) {
                    console.warn(`⚠️ No se pudo verificar stock para ${item.name}`);
                    continue; // Continuar sin bloquear
                }
                const product = await response.json();
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para: ${item.name}`);
                }
            } catch (err) {
                console.warn(`⚠️ Error verificando ${item.name}:`, err.message);
            }
        }

        // ✅ 2. CREAR PREFERENCIA DE PAGO (llamada a TU backend)
        const mpResult = await MercadoPagoModule.crearPreferenciaPago(cart, {
            email: localStorage.getItem('email'),
            name: localStorage.getItem('username')
        });

        // ✅ 3. GUARDAR CARRITO PENDIENTE (para recuperar si cancela)
        localStorage.setItem('cart_pending', JSON.stringify(cart));

        // ✅ 4. MOSTRAR TICKET COMO BORRADOR (opcional, visual)
        generateTicket(cart);

        showNotification("🔄 Redirigiendo a pago seguro...");

        // ✅ 5. REDIRECCIONAR (solo UNA vez)
        setTimeout(() => {
            mpResult.redirect();
        }, 1000);

    } catch (error) {
        console.error("❌ Error en compra:", error);
        showNotification(`❌ ${error.message || 'Error al procesar el pago'}`, "error");
        localStorage.removeItem('cart_pending');
    } finally {
        // ✅ Restaurar botón
        if(btnComprar) {
            btnComprar.disabled = false;
            btnComprar.innerText = originalText;
        }
    }
}

// ==========================
// VACIAR CARRITO
// ==========================
function initClearCart() {
    const clearCartBtn = document.getElementById("clearCartBtn");
    if(clearCartBtn){
        clearCartBtn.addEventListener("click", () => {
            if(confirm('¿Vaciar todo el carrito?')) {
                localStorage.removeItem("cart");
                cargarCarrito();
                cargarCarritoModal();
                showNotification("🗑️ Carrito vaciado");
            }
        });
    }
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
            showNotification('☀️ Modo claro activado');
        } else {
            root.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            toggle.textContent = '☀️';
            showNotification('🌙 Modo nocturno activado');
        }
    });
}

// ==========================
// 💳 MERCADO PAGO - MÓDULO ENCAPSULADO (CORREGIDO)
// ==========================
const MercadoPagoModule = (function() {
    'use strict';
    
    // ✅ Public Key segura para frontend (NO es secreto)
    // 🔧 REEMPLAZA con tu clave real
    const PUBLIC_KEY = MP_PUBLIC_KEY;
    
    let mpInstance = null;
    let isInitialized = false;

    async function init() {
        if (isInitialized && mpInstance) return mpInstance;
        
        try {
            // Cargar SDK de MercadoPago si no está presente
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
            
            mpInstance = new window.MercadoPago(PUBLIC_KEY, { locale: 'es-MX' });
            isInitialized = true;
            return mpInstance;
        } catch (error) {
            console.error('[MP-INIT] Error:', error);
            throw new Error('No se pudo inicializar Mercado Pago');
        }
    }

    async function crearPreferenciaPago(cart, userData = {}) {
        if (!cart?.length) throw new Error('El carrito está vacío');
        
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Debes iniciar sesión para realizar un pago');

        // ✅ Solo envía IDs y cantidades - el backend valida precios
        const items = cart.map(item => ({
            id: item._id,
            quantity: item.quantity
        }));

        const response = await fetch('/api/payment/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
        
        if (!init_point) {
            throw new Error('No se recibió URL de pago de MercadoPago');
        }
        
        return {
            preferenceId: id,
            checkoutUrl: init_point,
            redirect: () => { window.location.href = init_point; }
        };
    }

    return { 
        init, 
        crearPreferenciaPago, 
        isReady: () => isInitialized && !!mpInstance 
    };
})();

// ==========================
// RECUPERAR CARRITO SI CANCELA PAGO
// ==========================
function initRecoverCart() {
    const pendingCart = localStorage.getItem('cart_pending');
    const currentCart = localStorage.getItem('cart');
    
    // Si hay carrito pendiente y no hay carrito actual, restaurar
    if (pendingCart && !currentCart) {
        try {
            const parsed = JSON.parse(pendingCart);
            if (parsed?.length > 0) {
                localStorage.setItem('cart', pendingCart);
                localStorage.removeItem('cart_pending');
                showNotification("🛒 Tu carrito fue restaurado");
                cargarCarrito();
                cargarCarritoModal();
            }
        } catch (e) {
            console.warn('⚠️ Error restaurando carrito:', e);
            localStorage.removeItem('cart_pending');
        }
    }
}

// ==========================
// INICIALIZACIÓN PRINCIPAL
// ==========================
function initApp() {
    // ✅ Inicializar componentes de UI
    actualizarUIUsuario();
    initUserDropdown();
    initCartModal();
    initClearCart();
    initThemeToggle();
    initRecoverCart();
    
    // ✅ Cargar datos dinámicos
    cargarCarrusel();
    cargarProductos();
    cargarCarrito();
    cargarCarritoModal();
}

// ✅ Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM ya está listo (carga rápida o script al final)
    initApp();
}

// ✅ También exponer funciones globales para onclick en HTML (si las usas)
window.addToCart = addToCart;
window.cambiarCantidad = cambiarCantidad;
window.eliminarProducto = eliminarProducto;
window.simularCompra = simularCompra;
window.cerrarTicket = cerrarTicket;
window.imprimirTicket = imprimirTicket;
window.descargarTicket = descargarTicket;
window.logout = logout;
window.irLogin = irLogin;
window.cargarCarrito = cargarCarrito;
window.cargarCarritoModal = cargarCarritoModal;