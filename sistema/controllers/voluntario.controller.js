const db = require('../db.js');

function gerarHtmlLista(busca = '%%', area = '', status = 'Ativo') {
    let sql = `SELECT * FROM voluntarios WHERE (nome LIKE ? OR cpf LIKE ?) AND status = ?`;
    let params = [busca, busca, status];

    if (area) {
        sql += ` AND area_atuacao = ?`;
        params.push(area);
    }
    sql += ` ORDER BY nome ASC`;

    const voluntarios = db.prepare(sql).all(...params);

    if (voluntarios.length === 0) {
        return `
            <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
                <i class="ph ph-users text-5xl text-slate-300 mb-3 block"></i>
                <h3 class="text-lg font-bold text-slate-700">Nenhum voluntário encontrado</h3>
                <p class="text-slate-500">Ajuste os filtros ou cadastre uma nova pessoa.</p>
            </div>
        `;
    }

    return voluntarios.map(vol => {
        const termoAssinado = vol.termo_assinado === 1;
        const badgeTermo = termoAssinado 
            ? `<span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase" title="Assinado em ${vol.data_assinatura_termo}">Termo OK <i class="ph ph-check-circle"></i></span>`
            : `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase cursor-pointer hover:bg-rose-200" hx-get="/voluntarios/modal-termo/${vol.id}" hx-target="#modal-container">Pendente <i class="ph ph-warning"></i></span>`;

        return `
            <div class="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-sm transition-all cursor-pointer group">
                <div class="flex items-center gap-4" hx-get="/voluntarios/modal/${vol.id}" hx-target="#modal-container">
                    <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 flex items-center justify-center text-2xl transition-colors shrink-0">
                        <i class="ph ph-user"></i>
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg flex items-center gap-2">
                            ${vol.nome}
                            ${badgeTermo}
                        </h4>
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            ${vol.area_atuacao || 'Geral'} • <span class="normal-case font-medium text-slate-400 text-xs">${vol.telefone || 'Sem telefone'}</span>
                        </p>
                    </div>
                </div>
                <div class="flex flex-col items-end shrink-0 gap-1 text-right">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibilidade</span>
                    <span class="text-xs font-medium text-slate-600 max-w-[150px] truncate" title="${vol.disponibilidade || 'Não informada'}">
                        ${vol.disponibilidade || 'Não informada'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

exports.renderizarTelaPrincipal = (request, reply) => {
    const listaInicialHtml = gerarHtmlLista(); 

    const html = `
        <div class="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 relative animate-fade-in">
            <div class="bg-white p-5 border-b border-slate-200 shadow-sm shrink-0 z-10 flex gap-4 items-center justify-between">
                <div class="flex gap-4 flex-1">
                    <div class="relative w-1/2">
                        <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                        <input type="search" id="buscaVoluntario" name="busca" placeholder="Buscar por nome ou CPF..." 
                               hx-get="/voluntarios/lista" hx-trigger="input changed delay:300ms, search" hx-target="#lista-voluntarios" hx-include="#filtroArea, #filtroStatus"
                               class="w-full pl-10 pr-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-slate-700 font-medium">
                    </div>
                    <select id="filtroArea" name="area" hx-get="/voluntarios/lista" hx-target="#lista-voluntarios" hx-include="#buscaVoluntario, #filtroStatus"
                            class="py-3 px-4 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer font-bold text-slate-600">
                        <option value="">Todas as Áreas</option>
                        <option value="Cozinha">Cozinha</option>
                        <option value="Triagem">Triagem (Roupas/Doações)</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Profissional">Profissional (Psicólogo/Advogado)</option>
                    </select>
                </div>
                
                <button hx-get="/voluntarios/modal/novo" hx-target="#modal-container" 
                        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 shadow-md">
                    <i class="ph ph-user-plus text-xl"></i> Novo Voluntário
                </button>
            </div>

            <div id="lista-voluntarios" class="flex-1 overflow-y-auto p-6 flex flex-col gap-3" 
                 hx-get="/voluntarios/lista" hx-trigger="atualizaListaVoluntarios from:body" hx-include="#buscaVoluntario, #filtroArea, #filtroStatus">
                ${listaInicialHtml}
            </div>

            <div id="modal-container"></div>
        </div>
    `;
    return reply.type('text/html').send(html);
};

exports.listarVoluntarios = (request, reply) => {
    const busca = request.query.busca ? `%${request.query.busca}%` : '%%';
    const area = request.query.area || '';
    const status = request.query.status || 'Ativo';
    
    const html = gerarHtmlLista(busca, area, status);
    return reply.type('text/html').send(html);
};

exports.salvarVoluntario = (request, reply) => {
    try {
        const { id, nome, cpf, telefone, email, area_atuacao, nome_emergencia, telefone_emergencia } = request.body;
        
        let disponibilidadeArray = request.body.disponibilidade;
        let disponibilidadeStr = '';
        if (disponibilidadeArray) {
            disponibilidadeStr = Array.isArray(disponibilidadeArray) ? disponibilidadeArray.join(', ') : disponibilidadeArray;
        }

        if (id) {
            db.prepare(`
                UPDATE voluntarios SET 
                nome = ?, cpf = ?, telefone = ?, email = ?, area_atuacao = ?, disponibilidade = ?, 
                nome_emergencia = ?, telefone_emergencia = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(nome, cpf, telefone, email, area_atuacao, disponibilidadeStr, nome_emergencia, telefone_emergencia, id);
        } else {
            db.prepare(`
                INSERT INTO voluntarios (nome, cpf, telefone, email, area_atuacao, disponibilidade, nome_emergencia, telefone_emergencia)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(nome, cpf, telefone, email, area_atuacao, disponibilidadeStr, nome_emergencia, telefone_emergencia);
        }

        reply.header('HX-Trigger', 'atualizaListaVoluntarios');
        return reply.send(''); 
    } catch (error) {
        console.error("❌ Erro ao salvar voluntário:", error);
        return reply.status(500).send(`<script>alert("Erro: CPF já cadastrado ou falha no banco.");</script>`);
    }
};

exports.assinarTermo = (request, reply) => {
    try {
        const id = request.params.id;
        db.prepare(`
            UPDATE voluntarios SET termo_assinado = 1, data_assinatura_termo = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(id);

        reply.header('HX-Trigger', 'atualizaListaVoluntarios');
        return reply.send('');
    } catch (error) {
        console.error("❌ Erro ao assinar termo:", error);
        return reply.status(500).send("Erro ao assinar termo.");
    }
};

exports.modalFormulario = (request, reply) => {
    return reply.type('text/html').send(`<div>Modal de Formulario em construção...</div>`);
};

exports.modalTermo = (request, reply) => {
    return reply.type('text/html').send(`<div>Modal do Termo em construção...</div>`);
};