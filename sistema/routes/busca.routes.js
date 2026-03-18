// routes/busca.routes.js
const path = require('path');
const fs = require('fs');
const buscaController = require('../controllers/busca.controller'); 

async function buscaRoutes(fastify, options) {
    
    // Retorna o fragmento da tela de busca (consulta.html)
    fastify.get('/view-busca', async (request, reply) => {
        try {
            // Usamos path.resolve para garantir o caminho absoluto correto
            const filePath = path.resolve(__dirname, '../public/views/consulta.html');
            
            if (!fs.existsSync(filePath)) {
                console.error("Arquivo não encontrado:", filePath);
                return reply.status(404).send('<p class="text-rose-500 font-bold">Erro: Arquivo consulta.html não encontrado no servidor.</p>');
            }

            const html = fs.readFileSync(filePath, 'utf8');
            return reply.type('text/html').send(html);
        } catch (err) {
            console.error("Erro interno ao ler consulta.html:", err);
            return reply.status(500).send("Erro interno ao carregar a página de busca.");
        }
    });

    // Realiza a busca no HTMX (processa o input e devolve os cards)
    fastify.post('/buscar', buscaController.buscarBeneficiario);
    
    // Modais e Detalhes
    fastify.get('/beneficiario/:id', buscaController.abrirModalBeneficiario);
    
    // Fluxo de Edição
    fastify.get('/editar/:id', buscaController.carregarFormularioEdicao);
    fastify.post('/atualizar/:id', buscaController.atualizarBeneficiario);

    // Rota para o diário de bordo (caso não tenha colocado ainda)
    if (buscaController.adicionarAnotacaoDiario) {
        fastify.post('/diario/:id', buscaController.adicionarAnotacaoDiario);
    }
}

module.exports = buscaRoutes;