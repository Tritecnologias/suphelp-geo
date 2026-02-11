import React from 'react';
import { Link } from 'react-router-dom';

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Pronto para Começar?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Crie sua conta gratuitamente e teste por 7 dias
        </p>
        
        <Link 
          to="/cadastro"
          className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:bg-blue-50"
        >
          Criar Conta Grátis
        </Link>
        
        <div className="mt-8 text-blue-100 text-sm">
          ✓ Sem cartão de crédito necessário &nbsp;&nbsp;&nbsp; ✓ Cancelamento a qualquer momento
        </div>
      </div>
    </section>
  );
};

export default CTA;