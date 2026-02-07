// backend/src/server.js
require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 5000;

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

// --- Rota 4: Importar via Google Places API ---
app.post('/api/import-places-api', (req, res) => {
  const { city, keywords, maxResults } = req.body;
  
  // Validações
  if (!city || !keywords) {
    return res.status(400).json({ 
      success: false, 
      message: "Parâmetros obrigatórios: city, keywords" 
    });
  }

  const cityStr = city;
  const keywordsStr = Array.isArray(keywords) ? keywords.join(',') : keywords;
  const maxResultsStr = maxResults || '50';

  console.log(`🔍 Iniciando busca Places API: ${cityStr} | Keywords: ${keywordsStr}`);

  const pythonProcess = spawn('python3', [
    'src/worker_places_api.py',
    cityStr,
    keywordsStr,
    maxResultsStr
  ]);

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`🐍 Places API: ${output}`);
    outputData += output;
  });

  pythonProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`❌ Places API Erro: ${error}`);
    errorData += error;
  });

  pythonProcess.on('close', (code) => {
    console.log(`🏁 Worker Places API finalizado com código ${code}`);
    
    if (code === 0) {
      try {
        // Tenta extrair JSON do output
        const jsonMatch = outputData.match(/\{.*\}/);
        const stats = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        
        res.json({ 
          success: true, 
          message: "Importação via Places API concluída",
          stats: stats
        });
      } catch (e) {
        res.json({ 
          success: true, 
          message: "Importação concluída (sem estatísticas)" 
        });
      }
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Erro ao executar worker Places API",
        error: errorData
      });
    }
  });
});

// --- Rota 5: Enriquecer Lugares com Telefone/Contatos ---
app.post('/api/enrich-contacts', (req, res) => {
  const { placeIds, limit } = req.body;
  
  let placeIdsStr = 'all';
  let limitStr = '50';
  
  if (placeIds && Array.isArray(placeIds) && placeIds.length > 0) {
    placeIdsStr = placeIds.join(',');
  } else if (placeIds && typeof placeIds === 'string') {
    placeIdsStr = placeIds;
  }
  
  if (limit) {
    limitStr = String(limit);
  }

  console.log(`📞 Iniciando enriquecimento: ${placeIdsStr} | Limit: ${limitStr}`);

  const pythonProcess = spawn('python3', [
    'src/worker_enrich_contacts.py',
    placeIdsStr,
    limitStr
  ]);

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`🐍 Enrich: ${output}`);
    outputData += output;
  });

  pythonProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`❌ Enrich Erro: ${error}`);
    errorData += error;
  });

  pythonProcess.on('close', (code) => {
    console.log(`🏁 Worker Enrich finalizado com código ${code}`);
    
    if (code === 0) {
      try {
        // Tenta extrair JSON do output
        const jsonMatch = outputData.match(/\{.*\}/);
        const stats = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        
        res.json({ 
          success: true, 
          message: "Enriquecimento concluído",
          stats: stats
        });
      } catch (e) {
        res.json({ 
          success: true, 
          message: "Enriquecimento concluído (sem estatísticas)" 
        });
      }
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Erro ao executar worker de enriquecimento",
        error: errorData
      });
    }
  });
});

// --- Rota 6: Geocoding (Converter endereço em coordenadas) ---
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        success: false,
        error: "Parâmetro obrigatório: address" 
      });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false,
        error: "API Key do Google Maps não configurada" 
      });
    }
    
    // Faz requisição para Google Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Endereço não encontrado",
        details: data.status
      });
    }
    
    const location = data.results[0].geometry.location;
    const formattedAddress = data.results[0].formatted_address;
    
    res.json({
      success: true,
      data: {
        lat: location.lat,
        lng: location.lng,
        formatted_address: formattedAddress
      }
    });
  } catch (err) {
    console.error('Erro no geocoding:', err);
    res.status(500).json({ 
      success: false,
      error: "Erro ao geocodificar endereço" 
    });
  }
});

// --- Rota 7: Busca por Raio (Nearby) ---
app.get('/api/places/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, limit = 50 } = req.query;
    
    // Validações
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: "Parâmetros obrigatórios: lat, lng" 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseFloat(radius);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
      return res.status(400).json({ 
        error: "Coordenadas ou raio inválidos" 
      });
    }
    
    // Busca lugares dentro do raio usando ST_DWithin
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        category, 
        address,
        phone,
        website,
        rating,
        user_ratings_total,
        ST_AsGeoJSON(location) as geojson,
        ST_X(location) as lng,
        ST_Y(location) as lat,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
      FROM places 
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance_meters ASC
      LIMIT $4
    `, [longitude, latitude, radiusMeters, parseInt(limit)]);
    
    res.json({
      center: { lat: latitude, lng: longitude },
      radius_meters: radiusMeters,
      total: result.rows.length,
      data: result.rows.map(row => ({
        ...row,
        distance_km: (row.distance_meters / 1000).toFixed(2)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar lugares próximos" });
  }
});

// --- Rota 8: Busca Avançada com Filtros ---
app.get('/api/places/search', async (req, res) => {
  try {
    const { 
      q,           // query de busca (nome ou endereço)
      category,    // categoria
      city,        // cidade
      minRating,   // rating mínimo
      hasPhone,    // tem telefone?
      limit = 50,
      offset = 0
    } = req.query;
    
    let query = `
      SELECT 
        id, 
        name, 
        category, 
        address,
        phone,
        website,
        rating,
        user_ratings_total,
        ST_AsGeoJSON(location) as geojson,
        ST_X(location) as lng,
        ST_Y(location) as lat
      FROM places 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Busca por texto (nome ou endereço)
    if (q) {
      query += ` AND (name ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      params.push(`%${q}%`);
      paramCount++;
    }
    
    // Filtro por categoria
    if (category) {
      query += ` AND category ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }
    
    // Filtro por cidade
    if (city) {
      query += ` AND address ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }
    
    // Filtro por rating mínimo
    if (minRating) {
      query += ` AND rating >= $${paramCount}`;
      params.push(parseFloat(minRating));
      paramCount++;
    }
    
    // Filtro por telefone
    if (hasPhone === 'true') {
      query += ` AND phone IS NOT NULL AND phone != ''`;
    }
    
    query += ` ORDER BY 
      CASE WHEN rating IS NOT NULL THEN rating ELSE 0 END DESC,
      id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Total count
    let countQuery = 'SELECT COUNT(*) as total FROM places WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;
    
    if (q) {
      countQuery += ` AND (name ILIKE $${countParamCount} OR address ILIKE $${countParamCount})`;
      countParams.push(`%${q}%`);
      countParamCount++;
    }
    
    if (category) {
      countQuery += ` AND category ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
      countParamCount++;
    }
    
    if (city) {
      countQuery += ` AND address ILIKE $${countParamCount}`;
      countParams.push(`%${city}%`);
      countParamCount++;
    }
    
    if (minRating) {
      countQuery += ` AND rating >= $${countParamCount}`;
      countParams.push(parseFloat(minRating));
      countParamCount++;
    }
    
    if (hasPhone === 'true') {
      countQuery += ` AND phone IS NOT NULL AND phone != ''`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      filters: { q, category, city, minRating, hasPhone },
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + result.rows.length) < total
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar lugares" });
  }
});

// --- Rota 9: Listar Lugares (com paginação e filtros) ---
app.get('/api/places', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category, city } = req.query;
    
    let query = `
      SELECT 
        id, 
        name, 
        category, 
        address, 
        phone,
        website,
        rating,
        user_ratings_total,
        ST_AsGeoJSON(location) as geojson,
        ST_X(location) as lng,
        ST_Y(location) as lat
      FROM places 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtro por categoria
    if (category) {
      query += ` AND category ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }
    
    // Filtro por cidade
    if (city) {
      query += ` AND address ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }
    
    query += ` ORDER BY id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Total count para paginação
    const countResult = await pool.query('SELECT COUNT(*) as total FROM places');
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + result.rows.length) < total
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dados no banco." });
  }
});

// --- Rota 10: Buscar Lugar por ID ---
app.get('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        category, 
        address,
        google_place_id,
        phone,
        website,
        rating,
        user_ratings_total,
        ST_AsGeoJSON(location) as geojson,
        ST_X(location) as lng,
        ST_Y(location) as lat,
        created_at
      FROM places 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lugar não encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar lugar" });
  }
});

// --- Rota 11: Criar Novo Lugar ---
app.post('/api/places', async (req, res) => {
  try {
    const { name, address, category, lat, lng, phone, website, rating } = req.body;
    
    // Validações
    if (!name || !lat || !lng) {
      return res.status(400).json({ 
        error: "Campos obrigatórios: name, lat, lng" 
      });
    }
    
    // Valida coordenadas
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: "Coordenadas inválidas" 
      });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: "Coordenadas fora do intervalo válido" 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO places (name, address, category, phone, website, rating, location)
      VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
      RETURNING 
        id, 
        name, 
        category, 
        address,
        phone,
        website,
        rating,
        ST_AsGeoJSON(location) as geojson,
        ST_X(location) as lng,
        ST_Y(location) as lat
    `, [name, address || '', category || 'Sem categoria', phone || null, website || null, rating || null, longitude, latitude]);
    
    res.status(201).json({
      success: true,
      message: "Lugar criado com sucesso",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar lugar" });
  }
});

// --- Rota 12: Atualizar Lugar ---
app.put('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, category, lat, lng, phone, website, rating } = req.body;
    
    // Verifica se lugar existe
    const checkResult = await pool.query('SELECT id FROM places WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Lugar não encontrado" });
    }
    
    // Monta query dinâmica
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    
    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      params.push(address);
      paramCount++;
    }
    
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }
    
    if (website !== undefined) {
      updates.push(`website = $${paramCount}`);
      params.push(website);
      paramCount++;
    }
    
    if (rating !== undefined) {
      updates.push(`rating = $${paramCount}`);
      params.push(rating);
      paramCount++;
    }
    
    if (lat !== undefined && lng !== undefined) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        updates.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`);
        params.push(longitude, latitude);
        paramCount += 2;
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    
    params.push(id);
    
    const result = await pool.query(`
      UPDATE places 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, 
        name, 
        category, 
        address,
        phone,
        website,
        rating,
        ST_AsGeoJSON(location) as geojson,
        ST_X(location) as lng,
        ST_Y(location) as lat
    `, params);
    
    res.json({
      success: true,
      message: "Lugar atualizado com sucesso",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar lugar" });
  }
});

// --- Rota 13: Deletar Lugar ---
app.delete('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM places WHERE id = $1 RETURNING id, name', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lugar não encontrado" });
    }
    
    res.json({
      success: true,
      message: `Lugar "${result.rows[0].name}" deletado com sucesso`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar lugar" });
  }
});

// --- Servir Interface Web (depois de todas as rotas da API) ---
app.use(express.static('public'));

// --- Inicialização do Servidor ---
app.listen(port, () => {
  console.log(`✅ Backend rodando na porta ${port}`);
});
