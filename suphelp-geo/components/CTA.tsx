import React from 'react';

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-t from-cyan-400 to-primary text-white text-center relative overflow-hidden">
      {/* Background Image Overlay with Blend Mode */}
      <div className="absolute inset-0 z-0 opacity-10">
          <img 
            src="https://picsum.photos/seed/mapbg/1920/1080" 
            alt="Background Map" 
            className="w-full h-full object-cover"
          />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para Começar?</h2>
        <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
          Crie sua conta gratuitamente e teste por 7 dias sem compromisso. Descubra o poder da geolocalização.
        </p>
        <button className="inline-block bg-white text-primary hover:bg-slate-100 text-lg font-bold py-4 px-10 rounded-lg shadow-lg transition transform hover:-translate-y-1">
          Criar Conta Grátis
        </button>
      </div>
    </section>
  );
};

export default CTA;