// ==========================================================================
// PÁGINA: HOME / INICIAL (Com os 20 principais produtos por Nível)
// ==========================================================================

let cardTemplateCatalogoHtml = "";

async function carregarTemplateCardGlobal() {
    if (cardTemplateCatalogoHtml) return cardTemplateCatalogoHtml;
    try {
        const res = await fetch('/Parts/cardProduto.html');
        if (!res.ok) throw new Error("Erro ao carregar o template do card.");
        cardTemplateCatalogoHtml = await res.text();
        return cardTemplateCatalogoHtml;
    } catch (e) {
        console.error("Erro ao carregar cardProduto.html:", e);
        return "";
    }
}

document.addEventListener('layoutPronto', async () => {
    initTheme();
    initHeaderEvents();
    initInformativoCarousel();
    initAjustesModal();
    
    // Carrega dados globais e o template do card
    await carregarTemplateCardGlobal();
    await carregarProdutosGlobais();

    // Pega os 20 principais produtos ordenados pelo 'nivel' do maior para o menor (0 a 1000)
    const produtosDestaque = [...window.products]
        .sort((a, b) => b.nivel - a.nivel)
        .slice(0, 10);

    renderProducts(produtosDestaque);
    atualizarEstadoPrecosUI();
});

function renderProducts(items) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid || !cardTemplateCatalogoHtml) return;

    if (items.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 30px;">Nenhum produto encontrado.</p>';
        return;
    }

    const precosLiberados = isPrecosVisiveis();

    productGrid.innerHTML = items.map(p => {
        let precoFormatado = '<span style="font-size: 0.9rem; color: var(--text-muted); font-style: italic;">Faça login em Ajustes</span>';

        if (precosLiberados) {
            const precoNum = obterPrecoReal(p);
            precoFormatado = `R$ ${precoNum.toFixed(2).replace('.', ',')}`;
        }
        
        return cardTemplateCatalogoHtml
            .replace(/{{id}}/g, p.id)
            .replace(/{{nome}}/g, p.name)
            .replace(/{{descricao}}/g, p.desc)
            .replace(/{{medidas}}/g, p.medidas || "")
            .replace(/{{precoFormatado}}/g, precoFormatado);
    }).join('');
}
window.renderProducts = renderProducts;