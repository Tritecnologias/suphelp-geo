import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const PricingItem: React.FC<{ active: boolean; text: string }> = ({ active, text }) => (
  <li className={`flex items-center ${active ? 'text-slate-600' : 'text-slate-400 line-through'}`}>
    {active ? (
      <CheckCircle size={18} className="text-green-500 mr-2 flex-shrink-0" />
    ) : (
      <XCircle size={18} className="text-red-400 mr-2 flex-shrink-0" />
    )}
    {text}
  </li>
);

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Escolha Seu Plano</h2>
          <p className="text-lg text-slate-500">Planos flexíveis para todas as necessidades de negócio.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Basic Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Básico</h3>
              <div className="flex items-end justify-center gap-1">
                <span className="text-slate-500 font-medium">R$</span>
                <span className="text-5xl font-extrabold text-primary">49</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <PricingItem active={true} text="100 buscas por mês" />
              <PricingItem active={true} text="Exportação Excel" />
              <PricingItem active={true} text="Exportação PDF" />
              <PricingItem active={true} text="Suporte por email" />
              <PricingItem active={false} text="API Access" />
              <PricingItem active={false} text="Relatórios personalizados" />
            </ul>
            <button className="block w-full text-center bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-lg transition">
              Começar
            </button>
          </div>

          {/* Professional Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-primary relative p-8 transform lg:-translate-y-4 z-10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
              Mais Popular
            </div>
            <div className="text-center mb-6 pt-2">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Profissional</h3>
              <div className="flex items-end justify-center gap-1">
                <span className="text-slate-500 font-medium">R$</span>
                <span className="text-5xl font-extrabold text-primary">149</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <PricingItem active={true} text="1.000 buscas por mês" />
              <PricingItem active={true} text="Exportação Excel" />
              <PricingItem active={true} text="Exportação PDF" />
              <PricingItem active={true} text="Suporte prioritário" />
              <PricingItem active={true} text="API Access" />
              <PricingItem active={true} text="Relatórios personalizados" />
            </ul>
            <button className="block w-full text-center bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-primary/30">
              Começar
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Enterprise</h3>
              <div className="flex items-end justify-center gap-1">
                <span className="text-slate-500 font-medium">R$</span>
                <span className="text-5xl font-extrabold text-primary">499</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <PricingItem active={true} text="Buscas Ilimitadas" />
              <PricingItem active={true} text="Exportação Excel" />
              <PricingItem active={true} text="Exportação PDF" />
              <PricingItem active={true} text="Suporte 24/7" />
              <PricingItem active={true} text="API Access completo" />
              <PricingItem active={true} text="Treinamento dedicado" />
            </ul>
            <button className="block w-full text-center bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-lg transition">
              Começar
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pricing;