import React, { useState } from 'react';
import { Globe, Menu, X, MessageCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-lime-400 to-primary rounded-full flex items-center justify-center text-white shadow-lg">
              <Globe size={24} />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">SupHelp Geo</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 hover:text-primary font-medium transition">Recursos</a>
            <a href="#pricing" className="text-slate-600 hover:text-primary font-medium transition">Planos</a>
            <a href="#contact" className="text-slate-600 hover:text-primary font-medium transition flex items-center gap-1">
              <MessageCircle size={18} /> Fale Conosco
            </a>
            <a href="#login" className="text-slate-600 hover:text-primary font-medium transition">Login</a>
            <button className="bg-primary hover:bg-secondary text-white px-5 py-2.5 rounded-full font-semibold shadow-md transition transform hover:-translate-y-0.5">
              Começar Grátis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-primary p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <a href="#features" className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md">Recursos</a>
            <a href="#pricing" className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md">Planos</a>
            <a href="#contact" className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md">Fale Conosco</a>
            <a href="#login" className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md">Login</a>
            <div className="pt-2">
               <button className="w-full bg-primary hover:bg-secondary text-white px-5 py-3 rounded-lg font-semibold shadow-md transition">
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;