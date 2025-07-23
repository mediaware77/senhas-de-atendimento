-- Criação das tabelas para o sistema de senhas do Procon

-- Tabela de assuntos
CREATE TABLE IF NOT EXISTS assuntos (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL
);

-- Tabela de balcões
CREATE TABLE IF NOT EXISTS balcoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

-- Tabela principal de pessoas em atendimento
CREATE TABLE IF NOT EXISTS pessoas_atendimento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('N', 'P')),
    assunto_id INTEGER REFERENCES assuntos(id),
    senha VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'atendendo', 'finalizado')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_senha DATE DEFAULT CURRENT_DATE
);

-- Tabela de histórico de chamadas
CREATE TABLE IF NOT EXISTS historico_chamadas (
    id SERIAL PRIMARY KEY,
    pessoa_atendimento_id INTEGER REFERENCES pessoas_atendimento(id),
    balcao_id INTEGER REFERENCES balcoes(id),
    chamado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pessoas_data_senha ON pessoas_atendimento(data_senha);
CREATE INDEX IF NOT EXISTS idx_pessoas_status ON pessoas_atendimento(status);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo ON pessoas_atendimento(tipo);
CREATE INDEX IF NOT EXISTS idx_pessoas_criado_em ON pessoas_atendimento(criado_em);
CREATE INDEX IF NOT EXISTS idx_historico_chamado_em ON historico_chamadas(chamado_em);