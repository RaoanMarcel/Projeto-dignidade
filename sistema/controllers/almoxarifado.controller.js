const db = require('../db.js');
const distribuicaoService = require('../services/distribuicao.service.js');

// 🛠️ FUNÇÃO AUXILIAR: Monta o HTML da lista
function gerarHtmlLista(busca = '%%', categoria = '') {
    let sql = `SELECT * FROM estoque_itens WHERE nome LIKE ?`;
    let params = [busca];

    if (categoria) {
        sql += ` AND categoria = ?`;
        params.push(categoria);
    }
    sql += ` ORDER BY nome ASC`;

    const itens = db.prepare(sql).all(...params);

    if (itens.length === 0) {
        return `
            <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
                <i class="ph ph-package text-5xl text-slate-300 mb-3 block"></i>
                <h3 class="text-lg font-bold text-slate-700">Nenhum item encontrado</h3>
                <p class="text-slate-500">Tente buscar por outro termo ou adicione um novo produto abaixo.</p>
            </div>
        `;
    }

    return itens.map(item => {
        const isZerado = item.quantidade === 0;
        const corCard = isZerado ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white hover:border-indigo-300';
        const corQtd = isZerado ? 'text-rose-600 bg-rose-100' : 'text-indigo-700 bg-indigo-50';

        // Tag de Condição
        let corCondicao = 'bg-slate-100 text-slate-600';
        if (item.condicao === 'Novo') corCondicao = 'bg-emerald-100 text-emerald-700';
        if (item.condicao === 'Bom') corCondicao = 'bg-blue-100 text-blue-700';
        if (item.condicao === 'Razoável') corCondicao = 'bg-amber-100 text-amber-700';

        return `
            <div hx-get="/almoxarifado/item/${item.id}" hx-target="#modal-container" 
                 class="flex items-center justify-between p-4 rounded-xl border ${corCard} shadow-sm transition-all cursor-pointer group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full ${isZerado ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} flex items-center justify-center text-2xl transition-colors shrink-0">
                        <i class="ph ph-package"></i>
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg flex items-center gap-2">
                            ${item.nome}
                            ${item.tamanho ? `<span class="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">${item.tamanho}</span>` : ''}
                            ${item.condicao ? `<span class="${corCondicao} text-[10px] px-2 py-0.5 rounded font-bold uppercase">${item.condicao}</span>` : ''}
                        </h4>
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">${item.categoria} ${item.descricao ? `• <span class="normal-case font-medium text-slate-400 text-xs">${item.descricao}</span>` : ''}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end shrink-0">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disponível</span>
                    <div class="px-4 py-1.5 rounded-lg ${corQtd} font-black text-lg min-w-[60px] text-center">
                        ${item.quantidade}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 1. TELA PRINCIPAL
exports.renderizarTelaPrincipal = (request, reply) => {
    const listaInicialHtml = gerarHtmlLista(); 

    const html = `
        <div class="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 relative animate-fade-in">
            <div class="bg-white p-5 border-b border-slate-200 shadow-sm shrink-0 z-10 flex gap-4 items-center">
                <div class="relative flex-1">
                    <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                    <input type="search" id="inputBusca" name="busca" placeholder="Buscar produto (ex: Escova, Calça Jeans)..." 
                           hx-get="/almoxarifado/lista" hx-trigger="input changed delay:300ms, search" hx-target="#lista-almoxarifado" hx-include="#selectCategoria"
                           class="w-full pl-10 pr-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-slate-700 font-medium">
                </div>
                
                <select id="selectCategoria" name="categoria" hx-get="/almoxarifado/lista" hx-target="#lista-almoxarifado" hx-include="#inputBusca"
                        class="py-3 px-4 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer font-bold text-slate-600">
                    <option value="">Todas Categorias</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Vestuário">Vestuário</option>
                    <option value="Cama/Banho">Cama e Banho</option>
                    <option value="Alimento">Alimento</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>

            <div id="lista-almoxarifado" class="flex-1 overflow-y-auto p-6 flex flex-col gap-3" 
                 hx-get="/almoxarifado/lista" 
                 hx-trigger="atualizaLista from:body" 
                 hx-include="#inputBusca, #selectCategoria">
                ${listaInicialHtml}
            </div>

            <div class="bg-indigo-50 p-5 border-t border-indigo-100 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <form hx-post="/almoxarifado/entrada" hx-swap="none" hx-on::after-request="if(event.detail.successful) this.reset()" class="flex flex-col gap-3 max-w-6xl mx-auto">
                    
                    <div class="flex gap-3 items-end">
                        <div class="flex-1">
                            <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Nome do Produto</label>
                            <input type="text" name="nome" placeholder="Ex: Calça Jeans, Sabonete..." class="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold" required>
                        </div>
                        <div class="w-40">
                            <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Categoria</label>
                            <select name="categoria" class="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold" required>
                                <option value="Vestuário">Vestuário</option>
                                <option value="Higiene">Higiene</option>
                                <option value="Cama/Banho">Cama/Banho</option>
                                <option value="Alimento">Alimento</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div class="w-28">
                            <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Tamanho</label>
                            <input type="text" name="tamanho" placeholder="Ex: M, 40" class="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold">
                        </div>
                        <div class="w-28">
                            <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Qtd.</label>
                            <input type="number" name="quantidade" placeholder="0" class="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-black" required min="1">
                        </div>
                    </div>

                    <div class="flex gap-3 items-end">
                        <div class="w-48">
                            <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Estado / Condição</label>
                            <select name="condicao" class="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                                <option value="Novo">Novo (Sem uso)</option>
                                <option value="Bom" selected>Bom (Usado)</option>
                                <option value="Razoável">Razoável (Com marcas)</option>
                            </select>
                        </div>
                        <div class="flex-1">
                            <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Observação / Descrição</label>
                            <input type="text" name="descricao" placeholder="Ex: Gola polo, marca X, etc." class="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                        </div>
                        <button type="submit" class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 shadow-md">
                            <i class="ph ph-plus-circle text-xl"></i> Adicionar
                        </button>
                    </div>

                </form>
            </div>
            
            <div id="modal-container"></div>
        </div>
    `;
    return reply.type('text/html').send(html);
};

// 2. LISTA DE ITENS
exports.listarItens = (request, reply) => {
    const busca = request.query.busca ? `%${request.query.busca}%` : '%%';
    const categoria = request.query.categoria || '';
    const html = gerarHtmlLista(busca, categoria);
    return reply.type('text/html').send(html);
};

// 3. ADICIONAR ENTRADA 
exports.adicionarEntrada = (request, reply) => {
    try {
        const { nome, categoria, tamanho, quantidade, condicao, descricao } = request.body;
        const qtd = parseInt(quantidade);
        const tam = tamanho || '';
        const desc = descricao || '';
        const statusItem = 'Disponível';

        const itemExistente = db.prepare(`SELECT id FROM estoque_itens WHERE LOWER(nome) = LOWER(?) AND categoria = ? AND tamanho = ? AND condicao = ?`).get(nome, categoria, tam, condicao);
        let itemId;

        if (itemExistente) {
            db.prepare(`UPDATE estoque_itens SET quantidade = quantidade + ?, descricao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(qtd, desc, itemExistente.id);
            itemId = itemExistente.id;
        } else {
            const info = db.prepare(`INSERT INTO estoque_itens (nome, descricao, categoria, quantidade, condicao, tamanho, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nome, desc, categoria, qtd, condicao, tam, statusItem);
            itemId = info.lastInsertRowid;
        }

        db.prepare(`INSERT INTO estoque_movimentacoes (item_id, tipo, quantidade, observacao) VALUES (?, 'ENTRADA', ?, 'Entrada manual')`).run(itemId, qtd);

        reply.header('HX-Trigger', 'atualizaLista');
        return reply.send(''); 
    } catch (error) {
        console.error("❌ Erro ao salvar item:", error);
        return reply.status(500).send('Erro interno ao salvar o item.');
    }
};

// 4. MODAL DO ITEM
exports.modalItem = (request, reply) => {
    const id = request.params.id;
    const item = db.prepare('SELECT * FROM estoque_itens WHERE id = ?').get(id);
    if (!item) return reply.send('');

    const html = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-2 flex-wrap">
                            <span class="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">${item.categoria}</span>
                            ${item.tamanho ? `<span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Tam: ${item.tamanho}</span>` : ''}
                            ${item.condicao ? `<span class="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">${item.condicao}</span>` : ''}
                        </div>
                        <h2 class="text-2xl font-black text-slate-800">${item.nome}</h2>
                        ${item.descricao ? `<p class="text-sm text-slate-500 mt-1">${item.descricao}</p>` : ''}
                    </div>
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-slate-400 hover:text-rose-500 transition-colors">
                        <i class="ph ph-x text-xl font-bold"></i>
                    </button>
                </div>
                
                <div class="p-6 bg-slate-50 flex flex-col items-center justify-center py-8">
                    <span class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Quantidade em Estoque</span>
                    <span class="text-6xl font-black ${item.quantidade > 0 ? 'text-emerald-500' : 'text-rose-500'} drop-shadow-sm">${item.quantidade}</span>
                </div>

                    <div class="p-6 border-t border-slate-100">
                        ${item.quantidade > 0 
                            ? `<button hx-get="/almoxarifado/distribuir/${item.id}" 
                                       hx-target="#modal-container" 
                                       hx-trigger="click"
                                       class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
                                    <i class="ph ph-hand-heart text-xl"></i> Distribuir Item
                               </button>` 
                            : `<div class="w-full py-4 bg-rose-100 text-rose-500 font-black uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-2">
                                    <i class="ph ph-warning text-xl"></i> Estoque Esgotado
                               </div>`
                        }
                    </div>
            </div>
        </div>
    `;
    return reply.type('text/html').send(html);
};

// 5. MODAL DE DISTRIBUIÇÃO SIMPLES
exports.modalDistribuicao = (request, reply) => {
    const html = distribuicaoService.gerarModalDistribuicao(request.params.itemId);
    return reply.type('text/html').send(html);
};

exports.registrarEntrega = (request, reply) => {
    try {
        const { itemId } = request.params;
        const { beneficiario } = request.body; 
        
        if (!beneficiario) {
            throw new Error("Nenhum beneficiário foi selecionado.");
        }

        // Se veio apenas 1 pessoa, o Fastify manda como string. Se vierem várias, manda como Array.
        // Essa linha garante que sempre teremos um Array para o nosso banco de dados processar.
        const beneficiariosArray = Array.isArray(beneficiario) ? beneficiario : [beneficiario];

        distribuicaoService.registrarEntregaNoBanco(itemId, beneficiariosArray);

        // Dispara o gatilho para atualizar a lista no fundo e fecha o modal
        reply.header('HX-Trigger', 'atualizaLista');
        return reply.send('');

    } catch (error) {
        console.error("❌ Erro ao distribuir:", error);
        return reply.status(500).send(`<script>alert("Erro: ${error.message}"); document.getElementById('modal-container').innerHTML = '';</script>`);
    }
};