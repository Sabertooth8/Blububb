// ==============================
// BLUBUBB CART SYSTEM
// Modern shopping cart with localStorage persistence
// ==============================

const CartManager = {
    STORAGE_KEY: 'blububb_cart',

    // Initialize cart
    init() {
        this.updateBadge();
        this.renderCartDrawer();
        this.bindEvents();
    },

    // Get cart from localStorage
    getCart() {
        const cart = localStorage.getItem(this.STORAGE_KEY);
        return cart ? JSON.parse(cart) : { items: [], total: 0, itemCount: 0 };
    },

    // Save cart to localStorage
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateBadge();
        this.renderCartDrawer();
    },

    // Add product to cart
    add(product) {
        const cart = this.getCart();
        const existingItem = cart.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.price * existingItem.quantity;
        } else {
            cart.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image,
                subtotal: product.price
            });
        }

        this.recalculate(cart);
        this.saveCart(cart);
        this.showAddedFeedback(product.name);
        return cart;
    },

    // Remove item from cart
    remove(productId) {
        const cart = this.getCart();
        cart.items = cart.items.filter(item => item.id !== productId);
        this.recalculate(cart);
        this.saveCart(cart);
        return cart;
    },

    // Update quantity
    updateQty(productId, quantity) {
        const cart = this.getCart();
        const item = cart.items.find(i => i.id === productId);

        if (item) {
            if (quantity <= 0) {
                return this.remove(productId);
            }
            item.quantity = quantity;
            item.subtotal = item.price * quantity;
        }

        this.recalculate(cart);
        this.saveCart(cart);
        return cart;
    },

    // Recalculate totals
    recalculate(cart) {
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    },

    // Clear cart
    clear() {
        const emptyCart = { items: [], total: 0, itemCount: 0 };
        this.saveCart(emptyCart);
        return emptyCart;
    },

    // Get total
    getTotal() {
        return this.getCart().total;
    },

    // Format price
    formatPrice(price) {
        return 'Rp ' + price.toLocaleString('id-ID');
    },

    // Update cart badge
    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const cart = this.getCart();
            badge.textContent = cart.itemCount;
            badge.style.display = cart.itemCount > 0 ? 'flex' : 'none';
        }
    },

    // Show added feedback
    showAddedFeedback(productName) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${productName} ditambahkan ke keranjang!</span>
        `;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    // Render cart drawer content
    renderCartDrawer() {
        const cartContent = document.getElementById('cartContent');
        const cartTotal = document.getElementById('cartTotal');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');

        if (!cartContent) return;

        const cart = this.getCart();

        if (cart.items.length === 0) {
            cartContent.innerHTML = '';
            if (cartEmpty) cartEmpty.style.display = 'flex';
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }

        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'block';

        cartContent.innerHTML = cart.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">${this.formatPrice(item.price)}</p>
                    <div class="cart-item-qty">
                        <button class="qty-btn minus" data-id="${item.id}">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        if (cartTotal) {
            cartTotal.textContent = this.formatPrice(cart.total);
        }
    },

    // Bind events
    bindEvents() {
        // Cart toggle
        const cartToggle = document.getElementById('cartToggle');
        const cartDrawer = document.getElementById('cartDrawer');
        const cartOverlay = document.getElementById('cartOverlay');
        const cartClose = document.getElementById('cartClose');

        if (cartToggle && cartDrawer) {
            cartToggle.addEventListener('click', () => {
                cartDrawer.classList.add('active');
                cartOverlay?.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (cartClose) {
            cartClose.addEventListener('click', () => {
                cartDrawer?.classList.remove('active');
                cartOverlay?.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                cartDrawer?.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Quantity buttons (event delegation)
        document.addEventListener('click', (e) => {
            const minusBtn = e.target.closest('.qty-btn.minus');
            const plusBtn = e.target.closest('.qty-btn.plus');
            const removeBtn = e.target.closest('.cart-item-remove');

            if (minusBtn) {
                const id = minusBtn.dataset.id;
                const cart = this.getCart();
                const item = cart.items.find(i => i.id === id);
                if (item) this.updateQty(id, item.quantity - 1);
            }

            if (plusBtn) {
                const id = plusBtn.dataset.id;
                const cart = this.getCart();
                const item = cart.items.find(i => i.id === id);
                if (item) this.updateQty(id, item.quantity + 1);
            }

            if (removeBtn) {
                const id = removeBtn.dataset.id;
                this.remove(id);
            }
        });
    }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    CartManager.init();
});

// Export for use in other scripts
window.CartManager = CartManager;
