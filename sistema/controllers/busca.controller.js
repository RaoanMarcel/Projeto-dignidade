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
exports.salvarVisitaIndividual = async (request, reply) => {
    try {
        const beneficiarioId = request.params.id;
        const dadosVisita = {
            beneficiario_id: beneficiarioId,
            data_visita: request.body.data_visita,
            motivo: request.body.motivo,
            status: request.body.status || 'Realizada',
            observacoes: request.body.observacoes || ''
        };
        
        beneficiarioService.adicionarVisitaIndividual(dadosVisita);
        const visitas = beneficiarioService.listarVisitasIndividuais(beneficiarioId);
        
        // Usa a view que já está importada no topo do arquivo!
        const htmlVisitas = beneficiarioView.renderListaVisitasIndividuais(visitas);
        
        return reply.type('text/html').send(htmlVisitas);
    } catch (err) {
        console.error("Erro ao salvar visita individual:", err);
        return reply.status(500).send(`<div class="text-rose-500 font-bold mt-2">Erro ao registrar atendimento.</div>`);
    }
};

exports.abrirPaginaAtendimentos = async (request, reply) => {
    try {
        const atendimentos = beneficiarioService.listarTodosAtendimentos();
        const beneficiarios = beneficiarioService.obterBeneficiariosSimples();
        
        const html = beneficiarioView.renderPaginaAtendimentos(atendimentos, beneficiarios);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir página de atendimentos:", err);
        return reply.status(500).send("Erro interno ao carregar atendimentos.");
    }
};

exports.salvarAtendimentoGlobal = async (request, reply) => {
    try {
        const dadosVisita = {
            beneficiario_id: request.body.beneficiario_id,
            data_visita: request.body.data_visita,
            motivo: request.body.motivo,
            status: request.body.status || 'Realizada',
            observacoes: request.body.observacoes || ''
        };
        
        beneficiarioService.adicionarVisitaIndividual(dadosVisita);
        
        const atendimentos = beneficiarioService.listarTodosAtendimentos();
        const htmlLista = beneficiarioView.renderListaAtendimentosGlobal(atendimentos);
        
        return reply.type('text/html').send(htmlLista);
    } catch (err) {
        console.error("Erro ao salvar atendimento:", err);
        return reply.status(500).send(`<div class="text-rose-500 font-bold mt-2">Erro ao registrar atendimento.</div>`);
    }
};