const db = require('../db');

exports.buscarBeneficiario = async (request, reply) => {
    try {
        const termoBusca = request.body.termo_busca ? request.body.termo_busca.toLowerCase().trim() : '';

        if (!termoBusca) {
            return reply.type('text/html').send(`
                <div class="bg-slate-200/50 rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center text-slate-500">
                    <i class="ph ph-address-book text-6xl mb-3 text-slate-400"></i>
                    <h3 class="text-lg font-bold text-slate-700">Pronto para buscar</h3>
                    <p class="text-sm max-w-sm mt-1">Digite os dados na barra acima para encontrar o cadastro.</p>
                </div>
            `);
        }

        const stmt = db.prepare(`
            SELECT * FROM beneficiarios 
            WHERE LOWER(nome) LIKE ? 
               OR LOWER(apelido) LIKE ? 
               OR documento LIKE ?
            ORDER BY nome ASC
        `);

        const resultados = stmt.all(`%${termoBusca}%`, `%${termoBusca}%`, `%${termoBusca}%`);

        if (resultados.length === 0) {
            return reply.type('text/html').send(`
                <div class="bg-rose-50 rounded-2xl border border-rose-200 p-8 flex flex-col items-center justify-center text-center text-rose-600">
                    <i class="ph ph-warning-circle text-5xl mb-3"></i>
                    <h3 class="text-lg font-bold">Nenhum acolhido encontrado</h3>
                </div>
            `);
        }

        let htmlResultados = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
        
        resultados.forEach(pessoa => {
            const dataFormatada = pessoa.primeiro_dia ? pessoa.primeiro_dia.split('-').reverse().join('/') : '-';

            htmlResultados += `
                <div hx-get="/beneficiario/${pessoa.id}" 
                     hx-target="#modal-container"
                     class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
                    
                    <div class="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 group-hover:border-indigo-400 transition-colors">
                        <img src="${pessoa.foto}" alt="Foto" class="w-full h-full object-cover">
                    </div>
                    
                    <div class="flex flex-col justify-center flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <h4 class="text-lg font-black text-slate-900 truncate">${pessoa.nome}</h4>
                            <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">${pessoa.status || 'Acolhido'}</span>
                        </div>
                        <p class="text-sm font-semibold text-slate-500 mb-2 truncate">Vulgo: <span class="text-slate-700">${pessoa.apelido || '-'}</span></p>
                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                            <span class="flex items-center gap-1.5"><i class="ph ph-identification-card text-indigo-500 text-sm"></i> ${pessoa.documento || '-'}</span>
                            <span class="flex items-center gap-1.5"><i class="ph ph-calendar text-indigo-500 text-sm"></i> Entrada: ${dataFormatada}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        htmlResultados += '</div>';
        return reply.type('text/html').send(htmlResultados);
    } catch (error) {
        console.error('Erro na busca:', error);
        return reply.status(500).send('<div class="p-4 bg-rose-100 text-rose-600 rounded-xl">Erro na busca.</div>');
    }
};

exports.abrirModalBeneficiario = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const stmt = db.prepare('SELECT * FROM beneficiarios WHERE id = ?');
        const pessoa = stmt.get(id);

        if (!pessoa) {
            return reply.status(404).send('<p class="text-rose-500">Beneficiário não encontrado.</p>');
        }

        // --- BUSCA DO DIÁRIO DE BORDO ---
        const stmtDiario = db.prepare('SELECT * FROM diario_bordo WHERE beneficiario_id = ? ORDER BY id DESC');
        const notas = stmtDiario.all(id);
        
        let htmlDiario = '';
        if (notas.length === 0) {
            htmlDiario = '<p class="text-sm text-slate-400 italic" id="mensagem-vazia">Nenhuma anotação registrada ainda.</p>';
        } else {
            notas.forEach(nota => {
                const dataNota = new Date(nota.data_registro).toLocaleString('pt-BR');
                htmlDiario += `
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3">
                        <p class="text-[10px] font-bold text-indigo-500 uppercase mb-2">
                            <i class="ph ph-calendar-blank"></i> ${dataNota}
                        </p>
                        <p class="text-sm font-medium text-slate-700">${nota.anotacao}</p>
                    </div>
                `;
            });
        }
        // --------------------------------

        const dataFormatada = pessoa.primeiro_dia ? pessoa.primeiro_dia.split('-').reverse().join('/') : '-';
        const tagImagem = pessoa.autorizacao_imagem === 1 
            ? '<span class="text-emerald-300 flex items-center gap-1"><i class="ph ph-check-circle"></i> Autoriza Uso de Imagem</span>' 
            : '<span class="text-rose-300 flex items-center gap-1"><i class="ph ph-x-circle"></i> Não Autoriza Imagem</span>';

        const modalHtml = `
            <div id="modal-backdrop" 
                 class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-8 transition-opacity"
                 onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                
                <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[95vh]">
                    
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                            class="absolute top-4 right-4 w-10 h-10 bg-black/10 hover:bg-rose-500 hover:text-white text-white rounded-full flex items-center justify-center transition-colors z-10">
                        <i class="ph ph-x text-xl font-bold"></i>
                    </button>

                    <div class="bg-indigo-700 p-8 text-white flex flex-col md:flex-row gap-6 items-center md:items-start shrink-0">
                        <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-300 shadow-lg shrink-0 bg-white">
                            <img src="${pessoa.foto}" alt="Foto" class="w-full h-full object-cover">
                        </div>
                        <div class="text-center md:text-left flex-1 mt-2">
                            <span class="bg-indigo-600 text-indigo-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">${pessoa.status || 'Acolhido'}</span>
                            <h2 class="text-3xl font-black leading-tight">${pessoa.nome}</h2>
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                                <p class="text-indigo-200 font-medium text-lg">Vulgo: "${pessoa.apelido || '-'}"</p>
                                <div class="text-xs font-bold uppercase tracking-wider bg-indigo-800/50 px-3 py-1.5 rounded-lg border border-indigo-600/50">
                                    ${tagImagem}
                                </div>
                            </div>
                        </div>
                        <div class="text-center md:text-right shrink-0 mt-2 md:mt-0">
                            <p class="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">1º Dia no Projeto</p>
                            <p class="text-2xl font-black flex items-center justify-center md:justify-end gap-2"><i class="ph ph-calendar-plus text-indigo-400"></i> ${dataFormatada}</p>
                        </div>
                    </div>

                    <div class="p-6 overflow-y-auto flex flex-col gap-6">
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <i class="ph ph-users-three text-indigo-500 text-lg"></i> Vínculos e Origem
                                </h3>
                                <div class="grid grid-cols-2 gap-y-4 gap-x-2">
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Naturalidade</p><p class="text-sm font-semibold text-slate-700">${pessoa.naturalidade || '-'}</p></div>
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Escolaridade</p><p class="text-sm font-semibold text-slate-700">${pessoa.escolaridade || '-'}</p></div>
                                    <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Nome da Mãe</p><p class="text-sm font-semibold text-slate-700">${pessoa.mae || '-'}</p></div>
                                    <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Nome do Pai</p><p class="text-sm font-semibold text-slate-700">${pessoa.pai || '-'}</p></div>
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Esposa/Companheira</p><p class="text-sm font-semibold text-slate-700">${pessoa.esposa || '-'}</p></div>
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Irmãos</p><p class="text-sm font-semibold text-slate-700">${pessoa.irmaos || '-'}</p></div>
                                    <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Filhos</p><p class="text-sm font-semibold text-slate-700">${pessoa.filhos || '-'}</p></div>
                                </div>
                            </div>

                            <div class="flex flex-col gap-6">
                                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <i class="ph ph-address-book text-indigo-500 text-lg"></i> Contato e Profissional
                                    </h3>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div><p class="text-[10px] font-bold text-slate-400 uppercase">Documento</p><p class="text-sm font-semibold text-slate-700">${pessoa.documento || '-'}</p></div>
                                        <div><p class="text-[10px] font-bold text-slate-400 uppercase">Telefone</p><p class="text-sm font-semibold text-slate-700">${pessoa.telefone || '-'}</p></div>
                                        <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Endereço</p><p class="text-sm font-semibold text-slate-700">${pessoa.endereco || '-'}</p></div>
                                        <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Aptidões Profissionais</p><p class="text-sm font-semibold text-slate-700">${pessoa.aptidoes || '-'}</p></div>
                                    </div>
                                </div>

                                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <i class="ph ph-heartbeat text-rose-500 text-lg"></i> Saúde e Vestuário
                                    </h3>
                                    
                                    <div class="flex gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100 justify-between text-center">
                                        <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Camisa</p><p class="text-base font-black text-indigo-600">${pessoa.tamanho_camisa || '-'}</p></div>
                                        <div class="w-px bg-slate-200"></div>
                                        <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Calça</p><p class="text-base font-black text-indigo-600">${pessoa.tamanho_calca || '-'}</p></div>
                                        <div class="w-px bg-slate-200"></div>
                                        <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Calçado</p><p class="text-base font-black text-indigo-600">${pessoa.tamanho_calcado || '-'}</p></div>
                                        <div class="w-px bg-slate-200"></div>
                                        <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Sangue</p><p class="text-base font-black text-rose-600">${pessoa.tipo_sanguineo || '-'}</p></div>
                                    </div>

                                    <div class="grid grid-cols-1 gap-3">
                                        <div><p class="text-[10px] font-bold text-slate-400 uppercase">Condições de Saúde</p><p class="text-sm font-semibold text-slate-700">${pessoa.saude || 'Nenhuma informada'}</p></div>
                                        <div><p class="text-[10px] font-bold text-slate-400 uppercase">Alergias</p><p class="text-sm font-semibold text-rose-600">${pessoa.alergias || 'Nenhuma informada'}</p></div>
                                        <div><p class="text-[10px] font-bold text-slate-400 uppercase">Vícios / Dependência</p><p class="text-sm font-semibold text-amber-600">${pessoa.vicios || 'Nenhum informado'}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <h3 class="text-xs font-black text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <i class="ph ph-warning-circle text-amber-600"></i> Observações da Gestão
                            </h3>
                            <p class="text-amber-900 text-sm font-medium">${pessoa.observacoes || 'Sem observações cadastradas.'}</p>
                        </div>
                        
                        <div class="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mt-2">
                            <h3 class="text-sm font-black text-indigo-800 uppercase tracking-wider mb-4 border-b border-indigo-200 pb-2 flex items-center gap-2">
                                <i class="ph ph-notebook text-indigo-600 text-lg"></i> Diário de Bordo (Timeline)
                            </h3>
                            
                            <form hx-post="/diario/${pessoa.id}" 
                                  hx-target="#lista-diario" 
                                  hx-swap="afterbegin"
                                  hx-on::after-request="this.reset(); document.getElementById('mensagem-vazia')?.remove();"
                                  class="mb-6 flex gap-2">
                                <input type="text" name="anotacao" placeholder="Adicionar nova anotação..." class="flex-1 rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none shadow-sm" required>
                                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 shrink-0">
                                    <i class="ph ph-plus-circle text-lg"></i> Salvar
                                </button>
                            </form>

                            <div id="lista-diario" class="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                ${htmlDiario}
                            </div>
                        </div>

                    </div>
                    
                    <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                        <button hx-get="/editar/${pessoa.id}" 
                                hx-target="#modal-container"
                                class="px-4 py-2.5 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors text-sm flex items-center gap-2">
                            <i class="ph ph-pencil-simple text-lg"></i> Editar Cadastro Completo
                        </button>
                        <button onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-md">
                            Fechar Ficha
                        </button>
                    </div>

                </div>
            </div>
        `;

        return reply.type('text/html').send(modalHtml);
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        return reply.status(500).send('<div class="p-4 bg-rose-100 text-rose-600 rounded-xl">Erro ao carregar ficha.</div>');
    }
};

const gerarOptions = (opcoes, selecionado) => {
    return opcoes.map(op => `<option value="${op}" ${selecionado === op ? 'selected' : ''}>${op}</option>`).join('');
};

exports.carregarFormularioEdicao = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const stmt = db.prepare('SELECT * FROM beneficiarios WHERE id = ?');
        const pessoa = stmt.get(id);

        if (!pessoa) return reply.status(404).send('<p class="text-rose-500">Beneficiário não encontrado.</p>');

        const escolaridades = ["", "Analfabeto", "Sabe ler/escrever", "Ensino Fundamental Incompleto", "Ensino Fundamental Completo", "Ensino Médio Incompleto", "Ensino Médio Completo", "Ensino Superior Incompleto", "Ensino Superior Completo"];
        const camisas = ["", "PP", "P", "M", "G", "GG", "XG"];
        const calcas = ["", "36", "38", "40", "42", "44", "46", "48", "50", "52+"];
        const calcados = ["", "37/38", "39/40", "41/42", "43/44", "45+"];
        const sangues = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        const statusOpts = ["Acolhido", "Em Transição", "Desligado"];

        const formHtml = `
            <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-8">
                <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[95vh]">
                    
                    <div class="bg-white p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                <i class="ph ph-pencil-simple text-2xl"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-black text-slate-800">Editando Cadastro Completo</h2>
                                <p class="text-sm font-medium text-slate-500 mt-0.5">Atualizando dados de <b class="text-indigo-600">${pessoa.nome}</b></p>
                            </div>
                        </div>
                        <button hx-get="/beneficiario/${pessoa.id}" hx-target="#modal-container" class="w-10 h-10 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer">
                            <i class="ph ph-x text-lg font-bold"></i>
                        </button>
                    </div>

                    <form hx-post="/atualizar/${pessoa.id}" hx-target="#modal-container" class="p-6 overflow-y-auto flex flex-col gap-6">
                        
                        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status no Projeto</label>
                                <select name="status" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                    ${gerarOptions(statusOpts, pessoa.status)}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1º Dia no Projeto</label>
                                <input type="date" name="primeiro_dia" value="${pessoa.primeiro_dia || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            <div class="flex flex-col gap-6">
                                
                                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h4 class="font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-1 text-sm flex items-center gap-2">
                                        <i class="ph ph-user text-indigo-500 text-lg"></i> Identificação
                                    </h4>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome de Registro <span class="text-rose-500">*</span></label>
                                        <input type="text" name="nome" value="${pessoa.nome || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apelido / Nome Social</label>
                                        <input type="text" name="apelido" value="${pessoa.apelido || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Documento</label>
                                        <input type="text" name="documento" value="${pessoa.documento || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Naturalidade</label>
                                        <input type="text" name="naturalidade" value="${pessoa.naturalidade || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Escolaridade</label>
                                        <select name="escolaridade" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                            ${gerarOptions(escolaridades, pessoa.escolaridade)}
                                        </select>
                                    </div>
                                </div>

                                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h4 class="font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-1 text-sm flex items-center gap-2">
                                        <i class="ph ph-heartbeat text-rose-500 text-lg"></i> Saúde e Vestuário
                                    </h4>
                                    
                                    <div class="grid grid-cols-4 gap-3">
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1.5">Camisa</label>
                                            <select name="tamanho_camisa" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-center font-bold text-indigo-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">${gerarOptions(camisas, pessoa.tamanho_camisa)}</select>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1.5">Calça</label>
                                            <select name="tamanho_calca" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-center font-bold text-indigo-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">${gerarOptions(calcas, pessoa.tamanho_calca)}</select>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1.5">Calçado</label>
                                            <select name="tamanho_calcado" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-center font-bold text-indigo-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">${gerarOptions(calcados, pessoa.tamanho_calcado)}</select>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1.5">Sangue</label>
                                            <select name="tipo_sanguineo" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-center font-bold text-rose-600 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">${gerarOptions(sangues, pessoa.tipo_sanguineo)}</select>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-2">
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Condições de Saúde</label>
                                        <input type="text" name="saude" value="${pessoa.saude || ''}" placeholder="Ex: Hipertensão, diabetes..." class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alergias</label>
                                        <input type="text" name="alergias" value="${pessoa.alergias || ''}" placeholder="Ex: Penicilina, poeira..." class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vícios / Dependência</label>
                                        <input type="text" name="vicios" value="${pessoa.vicios || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col gap-6">
                                
                                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h4 class="font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-1 text-sm flex items-center gap-2">
                                        <i class="ph ph-users-three text-indigo-500 text-lg"></i> Vínculos e Contato
                                    </h4>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Mãe</label>
                                        <input type="text" name="mae" value="${pessoa.mae || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Pai</label>
                                        <input type="text" name="pai" value="${pessoa.pai || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Esposa</label>
                                            <input type="text" name="esposa" value="${pessoa.esposa || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Irmãos</label>
                                            <input type="text" name="irmaos" value="${pessoa.irmaos || ''}" placeholder="Qtd ou Nomes" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filhos</label>
                                        <input type="text" name="filhos" value="${pessoa.filhos || ''}" placeholder="Quantidade e/ou nomes" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div class="border-t border-slate-100 pt-3 mt-1">
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Telefone / Recado</label>
                                        <input type="text" name="telefone" value="${pessoa.telefone || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Endereço / Referência</label>
                                        <input type="text" name="endereco" value="${pessoa.endereco || ''}" class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Aptidões Profissionais</label>
                                        <input type="text" name="aptidoes" value="${pessoa.aptidoes || ''}" placeholder="Sabe fazer o que? Profissão..." class="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm flex flex-col gap-4">
                            <div>
                                <label class="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <i class="ph ph-warning-circle text-amber-600 text-lg"></i> Observações Sensíveis da Gestão
                                </label>
                                <textarea name="observacoes" rows="2" class="w-full rounded-lg border border-amber-300 bg-white p-3 text-sm text-slate-800 focus:ring-2 focus:ring-amber-400 outline-none transition-all resize-none">${pessoa.observacoes || ''}</textarea>
                            </div>
                            <label class="flex items-center gap-3 cursor-pointer w-fit bg-white p-3 pr-5 rounded-lg border border-amber-200">
                                <input type="checkbox" name="autorizacao_imagem" value="1" class="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" ${pessoa.autorizacao_imagem === 1 ? 'checked' : ''}>
                                <span class="text-sm font-bold text-slate-700">Paciente <span class="text-emerald-600">autoriza</span> o uso de imagem</span>
                            </label>
                        </div>

                        <div class="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-200">
                            <button type="button" hx-get="/beneficiario/${pessoa.id}" hx-target="#modal-container" class="px-6 py-3.5 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition-colors">
                                Cancelar Edição
                            </button>
                            <button type="submit" class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                                <i class="ph ph-floppy-disk text-xl"></i> Salvar Alterações
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        return reply.type('text/html').send(formHtml);
    } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        return reply.status(500).send('<div class="p-4 bg-rose-100 text-rose-600 rounded-xl">Erro ao carregar formulário.</div>');
    }
};


exports.atualizarBeneficiario = async (request, reply) => {   
     try {
        const id = parseInt(request.params.id);
        const dadosAtualizados = request.body || {};
        
        // Garante que o checkbox de imagem seja salvo como 0 se não for marcado
        if (!dadosAtualizados.autorizacao_imagem) {
            dadosAtualizados.autorizacao_imagem = "0";
        }

        // Removi a "foto = ?" daqui para que o update não apague a imagem que já existe
        const stmt = db.prepare(`
            UPDATE beneficiarios SET
                nome = ?, apelido = ?, primeiro_dia = ?, documento = ?, naturalidade = ?,
                escolaridade = ?, mae = ?, pai = ?, irmaos = ?, esposa = ?, filhos = ?,
                tamanho_camisa = ?, tamanho_calca = ?, tamanho_calcado = ?, tipo_sanguineo = ?,
                saude = ?, alergias = ?, vicios = ?, telefone = ?, endereco = ?, aptidoes = ?,
                autorizacao_imagem = ?, status = ?, observacoes = ?
            WHERE id = ?
        `);

        stmt.run(
            dadosAtualizados.nome || '', dadosAtualizados.apelido || '',
            dadosAtualizados.primeiro_dia || '', dadosAtualizados.documento || '', dadosAtualizados.naturalidade || '',
            dadosAtualizados.escolaridade || '', dadosAtualizados.mae || '', dadosAtualizados.pai || '',
            dadosAtualizados.irmaos || '', dadosAtualizados.esposa || '', dadosAtualizados.filhos || '',
            dadosAtualizados.tamanho_camisa || '', dadosAtualizados.tamanho_calca || '', dadosAtualizados.tamanho_calcado || '',
            dadosAtualizados.tipo_sanguineo || '', dadosAtualizados.saude || '', dadosAtualizados.alergias || '',
            dadosAtualizados.vicios || '', dadosAtualizados.telefone || '', dadosAtualizados.endereco || '',
            dadosAtualizados.aptidoes || '', parseInt(dadosAtualizados.autorizacao_imagem), dadosAtualizados.status || '',
            dadosAtualizados.observacoes || '', id
        );

        const sucessoHtml = `
            <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all" onclick="event.stopPropagation()">
                    <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <i class="ph ph-check-circle text-5xl text-emerald-500"></i>
                    </div>
                    <h3 class="text-2xl font-black text-slate-800 mb-2">Atualizado!</h3>
                    <p class="text-slate-500 font-medium mb-8">O cadastro completo de <b>${dadosAtualizados.nome}</b> foi salvo com sucesso.</p>
                    
                    <button hx-get="/beneficiario/${id}" hx-target="#modal-container" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-md cursor-pointer">
                        Ver Ficha Atualizada
                    </button>
                </div>
            </div>
        `;

        return reply.type('text/html').send(sucessoHtml);
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        // Mudamos para status(200) temporariamente no erro para o HTMX injetar o alerta vermelho na tela e não ignorar o problema.
        return reply.status(200).send(`
            <div class="p-6 m-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-4">
                <i class="ph ph-warning-circle text-3xl"></i>
                <div>
                    <h4 class="font-bold">Erro ao salvar as alterações</h4>
                    <p class="text-sm mt-1">${error.message}</p>
                </div>
            </div>
        `);
    }
};

// ==========================================
// FUNÇÃO DO DIÁRIO DE BORDO (TIMELINE)
// ==========================================
exports.adicionarNotaDiario = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const { anotacao } = request.body; 

        if (!anotacao || anotacao.trim() === '') {
            return reply.status(400).send('<p class="text-rose-500 text-sm font-bold">A anotação não pode estar vazia.</p>');
        }

        const stmt = db.prepare('INSERT INTO diario_bordo (beneficiario_id, anotacao) VALUES (?, ?)');
        const result = stmt.run(id, anotacao.trim());

        const novaNota = db.prepare('SELECT * FROM diario_bordo WHERE id = ?').get(result.lastInsertRowid);
        
        const dataFormatada = new Date(novaNota.data_registro).toLocaleString('pt-BR');

        const htmlRetorno = `
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3">
                <p class="text-[10px] font-bold text-indigo-500 uppercase mb-2">
                    <i class="ph ph-calendar-blank"></i> ${dataFormatada}
                </p>
                <p class="text-sm font-medium text-slate-700">${novaNota.anotacao}</p>
            </div>
        `;

        return reply.type('text/html').send(htmlRetorno);

    } catch (error) {
        console.error("Erro ao salvar nota no diário:", error);
        return reply.status(500).send('<p class="text-rose-500 text-sm font-bold">Erro no servidor ao salvar a nota.</p>');
    }
};