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
    // Persiste apenas id, quantidade e nome (fallback); o preço é sempre obtido do JSON
    const dadosMinimos = (window.cart || []).map(item => ({
        id: item.id,
        quantity: item.quantity,
        name: item.name
    }));
    const dadosStr = JSON.stringify(dadosMinimos);
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
                const parsed = JSON.parse(valorDecodificado);
                if (Array.isArray(parsed)) {
                    window.cart = parsed
                        .filter(item => item && item.id != null && Number(item.quantity) > 0)
                        .map(item => ({
                            id: item.id,
                            name: item.name || '',
                            quantity: Number(item.quantity)
                        }));
                } else {
                    window.cart = [];
                }
            } catch (e) {
                console.error("Erro ao ler o carrinho dos cookies:", e);
                window.cart = [];
            }
        }
    }
}

function obterProdutoJsonCarrinho(productId) {
    const lista = window.products || [];
    return lista.find(p => Number(p.id) === Number(productId)) || null;
}

function obterNomeCarrinhoItem(item) {
    const prodJson = obterProdutoJsonCarrinho(item.id);
    return (prodJson && prodJson.name) || item.name || `Produto #${item.id}`;
}

function obterPrecoUnitarioCarrinho(productId) {
    const visivel = typeof isPrecosVisiveis === 'function' ? isPrecosVisiveis() : false;
    if (!visivel) return null;

    const prodJson = obterProdutoJsonCarrinho(productId);
    if (!prodJson || typeof obterPrecoReal !== 'function') return 0;

    return Number(obterPrecoReal(prodJson)) || 0;
}

function addToCart(productId) {
    const prodJson = obterProdutoJsonCarrinho(productId);

    if (!prodJson) {
        console.warn("Produto não encontrado na base ao adicionar ao carrinho:", productId);
        return;
    }

    if (!window.cart) window.cart = [];

    const itemInCart = window.cart.find(item => Number(item.id) === Number(productId));

    if (itemInCart) {
        itemInCart.quantity++;
        itemInCart.name = prodJson.name;
    } else {
        window.cart.push({
            id: prodJson.id,
            name: prodJson.name,
            quantity: 1
        });
    }

    salvarCarrinhoCookie();
    updateCartUI();
}
window.addToCart = addToCart;

function alterarQuantidade(productId, delta) {
    const itemIndex = window.cart.findIndex(item => Number(item.id) === Number(productId));

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

    const precosVisiveis = typeof isPrecosVisiveis === 'function' ? isPrecosVisiveis() : false;

    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top:20px;">Seu carrinho está vazio.</p>';
    } else {
        const templateItem = await carregarTemplateCarrinhoItem();
        let totalSum = 0;

        let htmlItens = window.cart.map(item => {
            const nomeItem = obterNomeCarrinhoItem(item);
            const precoUnit = obterPrecoUnitarioCarrinho(item.id);
            const temPreco = precosVisiveis && precoUnit !== null;

            const precoFormatado = temPreco
                ? `R$ ${precoUnit.toFixed(2).replace('.', ',')} un.`
                : 'Preço sob consulta';

            const subtotalFormatado = temPreco
                ? `R$ ${(precoUnit * item.quantity).toFixed(2).replace('.', ',')}`
                : '---';

            if (temPreco) {
                totalSum += precoUnit * item.quantity;
            }

            return templateItem
                .replace(/{{id}}/g, item.id)
                .replace(/{{nome}}/g, nomeItem)
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

        if (cartTotalEl) {
            cartTotalEl.innerText = precosVisiveis
                ? `R$ ${totalSum.toFixed(2).replace('.', ',')}`
                : 'R$ ---';
        }
        return;
    }

    if (cartTotalEl) {
        cartTotalEl.innerText = precosVisiveis ? 'R$ 0,00' : 'R$ ---';
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
    let totalGeral = 0;

    window.cart.forEach(item => {
        const nomeItem = obterNomeCarrinhoItem(item);
        const precoUnit = obterPrecoUnitarioCarrinho(item.id);
        const temPreco = precosVisiveis && precoUnit !== null;

        if (temPreco) {
            const subtotal = precoUnit * item.quantity;
            totalGeral += subtotal;
            message += `• ${item.quantity}x ${nomeItem} (R$ ${subtotal.toFixed(2).replace('.', ',')})\n`;
        } else {
            message += `• ${item.quantity}x ${nomeItem} (Preço sob consulta)\n`;
        }
    });

    if (precosVisiveis) {
        message += `\n*Total Estimado:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
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