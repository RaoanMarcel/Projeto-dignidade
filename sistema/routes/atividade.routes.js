const atividadeController = require('../controllers/atividade.controller');

async function atividadeRoutes(fastify, options) {
    
    // Lista todas as atividades (Página principal do módulo)
    fastify.get('/atividades', atividadeController.abrirPaginaAtividades);
    
    // Modal de criação e salvamento
    fastify.get('/atividades/novo', atividadeController.abrirModalCriar);
    fastify.post('/atividades', atividadeController.salvarAtividade);
    
    // Detalhes de uma atividade específica
    fastify.get('/atividades/:id', atividadeController.abrirDetalhes);
    fastify.post('/atividades/:id/concluir', atividadeController.concluirAtividade);
    fastify.delete('/atividades/:id', atividadeController.excluirAtividade);
    
    // Gerenciamento da Lista de Presença
    fastify.post('/atividades/:id/buscar-pessoas', atividadeController.buscarParaPresenca);
    fastify.post('/atividades/:id/participantes', atividadeController.adicionarParticipante);
    fastify.delete('/atividades/:id/participantes/:beneficiarioId', atividadeController.removerParticipante);
}

module.exports = atividadeRoutes;