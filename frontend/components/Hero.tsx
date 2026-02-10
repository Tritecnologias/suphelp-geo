import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-cyan-400 to-primary text-white pt-20 pb-28 relative overflow-hidden">
      {/* Decorative Background SVG */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight drop-shadow-sm">
          Encontre Estabelecimentos<br className="hidden md:block"/> Próximos em Segundos
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          Sistema inteligente de geolocalização para encontrar farmácias, padarias, mercados e muito mais. Exporte dados em Excel e PDF com facilidade.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link 
            to="/cadastro"
            className="bg-white text-primary hover:bg-slate-100 px-8 py-4 rounded-lg font-bold shadow-lg transition transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"
          >
            Começar Agora <ArrowRight size={20} />
          </Link>
          <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-bold transition text-lg backdrop-blur-sm flex items-center justify-center gap-2">
            <Play size={20} fill="currentColor" /> Ver Demo
          </button>
        </div>

        {/* Dashboard Preview Image - Addressing the user's request for image links */}
        <div className="relative max-w-5xl mx-auto mt-12 rounded-xl shadow-2xl border-4 border-white/20 overflow-hidden bg-slate-800">
             <img 
                src="https://picsum.photos/id/48/1200/600" 
                alt="Dashboard Preview do SupHelp Geo" 
                className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none"></div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/20 pt-10 mt-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold mb-1">10.000+</div>
            <div className="text-sm uppercase tracking-wider opacity-80 font-medium">Estabelecimentos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold mb-1">500+</div>
            <div className="text-sm uppercase tracking-wider opacity-80 font-medium">Clientes Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold mb-1">99.9%</div>
            <div className="text-sm uppercase tracking-wider opacity-80 font-medium">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;