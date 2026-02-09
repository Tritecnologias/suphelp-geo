// Admin Panel JavaScript - Fixed Version
const API_URL = window.location.origin;
let currentPage = 1;
let searchResults = [];
let cmsData = {};
let currentCMSSection = 'header';
let adminToken = null;
let adminData = null;

// Inicialização
window.onload = () => {
    checkAdminAuth();
};

// Verificação de autenticação
function checkAdminAuth() {
    adminToken = localStorage.getItem('adminToken');
    adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    if (!adminToken) {
        window.location.href = '/admin-login.html';
        return;
    }
    
    // Verifica se token é válido
    fetch(`${API_URL}/api/admin/profile`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        return response.json();
    })
    .then(data => {
        adminData = data;
        localStorage.setItem('adminData', JSON.stringify(data));
        initializeAdmin();
    })
    .catch(error => {
        console.error('Erro de autenticação:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin-login.html';
    });
}

function initializeAdmin() {
    // Atualiza interface com dados do admin
    const adminInfo = document.getElementById('admin-info');
    if (adminInfo) {
        adminInfo.innerHTML = `
            <div class="admin-profile">
                <span>👤 ${adminData.nome}</span>
                <span class="admin-role">${adminData.role}</span>
                <button onclick="logout()" class="btn-logout">Sair</button>
            </div>
        `;
    }
    
    loadDashboard();
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin-login.html';
}

// Função para fazer requisições autenticadas
async function authenticatedFetch(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    return fetch(url, { ...options, headers: defaultOptions.headers });
}

// Navegação
function showSection(sectionId) {
    // Esconde todas as seções
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    // Mostra seção selecionada
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');
    
    // Atualiza título
    const titles = {
        dashboard: 'Dashboard',
        places: 'Gerenciar Lugares',
        search: 'Buscar por Raio',
        cms: 'Editor do Site',
        admins: 'Gerenciar Administradores',
        import: 'Importar Dados',
        enrich: 'Enriquecer Contatos',
        settings: 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    // Carrega dados da seção
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'places') loadPlaces();
    if (sectionId === 'cms') loadCMS();
    if (sectionId === 'admins') loadAdmins();
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/places?limit=1000`);
        const data = await response.json();
        
        const places = data.data;
        const total = places.length;
        const withPhone = places.filter(p => p.phone).length;
        const withRating = places.filter(p => p.rating).length;
        const categories = [...new Set(places.map(p => p.category))].length;
        
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-phone').textContent = withPhone;
        document.getElementById('stat-rating').textContent = withRating;
        document.getElementById('stat-categories').textContent = categories;
        
        // Últimos lugares
        const tbody = document.querySelector('#recent-places tbody');
        tbody.innerHTML = '';
        places.slice(0, 10).forEach(place => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${place.id}</td>
                <td><strong>${place.name}</strong></td>
                <td><span class="badge info">${place.category || 'Sem categoria'}</span></td>
                <td>${place.phone || '-'}</td>
                <td>${place.rating ? place.rating + ' ⭐' : '-'}</td>
            `;
        });
        
        // Carrega categorias para filtro
        loadCategories(places);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function loadCategories(places) {
    const categories = [...new Set(places.map(p => p.category).filter(c => c))];
    const select = document.getElementById('filter-category');
    if (select) {
        select.innerHTML = '<option value="">Todas categorias</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    }
}

// CMS Functions
async function loadCMS() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/cms/config`);
        const data = await response.json();
        
        if (data.success) {
            cmsData = data.data;
            loadCMSSection('header');
        }
    } catch (error) {
        console.error('Erro ao carregar CMS:', error);
        alert('Erro ao carregar CMS. Verifique se o banco foi configurado.');
    }
}

function loadCMSSection(section) {
    console.log('Carregando seção CMS:', section);
    currentCMSSection = section;
    
    // Atualiza tabs
    document.querySelectorAll('.cms-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === section) {
            tab.classList.add('active');
        }
    });
    
    const container = document.getElementById('cms-content');
    if (!container) {
        console.error('Container cms-content não encontrado');
        return;
    }
    
    const sectionData = cmsData[section] || {};
    let html = '<div class="cms-section active">';
    
    if (section === 'header') {
        html += '<h3 style="margin-bottom: 20px;">📋 Configurações do Header</h3>';
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Texto do Logo</label>';
        html += '<input type="text" data-key="logo_text" value="' + (sectionData.logo_text?.value || '') + '" placeholder="SupHelp Geo">';
        html += '<div class="cms-field-description">Nome da empresa que aparece ao lado do logo</div>';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Imagem do Logo</label>';
        html += '<input type="text" data-key="logo_image" value="' + (sectionData.logo_image?.value || '') + '" placeholder="images/logo.png">';
        html += '<div class="cms-field-description">Caminho para a imagem do logo</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Menu Item 1</label>';
        html += '<input type="text" data-key="menu_item_1" value="' + (sectionData.menu_item_1?.value || '') + '" placeholder="Recursos">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Link Menu Item 1</label>';
        html += '<input type="text" data-key="menu_item_1_link" value="' + (sectionData.menu_item_1_link?.value || '') + '" placeholder="#features">';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Menu Item 2</label>';
        html += '<input type="text" data-key="menu_item_2" value="' + (sectionData.menu_item_2?.value || '') + '" placeholder="Planos">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Link Menu Item 2</label>';
        html += '<input type="text" data-key="menu_item_2_link" value="' + (sectionData.menu_item_2_link?.value || '') + '" placeholder="#plans">';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Texto Login</label>';
        html += '<input type="text" data-key="login_text" value="' + (sectionData.login_text?.value || '') + '" placeholder="Login">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Texto Cadastro</label>';
        html += '<input type="text" data-key="signup_text" value="' + (sectionData.signup_text?.value || '') + '" placeholder="Começar Grátis">';
        html += '</div>';
        html += '</div>';
        
    } else if (section === 'hero') {
        html += '<h3 style="margin-bottom: 20px;">🚀 Seção Hero (Principal)</h3>';
        html += '<div class="cms-field">';
        html += '<label>Título Principal</label>';
        html += '<input type="text" data-key="title" value="' + (sectionData.title?.value || '') + '" placeholder="Encontre Estabelecimentos Próximos em Segundos">';
        html += '<div class="cms-field-description">Título grande que aparece no topo da página</div>';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Subtítulo</label>';
        html += '<textarea data-key="subtitle" placeholder="Sistema inteligente de geolocalização...">' + (sectionData.subtitle?.value || '') + '</textarea>';
        html += '<div class="cms-field-description">Descrição que aparece abaixo do título</div>';
        html += '</div>';
        
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Botão 1 - Texto</label>';
        html += '<input type="text" data-key="button_1_text" value="' + (sectionData.button_1_text?.value || '') + '" placeholder="Começar Agora">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Botão 1 - Link</label>';
        html += '<input type="text" data-key="button_1_link" value="' + (sectionData.button_1_link?.value || '') + '" placeholder="cadastro.html">';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Botão 2 - Texto</label>';
        html += '<input type="text" data-key="button_2_text" value="' + (sectionData.button_2_text?.value || '') + '" placeholder="Ver Demo">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Botão 2 - Link</label>';
        html += '<input type="text" data-key="button_2_link" value="' + (sectionData.button_2_link?.value || '') + '" placeholder="#demo">';
        html += '</div>';
        html += '</div>';
        
        html += '<h4 style="margin: 20px 0 15px 0;">📊 Estatísticas</h4>';
        for (let i = 1; i <= 3; i++) {
            html += '<div class="form-grid">';
            html += '<div class="cms-field">';
            html += '<label>Estatística ' + i + ' - Número</label>';
            html += '<input type="text" data-key="stat_' + i + '_number" value="' + (sectionData['stat_' + i + '_number']?.value || '') + '" placeholder="10.000+">';
            html += '</div>';
            html += '<div class="cms-field">';
            html += '<label>Estatística ' + i + ' - Texto</label>';
            html += '<input type="text" data-key="stat_' + i + '_text" value="' + (sectionData['stat_' + i + '_text']?.value || '') + '" placeholder="Estabelecimentos">';
            html += '</div>';
            html += '</div>';
        }
        
    } else if (section === 'features') {
        html += '<h3 style="margin-bottom: 20px;">⭐ Seção de Recursos</h3>';
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Título da Seção</label>';
        html += '<input type="text" data-key="title" value="' + (sectionData.title?.value || '') + '" placeholder="Recursos Poderosos">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Subtítulo da Seção</label>';
        html += '<input type="text" data-key="subtitle" value="' + (sectionData.subtitle?.value || '') + '" placeholder="Tudo que você precisa para análise geográfica">';
        html += '</div>';
        html += '</div>';
        
        html += '<h4 style="margin: 20px 0 15px 0;">📋 Cards de Recursos</h4>';
        for (let i = 1; i <= 6; i++) {
            html += '<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">';
            html += '<h5 style="margin-bottom: 10px;">Card ' + i + '</h5>';
            html += '<div class="form-grid">';
            html += '<div class="cms-field">';
            html += '<label>Ícone</label>';
            html += '<input type="text" data-key="card_' + i + '_icon" value="' + (sectionData['card_' + i + '_icon']?.value || '') + '" placeholder="📍">';
            html += '</div>';
            html += '<div class="cms-field">';
            html += '<label>Título</label>';
            html += '<input type="text" data-key="card_' + i + '_title" value="' + (sectionData['card_' + i + '_title']?.value || '') + '" placeholder="Título do Card">';
            html += '</div>';
            html += '</div>';
            html += '<div class="cms-field">';
            html += '<label>Descrição</label>';
            html += '<textarea data-key="card_' + i + '_text" placeholder="Descrição do recurso...">' + (sectionData['card_' + i + '_text']?.value || '') + '</textarea>';
            html += '</div>';
            html += '</div>';
        }
        
    } else if (section === 'demo') {
        html += '<h3 style="margin-bottom: 20px;">🎬 Seção Demo</h3>';
        html += '<div class="cms-field">';
        html += '<label>Título da Seção</label>';
        html += '<input type="text" data-key="title" value="' + (sectionData.title?.value || '') + '" placeholder="Veja Como Funciona">';
        html += '</div>';
        
        html += '<h4 style="margin: 20px 0 15px 0;">📋 Passos</h4>';
        for (let i = 1; i <= 3; i++) {
            html += '<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">';
            html += '<h5 style="margin-bottom: 10px;">Passo ' + i + '</h5>';
            html += '<div class="form-grid">';
            html += '<div class="cms-field">';
            html += '<label>Título do Passo</label>';
            html += '<input type="text" data-key="step_' + i + '_title" value="' + (sectionData['step_' + i + '_title']?.value || '') + '" placeholder="Título do Passo ' + i + '">';
            html += '</div>';
            html += '<div class="cms-field">';
            html += '<label>Descrição do Passo</label>';
            html += '<input type="text" data-key="step_' + i + '_text" value="' + (sectionData['step_' + i + '_text']?.value || '') + '" placeholder="Descrição do passo ' + i + '">';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        
    } else if (section === 'plans') {
        html += '<h3 style="margin-bottom: 20px;">💰 Seção de Planos</h3>';
        html += '<div class="form-grid">';
        html += '<div class="cms-field">';
        html += '<label>Título da Seção</label>';
        html += '<input type="text" data-key="title" value="' + (sectionData.title?.value || '') + '" placeholder="Escolha Seu Plano">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Subtítulo da Seção</label>';
        html += '<input type="text" data-key="subtitle" value="' + (sectionData.subtitle?.value || '') + '" placeholder="Planos flexíveis para todas as necessidades">';
        html += '</div>';
        html += '</div>';
        
        html += '<h4 style="margin: 20px 0 15px 0;">📋 Planos</h4>';
        const planNames = ['Básico', 'Profissional', 'Enterprise'];
        for (let i = 1; i <= 3; i++) {
            html += '<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">';
            html += '<h5 style="margin-bottom: 10px;">Plano ' + planNames[i-1] + '</h5>';
            html += '<div class="form-grid">';
            html += '<div class="cms-field">';
            html += '<label>Nome do Plano</label>';
            html += '<input type="text" data-key="plan_' + i + '_name" value="' + (sectionData['plan_' + i + '_name']?.value || '') + '" placeholder="' + planNames[i-1] + '">';
            html += '</div>';
            html += '<div class="cms-field">';
            html += '<label>Preço (R$)</label>';
            html += '<input type="number" data-key="plan_' + i + '_price" value="' + (sectionData['plan_' + i + '_price']?.value || '') + '" placeholder="49">';
            html += '</div>';
            html += '</div>';
            
            if (i === 2) {
                html += '<div class="cms-field">';
                html += '<label>Badge (apenas Plano 2)</label>';
                html += '<input type="text" data-key="plan_' + i + '_badge" value="' + (sectionData['plan_' + i + '_badge']?.value || '') + '" placeholder="Mais Popular">';
                html += '</div>';
            }
            
            html += '<div class="cms-field">';
            html += '<label>Recursos (um por linha)</label>';
            html += '<textarea data-key="plan_' + i + '_features" placeholder="✅ Recurso 1\n✅ Recurso 2\n❌ Recurso 3" style="min-height: 120px;">' + (sectionData['plan_' + i + '_features']?.value || '') + '</textarea>';
            html += '<div class="cms-field-description">Use ✅ para recursos incluídos e ❌ para não incluídos</div>';
            html += '</div>';
            html += '</div>';
        }
        
    } else if (section === 'cta') {
        html += '<h3 style="margin-bottom: 20px;">📢 Seção Call-to-Action</h3>';
        html += '<div class="cms-field">';
        html += '<label>Título</label>';
        html += '<input type="text" data-key="title" value="' + (sectionData.title?.value || '') + '" placeholder="Pronto para Começar?">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Subtítulo</label>';
        html += '<input type="text" data-key="subtitle" value="' + (sectionData.subtitle?.value || '') + '" placeholder="Crie sua conta gratuitamente e teste por 7 dias">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Texto do Botão</label>';
        html += '<input type="text" data-key="button_text" value="' + (sectionData.button_text?.value || '') + '" placeholder="Criar Conta Grátis">';
        html += '</div>';
        
    } else if (section === 'footer') {
        html += '<h3 style="margin-bottom: 20px;">📄 Footer</h3>';
        html += '<div class="cms-field">';
        html += '<label>Nome da Empresa</label>';
        html += '<input type="text" data-key="company_name" value="' + (sectionData.company_name?.value || '') + '" placeholder="🗺️ SupHelp Geo">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Descrição da Empresa</label>';
        html += '<input type="text" data-key="company_description" value="' + (sectionData.company_description?.value || '') + '" placeholder="Geolocalização inteligente para seu negócio">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Copyright</label>';
        html += '<input type="text" data-key="copyright" value="' + (sectionData.copyright?.value || '') + '" placeholder="© 2024 SupHelp Geo. Todos os direitos reservados.">';
        html += '</div>';
        
    } else if (section === 'contact') {
        html += '<h3 style="margin-bottom: 20px;">📞 Configurações de Contato</h3>';
        html += '<div class="cms-field">';
        html += '<label>Email de Contato</label>';
        html += '<input type="email" data-key="email" value="' + (sectionData.email?.value || '') + '" placeholder="comercial@suphelp.com.br">';
        html += '<div class="cms-field-description">Email que receberá as mensagens dos clientes</div>';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Texto do Botão</label>';
        html += '<input type="text" data-key="button_text" value="' + (sectionData.button_text?.value || '') + '" placeholder="Fale Conosco">';
        html += '<div class="cms-field-description">Texto que aparece nos botões de contato</div>';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Assunto do Email</label>';
        html += '<input type="text" data-key="email_subject" value="' + (sectionData.email_subject?.value || '') + '" placeholder="Interesse no SupHelp Geo">';
        html += '<div class="cms-field-description">Assunto padrão do email</div>';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Corpo do Email</label>';
        html += '<textarea data-key="email_body" placeholder="Olá! Tenho interesse em conhecer mais sobre o SupHelp Geo." style="min-height: 100px;">' + (sectionData.email_body?.value || '') + '</textarea>';
        html += '<div class="cms-field-description">Mensagem padrão que aparece no email</div>';
        html += '</div>';
        
    } else {
        html += '<h3>Seção ' + section + '</h3>';
        html += '<p>Configurações para a seção ' + section + ' serão implementadas em breve.</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

async function saveCMSChanges() {
    console.log('Salvando alterações CMS...');
    const section = currentCMSSection;
    const inputs = document.querySelectorAll('#cms-content input, #cms-content textarea');
    const configs = [];
    
    inputs.forEach(input => {
        const key = input.dataset.key;
        const value = input.value;
        const type = input.type === 'number' ? 'number' : (input.tagName === 'TEXTAREA' ? 'textarea' : 'text');
        
        if (key && value !== undefined) {
            configs.push({ section, key, value, type });
        }
    });
    
    if (configs.length === 0) {
        alert('Nenhuma alteração para salvar');
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/api/cms/config/bulk`, {
            method: 'PUT',
            body: JSON.stringify({ configs })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Alterações salvas com sucesso!');
            // Atualiza dados locais
            configs.forEach(config => {
                if (!cmsData[config.section]) cmsData[config.section] = {};
                cmsData[config.section][config.key] = { value: config.value, type: config.type };
            });
        } else {
            alert('❌ Erro ao salvar: ' + data.error);
        }
    } catch (error) {
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

function previewSite() {
    window.open('/', '_blank');
}

// Refresh
function refreshData() {
    const activeSection = document.querySelector('.section.active').id;
    if (activeSection === 'dashboard') loadDashboard();
    if (activeSection === 'places') loadPlaces(currentPage);
    if (activeSection === 'cms') loadCMS();
}

// Placeholder functions for other sections
async function loadPlaces() {
    console.log('loadPlaces chamada - implementar');
}

// Administradores
async function loadAdmins() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/admin/list`);
        const data = await response.json();
        
        if (data.success) {
            displayAdmins(data.admins);
        }
    } catch (error) {
        console.error('Erro ao carregar admins:', error);
        alert('Erro ao carregar administradores');
    }
}

function displayAdmins(admins) {
    const container = document.getElementById('admins-list');
    if (!container) return;
    
    let html = `
        <div class="admins-header">
            <h3>👥 Administradores do Sistema</h3>
            <button onclick="showCreateAdminForm()" class="btn btn-primary">
                ➕ Novo Administrador
            </button>
        </div>
        
        <div id="create-admin-form" style="display: none;" class="admin-form">
            <h4>Criar Novo Administrador</h4>
            <div class="form-grid">
                <input type="text" id="admin-nome" placeholder="Nome completo" required>
                <input type="email" id="admin-email" placeholder="Email" required>
                <input type="password" id="admin-senha" placeholder="Senha" required>
                <select id="admin-role">
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Administrador</option>
                </select>
            </div>
            <div class="form-actions">
                <button onclick="createAdmin()" class="btn btn-success">Criar</button>
                <button onclick="hideCreateAdminForm()" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
        
        <div class="admins-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Último Login</th>
                        <th>Criado em</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    admins.forEach(admin => {
        const lastLogin = admin.last_login ? 
            new Date(admin.last_login).toLocaleString('pt-BR') : 'Nunca';
        const createdAt = new Date(admin.created_at).toLocaleString('pt-BR');
        
        html += `
            <tr>
                <td>${admin.id}</td>
                <td><strong>${admin.nome}</strong></td>
                <td>${admin.email}</td>
                <td><span class="badge ${admin.role === 'super_admin' ? 'warning' : 'info'}">${admin.role}</span></td>
                <td><span class="badge ${admin.status === 'active' ? 'success' : 'danger'}">${admin.status}</span></td>
                <td>${lastLogin}</td>
                <td>${createdAt}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function showCreateAdminForm() {
    document.getElementById('create-admin-form').style.display = 'block';
}

function hideCreateAdminForm() {
    document.getElementById('create-admin-form').style.display = 'none';
    // Limpa campos
    document.getElementById('admin-nome').value = '';
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-senha').value = '';
    document.getElementById('admin-role').value = 'admin';
}

async function createAdmin() {
    const nome = document.getElementById('admin-nome').value;
    const email = document.getElementById('admin-email').value;
    const senha = document.getElementById('admin-senha').value;
    const role = document.getElementById('admin-role').value;
    
    if (!nome || !email || !senha) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/api/admin/create`, {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Administrador criado com sucesso!');
            hideCreateAdminForm();
            loadAdmins(); // Recarrega lista
        } else {
            alert('❌ Erro: ' + data.error);
        }
    } catch (error) {
        alert('❌ Erro ao criar administrador: ' + error.message);
    }
}

console.log('Admin script carregado com sucesso!');