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

    // Garante que o caminho começa com "/" sem duplicar caso já tenha
    const normalizarCaminho = (caminho) => {
        if (!caminho) return '';
        return caminho.startsWith('/') ? caminho : `/${caminho}`;
    };

    // Monta a lista unificada colocando a fotoCapa primeiro com destaque
    const todasImagens = [];
    const capaNormalizada = normalizarCaminho(p.fotoCapa);

    if (capaNormalizada) {
        todasImagens.push({ url: capaNormalizada, isCapa: true });
    }

    if (Array.isArray(p.fotos)) {
        p.fotos.forEach(foto => {
            const fotoNormalizada = normalizarCaminho(foto);
            if (fotoNormalizada && fotoNormalizada !== capaNormalizada) {
                todasImagens.push({ url: fotoNormalizada, isCapa: false });
            }
        });
    }

    if (todasImagens.length > 0) {
        // Carrega a primeira imagem (Capa, se existir) como principal
        mainImg.src = todasImagens[0].url;
        mainImg.style.display = 'block';

        // Exibe as miniaturas se houver mais de 1 imagem (ou mesmo se só tiver a capa, para manter o destaque)
        if (todasImagens.length > 1) {
            thumbGallery.innerHTML = todasImagens.map((img, index) => `
                <div class="thumbnail-item ${img.isCapa ? 'thumbnail-capa' : ''} ${index === 0 ? 'active' : ''}" 
                     onclick="trocarFotoPrincipal('${img.url}', this)"
                     title="${img.isCapa ? 'Foto Principal (Capa)' : `Foto ${index + 1}`}">
                    <img src="${img.url}" alt="${img.isCapa ? 'Capa do produto' : `Miniatura ${index + 1}`}">
                    ${img.isCapa ? '<span class="capa-badge">Capa</span>' : ''}
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
            .replace(/{{fotoCapa}}/g, p.fotoCapa )
            .replace(/{{precoFormatado}}/g, precoFormatado);
    }).join('');
}