const familiaService = require('../services/familia.service');
const familiaView = require('../public/views/familia.view');

exports.abrirPaginaFamilias = async (request, reply) => {
    try {
        const familias = familiaService.listarFamilias();
        const html = familiaView.renderPaginaPrincipal(familias);
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao carregar página de famílias:", err);
        return reply.status(500).send("Erro interno ao carregar a página.");
    }
};

exports.abrirModalCriar = async (request, reply) => {
    try {
        const html = familiaView.renderModalCriarFamilia();
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir modal de família:", err);
        return reply.status(500).send("Erro interno.");
    }
};

exports.salvarFamilia = async (request, reply) => {
    try {
        const dados = request.body;
        
        // Salva no banco de dados real
        familiaService.criarFamilia(dados);
        
        // Busca a lista atualizada no banco
        const familias = familiaService.listarFamilias();
        const htmlLista = familiaView.renderListaFamilias(familias);
        
        // Fecha o modal e atualiza a tela
        reply.header('HX-Trigger', 'closeModal');
        return reply.type('text/html').send(htmlLista);
    } catch (err) {
        console.error("Erro ao salvar família:", err);
        return reply.status(500).send(`<script>alert("Erro ao salvar no banco de dados.");</script>`);
    }
};

exports.buscarFamilias = async (request, reply) => {
    try {
        const termo = request.body.busca;
        const familias = familiaService.listarFamilias(termo);
        
        const html = familiaView.renderListaFamilias(familias);
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro na busca de famílias:", err);
        return reply.status(500).send(`<div class="text-rose-500 p-4 font-bold">Erro ao realizar a busca no banco.</div>`);
    }
};

// Adicione no final do familia.controller.js

exports.abrirPerfilFamilia = async (request, reply) => {
    try {
        const familiaId = request.params.id;
        const familia = familiaService.obterFamiliaPorId(familiaId);
        
        if (!familia) return reply.status(404).send("Família não encontrada.");

        const membros = familiaService.listarBeneficiariosDaFamilia(familiaId);
        const visitas = familiaService.listarVisitasDaFamilia(familiaId);
        const todosAcolhidos = familiaService.obterTodosBeneficiarios();

        const html = familiaView.renderPerfilFamilia(familia, membros, visitas, todosAcolhidos);
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir perfil:", err);
        return reply.status(500).send("Erro interno ao carregar perfil.");
    }
};

exports.adicionarMembro = async (request, reply) => {
    try {
        const familiaId = request.params.id;
        const { beneficiario_id, grau_parentesco } = request.body;
        
        familiaService.adicionarMembro(familiaId, beneficiario_id, grau_parentesco);
        
        // Recarrega apenas a lista de membros atualizada
        const membros = familiaService.listarBeneficiariosDaFamilia(familiaId);
        const htmlMembros = familiaView.renderListaMembros(membros, familiaId);
        return reply.type('text/html').send(htmlMembros);
    } catch (err) {
        console.error("Erro ao adicionar membro:", err);
        return reply.status(400).send(`<div class="text-rose-500 text-sm font-bold mt-2">${err.message || 'Erro ao vincular membro.'}</div>`);
    }
};

exports.removerMembro = async (request, reply) => {
    try {
        const { id, membroId } = request.params;
        familiaService.removerMembro(id, membroId);
        
        const membros = familiaService.listarBeneficiariosDaFamilia(id);
        const htmlMembros = familiaView.renderListaMembros(membros, id);
        return reply.type('text/html').send(htmlMembros);
    } catch (err) {
        console.error("Erro ao remover membro:", err);
        return reply.status(500).send("Erro ao remover membro.");
    }
};

// Adicione no final do familia.controller.js

exports.salvarVisita = async (request, reply) => {
    try {
        const familiaId = request.params.id;
        const dadosVisita = {
            familia_id: familiaId,
            data_visita: request.body.data_visita,
            motivo: request.body.motivo,
            status: request.body.status || 'Agendada',
            observacoes: request.body.observacoes || ''
        };
        
        familiaService.adicionarVisita(dadosVisita);
        
        // Recarrega apenas a lista de visitas
        const visitas = familiaService.listarVisitasDaFamilia(familiaId);
        const htmlVisitas = familiaView.renderListaVisitas(visitas);
        return reply.type('text/html').send(htmlVisitas);
    } catch (err) {
        console.error("Erro ao salvar visita:", err);
        return reply.status(500).send(`<div class="text-rose-500 font-bold mt-2">Erro ao registrar visita.</div>`);
    }
};