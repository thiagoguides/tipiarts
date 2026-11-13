// ==========================================================================
// COMPONENTE: CARRINHO DE COMPRAS E COOKIES
// ==========================================================================

let templateCarrinhoItemHtml = "";

async function carregarTemplateCarrinhoItem() {
    if (templateCarrinhoItemHtml) return templateCarrinhoItemHtml;
    try {
        const res = await fetch('/Parts/cardCarrinhoItem.html');
        if (!res.ok) throw new Error("Erro ao carregar cardCarrinhoItem.html");
        templateCarrinhoItemHtml = await res.text();
        return templateCarrinhoItemHtml;
    } catch (e) {
        console.error(e);
        return "";
    }
}

// Inicializa a variável do carrinho globalmente
window.cart = [];
window.lembrarCarrinho = true;

// 1. Carrega o cookie imediatamente para reter os dados na memória
carregarCarrinhoCookie();

// 2. Só atualiza a interface visual QUANDO o layout completo do site estiver pronto
document.addEventListener('layoutPronto', () => {
    updateCartUI();
});

function salvarCarrinhoCookie() {
    const dadosStr = JSON.stringify(window.cart);
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 dias
    document.cookie = `tiparts_cart=${encodeURIComponent(dadosStr)};expires=${d.toUTCString()};path=/`;
}

function carregarCarrinhoCookie() {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith('tiparts_cart=')) {
            try {
                const valorDecodificado = decodeURIComponent(c.substring('tiparts_cart='.length));
                window.cart = JSON.parse(valorDecodificado) || [];
            } catch (e) {
                console.error("Erro ao ler o carrinho dos cookies:", e);
                window.cart = [];
            }
        }
    }
}

function addToCart(productId) {
    const produtosDisponiveis = window.products || [];
    const product = produtosDisponiveis.find(p => p.id === productId);
    
    if (!product) {
        console.warn("Produto não encontrado na base ao adicionar ao carrinho:", productId);
        return;
    }

    if (!window.cart) window.cart = [];

    const itemInCart = window.cart.find(item => item.id === productId);
    const precoUnitario = typeof obterPrecoReal === 'function' ? obterPrecoReal(product) : 0;

    if (itemInCart) {
        itemInCart.quantity++;
        itemInCart.price = precoUnitario; 
    } else {
        window.cart.push({
            id: product.id,
            name: product.name,
            price: precoUnitario,
            quantity: 1
        });
    }
    
    salvarCarrinhoCookie();
    updateCartUI();
}
window.addToCart = addToCart;

function alterarQuantidade(productId, delta) {
    const itemIndex = window.cart.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
        window.cart[itemIndex].quantity += delta;
        if (window.cart[itemIndex].quantity <= 0) {
            window.cart.splice(itemIndex, 1);
        }
    }

    salvarCarrinhoCookie();
    updateCartUI();
}
window.alterarQuantidade = alterarQuantidade;

async function updateCartUI() {
    const cartCountEl = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    if (!cartCountEl) return;

    const totalCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.innerText = totalCount;

    if (!cartItemsContainer) return;

    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top:20px;">Seu carrinho está vazio.</p>';
    } else {
        const templateItem = await carregarTemplateCarrinhoItem();
        const precosVisiveis = typeof isPrecosVisiveis === 'function' ? isPrecosVisiveis() : false;

        let htmlItens = window.cart.map(item => {
            const precoFormatado = precosVisiveis ? `R$ ${item.price.toFixed(2).replace('.', ',')} un.` : 'Preço sob consulta';
            const subtotalFormatado = precosVisiveis ? `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}` : '---';

            return templateItem
                .replace(/{{id}}/g, item.id)
                .replace(/{{nome}}/g, item.name)
                .replace(/{{quantidade}}/g, item.quantity)
                .replace(/{{precoFormatado}}/g, precoFormatado)
                .replace(/{{subtotalFormatado}}/g, subtotalFormatado);
        }).join('');

        htmlItens += `
            <div style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="lembrarCarrinhoCheck" ${window.lembrarCarrinho ? 'checked' : ''} onchange="toggleLembrarCarrinho(this)" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--accent);">
                <label for="lembrarCarrinhoCheck" style="font-size: 0.85rem; color: var(--text-muted); cursor: pointer;">Lembrar itens para próximos pedidos</label>
            </div>
        `;

        cartItemsContainer.innerHTML = htmlItens;
    }

    if (cartTotalEl) {
        const precosVisiveis = typeof isPrecosVisiveis === 'function' ? isPrecosVisiveis() : false;
        const totalSum = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalEl.innerText = precosVisiveis ? `R$ ${totalSum.toFixed(2).replace('.', ',')}` : 'R$ ---';
    }
}
window.updateCartUI = updateCartUI;

function toggleLembrarCarrinho(checkbox) {
    window.lembrarCarrinho = checkbox.checked;
}
window.toggleLembrarCarrinho = toggleLembrarCarrinho;

function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
}
window.toggleCart = toggleCart;

function sendToWhatsApp() {
    if (window.cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = `${agora.getHours()}:${agora.getMinutes().toString().padStart(2, '0')}h`;

    const codigoCompacto = window.cart.map(item => `${item.id}:${item.quantity}`).join(',');
    const phone = "5543984051934"; // Substitua pelo seu WhatsApp

    let message = `pedido gerado pelo site ${dataFormatada} as ${horaFormatada}\n`;
    message += `código do pedido= "${codigoCompacto}"\n\n`;
    
    message += `*Itens do Pedido (Conferência):*\n`;
    
    const precosVisiveis = typeof isPrecosVisiveis === 'function' ? isPrecosVisiveis() : false;
    window.cart.forEach(item => {
        const sub = precosVisiveis ? `R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}` : 'Preço sob consulta';
        message += `• ${item.quantity}x ${item.name} (${sub})\n`;
    });

    if (precosVisiveis) {
        const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        message += `\n*Total Estimado:* R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    if (!window.lembrarCarrinho) {
        window.cart = [];
        document.cookie = "tiparts_cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    
    updateCartUI();
    toggleCart();
}
window.sendToWhatsApp = sendToWhatsApp;