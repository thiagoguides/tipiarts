// ==========================================================================
// GESTÃO DO CARRINHO DE COMPRAS E PERSISTÊNCIA (COOKIES)
// ==========================================================================
let cart = [];
let lembrarCarrinho = true;

document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinhoCookie();
    updateCartUI();
});

// --- GERENCIAMENTO DE COOKIES DO CARRINHO ---
function salvarCarrinhoCookie() {
    const dadosStr = JSON.stringify(cart);
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
    document.cookie = `tiparts_cart=${encodeURIComponent(dadosStr)};expires=${d.toUTCString()};path=/`;
}

function carregarCarrinhoCookie() {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith('tiparts_cart=')) {
            try {
                const valor = c.substring('tiparts_cart='.length);
                cart = JSON.parse(decodeURIComponent(valor));
            } catch (e) {
                console.error("Erro ao ler o carrinho dos cookies:", e);
                cart = [];
            }
        }
    }
}

function addToCart(productId) {
    if (typeof products === 'undefined') return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const itemInCart = cart.find(item => item.id === productId);

    if (itemInCart) {
        itemInCart.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    salvarCarrinhoCookie();
    updateCartUI();
}

function alterarQuantidade(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity += delta;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }

    salvarCarrinhoCookie();
    updateCartUI();
}

function updateCartUI() {
    const cartCountEl = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    if (!cartCountEl) return;

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.innerText = totalCount;

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top:20px;">Seu carrinho está vazio.</p>';
    } else {
        let htmlItens = cart.map(item => `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                <div style="flex: 1;">
                    <div class="cart-item-title" style="font-size: 0.9rem; font-weight: 600;">${item.name}</div>
                    <div class="cart-item-price" style="font-size: 0.85rem; color: var(--text-muted);">${window.isPrecosVisiveis && window.isPrecosVisiveis() ? `R$ ${item.price.toFixed(2).replace('.', ',')} un.` : 'Preço sob consulta'}</div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; margin: 0 10px;">
                    <button onclick="alterarQuantidade(${item.id}, -1)" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark); width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="font-size: 0.9rem; font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button onclick="alterarQuantidade(${item.id}, 1)" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-dark); width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                </div>

                <strong style="color: var(--accent); min-width: 70px; text-align: right;">${window.isPrecosVisiveis && window.isPrecosVisiveis() ? `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}` : '---'}</strong>
            </div>
        `).join('');

        htmlItens += `
            <div style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="lembrarCarrinhoCheck" ${lembrarCarrinho ? 'checked' : ''} onchange="toggleLembrarCarrinho(this)" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--accent);">
                <label for="lembrarCarrinhoCheck" style="font-size: 0.85rem; color: var(--text-muted); cursor: pointer;">Lembrar itens para próximos pedidos</label>
            </div>
        `;

        cartItemsContainer.innerHTML = htmlItens;
    }

    if (cartTotalEl) {
        const totalSum = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalEl.innerText = window.isPrecosVisiveis && window.isPrecosVisiveis() ? `R$ ${totalSum.toFixed(2).replace('.', ',')}` : 'R$ ---';
    }
}

function toggleLembrarCarrinho(checkbox) {
    lembrarCarrinho = checkbox.checked;
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
}

// --- ENVIO WHATSAPP COM DADOS DO CLIENTE E STRING COMPACTA PARA O C# ---
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    // Recupera dados salvos permanentemente do cliente
    const clienteSalvo = JSON.parse(localStorage.getItem('tiparts_cliente') || '{}');
    if (!clienteSalvo.nome || !clienteSalvo.telefone) {
        alert("Por favor, preencha seus dados de cadastro (Nome e Telefone) no botão de Ajustes antes de enviar o pedido.");
        const modal = document.getElementById('ajustesModal');
        if (modal) modal.style.display = 'flex';
        return;
    }

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = `${agora.getHours()}:${agora.getMinutes().toString().padStart(2, '0')}h`;

    const codigoCompacto = cart.map(item => `${item.id}:${item.quantity}`).join(',');

    const phone = "5543999999999"; 
    let message = `pedido gerado pelo site ${dataFormatada} as ${horaFormatada}\n`;
    message += `código do pedido= "${codigoCompacto}"\n\n`;
    
    // Inserção dos dados do cliente para leitura automática pelo C#
    message += `*Dados do Lojista:*\n`;
    message += `• Nome/Loja: ${clienteSalvo.nome}\n`;
    message += `• Telefone: ${clienteSalvo.telefone}\n`;
    message += `• Endereço: ${clienteSalvo.endereco || 'Não informado'}\n\n`;

    message += `*Itens do Pedido (Conferência):*\n`;
    
    cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name} (${window.isPrecosVisiveis && window.isPrecosVisiveis() ? `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}` : 'Preço sob consulta'})\n`;
    });

    if (window.isPrecosVisiveis && window.isPrecosVisiveis()) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        message += `\n*Total Estimado:* R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    if (!lembrarCarrinho) {
        cart = [];
        document.cookie = "tiparts_cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    
    updateCartUI();
    toggleCart();
}