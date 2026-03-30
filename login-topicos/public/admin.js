// 🔒 seguridad admin
if(localStorage.getItem("role") !== "admin"){
  window.location.href = "login.html";
}

const form = document.getElementById("productForm");
const preview = document.getElementById("preview");
const imageInput = document.getElementById("image");
const message = document.getElementById("message");

// Variable para controlar si estamos editando (nuevo)
let editingProductId = null;

// ==========================
// PREVIEW IMAGEN
// ==========================
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if(file){
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// ==========================
// CREAR / EDITAR PRODUCTO
// ==========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  // ✅ FIX: Convertir a números para que el backend los reciba correctamente
  const price = parseFloat(document.getElementById("price").value);
  const stock = parseInt(document.getElementById("stock").value);
  const file = imageInput.files[0];

  // Validaciones básicas
  if(!name) {
    message.innerText = "❌ El nombre es obligatorio";
    return;
  }
  if(isNaN(price) || price <= 0) {
    message.innerText = "❌ Precio inválido";
    return;
  }
  if(isNaN(stock) || stock < 0) {
    message.innerText = "❌ Stock inválido";
    return;
  }

  try {
    let imageUrl = null;

    // Solo subir imagen si hay una nueva seleccionada
    if(file){
      message.innerText = "📤 Subiendo imagen...";
      
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

    message.innerText = editingProductId ? "✏️ Actualizando producto..." : "💾 Guardando producto...";

    // Preparar datos del producto
    const productData = {
      name,
      price,      // ✅ Ahora es número
      stock       // ✅ Ahora es número
    };
    
    // Incluir imagen: nueva subida O la existente si no se cambió
    if(imageUrl) {
      productData.image = imageUrl;
    } else if(editingProductId) {
      // Si estamos editando y no hay nueva imagen, mantener la actual
      const currentImage = document.getElementById("currentImageUrl")?.value;
      if(currentImage) productData.image = currentImage;
    }

    // Determinar método y URL según si es edición o creación
    const method = editingProductId ? "PUT" : "POST";
    const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";

    const productResponse = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json"
        // Si tu backend usa JWT, descomenta:
        // "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(productData)
    });

    const data = await productResponse.json();

    if(!productResponse.ok) throw new Error(data.message || "Error en la operación");

    message.innerText = editingProductId ? "✅ Producto actualizado" : "✅ Producto creado";
    
    // Resetear formulario y estado de edición
    form.reset();
    preview.style.display = "none";
    editingProductId = null;
    
    // Ocultar input temporal de imagen si existe
    const hiddenInput = document.getElementById("currentImageUrl");
    if(hiddenInput) hiddenInput.remove();
    
    // Restaurar texto del botón
    const submitBtn = form.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.textContent = "➕ Crear Producto";
    
    // Recargar lista y dashboard
    await cargarProductos();
    await cargarDashboard(); // ✅ Actualizar contadores

  } catch(error) {
    console.error("Error:", error);
    message.innerText = "❌ " + error.message;
  }
});

// ==========================
// CARGAR PRODUCTOS (con botón de editar)
// ==========================
async function cargarProductos(){
  try {
    const res = await fetch("/api/products");
    if(!res.ok) throw new Error("Error al cargar productos");
    
    const productos = await res.json();
    const list = document.getElementById("productList");
    
    // Solo limpiar si el elemento existe
    if(list) {
      list.innerHTML = "";

      if(!productos || productos.length === 0) {
        list.innerHTML = "<p class='text-muted'>No hay productos registrados</p>";
        return;
      }

      productos.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("product-item");
        // ✅ Agregar botón de editar con los datos necesarios
        div.innerHTML = `
          <img src="${p.image || 'placeholder.png'}" width="80" alt="${p.name}" onerror="this.src='placeholder.png'">
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
    }
  } catch(error) {
    console.error("Error cargando productos:", error);
    const list = document.getElementById("productList");
    if(list) list.innerHTML = "<p class='error'>❌ Error al cargar</p>";
  }
}

// ==========================
// EDITAR PRODUCTO (NUEVA FUNCIÓN)
// ==========================
function editarProducto(id, name, price, stock, image) {
  // Llenar el formulario con los datos del producto
  document.getElementById("name").value = name;
  document.getElementById("price").value = price;
  document.getElementById("stock").value = stock;
  
  // Guardar URL actual de la imagen en input hidden temporal
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.id = "currentImageUrl";
  hiddenInput.value = image;
  form.appendChild(hiddenInput);
  
  // Mostrar preview de la imagen actual
  if(preview) {
    preview.src = image;
    preview.style.display = "block";
  }
  
  // Cambiar texto del botón submit
  const submitBtn = form.querySelector('button[type="submit"]');
  if(submitBtn) submitBtn.textContent = "✏️ Actualizar";
  
  // Guardar ID para saber que estamos editando
  editingProductId = id;
  
  // Mensaje de estado
  if(message) message.innerText = "📝 Editando: " + name;
  
  // Scroll suave al formulario
  if(form) form.scrollIntoView({ behavior: "smooth" });
}

// ==========================
// ELIMINAR PRODUCTO
// ==========================
async function eliminarProducto(id){
  if(!confirm("¿Eliminar producto?")) return;

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE"
      // Si usas JWT: headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    
    if(!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Error al eliminar");
    }
    
    if(message) message.innerText = "🗑️ Producto eliminado";
    
    await cargarProductos();
    await cargarDashboard(); // ✅ Actualizar contador
    
    // Si estábamos editando el producto eliminado, resetear
    if(editingProductId === id) {
      form.reset();
      if(preview) preview.style.display = "none";
      editingProductId = null;
      const submitBtn = form.querySelector('button[type="submit"]');
      if(submitBtn) submitBtn.textContent = "➕ Crear Producto";
      const hiddenInput = document.getElementById("currentImageUrl");
      if(hiddenInput) hiddenInput.remove();
      if(message) message.innerText = "";
    }
  } catch(error) {
    console.error("Error eliminando:", error);
    if(message) message.innerText = "❌ " + error.message;
  }
}

// ==========================
// CARRUSEL (sin cambios en lógica, solo mejora de errores)
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
    fileInput.value = ""; // reset input
  } catch(error) {
    console.error("Error carrusel:", error);
    alert("❌ Error: " + error.message);
  }
}

async function cargarCarruselAdmin(){
  try {
    const response = await fetch("/api/carousel");
    const images = await response.json();
    const list = document.getElementById("carouselList");
    
    if(list) {
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
    }
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
// PREGUNTAS CHATBOT (sin cambios)
// ==========================
async function cargarPreguntas(){
  try{
    const res = await fetch("/unknown_questions.json");
    const preguntas = await res.json();
    const list = document.getElementById("questionsList");
    
    if(list) {
      list.innerHTML="";
      preguntas.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p;
        list.appendChild(li);
      });
    }
  } catch{
    console.log("No hay preguntas registradas");
  }
}

// ==========================
// NAVEGACIÓN ENTRE PANELES (FUNCIONALIDAD ORIGINAL - SIN CAMBIOS)
// ==========================
function mostrarPanel(panel){
  // Ocultar todos los paneles
  document.querySelectorAll(".panel").forEach(p => {
    p.classList.add("hidden")
  })
  // Mostrar el seleccionado
  const panelToShow = document.getElementById(panel);
  if(panelToShow) {
    panelToShow.classList.remove("hidden")
  }
}

// ==========================
// LOGOUT (sin cambios)
// ==========================
function logout(){
  localStorage.clear()
  window.location.href="login.html"
}

// ==========================
// DASHBOARD CONTADORES (sin cambios en lógica)
// ==========================
async function cargarDashboard(){
  try{
    // PRODUCTOS
    const resProductos = await fetch("/api/products");
    const productos = await resProductos.json();
    const totalProductosEl = document.getElementById("totalProductos");
    if(totalProductosEl) totalProductosEl.innerText = productos.length;

    // USUARIOS
    const resUsuarios = await fetch("/api/users");
    const usuarios = await resUsuarios.json();
    const totalUsuariosEl = document.getElementById("totalUsuarios");
    if(totalUsuariosEl) totalUsuariosEl.innerText = usuarios.length;

    // PREGUNTAS BOT
    const resPreguntas = await fetch("/unknown_questions.json");
    const preguntas = await resPreguntas.json();
    const totalPreguntasEl = document.getElementById("totalPreguntas");
    if(totalPreguntasEl) totalPreguntasEl.innerText = preguntas.length;

  } catch(error){
    console.error("Error cargando dashboard", error);
  }
}

// ==========================
// INICIO - MANTENIENDO TU ESTRUCTURA ORIGINAL
// ==========================
// ✅ Ejecutar al cargar - SIN envolver en DOMContentLoaded para no romper tu flujo
cargarProductos();
cargarCarruselAdmin();
cargarPreguntas();
cargarDashboard();