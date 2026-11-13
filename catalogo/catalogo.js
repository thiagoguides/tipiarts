// ==========================================================================
// PÁGINA: CATÁLOGO COMPLETO
// ==========================================================================

let cardTemplateCatalogoHtml = "";

document.addEventListener('layoutPronto', async () => {
    initTheme();
    initHeaderEvents();
    initAjustesModal();

    const res = await fetch('/Parts/cardProduto.html');
    cardTemplateCatalogoHtml = await res.text();

    await carregarProdutosGlobais();
    sincronizarFiltrosComURL();
    processarCatalogo();
    configurarEventosFiltro();
});

function obterParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    const categoriasParam = params.get('categoria');
    
    return {
        categorias: categoriasParam ? categoriasParam.split(',') : [],
        // Se nenhuma ordem foi passada na URL, assume 'relevancia' (destaque por nível) por padrão
        ordem: params.get('ordem') || 'relevancia',
        busca: params.get('busca') || '',
        pagina: parseInt(params.get('pagina')) || 1
    };
}

function atualizarURL(novosParametros) {
    const params = new URLSearchParams(window.location.search);
    
    Object.keys(novosParametros).forEach(chave => {
        if (novosParametros[chave] !== null && novosParametros[chave] !== '') {
            params.set(chave, novosParametros[chave]);
        } else {
            params.delete(chave);
        }
    });

    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    processarCatalogo();
}

function sincronizarFiltrosComURL() {
    const filtros = obterParametrosURL();

    const checkboxes = document.querySelectorAll('input[name="categoria"]');
    checkboxes.forEach(cb => {
        if (filtros.categorias.length === 0 || filtros.categorias.includes('todos')) {
            cb.checked = (cb.value === 'todos');
        } else {
            cb.checked = cb.value !== 'todos' && filtros.categorias.includes(cb.value);
        }
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = filtros.ordem;

    const searchInput = document.getElementById('searchInput');
    if (searchInput && filtros.busca) searchInput.value = filtros.busca;
}

function processarCatalogo() {
    const filtros = obterParametrosURL();
    let resultado = [...window.products];

    // 1. Filtrar por Busca (se houver)
    if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        resultado = resultado.filter(p => 
            p.name.toLowerCase().includes(termo) || 
            p.desc.toLowerCase().includes(termo)
        );
    }

    // 2. Filtrar por Categoria (Ignora se estiver vazio ou contiver 'todos')
    if (filtros.categorias.length > 0 && !filtros.categorias.includes('todos')) {
        resultado = resultado.filter(p => {
            // Suporta caso o produto tenha uma string única de categoria ou um array de categorias
            const catProduto = Array.isArray(p.category) ? p.category : [p.category];
            return catProduto.some(c => filtros.categorias.includes(c));
        });
    }

    // 3. Ordenação (Se 'relevancia' ou padrão sem filtro, ordena pelo nível de 0 a 1000)
    if (filtros.ordem === 'menor-preco') {
        resultado.sort((a, b) => obterPrecoReal(a) - obterPrecoReal(b));
    } else if (filtros.ordem === 'maior-preco') {
        resultado.sort((a, b) => obterPrecoReal(b) - obterPrecoReal(a));
    } else {
        // Padrão (Relevância / Destaque): Maior nível primeiro
        resultado.sort((a, b) => (b.nivel || 0) - (a.nivel || 0));
    }

    // 4. Paginação (20 itens por página)
    const itensPorPagina = 20;
    const totalPaginas = Math.ceil(resultado.length / itensPorPagina) || 1;
    
    if (filtros.pagina > totalPaginas) filtros.pagina = totalPaginas;
    if (filtros.pagina < 1) filtros.pagina = 1;

    const inicio = (filtros.pagina - 1) * itensPorPagina;
    const itensPaginaAtual = resultado.slice(inicio, inicio + itensPorPagina);

    renderizarGridCatalogo(itensPaginaAtual);
    renderizarPaginacao(totalPaginas, filtros.pagina);
}

function renderizarGridCatalogo(items) {
    const grid = document.getElementById('fullProductGrid');
    if (!grid || !cardTemplateCatalogoHtml) return;

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 40px;">Nenhum produto encontrado para estes filtros.</p>';
        return;
    }

    const precosLiberados = isPrecosVisiveis();

    grid.innerHTML = items.map(p => {
        let precoFormatado = '<span style="font-size: 0.9rem; color: var(--text-muted); font-style: italic;">Faça login em Ajustes</span>';
        if (precosLiberados) {
            const precoNum = obterPrecoReal(p);
            precoFormatado = `R$ ${precoNum.toFixed(2).replace('.', ',')}`;
        }

        return cardTemplateCatalogoHtml
            .replace(/{{id}}/g, p.id)
            .replace(/{{nome}}/g, p.name)
            .replace(/{{descricao}}/g, p.desc)
            .replace(/{{medidas}}/g, p.medidas)
            .replace(/{{precoFormatado}}/g, precoFormatado);
    }).join('');
}

function renderizarPaginacao(totalPaginas, paginaAtual) {
    let containerPaginacao = document.getElementById('paginationContainer');
    
    if (!containerPaginacao) {
        containerPaginacao = document.createElement('div');
        containerPaginacao.id = 'paginationContainer';
        containerPaginacao.className = 'pagination-container';
        document.querySelector('.catalog-content')?.appendChild(containerPaginacao);
    }

    if (totalPaginas <= 1) {
        containerPaginacao.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="page-btn ${i === paginaAtual ? 'active' : ''}" onclick="mudarPagina(${i})">${i}</button>`;
    }
    containerPaginacao.innerHTML = html;
}

function mudarPagina(novaPagina) {
    atualizarURL({ pagina: novaPagina });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.mudarPagina = mudarPagina;

function configurarEventosFiltro() {
    const checkboxes = document.querySelectorAll('input[name="categoria"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const selecionadas = [];
            
            if (cb.value === 'todos' && cb.checked) {
                checkboxes.forEach(c => { if (c.value !== 'todos') c.checked = false; });
                selecionadas.push('todos');
            } else {
                const todoCheckbox = document.querySelector('input[name="categoria"][value="todos"]');
                if (todoCheckbox) todoCheckbox.checked = false;
                
                checkboxes.forEach(c => { if (c.checked) selecionadas.push(c.value); });
                if (selecionadas.length === 0) {
                    if (todoCheckbox) todoCheckbox.checked = true;
                    selecionadas.push('todos');
                }
            }

            atualizarURL({ categoria: selecionadas.join(','), pagina: 1 });
        });
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            atualizarURL({ ordem: e.target.value, pagina: 1 });
        });
    }
}