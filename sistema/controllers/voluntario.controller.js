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

// 3. SALVAR VOLUNTÁRIO (Criar ou Atualizar)
exports.salvarVoluntario = (request, reply) => {
    try {
        const { id, nome, cpf, telefone, email, area_atuacao, nome_emergencia, telefone_emergencia, termo_assinado } = request.body;
        
        let disponibilidadeArray = request.body.disponibilidade;
        let disponibilidadeStr = '';
        if (disponibilidadeArray) {
            disponibilidadeStr = Array.isArray(disponibilidadeArray) ? disponibilidadeArray.join(', ') : disponibilidadeArray;
        }

        const assinou = termo_assinado ? 1 : 0;

        if (id) {
            db.prepare(`
                UPDATE voluntarios SET 
                nome = ?, cpf = ?, telefone = ?, email = ?, area_atuacao = ?, disponibilidade = ?, 
                nome_emergencia = ?, telefone_emergencia = ?, 
                data_assinatura_termo = CASE WHEN ? = 1 AND termo_assinado = 0 THEN CURRENT_TIMESTAMP ELSE data_assinatura_termo END,
                termo_assinado = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(nome, cpf, telefone, email, area_atuacao, disponibilidadeStr, nome_emergencia, telefone_emergencia, assinou, assinou, id);
        } else {
            db.prepare(`
                INSERT INTO voluntarios (nome, cpf, telefone, email, area_atuacao, disponibilidade, nome_emergencia, telefone_emergencia, termo_assinado, data_assinatura_termo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
            `).run(nome, cpf, telefone, email, area_atuacao, disponibilidadeStr, nome_emergencia, telefone_emergencia, assinou, assinou);
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
    const id = request.params.id;
    let vol = {};
    let isNovo = true;

    if (id !== 'novo') {
        vol = db.prepare('SELECT * FROM voluntarios WHERE id = ?').get(id);
        isNovo = false;
        if (!vol) return reply.send('');
    }

    const disp = vol.disponibilidade || '';
    const isChecked = (valor) => disp.includes(valor) ? 'checked' : '';
    const termoOk = vol.termo_assinado === 1 ? 'checked' : '';

    const html = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] relative" onclick="event.stopPropagation()">
                
                <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <i class="ph ph-user-${isNovo ? 'plus' : 'gear'} text-indigo-600"></i>
                        ${isNovo ? 'Novo Voluntário' : 'Editar Voluntário'}
                    </h2>
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="text-slate-400 hover:text-rose-500 transition-colors">
                        <i class="ph ph-x text-xl font-bold"></i>
                    </button>
                </div>
                
                <form hx-post="/voluntarios/salvar" 
                      hx-swap="none" 
                      hx-on::after-request="if(event.detail.successful) document.getElementById('modal-container').innerHTML = ''" 
                      class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    
                    ${!isNovo ? `<input type="hidden" name="id" value="${vol.id}">` : ''}

                    <div>
                        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Dados Pessoais</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-600 mb-1.5">Nome Completo *</label>
                                <input type="text" name="nome" value="${vol.nome || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium" required>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 mb-1.5">CPF *</label>
                                <input type="text" name="cpf" value="${vol.cpf || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium" required>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 mb-1.5">Telefone / WhatsApp</label>
                                <input type="text" name="telefone" value="${vol.telefone || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 mb-1.5">E-mail</label>
                                <input type="email" name="email" value="${vol.email || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Atuação</h3>
                        <div class="mb-4">
                            <label class="block text-xs font-bold text-slate-600 mb-1.5">Área Principal</label>
                            <select name="area_atuacao" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium">
                                <option value="Cozinha" ${vol.area_atuacao === 'Cozinha' ? 'selected' : ''}>Cozinha / Refeitório</option>
                                <option value="Triagem" ${vol.area_atuacao === 'Triagem' ? 'selected' : ''}>Triagem de Doações</option>
                                <option value="Administrativo" ${vol.area_atuacao === 'Administrativo' ? 'selected' : ''}>Administrativo / Portaria</option>
                                <option value="Manutenção" ${vol.area_atuacao === 'Manutenção' ? 'selected' : ''}>Manutenção / Limpeza</option>
                                <option value="Profissional" ${vol.area_atuacao === 'Profissional' ? 'selected' : ''}>Profissional (Saúde/Jurídico)</option>
                            </select>
                        </div>
                        
                        <label class="block text-xs font-bold text-slate-600 mb-2">Disponibilidade</label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" name="disponibilidade" value="Seg(M)" class="w-4 h-4 text-indigo-600 rounded" ${isChecked('Seg(M)')}> Seg (M)</label>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" name="disponibilidade" value="Seg(T)" class="w-4 h-4 text-indigo-600 rounded" ${isChecked('Seg(T)')}> Seg (T)</label>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" name="disponibilidade" value="Ter(M)" class="w-4 h-4 text-indigo-600 rounded" ${isChecked('Ter(M)')}> Ter (M)</label>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" name="disponibilidade" value="Ter(T)" class="w-4 h-4 text-indigo-600 rounded" ${isChecked('Ter(T)')}> Ter (T)</label>
                            </div>
                    </div>

                    <div>
                        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Contrato e Adesão</h3>
                        <div class="flex items-start gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <input type="checkbox" name="termo_assinado" id="checkTermo" value="1" class="w-5 h-5 mt-0.5 text-indigo-600 rounded cursor-pointer border-indigo-300 focus:ring-indigo-500" ${termoOk}>
                            <div class="flex-1">
                                <label for="checkTermo" class="text-sm font-bold text-indigo-900 cursor-pointer block mb-1">
                                    Declaro que li e concordo com os termos.
                                </label>
                                <button type="button" onclick="document.getElementById('camada-contrato').classList.remove('hidden')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1">
                                    <i class="ph ph-file-text"></i> Ler Termo de Trabalho Voluntário
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2 shrink-0">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors shadow-md">Salvar</button>
                    </div>
                </form>

                <div id="camada-contrato" class="hidden absolute inset-0 bg-white z-20 flex flex-col rounded-2xl">
                    <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0 rounded-t-2xl">
                        <div>
                            <h2 class="text-xl font-black text-slate-800">Termo de Adesão ao Trabalho Voluntário</h2>
                            <p class="text-sm font-medium text-slate-500 mt-1">Lei Nº 9.608, de 18 de Fevereiro de 1998.</p>
                        </div>
                        <button type="button" onclick="document.getElementById('camada-contrato').classList.add('hidden')" class="text-slate-400 hover:text-rose-500 transition-colors">
                            <i class="ph ph-x text-xl font-bold"></i>
                        </button>
                    </div>
                    
                    <div class="p-8 overflow-y-auto flex-1 text-sm text-slate-600 leading-relaxed text-justify bg-white">
                        <p class="mb-4">Pelo presente instrumento, o(a) voluntário(a) firma o presente TERMO DE ADESÃO com esta Instituição.</p>
                        <p class="mb-4">1. O(A) VOLUNTÁRIO(A) prestará serviços de forma espontânea, sem recebimento de qualquer remuneração, salário ou benefício financeiro.</p>
                        <p class="mb-4">2. O serviço voluntário não gera vínculo empregatício, nem obrigação de natureza trabalhista, previdenciária ou afim, conforme estabelece a Lei nº 9.608/1998.</p>
                        <p class="mb-4">3. O(A) VOLUNTÁRIO(A) compromete-se a respeitar as normas internas da Instituição, mantendo sigilo sobre informações sensíveis dos acolhidos e zelando pelo patrimônio do local.</p>
                    </div>

                    <div class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0 rounded-b-2xl">
                        <button type="button" onclick="document.getElementById('camada-contrato').classList.add('hidden'); document.getElementById('checkTermo').checked = true;" class="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2">
                            <i class="ph ph-check-circle text-xl"></i> Li e Aceito o Termo
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;
    return reply.type('text/html').send(html);
};

exports.modalTermo = (request, reply) => {
    const id = request.params.id;
    const vol = db.prepare('SELECT nome, cpf FROM voluntarios WHERE id = ?').get(id);
    
    if (!vol) return reply.send('');

    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const html = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col" onclick="event.stopPropagation()">
                
                <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 class="text-xl font-black text-slate-800">Termo de Adesão ao Trabalho Voluntário</h2>
                        <p class="text-sm font-medium text-slate-500 mt-1">Lei Nº 9.608, de 18 de Fevereiro de 1998.</p>
                    </div>
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="text-slate-400 hover:text-rose-500 transition-colors">
                        <i class="ph ph-x text-xl font-bold"></i>
                    </button>
                </div>
                
                <div class="p-8 overflow-y-auto max-h-[60vh] text-sm text-slate-600 leading-relaxed text-justify bg-white">
                    <p class="mb-4">
                        Pelo presente instrumento, <strong>${vol.nome}</strong>, inscrito(a) no CPF sob o nº <strong>${vol.cpf}</strong>, doravante denominado(a) VOLUNTÁRIO(A), firma o presente TERMO DE ADESÃO com esta Instituição.
                    </p>
                    <p class="mb-4">
                        1. O(A) VOLUNTÁRIO(A) prestará serviços de forma espontânea, sem recebimento de qualquer remuneração, salário ou benefício financeiro.
                    </p>
                    <p class="mb-4">
                        2. O serviço voluntário não gera vínculo empregatício, nem obrigação de natureza trabalhista, previdenciária ou afim, conforme estabelece a Lei nº 9.608/1998.
                    </p>
                    <p class="mb-4">
                        3. O(A) VOLUNTÁRIO(A) compromete-se a respeitar as normas internas da Instituição, mantendo sigilo sobre informações sensíveis dos acolhidos e zelando pelo patrimônio do local.
                    </p>
                    <p class="mt-8 text-center font-bold text-slate-800">
                        Li e concordo com os termos acima.<br>
                        Assinado digitalmente em: ${dataAtual}
                    </p>
                </div>

                <div class="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                        Recusar / Fechar
                    </button>
                    <button hx-post="/voluntarios/assinar-termo/${id}" 
                            hx-swap="none" 
                            hx-on::after-request="if(event.detail.successful) document.getElementById('modal-container').innerHTML = ''"
                            class="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center gap-2">
                        <i class="ph ph-signature text-xl"></i> Aceitar e Assinar Termo
                    </button>
                </div>

            </div>
        </div>
    `;
    return reply.type('text/html').send(html);
};