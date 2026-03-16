// Novo endpoint de login unificado
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Primeiro, tentar como admin
    const adminResult = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      const senhaValida = await bcrypt.compare(senha, admin.senha_hash);

      if (senhaValida) {
        // Atualizar último login
        await pool.query(
          'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [admin.id]
        );

        // Gerar token JWT com flag de admin
        const token = jwt.sign(
          { 
            id: admin.id, 
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            type: 'admin'
          },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        );

        console.log(`✅ Login admin realizado: ${email}`);

        return res.json({
          success: true,
          token,
          user: {
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            type: 'admin'
          }
        });
      }
    }

    // Se não é admin, tentar como usuário comum
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Email ou senha incorretos' 
      });
    }

    const user = userResult.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ 
        error: 'Email ou senha incorretos' 
      });
    }

    // Gerar token JWT para usuário comum
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        plano: user.plano,
        isAdmin: false,
        type: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login usuário realizado: ${email}`);

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
        searches_limit: user.searches_limit,
        isAdmin: false,
        type: 'user'
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});
