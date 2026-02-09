// Função para servir página principal com conteúdo dinâmico
const fs = require('fs');
const path = require('path');

async function serveDynamicPage(pool, req, res) {
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
    let html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    
    // === HEADER ===
    if (config.header) {
      html = html.replace(/SupHelp Geo<\/span>/g, `${config.header.logo_text || 'SupHelp Geo'}</span>`);
      html = html.replace(/href="#features">Recursos<\/a>/g, `href="${config.header.menu_item_1_link || '#features'}">${config.header.menu_item_1 || 'Recursos'}</a>`);
      html = html.replace(/href="#plans">Planos<\/a>/g, `href="${config.header.menu_item_2_link || '#plans'}">${config.header.menu_item_2 || 'Planos'}</a>`);
      html = html.replace(/href="login.html">Login<\/a>/g, `href="login.html">${config.header.login_text || 'Login'}</a>`);
      html = html.replace(/href="cadastro.html" class="btn-primary">Começar Grátis<\/a>/g, `href="cadastro.html" class="btn-primary">${config.header.signup_text || 'Começar Grátis'}</a>`);
    }
    
    // === HERO ===
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
    
    // === FEATURES ===
    if (config.features) {
      html = html.replace(/Recursos Poderosos<\/h2>/g, `${config.features.title || 'Recursos Poderosos'}</h2>`);
      html = html.replace(/Tudo que você precisa para análise geográfica<\/p>/g, `${config.features.subtitle || 'Tudo que você precisa para análise geográfica'}</p>`);
      
      // Cards de recursos - substituição mais específica
      const featureReplacements = [
        { icon: '📍', title: 'Busca por Endereço', text: 'Digite qualquer endereço e encontre estabelecimentos próximos automaticamente' },
        { icon: '📊', title: 'Exportação Excel', text: 'Exporte todos os dados em formato CSV compatível com Excel e Google Sheets' },
        { icon: '📄', title: 'Relatórios PDF', text: 'Gere relatórios profissionais em PDF prontos para impressão' },
        { icon: '🎯', title: 'Busca por Raio', text: 'Defina o raio de busca em metros e encontre tudo ao redor' },
        { icon: '📞', title: 'Dados Completos', text: 'Telefone, endereço, avaliações e muito mais' },
        { icon: '⚡', title: 'Resultados Rápidos', text: 'Busca instantânea com tecnologia PostGIS' }
      ];
      
      for (let i = 1; i <= 6; i++) {
        const defaultCard = featureReplacements[i-1];
        const icon = config.features[`card_${i}_icon`] || defaultCard.icon;
        const title = config.features[`card_${i}_title`] || defaultCard.title;
        const text = config.features[`card_${i}_text`] || defaultCard.text;
        
        // Substitui de forma mais específica usando regex
        html = html.replace(
          new RegExp(`<div class="feature-icon">${defaultCard.icon}</div>\\s*<h3>${defaultCard.title}</h3>\\s*<p>${defaultCard.text}</p>`, 'g'),
          `<div class="feature-icon">${icon}</div>\n                    <h3>${title}</h3>\n                    <p>${text}</p>`
        );
      }
    }
    
    // === DEMO ===
    if (config.demo) {
      html = html.replace(/Veja Como Funciona<\/h2>/g, `${config.demo.title || 'Veja Como Funciona'}</h2>`);
      
      // Passos do demo
      const demoReplacements = [
        { title: 'Digite o Endereço', text: 'Informe o endereço ou local que deseja buscar' },
        { title: 'Defina o Raio', text: 'Escolha a distância em metros \\(ex: 5km\\)' },
        { title: 'Visualize e Exporte', text: 'Veja os resultados e exporte para Excel ou PDF' }
      ];
      
      for (let i = 1; i <= 3; i++) {
        const defaultStep = demoReplacements[i-1];
        const title = config.demo[`step_${i}_title`] || defaultStep.title;
        const text = config.demo[`step_${i}_text`] || defaultStep.text;
        
        html = html.replace(new RegExp(`<h3>${defaultStep.title}</h3>`), `<h3>${title}</h3>`);
        html = html.replace(new RegExp(`<p>${defaultStep.text}</p>`), `<p>${text}</p>`);
      }
    }
    
    // === PLANS ===
    if (config.plans) {
      html = html.replace(/Escolha Seu Plano<\/h2>/g, `${config.plans.title || 'Escolha Seu Plano'}</h2>`);
      html = html.replace(/Planos flexíveis para todas as necessidades<\/p>/g, `${config.plans.subtitle || 'Planos flexíveis para todas as necessidades'}</p>`);
      
      // Planos
      const defaultPlans = [
        { name: 'Básico', price: '49' },
        { name: 'Profissional', price: '149' },
        { name: 'Enterprise', price: '499' }
      ];
      
      for (let i = 1; i <= 3; i++) {
        const defaultPlan = defaultPlans[i-1];
        const name = config.plans[`plan_${i}_name`] || defaultPlan.name;
        const price = config.plans[`plan_${i}_price`] || defaultPlan.price;
        
        // Substitui nome do plano
        html = html.replace(new RegExp(`<h3>${defaultPlan.name}</h3>`), `<h3>${name}</h3>`);
        // Substitui preço
        html = html.replace(new RegExp(`<span class="amount">${defaultPlan.price}</span>`), `<span class="amount">${price}</span>`);
      }
      
      // Badge do plano 2
      if (config.plans.plan_2_badge) {
        html = html.replace(/Mais Popular<\/div>/g, `${config.plans.plan_2_badge}</div>`);
      }
    }
    
    // === CTA ===
    if (config.cta) {
      html = html.replace(/Pronto para Começar\?<\/h2>/g, `${config.cta.title || 'Pronto para Começar?'}</h2>`);
      html = html.replace(/Crie sua conta gratuitamente e teste por 7 dias<\/p>/g, `${config.cta.subtitle || 'Crie sua conta gratuitamente e teste por 7 dias'}</p>`);
      html = html.replace(/href="cadastro.html" class="btn-cta">Criar Conta Grátis<\/a>/g, `href="cadastro.html" class="btn-cta">${config.cta.button_text || 'Criar Conta Grátis'}</a>`);
    }
    
    // === FOOTER ===
    if (config.footer) {
      html = html.replace(/<h3>🗺️ SupHelp Geo<\/h3>/g, `<h3>${config.footer.company_name || '🗺️ SupHelp Geo'}</h3>`);
      html = html.replace(/Geolocalização inteligente para seu negócio<\/p>/g, `${config.footer.company_description || 'Geolocalização inteligente para seu negócio'}</p>`);
      html = html.replace(/&copy; 2024 SupHelp Geo\. Todos os direitos reservados\.<\/p>/g, `${config.footer.copyright || '© 2024 SupHelp Geo. Todos os direitos reservados.'}</p>`);
    }
    
    res.send(html);
  } catch (err) {
    console.error('Erro ao carregar página principal:', err);
    // Se der erro, serve o arquivo estático
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
}

module.exports = serveDynamicPage;