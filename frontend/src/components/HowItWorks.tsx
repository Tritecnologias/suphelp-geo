import React from 'react';
import { Search, Target, Download } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      icon: <Search size={24} />,
      title: 'Digite o Endereço',
      description: 'Informe o endereço ou local que deseja buscar'
    },
    {
      number: 2,
      icon: <Target size={24} />,
      title: 'Defina o Raio',
      description: 'Escolha a distância em metros (ex: 5km)'
    },
    {
      number: 3,
      icon: <Download size={24} />,
      title: 'Visualize e Exporte',
      description: 'Veja os resultados e exporte para Excel ou PDF'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Veja Como Funciona
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Três passos simples para encontrar estabelecimentos próximos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg">
                  <span className="text-2xl font-bold">{step.number}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  {step.icon}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {step.title}
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;