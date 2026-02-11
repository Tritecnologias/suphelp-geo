-- Script completo para configurar todas as tabelas necessárias
-- Execute este script no servidor para garantir que todas as funcionalidades funcionem

-- 1. Extensão PostGIS (se não existir)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabela users (já existe, mas vamos garantir que tem todas as colunas)
ALTER TABLE users ADD COLUMN IF NOT EXISTS nome VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS empresa VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS plano VARCHAR(50) DEFAULT 'basico';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS searches_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS searches_limit INTEGER DEFAULT 100;

-- 3. Tabela admins (para gestão de administradores)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 4. Tabela places (completa com PostGIS)
CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    category VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(500),
    rating DECIMAL(2,1),
    user_ratings_total INTEGER,
    google_place_id VARCHAR(255),
    location GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_places_category ON places (category);
CREATE INDEX IF NOT EXISTS idx_places_rating ON places (rating);

-- 6. Tabela site_config (para CMS)
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

-- 7. Inserir admin padrão (se não existir)
INSERT INTO admins (nome, email, password_hash, role, status)
SELECT 'Administrador', 'admin@suphelp.com.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin@suphelp.com.br');

-- 8. Atualizar usuário admin existente para ter role admin
UPDATE users SET role = 'admin' WHERE email = 'admin@suphelp.com.br';

-- 9. Configurações padrão do CMS
INSERT INTO site_config (section, key, value, type) VALUES
('header', 'logo_text', 'SupHelp Geo', 'text'),
('header', 'menu_item_1', 'Recursos', 'text'),
('header', 'menu_item_1_link', '#features', 'text'),
('header', 'menu_item_2', 'Planos', 'text'),
('header', 'menu_item_2_link', '#pricing', 'text'),
('header', 'login_text', 'Login', 'text'),
('header', 'signup_text', 'Começar Grátis', 'text'),
('hero', 'title', 'Encontre Estabelecimentos Próximos em Segundos', 'text'),
('hero', 'subtitle', 'Sistema inteligente de geolocalização para encontrar farmácias, mercados, restaurantes e muito mais próximos a qualquer endereço.', 'textarea'),
('hero', 'button_1_text', 'Começar Agora', 'text'),
('hero', 'button_1_link', '/cadastro', 'text'),
('hero', 'button_2_text', 'Ver Demo', 'text'),
('hero', 'button_2_link', '#demo', 'text'),
('hero', 'stat_1_number', '10.000+', 'text'),
('hero', 'stat_1_text', 'Estabelecimentos', 'text'),
('hero', 'stat_2_number', '50+', 'text'),
('hero', 'stat_2_text', 'Cidades', 'text'),
('hero', 'stat_3_number', '99%', 'text'),
('hero', 'stat_3_text', 'Precisão', 'text'),
('features', 'title', 'Recursos Poderosos', 'text'),
('features', 'subtitle', 'Tudo que você precisa para análise geográfica', 'text'),
('footer', 'company_name', '🗺️ SupHelp Geo', 'text'),
('footer', 'company_description', 'Geolocalização inteligente para seu negócio', 'text'),
('footer', 'copyright', '© 2024 SupHelp Geo. Todos os direitos reservados.', 'text'),
('contact', 'email', 'comercial@suphelp.com.br', 'text'),
('contact', 'button_text', 'Fale Conosco', 'text'),
('contact', 'email_subject', 'Interesse no SupHelp Geo', 'text'),
('contact', 'email_body', 'Olá! Tenho interesse em conhecer mais sobre o SupHelp Geo.', 'textarea')
ON CONFLICT (section, key) DO NOTHING;

-- 10. Verificar se tudo foi criado
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'admins' as tabela, COUNT(*) as registros FROM admins
UNION ALL
SELECT 'places' as tabela, COUNT(*) as registros FROM places
UNION ALL
SELECT 'site_config' as tabela, COUNT(*) as registros FROM site_config;