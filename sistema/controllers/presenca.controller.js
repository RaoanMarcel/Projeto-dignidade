const presencaService = require('../services/presenca.service');
const beneficiarioService = require('../services/beneficiario.service'); 
const presencaView = require('../public/views/presenca.view');

exports.abrirPortaria = async (request, reply) => {
    try {
        const ativos = presencaService.listarAtivosNaCasa();
        const ativosHtml = presencaView.renderListaAtivos(ativos);
        const html = presencaView.renderTelaPortaria(ativosHtml);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir portaria:", err);
        return reply.status(500).send("Erro interno ao carregar a portaria.");
    }
};

exports.buscarPessoas = async (request, reply) => {
    try {
        const termo = request.body.busca;
        let pessoas = [];
        
        if (termo && termo.trim().length > 0) {
            pessoas = beneficiarioService.buscarPorTermo(termo); 
        }
        
        const html = presencaView.renderListaBusca(pessoas);
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro na busca da portaria:", err);
        return reply.type('text/html').send(`<div class="w-full text-center p-4 text-rose-500 font-medium">Erro ao buscar pessoas.</div>`);
    }
};

exports.registrarEntrada = async (request, reply) => {
    try {
        let ids = request.body.beneficiario_id;
        
        if (ids) {
            if (!Array.isArray(ids)) ids = [ids]; 
            presencaService.registrarEntrada(ids);
        }

        const ativos = presencaService.listarAtivosNaCasa();
        const html = presencaView.renderListaAtivos(ativos);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao registrar entrada:", err);
        return reply.status(500).send("Erro ao registrar entrada.");
    }
};

exports.registrarSaida = async (request, reply) => {
    try {
        const presencaId = request.params.id;
        presencaService.registrarSaida(presencaId);
        
        const ativos = presencaService.listarAtivosNaCasa();
        const html = presencaView.renderListaAtivos(ativos);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao registrar saída:", err);
        return reply.status(500).send("Erro ao dar baixa.");
    }
};