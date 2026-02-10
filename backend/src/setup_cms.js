// Script para criar tabelas do CMS
require('dotenv').config();
const pool = require('./db');

async function setupCMS() {
    try {
        console.log('🚀 Criando tabelas do CMS...');

        // Tabela para configurações gerais do site
        await pool.query(`
            CREATE TABLE IF NOT EXISTS site_config (
                id SERIAL PRIMARY KEY,
                section VARCHAR(50) NOT NULL,
                key VARCHAR(100) NOT NULL,
                value TEXT,
                type VARCHAR(20) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(section, key)
            )
        `);

        console.log('✅ Tabela site_config criada');

        // Inserir dados padrão
        const defaultConfig = [
            // Header
            { section: 'header', key: 'logo_text', value: 'SupHelp Geo', type: 'text' },
            { section: 'header', key: 'logo_image', value: 'images/logo.png', type: 'image' },
            { section: 'header', key: 'menu_item_1', value: 'Recursos', type: 'text' },
            { section: 'header', key: 'menu_item_1_link', value: '#features', type: 'text' },
            { section: 'header', key: 'menu_item_2', value: 'Planos', type: 'text' },
            { section: 'header', key: 'menu_item_2_link', value: '#plans', type: 'text' },
            { section: 'header', key: 'login_text', value: 'Login', type: 'text' },
            { section: 'header', key: 'signup_text', value: 'Começar Grátis', type: 'text' },

            // Hero
            { section: 'hero', key: 'title', value: 'Encontre Estabelecimentos Próximos em Segundos', type: 'text' },
            { section: 'hero', key: 'subtitle', value: 'Sistema inteligente de geolocalização para encontrar farmácias, padarias, mercados e muito mais. Exporte dados em Excel e PDF.', type: 'textarea' },
            { section: 'hero', key: 'button_1_text', value: 'Começar Agora', type: 'text' },
            { section: 'hero', key: 'button_1_link', value: 'cadastro.html', type: 'text' },
            { section: 'hero', key: 'button_2_text', value: 'Ver Demo', type: 'text' },
            { section: 'hero', key: 'button_2_link', value: '#demo', type: 'text' },
            { section: 'hero', key: 'stat_1_number', value: '10.000+', type: 'text' },
            { section: 'hero', key: 'stat_1_text', value: 'Estabelecimentos', type: 'text' },
            { section: 'hero', key: 'stat_2_number', value: '500+', type: 'text' },
            { section: 'hero', key: 'stat_2_text', value: 'Clientes Ativos', type: 'text' },
            { section: 'hero', key: 'stat_3_number', value: '99.9%', type: 'text' },
            { section: 'hero', key: 'stat_3_text', value: 'Uptime', type: 'text' },

            // Features
            { section: 'features', key: 'title', value: 'Recursos Poderosos', type: 'text' },
            { section: 'features', key: 'subtitle', value: 'Tudo que você precisa para análise geográfica', type: 'text' },
            
            // Feature Cards
            { section: 'features', key: 'card_1_icon', value: '📍', type: 'text' },
            { section: 'features', key: 'card_1_title', value: 'Busca por Endereço', type: 'text' },
            { section: 'features', key: 'card_1_text', value: 'Digite qualquer endereço e encontre estabelecimentos próximos automaticamente', type: 'textarea' },
            
            { section: 'features', key: 'card_2_icon', value: '📊', type: 'text' },
            { section: 'features', key: 'card_2_title', value: 'Exportação Excel', type: 'text' },
            { section: 'features', key: 'card_2_text', value: 'Exporte todos os dados em formato CSV compatível com Excel e Google Sheets', type: 'textarea' },
            
            { section: 'features', key: 'card_3_icon', value: '📄', type: 'text' },
            { section: 'features', key: 'card_3_title', value: 'Relatórios PDF', type: 'text' },
            { section: 'features', key: 'card_3_text', value: 'Gere relatórios profissionais em PDF prontos para impressão', type: 'textarea' },
            
            { section: 'features', key: 'card_4_icon', value: '🎯', type: 'text' },
            { section: 'features', key: 'card_4_title', value: 'Busca por Raio', type: 'text' },
            { section: 'features', key: 'card_4_text', value: 'Defina o raio de busca em metros e encontre tudo ao redor', type: 'textarea' },
            
            { section: 'features', key: 'card_5_icon', value: '📞', type: 'text' },
            { section: 'features', key: 'card_5_title', value: 'Dados Completos', type: 'text' },
            { section: 'features', key: 'card_5_text', value: 'Telefone, endereço, avaliações e muito mais', type: 'textarea' },
            
            { section: 'features', key: 'card_6_icon', value: '⚡', type: 'text' },
            { section: 'features', key: 'card_6_title', value: 'Resultados Rápidos', type: 'text' },
            { section: 'features', key: 'card_6_text', value: 'Busca instantânea com tecnologia PostGIS', type: 'textarea' },

            // Demo
            { section: 'demo', key: 'title', value: 'Veja Como Funciona', type: 'text' },
            { section: 'demo', key: 'step_1_title', value: 'Digite o Endereço', type: 'text' },
            { section: 'demo', key: 'step_1_text', value: 'Informe o endereço ou local que deseja buscar', type: 'text' },
            { section: 'demo', key: 'step_2_title', value: 'Defina o Raio', type: 'text' },
            { section: 'demo', key: 'step_2_text', value: 'Escolha a distância em metros (ex: 5km)', type: 'text' },
            { section: 'demo', key: 'step_3_title', value: 'Visualize e Exporte', type: 'text' },
            { section: 'demo', key: 'step_3_text', value: 'Veja os resultados e exporte para Excel ou PDF', type: 'text' },

            // Plans
            { section: 'plans', key: 'title', value: 'Escolha Seu Plano', type: 'text' },
            { section: 'plans', key: 'subtitle', value: 'Planos flexíveis para todas as necessidades', type: 'text' },
            
            // Plano Básico
            { section: 'plans', key: 'plan_1_name', value: 'Básico', type: 'text' },
            { section: 'plans', key: 'plan_1_price', value: '49', type: 'number' },
            { section: 'plans', key: 'plan_1_features', value: '✅ 100 buscas por mês\n✅ Exportação Excel\n✅ Exportação PDF\n✅ Suporte por email\n❌ API Access\n❌ Relatórios personalizados', type: 'textarea' },
            
            // Plano Profissional
            { section: 'plans', key: 'plan_2_name', value: 'Profissional', type: 'text' },
            { section: 'plans', key: 'plan_2_price', value: '149', type: 'number' },
            { section: 'plans', key: 'plan_2_badge', value: 'Mais Popular', type: 'text' },
            { section: 'plans', key: 'plan_2_features', value: '✅ 1.000 buscas por mês\n✅ Exportação Excel\n✅ Exportação PDF\n✅ Suporte prioritário\n✅ API Access\n✅ Relatórios personalizados', type: 'textarea' },
            
            // Plano Enterprise
            { section: 'plans', key: 'plan_3_name', value: 'Enterprise', type: 'text' },
            { section: 'plans', key: 'plan_3_price', value: '499', type: 'number' },
            { section: 'plans', key: 'plan_3_features', value: '✅ Buscas ilimitadas\n✅ Exportação Excel\n✅ Exportação PDF\n✅ Suporte 24/7\n✅ API Access completo\n✅ Relatórios personalizados\n✅ Integração customizada\n✅ Treinamento dedicado', type: 'textarea' },

            // CTA
            { section: 'cta', key: 'title', value: 'Pronto para Começar?', type: 'text' },
            { section: 'cta', key: 'subtitle', value: 'Crie sua conta gratuitamente e teste por 7 dias', type: 'text' },
            { section: 'cta', key: 'button_text', value: 'Criar Conta Grátis', type: 'text' },

            // Footer
            { section: 'footer', key: 'company_name', value: '🗺️ SupHelp Geo', type: 'text' },
            { section: 'footer', key: 'company_description', value: 'Geolocalização inteligente para seu negócio', type: 'text' },
            { section: 'footer', key: 'copyright', value: '© 2024 SupHelp Geo. Todos os direitos reservados.', type: 'text' }
        ];

        for (const config of defaultConfig) {
            await pool.query(`
                INSERT INTO site_config (section, key, value, type) 
                VALUES ($1, $2, $3, $4) 
                ON CONFLICT (section, key) DO NOTHING
            `, [config.section, config.key, config.value, config.type]);
        }

        console.log('✅ Dados padrão inseridos');
        console.log('🎉 CMS configurado com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao configurar CMS:', error);
    } finally {
        process.exit();
    }
}

setupCMS();