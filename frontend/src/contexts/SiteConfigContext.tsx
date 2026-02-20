// Contexto para configurações do site
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SiteConfig {
  siteName: string;
  slogan: string;
  description: string;
  email: string;
  phone: string;
  logoUrl?: string;
  copyrightText?: string;
  hero?: {
    titleLine1?: string;
    titleLine2?: string;
    button1Text?: string;
    button2Text?: string;
    stat1Number?: string;
    stat1Text?: string;
    stat2Number?: string;
    stat2Text?: string;
    stat3Number?: string;
    stat3Text?: string;
  };
  features?: {
    title?: string;
    subtitle?: string;
    cards?: Array<{
      icon?: string;
      title?: string;
      text?: string;
    }>;
  };
  pricing?: {
    title?: string;
    subtitle?: string;
    plans?: Array<{
      name?: string;
      price?: string;
      period?: string;
      description?: string;
      featuresIncluded?: string;
      featuresExcluded?: string;
    }>;
  };
}

interface SiteConfigContextType {
  config: SiteConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const defaultConfig: SiteConfig = {
  siteName: 'SupHelp Geo',
  slogan: 'Geolocalização Inteligente',
  description: 'Sistema inteligente de geolocalização para encontrar farmácias, padarias, mercados e muito mais. Exporte dados em Excel e PDF com facilidade.',
  email: 'comercial@suphelp.com.br',
  phone: '(11) 9999-9999',
  copyrightText: `© ${new Date().getFullYear()} SupHelp Geo. Todos os direitos reservados.`
};

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: defaultConfig,
  loading: false,
  refreshConfig: async () => {}
});

export const useSiteConfig = () => useContext(SiteConfigContext);

interface SiteConfigProviderProps {
  children: ReactNode;
}

export const SiteConfigProvider: React.FC<SiteConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cms/config');
      const data = await response.json();
      
      if (data.success && data.data) {
        const { header, hero, footer, features, pricing } = data.data;
        
        setConfig({
          siteName: header?.site_name?.value || defaultConfig.siteName,
          slogan: header?.slogan?.value || defaultConfig.slogan,
          description: hero?.description?.value || defaultConfig.description,
          email: footer?.contact_email?.value || defaultConfig.email,
          phone: footer?.contact_phone?.value || defaultConfig.phone,
          logoUrl: header?.logo_url?.value,
          copyrightText: footer?.copyright_text?.value || defaultConfig.copyrightText,
          hero: {
            titleLine1: hero?.title_line1?.value,
            titleLine2: hero?.title_line2?.value,
            button1Text: hero?.button_1_text?.value,
            button2Text: hero?.button_2_text?.value,
            stat1Number: hero?.stat_1_number?.value,
            stat1Text: hero?.stat_1_text?.value,
            stat2Number: hero?.stat_2_number?.value,
            stat2Text: hero?.stat_2_text?.value,
            stat3Number: hero?.stat_3_number?.value,
            stat3Text: hero?.stat_3_text?.value
          },
          features: {
            title: features?.title?.value,
            subtitle: features?.subtitle?.value,
            cards: [1, 2, 3, 4].map(i => ({
              icon: features?.[`card_${i}_icon`]?.value,
              title: features?.[`card_${i}_title`]?.value,
              text: features?.[`card_${i}_text`]?.value
            }))
          },
          pricing: {
            title: pricing?.title?.value,
            subtitle: pricing?.subtitle?.value,
            plans: [1, 2, 3].map(i => ({
              name: pricing?.[`plan_${i}_name`]?.value,
              price: pricing?.[`plan_${i}_price`]?.value,
              period: pricing?.[`plan_${i}_period`]?.value,
              description: pricing?.[`plan_${i}_description`]?.value,
              featuresIncluded: pricing?.[`plan_${i}_features_included`]?.value,
              featuresExcluded: pricing?.[`plan_${i}_features_excluded`]?.value
            }))
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do site:', error);
      // Mantém configurações padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    
    // Escutar evento de atualização do CMS
    const handleConfigUpdate = () => {
      console.log('🔄 Recarregando configurações do CMS...');
      loadConfig();
    };
    
    window.addEventListener('cms-config-updated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('cms-config-updated', handleConfigUpdate);
    };
  }, []);

  const refreshConfig = async () => {
    await loadConfig();
  };

  return (
    <SiteConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};
