import React from 'react';
import { MapPin, Download, FileText, Target, Phone, Zap } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <MapPin size={32} />,
      title: 'Busca por Endereço',
      description: 'Digite qualquer endereço e encontre estabelecimentos próximos automaticamente'
    },
    {
      icon: <Download size={32} />,
      title: 'Exportação Excel',
      description: 'Exporte todos os dados em formato CSV compatível com Excel e Google Sheets'
    },
    {
      icon: <FileText size={32} />,
      title: 'Relatórios PDF',
      description: 'Gere relatórios profissionais em PDF prontos para impressão'
    },
    {
      icon: <Target size={32} />,
      title: 'Busca por Raio',
      description: 'Defina o raio de busca em metros e encontre tudo ao redor'
    },
    {
      icon: <Phone size={32} />,
      title: 'Dados Completos',
      description: 'Telefone, endereço, avaliações e muito mais'
    },
    {
      icon: <Zap size={32} />,
      title: 'Resultados Rápidos',
      description: 'Busca instantânea com tecnologia PostGIS'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Recursos Poderosos
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Tudo que você precisa para análise geográfica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
                {feature.icon}
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