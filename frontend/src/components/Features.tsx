import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';

const Features: React.FC = () => {
  const { config } = useSiteConfig();

  const defaultFeatures = [
    {
      icon: 'MapPin',
      title: 'Busca por Endereço',
      description: 'Digite qualquer endereço e encontre estabelecimentos próximos automaticamente'
    },
    {
      icon: 'Download',
      title: 'Exportação Excel',
      description: 'Exporte todos os dados em formato CSV compatível com Excel e Google Sheets'
    },
    {
      icon: 'FileText',
      title: 'Relatórios PDF',
      description: 'Gere relatórios profissionais em PDF prontos para impressão'
    },
    {
      icon: 'Target',
      title: 'Busca por Raio',
      description: 'Defina o raio de busca em metros e encontre tudo ao redor'
    }
  ];

  // Usar configurações do banco ou valores padrão
  const features = config.features?.cards && config.features.cards.length > 0
    ? config.features.cards.map(card => ({
        icon: card.icon || 'MapPin',
        title: card.title || '',
        description: card.text || ''
      }))
    : defaultFeatures;

  // Função para renderizar ícone (Lucide ou emoji)
  const renderIcon = (iconName: string) => {
    // Se for um emoji (1-2 caracteres), renderizar como texto
    if (iconName.length <= 2) {
      return <span className="text-3xl">{iconName}</span>;
    }
    
    // Tentar renderizar como ícone Lucide
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={32} />;
    }
    
    // Fallback para MapPin se o ícone não existir
    return <LucideIcons.MapPin size={32} />;
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            {config.features?.title || 'Recursos Poderosos'}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {config.features?.subtitle || 'Tudo que você precisa para análise geográfica'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
                {renderIcon(feature.icon)}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;