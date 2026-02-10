import React from 'react';
import { MapPin, Table2, FileText, Radar, Phone, Zap } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
  iconColorClass: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, colorClass, iconColorClass }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition duration-300 border border-slate-100 group">
    <div className={`w-14 h-14 ${colorClass} rounded-lg flex items-center justify-center mb-6 ${iconColorClass} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">
      {description}
    </p>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <MapPin size={32} />,
      title: "Busca por Endereço",
      description: "Digite qualquer endereço e encontre estabelecimentos próximos automaticamente com precisão de metros.",
      colorClass: "bg-pink-100",
      iconColorClass: "text-pink-500"
    },
    {
      icon: <Table2 size={32} />,
      title: "Exportação Excel",
      description: "Exporte todos os dados em formato CSV compatível com Excel e Google Sheets para suas análises.",
      colorClass: "bg-blue-100",
      iconColorClass: "text-blue-500"
    },
    {
      icon: <FileText size={32} />,
      title: "Relatórios PDF",
      description: "Gere relatórios profissionais em PDF prontos para impressão ou apresentação para stakeholders.",
      colorClass: "bg-purple-100",
      iconColorClass: "text-purple-500"
    },
    {
      icon: <Radar size={32} />,
      title: "Busca por Raio",
      description: "Defina o raio de busca em metros e encontre tudo ao redor do seu ponto de interesse instantaneamente.",
      colorClass: "bg-red-100",
      iconColorClass: "text-red-500"
    },
    {
      icon: <Phone size={32} />,
      title: "Dados Completos",
      description: "Acesse telefone, endereço completo, avaliações, horários e muito mais informações detalhadas.",
      colorClass: "bg-indigo-100",
      iconColorClass: "text-indigo-500"
    },
    {
      icon: <Zap size={32} />,
      title: "Resultados Rápidos",
      description: "Busca instantânea com tecnologia PostGIS otimizada para entregar resultados em milissegundos.",
      colorClass: "bg-orange-100",
      iconColorClass: "text-orange-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Recursos Poderosos</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Tudo que você precisa para análise geográfica em uma única plataforma intuitiva.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;