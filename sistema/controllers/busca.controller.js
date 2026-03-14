const db = require('../db'); // Conectando ao seu banco real

// Função utilitária mantida
const gerarOptions = (opcoes, selecionado) => {
    return opcoes.map(op => `<option value="${op}" ${selecionado === op ? 'selected' : ''}>${op}</option>`).join('');
};

exports.buscarBeneficiario = async (request, reply) => {
    const termoBusca = request.body.termo_busca ? request.body.termo_busca.trim() : '';

    if (!termoBusca) {
        return reply.type('text/html').send(`
            <div class="bg-slate-200/50 rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center text-slate-500">
                <i class="ph ph-address-book text-6xl mb-3 text-slate-400"></i>
                <h3 class="text-lg font-bold text-slate-700">Pronto para buscar</h3>
                <p class="text-sm max-w-sm mt-1">Digite os dados na barra acima para encontrar o cadastro.</p>
            </div>
        `);
    }

    // BUSCA REAL NO SQLITE (Case-insensitive por padrão no LIKE)
    const buscaQuery = `%${termoBusca}%`;
    const stmt = db.prepare(`
        SELECT * FROM beneficiarios 
        WHERE nome LIKE ? OR apelido LIKE ? OR documento LIKE ?
        ORDER BY nome ASC
    `);
    const resultados = stmt.all(buscaQuery, buscaQuery, buscaQuery);

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
                    <img src="${pessoa.foto || 'https://ui-avatars.com/api/?name=Sem+Foto&background=cbd5e1&color=fff&size=200'}" alt="Foto" class="w-full h-full object-cover">
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
};

exports.abrirModalBeneficiario = async (request, reply) => {
    const id = parseInt(request.params.id);
    
    // BUSCA REAL DO BENEFICIÁRIO ESPECÍFICO
    const pessoa = db.prepare('SELECT * FROM beneficiarios WHERE id = ?').get(id);

    if (!pessoa) {
        return reply.status(404).send('<p class="text-rose-500">Beneficiário não encontrado.</p>');
    }

    const dataFormatada = pessoa.primeiro_dia ? pessoa.primeiro_dia.split('-').reverse().join('/') : '-';
    // No BD, autorizacao_imagem é Integer (1 ou 0)
    const tagImagem = pessoa.autorizacao_imagem === 1 
        ? '<span class="text-emerald-300 flex items-center gap-1"><i class="ph ph-check-circle"></i> Autoriza Uso de Imagem</span>' 
        : '<span class="text-rose-300 flex items-center gap-1"><i class="ph ph-x-circle"></i> Não Autoriza Imagem</span>';

    // O restante do seu HTML exato (encurtado aqui por questões de espaço, mas é o MESMO do seu)
    // NOTA: Colei a sua variável modalHtml idêntica logo abaixo:
    const modalHtml = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-8 transition-opacity" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[95vh]">
                
                <button onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 right-4 w-10 h-10 bg-black/10 hover:bg-rose-500 hover:text-white text-white rounded-full flex items-center justify-center transition-colors z-10">
                    <i class="ph ph-x text-xl font-bold"></i>
                </button>

                <div class="bg-indigo-700 p-8 text-white flex flex-col md:flex-row gap-6 items-center md:items-start shrink-0">
                    <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-300 shadow-lg shrink-0 bg-white">
                        <img src="${pessoa.foto || 'https://ui-avatars.com/api/?name=Sem+Foto&background=cbd5e1&color=fff&size=200'}" alt="Foto" class="w-full h-full object-cover">
                    </div>
                    <div class="text-center md:text-left flex-1 mt-2">
                        <span class="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">${pessoa.status || 'Acolhido'}</span>
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
                            <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><i class="ph ph-users-three text-indigo-500 text-lg"></i> Vínculos e Origem</h3>
                            <div class="grid grid-cols-2 gap-y-4 gap-x-2">
                                <div><p class="text-[10px] font-bold text-slate-400 uppercase">Naturalidade</p><p class="text-sm font-semibold text-slate-700">${pessoa.naturalidade || '-'}</p></div>
                                <div><p class="text-[10px] font-bold text-slate-400 uppercase">Escolaridade</p><p class="text-sm font-semibold text-slate-700">${pessoa.escolaridade || '-'}</p></div>
                                <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Nome da Mãe</p><p class="text-sm font-semibold text-slate-700">${pessoa.mae || '-'}</p></div>
                                <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Nome do Pai</p><p class="text-sm font-semibold text-slate-700">${pessoa.pai || '-'}</p></div>
                                <div><p class="text-[10px] font-bold text-slate-400 uppercase">Esposa</p><p class="text-sm font-semibold text-slate-700">${pessoa.esposa || '-'}</p></div>
                                <div><p class="text-[10px] font-bold text-slate-400 uppercase">Irmãos</p><p class="text-sm font-semibold text-slate-700">${pessoa.irmaos || '-'}</p></div>
                                <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Filhos</p><p class="text-sm font-semibold text-slate-700">${pessoa.filhos || '-'}</p></div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-6">
                            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><i class="ph ph-address-book text-indigo-500 text-lg"></i> Contato e Profissional</h3>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Documento</p><p class="text-sm font-semibold text-slate-700">${pessoa.documento || '-'}</p></div>
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Telefone</p><p class="text-sm font-semibold text-slate-700">${pessoa.telefone || '-'}</p></div>
                                    <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Endereço</p><p class="text-sm font-semibold text-slate-700">${pessoa.endereco || '-'}</p></div>
                                    <div class="col-span-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Aptidões</p><p class="text-sm font-semibold text-slate-700">${pessoa.aptidoes || '-'}</p></div>
                                </div>
                            </div>

                            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><i class="ph ph-heartbeat text-rose-500 text-lg"></i> Saúde e Vestuário</h3>
                                <div class="flex gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100 justify-between text-center">
                                    <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Camisa</p><p class="text-base font-black text-indigo-600">${pessoa.tamanho_camisa || '-'}</p></div>
                                    <div class="w-px bg-slate-200"></div>
                                    <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Calça</p><p class="text-base font-black text-indigo-600">${pessoa.tamanho_calca || '-'}</p></div>
                                    <div class="w-px bg-slate-200"></div>
                                    <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Calçado</p><p class="text-base font-black text-indigo-600">${pessoa.tamanho_calcado || '-'}</p></div>
                                    <div class="w-px bg-slate-200"></div>
                                    <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Sangue</p><p class="text-base font-black text-rose-500">${pessoa.tipo_sanguineo || '-'}</p></div>
                                </div>
                                <div class="grid grid-cols-1 gap-3">
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Condições de Saúde</p><p class="text-sm font-semibold text-slate-700">${pessoa.saude || 'Nenhuma informada'}</p></div>
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Alergias</p><p class="text-sm font-semibold text-rose-600">${pessoa.alergias || 'Nenhuma informada'}</p></div>
                                    <div><p class="text-[10px] font-bold text-slate-400 uppercase">Vícios</p><p class="text-sm font-semibold text-amber-600">${pessoa.vicios || 'Nenhum informado'}</p></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h3 class="text-xs font-black text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-2"><i class="ph ph-warning-circle text-amber-600"></i> Observações</h3>
                        <p class="text-amber-900 text-sm font-medium">${pessoa.observacoes || 'Sem observações cadastradas.'}</p>
                    </div>
                </div>
                
                <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <button hx-get="/editar/${pessoa.id}" hx-target="#modal-container" class="px-5 py-2.5 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors text-sm flex items-center gap-2">
                        <i class="ph ph-pencil-simple text-lg"></i> Editar Cadastro
                    </button>
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-md">
                        Fechar Ficha
                    </button>
                </div>
            </div>
        </div>
    `;

    return reply.type('text/html').send(modalHtml);
};

exports.carregarFormularioEdicao = async (request, reply) => {
    const id = parseInt(request.params.id);
    
    // BUSCA REAL PARA EDIÇÃO
    const pessoa = db.prepare('SELECT * FROM beneficiarios WHERE id = ?').get(id);

    if (!pessoa) return reply.status(404).send('<p class="text-rose-500">Beneficiário não encontrado.</p>');

    const escolaridades = ["", "Analfabeto", "Sabe ler/escrever", "Ensino Fundamental Incompleto", "Ensino Fundamental Completo", "Ensino Médio Incompleto", "Ensino Médio Completo", "Ensino Superior Incompleto", "Ensino Superior Completo"];
    const camisas = ["", "PP", "P", "M", "G", "GG", "XG"];
    const calcas = ["", "36", "38", "40", "42", "44", "46", "48", "50", "52+"];
    const calcados = ["", "37/38", "39/40", "41/42", "43/44", "45+"];
    const sangues = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    
    // Adicionei isso se você for usar a coluna "status" no futuro, senão ele ignora.
    const statusOpts = ["Acolhido", "Em Transição", "Desligado"];

    // O INÍCIO DO SEU FORMULÁRIO EXATO
    let formHtml = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-8">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[95vh]">
                <div class="bg-slate-100 p-5 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h2 class="text-xl font-black text-slate-800 flex items-center gap-2">
                            <i class="ph ph-pencil-simple text-indigo-600"></i> Editando Cadastro Completo
                        </h2>
                        <p class="text-sm font-medium text-slate-500 mt-1">Atualizando dados de ${pessoa.nome}</p>
                    </div>
                    <button hx-get="/beneficiario/${pessoa.id}" hx-target="#modal-container" class="w-10 h-10 bg-white hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-sm transition-colors">
                        <i class="ph ph-arrow-u-up-left text-xl font-bold"></i>
                    </button>
                </div>

                <form hx-post="/atualizar/${pessoa.id}" hx-target="#modal-container" class="p-6 overflow-y-auto flex flex-col gap-6 bg-slate-50/50">
    `;

    // COLANDO OS SEUS INPUTS (simplifiquei aqui visualmente pro chat, mas mantenha os SEUS inputs HTML exatos aqui dentro)
    // O IMPORTANTE É COMO FECHA LÁ EMBAIXO:
    
    // (Cole todos os seus <div class="grid grid-cols..."> aqui)
    
    // AQUI ESTÁ O FINAL CORRIGIDO E FECHADO QUE TINHA CORTADO NA SUA MENSAGEM:
    formHtml += `
                    <div class="flex flex-col gap-4 mt-2 border-t border-slate-200 pt-4">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Observações da Gestão</label>
                            <textarea name="observacoes" rows="2" class="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none">${pessoa.observacoes || ''}</textarea>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer w-fit">
                            <input type="checkbox" name="autorizacao_imagem" value="1" class="w-5 h-5 text-indigo-600 rounded" ${pessoa.autorizacao_imagem === 1 ? 'checked' : ''}>
                            <span class="text-sm font-bold text-slate-700">Autoriza o uso de imagem</span>
                        </label>
                    </div>

                    <div class="border-t border-slate-200 pt-5 flex justify-end gap-3 mt-2">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-3 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2">
                            <i class="ph ph-floppy-disk text-lg"></i> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    return reply.type('text/html').send(formHtml);
};

exports.atualizarBeneficiario = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const dados = request.body;
        
        // Atualiza no banco
        const stmt = db.prepare(`
            UPDATE beneficiarios SET 
                nome = ?, apelido = ?, primeiro_dia = ?, documento = ?, naturalidade = ?, 
                escolaridade = ?, mae = ?, pai = ?, irmaos = ?, esposa = ?, filhos = ?, 
                tamanho_camisa = ?, tamanho_calca = ?, tamanho_calcado = ?, tipo_sanguineo = ?, 
                saude = ?, alergias = ?, vicios = ?, telefone = ?, endereco = ?, aptidoes = ?, 
                autorizacao_imagem = ?
            WHERE id = ?
        `);

        stmt.run(
            dados.nome, dados.apelido, dados.primeiro_dia, dados.documento, dados.naturalidade,
            dados.escolaridade, dados.mae, dados.pai, dados.irmaos, dados.esposa, dados.filhos,
            dados.tamanho_camisa, dados.tamanho_calca, dados.tamanho_calcado, dados.tipo_sanguineo,
            dados.saude, dados.alergias, dados.vicios, dados.telefone, dados.endereco, dados.aptidoes,
            dados.autorizacao_imagem ? 1 : 0, 
            id
        );

        // Depois de salvar, redireciona o modal de volta para a ficha do acolhido!
        // Como o HTMX chamou isso, se a gente retornar o "abrirModalBeneficiario", 
        // a tela atualiza sozinha sem piscar!
        return exports.abrirModalBeneficiario(request, reply);

    } catch (error) {
        console.error("Erro ao atualizar:", error);
        return reply.status(500).send('<div class="p-4 bg-rose-500 text-white">Erro ao atualizar dados.</div>');
    }
};