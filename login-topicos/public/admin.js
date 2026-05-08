// 🔒 Seguridad admin
if(localStorage.getItem("role") !== "admin"){
  window.location.href = "login.html";
}

// Referencias a elementos
const form = document.getElementById("productForm");
const preview = document.getElementById("preview");
const imageInput = document.getElementById("image");
const message = document.getElementById("message");

// Estado de edición
let editingProductId = null;

// Función segura para mensajes
function setMessage(text) {
  if(message) {
    message.innerText = text;
    message.style.display = text ? 'block' : 'none';
  }
}

// 🔐 Helper: obtener headers con token de autorización
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ==========================
// PREVIEW IMAGEN
// ==========================
if(imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if(file && preview){
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  });
}

// ==========================
// CREAR / EDITAR PRODUCTO
// ==========================
if(form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const priceInput = document.getElementById("price");
    const stockInput = document.getElementById("stock");
    
    if(!nameInput || !priceInput || !stockInput) {
      setMessage("❌ Error: Formularios no encontrados");
      return;
    }

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const stock = parseInt(stockInput.value);
    const file = imageInput?.files[0];

    if(!name) {
      setMessage("❌ El nombre es obligatorio");
      return;
    }
    if(isNaN(price) || price <= 0) {
      setMessage("❌ Precio inválido");
      return;
    }
    if(isNaN(stock) || stock < 0) {
      setMessage("❌ Stock inválido");
      return;
    }

    try {
      let imageUrl = null;

      if(file){
        setMessage("📤 Subiendo imagen...");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "anime_store");

        const cloudResponse = await fetch(
          "https://api.cloudinary.com/v1_1/dvmkwrelz/image/upload",
          { method: "POST", body: formData }
        );

        if(!cloudResponse.ok) {
          const errorData = await cloudResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || "Error al subir imagen");
        }

        const cloudData = await cloudResponse.json();
        imageUrl = cloudData.secure_url;
      }

      setMessage(editingProductId ? "✏️ Actualizando producto..." : "💾 Guardando producto...");

      const productData = { name, price, stock };
      
      if(imageUrl) {
        productData.image = imageUrl;
      } else if(editingProductId) {
        const currentImage = document.getElementById("currentImageUrl")?.value;
        if(currentImage) productData.image = currentImage;
      }

      const method = editingProductId ? "PUT" : "POST";
      const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";

      const productResponse = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });

      const data = await productResponse.json();

      if(!productResponse.ok) throw new Error(data.message || "Error en la operación");

      setMessage(editingProductId ? "✅ Producto actualizado" : "✅ Producto creado");
      
      form.reset();
      if(preview) preview.style.display = "none";
      editingProductId = null;
      
      const hiddenInput = document.getElementById("currentImageUrl");
      if(hiddenInput) hiddenInput.remove();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if(submitBtn) submitBtn.textContent = "Crear Producto";
      
      if(typeof cargarProductos === 'function') await cargarProductos();
      if(typeof cargarDashboard === 'function') await cargarDashboard();

    } catch(error) {
      console.error("Error:", error);
      setMessage("❌ " + error.message);
    }
  });
}

// ==========================
// CARGAR PRODUCTOS
// ==========================
async function cargarProductos(){
  try {
    const list = document.getElementById("productList");
    if(!list) return;

    const res = await fetch("/api/products");
    if(!res.ok) throw new Error("Error al cargar productos");
    
    const productos = await res.json();
    list.innerHTML = "";

    if(!productos || productos.length === 0) {
      list.innerHTML = "<p class='text-muted'>No hay productos registrados</p>";
      return;
    }

    productos.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("product-item");
      div.innerHTML = `
        <img src="${p.image || 'placeholder.png'}" alt="${p.name}" onerror="this.src='placeholder.png'">
        <span><strong>${p.name}</strong></span>
        <span>$${parseFloat(p.price).toFixed(2)}</span>
        <span>Stock: ${p.stock}</span>
        <div style="display:flex; gap:5px;">
          <button onclick="editarProducto('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, ${p.stock}, '${p.image}')">✏️</button>
          <button onclick="eliminarProducto('${p._id}')">🗑️</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch(error) {
    console.error("Error cargando productos:", error);
    const list = document.getElementById("productList");
    if(list) list.innerHTML = "<p class='error'>❌ Error al cargar</p>";
  }
}

// ==========================
// EDITAR PRODUCTO
// ==========================
function editarProducto(id, name, price, stock, image) {
  if(!form) return;
  
  const nameInput = document.getElementById("name");
  const priceInput = document.getElementById("price");
  const stockInput = document.getElementById("stock");
  
  if(!nameInput || !priceInput || !stockInput) return;
  
  nameInput.value = name;
  priceInput.value = price;
  stockInput.value = stock;
  
  let hiddenInput = document.getElementById("currentImageUrl");
  if(!hiddenInput) {
    hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "currentImageUrl";
    form.appendChild(hiddenInput);
  }
  hiddenInput.value = image;
  
  if(preview) {
    preview.src = image;
    preview.style.display = "block";
  }
  
  const submitBtn = form.querySelector('button[type="submit"]');
  if(submitBtn) submitBtn.textContent = "✏️ Actualizar";
  
  editingProductId = id;
  setMessage("📝 Editando: " + name);
  form.scrollIntoView({ behavior: "smooth" });
}

// ==========================
// ELIMINAR PRODUCTO
// ==========================
async function eliminarProducto(id){
  if(!confirm("¿Eliminar producto?")) return;

  try {
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    
    if(!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Error al eliminar");
    }
    
    setMessage("🗑️ Producto eliminado");
    
    await cargarProductos();
    await cargarDashboard();
    
    if(editingProductId === id) {
      form.reset();
      if(preview) preview.style.display = "none";
      editingProductId = null;
      const submitBtn = form?.querySelector('button[type="submit"]');
      if(submitBtn) submitBtn.textContent = "Crear Producto";
      const hiddenInput = document.getElementById("currentImageUrl");
      if(hiddenInput) hiddenInput.remove();
      setMessage("");
    }
  } catch(error) {
    console.error("Error eliminando:", error);
    setMessage("❌ " + error.message);
  }
}

// ==========================
// CARRUSEL
// ==========================
async function subirImagenCarrusel(){
  const fileInput = document.getElementById("carouselImage");
  
  if(!fileInput || !fileInput.files.length){
    alert("Selecciona una imagen");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "anime_store");

  try {
    const cloudResponse = await fetch(
      "https://api.cloudinary.com/v1_1/dvmkwrelz/image/upload",
      { method: "POST", body: formData }
    );
    
    if(!cloudResponse.ok) throw new Error("Error al subir a Cloudinary");
    
    const cloudData = await cloudResponse.json();

    await fetch("/api/carousel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cloudData.secure_url })
    });

    cargarCarruselAdmin();
    fileInput.value = "";
  } catch(error) {
    console.error("Error carrusel:", error);
    alert("❌ Error: " + error.message);
  }
}

async function cargarCarruselAdmin(){
  try {
    const list = document.getElementById("carouselList");
    if(!list) return;
    
    const response = await fetch("/api/carousel");
    const images = await response.json();
    list.innerHTML = "";
    
    images.forEach(img => {
      const div = document.createElement("div");
      div.classList.add("carousel-item");
      div.innerHTML = `
        <img src="${img.image}" width="120">
        <button onclick="eliminarImagen('${img._id}')">Eliminar</button>
      `;
      list.appendChild(div);
    });
  } catch(error) {
    console.error("Error cargando carrusel:", error);
  }
}

async function eliminarImagen(id){
  if(!confirm("¿Eliminar imagen del carrusel?")) return;
  
  try {
    await fetch(`/api/carousel/${id}`, { method: "DELETE" });
    cargarCarruselAdmin();
  } catch(error) {
    console.error("Error eliminando imagen:", error);
  }
}

// ==========================
// CHATBOT
// ==========================
async function cargarPreguntas(){
  try{
    const list = document.getElementById("questionsList");
    if(!list) return;
    
    const res = await fetch("/unknown_questions.json");
    const preguntas = await res.json();
    list.innerHTML = "";
    
    preguntas.forEach(p => {
      const li = document.createElement("li");
      li.textContent = p;
      list.appendChild(li);
    });
  } catch{
    console.log("No hay preguntas registradas");
  }
}

// ==========================
// NAVEGACIÓN
// ==========================
function mostrarPanel(panel){
  document.querySelectorAll(".panel").forEach(p => {
    p.classList.add("hidden")
  })
  const panelToShow = document.getElementById(panel);
  if(panelToShow) {
    panelToShow.classList.remove("hidden")
  }
}

function logout(){
  localStorage.clear()
  window.location.href = "login.html"
}

// ==========================
// DASHBOARD (CON TOKEN)
// ==========================
async function cargarDashboard(){
  try{
    // 🔐 Token para requests protegidos
    const token = localStorage.getItem("token");
    const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

    // Total Productos (público)
    const totalProductosEl = document.getElementById("totalProductos");
    if(totalProductosEl) {
      const resProductos = await fetch("/api/products");
      if(resProductos.ok) {
        const productos = await resProductos.json();
        totalProductosEl.innerText = Array.isArray(productos) ? productos.length : "0";
      }
    }

    // Dentro de cargarDashboard(), para totalUsuarios:
    const totalUsuariosEl = document.getElementById("totalUsuarios");
     if(totalUsuariosEl) {
      try {
      const resUsuarios = await fetch("/api/users", { 
      headers: getAuthHeaders()  // ← Token incluido
    });
     if(resUsuarios.ok) {
      const usuarios = await resUsuarios.json();
      totalUsuariosEl.innerText = Array.isArray(usuarios) ? usuarios.length : "0";
    } else {
      totalUsuariosEl.innerText = "0"; // Fallback seguro
    }
  } catch(err) {
    console.warn("⚠️ No se pudo cargar total de usuarios:", err);
    totalUsuariosEl.innerText = "0";
  }
}

    // Total Preguntas (público)
    const totalPreguntasEl = document.getElementById("totalPreguntas");
    if(totalPreguntasEl) {
      try {
        const resPreguntas = await fetch("/unknown_questions.json");
        if(resPreguntas.ok) {
          const preguntas = await resPreguntas.json();
          totalPreguntasEl.innerText = Array.isArray(preguntas) ? preguntas.length : "0";
        }
      } catch(err) {
        totalPreguntasEl.innerText = "0";
      }
    }

  } catch(error){
    console.error("❌ Error cargando dashboard", error);
  }
}

// ==========================
// 👥 GESTIÓN DE USUARIOS (Integración Admin Panel)
// ==========================

// Función segura para mensajes en panel usuarios
function setMessageUsers(text) {
  const msg = document.getElementById("messageUsers");
  if(msg) {
    msg.innerText = text;
    msg.style.display = text ? 'block' : 'none';
    // Auto-ocultar después de 4 segundos
    if(text) setTimeout(() => msg.style.display = 'none', 4000);
  }
}

// ==========================
// CARGAR USUARIOS (CON TOKEN)
// ==========================
async function cargarUsuarios() {
  try {
    const list = document.getElementById("userList");
    if(!list) return;

    list.innerHTML = "<p style='text-align:center'>⏳ Cargando...</p>";

    // 🔐 Obtener token del localStorage (ajusta la clave si usas otra)
    const token = localStorage.getItem("token"); // o "authToken", "access_token", etc.

    const headers = { "Content-Type": "application/json" };
    if(token) {
      headers["Authorization"] = `Bearer ${token}`; // ✅ Enviar token
    }

    // Dentro de cargarUsuarios(), reemplaza el fetch por:
    const res = await fetch("/api/users", { 
    headers: getAuthHeaders()  // ← Incluye el token automáticamente
  });
    
    if(!res.ok) {
      const err = await res.json().catch(() => ({}));
      if(res.status === 403) {
        throw new Error("🔐 Sesión expirada o permisos insuficientes");
      }
      throw new Error(err.message || `Error ${res.status}`);
    }
    
    const usuarios = await res.json();
    list.innerHTML = "";

    if(!usuarios || usuarios.length === 0) {
      list.innerHTML = "<p style='text-align:center; color:#666'>No hay usuarios registrados</p>";
      return;
    }

    // ... [resto del renderizado igual que antes] ...
    const escape = (str) => {
      const div = document.createElement("div");
      div.textContent = str || "";
      return div.innerHTML;
    };

    usuarios.forEach(u => {
      const email = u.email || "";
      const emailDisplay = email.length > 10 
        ? email.substring(0, 3) + "***@" + email.split("@")[1] 
        : "***";

      const item = document.createElement("div");
      item.className = "user-item";
      item.style.cssText = "padding:12px; border:1px solid #ddd; border-radius:8px; background:#fff; display:flex; justify-content:space-between; align-items:center; margin:5px 0;";
      
      item.innerHTML = `
        <div>
          <strong>${escape(u.username || "Sin nombre")}</strong><br>
          <small style="color:#666">${escape(emailDisplay)}</small><br>
          <span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:12px; background:${u.role === 'admin' ? '#dc3545' : '#0d6efd'}; color:white; margin-top:5px;">
            ${escape(u.role || "user")}
          </span>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="editarRolUsuario('${u._id}', '${u.role || "user"}')" 
                  style="padding:6px 12px; background:#0d6efd; color:white; border:none; border-radius:4px; cursor:pointer;">
            ✏️ Rol
          </button>
          <button onclick="eliminarUsuario('${u._id}', '${escape(u.username || "Usuario")}')" 
                  style="padding:6px 12px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">
            🗑️
          </button>
        </div>
      `;
      list.appendChild(item);
    });

  } catch(error) {
    console.error("❌ Error cargando usuarios:", error);
    const list = document.getElementById("userList");
    if(list) {
      list.innerHTML = `<p style="color:#dc3545; text-align:center; padding:20px;">
        ❌ ${error.message}<br>
        <small>${error.message.includes("Sesión") ? 'Intenta iniciar sesión de nuevo' : 'Revisa la consola (F12)'} </small>
      </p>`;
    }
    // Si es error de autenticación, redirigir al login
    if(error.message.includes("Sesión") || error.message.includes("permisos")) {
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "login.html";
      }, 2000);
    }
  }
}

// ==========================
// EDITAR ROL
// ==========================
function editarRolUsuario(userId, currentRole) {
  const roles = ["admin", "user", "moderator"];
  const nuevoRol = prompt(
    `Rol actual: ${currentRole}\n\nOpciones válidas: ${roles.join(", ")}`,
    currentRole
  );
  
  if(!nuevoRol || nuevoRol.trim() === "") return;
  const rolLimpio = nuevoRol.trim().toLowerCase();
  
  if(!roles.includes(rolLimpio)) {
    alert("❌ Rol no válido. Usa: " + roles.join(", "));
    return;
  }
  
  // Confirmación para cambios sensibles
  if(currentRole === "admin" || rolLimpio === "admin") {
    if(!confirm("⚠️ Estás modificando un rol de ADMINISTRADOR.\n¿Confirmar cambio?")) return;
  }
  
  actualizarRolUsuario(userId, rolLimpio);
}

async function actualizarRolUsuario(userId, nuevoRol) {
  try {
    setMessageUsers("🔄 Actualizando...");
    
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nuevoRol })
    });
    
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Error al actualizar");
    
    setMessageUsers("✅ Rol actualizado");
    await cargarUsuarios();
    if(typeof cargarDashboard === "function") await cargarDashboard();
    
  } catch(error) {
    console.error("Error:", error);
    setMessageUsers("❌ " + error.message);
    alert("Error: " + error.message);
  }
}

// ==========================
// ELIMINAR USUARIO
// ==========================
async function eliminarUsuario(userId, username) {
  if(!confirm(`¿Eliminar usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) return;
  
  // Prevenir auto-eliminación
  const currentUsername = localStorage.getItem("username");
  if(username === currentUsername) {
    if(!confirm("⚠️ Estás intentando eliminar TU PROPIA cuenta.\n¿Continuar?")) return;
  }

  try {
    setMessageUsers("🗑️ Eliminando...");
    
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json"
    }});
    
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Error al eliminar");
    
    setMessageUsers("✅ Usuario eliminado");
    await cargarUsuarios();
    if(typeof cargarDashboard === "function") await cargarDashboard();
    
  } catch(error) {
    console.error("Error:", error);
    setMessageUsers("❌ " + error.message);
    alert("Error: " + error.message);
  }
}

// ==========================
// BUSCADOR EN TIEMPO REAL
// ==========================
function setupUserSearch() {
  const search = document.getElementById("userSearch");
  if(!search) return;
  
  search.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll("#userList .user-item");
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(term) ? "flex" : "none";
    });
  });
}

// ==========================
// INICIALIZACIÓN
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Tus inicializaciones existentes...
  if(document.getElementById("productList")) cargarProductos();
  if(document.getElementById("carouselList")) cargarCarruselAdmin();
  if(document.getElementById("questionsList")) cargarPreguntas();
  if(document.getElementById("totalProductos") || document.getElementById("totalUsuarios")) cargarDashboard();
  
  // ✅ Nueva inicialización para usuarios
  setupUserSearch();
});

// Helper global para sanitización (si no existe)
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ==========================
// INICIO
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  if(document.getElementById("productList")) cargarProductos();
  if(document.getElementById("carouselList")) cargarCarruselAdmin();
  if(document.getElementById("questionsList")) cargarPreguntas();
  if(document.getElementById("totalProductos") || document.getElementById("totalUsuarios")) cargarDashboard();
});