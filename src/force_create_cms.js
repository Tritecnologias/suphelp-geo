// Script para forçar criação da tabela CMS
require('dotenv').config();
const { Pool } = require('pg');

// Configuração direta do banco
const pool = new Pool({
    host: '76.13.173.70',
    user: 'admin',
    password: 'suphelp_secret_pass',
    database: 'suphelp_geo',
    port: 5432,
});

async function forceCreateCMS() {
    let client;
    try {
        console.log('🔗 Conectando ao banco...');
        client = await pool.connect();
        console.log('✅ Conectado com sucesso!');

        // Verifica se a tabela existe
        console.log('🔍 Verificando se tabela site_config existe...');
        const checkTable = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'site_config'
            );
        `);
        
        console.log('Tabela existe?', checkTable.rows[0].exists);

        // Força criação da tabela
        console.log('🚀 Criando/recriando tabela site_config...');
        await client.query(`
            DROP TABLE IF EXISTS site_config;
            
            CREATE TABLE site_config (
                id SERIAL PRIMARY KEY,
                section VARCHAR(50) NOT NULL,
                key VARCHAR(100) NOT NULL,
                value TEXT,
                type VARCHAR(20) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(section, key)
            );
        `);
        console.log('✅ Tabela criada!');

        // Insere dados de teste
        console.log('📝 Inserindo dados de teste...');
        await client.query(`
            INSERT INTO site_config (section, key, value, type) VALUES 
            ('footer', 'company_name', '🗺️ SupHelp Geo', 'text'),
            ('footer', 'company_description', 'Geolocalização inteligente para seu negócio', 'text'),
            ('footer', 'copyright', '© 2024 SupHelp Geo. Todos os direitos reservados.', 'text'),
            ('header', 'logo_text', 'SupHelp Geo', 'text'),
            ('hero', 'title', 'Encontre Estabelecimentos Próximos em Segundos', 'text');
        `);
        console.log('✅ Dados inseridos!');

        // Verifica se funcionou
        const result = await client.query('SELECT COUNT(*) as total FROM site_config');
        console.log(`✅ Total de registros: ${result.rows[0].total}`);

        // Lista alguns registros
        const sample = await client.query('SELECT * FROM site_config LIMIT 5');
        console.log('📋 Amostra dos dados:');
        sample.rows.forEach(row => {
            console.log(`  ${row.section}.${row.key} = "${row.value}"`);
        });

        console.log('🎉 CMS configurado com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        process.exit();
    }
}

forceCreateCMS();