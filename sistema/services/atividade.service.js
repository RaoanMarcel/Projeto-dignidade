const db = require('../db.js');


exports.criarAtividade = (dados) => {
    const stmt = db.prepare(`
        INSERT INTO atividades (titulo, tipo, data_hora, voluntario_id, descricao) 
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
        dados.titulo,
        dados.tipo, // 'Coletiva', 'Individual', 'Interna'
        dados.data_hora,
        dados.voluntario_id || null,
        dados.descricao || null
    );
    
    return info.lastInsertRowid;
};

exports.listarAtividades = () => {
    const stmt = db.prepare(`
        SELECT a.*, v.nome as nome_responsavel 
        FROM atividades a
        LEFT JOIN voluntarios v ON a.voluntario_id = v.id
        ORDER BY a.data_hora DESC
    `);
    return stmt.all();
};

exports.obterAtividadePorId = (id) => {
    const stmt = db.prepare(`
        SELECT a.*, v.nome as nome_responsavel 
        FROM atividades a
        LEFT JOIN voluntarios v ON a.voluntario_id = v.id
        WHERE a.id = ?
    `);
    return stmt.get(id);
};

exports.atualizarStatus = (id, status, feedback) => {
    const stmt = db.prepare(`
        UPDATE atividades 
        SET status = ?, feedback = ?
    WHERE id = ?
    `);
    stmt.run(status, feedback || null, id);
};

exports.excluirAtividade = (id) => {

    const stmt = db.prepare(`DELETE FROM atividades WHERE id = ?`);
    stmt.run(id);
};

exports.adicionarParticipante = (atividadeId, beneficiarioId, observacao = null) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO atividade_participantes (atividade_id, beneficiario_id, observacao) 
      VALUES (?, ?, ?)
    `);
    stmt.run(atividadeId, beneficiarioId, observacao);
    return true;
  } catch (err) {
    console.error("Erro ao adicionar participante:", err);
    return false;
  }
};


exports.removerParticipante = (atividadeId, beneficiarioId) => {
    const stmt = db.prepare(`
        DELETE FROM atividade_participantes 
        WHERE atividade_id = ? AND beneficiario_id = ?
    `);
    stmt.run(atividadeId, beneficiarioId);
};

exports.listarParticipantesDaAtividade = (atividadeId) => {
    const stmt = db.prepare(`
        SELECT ap.*, b.nome, b.apelido, b.documento
        FROM atividade_participantes ap
        JOIN beneficiarios b ON ap.beneficiario_id = b.id
        WHERE ap.atividade_id = ?
        ORDER BY b.nome ASC
    `);
    return stmt.all(atividadeId);
};

// Esta função ajuda na hora de buscar acolhidos para colocar na lista de presença
exports.buscarAcolhidosNaoParticipantes = (atividadeId, termoBusca = '') => {
    let sql = `
        SELECT id, nome, apelido, documento 
        FROM beneficiarios 
        WHERE id NOT IN (
            SELECT beneficiario_id FROM atividade_participantes WHERE atividade_id = ?
        )
    `;
    
    let params = [atividadeId];

    if (termoBusca && termoBusca.trim() !== '') {
        sql += ` AND (nome LIKE ? OR apelido LIKE ?)`;
        const termoLike = `%${termoBusca.trim()}%`;
        params.push(termoLike, termoLike);
    }

    sql += ` ORDER BY nome ASC LIMIT 10`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
};