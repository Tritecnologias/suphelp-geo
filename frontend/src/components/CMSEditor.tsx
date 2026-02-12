// Editor CMS completo para todas as seções da landing page
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { adminService } from '../services/admin';

interface CMSEditorProps {
  onSave?: () => void;
}

const CMSEditor: React.FC<CMSEditorProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState('header');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cmsData, setCmsData] = useState<any>({});

  useEffect(() => {
    loadCMSData();
  }, []);

  const loadCMSData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSiteConfig();
      const data = response.data || response;
      setCmsData(data);
    } catch (error) {
      console.error('Erro ao carregar CMS:', error);
      setMessage('❌ Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: string, key: string, value: string) => {
    setCmsData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { value, type: 'text' }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Converter dados para formato do backend
      const configs: any[] = [];
      Object.keys(cmsData).forEach(section => {
        Object.keys(cmsData[section]).forEach(key => {
          configs.push({
            section,
            key,
            value: cmsData[section][key].value || '',
            type: cmsData[section][key].type || 'text'
          });
        });
      });

      await adminService.saveSiteConfig(configs);
      setMessage('✅ Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage('❌ Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'header', label: 'Header' },
    { id: 'hero', label: 'Hero' },
    { id: 'features', label: 'Recursos' },
    { id: 'pricing', label: 'Preços' },
    { id: 'footer', label: 'Footer' }
  ];

  const getValue = (section: string, key: string, defaultValue = '') => {
    return cmsData[section]?.[key]?.value || defaultValue;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Editor de Conteúdo (CMS)</h3>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar Tudo
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header Section */}
      {activeTab === 'header' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Configurações do Header</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Site</label>
              <input
                type="text"
                value={getValue('header', 'site_name')}
                onChange={(e) => handleInputChange('header', 'site_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="SupHelp Geo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slogan</label>
              <input
                type="text"
                value={getValue('header', 'slogan')}
                onChange={(e) => handleInputChange('header', 'slogan', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Geolocalização Inteligente"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Item 1</label>
              <input
                type="text"
                value={getValue('header', 'menu_item_1', 'Recursos')}
                onChange={(e) => handleInputChange('header', 'menu_item_1', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Item 2</label>
              <input
                type="text"
                value={getValue('header', 'menu_item_2', 'Planos')}
                onChange={(e) => handleInputChange('header', 'menu_item_2', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Seção Hero (Principal)</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
            <input
              type="text"
              value={getValue('hero', 'title', 'Encontre Estabelecimentos Próximos em Segundos')}
              onChange={(e) => handleInputChange('hero', 'title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              rows={3}
              value={getValue('hero', 'description')}
              onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Sistema inteligente de geolocalização..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Botão 1 - Texto</label>
              <input
                type="text"
                value={getValue('hero', 'button_1_text', 'Começar Agora')}
                onChange={(e) => handleInputChange('hero', 'button_1_text', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Botão 2 - Texto</label>
              <input
                type="text"
                value={getValue('hero', 'button_2_text', 'Ver Demo')}
                onChange={(e) => handleInputChange('hero', 'button_2_text', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <h5 className="font-medium text-gray-900 mt-6 mb-3">Estatísticas</h5>
          {[1, 2, 3].map(i => (
            <div key={i} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estatística {i} - Número</label>
                <input
                  type="text"
                  value={getValue('hero', `stat_${i}_number`)}
                  onChange={(e) => handleInputChange('hero', `stat_${i}_number`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10.000+"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estatística {i} - Texto</label>
                <input
                  type="text"
                  value={getValue('hero', `stat_${i}_text`)}
                  onChange={(e) => handleInputChange('hero', `stat_${i}_text`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Estabelecimentos"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Features Section */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Seção de Recursos</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título da Seção</label>
              <input
                type="text"
                value={getValue('features', 'title', 'Recursos Poderosos')}
                onChange={(e) => handleInputChange('features', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
              <input
                type="text"
                value={getValue('features', 'subtitle')}
                onChange={(e) => handleInputChange('features', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tudo que você precisa..."
              />
            </div>
          </div>

          <h5 className="font-medium text-gray-900 mt-6 mb-3">Cards de Recursos</h5>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h6 className="font-medium text-gray-700">Card {i}</h6>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                  <input
                    type="text"
                    value={getValue('features', `card_${i}_icon`)}
                    onChange={(e) => handleInputChange('features', `card_${i}_icon`, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="📍"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    value={getValue('features', `card_${i}_title`)}
                    onChange={(e) => handleInputChange('features', `card_${i}_title`, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  rows={2}
                  value={getValue('features', `card_${i}_text`)}
                  onChange={(e) => handleInputChange('features', `card_${i}_text`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Section */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Seção de Preços</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título da Seção</label>
              <input
                type="text"
                value={getValue('pricing', 'title', 'Planos e Preços')}
                onChange={(e) => handleInputChange('pricing', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
              <input
                type="text"
                value={getValue('pricing', 'subtitle')}
                onChange={(e) => handleInputChange('pricing', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Escolha o plano ideal..."
              />
            </div>
          </div>

          <h5 className="font-medium text-gray-900 mt-6 mb-3">Planos</h5>
          {['basico', 'profissional', 'enterprise'].map((plan, idx) => (
            <div key={plan} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h6 className="font-medium text-gray-700 capitalize">Plano {plan}</h6>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={getValue('pricing', `plan_${idx + 1}_name`)}
                    onChange={(e) => handleInputChange('pricing', `plan_${idx + 1}_name`, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                  <input
                    type="text"
                    value={getValue('pricing', `plan_${idx + 1}_price`)}
                    onChange={(e) => handleInputChange('pricing', `plan_${idx + 1}_price`, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                  <input
                    type="text"
                    value={getValue('pricing', `plan_${idx + 1}_period`, '/mês')}
                    onChange={(e) => handleInputChange('pricing', `plan_${idx + 1}_period`, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  rows={2}
                  value={getValue('pricing', `plan_${idx + 1}_description`)}
                  onChange={(e) => handleInputChange('pricing', `plan_${idx + 1}_description`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Section */}
      {activeTab === 'footer' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-4">Configurações do Footer</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contato</label>
              <input
                type="email"
                value={getValue('footer', 'contact_email')}
                onChange={(e) => handleInputChange('footer', 'contact_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="contato@suphelp.com.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone de Contato</label>
              <input
                type="tel"
                value={getValue('footer', 'contact_phone')}
                onChange={(e) => handleInputChange('footer', 'contact_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 9999-9999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição da Empresa</label>
            <textarea
              rows={3}
              value={getValue('footer', 'company_description')}
              onChange={(e) => handleInputChange('footer', 'company_description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Geolocalização inteligente para seu negócio..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Texto de Copyright</label>
            <input
              type="text"
              value={getValue('footer', 'copyright_text', 'Todos os direitos reservados.')}
              onChange={(e) => handleInputChange('footer', 'copyright_text', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Todos os direitos reservados."
            />
            <p className="text-xs text-gray-500 mt-1">
              O ano e nome da empresa são adicionados automaticamente. Ex: "© 2026 SupHelp Geo. [seu texto aqui]"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMSEditor;
