const API_URL = 'http://localhost:3000/api';

function getSelectedProduct() {
    const params = new URLSearchParams(window.location.search);
    return {
        productId: Number(params.get('productId')),
        title: params.get('title') || 'Обрана прикраса',
        price: Number(params.get('price')) || 0
    };
}

function renderOrderSummary() {
    const itemsContainer = document.getElementById('checkout-items-list');
    const totalElement = document.getElementById('checkout-total-price');
    
    if (!itemsContainer || !totalElement) return;

    const product = getSelectedProduct();

    if (!product.productId) {
        itemsContainer.innerHTML = '<p style="color: #d32f2f;">Товар не обрано. Поверніться до каталогу.</p>';
        totalElement.textContent = '0 грн';
        return;
    }

    itemsContainer.innerHTML = `
        <div class="cart-item">
            <div>
                <strong>${product.title}</strong><br>
                <small style="color: #666;">Кількість: 1 шт.</small>
            </div>
            <div>${product.price.toLocaleString('uk-UA')} грн</div>
        </div>
    `;

    totalElement.textContent = `${product.price.toLocaleString('uk-UA')} грн`;
}

async function handleCheckout(event) {
    event.preventDefault();

    const product = getSelectedProduct();
    if (!product.productId) {
        alert('Помилка: не обрано товар для замовлення!');
        return;
    }

    const rawPhone = document.getElementById('customerPhone').value;
    const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');

    // Перевірка формату (+380XXXXXXXXX)
    if (!/^\+380\d{9}$/.test(cleanPhone)) {
        alert('Введіть коректний номер телефону у форматі +380XXXXXXXXX');
        return;
    }

    const customer = {
        name: document.getElementById('customerName').value.trim(),
        phone: cleanPhone,
        email: document.getElementById('customerEmail').value.trim()
    };

    const delivery = document.getElementById('deliveryDetails').value.trim();

    const orderData = {
        customer,
        delivery,
        items: [
            {
                productId: product.productId,
                quantity: 1
            }
        ],
        totalPrice: product.price
    };

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Замовлення #${result.orderId} створено!\n${result.message}`);
            window.location.href = '/index.html';
        } else {
            alert('Помилка: ' + (result.error || 'Не вдалося оформити замовлення'));
        }
    } catch (err) {
        console.error('Помилка мережі:', err);
        alert('Не вдалося з’єднатися з сервером. Перевірте, чи запущений бекенд.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderOrderSummary();

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
});