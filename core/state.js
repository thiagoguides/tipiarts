// ==========================================================================
// ESTADO GLOBAL DA APLICAÇÃO (STATE MANAGEMENT)
// ==========================================================================

// Coleção principal de produtos carregados do backend/JSON
window.products = [];

// Carrinho de compras em memória
window.cart = [];

// Preferência do usuário sobre salvar o carrinho no cookie
window.lembrarCarrinho = true;

// Template HTML do card de produto (carregado via utils.js)
window.cardTemplateGlobalHtml = "";

// Função utilitária para normalizar a estrutura dos produtos do JSON
function normalizarProduto(item) {
    return {
        id: item.id,
        name: item.nome,
        desc: item.descricao,
        medidas: item.medidas || "Sob medida",
        precoCriptografado: item.preco,
        category: item.categoria,
        categories: Array.isArray(item.categoria) ? item.categoria : [item.categoria || 'geral'],
        textoDescricaoCompleto: item.textoDescricaoCompleto || item.descricao,
        fotos: Array.isArray(item.fotos) && item.fotos.length > 0 ? item.fotos : (item.fotoCapa ? [item.fotoCapa] : []),
        nivel: item.nivel || 0
    };
}

// Carregador central de produtos para evitar requisições duplicadas
async function carregarProdutosGlobais() {
    if (window.products.length > 0) return window.products;

    try {
        const resposta = await fetch('/produto/produtos.json');
        if (!resposta.ok) throw new Error("Erro ao carregar os produtos.");
        const dados = await resposta.json();
        
        window.products = dados.map(normalizarProduto);
        return window.products;
    } catch (erro) {
        console.error("Erro ao carregar produtos.json:", erro);
        return [];
    }
}

window.carregarProdutosGlobais = carregarProdutosGlobais;