// ==========================================================================
// PÁGINA: DETALHES DO PRODUTO
// ==========================================================================

let produtoAtual = null;
let qtdSelecionada = 1;
let cardTemplateProdHtml = "";
let templateTagCategoriaHtml = "";

document.addEventListener('layoutPronto', async () => {
    initTheme();
    initHeaderEvents();
    initAjustesModal();

    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = parseInt(urlParams.get('id'));

    if (!produtoId) {
        alert("Produto não especificado.");
        window.location.href = '/';
        return;
    }

    await carregarTemplatesProduto();
    await carregarDetalhesProduto(produtoId);
});

async function carregarTemplatesProduto() {
    try {
        const [resCard, resTag] = await Promise.all([
            fetch('/Parts/cardProduto.html'),
            fetch('/Parts/tagCategoria.html')
        ]);
        cardTemplateProdHtml = await resCard.text();
        templateTagCategoriaHtml = await resTag.text();
    } catch (e) {
        console.error("Erro ao carregar templates da página de produto:", e);
    }
}

async function carregarDetalhesProduto(id) {
    await carregarProdutosGlobais();
    
    produtoAtual = window.products.find(p => p.id === id);

    if (!produtoAtual) {
        alert("Produto não encontrado.");
        window.location.href = '/';
        return;
    }

    preencherDadosNaTela(produtoAtual);
    carregarRecomendacoes(window.products, produtoAtual);
}

function preencherDadosNaTela(p) {
    document.getElementById('productTitle').innerText = p.name;
    document.getElementById('productMeasures').innerText = p.medidas;
    document.getElementById('productDescShort').innerText = p.desc;
    document.getElementById('productDescFull').innerText = p.textoDescricaoCompleto;

    // Renderiza tags de categorias com o template externo
    const catContainer = document.getElementById('productCategoriesContainer');
    if (catContainer && templateTagCategoriaHtml) {
        catContainer.innerHTML = p.categories.map(cat => 
            templateTagCategoriaHtml.replace(/{{categoria}}/g, cat)
        ).join('');
    }

    const mainImg = document.getElementById('mainProductImage');
    const thumbGallery = document.getElementById('thumbnailGallery');

    if (p.fotos.length > 0) {
        mainImg.src = `/${p.fotos[0]}`;
        mainImg.style.display = 'block';

        if (p.fotos.length > 1) {
            thumbGallery.innerHTML = p.fotos.map((foto, index) => `
                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="trocarFotoPrincipal('/${foto}', this)">
                    <img src="/${foto}" alt="Miniatura ${index + 1}">
                </div>
            `).join('');
        } else {
            thumbGallery.innerHTML = '';
        }
    } else {
        mainImg.style.display = 'none';
        thumbGallery.innerHTML = '';
    }

    atualizarPrecoDetalhe(p);
}

function trocarFotoPrincipal(caminhoFoto, elementoThumbnail) {
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) mainImg.src = caminhoFoto;

    document.querySelectorAll('.thumbnail-item').forEach(item => item.classList.remove('active'));
    if (elementoThumbnail) elementoThumbnail.classList.add('active');
}
window.trocarFotoPrincipal = trocarFotoPrincipal;

function atualizarPrecoDetalhe(p) {
    const priceArea = document.getElementById('productPriceArea');
    const precosLiberados = isPrecosVisiveis();

    if (precosLiberados) {
        const valor = obterPrecoReal(p);
        priceArea.innerHTML = `R$ ${valor.toFixed(2).replace('.', ',')}`;
    } else {
        priceArea.innerHTML = `<span style="font-size: 1rem; color: var(--text-muted); font-style: italic; font-weight: normal;">Faça login em Ajustes para ver o preço</span>`;
    }
}

function alterarQtdDetalhe(delta) {
    qtdSelecionada += delta;
    if (qtdSelecionada < 1) qtdSelecionada = 1;
    const elQtd = document.getElementById('inputQtdProduto');
    if (elQtd) elQtd.innerText = qtdSelecionada;
}
window.alterarQtdDetalhe = alterarQtdDetalhe;

function adicionarProdutoAtualAoCarrinho() {
    if (!produtoAtual) return;
    
    for (let i = 0; i < qtdSelecionada; i++) {
        addToCart(produtoAtual.id);
    }
    toggleCart();
}
window.adicionarProdutoAtualAoCarrinho = adicionarProdutoAtualAoCarrinho;

function carregarRecomendacoes(todos, atual) {
    const grid = document.getElementById('recommendationsGrid');
    if (!grid || !cardTemplateProdHtml) return;

    let rel = todos.filter(p => p.id !== atual.id && p.categories.some(c => atual.categories.includes(c)));

    if (rel.length < 8) {
        const outros = todos.filter(p => p.id !== atual.id && !rel.includes(p));
        rel = rel.concat(outros);
    }

    const recomendados = rel.slice(0, 8);
    const precosLiberados = isPrecosVisiveis();

    grid.innerHTML = recomendados.map(p => {
        let precoFormatado = '<span style="font-size: 0.9rem; color: var(--text-muted); font-style: italic;">Faça login em Ajustes</span>';

        if (precosLiberados) {
            const precoNum = obterPrecoReal(p);
            precoFormatado = `R$ ${precoNum.toFixed(2).replace('.', ',')}`;
        }

        return cardTemplateProdHtml
            .replace(/{{id}}/g, p.id)
            .replace(/{{nome}}/g, p.name)
            .replace(/{{descricao}}/g, p.desc)
            .replace(/{{medidas}}/g, p.medidas || "")
            .replace(/{{precoFormatado}}/g, precoFormatado);
    }).join('');
}