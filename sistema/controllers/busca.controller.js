// controllers/busca.controller.js

// Simulando um Banco de Dados (Substituiremos pelo banco real depois)
const bancoDeDadosMock = [
    {
        id: 1,
        nome: "João Batista da Silva",
        apelido: "Joãozinho",
        documento: "123.456.789-00",
        telefone: "(11) 98765-4321",
        aptidoes: "Pedreiro, Pintor",
        foto: "https://ui-avatars.com/api/?name=Joao+Batista&background=4f46e5&color=fff&size=200",
        status: "Ativo"
    },
    {
        id: 2,
        nome: "Maria Aparecida Souza",
        apelido: "Cida",
        documento: "987.654.321-11",
        telefone: "(11) 91234-5678",
        aptidoes: "Cozinheira",
        foto: "https://ui-avatars.com/api/?name=Maria+Aparecida&background=059669&color=fff&size=200",
        status: "Ativo"
    }
];

exports.buscarBeneficiario = async (request, reply) => {
    // Pega o que o usuário digitou (vem pelo req.body do HTMX)
    const termoBusca = request.body.termo_busca ? request.body.termo_busca.toLowerCase().trim() : '';

    // Se o campo estiver vazio, devolve o estado inicial
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

    // Se não encontrou ninguém
    if (resultados.length === 0) {
        return reply.type('text/html').send(`
            <div class="bg-rose-50 rounded-2xl border border-rose-200 p-8 flex flex-col items-center justify-center text-center text-rose-600">
                <i class="ph ph-warning-circle text-5xl mb-3"></i>
                <h3 class="text-lg font-bold">Nenhum acolhido encontrado</h3>
                <p class="text-sm mt-1 text-rose-500">Verifique se o nome ou documento foi digitado corretamente.</p>
            </div>
        `);
    }

    // Se encontrou, monta os cards
    let htmlResultados = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    
    resultados.forEach(pessoa => {
        htmlResultados += `
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                <div class="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 group-hover:border-indigo-400 transition-colors">
                    <img src="${pessoa.foto}" alt="Foto de ${pessoa.nome}" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col justify-center flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <h4 class="text-lg font-black text-slate-900 truncate" title="${pessoa.nome}">${pessoa.nome}</h4>
                        <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">${pessoa.status}</span>
                    </div>
                    <p class="text-sm font-semibold text-slate-500 mb-2 truncate">Vulgo / Apelido: <span class="text-slate-700">${pessoa.apelido}</span></p>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                        <span class="flex items-center gap-1.5"><i class="ph ph-identification-card text-indigo-500 text-sm"></i> ${pessoa.documento}</span>
                        <span class="flex items-center gap-1.5"><i class="ph ph-briefcase text-blue-500 text-sm"></i> ${pessoa.aptidoes}</span>
                    </div>
                </div>
            </div>
        `;
    });

    htmlResultados += '</div>';

    // Retorna o HTML pronto pro HTMX injetar na tela
    return reply.type('text/html').send(htmlResultados);
};