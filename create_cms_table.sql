-- Script SQL para criar tabela CMS manualmente
CREATE TABLE IF NOT EXISTS site_config (
    id SERIAL PRIMARY KEY,
    section VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section, key)
);

-- Inserir dados padrão do Footer para teste
INSERT INTO site_config (section, key, value, type) VALUES 
('footer', 'company_name', '🗺️ SupHelp Geo', 'text'),
('footer', 'company_description', 'Geolocalização inteligente para seu negócio', 'text'),
('footer', 'copyright', '© 2024 SupHelp Geo. Todos os direitos reservados.', 'text')
ON CONFLICT (section, key) DO NOTHING;

-- Verificar se foi criado
SELECT * FROM site_config WHERE section = 'footer';