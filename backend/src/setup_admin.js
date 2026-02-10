// Script para configurar sistema de administradores
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: '76.13.173.70',
    user: 'admin',
    password: 'suphelp_secret_pass',
    database: 'suphelp_geo',
    port: 5432,
});

async function setupAdmin() {
    let client;
    try {
        console.log('🔗 Conectando ao banco...');
        client = await pool.connect();
        console.log('✅ Conectado com sucesso!');

        // Cria tabela de administradores
        console.log('🚀 Criando tabela de administradores...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
        `);
        console.log('✅ Tabela admins criada!');

        // Verifica se já existe o admin principal
        const existingAdmin = await client.query(
            'SELECT id FROM admins WHERE email = $1',
            ['wanderson.martins.silva@gmail.com']
        );

        if (existingAdmin.rows.length === 0) {
            // Cria hash da senha
            const senhaHash = await bcrypt.hash('Flavinha@2022', 10);

            // Insere admin principal
            await client.query(`
                INSERT INTO admins (nome, email, senha_hash, role, status)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                'Wanderson Martins Silva',
                'wanderson.martins.silva@gmail.com',
                senhaHash,
                'super_admin',
                'active'
            ]);
            console.log('✅ Admin principal criado: wanderson.martins.silva@gmail.com');
        } else {
            console.log('ℹ️ Admin principal já existe');
        }

        // Lista admins
        const admins = await client.query('SELECT id, nome, email, role, status, created_at FROM admins');
        console.log('\n📋 Administradores cadastrados:');
        admins.rows.forEach(admin => {
            console.log(`  ${admin.id}: ${admin.nome} (${admin.email}) - ${admin.role} - ${admin.status}`);
        });

        console.log('\n🎉 Sistema de administradores configurado!');
        console.log('\n🔑 Credenciais do admin principal:');
        console.log('   Email: wanderson.martins.silva@gmail.com');
        console.log('   Senha: Flavinha@2022');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        process.exit();
    }
}

setupAdmin();