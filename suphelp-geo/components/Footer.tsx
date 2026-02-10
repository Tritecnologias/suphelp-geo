import React from 'react';
import { Globe, Mail, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Globe size={24} className="text-primary" />
              <span className="font-bold text-xl">SupHelp Geo</span>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Geolocalização inteligente para seu negócio crescer e encontrar novas oportunidades.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition">Recursos</a></li>
              <li><a href="#" className="hover:text-primary transition">Planos</a></li>
              <li><a href="#" className="hover:text-primary transition">Documentação</a></li>
              <li><a href="#" className="hover:text-primary transition">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition">Sobre</a></li>
              <li><a href="#" className="hover:text-primary transition flex items-center gap-1"><Mail size={14} /> Fale Conosco</a></li>
              <li><a href="#" className="hover:text-primary transition">Suporte</a></li>
              <li><a href="#" className="hover:text-primary transition">Carreiras</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition">Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>© 2024 SupHelp Geo. Todos os direitos reservados.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition"><Twitter size={20} /></a>
            <a href="#" className="hover:text-white transition"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-white transition"><Instagram size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;