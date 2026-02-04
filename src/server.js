// backend/src/server.js
const express = require('express');
const { spawn } = require('child_process');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 4000;

// Middleware para processar JSON
app.use(express.json());

// --- Rota 1: Health Check (Ver se está vivo) ---
app.get('/', (req, res) => {
  res.json({ message: 'SupHelp Geo API - Sistema Operacional 🚀' });
});

// --- Rota 2: Disparar Worker de Teste (worker.py) ---
app.post('/api/import-test', (req, res) => {
  console.log('🔄 Iniciando Worker Python de Teste...');

  const pythonProcess = spawn('python3', ['src/worker.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`🐍 Python Output: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`❌ Python Erro: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`🏁 Processo Python finalizado com código ${code}`);
    if (code === 0) {
      res.json({ success: true, message: "Teste de importação concluído." });
    } else {
      res.status(500).json({ success: false, message: "Erro ao rodar script Python." });
    }
  });
});

// --- Rota 3: Importar CSV (worker_csv.py) ---
app.post('/api/import-csv', (req, res) => {
  // Por enquanto o nome do arquivo é fixo, mas no futuro virá do upload do usuário
  const fileName = 'import.csv'; 
  console.log(`📂 Iniciando importação do arquivo: ${fileName}...`);

  // Passamos o nome do arquivo como argumento para o Python
  const pythonProcess = spawn('python3', ['src/worker_csv.py', fileName]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`🐍 CSV Log: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`❌ CSV Erro: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, message: "Importação de CSV finalizada com sucesso." });
    } else {
      res.status(500).json({ success: false, message: "Falha ao processar o CSV." });
    }
  });
});

// --- Rota 4: Consultar Lugares (Verificar Banco) ---
app.get('/api/places', async (req, res) => {
  try {
    // Busca os últimos 50 lugares, convertendo a geometria para GeoJSON
    const result = await pool.query(`
      SELECT id, name, category, address, ST_AsGeoJSON(location) as geojson 
      FROM places 
      ORDER BY id DESC LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dados no banco." });
  }
});

// --- Inicialização do Servidor ---
app.listen(port, () => {
  console.log(`✅ Backend rodando na porta ${port}`);
});
