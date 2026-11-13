// ==========================================================================
// CONSTRUTOR DINÂMICO DE COMPONENTES (PARTS)
// ==========================================================================

async function carregarComponente(idElemento, caminhoArquivo) {
    try {
        const resposta = await fetch(caminhoArquivo);
        if (!resposta.ok) throw new Error(`Erro ao carregar ${caminhoArquivo}`);
        const html = await resposta.text();
        const el = document.getElementById(idElemento);
        if (el) el.innerHTML = html;
    } catch (erro) {
        console.error(erro);
    }
}

async function construirPaginaInicial() {
    await Promise.all([
        carregarComponente('app-topo', '/Parts/topo.html'),
        carregarComponente('app-informativo', '/Parts/informativo.html'),
        carregarComponente('app-catalogo', '/Parts/catalogoInicial.html'),
        carregarComponente('app-rodape', '/Parts/rodape.html'),
        carregarComponente('app-catalogo-completo', '/Parts/catalogoCompleto.html'),
        carregarComponente('app-produto-detalhe', '/Parts/produtoDetalhe.html')
    ]);

    // Dispara evento informando que a estrutura HTML está pronta
    document.dispatchEvent(new CustomEvent('layoutPronto'));
}

document.addEventListener('DOMContentLoaded', construirPaginaInicial);