// 🔒 seguridad admin
if(localStorage.getItem("role") !== "admin"){
  window.location.href = "login.html";
}

const form = document.getElementById("productForm");
const preview = document.getElementById("preview");
const imageInput = document.getElementById("image");
const message = document.getElementById("message");

// Variable para controlar si estamos editando
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
  const price = parseFloat(document.getElementById("price").value); // ✅ Convertir a número
  const stock = parseInt(document.getElementById("stock").value);   // ✅ Convertir a número
  const file = imageInput.files[0];

  // Validaciones
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
        const errorData = await cloudResponse.json();
        throw new Error(`Cloudinary: ${errorData.error?.message || 'Error al subir imagen'}`);
      }

      const cloudData = await cloudResponse.json();
      imageUrl = cloudData.secure_url;
    }

    message.innerText = editingProductId ? "✏️ Actualizando producto..." : "💾 Guardando producto...";

    // Preparar datos del producto
    const productData = {
      name,
      price,
      stock
    };
    
    // Solo incluir imagen si se subió una nueva (o si es creación)
    if(imageUrl || !editingProductId) {
      productData.image = imageUrl || document.getElementById("currentImageUrl")?.value;
    }

    // Determinar método y URL según si es edición o creación
    const method = editingProductId ? "PUT" : "POST";
    const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";

    const productResponse = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        // ✅ Agrega este header si tu backend usa JWT
        // "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(productData)
    });

    const data = await productResponse.json();

    if(!productResponse.ok) throw new Error(data.message || "Error en la operación");

    message.innerText = editingProductId ? "✅ Producto actualizado" : "✅ Producto creado";
    
    // Resetear formulario y estado
    form.reset();
    preview.style.display = "none";
    editingProductId = null;
    
    // Recargar lista
    await cargarProductos();

  } catch(error) {
    console.error("Error:", error);
    message.innerText = "❌ " + error.message;
  }
});

// ==========================
// CARGAR PRODUCTOS (con botones de editar)
// ==========================
async function cargarProductos(){
  try {
    const res = await fetch("/api/products");
    if(!res.ok) throw new Error("Error al cargar productos");
    
    const productos = await res.json();
    const list = document.getElementById("productList");
    list.innerHTML = "";

    if(productos.length === 0) {
      list.innerHTML = "<p class='text-muted'>No hay productos registrados</p>";
      return;
    }

    productos.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("product-item");
      div.innerHTML = `
        <img src="${p.image || 'placeholder.png'}" width="80" alt="${p.name}" onerror="this.src='placeholder.png'">
        <div class="product-info">
          <strong>${p.name}</strong><br>
          <span>$${parseFloat(p.price).toFixed(2)}</span><br>
          <span>Stock: ${p.stock}</span>
        </div>
        <div class="product-actions">
          <button class="btn-edit" onclick="editarProducto('${p._id}', '${p.name}', ${p.price}, ${p.stock}, '${p.image}')">✏️ Editar</button>
          <button class="btn-delete" onclick="eliminarProducto('${p._id}')">🗑️ Eliminar</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch(error) {
    console.error("Error cargando productos:", error);
    document.getElementById("productList").innerHTML = "<p class='error'>❌ Error al cargar productos</p>";
  }
}

// ==========================
// EDITAR PRODUCTO (nueva función)
// ==========================
function editarProducto(id, name, price, stock, image) {
  // Llenar el formulario con los datos del producto
  document.getElementById("name").value = name;
  document.getElementById("price").value = price;
  document.getElementById("stock").value = stock;
  
  // Guardar URL actual de la imagen por si no se cambia
  const hiddenInput = document.getElementById("currentImageUrl") || document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.id = "currentImageUrl";
  hiddenInput.value = image;
  if(!document.getElementById("currentImageUrl")) {
    form.appendChild(hiddenInput);
  }
  
  // Mostrar preview de la imagen actual
  preview.src = image;
  preview.style.display = "block";
  
  // Cambiar texto del botón submit
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "✏️ Actualizar Producto";
  
  // Guardar ID para saber que estamos editando
  editingProductId = id;
  
  // Scroll al formulario
  form.scrollIntoView({ behavior: "smooth" });
  
  message.innerText = "📝 Editando: " + name;
}

// ==========================
// CANCELAR EDICIÓN
// ==========================
function cancelarEdicion() {
  form.reset();
  preview.style.display = "none";
  editingProductId = null;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "➕ Crear Producto";
  
  const hiddenInput = document.getElementById("currentImageUrl");
  if(hiddenInput) hiddenInput.remove();
  
  message.innerText = "";
}

// ==========================
// ELIMINAR PRODUCTO
// ==========================
async function eliminarProducto(id){
  if(!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: {
        // "Authorization": `Bearer ${localStorage.getItem("token")}` // si usas JWT
      }
    });
    
    if(!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Error al eliminar");
    }
    
    message.innerText = "🗑️ Producto eliminado";
    await cargarProductos();
    
    // Si estábamos editando el producto eliminado, resetear formulario
    if(editingProductId === id) {
      cancelarEdicion();
    }
  } catch(error) {
    console.error("Error eliminando:", error);
    message.innerText = "❌ " + error.message;
  }
}

// ==========================
// CARRUSEL (sin cambios mayores, solo mejora de errores)
// ==========================
async function subirImagenCarrusel(){
  const fileInput = document.getElementById("carouselImage");
  
  if(!fileInput.files.length){
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
    list.innerHTML = "";

    images.forEach(img => {
      const div = document.createElement("div");
      div.classList.add("carousel-item");
      div.innerHTML = `
        <img src="${img.image}" width="120" alt="carousel">
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
// RESTO DE FUNCIONES (sin cambios)
// ==========================
async function cargarPreguntas(){ /* ... tu código existente ... */ }
function mostrarPanel(panel){ /* ... tu código existente ... */ }
function logout(){ /* ... tu código existente ... */ }
async function cargarDashboard(){ /* ... tu código existente ... */ }

// ==========================
// INICIO
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  cargarCarruselAdmin();
  cargarPreguntas();
  cargarDashboard();
});