const db = require('../db.js');

// 🛠️ FUNÇÃO AUXILIAR: Monta o HTML da lista para podermos usar na tela inicial e na busca
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
        const isZerado = item.quantidade_atual === 0;
        const corCard = isZerado ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white hover:border-indigo-300';
        const corQtd = isZerado ? 'text-rose-600 bg-rose-100' : 'text-indigo-700 bg-indigo-50';

        return `
            <div hx-get="/almoxarifado/item/${item.id}" hx-target="#modal-container" 
                 class="flex items-center justify-between p-4 rounded-xl border ${corCard} shadow-sm transition-all cursor-pointer group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full ${isZerado ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} flex items-center justify-center text-2xl transition-colors">
                        <i class="ph ph-package"></i>
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg flex items-center gap-2">
                            ${item.nome}
                            ${item.tamanho ? `<span class="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">${item.tamanho}</span>` : ''}
                        </h4>
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">${item.categoria}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disponível</span>
                    <div class="px-4 py-1.5 rounded-lg ${corQtd} font-black text-lg min-w-[60px] text-center">
                        ${item.quantidade_atual}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 1. TELA PRINCIPAL (Agora pré-carrega a lista)
exports.renderizarTelaPrincipal = (request, reply) => {
    const listaInicialHtml = gerarHtmlLista(); // Carrega os itens do banco imediatamente

    const html = `
        <div class="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 relative animate-fade-in">
            <div class="bg-white p-5 border-b border-slate-200 shadow-sm shrink-0 z-10 flex gap-4 items-center">
                <div class="relative flex-1">
                    <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                    <input type="text" name="busca" placeholder="Buscar produto (ex: Escova, Sabonete)..." 
                           hx-get="/almoxarifado/lista" hx-trigger="keyup changed delay:300ms" hx-target="#lista-almoxarifado" hx-include="[name='categoria']"
                           class="w-full pl-10 pr-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-slate-700 font-medium">
                </div>
                
                <select name="categoria" hx-get="/almoxarifado/lista" hx-target="#lista-almoxarifado" hx-include="[name='busca']"
                        class="py-3 px-4 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer font-bold text-slate-600">
                    <option value="">Todas Categorias</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Vestuário">Vestuário</option>
                    <option value="Cama/Banho">Cama e Banho</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>

            <div id="lista-almoxarifado" class="flex-1 overflow-y-auto p-6 flex flex-col gap-3" 
                 hx-get="/almoxarifado/lista" 
                 hx-trigger="atualizaLista from:body" 
                 hx-include="[name='busca'], [name='categoria']">
                ${listaInicialHtml}
            </div>

            <div class="bg-indigo-50 p-5 border-t border-indigo-100 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <form hx-post="/almoxarifado/entrada" hx-swap="none" hx-on::after-request="if(event.detail.successful) this.reset()" class="flex gap-3 items-end max-w-6xl mx-auto">
                    <div class="flex-1">
                        <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Adicionar / Criar Produto</label>
                        <input type="text" name="nome" placeholder="Nome do Produto..." class="w-full p-3 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold" required>
                    </div>
                    <div class="w-40">
                        <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Categoria</label>
                        <select name="categoria" class="w-full p-3 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold" required>
                            <option value="Higiene">Higiene</option>
                            <option value="Vestuário">Vestuário</option>
                            <option value="Cama/Banho">Cama/Banho</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div class="w-28">
                        <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Tamanho</label>
                        <input type="text" name="tamanho" placeholder="Ex: M, 40" class="w-full p-3 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-bold">
                    </div>
                    <div class="w-28">
                        <label class="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Qtd.</label>
                        <input type="number" name="quantidade" placeholder="0" class="w-full p-3 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-black" required min="1">
                    </div>
                    <button type="submit" class="px-6 py-3 h-[50px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 shadow-md">
                        <i class="ph ph-plus-circle text-xl"></i> Salvar
                    </button>
                </form>
            </div>
        </div>
    `;
    return reply.type('text/html').send(html);
};

// 2. LISTA DE ITENS (Filtragem e Busca via HTMX)
exports.listarItens = (request, reply) => {
    const busca = request.query.busca ? `%${request.query.busca}%` : '%%';
    const categoria = request.query.categoria || '';
    const html = gerarHtmlLista(busca, categoria);
    return reply.type('text/html').send(html);
};

// 3. ADICIONAR ENTRADA 
exports.adicionarEntrada = (request, reply) => {
    try {
        const { nome, categoria, tamanho, quantidade } = request.body;
        const qtd = parseInt(quantidade);
        const tam = tamanho || '';

        console.log(`📥 Salvando no banco: ${qtd}x ${nome} (${categoria}) - Tamanho: ${tam}`); // ← LOG PARA ACOMPANHARMOS

        const itemExistente = db.prepare(`SELECT id FROM estoque_itens WHERE LOWER(nome) = LOWER(?) AND categoria = ? AND tamanho = ?`).get(nome, categoria, tam);
        let itemId;

        if (itemExistente) {
            db.prepare(`UPDATE estoque_itens SET quantidade_atual = quantidade_atual + ? WHERE id = ?`).run(qtd, itemExistente.id);
            itemId = itemExistente.id;
        } else {
            const info = db.prepare(`INSERT INTO estoque_itens (nome, categoria, tamanho, quantidade_atual) VALUES (?, ?, ?, ?)`).run(nome, categoria, tam, qtd);
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

// 4. MODAL DO ITEM (Mantido igual)
exports.modalItem = (request, reply) => {
    const id = request.params.id;
    const item = db.prepare('SELECT * FROM estoque_itens WHERE id = ?').get(id);
    if (!item) return reply.send('');

    const html = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">${item.categoria}</span>
                            ${item.tamanho ? `<span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Tamanho: ${item.tamanho}</span>` : ''}
                        </div>
                        <h2 class="text-2xl font-black text-slate-800">${item.nome}</h2>
                    </div>
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-slate-400 hover:text-rose-500 transition-colors">
                        <i class="ph ph-x text-xl font-bold"></i>
                    </button>
                </div>
                
                <div class="p-6 bg-slate-50 flex flex-col items-center justify-center py-8">
                    <span class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Quantidade em Estoque</span>
                    <span class="text-6xl font-black ${item.quantidade_atual > 0 ? 'text-emerald-500' : 'text-rose-500'} drop-shadow-sm">${item.quantidade_atual}</span>
                </div>

                <div class="p-6 border-t border-slate-100">
                    ${item.quantidade_atual > 0 
                        ? `<button hx-get="/almoxarifado/distribuir/${item.id}" hx-target="#modal-container" hx-swap="innerHTML" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
                                <i class="ph ph-share-network text-xl"></i> Distribuir / Entregar Produto
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

// 5. MODAL DE DISTRIBUIÇÃO JUSTA (Mantido igual)
exports.modalDistribuicao = (request, reply) => {
    const itemId = request.params.itemId;
    const item = db.prepare('SELECT nome, quantidade_atual FROM estoque_itens WHERE id = ?').get(itemId);

    const sql = `
        SELECT 
            b.id, b.nome, b.foto,
            MAX(m.data_registro) as ultima_data,
            CAST(julianday('now', 'localtime') - julianday(MAX(m.data_registro))) AS dias_atras
        FROM beneficiarios b
        LEFT JOIN estoque_movimentacoes m ON b.id = m.beneficiario_id AND m.item_id = ? AND m.tipo = 'SAIDA'
        WHERE b.status = 'Acolhido'
        GROUP BY b.id
        ORDER BY dias_atras IS NOT NULL, dias_atras DESC, b.nome ASC
    `;

    const beneficiarios = db.prepare(sql).all(itemId);

    let listaHtml = beneficiarios.map(b => {
        let statusTag = '';
        if (b.dias_atras === null) statusTag = `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Nunca recebeu</span>`;
        else if (b.dias_atras === 0) statusTag = `<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Recebeu Hoje</span>`;
        else if (b.dias_atras < 7) statusTag = `<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Há ${Math.floor(b.dias_atras)} dias</span>`;
        else statusTag = `<span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Há ${Math.floor(b.dias_atras)} dias</span>`;

        return `
            <div class="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-white transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                        ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : `<i class="ph ph-user text-slate-400 text-xl flex items-center justify-center h-full"></i>`}
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm leading-tight">${b.nome}</p>
                        <div class="mt-1">${statusTag}</div>
                    </div>
                </div>
                <button hx-post="/almoxarifado/entregar/${itemId}/${b.id}" hx-swap="none" onclick="document.getElementById('modal-container').innerHTML = ''"
                        class="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-black uppercase rounded-lg transition-colors border border-indigo-100 shrink-0">
                    Entregar 1
                </button>
            </div>
        `;
    }).join('');

    const html = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onclick="event.stopPropagation()">
                <div class="bg-indigo-600 p-5 flex justify-between items-center text-white shrink-0 shadow-md z-10">
                    <div>
                        <h3 class="font-black text-lg flex items-center gap-2"><i class="ph ph-hand-heart text-2xl"></i> Distribuir Produto</h3>
                        <p class="text-indigo-200 text-sm font-medium mt-0.5">Item: <b>${item.nome}</b> (${item.quantidade_atual} disponíveis)</p>
                    </div>
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="hover:bg-indigo-500 p-2 rounded-full transition-colors"><i class="ph ph-x text-xl"></i></button>
                </div>
                <div class="overflow-y-auto flex-1 p-2 bg-slate-50">
                    ${listaHtml}
                </div>
            </div>
        </div>
    `;
    return reply.type('text/html').send(html);
};

// 6. PROCESSAR ENTREGA (Mantido igual)
exports.registrarEntrega = (request, reply) => {
    const { itemId, beneficiarioId } = request.params;

    const transaction = db.transaction(() => {
        const item = db.prepare('SELECT quantidade_atual FROM estoque_itens WHERE id = ?').get(itemId);
        if (item.quantidade_atual <= 0) throw new Error("Estoque zerado no momento da entrega.");
        db.prepare('UPDATE estoque_itens SET quantidade_atual = quantidade_atual - 1 WHERE id = ?').run(itemId);
        db.prepare(`INSERT INTO estoque_movimentacoes (item_id, beneficiario_id, tipo, quantidade, observacao) VALUES (?, ?, 'SAIDA', 1, 'Distribuição Direta')`).run(itemId, beneficiarioId);
    });

    try {
        transaction();
        reply.header('HX-Trigger', 'atualizaLista');
        return reply.send('');
    } catch (error) {
        console.error("❌ Erro ao entregar item:", error);
        return reply.status(500).send(`<div class="p-4 bg-rose-100 text-rose-700 rounded-xl m-4 font-bold border border-rose-200">Erro: ${error.message}</div>`);
    }
};