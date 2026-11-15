let currentPage = 1;
const limit = 4;

function createProductCard(product) {
    // Формуємо безпечне посилання з параметрами товару для checkout.html
    const checkoutUrl = `/checkout.html?productId=${product.id}&title=${encodeURIComponent(product.title)}&price=${product.price}`;

    return `
        <div class="product-card">
            <div class="product-image-wrapper">
                <img src="${product.image_url || product.image}" alt="${product.title}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">${product.price.toLocaleString('uk-UA')} грн</p>
                <a href="${checkoutUrl}" class="add-to-cart-btn" style="display: inline-block; text-align: center; text-decoration: none;">Замовити</a>
            </div>
        </div>
    `;
}

function renderProducts(productsArray) {
    const gridContainer = document.getElementById('products-grid');  
    productsArray.forEach(product => {
        const cardHTML = createProductCard(product);
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

async function fetchAndRenderProducts(page) {
    try {
        const response = await fetch(`http://localhost:3000/api/products?page=${page}&limit=${limit}`);
        const products = await response.json();

        if (products.length > 0) {
            renderProducts(products);
        }

        // Якщо прийшло менше товарів, ніж ліміт — ховаємо кнопку "Завантажити ще"
        if (products.length < limit) {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Помилка при завантаженні товарів:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Завантажуємо першу сторінку при відкритті сайту
    fetchAndRenderProducts(currentPage);

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            // 2. Збільшуємо номер сторінки перед наступним запитом
            currentPage++; 
            
            // 3. Робимо запит для нової сторінки
            fetchAndRenderProducts(currentPage);
        });
    }
});