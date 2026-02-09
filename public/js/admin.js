// Admin Panel JavaScript
const API_URL = window.location.origin;
let currentPage = 1;
let searchResults = [];

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
        import: 'Importar Dados',
        enrich: 'Enriquecer Contatos',
        settings: 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    // Carrega dados da seção
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'places') loadPlaces();
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
}
