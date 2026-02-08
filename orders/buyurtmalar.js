const API_BASE_URL = "https://dasturxon-bgbot-production.up.railway.app";
const ordersContainer = document.getElementById("ordersContainer");
const loadingOrders = document.getElementById("loadingOrders");

// Cache uchun
let shopsCache = null;
let loadingShopsPromise = null;

/**
 * Telefon raqamni olish
 */
function getUserPhone() {
    let phone = sessionStorage.getItem("userPhone") || localStorage.getItem("userPhone");
    if (phone) sessionStorage.setItem("userPhone", phone);
    return phone;
}

/**
 * Barcha do'konlarni yuklash va cache'da saqlash
 */
async function loadShops() {
    // Agar allaqachon yuklanyotgan bo'lsa, o'sha promise'ni qaytaramiz
    if (loadingShopsPromise) {
        return loadingShopsPromise;
    }

    // Agar cache'da bo'lsa, cache'dan qaytaramiz
    if (shopsCache) {
        return shopsCache;
    }

    // Yangi yuklash
    loadingShopsPromise = fetch(`${API_BASE_URL}/user/shops`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Do\'konlarni yuklashda xatolik');
            }
            return response.json();
        })
        .then(shops => {
            shopsCache = shops;
            loadingShopsPromise = null;
            return shops;
        })
        .catch(error => {
            console.error('Do\'konlarni yuklashda xatolik:', error);
            loadingShopsPromise = null;
            return [];
        });

    return loadingShopsPromise;
}

/**
 * Shop ID bo'yicha shop ma'lumotini olish
 */
async function getShopById(shopId) {
    const shops = await loadShops();
    return shops.find(shop => shop.id === shopId);
}

/**
 * Product ma'lumotini olish
 */
async function getProductInfo(shopId, productId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/user/shops/${shopId}/products/${productId}`
        );
        
        if (!response.ok) {
            throw new Error('Mahsulot topilmadi');
        }
        
        return await response.json();
    } catch (error) {
        console.warn(`Mahsulot ${productId} topilmadi:`, error);
        return null;
    }
}

/**
 * Bo'sh buyurtmalar ekranini ko'rsatish
 */
function showEmptyOrders() {
    ordersContainer.innerHTML = `
        <div class="empty-orders">
            <div class="empty-orders-icon">📦</div>
            <h2 class="empty-orders-title">Buyurtmalaringiz yo'q</h2>
            <p class="empty-orders-text">Hozircha hech qanday buyurtma bermagansiz. Sevimli taomlaringizni buyurtma qiling!</p>
            <a href="../index.html" class="go-shopping-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Buyurtma berish
            </a>
        </div>
    `;
}

/**
 * Xato ekranini ko'rsatish
 */
function showError(message) {
    ordersContainer.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h2 class="error-title">Xatolik yuz berdi</h2>
            <p class="error-text">${message}</p>
            <button class="retry-btn" onclick="loadOrders()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Qayta urinish
            </button>
        </div>
    `;
}

/**
 * Status nomini o'zbekchaga tarjima qilish
 */
function translateStatus(status) {
    const statusMap = {
        'PENDING': 'Kutilmoqda',
        'ACCEPTED': 'Qabul qilindi',
        'PREPARING': 'Tayyorlanmoqda',
        'READY': 'Tayyor',
        'DELIVERING': 'Yetkazilmoqda',
        'DELIVERED': 'Yetkazildi',
        'CANCELLED': 'Bekor qilindi'
    };
    return statusMap[status] || status;
}

/**
 * Status CSS class ni olish
 */
function getStatusClass(status) {
    return 'status-' + status.toLowerCase();
}

/**
 * Sanani formatlash
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Bugun';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Kecha';
    } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
}

/**
 * Vaqtni formatlash (HH:MM)
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Buyurtmalarni sanaga qarab guruhlash
 */
function groupOrdersByDate(orders) {
    const grouped = {};

    orders.forEach(orderData => {
        const order = orderData.order;
        const dateKey = order.createdAt.split('T')[0]; // YYYY-MM-DD
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(orderData);
    });

    return grouped;
}

/**
 * Buyurtma kartasini render qilish
 */
function renderOrderCard(orderData) {
    const order = orderData.order;
    const items = orderData.items || [];

    const card = document.createElement('div');
    card.className = 'order-card';
    card.onclick = () => showOrderDetail(orderData);

    // Shop rasmi va nomi
    const shopImage = order.shopImage || '';
    const shopName = order.shopName || 'Restoran';

    // Mahsulotlar ro'yxati
    let itemsHTML = '';
    if (items.length > 0) {
        itemsHTML = `
            <div class="order-items">
                <div class="order-items-title">Mahsulotlar:</div>
                <div class="item-list">
                    ${items.slice(0, 3).map(item => `
                        <div class="item-row">
                            <span class="item-name">${item.productName || 'Mahsulot'}</span>
                            <span class="item-quantity">${item.quantity} ta</span>
                        </div>
                    `).join('')}
                    ${items.length > 3 ? `<div class="item-row" style="color: var(--gray); font-style: italic;">va yana ${items.length - 3} ta...</div>` : ''}
                </div>
            </div>
        `;
    }

    // 🔥 Yetkazib berish narxini to'g'ri olish (backenddan kelgan qiymat)
    const deliveryFee = order.deliveryFee || 0;
    const deliveryText = deliveryFee > 0 
        ? `🚚 Yetkazish: ${deliveryFee.toLocaleString()} so'm` 
        : '🚚 Bepul yetkazish';

    // 🔥 totalAmount yoki totalPrice dan to'g'ri qiymatni olish
    const totalPrice = order.totalAmount || order.totalPrice || 0;

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">Buyurtma #${order.id}</div>
            <div class="order-status ${getStatusClass(order.status)}">
                ${translateStatus(order.status)}
            </div>
        </div>

        <div class="order-info">
            <div class="shop-info-row">
                ${shopImage ? `
                    <img src="${shopImage}" alt="${shopName}" class="shop-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="shop-logo-fallback" style="display: none;">🏪</div>
                ` : `
                    <div class="shop-logo-fallback">🏪</div>
                `}
                <div>
                    <div class="shop-name">${shopName}</div>
                    <div class="shop-subtitle">${items.length} ta mahsulot</div>
                </div>
            </div>
            
            <div class="order-details">
                <div class="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>${order.deliveryAddress || 'Manzil ko\'rsatilmagan'}</span>
                </div>

                <div class="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>${formatDate(order.createdAt)} • ${formatTime(order.createdAt)}</span>
                </div>

                <div class="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    <span>${order.paymentMethod === 'CASH' ? 'Naqd pul' : 'Karta orqali'}</span>
                </div>

                <div class="detail-row" style="color: var(--purple); font-weight: 600;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                        <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h9zm0 0h5.5a1 1 0 001-.8l1.5-6a1 1 0 00-1-1.2H13"/>
                    </svg>
                    <span>${deliveryText}</span>
                </div>
            </div>
        </div>

        ${itemsHTML}

        <div class="order-footer">
            <div class="order-time">${formatTime(order.createdAt)}</div>
            <div class="order-total">${totalPrice.toLocaleString()} so'm</div>
        </div>
    `;

    return card;
}

/**
 * Buyurtma detallari modalini ko'rsatish
 */
function showOrderDetail(orderData) {
    const order = orderData.order;
    const items = orderData.items || [];

    // Modal yaratish
    const modal = document.createElement('div');
    modal.className = 'order-modal active';
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };

    const shopImage = order.shopImage || '';
    const shopName = order.shopName || 'Restoran';

    let itemsHTML = '';
    if (items.length > 0) {
        itemsHTML = items.map(item => {
            const productImage = item.productImage || '';
            const productName = item.productName || 'Mahsulot';
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            const total = price * quantity;

            return `
            <div class="modal-item-row">
                ${productImage ? `
                    <img src="${productImage}" alt="${productName}" class="modal-product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="modal-product-fallback" style="display: none; width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); align-items: center; justify-content: center; font-size: 24px;">🍔</div>
                ` : `
                    <div class="modal-product-fallback" style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); display: flex; align-items: center; justify-content: center; font-size: 24px;">🍔</div>
                `}
                <div class="modal-item-info">
                    <div class="modal-item-name">${productName}</div>
                    <div class="modal-item-details">
                        <span>${quantity} ta × ${price.toLocaleString()} so'm</span>
                    </div>
                </div>
                <div class="modal-item-total">${total.toLocaleString()} so'm</div>
            </div>
            `;
        }).join('');
    }

    // 🔥 To'lovlar to'g'ri hisoblash
    const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const deliveryFee = order.deliveryFee || 0;
    const total = order.totalAmount || order.totalPrice || (subtotal + deliveryFee);

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Buyurtma #${order.id}</h2>
                <button class="close-modal" onclick="this.closest('.order-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div style="background: var(--gray-bg); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; color: var(--gray);">Status:</span>
                        <div class="order-status ${getStatusClass(order.status)}">
                            ${translateStatus(order.status)}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Restoran</h3>
                    <div style="background: var(--gray-bg); padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 12px;">
                        ${shopImage ? `
                            <img src="${shopImage}" alt="${shopName}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div style="width: 60px; height: 60px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: none; align-items: center; justify-content: center; font-size: 28px;">🏪</div>
                        ` : `
                            <div style="width: 60px; height: 60px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 28px;">🏪</div>
                        `}
                        <div>
                            <p style="font-weight: 600; margin-bottom: 4px;">${shopName}</p>
                            <p style="color: var(--gray); font-size: 14px;">${items.length} ta mahsulot</p>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Yetkazish ma'lumotlari</h3>
                    <div style="background: var(--gray-bg); padding: 12px; border-radius: 8px;">
                        <p style="color: var(--gray); font-size: 14px; margin-bottom: 4px;">📍 ${order.deliveryAddress || 'Manzil ko\'rsatilmagan'}</p>
                        <p style="color: var(--gray); font-size: 14px;">📞 ${order.phoneNumber || 'Telefon ko\'rsatilmagan'}</p>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Mahsulotlar</h3>
                    <div class="modal-items-container">
                        ${itemsHTML || '<p style="text-align: center; padding: 20px; color: var(--gray);">Mahsulotlar topilmadi</p>'}
                    </div>
                </div>

                <div style="background: var(--gray-bg); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray);">Mahsulotlar:</span>
                        <span style="font-weight: 600;">${subtotal.toLocaleString()} so'm</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--gray);">Yetkazib berish:</span>
                        <span style="font-weight: 600; color: ${deliveryFee > 0 ? 'var(--black)' : 'var(--green)'};">
                            ${deliveryFee > 0 ? deliveryFee.toLocaleString() + ' so\'m' : 'Bepul'}
                        </span>
                    </div>
                    <div style="height: 1px; background: var(--gray-light); margin: 8px 0;"></div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600;">Jami:</span>
                        <span style="font-size: 20px; font-weight: 700; color: var(--purple);">${total.toLocaleString()} so'm</span>
                    </div>
                </div>

                <div style="background: var(--purple); color: white; padding: 16px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px; font-weight: 600;">To'lov usuli:</span>
                        <span style="font-size: 16px; font-weight: 600;">${order.paymentMethod === 'CASH' ? '💵 Naqd pul' : '💳 Karta orqali'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; opacity: 0.9; font-size: 14px;">
                        <span>📅 ${formatDate(order.createdAt)}</span>
                        <span>🕐 ${formatTime(order.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Buyurtma ma'lumotlarini to'ldirish (shop va product info)
 */
async function enrichOrderData(orderData) {
    const order = orderData.order;
    const items = orderData.items || [];

    console.log('🔍 Enriching order #' + order.id);
    console.log('📦 Full order data:', JSON.stringify(orderData, null, 2));

    try {
        // 🔥 Yetkazib berish narxini backenddan olingan qiymatdan olish
        // Agar order.deliveryFee mavjud bo'lsa, uni ishlatamiz (shop.deliveryPrice ni emas!)
        if (order.deliveryFee === undefined || order.deliveryFee === null) {
            order.deliveryFee = 0;
        }
        console.log('💰 Delivery fee from backend:', order.deliveryFee);
        
        // ShopId turli joylarda bo'lishi mumkin
        const shopId = order.shopId || order.shop_id || order.shop?.id;
        
        if (shopId) {
            console.log('🏪 Getting shop info for shopId:', shopId);
            const shop = await getShopById(shopId);
            if (shop) {
                order.shopName = shop.name;
                order.shopImage = shop.image;
                order.shopId = shopId; // Ensure shopId is set
                console.log('✅ Shop found:', shop.name);
            } else {
                console.warn('⚠️ Shop not found for ID:', shopId);
            }
        } else {
            console.warn('⚠️ No shopId found in order');
        }

        // Har bir mahsulot uchun to'liq ma'lumot olish
        const enrichedItems = await Promise.all(
            items.map(async (item, index) => {
                console.log(`🍔 Processing item ${index + 1}:`, item);
                
                // Avval item.product obyektidan ma'lumotlarni olishga harakat qilamiz
                if (item.product) {
                    console.log('  ✨ Found product object in item:', item.product);
                    item.productName = item.product.name || item.productName || 'Mahsulot';
                    
                    // Rasm uchun turli field nomlarni tekshiramiz
                    item.productImage = item.product.imageUrl || 
                                       item.product.image || 
                                       item.product.img || 
                                       item.product.photo || 
                                       item.productImage;
                    
                    if (!item.price && item.product.price) {
                        item.price = item.product.price;
                    }
                    console.log(`  ✅ Used product object:`);
                    console.log(`     - Name: ${item.productName}`);
                    console.log(`     - Image URL: ${item.productImage || 'NO IMAGE FOUND'}`);
                    console.log(`     - Price: ${item.price}`);
                    console.log(`     - Available fields in product:`, Object.keys(item.product));
                    return item;
                }
                
                // ProductId ni turli nomlar bilan tekshiramiz
                const productId = item.productId || item.product_id || item.id;
                
                console.log(`  - Product ID: ${productId}`);
                console.log(`  - Current name: ${item.productName}`);
                console.log(`  - Current image: ${item.productImage}`);
                console.log(`  - ShopId available: ${shopId}`);
                
                // Agar mahsulot ma'lumoti to'liq bo'lmasa va API dan olish kerak bo'lsa
                if ((!item.productName || !item.productImage) && productId && shopId) {
                    try {
                        console.log(`  - Fetching product info: shopId=${shopId}, productId=${productId}`);
                        const product = await getProductInfo(shopId, productId);
                        
                        if (product) {
                            console.log('  ✅ Product found from API:', product);
                            item.productName = product.name || item.productName || 'Mahsulot';
                            item.productImage = product.imageUrl || item.productImage;
                            if (!item.price && product.price) {
                                item.price = product.price;
                            }
                            console.log(`  ✅ Updated from API: ${item.productName} - ${item.productImage ? 'Has image' : 'No image'}`);
                        } else {
                            console.warn('  ⚠️ Product not found from API');
                            item.productName = item.productName || 'Mahsulot';
                        }
                    } catch (error) {
                        console.error('  ❌ Error fetching product from API:', error);
                        item.productName = item.productName || 'Mahsulot';
                    }
                } else {
                    if (!productId) console.warn(`  ⚠️ Missing productId`);
                    if (!shopId) console.warn(`  ⚠️ Missing shopId`);
                    item.productName = item.productName || 'Mahsulot';
                }
                
                return item;
            })
        );

        console.log('✅ Enrichment completed for order #' + order.id);
        console.log('📊 Final enriched data:', { order, items: enrichedItems });
        
        return {
            order: order,
            items: enrichedItems
        };
    } catch (error) {
        console.error('❌ Buyurtma ma\'lumotlarini enrichment qilishda xatolik:', error);
        return orderData;
    }
}

/**
 * Buyurtmalarni yuklash
 */
async function loadOrders() {
    const phone = getUserPhone();

    if (!phone) {
        showEmptyOrders();
        return;
    }

    loadingOrders.classList.add('active');
    ordersContainer.innerHTML = '';

    try {
        console.log('📱 Loading orders for phone:', phone);
        
        // Avval do'konlarni yuklaymiz (cache uchun)
        console.log('🏪 Loading shops cache...');
        await loadShops();
        console.log('✅ Shops cache loaded');

        // Buyurtmalarni yuklaymiz
        // encodeURIComponent telefon raqamni to'g'ri encode qiladi
        const encodedPhone = encodeURIComponent(phone);
        console.log('📞 Encoded phone:', encodedPhone);
        
        const response = await fetch(
            `${API_BASE_URL}/api/orders/by-phone?phoneNumber=${encodedPhone}`
        );

        if (!response.ok) {
            // Response body ni o'qib ko'ramiz
            const errorText = await response.text().catch(() => 'No error details');
            console.warn('⚠️ Server response:', response.status, errorText);
            
            // 404 yoki 400 - buyurtmalar yo'q
            if (response.status === 404 || response.status === 400) {
                console.log('ℹ️ No orders found for this user (status: ' + response.status + ')');
                loadingOrders.classList.remove('active');
                showEmptyOrders();
                return;
            }
            throw new Error(`Buyurtmalarni yuklashda xatolik: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Raw orders data:', data);

        // Data null, undefined yoki bo'sh massiv bo'lishi mumkin
        if (!data || (Array.isArray(data) && data.length === 0)) {
            console.log('ℹ️ No orders in response data');
            loadingOrders.classList.remove('active');
            showEmptyOrders();
            return;
        }

        console.log(`🔄 Enriching ${data.length} orders...`);
        
        // Har bir buyurtma uchun to'liq ma'lumot olish
        const enrichedOrders = await Promise.all(
            data.map(orderData => enrichOrderData(orderData))
        );

        console.log('✅ All orders enriched:', enrichedOrders);

        loadingOrders.classList.remove('active');

        // Buyurtmalarni sanaga qarab guruhlash
        const groupedOrders = groupOrdersByDate(enrichedOrders);

        // Sanalarni teskari tartibda saralash (eng yangi birinchi)
        const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(b) - new Date(a));

        // Har bir sana uchun buyurtmalarni render qilish
        sortedDates.forEach(dateKey => {
            const orders = groupedOrders[dateKey];

            // Buyurtmalarni teskari tartibda saralash (eng oxirgi birinchi)
            orders.sort((a, b) => new Date(b.order.createdAt) - new Date(a.order.createdAt));

            // Sana guruhi
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = formatDate(orders[0].order.createdAt);
            dateGroup.appendChild(dateHeader);

            // Har bir buyurtma kartasi
            orders.forEach(orderData => {
                const card = renderOrderCard(orderData);
                dateGroup.appendChild(card);
            });

            ordersContainer.appendChild(dateGroup);
        });

        console.log('🎉 Orders rendered successfully!');

    } catch (error) {
        console.error('❌ Buyurtmalarni yuklashda xatolik:');
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        loadingOrders.classList.remove('active');
        
        // Agar network error bo'lsa
        if (error.message.includes('Failed to fetch')) {
            showError('Internetga ulanishda muammo. Iltimos, internet ulanishingizni tekshiring.');
        } else {
            showError(error.message || 'Noma\'lum xatolik yuz berdi');
        }
    }
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});