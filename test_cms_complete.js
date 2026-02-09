// Teste completo do CMS
require('dotenv').config();
const { Pool } = require('pg');
const serveDynamicPage = require('./src/dynamic_page');

const pool = new Pool({
    host: '76.13.173.70',
    user: 'admin',
    password: 'suphelp_secret_pass',
    database: 'suphelp_geo',
    port: 5432,
});

async function testCMS() {
    try {
        console.log('🧪 Testando CMS completo...');
        
        // 1. Verifica se a tabela existe
        console.log('\n1️⃣ Verificando tabela...');
        const tableCheck = await pool.query(`
            SELECT COUNT(*) as total FROM site_config
        `);
        console.log(`✅ Tabela existe com ${tableCheck.rows[0].total} registros`);
        
        // 2. Insere dados de teste para todas as seções
        console.log('\n2️⃣ Inserindo dados de teste...');
        const testData = [
            // Header
            ['header', 'logo_text', 'SupHelp Geo TESTE'],
            ['header', 'menu_item_1', 'Recursos TESTE'],
            ['header', 'menu_item_2', 'Planos TESTE'],
            
            // Hero
            ['hero', 'title', 'TÍTULO TESTE - Encontre Estabelecimentos'],
            ['hero', 'subtitle', 'SUBTÍTULO TESTE - Sistema inteligente'],
            ['hero', 'button_1_text', 'BOTÃO TESTE'],
            
            // Features
            ['features', 'title', 'RECURSOS TESTE'],
            ['features', 'card_1_title', 'CARD 1 TESTE'],
            ['features', 'card_1_text', 'Descrição do card 1 teste'],
            
            // Demo
            ['demo', 'title', 'DEMO TESTE'],
            ['demo', 'step_1_title', 'PASSO 1 TESTE'],
            
            // Plans
            ['plans', 'title', 'PLANOS TESTE'],
            ['plans', 'plan_1_name', 'BÁSICO TESTE'],
            ['plans', 'plan_1_price', '99'],
            
            // CTA
            ['cta', 'title', 'CTA TESTE'],
            ['cta', 'button_text', 'BOTÃO CTA TESTE'],
            
            // Footer
            ['footer', 'company_name', '🗺️ SupHelp Geo TESTE'],
            ['footer', 'company_description', 'DESCRIÇÃO TESTE'],
        ];
        
        for (const [section, key, value] of testData) {
            await pool.query(`
                INSERT INTO site_config (section, key, value, type) 
                VALUES ($1, $2, $3, 'text')
                ON CONFLICT (section, key) 
                DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP
            `, [section, key, value]);
        }
        console.log(`✅ ${testData.length} configurações inseridas`);
        
        // 3. Lista todas as configurações
        console.log('\n3️⃣ Configurações atuais:');
        const allConfigs = await pool.query('SELECT * FROM site_config ORDER BY section, key');
        allConfigs.rows.forEach(row => {
            console.log(`  ${row.section}.${row.key} = "${row.value}"`);
        });
        
        // 4. Testa o módulo dynamic_page
        console.log('\n4️⃣ Testando módulo dynamic_page...');
        const mockReq = {};
        const mockRes = {
            send: (html) => {
                console.log('✅ HTML gerado com sucesso!');
                
                // Verifica se as substituições estão funcionando
                const checks = [
                    { text: 'SupHelp Geo TESTE', section: 'Header' },
                    { text: 'TÍTULO TESTE', section: 'Hero' },
                    { text: 'RECURSOS TESTE', section: 'Features' },
                    { text: 'DEMO TESTE', section: 'Demo' },
                    { text: 'PLANOS TESTE', section: 'Plans' },
                    { text: 'CTA TESTE', section: 'CTA' },
                    { text: 'SupHelp Geo TESTE', section: 'Footer' }
                ];
                
                console.log('\n🔍 Verificando substituições:');
                checks.forEach(check => {
                    if (html.includes(check.text)) {
                        console.log(`  ✅ ${check.section}: "${check.text}" encontrado`);
                    } else {
                        console.log(`  ❌ ${check.section}: "${check.text}" NÃO encontrado`);
                    }
                });
                
                // Salva HTML para inspeção
                const fs = require('fs');
                fs.writeFileSync('test_output.html', html);
                console.log('\n📄 HTML salvo em test_output.html para inspeção');
            },
            sendFile: (path) => {
                console.log('⚠️ Fallback para arquivo estático:', path);
            }
        };
        
        await serveDynamicPage(pool, mockReq, mockRes);
        
        console.log('\n🎉 Teste completo finalizado!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await pool.end();
    }
}

testCMS();