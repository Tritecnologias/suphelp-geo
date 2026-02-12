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
  copyrightText: 'Todos os direitos reservados.'
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
        const { header, hero, footer } = data.data;
        
        setConfig({
          siteName: header?.site_name?.value || defaultConfig.siteName,
          slogan: header?.slogan?.value || defaultConfig.slogan,
          description: hero?.description?.value || defaultConfig.description,
          email: footer?.contact_email?.value || defaultConfig.email,
          phone: footer?.contact_phone?.value || defaultConfig.phone,
          logoUrl: header?.logo_url?.value,
          copyrightText: footer?.copyright_text?.value || defaultConfig.copyrightText
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
