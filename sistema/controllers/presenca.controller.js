const presencaService = require('../services/presenca.service');
const beneficiarioService = require('../services/beneficiario.service'); 
const presencaView = require('../public/views/presenca.view');
const xlsx = require('xlsx');

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

exports.abrirHistorico = async (request, reply) => {
    try {
        const hoje = new Date().toISOString().split('T')[0]; 
        
        const historico = presencaService.obterHistoricoPorData(hoje);
        const tabelaHtml = presencaView.renderTabelaHistorico(historico);
        const html = presencaView.renderTelaHistorico(hoje, tabelaHtml);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir histórico:", err);
        return reply.status(500).send("Erro ao carregar histórico.");
    }
};

exports.filtrarHistorico = async (request, reply) => {
    try {
        const data = request.body.data_filtro;
        const historico = presencaService.obterHistoricoPorData(data);
        const html = presencaView.renderTabelaHistorico(historico);
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao filtrar histórico:", err);
        return reply.send("<tr><td colspan='4' class='text-center p-4 text-rose-500'>Erro ao buscar dados.</td></tr>");
    }
};

exports.exportarExcel = async (request, reply) => {
    try {
        const data = request.body.data_exportacao;
        let selecionados = request.body.selecionados;

        if (!selecionados) {
            return reply.type('text/html').send(`
                <script>
                    alert('Por favor, selecione pelo menos um acolhido para exportar.');
                    window.history.back();
                </script>
            `);
        }

        if (!Array.isArray(selecionados)) {
            selecionados = [selecionados];
        }

        const historicoCompleto = presencaService.obterHistoricoPorData(data);
        const historicoFiltrado = historicoCompleto.filter(h => selecionados.includes(h.id.toString()));

        const dadosPlanilha = historicoFiltrado.map(h => {
            let tempoTexto = 'Em andamento';
            if (h.data_saida) {
                const diff = new Date(h.data_saida) - new Date(h.data_entrada);
                const horas = Math.floor(diff / (1000 * 60 * 60));
                const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                tempoTexto = `${horas}h ${minutos}m`;
            }

            return {
                'Nome do Acolhido': h.nome,
                'Documento': h.documento || 'Não informado',
                'Data/Hora Entrada': new Date(h.data_entrada).toLocaleString('pt-BR'),
                'Data/Hora Saída': h.data_saida ? new Date(h.data_saida).toLocaleString('pt-BR') : 'Ainda na casa',
                'Tempo de Permanência': tempoTexto,
                'Status': h.status === 'ATIVA' ? 'Presente' : 'Baixa'
            };
        });

        const worksheet = xlsx.utils.json_to_sheet(dadosPlanilha);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Presenças");

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        reply.header('Content-Disposition', `attachment; filename="Lista_Presencas_${data}.xlsx"`);
        reply.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        return reply.send(buffer);
    } catch (err) {
        console.error("Erro ao exportar Excel:", err);
        return reply.status(500).send("Erro ao gerar arquivo Excel.");
    }
};

// Abre o modal
exports.abrirModalCadastroRapido = async (request, reply) => {
    try {
        const html = presencaView.renderModalCadastroRapido();
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro ao abrir modal rápido:", err);
        return reply.status(500).send("Erro interno.");
    }
};

exports.salvarCadastroRapido = async (request, reply) => {
    try {
        const { nome, apelido, idade, documento } = request.body;
        
        const novoId = presencaService.criarBeneficiarioRapido({ nome, apelido, documento });
        
        presencaService.registrarEntrada([novoId]);
        
        const ativos = presencaService.listarAtivosNaCasa();
        const html = presencaView.renderListaAtivos(ativos);
        
        reply.header('HX-Trigger', 'closeModal');
        
        return reply.type('text/html').send(html);
    } catch (err) {
        console.error("Erro no cadastro rápido:", err);
        return reply.status(500).send(`<script>alert("Erro ao cadastrar: ${err.message}");</script>`);
    }
};