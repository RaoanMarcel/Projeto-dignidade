// controllers/busca.controller.js

// Banco de dados mockado agora com TODOS os dados do cadastro
const bancoDeDadosMock = [
    {
        id: 1,
        nome: "João Batista da Silva",
        apelido: "Joãozinho",
        data_nascimento: "15/05/1985",
        nome_mae: "Margarida da Silva",
        naturalidade: "São Paulo - SP",
        documento: "123.456.789-00",
        cartao_sus: "705.1234.5678.9012",
        telefone: "(11) 98765-4321",
        contato_emergencia: "(11) 99999-1111 (Irmã - Ana)",
        aptidoes: "Pedreiro, Pintor",
        medicacao: "Nenhuma",
        alergias: "Dipirona",
        foto: "https://ui-avatars.com/api/?name=Joao+Batista&background=4f46e5&color=fff&size=200",
        status: "Acolhido",
        data_entrada: "12/02/2026",
        observacoes: "Chegou sem documentos originais, segunda via já solicitada. Muito comunicativo e disposto a ajudar na manutenção da casa."
    },
    {
        id: 2,
        nome: "Maria Aparecida Souza",
        apelido: "Cida",
        data_nascimento: "22/08/1978",
        nome_mae: "Não informado",
        naturalidade: "Curitiba - PR",
        documento: "987.654.321-11",
        cartao_sus: "704.9876.5432.1098",
        telefone: "(11) 91234-5678",
        contato_emergencia: "Não possui",
        aptidoes: "Cozinheira, Costureira",
        medicacao: "Losartana (Pressão alta)",
        alergias: "Nenhuma conhecida",
        foto: "https://ui-avatars.com/api/?name=Maria+Aparecida&background=059669&color=fff&size=200",
        status: "Em Transição",
        data_entrada: "05/11/2025",
        observacoes: "Conseguiu um emprego de meio período na padaria do bairro. Auxiliando a buscar aluguel social."
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
        pessoa.apelido.toLowerCase().includes(termoBusca) ||
        pessoa.documento.includes(termoBusca)
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
                        <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">${pessoa.status}</span>
                    </div>
                    <p class="text-sm font-semibold text-slate-500 mb-2 truncate">Vulgo: <span class="text-slate-700">${pessoa.apelido}</span></p>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                        <span class="flex items-center gap-1.5"><i class="ph ph-identification-card text-indigo-500 text-sm"></i> ${pessoa.documento}</span>
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

    const modalHtml = `
        <div id="modal-backdrop" 
             class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-8 transition-opacity"
             onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
            
            <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col max-h-[95vh]">
                
                <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                        class="absolute top-4 right-4 w-10 h-10 bg-black/10 hover:bg-rose-500 hover:text-white text-white rounded-full flex items-center justify-center transition-colors z-10">
                    <i class="ph ph-x text-xl font-bold"></i>
                </button>

                <div class="bg-indigo-700 p-8 text-white flex flex-col md:flex-row gap-6 items-center md:items-start shrink-0">
                    <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-300 shadow-lg shrink-0 bg-white">
                        <img src="${pessoa.foto}" alt="Foto" class="w-full h-full object-cover">
                    </div>
                    <div class="text-center md:text-left flex-1 mt-2">
                        <span class="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">${pessoa.status}</span>
                        <h2 class="text-3xl font-black leading-tight">${pessoa.nome}</h2>
                        <p class="text-indigo-200 font-medium text-lg mt-1">Vulgo: "${pessoa.apelido}"</p>
                    </div>
                    <div class="text-center md:text-right shrink-0 mt-2 md:mt-0">
                        <p class="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Data de Entrada</p>
                        <p class="text-xl font-black flex items-center justify-center md:justify-end gap-2"><i class="ph ph-calendar-plus text-indigo-400"></i> ${pessoa.data_entrada}</p>
                    </div>
                </div>

                <div class="p-6 md:p-8 overflow-y-auto flex flex-col gap-6">
                    
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <i class="ph ph-user text-indigo-500 text-lg"></i> Dados Pessoais
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Nascimento</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.data_nascimento}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Naturalidade</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.naturalidade}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Mãe</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.nome_mae}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <i class="ph ph-identification-badge text-indigo-500 text-lg"></i> Documentação e Contato
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Documento (CPF/RG)</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.documento}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Cartão do SUS</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.cartao_sus}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone Pessoal</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.telefone}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider text-rose-500">Contato de Emergência</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.contato_emergencia}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <i class="ph ph-heartbeat text-indigo-500 text-lg"></i> Saúde e Perfil
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Aptidões / Profissão</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.aptidoes}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicação Contínua</p>
                                <p class="text-base font-semibold text-slate-700 mt-0.5">${pessoa.medicacao}</p>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Alergias</p>
                                <p class="text-base font-semibold text-rose-600 mt-0.5">${pessoa.alergias}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-amber-50 p-5 rounded-xl border border-amber-200">
                        <h3 class="text-sm font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <i class="ph ph-warning-circle text-amber-600 text-lg"></i> Observações e Anotações
                        </h3>
                        <p class="text-amber-900 leading-relaxed text-sm font-medium">${pessoa.observacoes}</p>
                    </div>

                </div>
                
                <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <button hx-get="/editar/${pessoa.id}" 
                            hx-target="#modal-container"
                            class="px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors text-sm flex items-center gap-2">
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