// ==========================================================================
// SEGURANÇA, AUTENTICAÇÃO E LÓGICA DE PREÇOS
// ==========================================================================

// Chave temporária mantida em memória durante a sessão ativa
let chaveSessaoAtiva = null;

// --- GERENCIAMENTO DE COOKIE DE AUTENTICAÇÃO (3 DIAS) ---
function salvarChaveCookie(senha) {
    const d = new Date();
    d.setTime(d.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 dias de validade
    document.cookie = `tiparts_key=${encodeURIComponent(senha)};expires=${d.toUTCString()};path=/`;
}

function carregarChaveCookie() {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith('tiparts_key=')) {
            try {
                chaveSessaoAtiva = decodeURIComponent(c.substring('tiparts_key='.length));
            } catch (e) {
                chaveSessaoAtiva = null;
            }
        }
    }
}

function apagarChaveCookie() {
    document.cookie = "tiparts_key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    chaveSessaoAtiva = null;
}

// --- DESCRIPTOGRAFIA E VALIDAÇÃO ---
function descriptografarTexto(textoCriptografado, senha) {
    if (!textoCriptografado || !senha) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(textoCriptografado, senha);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || null;
    } catch (e) {
        return null;
    }
}

function validarFormatoPreco(texto) {
    if (!texto) return false;
    // Valida estritamente números no formato "0.00" (duas casas decimais)
    const regexPreco = /^\d+(\.\d{2})$/;
    return regexPreco.test(texto.trim());
}

// Verifica se os preços devem estar visíveis com base na chave e no modo vitrine
function isPrecosVisiveis() {
    const modoVitrineAtivo = sessionStorage.getItem('tiparts_modo_vitrine') === 'true';
    
    if (chaveSessaoAtiva && window.products && window.products.length > 0) {
        const teste = descriptografarTexto(window.products[0].precoCriptografado, chaveSessaoAtiva);
        if (validarFormatoPreco(teste) && !modoVitrineAtivo) {
            return true;
        }
    }
    return false;
}
window.isPrecosVisiveis = isPrecosVisiveis;

// Retorna o valor numérico real do produto (0 se oculto)
function obterPrecoReal(produto) {
    if (!isPrecosVisiveis() || !produto || !produto.precoCriptografado) return 0;
    const precoStr = descriptografarTexto(produto.precoCriptografado, chaveSessaoAtiva);
    return parseFloat(precoStr) || 0;
}
window.obterPrecoReal = obterPrecoReal;

// Tenta validar a senha inserida pelo lojista usando o 1º produto como teste
function tentarDescriptografarPrecos() {
    const inputSenha = document.getElementById('senhaLojistaInput');
    if (!inputSenha) return;
    const senhaDigitada = inputSenha.value.trim();

    if (!senhaDigitada) {
        alert("Digite uma senha.");
        return;
    }

    if (!window.products || window.products.length === 0) {
        alert("Aguarde os produtos carregarem.");
        return;
    }

    const primeiroProduto = window.products[0];
    const testeDescriptografado = descriptografarTexto(primeiroProduto.precoCriptografado, senhaDigitada);

    if (validarFormatoPreco(testeDescriptografado)) {
        chaveSessaoAtiva = senhaDigitada;
        salvarChaveCookie(senhaDigitada);
        sessionStorage.removeItem('tiparts_modo_vitrine');

        inputSenha.value = "";
        
        // Atualiza a interface gráfica se as funções existirem
        if (typeof atualizarEstadoPrecosUI === 'function') atualizarEstadoPrecosUI();
        if (typeof renderProducts === 'function') renderProducts(window.products);
        if (typeof updateCartUI === 'function') updateCartUI();

        alert("Senha correta! Preços liberados por 3 dias.");
    } else {
        alert("Senha incorreta ou inválida!");
    }
}
window.tentarDescriptografarPrecos = tentarDescriptografarPrecos;

function alternarModoVitrine() {
    const modoAtual = sessionStorage.getItem('tiparts_modo_vitrine') === 'true';
    sessionStorage.setItem('tiparts_modo_vitrine', !modoAtual);
    
    if (typeof atualizarEstadoPrecosUI === 'function') atualizarEstadoPrecosUI();
    if (typeof renderProducts === 'function') renderProducts(window.products);
    if (typeof updateCartUI === 'function') updateCartUI();
}
window.alternarModoVitrine = alternarModoVitrine;

function atualizarEstadoPrecosUI() {
    const statusText = document.getElementById('statusAcessoText');
    const divFormSenha = document.getElementById('divFormSenha');
    const divModoVitrine = document.getElementById('divModoVitrine');
    const txtModoVitrine = document.getElementById('txtModoVitrine');
    
    const precosLiberados = isPrecosVisiveis();
    const modoVitrineAtivo = sessionStorage.getItem('tiparts_modo_vitrine') === 'true';

    if (!statusText) return;

    if (!chaveSessaoAtiva || !precosLiberados) {
        statusText.innerHTML = `Status: <strong style="color: #e74c3c;">Preços Ocultos / Senha Necessária</strong>`;
        if (divFormSenha) divFormSenha.style.display = 'flex';
        if (divModoVitrine) divModoVitrine.style.display = 'none';
    } else {
        if (modoVitrineAtivo) {
            statusText.innerHTML = `Status: <strong style="color: #e67e22;">Modo Vitrine Ativo (Preços Ocultos para Clientes)</strong>`;
            if (divFormSenha) divFormSenha.style.display = 'none';
            if (divModoVitrine) divModoVitrine.style.display = 'block';
            if (txtModoVitrine) txtModoVitrine.innerText = "Exibir Preços Novamente";
        } else {
            statusText.innerHTML = `Status: <strong style="color: #27ae60;">Acesso Lojista Liberado</strong>`;
            if (divFormSenha) divFormSenha.style.display = 'none';
            if (divModoVitrine) divModoVitrine.style.display = 'block';
            if (txtModoVitrine) txtModoVitrine.innerText = "Esconder Preços (Modo Vitrine Balcão)";
        }
    }
}
window.atualizarEstadoPrecosUI = atualizarEstadoPrecosUI;

// Inicializa os cookies ao carregar o script
carregarChaveCookie();