const db = require('../db.js');

exports.buscarPorTermo = (termoBusca) => {
    const stmt = db.prepare(`
        SELECT * FROM beneficiarios 
        WHERE LOWER(nome) LIKE ? 
           OR LOWER(apelido) LIKE ? 
           OR documento LIKE ?
        ORDER BY nome ASC
    `);
    return stmt.all(`%${termoBusca}%`, `%${termoBusca}%`, `%${termoBusca}%`);
};

exports.obterPorId = (id) => {
    const stmt = db.prepare('SELECT * FROM beneficiarios WHERE id = ?');
    return stmt.get(id);
};

exports.obterDiarioDeBordo = (beneficiarioId) => {
    const stmt = db.prepare('SELECT * FROM diario_bordo WHERE beneficiario_id = ? ORDER BY id DESC');
    return stmt.all(beneficiarioId);
};

exports.atualizarDados = (id, dados) => {
    const stmt = db.prepare(`
        UPDATE beneficiarios SET
            nome = ?, apelido = ?, primeiro_dia = ?, documento = ?, naturalidade = ?,
            escolaridade = ?, mae = ?, pai = ?, irmaos = ?, esposa = ?, filhos = ?,
            tamanho_camisa = ?, tamanho_calca = ?, tamanho_calcado = ?, tipo_sanguineo = ?,
            saude = ?, alergias = ?, vicios = ?, telefone = ?, endereco = ?, aptidoes = ?,
            autorizacao_imagem = ?, status = ?, observacoes = ?
        WHERE id = ?
    `);

    stmt.run(
        dados.nome || '', dados.apelido || '',
        dados.primeiro_dia || '', dados.documento || '', dados.naturalidade || '',
        dados.escolaridade || '', dados.mae || '', dados.pai || '',
        dados.irmaos || '', dados.esposa || '', dados.filhos || '',
        dados.tamanho_camisa || '', dados.tamanho_calca || '', dados.tamanho_calcado || '',
        dados.tipo_sanguineo || '', dados.saude || '', dados.alergias || '',
        dados.vicios || '', dados.telefone || '', dados.endereco || '',
        dados.aptidoes || '', parseInt(dados.autorizacao_imagem) || 0, dados.status || '',
        dados.observacoes || '', id
    );
};

exports.adicionarNota = (beneficiarioId, anotacao) => {
    const stmt = db.prepare('INSERT INTO diario_bordo (beneficiario_id, anotacao) VALUES (?, ?)');
    const result = stmt.run(beneficiarioId, anotacao);
    
    return db.prepare('SELECT * FROM diario_bordo WHERE id = ?').get(result.lastInsertRowid);
};