// Admin Panel JavaScript - Fixed Version
const API_URL = window.location.origin;
let currentPage = 1;
let searchResults = [];
let cmsData = {};
let currentCMSSection = 'header';

// Inicialização
window.onload = () => {
    loadDashboard();
};

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
        import: 'Importar Dados',
        enrich: 'Enriquecer Contatos',
        settings: 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    // Carrega dados da seção
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'places') loadPlaces();
    if (sectionId === 'cms') loadCMS();
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
        const response = await fetch(`${API_URL}/api/cms/config`);
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
    } else if (section === 'hero') {
        html += '<h3 style="margin-bottom: 20px;">🚀 Seção Hero (Principal)</h3>';
        html += '<div class="cms-field">';
        html += '<label>Título Principal</label>';
        html += '<input type="text" data-key="title" value="' + (sectionData.title?.value || '') + '" placeholder="Encontre Estabelecimentos Próximos em Segundos">';
        html += '</div>';
        html += '<div class="cms-field">';
        html += '<label>Subtítulo</label>';
        html += '<textarea data-key="subtitle" placeholder="Sistema inteligente de geolocalização...">' + (sectionData.subtitle?.value || '') + '</textarea>';
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
        const response = await fetch(`${API_URL}/api/cms/config/bulk`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

console.log('Admin script carregado com sucesso!');