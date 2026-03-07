const form = document.getElementById("productForm");
const preview = document.getElementById("preview");
const imageInput = document.getElementById("image");
const message = document.getElementById("message");

// 🔹 Preview imagen
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// 🔹 Enviar formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const file = imageInput.files[0];

  if (!file) {
    message.innerText = "❌ Debes seleccionar una imagen";
    return;
  }

  message.innerText = "Subiendo imagen...";

  try {
    // 1️⃣ Subir imagen a Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "anime_store");

    const cloudResponse = await fetch(
      "https://api.cloudinary.com/v1_1/dvmkwrelz/image/upload",
      { method: "POST", body: formData }
    );

    const cloudData = await cloudResponse.json();

    if (!cloudData.secure_url) throw new Error("Error subiendo imagen a Cloudinary");

    message.innerText = "Guardando producto...";

    // 2️⃣ Guardar producto en backend
  const productResponse = await fetch("/api/products", {
   method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
      body: JSON.stringify({
     name: document.getElementById("name").value,
      price: document.getElementById("price").value,
      stock: document.getElementById("stock").value,
    image: cloudResult.secure_url
  })
});

    const data = await productResponse.json();

    if (!productResponse.ok) throw new Error(data.message || "Error al guardar producto");

    message.innerText = "✅ Producto creado correctamente";
    form.reset();
    preview.style.display = "none";

  } catch (error) {
    console.error(error);
    message.innerText = "❌ " + error.message;
  }
});

// 🔹 Carrusel
async function subirImagenCarrusel() {
  const fileInput = document.getElementById("carouselImage");

  if (!fileInput.files.length) {
    alert("Selecciona una imagen");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "anime_store");

  const cloudResponse = await fetch(
    "https://api.cloudinary.com/v1_1/dvmkwrelz/image/upload",
    { method: "POST", body: formData }
  );

  const cloudData = await cloudResponse.json();

  await fetch("/api/carousel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: cloudData.secure_url })
  });

  cargarCarruselAdmin();
}

async function cargarCarruselAdmin() {
  const response = await fetch("/api/carousel");
  const images = await response.json();
  const list = document.getElementById("carouselList");
  list.innerHTML = "";

  images.forEach(img => {
    const div = document.createElement("div");
    div.classList.add("carousel-item");
    div.dataset.id = img._id;

    div.innerHTML = `
      <img src="${img.image}" width="100%">
      <button onclick="eliminarImagen('${img._id}')">Eliminar</button>
    `;

    list.appendChild(div);
  });

  new Sortable(list, {
    animation: 150,
    onEnd: async function () {
      const ids = [...list.children].map(item => item.dataset.id);
      await fetch("/api/carousel/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: ids })
      });
    }
  });
}

async function eliminarImagen(id) {
  await fetch("/api/carousel/" + id, { method: "DELETE" });
  cargarCarruselAdmin();
}

cargarCarruselAdmin();