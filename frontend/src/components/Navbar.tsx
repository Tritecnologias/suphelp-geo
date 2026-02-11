import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Globe size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                SupHelp Geo
              </span>
              <span className="text-xs text-slate-500">Geolocalização Inteligente</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-cyan-600 font-medium transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-cyan-600 font-medium transition-colors">
              Planos
            </a>
            <Link 
              to="/login" 
              className="text-slate-600 hover:text-cyan-600 font-medium transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/cadastro" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Começar Grátis
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;