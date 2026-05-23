const atividadeService = require('../services/atividade.service');
// Vamos precisar do arquivo de views que faremos no próximo passo:
const atividadeView = require('../public/views/atividade.view'); 

// ==========================================
// PÁGINA PRINCIPAL E CRIAÇÃO
// ==========================================

exports.abrirPaginaAtividades = async (request, reply) => {
    try {
        const atividades = atividadeService.listarAtividades();
        // Renderiza a página inteira com a tabela de atividades
        const html = atividadeView.renderPaginaPrincipal(atividades);
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao carregar página de atividades:", err);
        return reply.status(500).send("Erro interno ao carregar a página.");
    }
};

exports.abrirModalCriar = async (request, reply) => {
    try {
        // Se você tiver um voluntarioService, buscaria os ativos aqui.
        // Por enquanto, vamos mandar vazio ou você adapta se já tiver.
        const html = atividadeView.renderModalCriarAtividade(); 
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir modal de atividade:", err);
        return reply.status(500).send("Erro interno.");
    }
};

exports.salvarAtividade = async (request, reply) => {
    try {
        const dados = request.body;
        atividadeService.criarAtividade(dados);
        
        // Recarrega a lista de atividades para mostrar a nova
        const atividades = atividadeService.listarAtividades();
        const htmlLista = atividadeView.renderListaAtividades(atividades);
        
        // Dispara o evento para fechar o modal no frontend
        reply.header('HX-Trigger', 'closeModal');
        return reply.type('text/html').send(htmlLista);
    } catch (err) {
        console.error("Erro ao salvar atividade:", err);
        return reply.status(500).send(`<script>alert("Erro ao salvar: ${err.message}");</script>`);
    }
};

// ==========================================
// DETALHES E LISTA DE PRESENÇA
// ==========================================

exports.abrirDetalhes = async (request, reply) => {
    try {
        const id = request.params.id;
        const atividade = atividadeService.obterAtividadePorId(id);
        const participantes = atividadeService.listarParticipantesDaAtividade(id);
        
        const html = atividadeView.renderPaginaDetalhes(atividade, participantes);
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir detalhes da atividade:", err);
        return reply.status(500).send("Erro ao carregar detalhes.");
    }
};

exports.buscarParaPresenca = async (request, reply) => {
    try {
        const atividadeId = request.params.id;
        const termo = request.body.busca;
        
        const resultados = atividadeService.buscarAcolhidosNaoParticipantes(atividadeId, termo);
        const html = atividadeView.renderResultadosBuscaPresenca(resultados, atividadeId);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro na busca de presença:", err);
        return reply.type('text/html').send(`<div class="text-rose-500 p-2">Erro na busca.</div>`);
    }
};

exports.adicionarParticipante = async (request, reply) => {
    try {
        const atividadeId = request.params.id;
        const beneficiarioId = request.body.beneficiario_id;
        const observacao = request.body.observacao || null;

        atividadeService.adicionarParticipante(atividadeId, beneficiarioId, observacao);
        
        // Atualiza a tabela de participantes na tela
        const participantes = atividadeService.listarParticipantesDaAtividade(atividadeId);
        const html = atividadeView.renderTabelaParticipantes(participantes, atividadeId);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao adicionar participante:", err);
        return reply.status(500).send("Erro ao registrar presença.");
    }
};

exports.removerParticipante = async (request, reply) => {
    try {
        const atividadeId = request.params.id;
        const beneficiarioId = request.params.beneficiarioId;

        atividadeService.removerParticipante(atividadeId, beneficiarioId);
        
        const participantes = atividadeService.listarParticipantesDaAtividade(atividadeId);
        const html = atividadeView.renderTabelaParticipantes(participantes, atividadeId);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao remover participante:", err);
        return reply.status(500).send("Erro ao remover presença.");
    }
};

// ==========================================
// AÇÕES EXTRAS (CONCLUIR E EXCLUIR) - CORRIGIDO
// ==========================================

exports.concluirAtividade = async (request, reply) => {
    try {
        const id = request.params.id;
        const { feedback } = request.body;
        
        // 1. Atualiza no banco
        atividadeService.atualizarStatus(id, 'Realizada', feedback);
        
        // 2. Pega os dados atualizados
        const atividade = atividadeService.obterAtividadePorId(id);
        const participantes = atividadeService.listarParticipantesDaAtividade(id);
        
        // 3. Renderiza a tela de detalhes novamente e devolve pro HTMX encaixar
        const html = atividadeView.renderPaginaDetalhes(atividade, participantes);
        return reply.type('text/html').send(html);
        
    } catch (err) {
        console.error("Erro ao concluir atividade:", err);
        return reply.status(500).send(`<script>alert("Erro ao concluir atividade.");</script>`);
    }
};

exports.excluirAtividade = async (request, reply) => {
    try {
        const id = request.params.id;
        
        // 1. Exclui do banco
        atividadeService.excluirAtividade(id);
        
        // 2. Pega a lista de atividades atualizada (sem a que acabamos de excluir)
        const atividades = atividadeService.listarAtividades();
        
        // 3. Renderiza a tela inicial e devolve pro HTMX voltar para a listagem
        const html = atividadeView.renderPaginaPrincipal(atividades);
        return reply.type('text/html').send(html);
        
    } catch (err) {
        console.error("Erro ao excluir atividade:", err);
        return reply.status(500).send(`<script>alert("Erro ao excluir.");</script>`);
    }
};