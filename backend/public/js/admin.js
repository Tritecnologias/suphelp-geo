// Admin Panel JavaScript
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
    select.innerHTML = '<option value="">Todas categorias</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// Places Management
async function loadPlaces(page = 1) {
    try {
        const limit = 20;
        const offset = (page - 1) * limit;
        const response = await fetch(`${API_URL}/api/places?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        
        const tbody = document.querySelector('#places-table tbody');
        tbody.innerHTML = '';
        
        data.data.forEach(place => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${place.id}</td>
                <td><strong>${place.name}</strong></td>
                <td style="font-size: 12px;">${place.address || '-'}</td>
                <td><span class="badge info">${place.category || '-'}</span></td>
                <td>${place.phone || '-'}</td>
                <td>${place.rating ? place.rating + ' ⭐' : '-'}</td>
                <td class="actions">
                    <button class="btn-small" onclick="editPlace(${place.id})">✏️</button>
                    <button class="btn-small btn-danger" onclick="deletePlace(${place.id}, '${place.name}')">🗑️</button>
                </td>
            `;
        });
        
        // Paginação
        renderPagination(data.pagination, page);
        currentPage = page;
    } catch (error) {
        console.error('Erro ao carregar lugares:', error);
    }
}

function renderPagination(pagination, currentPage) {
    const container = document.getElementById('places-pagination');
    container.innerHTML = '';
    
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    if (currentPage > 1) {
        const prev = document.createElement('button');
        prev.textContent = '← Anterior';
        prev.onclick = () => loadPlaces(currentPage - 1);
        container.appendChild(prev);
    }
    
    const info = document.createElement('span');
    info.textContent = `Página ${currentPage} de ${totalPages}`;
    info.style.padding = '8px 16px';
    container.appendChild(info);
    
    if (pagination.hasMore) {
        const next = document.createElement('button');
        next.textContent = 'Próxima →';
        next.onclick = () => loadPlaces(currentPage + 1);
        container.appendChild(next);
    }
}

async function filterPlaces() {
    const name = document.getElementById('filter-name').value;
    const category = document.getElementById('filter-category').value;
    
    let url = `${API_URL}/api/places/search?limit=100`;
    if (name) url += `&q=${encodeURIComponent(name)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const tbody = document.querySelector('#places-table tbody');
        tbody.innerHTML = '';
        
        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhum resultado encontrado</td></tr>';
            return;
        }
        
        data.data.forEach(place => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${place.id}</td>
                <td><strong>${place.name}</strong></td>
                <td style="font-size: 12px;">${place.address || '-'}</td>
                <td><span class="badge info">${place.category || '-'}</span></td>
                <td>${place.phone || '-'}</td>
                <td>${place.rating ? place.rating + ' ⭐' : '-'}</td>
                <td class="actions">
                    <button class="btn-small" onclick="editPlace(${place.id})">✏️</button>
                    <button class="btn-small btn-danger" onclick="deletePlace(${place.id}, '${place.name}')">🗑️</button>
                </td>
            `;
        });
    } catch (error) {
        console.error('Erro ao filtrar:', error);
    }
}

function showAddPlaceForm() {
    document.getElementById('add-place-form').style.display = 'block';
}

function hideAddPlaceForm() {
    document.getElementById('add-place-form').style.display = 'none';
    // Limpa campos
    document.getElementById('new-name').value = '';
    document.getElementById('new-category').value = '';
    document.getElementById('new-address').value = '';
    document.getElementById('new-lat').value = '';
    document.getElementById('new-lng').value = '';
    document.getElementById('new-rating').value = '';
    document.getElementById('new-phone').value = '';
    document.getElementById('new-website').value = '';
}

async function createPlace() {
    const place = {
        name: document.getElementById('new-name').value,
        category: document.getElementById('new-category').value,
        address: document.getElementById('new-address').value,
        lat: parseFloat(document.getElementById('new-lat').value),
        lng: parseFloat(document.getElementById('new-lng').value),
        rating: document.getElementById('new-rating').value ? parseFloat(document.getElementById('new-rating').value) : null,
        phone: document.getElementById('new-phone').value,
        website: document.getElementById('new-website').value
    };
    
    if (!place.name || isNaN(place.lat) || isNaN(place.lng)) {
        alert('Preencha os campos obrigatórios: Nome, Latitude e Longitude');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/places`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(place)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Lugar criado com sucesso!');
            hideAddPlaceForm();
            loadPlaces(currentPage);
        } else {
            alert('❌ Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('❌ Erro ao criar lugar: ' + error.message);
    }
}

async function deletePlace(id, name) {
    if (!confirm(`Tem certeza que deseja deletar "${name}"?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/places/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('✅ Lugar deletado com sucesso!');
            loadPlaces(currentPage);
        } else {
            alert('❌ Erro ao deletar lugar');
        }
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// Search
async function searchNearby() {
    const address = document.getElementById('search-address').value;
    const radius = document.getElementById('search-radius').value;
    const coordsDiv = document.getElementById('search-coords');
    
    if (!address) {
        alert('Informe um endereço');
        return;
    }
    
    try {
        coordsDiv.textContent = 'Geocodificando...';
        
        // Geocoding
        const geocodeResponse = await fetch(`${API_URL}/api/geocode?address=${encodeURIComponent(address)}`);
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData.success) {
            throw new Error(geocodeData.error);
        }
        
        const { lat, lng, formatted_address } = geocodeData.data;
        coordsDiv.textContent = `📍 ${formatted_address} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        
        // Busca
        const response = await fetch(`${API_URL}/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=100`);
        const data = await response.json();
        
        searchResults = data.data.map((place, index) => ({
            numero: index + 1,
            nome: place.name || 'Sem nome',
            endereco: place.address || 'Sem endereço',
            categoria: place.category || 'Sem categoria',
            telefone: place.phone || 'Não informado',
            distancia: place.distance_km + ' km',
            rating: place.rating ? place.rating + ' ⭐' : 'Sem avaliação',
            lat: place.lat,
            lng: place.lng
        }));
        
        // Popula tabela
        const tbody = document.querySelector('#search-table tbody');
        tbody.innerHTML = '';
        
        searchResults.forEach(place => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${place.numero}</td>
                <td><strong>${place.nome}</strong></td>
                <td style="font-size: 12px;">${place.endereco}</td>
                <td><span class="badge info">${place.categoria}</span></td>
                <td>${place.telefone}</td>
                <td><strong style="color: #667eea;">${place.distancia}</strong></td>
                <td>${place.rating}</td>
            `;
        });
        
        document.getElementById('search-count').textContent = searchResults.length;
        document.getElementById('search-results').style.display = 'block';
    } catch (error) {
        alert('❌ Erro: ' + error.message);
        coordsDiv.textContent = '';
    }
}

function exportSearchToExcel() {
    if (searchResults.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    let csv = '\uFEFF';
    csv += 'Número;Nome;Endereço;Categoria;Telefone;Distância;Rating;Latitude;Longitude\n';
    
    searchResults.forEach(place => {
        csv += `${place.numero};${place.nome};${place.endereco};${place.categoria};${place.telefone};${place.distancia};${place.rating};${place.lat};${place.lng}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `busca_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportSearchToPDF() {
    if (searchResults.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Busca - SupHelp Geo</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #667eea; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #667eea; color: white; padding: 10px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f9fafb; }
            </style>
        </head>
        <body>
            <h1>🗺️ SupHelp Geo - Busca por Raio</h1>
            <p><strong>Endereço:</strong> ${document.getElementById('search-coords').textContent}</p>
            <p><strong>Raio:</strong> ${document.getElementById('search-radius').value} metros</p>
            <p><strong>Total:</strong> ${searchResults.length} lugares</p>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>Endereço</th>
                        <th>Categoria</th>
                        <th>Telefone</th>
                        <th>Distância</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    searchResults.forEach(place => {
        html += `
            <tr>
                <td>${place.numero}</td>
                <td>${place.nome}</td>
                <td>${place.endereco}</td>
                <td>${place.categoria}</td>
                <td>${place.telefone}</td>
                <td>${place.distancia}</td>
                <td>${place.rating}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Gerado em: ${new Date().toLocaleString('pt-BR')}
            </p>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
}

// Import
async function importPlaces() {
    const city = document.getElementById('import-city').value;
    const keywords = document.getElementById('import-keywords').value;
    const maxResults = document.getElementById('import-max').value;
    const resultDiv = document.getElementById('import-result');
    
    if (!city || !keywords) {
        alert('Preencha cidade e keywords');
        return;
    }
    
    resultDiv.innerHTML = '<div class="alert success">⏳ Importando... Isso pode levar alguns minutos.</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/import-places-api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city,
                keywords: keywords.split(',').map(k => k.trim()),
                maxResults: parseInt(maxResults)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div class="alert success">
                    <strong>✅ Importação concluída!</strong><br>
                    ${JSON.stringify(data.stats || {}, null, 2)}
                </div>
            `;
            loadDashboard();
        } else {
            resultDiv.innerHTML = `<div class="alert error">❌ Erro: ${data.message}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="alert error">❌ Erro: ${error.message}</div>`;
    }
}

// Enrich
async function enrichContacts() {
    const limit = document.getElementById('enrich-limit').value;
    const resultDiv = document.getElementById('enrich-result');
    
    resultDiv.innerHTML = '<div class="alert success">⏳ Enriquecendo... Isso pode levar alguns minutos.</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/enrich-contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                placeIds: 'all',
                limit: parseInt(limit)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div class="alert success">
                    <strong>✅ Enriquecimento concluído!</strong><br>
                    ${JSON.stringify(data.stats || {}, null, 2)}
                </div>
            `;
            loadDashboard();
        } else {
            resultDiv.innerHTML = `<div class="alert error">❌ Erro: ${data.message}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="alert error">❌ Erro: ${error.message}</div>`;
    }
}

// Refresh
function refreshData() {
    const activeSection = document.querySelector('.section.active').id;
    if (activeSection === 'dashboard') loadDashboard();
    if (activeSection === 'places') loadPlaces(currentPage);
    if (activeSection === 'cms') loadCMS();
}

// ===== CMS FUNCTIONS =====

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
    }
}

function loadCMSSection(section) {
    currentCMSSection = section;
    
    // Atualiza tabs
    document.querySelectorAll('.cms-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === section) {
            tab.classList.add('active');
        }
    });
    
    const container = document.getElementById('cms-content');
    const sectionData = cmsData[section] || {};
    
    let html = `<div class="cms-section active">`;
    
    if (section === 'header') {
        html += `
            <h3 style="margin-bottom: 20px;">📋 Configurações do Header</h3>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Texto do Logo</label>
                    <input type="text" data-key="logo_text" value="${sectionData.logo_text?.value || ''}" placeholder="SupHelp Geo">
                    <div class="cms-field-description">Nome da empresa que aparece ao lado do logo</div>
                </div>
                <div class="cms-field">
                    <label>Imagem do Logo</label>
                    <input type="text" data-key="logo_image" value="${sectionData.logo_image?.value || ''}" placeholder="images/logo.png">
                    <div class="cms-field-description">Caminho para a imagem do logo</div>
                </div>
            </div>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Menu Item 1</label>
                    <input type="text" data-key="menu_item_1" value="${sectionData.menu_item_1?.value || ''}" placeholder="Recursos">
                </div>
                <div class="cms-field">
                    <label>Link Menu Item 1</label>
                    <input type="text" data-key="menu_item_1_link" value="${sectionData.menu_item_1_link?.value || ''}" placeholder="#features">
                </div>
            </div>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Menu Item 2</label>
                    <input type="text" data-key="menu_item_2" value="${sectionData.menu_item_2?.value || ''}" placeholder="Planos">
                </div>
                <div class="cms-field">
                    <label>Link Menu Item 2</label>
                    <input type="text" data-key="menu_item_2_link" value="${sectionData.menu_item_2_link?.value || ''}" placeholder="#plans">
                </div>
            </div>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Texto Login</label>
                    <input type="text" data-key="login_text" value="${sectionData.login_text?.value || ''}" placeholder="Login">
                </div>
                <div class="cms-field">
                    <label>Texto Cadastro</label>
                    <input type="text" data-key="signup_text" value="${sectionData.signup_text?.value || ''}" placeholder="Começar Grátis">
                </div>
            </div>
        `;
    } else if (section === 'hero') {
        html += `
            <h3 style="margin-bottom: 20px;">🚀 Seção Hero (Principal)</h3>
            <div class="cms-field">
                <label>Título Principal</label>
                <input type="text" data-key="title" value="${sectionData.title?.value || ''}" placeholder="Encontre Estabelecimentos Próximos em Segundos">
                <div class="cms-field-description">Título grande que aparece no topo da página</div>
            </div>
            <div class="cms-field">
                <label>Subtítulo</label>
                <textarea data-key="subtitle" placeholder="Sistema inteligente de geolocalização...">${sectionData.subtitle?.value || ''}</textarea>
                <div class="cms-field-description">Descrição que aparece abaixo do título</div>
            </div>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Botão 1 - Texto</label>
                    <input type="text" data-key="button_1_text" value="${sectionData.button_1_text?.value || ''}" placeholder="Começar Agora">
                </div>
                <div class="cms-field">
                    <label>Botão 1 - Link</label>
                    <input type="text" data-key="button_1_link" value="${sectionData.button_1_link?.value || ''}" placeholder="cadastro.html">
                </div>
            </div>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Botão 2 - Texto</label>
                    <input type="text" data-key="button_2_text" value="${sectionData.button_2_text?.value || ''}" placeholder="Ver Demo">
                </div>
                <div class="cms-field">
                    <label>Botão 2 - Link</label>
                    <input type="text" data-key="button_2_link" value="${sectionData.button_2_link?.value || ''}" placeholder="#demo">
                </div>
            </div>
            <h4 style="margin: 20px 0 15px 0;">📊 Estatísticas</h4>
            <div class="form-grid three">
                <div class="cms-field">
                    <label>Estatística 1 - Número</label>
                    <input type="text" data-key="stat_1_number" value="${sectionData.stat_1_number?.value || ''}" placeholder="10.000+">
                </div>
                <div class="cms-field">
                    <label>Estatística 1 - Texto</label>
                    <input type="text" data-key="stat_1_text" value="${sectionData.stat_1_text?.value || ''}" placeholder="Estabelecimentos">
                </div>
                <div></div>
            </div>
            <div class="form-grid three">
                <div class="cms-field">
                    <label>Estatística 2 - Número</label>
                    <input type="text" data-key="stat_2_number" value="${sectionData.stat_2_number?.value || ''}" placeholder="500+">
                </div>
                <div class="cms-field">
                    <label>Estatística 2 - Texto</label>
                    <input type="text" data-key="stat_2_text" value="${sectionData.stat_2_text?.value || ''}" placeholder="Clientes Ativos">
                </div>
                <div></div>
            </div>
            <div class="form-grid three">
                <div class="cms-field">
                    <label>Estatística 3 - Número</label>
                    <input type="text" data-key="stat_3_number" value="${sectionData.stat_3_number?.value || ''}" placeholder="99.9%">
                </div>
                <div class="cms-field">
                    <label>Estatística 3 - Texto</label>
                    <input type="text" data-key="stat_3_text" value="${sectionData.stat_3_text?.value || ''}" placeholder="Uptime">
                </div>
                <div></div>
            </div>
        `;
    } else if (section === 'features') {
        html += `
            <h3 style="margin-bottom: 20px;">⭐ Seção de Recursos</h3>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Título da Seção</label>
                    <input type="text" data-key="title" value="${sectionData.title?.value || ''}" placeholder="Recursos Poderosos">
                </div>
                <div class="cms-field">
                    <label>Subtítulo da Seção</label>
                    <input type="text" data-key="subtitle" value="${sectionData.subtitle?.value || ''}" placeholder="Tudo que você precisa para análise geográfica">
                </div>
            </div>
            <h4 style="margin: 20px 0 15px 0;">📋 Cards de Recursos</h4>
        `;
        
        for (let i = 1; i <= 6; i++) {
            html += `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <h5 style="margin-bottom: 10px;">Card ${i}</h5>
                    <div class="form-grid three">
                        <div class="cms-field">
                            <label>Ícone</label>
                            <input type="text" data-key="card_${i}_icon" value="${sectionData[`card_${i}_icon`]?.value || ''}" placeholder="📍">
                        </div>
                        <div class="cms-field">
                            <label>Título</label>
                            <input type="text" data-key="card_${i}_title" value="${sectionData[`card_${i}_title`]?.value || ''}" placeholder="Título do Card">
                        </div>
                        <div></div>
                    </div>
                    <div class="cms-field">
                        <label>Descrição</label>
                        <textarea data-key="card_${i}_text" placeholder="Descrição do recurso...">${sectionData[`card_${i}_text`]?.value || ''}</textarea>
                    </div>
                </div>
            `;
        }
    } else if (section === 'plans') {
        html += `
            <h3 style="margin-bottom: 20px;">💰 Seção de Planos</h3>
            <div class="form-grid">
                <div class="cms-field">
                    <label>Título da Seção</label>
                    <input type="text" data-key="title" value="${sectionData.title?.value || ''}" placeholder="Escolha Seu Plano">
                </div>
                <div class="cms-field">
                    <label>Subtítulo da Seção</label>
                    <input type="text" data-key="subtitle" value="${sectionData.subtitle?.value || ''}" placeholder="Planos flexíveis para todas as necessidades">
                </div>
            </div>
            <h4 style="margin: 20px 0 15px 0;">📋 Planos</h4>
        `;
        
        const planNames = ['Básico', 'Profissional', 'Enterprise'];
        for (let i = 1; i <= 3; i++) {
            html += `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <h5 style="margin-bottom: 10px;">Plano ${planNames[i-1]}</h5>
                    <div class="form-grid">
                        <div class="cms-field">
                            <label>Nome do Plano</label>
                            <input type="text" data-key="plan_${i}_name" value="${sectionData[`plan_${i}_name`]?.value || ''}" placeholder="${planNames[i-1]}">
                        </div>
                        <div class="cms-field">
                            <label>Preço (R$)</label>
                            <input type="number" data-key="plan_${i}_price" value="${sectionData[`plan_${i}_price`]?.value || ''}" placeholder="49">
                        </div>
                    </div>
                    ${i === 2 ? `
                    <div class="cms-field">
                        <label>Badge (apenas Plano 2)</label>
                        <input type="text" data-key="plan_${i}_badge" value="${sectionData[`plan_${i}_badge`]?.value || ''}" placeholder="Mais Popular">
                    </div>
                    ` : ''}
                    <div class="cms-field">
                        <label>Recursos (um por linha)</label>
                        <textarea data-key="plan_${i}_features" placeholder="✅ Recurso 1&#10;✅ Recurso 2&#10;❌ Recurso 3" style="min-height: 120px;">${sectionData[`plan_${i}_features`]?.value || ''}</textarea>
                        <div class="cms-field-description">Use ✅ para recursos incluídos e ❌ para não incluídos</div>
                    </div>
                </div>
            `;
        }
    } else if (section === 'cta') {
        html += `
            <h3 style="margin-bottom: 20px;">📢 Seção Call-to-Action</h3>
            <div class="cms-field">
                <label>Título</label>
                <input type="text" data-key="title" value="${sectionData.title?.value || ''}" placeholder="Pronto para Começar?">
            </div>
            <div class="cms-field">
                <label>Subtítulo</label>
                <input type="text" data-key="subtitle" value="${sectionData.subtitle?.value || ''}" placeholder="Crie sua conta gratuitamente e teste por 7 dias">
            </div>
            <div class="cms-field">
                <label>Texto do Botão</label>
                <input type="text" data-key="button_text" value="${sectionData.button_text?.value || ''}" placeholder="Criar Conta Grátis">
            </div>
        `;
    } else if (section === 'footer') {
        html += `
            <h3 style="margin-bottom: 20px;">📄 Footer</h3>
            <div class="cms-field">
                <label>Nome da Empresa</label>
                <input type="text" data-key="company_name" value="${sectionData.company_name?.value || ''}" placeholder="🗺️ SupHelp Geo">
            </div>
            <div class="cms-field">
                <label>Descrição da Empresa</label>
                <input type="text" data-key="company_description" value="${sectionData.company_description?.value || ''}" placeholder="Geolocalização inteligente para seu negócio">
            </div>
            <div class="cms-field">
                <label>Copyright</label>
                <input type="text" data-key="copyright" value="${sectionData.copyright?.value || ''}" placeholder="© 2024 SupHelp Geo. Todos os direitos reservados.">
            </div>
        `;
    } else if (section === 'demo') {
        html += `
            <h3 style="margin-bottom: 20px;">🎬 Seção Demo</h3>
            <div class="cms-field">
                <label>Título da Seção</label>
                <input type="text" data-key="title" value="${sectionData.title?.value || ''}" placeholder="Veja Como Funciona">
            </div>
            <h4 style="margin: 20px 0 15px 0;">📋 Passos</h4>
        `;
        
        for (let i = 1; i <= 3; i++) {
            html += `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <h5 style="margin-bottom: 10px;">Passo ${i}</h5>
                    <div class="form-grid">
                        <div class="cms-field">
                            <label>Título do Passo</label>
                            <input type="text" data-key="step_${i}_title" value="${sectionData[`step_${i}_title`]?.value || ''}" placeholder="Título do Passo ${i}">
                        </div>
                        <div class="cms-field">
                            <label>Descrição do Passo</label>
                            <input type="text" data-key="step_${i}_text" value="${sectionData[`step_${i}_text`]?.value || ''}" placeholder="Descrição do passo ${i}">
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

async function saveCMSChanges() {
    const section = currentCMSSection;
    const inputs = document.querySelectorAll(`#cms-content input, #cms-content textarea`);
    const configs = [];
    
    inputs.forEach(input => {
        const key = input.dataset.key;
        const value = input.value;
        const type = input.type === 'number' ? 'number' : (input.tagName === 'TEXTAREA' ? 'textarea' : 'text');
        
        if (key && value !== undefined) {
            configs.push({ section, key, value, type });
        }
    });
    
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
