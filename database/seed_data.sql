-- Dados iniciais para o sistema de senhas do Procon

-- Inserir balcões
INSERT INTO balcoes (nome) VALUES 
('Balcão 1'), 
('Balcão 2'), 
('Balcão 3'), 
('Balcão 4'), 
('Balcão 5'), 
('Balcão 6')
ON CONFLICT DO NOTHING;

-- Inserir assuntos
INSERT INTO assuntos (descricao) VALUES 
('Reclamação'), 
('Informação'), 
('Denúncia'), 
('Solicitação'), 
('Orientação'), 
('Outros')
ON CONFLICT DO NOTHING;