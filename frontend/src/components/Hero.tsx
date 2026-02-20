import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Download } from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';

const Hero: React.FC = () => {
  const { config } = useSiteConfig();

  return (
    <section className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 pb-4">
            {config.hero?.titleLine1 || 'Encontre Estabelecimentos'}
            <span className="block bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {config.hero?.titleLine2 || 'Próximos em Segundos'}
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {config.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              to="/cadastro" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {config.hero?.button1Text || 'Começar Agora'}
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-cyan-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              {config.hero?.button2Text || 'Ver Demo'}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600 mb-2">{config.hero?.stat1Number || '10.000+'}</div>
              <div className="text-slate-600">{config.hero?.stat1Text || 'Estabelecimentos'}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{config.hero?.stat2Number || '500+'}</div>
              <div className="text-slate-600">{config.hero?.stat2Text || 'Clientes Ativos'}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{config.hero?.stat3Number || '99.9%'}</div>
              <div className="text-slate-600">{config.hero?.stat3Text || 'Uptime'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;