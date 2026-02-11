import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Básico',
      price: 49,
      description: 'Ideal para pequenos negócios',
      features: [
        { name: '100 buscas por mês', included: true },
        { name: 'Exportação Excel', included: true },
        { name: 'Exportação PDF', included: true },
        { name: 'Suporte por email', included: true },
        { name: 'API Access', included: false },
        { name: 'Relatórios personalizados', included: false }
      ],
      popular: false
    },
    {
      name: 'Profissional',
      price: 149,
      description: 'Para empresas em crescimento',
      features: [
        { name: '1.000 buscas por mês', included: true },
        { name: 'Exportação Excel', included: true },
        { name: 'Exportação PDF', included: true },
        { name: 'Suporte prioritário', included: true },
        { name: 'API Access', included: true },
        { name: 'Relatórios personalizados', included: true }
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 499,
      description: 'Para grandes organizações',
      features: [
        { name: 'Buscas ilimitadas', included: true },
        { name: 'Exportação Excel', included: true },
        { name: 'Exportação PDF', included: true },
        { name: 'Suporte 24/7', included: true },
        { name: 'API Access completo', included: true },
        { name: 'Relatórios personalizados', included: true },
        { name: 'Integração customizada', included: true },
        { name: 'Treinamento dedicado', included: true }
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Escolha Seu Plano
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Planos flexíveis para todas as necessidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col ${
                plan.popular ? 'border-cyan-500 scale-105' : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-slate-500">R$</span>
                  <span className="text-5xl font-bold text-slate-800">
                    {plan.price}
                  </span>
                  <span className="text-slate-500">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      feature.included 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {feature.included ? <Check size={12} /> : <X size={12} />}
                    </div>
                    <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Link 
                to={`/cadastro?plan=${plan.name.toLowerCase()}`}
                className={`block w-full text-center py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 mt-auto ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                Começar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;