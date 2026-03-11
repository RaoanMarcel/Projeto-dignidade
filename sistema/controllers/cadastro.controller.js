
exports.cadastrarBeneficiario = async (request, reply) => {
    try {
        const dados = request.body;
        
        console.log("📝 Novo Cadastro Recebido:", dados.nome);

        const mensagemSucesso = `
            <div class="flex flex-col items-center gap-2">
                <span class="text-emerald-600 text-base font-black uppercase tracking-wide">
                    🎉 Cadastro realizado com sucesso!
                </span>
                <span class="text-slate-500 text-xs font-medium">
                    O acolhido <b>${dados.nome}</b> foi registrado no sistema.
                </span>
            </div>
        `;
        
        return reply.type('text/html').send(mensagemSucesso);
        
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(`<span class="text-rose-600">Erro ao salvar cadastro.</span>`);
    }
};