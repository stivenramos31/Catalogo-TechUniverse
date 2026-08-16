// Base de datos de productos con múltiples imágenes en array
const products = [
  {
    id: "prod-001",
    title: "Kit de 118 piezas para Laptop y Celulares",
    category: "Herramientas",
    priceCurrent: 15.00,
    priceOld: 25.00,
    description: "Kit de 118 Piezas",
    images: [
      "assets/products/01-Kit_PC/Kit-PC1.png",
      "assets/products/01-Kit_PC/Kit-PC2.png"
    ]
  },
  {
    id: "prod-002",
    title: "Power Bank Batería Portátil 10000mAh",
    category: "Accesorios",
    priceCurrent: 15.50,
    priceOld: 22.00,
    description: "Carga rápida dual USB con indicador LED de batería. Compacto y ligero para viajes.",
    images: [
      "assets/products/prod-002/main.jpg",
      "assets/products/prod-002/detail1.jpg"
    ]
  },
  {
    id: "prod-003",
    title: "Juego de Destornilladores de Precisión",
    category: "Herramientas",
    priceCurrent: 10.00,
    priceOld: 14.00,
    description: "Set de 24 puntas imantadas de alta calidad para reparación de laptops, celulares y consolas.",
    images: [
      "assets/products/prod-003/main.jpg"
    ]
  }
];

// Imagen por defecto en caso de que la ruta local no exista
const PLACEHOLDER = "https://via.placeholder.com/300x300?text=Sin+Imagen";

let filteredProducts = [...products];
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const productCount = document.getElementById('productCount');
const bannerTrack = document.getElementById('bannerTrack');

// Función segura para evitar bucles infinitos en eventos onerror
function handleImgError(imgElement) {
  imgElement.onerror = null; // Desactiva el evento para cortar la recarga infinita
  imgElement.src = PLACEHOLDER;
}

// Calcular porcentaje de descuento
function calculateDiscount(current, old) {
  if (!old || old <= current) return null;
  const discount = Math.round(((old - current) / old) * 100);
  return `-${discount}%`;
}

// Renderizar Cuadrícula de Productos
function renderProducts(items) {
  productGrid.innerHTML = '';
  productCount.textContent = `${items.length} productos`;

  if (items.length === 0) {
    productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">No se encontraron productos.</p>';
    return;
  }

  items.forEach(product => {
    const discount = calculateDiscount(product.priceCurrent, product.priceOld);
    const mainImg = (product.images && product.images.length > 0) ? product.images[0] : PLACEHOLDER;
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      ${discount ? `<span class="badge-discount">${discount} OFF</span>` : ''}
      <div class="card-img-wrapper" onclick="openModal('${product.id}')">
        <img src="${mainImg}" alt="${product.title}" onerror="handleImgError(this)" />
      </div>
      <div class="card-body">
        <div>
          <span class="card-category">${product.category}</span>
          <h3 class="card-title">${product.title}</h3>
        </div>
        <div class="price-container">
          <span class="price-current">$${product.priceCurrent.toFixed(2)}</span>
          ${product.priceOld ? `<span class="price-old">$${product.priceOld.toFixed(2)}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-details" onclick="openModal('${product.id}')">Ver Detalles</button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

// Renderizar Banner Animado sin bucle de carga
function renderBanner() {
  bannerTrack.innerHTML = '';
  // Repetimos la lista solo para completar el carrusel
  const bannerItems = [...products, ...products];

  bannerItems.forEach(product => {
    const mainImg = (product.images && product.images.length > 0) ? product.images[0] : PLACEHOLDER;
    const img = document.createElement('img');
    img.src = mainImg;
    img.alt = product.title;
    img.onclick = () => openModal(product.id);
    img.onerror = function() { handleImgError(this); };
    bannerTrack.appendChild(img);
  });
}

// Ventana Emergente con Galería Múltiple
function openModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');
  const discount = calculateDiscount(product.priceCurrent, product.priceOld);
  
  const images = (product.images && product.images.length > 0) ? product.images : [PLACEHOLDER];
  const whatsappMessage = encodeURIComponent(`¡Hola! Me interesa: ${product.title} ($${product.priceCurrent.toFixed(2)})`);

  // Crear miniaturas para la galería
  let thumbnailsHTML = '';
  if (images.length > 1) {
    thumbnailsHTML = `<div class="gallery-thumbnails">`;
    images.forEach((imgSrc, index) => {
      thumbnailsHTML += `
        <img 
          src="${imgSrc}" 
          class="thumb-img ${index === 0 ? 'active' : ''}" 
          onclick="changeModalImage('${imgSrc}', this)" 
          onerror="handleImgError(this)"
        />`;
    });
    thumbnailsHTML += `</div>`;
  }

  modalBody.innerHTML = `
    <div class="modal-gallery">
      <div class="modal-main-img">
        <img id="modalMainImg" src="${images[0]}" alt="${product.title}" onerror="handleImgError(this)" />
      </div>
      ${thumbnailsHTML}
    </div>
    <div class="modal-info">
      <span class="card-category">${product.category}</span>
      <h2 style="font-size:1.2rem;">${product.title}</h2>
      <p style="font-size:0.85rem; color:#64748b;">${product.description}</p>
      <div class="price-container">
        <span class="price-current" style="font-size:1.4rem;">$${product.priceCurrent.toFixed(2)}</span>
        ${product.priceOld ? `<span class="price-old" style="font-size:1rem;">$${product.priceOld.toFixed(2)}</span>` : ''}
        ${discount ? `<span class="badge-discount" style="position:static;">${discount} OFF</span>` : ''}
      </div>
      <a href="https://wa.me/?text=${whatsappMessage}" target="_blank" class="btn-whatsapp">
        💬 Consultar por WhatsApp
      </a>
    </div>
  `;

  modal.classList.add('active');
}

// Cambiar la imagen principal al hacer clic en una miniatura
function changeModalImage(src, thumbElement) {
  const mainImg = document.getElementById('modalMainImg');
  if (mainImg) {
    mainImg.src = src;
  }
  document.querySelectorAll('.thumb-img').forEach(el => el.classList.remove('active'));
  thumbElement.classList.add('active');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
}

// Búsqueda en tiempo real
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  filteredProducts = products.filter(p => p.title.toLowerCase().includes(query));
  renderProducts(filteredProducts);
});

// Filtro de categorías
function filterByCategory(category, element) {
  document.querySelectorAll('.category-list li').forEach(li => li.classList.remove('active'));
  element.classList.add('active');

  if (category === 'Todos') {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(p => p.category === category);
  }
  renderProducts(filteredProducts);
}

// Cierre al pulsar fuera del modal
window.onclick = function(event) {
  const modal = document.getElementById('productModal');
  if (event.target === modal) {
    closeModal();
  }
};

// Carga Inicial
renderProducts(products);
renderBanner();