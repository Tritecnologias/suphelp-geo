import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Veja como funciona</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 rounded-full z-0"></div>

          {/* Step 1 */}
          <div className="text-center relative z-10 group">
            <div className="w-20 h-20 bg-primary group-hover:bg-secondary transition-colors duration-300 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-primary/30">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Digite o Endereço</h3>
            <p className="text-slate-500">
              Informe o endereço completo ou o local que deseja buscar no mapa interativo.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center relative z-10 group">
            <div className="w-20 h-20 bg-primary group-hover:bg-secondary transition-colors duration-300 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-primary/30">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Defina o Raio</h3>
            <p className="text-slate-500">
              Escolha a distância em metros (ex: 500m, 1km, 5km) para filtrar a área de abrangência.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center relative z-10 group">
            <div className="w-20 h-20 bg-primary group-hover:bg-secondary transition-colors duration-300 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-primary/30">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Visualize e Exporte</h3>
            <p className="text-slate-500">
              Veja os resultados em lista ou mapa e exporte para Excel ou PDF com um clique.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;