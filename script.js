// Base de datos de productos con precios anteriores y cálculo de oferta
const products = [
  {
    id: "prod-001",
    title: "Audífonos Bluetooth Inalámbricos TWS",
    category: "Electrónica",
    priceCurrent: 18.00,
    priceOld: 25.00,
    description: "Audífonos Bluetooth 5.3 con sonido estéreo, cancelación de ruido y batería de hasta 20 horas de reproducción.",
    image: "assets/products/prod-001/main.jpg"
  },
  {
    id: "prod-002",
    title: "Power Bank Batería Portátil 10000mAh",
    category: "Accesorios",
    priceCurrent: 15.50,
    priceOld: 22.00,
    description: "Carga rápida dual USB con indicador LED de batería. Compacto y ligero para viajes.",
    image: "assets/products/prod-002/main.jpg"
  },
  {
    id: "prod-003",
    title: "Juego de Destornilladores de Precisión",
    category: "Herramientas",
    priceCurrent: 10.00,
    priceOld: 14.00,
    description: "Set de 24 puntas imantadas de alta calidad para reparación de laptops, celulares y consolas.",
    image: "assets/products/prod-003/main.jpg"
  },
  {
    id: "prod-004",
    title: "Cargador Carga Rápida USB-C 20W",
    category: "Accesorios",
    priceCurrent: 8.50,
    priceOld: 12.00,
    description: "Adaptador de pared compatible con iPhone y Android para carga rápida ultrasegura.",
    image: "assets/products/prod-004/main.jpg"
  }
];

let filteredProducts = [...products];
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const productCount = document.getElementById('productCount');
const bannerTrack = document.getElementById('bannerTrack');

// Función para calcular porcentaje de descuento
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
    productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">No se encontraron productos en esta categoría.</p>';
    return;
  }

  items.forEach(product => {
    const discount = calculateDiscount(product.priceCurrent, product.priceOld);
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      ${discount ? `<span class="badge-discount">${discount} OFF</span>` : ''}
      <div class="card-img-wrapper" onclick="openModal('${product.id}')">
        <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'" />
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

// Renderizar Banner Animado
function renderBanner() {
  bannerTrack.innerHTML = '';
  const bannerItems = [...products, ...products, ...products];

  bannerItems.forEach(product => {
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.title;
    img.onclick = () => openModal(product.id);
    img.onerror = function() { this.src = 'https://via.placeholder.com/90?text=Producto'; };
    bannerTrack.appendChild(img);
  });
}

// Filtro por Búsqueda
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  filteredProducts = products.filter(p => p.title.toLowerCase().includes(query));
  renderProducts(filteredProducts);
});

// Filtro por Categoría
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

// Ordenar Productos
function sortProducts(criteria) {
  if (criteria === 'price-low') {
    filteredProducts.sort((a, b) => a.priceCurrent - b.priceCurrent);
  } else if (criteria === 'price-high') {
    filteredProducts.sort((a, b) => b.priceCurrent - a.priceCurrent);
  } else if (criteria === 'discount') {
    filteredProducts.sort((a, b) => {
      const discA = a.priceOld ? (a.priceOld - a.priceCurrent) : 0;
      const discB = b.priceOld ? (b.priceOld - b.priceCurrent) : 0;
      return discB - discA;
    });
  }
  renderProducts(filteredProducts);
}

// Ventana Emergente (Modal)
function openModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');
  const discount = calculateDiscount(product.priceCurrent, product.priceOld);
  
  const whatsappMessage = encodeURIComponent(`¡Hola! Me interesa obtener más información sobre: ${product.title} ($${product.priceCurrent.toFixed(2)})`);

  modalBody.innerHTML = `
    <div class="modal-img-container">
      <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'" />
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

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
}

// Cierre del modal al pulsar fuera de él
window.onclick = function(event) {
  const modal = document.getElementById('productModal');
  if (event.target === modal) {
    closeModal();
  }
};

// Carga Inicial
renderProducts(products);
renderBanner();