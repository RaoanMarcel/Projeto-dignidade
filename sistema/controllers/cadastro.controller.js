const fs = require('fs');
const path = require('path');
const db = require('../db'); // Ajuste o caminho se necessário

exports.cadastrarBeneficiario = async (request, reply) => {
    try {
        const dados = request.body;
        console.log("📝 Novo Cadastro Recebido:", dados.nome);
        
        let caminhoDaFoto = 'https://ui-avatars.com/api/?name=Sem+Foto&background=cbd5e1&color=fff&size=200'; // Foto padrão

        // 1. Salva a foto real se houver
        if (dados.foto && dados.foto.startsWith('data:image')) {
            const base64Data = dados.foto.replace(/^data:image\/\w+;base64,/, "");
            const nomeLimpo = (dados.nome || 'sem-nome').replace(/\s+/g, '-').toLowerCase();
            const nomeArquivo = `${Date.now()}-${nomeLimpo}.png`;
            const pastaDestino = path.join(__dirname, '../../public/uploads/fotos'); // Ajuste o caminho da pasta
            
            if (!fs.existsSync(pastaDestino)) {
                fs.mkdirSync(pastaDestino, { recursive: true });
            }
            fs.writeFileSync(path.join(pastaDestino, nomeArquivo), base64Data, 'base64');
            caminhoDaFoto = `/uploads/fotos/${nomeArquivo}`;
        }

        // 2. Insere no SQLite com better-sqlite3
        const stmt = db.prepare(`
            INSERT INTO beneficiarios (
                nome, apelido, foto, primeiro_dia, documento, naturalidade, 
                escolaridade, mae, pai, irmaos, esposa, filhos, 
                tamanho_camisa, tamanho_calca, tamanho_calcado, tipo_sanguineo, 
                saude, alergias, vicios, telefone, endereco, aptidoes, autorizacao_imagem
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            dados.nome || '', dados.apelido || '', caminhoDaFoto, dados.primeiro_dia || '', dados.documento || '',
            dados.naturalidade || '', dados.escolaridade || '', dados.mae || '', dados.pai || '', dados.irmaos || '',
            dados.esposa || '', dados.filhos || '', dados.tamanho_camisa || '', dados.tamanho_calca || '',
            dados.tamanho_calcado || '', dados.tipo_sanguineo || '', dados.saude || '', dados.alergias || '',
            dados.vicios || '', dados.telefone || '', dados.endereco || '', dados.aptidoes || '',
            dados.autorizacao_imagem ? 1 : 0
        );

        // 3. Devolve a sua UI de sucesso maravilhosa e limpa a tela
        const mensagemSucesso = `
            <div class="flex flex-col items-center gap-2 bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm mb-4">
                <span class="text-emerald-600 text-base font-black uppercase tracking-wide flex items-center gap-2">
                    <i class="ph ph-check-circle text-2xl"></i> Cadastro realizado com sucesso!
                </span>
                <span class="text-slate-500 text-xs font-medium">
                    O acolhido <b>${dados.nome}</b> foi registrado no sistema.
                </span>
            </div>
            <script>
                document.getElementById('formCadastro').reset();
                document.getElementById('fotoCapturada').classList.add('hidden');
                document.getElementById('webcam').classList.remove('hidden');
                document.getElementById('inputFotoBase64').value = '';
            </script>
        `;
        
        return reply.type('text/html').send(mensagemSucesso);
        
    } catch (error) {
        request.log.error(error);
        console.error("Erro BD:", error);
        return reply.status(500).send(`<div class="p-4 bg-rose-100 text-rose-600 rounded-xl">Erro ao salvar cadastro.</div>`);
    }
};