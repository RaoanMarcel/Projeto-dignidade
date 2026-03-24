const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dignidade.db');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS beneficiarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    apelido TEXT,
    foto TEXT,
    primeiro_dia TEXT,
    documento TEXT,
    naturalidade TEXT,
    mae TEXT,
    pai TEXT,
    irmaos TEXT,
    esposa TEXT,
    filhos TEXT,
    escolaridade TEXT,
    tamanho_camisa TEXT,
    tamanho_calca TEXT,
    tamanho_calcado TEXT,
    tipo_sanguineo TEXT,
    alergias TEXT,
    saude TEXT,
    vicios TEXT,
    endereco TEXT,
    telefone TEXT,
    aptidoes TEXT,
    autorizacao_imagem INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Acolhido', 
    observacoes TEXT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS diario_bordo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beneficiario_id INTEGER NOT NULL,
        data_registro TEXT DEFAULT (datetime('now', 'localtime')),
        anotacao TEXT NOT NULL,
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE CASCADE
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS estoque_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        categoria TEXT NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        condicao TEXT,
        tamanho TEXT,
        status TEXT DEFAULT 'Disponível',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        tipo TEXT NOT NULL, -- Vai ser 'ENTRADA' ou 'SAIDA'
        quantidade INTEGER NOT NULL,
        data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        beneficiario_id INTEGER, -- Se for saída, para quem foi entregue?
        observacao TEXT,
        FOREIGN KEY (item_id) REFERENCES estoque_itens(id) ON DELETE CASCADE,
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE SET NULL
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS presencas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beneficiario_id INTEGER NOT NULL,
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_saida DATETIME,
    status TEXT DEFAULT 'ATIVA', -- Pode ser 'ATIVA', 'FINALIZADA' ou 'SAIDA_NAO_REGISTRADA'
    FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id)
);`);

db.exec(`CREATE TABLE IF NOT EXISTS voluntarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    telefone TEXT,
    email TEXT,
    area_atuacao TEXT, -- Ex: Cozinha, Administrativo, Triagem
    disponibilidade TEXT, -- Ex: "Segunda (Manhã), Quarta (Tarde)"
    nome_emergencia TEXT, -- Opcional
    telefone_emergencia TEXT, -- Opcional
    status TEXT DEFAULT 'Ativo', -- Ativo / Inativo
    termo_assinado INTEGER DEFAULT 0, -- 0 = Não, 1 = Sim
    data_assinatura_termo DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

try {
    db.exec("ALTER TABLE beneficiarios ADD COLUMN status TEXT DEFAULT 'Acolhido'");
    console.log("✅ Coluna 'status' adicionada ao banco de dados!");
} catch (err) {
}

try {
    db.exec("ALTER TABLE beneficiarios ADD COLUMN observacoes TEXT");
    console.log("✅ Coluna 'observacoes' adicionada ao banco de dados!");
} catch (err) {
}

console.log("✅ Banco de dados SQLite inicializado e estruturado com sucesso!");

module.exports = db;