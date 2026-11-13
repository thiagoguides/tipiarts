// ==========================================================================
// COMPONENTE: MODAL DE AJUSTES E DADOS DO CLIENTE
// ==========================================================================

function initAjustesModal() {
    const modal = document.getElementById('ajustesModal');
    const openBtn = document.getElementById('ajustesOpenBtn');
    const closeBtn = document.getElementById('ajustesCloseBtn');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            if (typeof atualizarEstadoPrecosUI === 'function') atualizarEstadoPrecosUI();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    carregarDadosClienteNaTela();
}
window.initAjustesModal = initAjustesModal;

function salvarDadosCliente() {
    const nome = document.getElementById('clienteNome')?.value.trim();
    const telefone = document.getElementById('clienteTelefone')?.value.trim();
    const endereco = document.getElementById('clienteEndereco')?.value.trim();

    if (!nome || !telefone) {
        alert("Preencha ao menos o Nome e o Telefone para salvar.");
        return;
    }

    const dadosCliente = { nome, telefone, endereco };
    localStorage.setItem('tiparts_cliente', JSON.stringify(dadosCliente));
    
    alert("Dados do cliente salvos com sucesso!");
    const modal = document.getElementById('ajustesModal');
    if (modal) modal.style.display = 'none';
}
window.salvarDadosCliente = salvarDadosCliente;

function carregarDadosClienteNaTela() {
    const dadosSalvos = localStorage.getItem('tiparts_cliente');
    if (!dadosSalvos) return;

    try {
        const cliente = JSON.parse(dadosSalvos);
        if (document.getElementById('clienteNome')) document.getElementById('clienteNome').value = cliente.nome || '';
        if (document.getElementById('clienteTelefone')) document.getElementById('clienteTelefone').value = cliente.telefone || '';
        if (document.getElementById('clienteEndereco')) document.getElementById('clienteEndereco').value = cliente.endereco || '';
    } catch (e) {
        console.error("Erro ao carregar dados salvos do cliente:", e);
    }
}
window.carregarDadosClienteNaTela = carregarDadosClienteNaTela;