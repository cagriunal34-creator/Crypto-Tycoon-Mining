import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import trFallback from '../locales/tr.json';
import enFallback from '../locales/en.json';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  refreshTranslations: () => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'tr';
  });

  const [translations, setTranslations] = useState<Record<string, { tr: string; en: string }>>(() => {
    const cached = localStorage.getItem('app_translations');
    return cached ? JSON.parse(cached) : {};
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSLATIONS)
        .select('id, tr, en');

      if (error) throw error;

      if (data) {
        const transMap: Record<string, { tr: string; en: string }> = {};
        data.forEach(item => {
          transMap[item.id] = { tr: item.tr, en: item.en };
        });
        setTranslations(transMap);
        localStorage.setItem('app_translations', JSON.stringify(transMap));
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    // 1. Try Supabase translations
    if (translations[key]) {
      return translations[key][language] || translations[key]['tr'] || key;
    }

    // 2. Fallback to local JSON files
    const keys = key.split('.');
    let localResult: any = language === 'tr' ? trFallback : enFallback;
    
    for (const k of keys) {
      if (!localResult || localResult[k] === undefined) {
        // Fallback to TR if EN is missing in local files
        if (language === 'en') {
          let trResult: any = trFallback;
          for (const trK of keys) {
            if (!trResult || trResult[trK] === undefined) {
              return key;
            }
            trResult = trResult[trK];
          }
          return trResult;
        }
        return key;
      }
      localResult = localResult[k];
    }

    return localResult;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, refreshTranslations: fetchTranslations, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
