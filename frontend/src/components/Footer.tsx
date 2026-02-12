import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail } from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';

const Footer: React.FC = () => {
  const { config } = useSiteConfig();

  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo e Descrição */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt={config.siteName} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Globe size={20} />
                </div>
              )}
              <span className="font-bold text-xl">{config.siteName}</span>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              {config.slogan}. Encontre estabelecimentos próximos e exporte dados facilmente.
            </p>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail size={16} />
              <a 
                href={`mailto:${config.email}`}
                className="hover:text-cyan-400 transition-colors"
              >
                {config.email}
              </a>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Produto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Planos
                </a>
              </li>
              <li>
                <Link to="/login" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a 
                  href="mailto:comercial@suphelp.com.br" 
                  className="text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  Fale Conosco
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Suporte
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-700 pt-8 text-center">
          <p className="text-slate-400">
            © {new Date().getFullYear()} {config.siteName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;