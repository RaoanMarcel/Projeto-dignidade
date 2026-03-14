const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dignidade.db');
const db = new Database(dbPath, { verbose: console.log });

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

console.log("✅ Banco de dados SQLite inicializado com sucesso!");

module.exports = db;