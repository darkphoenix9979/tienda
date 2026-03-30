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
// DASHBOARD
// ==========================
async function cargarDashboard(){
  try{
    const totalProductosEl = document.getElementById("totalProductos");
    if(totalProductosEl) {
      const resProductos = await fetch("/api/products");
      const productos = await resProductos.json();
      totalProductosEl.innerText = productos.length;
    }

    const totalUsuariosEl = document.getElementById("totalUsuarios");
    if(totalUsuariosEl) {
      const resUsuarios = await fetch("/api/users");
      const usuarios = await resUsuarios.json();
      totalUsuariosEl.innerText = usuarios.length;
    }

    const totalPreguntasEl = document.getElementById("totalPreguntas");
    if(totalPreguntasEl) {
      const resPreguntas = await fetch("/unknown_questions.json");
      const preguntas = await resPreguntas.json();
      totalPreguntasEl.innerText = preguntas.length;
    }

  } catch(error){
    console.error("Error cargando dashboard", error);
  }
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