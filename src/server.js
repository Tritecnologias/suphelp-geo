// backend/src/server.js
require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const https = require('https');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware para processar JSON
app.use(express.json());

// --- Rota 1: Health Check (API) ---
app.get('/api/health', (req, res) => {
  res.json({ message: 'SupHelp Geo API - Sistema Operacional 🚀' });
});

// --- Middleware de Autenticação ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// --- Rota 2: Registro de Usuário ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, telefone, empresa, plano } = req.body;

    // Validações
    if (!nome || !email || !senha || !plano) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, email, senha, plano' 
      });
    }

    // Verifica se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Email já cadastrado' 
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Define limites por plano
    const limits = {
      'basico': 100,
      'profissional': 1000,
      'enterprise': 999999
    };

    // Insere usuário
    const result = await pool.query(`
      INSERT INTO users (nome, email, senha_hash, telefone, empresa, plano, searches_limit, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id, nome, email, telefone, empresa, plano, status, created_at
    `, [nome, email, senhaHash, telefone || null, empresa || null, plano, limits[plano] || 100]);

    const user = result.rows[0];

    console.log(`✅ Novo usuário cadastrado: ${email} - Plano: ${plano}`);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        plano: user.plano,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

// --- Rota 3: Login ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Busca usuário
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Email ou senha incorretos' 
      });
    }

    const user = result.rows[0];

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ 
        error: 'Email ou senha incorretos' 
      });
    }

    // Gera token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        plano: user.plano 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login realizado: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        plano: user.plano,
        status: user.status,
        searches_used: user.searches_used,
        searches_limit: user.searches_limit
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// --- Rota 4: Perfil do Usuário (Protegida) ---
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, telefone, empresa, plano, status, searches_used, searches_limit, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// --- Rota 5: Disparar Worker de Teste (worker.py) ---
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
app.get('/api/geocode', (req, res) => {
  console.log('🗺️ Requisição de geocoding recebida:', req.query);
  
  try {
    const { address } = req.query;
    
    if (!address) {
      console.log('❌ Endereço não fornecido');
      return res.status(400).json({ 
        success: false,
        error: "Parâmetro obrigatório: address" 
      });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.log('❌ API Key não configurada');
      return res.status(500).json({ 
        success: false,
        error: "API Key do Google Maps não configurada" 
      });
    }
    
    console.log('🔍 Geocodificando:', address);
    
    // Faz requisição para Google Geocoding API usando https nativo
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    https.get(url, (apiResponse) => {
      let data = '';
      
      apiResponse.on('data', (chunk) => {
        data += chunk;
      });
      
      apiResponse.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          console.log('📍 Status do Google:', jsonData.status);
          
          if (jsonData.status !== 'OK' || !jsonData.results || jsonData.results.length === 0) {
            console.log('❌ Endereço não encontrado:', jsonData.status);
            return res.status(404).json({ 
              success: false,
              error: "Endereço não encontrado",
              details: jsonData.status
            });
          }
          
          const location = jsonData.results[0].geometry.location;
          const formattedAddress = jsonData.results[0].formatted_address;
          
          console.log('✅ Geocoding bem-sucedido:', location);
          
          res.json({
            success: true,
            data: {
              lat: location.lat,
              lng: location.lng,
              formatted_address: formattedAddress
            }
          });
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta do Google:', parseError);
          res.status(500).json({ 
            success: false,
            error: "Erro ao processar resposta da API de geocoding" 
          });
        }
      });
    }).on('error', (err) => {
      console.error('❌ Erro na requisição ao Google:', err);
      res.status(500).json({ 
        success: false,
        error: "Erro ao conectar com API de geocoding" 
      });
    });
  } catch (err) {
    console.error('❌ Erro no geocoding:', err);
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

// --- Rota 14: CMS - Obter configurações do site ---
app.get('/api/cms/config', async (req, res) => {
  try {
    const { section } = req.query;
    
    let query = 'SELECT section, key, value, type FROM site_config';
    const params = [];
    
    if (section) {
      query += ' WHERE section = $1';
      params.push(section);
    }
    
    query += ' ORDER BY section, key';
    
    const result = await pool.query(query, params);
    
    // Organiza por seção
    const config = {};
    result.rows.forEach(row => {
      if (!config[row.section]) {
        config[row.section] = {};
      }
      config[row.section][row.key] = {
        value: row.value,
        type: row.type
      };
    });
    
    res.json({ success: true, data: config });
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: "Erro ao buscar configurações" });
  }
});

// --- Rota 15: CMS - Atualizar configuração ---
app.put('/api/cms/config', async (req, res) => {
  console.log('🎨 CMS: Recebida requisição de atualização:', req.body);
  
  try {
    const { section, key, value, type = 'text' } = req.body;
    
    if (!section || !key) {
      console.log('❌ CMS: Seção ou chave não fornecida');
      return res.status(400).json({ error: "Seção e chave são obrigatórias" });
    }
    
    console.log(`🔄 CMS: Atualizando ${section}.${key} = "${value}"`);
    
    const result = await pool.query(`
      INSERT INTO site_config (section, key, value, type, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (section, key) 
      DO UPDATE SET value = $3, type = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [section, key, value, type]);
    
    console.log('✅ CMS: Configuração atualizada:', result.rows[0]);
    res.json({ success: true, message: "Configuração atualizada", data: result.rows[0] });
  } catch (err) {
    console.error('❌ CMS: Erro ao atualizar configuração:', err);
    res.status(500).json({ error: "Erro ao atualizar configuração: " + err.message });
  }
});

// --- Rota 16: CMS - Atualizar múltiplas configurações ---
app.put('/api/cms/config/bulk', async (req, res) => {
  console.log('🎨 CMS: Recebida requisição bulk:', req.body);
  
  try {
    const { configs } = req.body;
    
    if (!configs || !Array.isArray(configs)) {
      console.log('❌ CMS: Configurações inválidas');
      return res.status(400).json({ error: "Configurações inválidas" });
    }
    
    console.log(`🔄 CMS: Processando ${configs.length} configurações`);
    
    const client = await pool.connect();
    const results = [];
    
    try {
      await client.query('BEGIN');
      
      for (const config of configs) {
        const { section, key, value, type = 'text' } = config;
        
        if (section && key) {
          console.log(`📝 CMS: Salvando ${section}.${key} = "${value}"`);
          
          const result = await client.query(`
            INSERT INTO site_config (section, key, value, type, updated_at) 
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (section, key) 
            DO UPDATE SET value = $3, type = $4, updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `, [section, key, value, type]);
          
          results.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ CMS: ${results.length} configurações salvas com sucesso`);
      res.json({ success: true, message: "Configurações atualizadas", data: results });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ CMS: Erro ao atualizar configurações:', err);
    res.status(500).json({ error: "Erro ao atualizar configurações: " + err.message });
  }
});

// --- Rota 17: Servir página principal com conteúdo dinâmico ---
app.get('/', async (req, res) => {
  try {
    // Busca todas as configurações do CMS
    const result = await pool.query('SELECT section, key, value FROM site_config ORDER BY section, key');
    
    // Organiza por seção
    const config = {};
    result.rows.forEach(row => {
      if (!config[row.section]) {
        config[row.section] = {};
      }
      config[row.section][row.key] = row.value;
    });
    
    // Lê o template HTML
    const fs = require('fs');
    const path = require('path');
    let html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    
    // Substitui placeholders pelos valores do banco
    // Header
    if (config.header) {
      html = html.replace(/SupHelp Geo<\/span>/g, `${config.header.logo_text || 'SupHelp Geo'}</span>`);
      html = html.replace(/href="#features">Recursos<\/a>/g, `href="${config.header.menu_item_1_link || '#features'}">${config.header.menu_item_1 || 'Recursos'}</a>`);
      html = html.replace(/href="#plans">Planos<\/a>/g, `href="${config.header.menu_item_2_link || '#plans'}">${config.header.menu_item_2 || 'Planos'}</a>`);
      html = html.replace(/href="login.html">Login<\/a>/g, `href="login.html">${config.header.login_text || 'Login'}</a>`);
      html = html.replace(/href="cadastro.html" class="btn-primary">Começar Grátis<\/a>/g, `href="cadastro.html" class="btn-primary">${config.header.signup_text || 'Começar Grátis'}</a>`);
    }
    
    // Hero
    if (config.hero) {
      html = html.replace(/Encontre Estabelecimentos Próximos em Segundos<\/h1>/g, `${config.hero.title || 'Encontre Estabelecimentos Próximos em Segundos'}</h1>`);
      html = html.replace(/Sistema inteligente de geolocalização[^<]+<\/p>/g, `${config.hero.subtitle || 'Sistema inteligente de geolocalização para encontrar farmácias, padarias, mercados e muito mais. Exporte dados em Excel e PDF.'}</p>`);
      html = html.replace(/href="cadastro.html" class="btn-hero">Começar Agora<\/a>/g, `href="${config.hero.button_1_link || 'cadastro.html'}" class="btn-hero">${config.hero.button_1_text || 'Começar Agora'}</a>`);
      html = html.replace(/href="#demo" class="btn-secondary">Ver Demo<\/a>/g, `href="${config.hero.button_2_link || '#demo'}" class="btn-secondary">${config.hero.button_2_text || 'Ver Demo'}</a>`);
      
      // Estatísticas
      html = html.replace(/<h3>10\.000\+<\/h3>/g, `<h3>${config.hero.stat_1_number || '10.000+'}</h3>`);
      html = html.replace(/<p>Estabelecimentos<\/p>/g, `<p>${config.hero.stat_1_text || 'Estabelecimentos'}</p>`);
      html = html.replace(/<h3>500\+<\/h3>/g, `<h3>${config.hero.stat_2_number || '500+'}</h3>`);
      html = html.replace(/<p>Clientes Ativos<\/p>/g, `<p>${config.hero.stat_2_text || 'Clientes Ativos'}</p>`);
      html = html.replace(/<h3>99\.9%<\/h3>/g, `<h3>${config.hero.stat_3_number || '99.9%'}</h3>`);
      html = html.replace(/<p>Uptime<\/p>/g, `<p>${config.hero.stat_3_text || 'Uptime'}</p>`);
    }
    
    // Footer
    if (config.footer) {
      html = html.replace(/<h3>🗺️ SupHelp Geo<\/h3>/g, `<h3>${config.footer.company_name || '🗺️ SupHelp Geo'}</h3>`);
      html = html.replace(/Geolocalização inteligente para seu negócio<\/p>/g, `${config.footer.company_description || 'Geolocalização inteligente para seu negócio'}</p>`);
      html = html.replace(/&copy; 2024 SupHelp Geo\. Todos os direitos reservados\.<\/p>/g, `${config.footer.copyright || '© 2024 SupHelp Geo. Todos os direitos reservados.'}</p>`);
    }
    
    res.send(html);
  } catch (err) {
    console.error('Erro ao carregar página principal:', err);
    // Se der erro, serve o arquivo estático
    const fs = require('fs');
    const path = require('path');
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// --- Servir outros arquivos estáticos ---
app.use(express.static('public', { index: false }));

// --- Inicialização do Servidor ---
app.listen(port, () => {
  console.log(`✅ Backend rodando na porta ${port}`);
});
