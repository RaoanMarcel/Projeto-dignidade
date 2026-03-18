const beneficiarioService = require('../services/beneficiario.service'); 
const beneficiarioView = require('../public/views/beneficiario.view');

exports.buscarBeneficiario = async (request, reply) => {
    try {
        const termoBusca = request.body.termo_busca ? request.body.termo_busca.toLowerCase().trim() : '';

        if (!termoBusca) {
            return reply.type('text/html').send(beneficiarioView.renderProntoParaBuscar());
        }

        const resultados = beneficiarioService.buscarPorTermo(termoBusca);

        if (resultados.length === 0) {
            return reply.type('text/html').send(beneficiarioView.renderNenhumAcolhido());
        }

        return reply.type('text/html').send(beneficiarioView.renderListaResultados(resultados));
    } catch (error) {
        console.error('Erro na busca:', error);
        return reply.status(500).send(beneficiarioView.renderErro('Erro na busca pelo paciente.'));
    }
};

exports.abrirModalBeneficiario = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const pessoa = beneficiarioService.obterPorId(id);

        if (!pessoa) {
            return reply.status(404).send(beneficiarioView.renderErro('Beneficiário não encontrado.'));
        }

        const notas = beneficiarioService.obterDiarioDeBordo(id);
        const html = beneficiarioView.renderModalFicha(pessoa, notas);

        return reply.type('text/html').send(html);
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        return reply.status(500).send(beneficiarioView.renderErro('Erro ao carregar a ficha completa.'));
    }
};

exports.carregarFormularioEdicao = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const pessoa = beneficiarioService.obterPorId(id);

        if (!pessoa) {
            return reply.status(404).send(beneficiarioView.renderErro('Beneficiário não encontrado para edição.'));
        }

        return reply.type('text/html').send(beneficiarioView.renderFormularioEdicao(pessoa));
    } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        return reply.status(500).send(beneficiarioView.renderErro('Erro ao carregar o formulário.'));
    }
};

exports.atualizarBeneficiario = async (request, reply) => {   
    try {
        const id = parseInt(request.params.id);
        const dadosAtualizados = request.body || {};
        
        // Regra de negócio isolada antes de enviar pro Service
        if (!dadosAtualizados.autorizacao_imagem) {
            dadosAtualizados.autorizacao_imagem = "0";
        }

        beneficiarioService.atualizarDados(id, dadosAtualizados);

        return reply.type('text/html').send(beneficiarioView.renderSucessoEdicao(id, dadosAtualizados.nome));
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        // Status 200 pro HTMX poder injetar o alerta
        return reply.status(200).send(beneficiarioView.renderErro(error.message));
    }
};

exports.adicionarNotaDiario = async (request, reply) => {
    try {
        const id = parseInt(request.params.id);
        const { anotacao } = request.body; 

        if (!anotacao || anotacao.trim() === '') {
            return reply.status(400).send('<p class="text-rose-500 text-sm font-bold">A anotação não pode estar vazia.</p>');
        }

        const novaNota = beneficiarioService.adicionarNota(id, anotacao.trim());
        
        return reply.type('text/html').send(beneficiarioView.renderNovaNotaDiario(novaNota));

    } catch (error) {
        console.error("Erro ao salvar nota no diário:", error);
        return reply.status(500).send('<p class="text-rose-500 text-sm font-bold">Erro no servidor ao salvar a nota.</p>');
    }
};


exports.abrirHistoricoDoacoes = async (request, reply) => {
    try {
        const id = request.params.id;
        const pessoa = beneficiarioService.obterPorId(id);
        
        if (!pessoa) {
            return reply.send(beneficiarioView.renderErro("Beneficiário não encontrado."));
        }

        const historico = beneficiarioService.obterHistoricoDoacoes(id);
        const html = beneficiarioView.renderModalHistorico(pessoa, historico);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        return reply.send(beneficiarioView.renderErro("Erro interno ao carregar o histórico de doações."));
    }
};