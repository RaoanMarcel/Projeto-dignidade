const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dignidade.db');
const db = new Database(dbPath, { verbose: console.log });

// 1. Cria a tabela com as novas colunas (caso o banco seja apagado e recriado do zero)
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
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id)
    )
`);
db.exec(`
    CREATE TABLE IF NOT EXISTS estoque_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT, -- Ex: Higiene, Vestuário, Cama/Banho, Outros
        tamanho TEXT, -- Ex: M, G, 40 (Deixe vazio para itens sem tamanho, como Sabonete)
        quantidade_atual INTEGER DEFAULT 0,
        unidade_medida TEXT DEFAULT 'Unidade' -- Ex: Par, Kit, Unidade
    )
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
        FOREIGN KEY (item_id) REFERENCES estoque_itens(id),
        FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id)
    )
`);

try {
    db.exec("ALTER TABLE beneficiarios ADD COLUMN status TEXT DEFAULT 'Acolhido'");
    console.log("✅ Coluna 'status' adicionada ao banco de dados!");
} catch (err) {
}

try {
    db.exec("ALTER TABLE beneficiarios ADD COLUMN observacoes TEXT");
    console.log("✅ Coluna 'observacoes' adicionada ao banco de dados!");
} catch (err) {
    // Ignora silenciosamente, a coluna já existe
}

console.log("✅ Banco de dados SQLite inicializado com sucesso!");

module.exports = db;