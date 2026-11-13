// ==========================================================================
// COMPONENTE: HEADER, BUSCA RÁPIDA E EVENTOS DE TOPO
// ==========================================================================

let templateBuscaItemHtml = "";

async function carregarTemplateBusca() {
    if (templateBuscaItemHtml) return templateBuscaItemHtml;
    try {
        const res = await fetch('/Parts/cardBuscaItem.html');
        if (!res.ok) throw new Error("Erro ao carregar cardBuscaItem.html");
        templateBuscaItemHtml = await res.text();
        return templateBuscaItemHtml;
    } catch (e) {
        console.error(e);
        return "";
    }
}

function initHeaderEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.toLowerCase().trim();
            const estahNoCatalogo = window.location.pathname.includes('catalogo');

            if (estahNoCatalogo) {
                if (typeof atualizarURL === 'function') atualizarURL({ busca: term, pagina: 1 });
            } else {
                if (!term) {
                    if (searchDropdown) searchDropdown.style.display = 'none';
                    return;
                }

                const filtered = (window.products || []).filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    p.desc.toLowerCase().includes(term)
                ).slice(0, 5);

                await mostrarDropdownBusca(filtered, term);
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const term = searchInput.value.trim();
                if (term && !window.location.pathname.includes('catalogo')) {
                    window.location.href = `/catalogo/?busca=${encodeURIComponent(term)}`;
                }
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const term = searchInput.value.trim();
            if (term && !window.location.pathname.includes('catalogo')) {
                window.location.href = `/catalogo/?busca=${encodeURIComponent(term)}`;
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box-wrapper') && searchDropdown) {
            searchDropdown.style.display = 'none';
        }
    });

    document.getElementById('cartOpenBtn')?.addEventListener('click', toggleCart);
    document.getElementById('cartCloseBtn')?.addEventListener('click', toggleCart);
}
window.initHeaderEvents = initHeaderEvents;

async function mostrarDropdownBusca(items, termoBuscado) {
    const searchDropdown = document.getElementById('searchDropdown');
    if (!searchDropdown) return;

    if (items.length === 0) {
        searchDropdown.innerHTML = `<div style="padding: 15px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Nenhum produto encontrado.</div>`;
        searchDropdown.style.display = 'block';
        return;
    }

    const templateItem = await carregarTemplateBusca();
    const precosLiberados = typeof isPrecosVisiveis === 'function' ? isPrecosVisiveis() : false;

    let html = items.map(p => {
        const precoReal = typeof obterPrecoReal === 'function' ? obterPrecoReal(p) : 0;
        const precoExibido = precosLiberados ? `R$ ${precoReal.toFixed(2).replace('.', ',')}` : 'Preço sob consulta';
        
        return templateItem
            .replace(/{{id}}/g, p.id)
            .replace(/{{nome}}/g, p.name)
            .replace(/{{precoExibido}}/g, precoExibido);
    }).join('');

    html += `
        <div class="search-dropdown-footer">
            <a href="/catalogo/?busca=${encodeURIComponent(termoBuscado)}">
                Ver todos os resultados para "${termoBuscado}" <i class="fa-solid fa-arrow-right"></i>
            </a>
        </div>
    `;

    searchDropdown.innerHTML = html;
    searchDropdown.style.display = 'block';
}

function irParaProduto(id) {
    window.location.href = `/produto/?id=${id}`;
}
window.irParaProduto = irParaProduto;