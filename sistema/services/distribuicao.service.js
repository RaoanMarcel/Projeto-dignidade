const db = require('../db.js');

exports.gerarModalDistribuicao = (itemId) => {
    const item = db.prepare('SELECT id, nome, quantidade, categoria, tamanho FROM estoque_itens WHERE id = ?').get(itemId);
    
    if (!item || item.quantidade <= 0) {
        return `<div class="p-6 text-center text-rose-500 font-bold bg-white rounded-xl shadow-lg">Estoque esgotado para este item.</div>`;
    }

    // 👇 Adicionei o 'b.apelido' na busca do SELECT
    const sql = `
        SELECT 
            b.id, b.nome, b.apelido, b.foto,
            ROUND(julianday('now', 'localtime') - julianday(MAX(m.data_registro))) AS dias_atras
        FROM beneficiarios b
        LEFT JOIN estoque_movimentacoes m ON b.id = m.beneficiario_id AND m.item_id = ? AND m.tipo = 'SAIDA'
        WHERE b.status = 'Acolhido'
        GROUP BY b.id
        ORDER BY dias_atras IS NULL DESC, dias_atras DESC, b.nome ASC
    `;

    const beneficiarios = db.prepare(sql).all(itemId);

    let listaHtml = beneficiarios.map(b => {
        let statusTag = '';
        if (b.dias_atras === null) {
            statusTag = `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-200 shadow-sm"><i class="ph ph-star"></i> Nunca recebeu</span>`;
        } else if (b.dias_atras === 0) {
            statusTag = `<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-rose-200 shadow-sm">Recebeu Hoje</span>`;
        } else if (b.dias_atras < 7) {
            statusTag = `<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-amber-200 shadow-sm">Há ${Math.floor(b.dias_atras)} dias</span>`;
        } else {
            statusTag = `<span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-300 shadow-sm">Há ${Math.floor(b.dias_atras)} dias</span>`;
        }

        // Variáveis seguras para a busca
        const nomeBusca = (b.nome || '').toLowerCase();
        const apelidoBusca = (b.apelido || '').toLowerCase();
        const textoApelido = b.apelido ? `<span class="text-slate-500 font-normal text-sm ml-1">(${b.apelido})</span>` : '';

        // Adicionamos a classe 'card-beneficiario' e os data-attributes para o filtro JS funcionar
        return `
            <label class="block cursor-pointer relative mb-2.5 group card-beneficiario" data-nome="${nomeBusca}" data-apelido="${apelidoBusca}">
                <input type="checkbox" name="beneficiario" value="${b.id}" onchange="toggleBeneficiario('${b.id}')" class="hidden checkbox-beneficiario">
                
                <div id="box-${b.id}" class="flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-100 bg-white transition-all shadow-sm hover:border-indigo-300 hover:shadow-md">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center shadow-sm">
                            ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : `<i class="ph ph-user text-slate-400 text-2xl"></i>`}
                        </div>
                        <div>
                            <p class="font-bold text-slate-800 text-[15px] leading-tight mb-1">
                                ${b.nome} ${textoApelido}
                            </p>
                            <div>${statusTag}</div>
                        </div>
                    </div>
                    
                    <div id="check-${b.id}" class="w-6 h-6 rounded-md border-2 border-slate-300 flex items-center justify-center text-transparent transition-colors shadow-sm">
                        <i class="ph ph-check font-bold"></i>
                    </div>
                </div>
            </label>
        `;
    }).join('');

    return `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onclick="event.stopPropagation()">
                
                <div class="bg-indigo-600 p-5 flex justify-between items-start text-white shrink-0 shadow-md z-10">
                    <div>
                        <h3 class="font-black text-xl flex items-center gap-2"><i class="ph ph-hand-heart text-2xl"></i> Distribuir Item</h3>
                        <div class="mt-2 flex flex-col gap-1">
                            <p class="text-white font-bold text-base leading-tight">${item.nome}</p>
                            <p class="text-indigo-200 text-xs font-medium uppercase tracking-wide flex items-center gap-2">
                                <span class="bg-indigo-700 px-2 py-0.5 rounded border border-indigo-500">${item.categoria}</span>
                                ${item.tamanho ? `<span class="bg-indigo-700 px-2 py-0.5 rounded border border-indigo-500">Tam: ${item.tamanho}</span>` : ''}
                            </p>
                        </div>
                    </div>
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="hover:bg-indigo-500 p-2 rounded-full transition-colors"><i class="ph ph-x text-xl"></i></button>
                </div>
                
                <form hx-post="/almoxarifado/entregar/${item.id}" hx-swap="none" hx-confirm="Confirma a entrega para as pessoas selecionadas?" class="flex-1 overflow-hidden flex flex-col">
                    
                    <div class="p-3 bg-indigo-50 text-xs text-indigo-800 font-bold shrink-0 border-b border-indigo-100 flex justify-between items-center shadow-inner">
                        <span class="flex items-center gap-1"><i class="ph ph-users text-lg"></i> Selecione os beneficiários</span>
                        <span class="bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm">
                            Estoque disponível: <b class="text-indigo-600 text-base" id="estoque-disponivel" data-estoque="${item.quantidade}">${item.quantidade}</b>
                        </span>
                    </div>

                    <div class="p-3 bg-white border-b border-slate-200 shrink-0">
                        <div class="relative">
                            <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                            <input type="text" id="input-busca" onkeyup="filtrarBeneficiarios()" placeholder="Buscar por nome ou apelido..." class="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400">
                        </div>
                    </div>

                    <div class="overflow-y-auto p-4 flex-1 bg-slate-50" id="lista-beneficiarios">
                        ${listaHtml}
                    </div>
                    
                    <div class="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
                        <button type="submit" id="btn-submit" disabled class="px-6 py-3 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            <i class="ph ph-paper-plane-right text-xl"></i> Selecione para Entregar
                        </button>
                    </div>
                </form>

            </div>
        </div>

        <script>
            // Função de Filtro em tempo real
            function filtrarBeneficiarios() {
                const termo = document.getElementById('input-busca').value.toLowerCase();
                const cards = document.querySelectorAll('.card-beneficiario');

                cards.forEach(card => {
                    const nome = card.getAttribute('data-nome');
                    const apelido = card.getAttribute('data-apelido');

                    // Se o termo digitado estiver no nome ou no apelido, mostra o card. Se não, esconde.
                    if (nome.includes(termo) || apelido.includes(termo)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }

            function toggleBeneficiario(id) {
                const checkbox = document.querySelector('input[value="' + id + '"]');
                const box = document.getElementById('box-' + id);
                const check = document.getElementById('check-' + id);

                if (checkbox.checked) {
                    box.classList.remove('border-slate-100', 'bg-white');
                    box.classList.add('border-indigo-500', 'bg-indigo-50');
                    check.classList.remove('border-slate-300', 'text-transparent');
                    check.classList.add('bg-indigo-600', 'border-indigo-600', 'text-white');
                } else {
                    box.classList.add('border-slate-100', 'bg-white');
                    box.classList.remove('border-indigo-500', 'bg-indigo-50');
                    check.classList.add('border-slate-300', 'text-transparent');
                    check.classList.remove('bg-indigo-600', 'border-indigo-600', 'text-white');
                }

                atualizarBotao();
            }

            function atualizarBotao() {
                const qtdSelecionada = document.querySelectorAll('.checkbox-beneficiario:checked').length;
                const estoqueTotal = parseInt(document.getElementById('estoque-disponivel').dataset.estoque);
                const btnSubmit = document.getElementById('btn-submit');

                if (qtdSelecionada === 0) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = '<i class="ph ph-paper-plane-right text-xl"></i> Selecione para Entregar';
                } else if (qtdSelecionada > estoqueTotal) {
                    btnSubmit.disabled = true;
                    btnSubmit.classList.replace('bg-indigo-600', 'bg-rose-600');
                    btnSubmit.innerHTML = '<i class="ph ph-warning text-xl"></i> Estoque Insuficiente';
                } else {
                    btnSubmit.disabled = false;
                    btnSubmit.classList.replace('bg-rose-600', 'bg-indigo-600');
                    btnSubmit.innerHTML = '<i class="ph ph-paper-plane-right text-xl"></i> Entregar para ' + qtdSelecionada + ' pessoa(s)';
                }
            }
        </script>
    `;
};

exports.registrarEntregaNoBanco = (itemId, beneficiariosIds) => {
    const transaction = db.transaction((idItem, ids) => {
        const item = db.prepare('SELECT quantidade FROM estoque_itens WHERE id = ?').get(idItem);
        
        if (item.quantidade < ids.length) {
            throw new Error(`Estoque insuficiente. Você tentou entregar ${ids.length} itens, mas só há ${item.quantidade} no estoque.`);
        }

        db.prepare('UPDATE estoque_itens SET quantidade = quantidade - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ids.length, idItem);

        const stmtMovimentacao = db.prepare(`INSERT INTO estoque_movimentacoes (item_id, beneficiario_id, tipo, quantidade, observacao) VALUES (?, ?, 'SAIDA', 1, 'Distribuição')`);
        
        for (const idBen of ids) {
            stmtMovimentacao.run(idItem, idBen);
        }
    });

    transaction(itemId, beneficiariosIds);
};