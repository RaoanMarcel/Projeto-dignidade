// controllers/busca.controller.js

// Banco de dados mockado atualizado com TODOS os campos do cadastro
const bancoDeDadosMock = [
    {
        id: 1,
        nome: "João Batista da Silva",
        apelido: "Joãozinho",
        primeiro_dia: "2026-02-12",
        documento: "123.456.789-00",
        naturalidade: "São Paulo - SP",
        escolaridade: "Ensino Fundamental Incompleto",
        mae: "Margarida da Silva",
        pai: "José da Silva",
        irmaos: "2",
        esposa: "Não possui",
        filhos: "3 (Ana, Pedro, Lucas)",
        tamanho_camisa: "M",
        tamanho_calca: "40",
        tamanho_calcado: "39/40",
        tipo_sanguineo: "O+",
        saude: "Pressão alta",
        alergias: "Dipirona",
        vicios: "Tabagismo",
        telefone: "(11) 98765-4321",
        endereco: "Rua das Flores, 123 - Centro",
        aptidoes: "Pedreiro, Pintor",
        autorizacao_imagem: "1",
        status: "Acolhido",
        observacoes: "Chegou sem documentos originais, segunda via já solicitada.",
        foto: "https://ui-avatars.com/api/?name=Joao+Batista&background=4f46e5&color=fff&size=200"
    },
    {
        id: 2,
        nome: "Maria Aparecida Souza",
        apelido: "Cida",
        primeiro_dia: "2025-11-05",
        documento: "987.654.321-11",
        naturalidade: "Curitiba - PR",
        escolaridade: "Ensino Médio Completo",
        mae: "Não informado",
        pai: "Não informado",
        irmaos: "Nenhum",
        esposa: "Não possui",
        filhos: "1 (Marcos, maior de idade)",
        tamanho_camisa: "G",
        tamanho_calca: "44",
        tamanho_calcado: "37/38",
        tipo_sanguineo: "A+",
        saude: "Diabetes",
        alergias: "Nenhuma conhecida",
        vicios: "Nenhum",
        telefone: "(11) 91234-5678",
        endereco: "Sem endereço fixo atual",
        aptidoes: "Cozinheira, Costureira",
        autorizacao_imagem: "0",
        status: "Em Transição",
        observacoes: "Conseguiu um emprego de meio período na padaria do bairro.",
        foto: "https://ui-avatars.com/api/?name=Maria+Aparecida&background=059669&color=fff&size=200"
    }
];

exports.buscarBeneficiario = async (request, reply) => {
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

    const resultados = bancoDeDadosMock.filter(pessoa => 
        pessoa.nome.toLowerCase().includes(termoBusca) ||
        (pessoa.apelido && pessoa.apelido.toLowerCase().includes(termoBusca)) ||
        (pessoa.documento && pessoa.documento.includes(termoBusca))
    );

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
        // Formata a data para exibir no card
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
};

exports.abrirModalBeneficiario = async (request, reply) => {
    const id = parseInt(request.params.id);
    const pessoa = bancoDeDadosMock.find(p => p.id === id);

    if (!pessoa) {
        return reply.status(404).send('<p class="text-rose-500">Beneficiário não encontrado.</p>');
    }

    const dataFormatada = pessoa.primeiro_dia ? pessoa.primeiro_dia.split('-').reverse().join('/') : '-';
    const tagImagem = pessoa.autorizacao_imagem === "1" 
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
                                    <div class="flex-1"><p class="text-[10px] font-bold text-slate-400 uppercase">Sangue</p><p class="text-base font-black text-rose-500">${pessoa.tipo_sanguineo || '-'}</p></div>
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
                        <h3 class="text-xs font-black text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <i class="ph ph-warning-circle text-amber-600"></i> Observações da Gestão
                        </h3>
                        <p class="text-amber-900 text-sm font-medium">${pessoa.observacoes || 'Sem observações cadastradas.'}</p>
                    </div>

                </div>
                
                <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <button hx-get="/editar/${pessoa.id}" 
                            hx-target="#modal-container"
                            class="px-5 py-2.5 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors text-sm flex items-center gap-2">
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
};

// Função para gerar options de selects dinamicamente e manter o código mais limpo
const gerarOptions = (opcoes, selecionado) => {
    return opcoes.map(op => `<option value="${op}" ${selecionado === op ? 'selected' : ''}>${op}</option>`).join('');
};

exports.carregarFormularioEdicao = async (request, reply) => {
    const id = parseInt(request.params.id);
    const pessoa = bancoDeDadosMock.find(p => p.id === id);

    if (!pessoa) return reply.status(404).send('<p class="text-rose-500">Beneficiário não encontrado.</p>');

    const escolaridades = ["", "Analfabeto", "Sabe ler/escrever", "Ensino Fundamental Incompleto", "Ensino Fundamental Completo", "Ensino Médio Incompleto", "Ensino Médio Completo", "Ensino Superior Incompleto", "Ensino Superior Completo"];
    const camisas = ["", "PP", "P", "M", "G", "GG", "XG"];
    const calcas = ["", "36", "38", "40", "42", "44", "46", "48", "50", "52+"];
    const calcados = ["", "37/38", "39/40", "41/42", "43/44", "45+"];
    const sangues = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const statusOpts = ["Acolhido", "Em Transição", "Desligado"];

    const formHtml = `
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
                    
                    <div class="flex gap-4 mb-2">
                        <div class="flex-1">
                            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Status no Projeto</label>
                            <select name="status" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none">
                                ${gerarOptions(statusOpts, pessoa.status)}
                            </select>
                        </div>
                        <div class="flex-1">
                            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">1º Dia no Projeto</label>
                            <input type="date" name="primeiro_dia" value="${pessoa.primeiro_dia || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div class="flex flex-col gap-4">
                            <h4 class="font-bold text-slate-800 border-b border-slate-200 pb-1 text-sm"><i class="ph ph-user"></i> Identificação</h4>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome de Registro</label>
                                <input type="text" name="nome" value="${pessoa.nome || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm" required>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Apelido / Nome Social</label>
                                <input type="text" name="apelido" value="${pessoa.apelido || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Documento</label>
                                <input type="text" name="documento" value="${pessoa.documento || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Naturalidade</label>
                                <input type="text" name="naturalidade" value="${pessoa.naturalidade || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Escolaridade</label>
                                <select name="escolaridade" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                                    ${gerarOptions(escolaridades, pessoa.escolaridade)}
                                </select>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4">
                            <h4 class="font-bold text-slate-800 border-b border-slate-200 pb-1 text-sm"><i class="ph ph-users-three"></i> Vínculos e Contato</h4>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome da Mãe</label>
                                <input type="text" name="mae" value="${pessoa.mae || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome do Pai</label>
                                <input type="text" name="pai" value="${pessoa.pai || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Esposa</label>
                                    <input type="text" name="esposa" value="${pessoa.esposa || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Irmãos</label>
                                    <input type="text" name="irmaos" value="${pessoa.irmaos || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filhos</label>
                                <input type="text" name="filhos" value="${pessoa.filhos || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                <input type="text" name="telefone" value="${pessoa.telefone || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Endereço</label>
                                <input type="text" name="endereco" value="${pessoa.endereco || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                        </div>

                        <div class="flex flex-col gap-4">
                            <h4 class="font-bold text-slate-800 border-b border-slate-200 pb-1 text-sm"><i class="ph ph-heartbeat"></i> Saúde e Vestuário</h4>
                            <div class="grid grid-cols-4 gap-2">
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase text-center mb-1">Camisa</label>
                                    <select name="tamanho_camisa" class="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-center">${gerarOptions(camisas, pessoa.tamanho_camisa)}</select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase text-center mb-1">Calça</label>
                                    <select name="tamanho_calca" class="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-center">${gerarOptions(calcas, pessoa.tamanho_calca)}</select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase text-center mb-1">Calçado</label>
                                    <select name="tamanho_calcado" class="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-center">${gerarOptions(calcados, pessoa.tamanho_calcado)}</select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase text-center mb-1">Sangue</label>
                                    <select name="tipo_sanguineo" class="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-center">${gerarOptions(sangues, pessoa.tipo_sanguineo)}</select>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Condições de Saúde</label>
                                <input type="text" name="saude" value="${pessoa.saude || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Alergias</label>
                                <input type="text" name="alergias" value="${pessoa.alergias || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Vícios / Dependência</label>
                                <input type="text" name="vicios" value="${pessoa.vicios || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Aptidões Profissionais</label>
                                <input type="text" name="aptidoes" value="${pessoa.aptidoes || ''}" class="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                            </div>
                        </div>

                    </div>

                    <div class="flex flex-col gap-4 mt-2 border-t border-slate-200 pt-4">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Observações da Gestão</label>
                            <textarea name="observacoes" rows="2" class="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none">${pessoa.observacoes || ''}</textarea>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer w-fit">
                            <input type="checkbox" name="autorizacao_imagem" value="1" class="w-5 h-5 text-indigo-600 rounded" ${pessoa.autorizacao_imagem === "1" ? 'checked' : ''}>
                            <span class="text-sm font-bold text-slate-700">Autoriza o uso de imagem</span>
                        </label>
                    </div>

                    <div class="border-t border-slate-200 pt-5 flex justify-end gap-3 mt-2">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-3 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wide rounded-xl transition-colors shadow-md flex items-center gap-2">
                            <i class="ph ph-floppy-disk text-xl"></i> Salvar Alterações
                        </button>
                    </div>
                </form>

            </div>
        </div>
    `;

    return reply.type('text/html').send(formHtml);
};

exports.atualizarBeneficiario = async (request, reply) => {
    const id = parseInt(request.params.id);
    const dadosAtualizados = request.body;
    
    // Tratamento pro checkbox que, se desmarcado, não é enviado no body
    if (!dadosAtualizados.autorizacao_imagem) {
        dadosAtualizados.autorizacao_imagem = "0";
    }

    const index = bancoDeDadosMock.findIndex(p => p.id === id);

    if (index !== -1) {
        bancoDeDadosMock[index] = { ...bancoDeDadosMock[index], ...dadosAtualizados };
    }

    const sucessoHtml = `
        <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onclick="document.getElementById('modal-container').innerHTML = ''">
            <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all" onclick="event.stopPropagation()">
                <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <i class="ph ph-check-circle text-5xl text-emerald-500"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-2">Atualizado!</h3>
                <p class="text-slate-500 font-medium mb-8">O cadastro completo de <b>${dadosAtualizados.nome}</b> foi salvo com sucesso.</p>
                
                <button hx-get="/beneficiario/${id}" hx-target="#modal-container" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-md">
                    Ver Ficha Atualizada
                </button>
            </div>
        </div>
    `;

    return reply.type('text/html').send(sucessoHtml);
};