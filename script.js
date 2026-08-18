// Base de datos de productos con múltiples imágenes en array
const products = [
  {
    id: "prod-001",
    title: "Kit de Herramientas de Precision Profesional para Reparación de Electrónica, PC, Celulares y Consolas",
    category: "Herramientas",
    priceCurrent: 15.00,
    priceOld: 25.00,
    description: "Kit de herramientas de precisión diseñado para la reparación y mantenimiento de dispositivos electrónicos como teléfonos móviles, laptops, PCs, consolas de videojuegos, tablets y pequeños electrodomésticos. Incluye una amplia variedad de puntas magnéticas, destornillador ergonómico y accesorios esenciales para aperturas seguras sin dañar tus equipos.",
    images: [
      "assets/products/01-Kit_PC/Kit-PC1.webp",
      "assets/products/01-Kit_PC/Kit-PC2.webp",
      "assets/products/01-Kit_PC/Kit-PC3.webp",
      "assets/products/01-Kit_PC/Kit-PC4.webp",
      "assets/products/01-Kit_PC/Kit-PC5.webp"
    ]
  },
  {
    id: "prod-002",
    title: "Kit de Herramientas de Red Profesional para Instalación y Mantenimiento de Cableado Estructurado (Tester RJ45/RJ11, Ponchadora y Accesorios con Estuche)",
    category: "Herramientas",
    priceCurrent: 25.00,
    priceOld: 35.00,
    description: "kit de herramientas para redes e instalaciones de telecomunicaciones. Diseñado para técnicos, ingenieros y entusiastas de la tecnología que necesitan instalar, reparar o probar cableado de red de internet y telefonía (RJ45 / RJ11). Incluye todo lo necesario para ponchar cables, verificar continuidad y organizar instalaciones de manera rápida y profesional. ",
    images: [
      "assets/products/02-Kit_Redes/Kit-Red1.webp",
      "assets/products/02-Kit_Redes/Kit-Red2.webp",
      "assets/products/02-Kit_Redes/Kit-Red3.webp",
      "assets/products/02-Kit_Redes/Kit-Red4.webp",
      "assets/products/02-Kit_Redes/Kit-Red5.webp"
    ]
  },
  {
    id: "prod-003",
    title: "Kit de Cautín para Soldar de Temperatura Regulable (200°C - 450°C) con Puntas Intercambiables, Extractor de Estaño y Estuche Organizado",
    category: "Herramientas",
    priceCurrent: 25.00,
    priceOld: 35.00,
    description: "Kit de soldadura eléctrica de alta precisión, ideal para reparaciones de electrónica, circuitos impresos (PCB), proyectos DIY, bricolaje y mantenimiento de dispositivos electrónicos. Incluye un cautín de temperatura ajustable de caldeo rápido, extractor de soldadura, soporte de seguridad y accesorios esenciales almacenados en un practico estuche portátil.",
    images: [
      "assets/products/03-Kit_Cautin/Kit-Cautin1.webp",
      "assets/products/03-Kit_Cautin/Kit-Cautin2.webp",
      "assets/products/03-Kit_Cautin/Kit-Cautin3.webp",
      "assets/products/03-Kit_Cautin/Kit-Cautin4.webp"
    ]
  },
  {
    id: "prod-004",
    title: "Kit de Soldadura Completo con Multímetro Digital (VC830L), Cautín Regulable, Extractor de Estaño y Accesorios de Electrónica",
    category: "Herramientas",
    priceCurrent: 28.00,
    priceOld: 30.00,
    description: "Juego de herramientas todo en uno para electrónica, ideal para estudiantes, técnicos, ingenieros y aficionados al bricolaje. Combina un cautín eléctrico de temperatura ajustable con un multímetro digital preciso, destornillador de lápiz de precisión, extractor de soldadura y accesorios esenciales para medición, armado y reparación de circuitos.",
    images: [
        "assets/products/04-Kit_Multimetro/Kit-Multimetro1.webp",
        "assets/products/04-Kit_Multimetro/Kit-Multimetro2.webp",
        "assets/products/04-Kit_Multimetro/Kit-Multimetro3.webp",
        "assets/products/04-Kit_Multimetro/Kit-Multimetro4.webp",
        "assets/products/04-Kit_Multimetro/Kit-Multimetro5.webp"
    ]
  },
  {
    id: "prod-005",
    title: "Hub USB 8 en 1 Multipuerto de Aluminio (Conector Doble USB-C y USB-A Dual)",
    category: "Electrónica",
    priceCurrent: 12.00,
    priceOld: 15.00,
    description: "Maximiza la conectividad de tu laptop, PC o tablet con este concentrador multipuerto 8 en 1. Diseñado con un conector híbrido dual (USB-A y USB-C), es compatible tanto con equipos modernos como con puertos USB tradicionales. Su chasis de aluminio ligero y resistente disipa el calor eficientemente y ofrece un diseño compacto ideal para el trabajo diario o viajes.",
    images: [
        "assets/products/05-Hub_8en1/Hub1.webp",
        "assets/products/05-Hub_8en1/Hub2.webp",
        "assets/products/05-Hub_8en1/Hub3.webp",
        "assets/products/05-Hub_8en1/Hub4.webp",
        "assets/products/05-Hub_8en1/Hub5.webp"
    ]
  },
  {
    id: "prod-006",
    title: "Combo Reparación y Recuperación SSD: Cable Adaptador USB 3.0 a SATA + Tarjeta Adaptadora M.2 NGFF / mSATA a SATA 2.5",
    category: "Electrónica",
    priceCurrent: 12.00,
    priceOld: 14.00,
    description: "Kit esencial de conversión y diagnóstico para técnicos, estudiantes de informática y entusiastas del hardware. Este combo incluye dos herramientas indispensables para conectar, reparar o respaldar datos de unidades de almacenamiento SATA y SSD de diferentes formatos.",
    images: [
        "assets/products/06-USB_SATA/USB_SATA1.webp",
        "assets/products/06-USB_SATA/USB_SATA2.webp",
        "assets/products/06-USB_SATA/USB_SATA3.webp",
        "assets/products/06-USB_SATA/USB_SATA4.webp",
        "assets/products/06-USB_SATA/USB_SATA5.webp"
    ]
  },
  {
    id: "prod-007",
    title: "Estación de Soldar Digital 2 en 1 Modelo 8898: Cautín Regulable + Pistola de Aire Caliente para Retrabajo SMD",
    category: "Herramientas",
    priceCurrent: 55.00,
    priceOld: 65.00,
    description: "Estación de soldadura digital doble 2 en 1 de alto rendimiento, ideal para reparación de tarjetas electrónicas, celulares, laptops y componentes SMD/SMT. Combina en una sola unidad compacta un cautín tipo lápiz de alta precisión y una pistola de aire caliente para desoldar, con controles de temperatura independientes y pantallas LED digitales.",
    images: [
        "assets/products/07-Estacion_Calor/Estacion1.webp",
        "assets/products/07-Estacion_Calor/Estacion2.webp",
        "assets/products/07-Estacion_Calor/Estacion3.webp"
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
// Abrir Modal de Detalles con scroll bloqueado en el fondo
// Abrir Modal de Detalles con botón de WhatsApp sticky y scroll de fondo bloqueado
// Abrir Modal de Productos
function openModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');
  const discount = calculateDiscount(product.priceCurrent, product.priceOld);
  
  const images = (product.images && product.images.length > 0) ? product.images : [PLACEHOLDER];
  const phoneNumber = "50360114812"; 
  const whatsappMessage = encodeURIComponent(`¡Hola! Me interesa: ${product.title} ($${product.priceCurrent.toFixed(2)})`);

  // Detectar si estamos en móvil o pantalla pequeña (ancho < 768px)
  const isMobile = window.innerWidth <= 768;

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
      <h2 style="font-size:1.15rem; line-height: 1.3;">${product.title}</h2>
      
      <!-- Contenedor de Descripción -->
      <div class="description-wrapper">
        <p id="modalDescription" class="description-text ${isMobile ? 'collapsed' : ''}">
          ${product.description}
        </p>
        <button id="toggleDescBtn" class="btn-toggle-desc" onclick="toggleDescription()">
          ${isMobile ? 'Ver más' : 'Ver menos'}
        </button>
      </div>

      <div class="price-container">
        <span class="price-current" style="font-size:1.35rem;">$${product.priceCurrent.toFixed(2)}</span>
        ${product.priceOld ? `<span class="price-old" style="font-size:0.9rem;">$${product.priceOld.toFixed(2)}</span>` : ''}
        ${discount ? `<span class="badge-discount" style="position:static;">${discount} OFF</span>` : ''}
      </div>
      
      <!-- Botón de WhatsApp integrado al flujo natural -->
      <a href="https://wa.me/${phoneNumber}?text=${whatsappMessage}" target="_blank" class="btn-whatsapp">
        💬 Consultar por WhatsApp
      </a>
    </div>
  `;

  modal.classList.add('active');
  document.body.classList.add('modal-open');

  // Evaluar si la descripción es corta para ocultar el botón si no es necesario
  setTimeout(() => {
    const descText = document.getElementById('modalDescription');
    const toggleBtn = document.getElementById('toggleDescBtn');
    
    if (descText && toggleBtn) {
      // Si el texto entero no supera 60px de alto, no necesita el botón Ver más / Ver menos
      if (descText.scrollHeight <= 60) {
        toggleBtn.style.display = 'none';
      } else {
        toggleBtn.style.display = 'inline-block';
      }
    }
  }, 100);
}

// Función Alternar Ver más / Ver menos
function toggleDescription() {
  const descText = document.getElementById('modalDescription');
  const toggleBtn = document.getElementById('toggleDescBtn');

  if (!descText || !toggleBtn) return;

  if (descText.classList.contains('collapsed')) {
    descText.classList.remove('collapsed');
    toggleBtn.textContent = 'Ver menos';
  } else {
    descText.classList.add('collapsed');
    toggleBtn.textContent = 'Ver más';
  }
}

// Cerrar Modal y restaurar el scroll de la página
function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.classList.remove('modal-open');
}

// Desplegar/contraer descripción del producto
function toggleDescription() {
  const descText = document.getElementById('modalDescription');
  const toggleBtn = document.getElementById('toggleDescBtn');

  if (descText.classList.contains('collapsed')) {
    descText.classList.remove('collapsed');
    toggleBtn.textContent = 'Ver menos';
  } else {
    descText.classList.add('collapsed');
    toggleBtn.textContent = 'Ver más';
  }
}

// Selector de imágenes de la galería
function changeModalImage(imgSrc, element) {
  const mainImg = document.getElementById('modalMainImg');
  if (mainImg) {
    mainImg.src = imgSrc;
  }
  
  const thumbnails = document.querySelectorAll('.thumb-img');
  thumbnails.forEach(thumb => thumb.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }
}

// Cerrar Modal y desbloquear scroll
function closeModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.classList.remove('modal-open'); // Desbloquea el scroll
}

// Alternar entre "Ver más" y "Ver menos" en la descripción
function toggleDescription() {
  const descText = document.getElementById('modalDescription');
  const toggleBtn = document.getElementById('toggleDescBtn');

  if (descText.classList.contains('collapsed')) {
    descText.classList.remove('collapsed');
    toggleBtn.textContent = 'Ver menos';
  } else {
    descText.classList.add('collapsed');
    toggleBtn.textContent = 'Ver más';
  }
}

// Cambiar imagen principal desde la galería de miniaturas
function changeModalImage(imgSrc, element) {
  const mainImg = document.getElementById('modalMainImg');
  if (mainImg) {
    mainImg.src = imgSrc;
  }
  
  // Actualizar estado activo en las miniaturas
  const thumbnails = document.querySelectorAll('.thumb-img');
  thumbnails.forEach(thumb => thumb.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }
}

// Función para expandir/colapsar el texto de descripción
function toggleDescription() {
  const descText = document.getElementById('modalDescription');
  const toggleBtn = document.getElementById('toggleDescBtn');

  if (descText.classList.contains('collapsed')) {
    descText.classList.remove('collapsed');
    toggleBtn.textContent = 'Ver menos';
  } else {
    descText.classList.add('collapsed');
    toggleBtn.textContent = 'Ver más';
  }
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

// Cerrar Modal y desbloquear scroll
function closeModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.classList.remove('modal-open'); // Desbloquea el scroll
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