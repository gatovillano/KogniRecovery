/**
 * Servicio de Búsqueda Web y Scraping para LÚA
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  isTrusted: boolean;
}

export class SearchService {
  private apiKey: string | undefined;
  
  // Lista de dominios confiables (Whitelist científica/médica)
  private readonly TRUSTED_DOMAINS = [
    'nih.gov', 'who.int', 'mayoclinic.org', 'sciencedirect.com', 
    'pubmed', 'thelancet.com', 'medscape.com', 'cdc.gov',
    'paho.org', 'scielo.org', 'redalyc.org', 'scholar.google'
  ];

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
  }

  /**
   * Realiza una búsqueda web y califica la confiabilidad de los resultados
   */
  public async searchScientific(query: string): Promise<SearchResult[]> {
    if (!this.apiKey || this.apiKey.includes('xxxx')) {
      console.warn('⚠️ TAVILY_API_KEY no configurada o inválida. Búsqueda web desactivada.');
      return [];
    }

    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.apiKey,
        query: query,
        search_depth: "basic",
        max_results: 5
      });

      const results: any[] = response.data.results || [];

      return results.map(r => {
        const urlLower = r.url.toLowerCase();
        const isTrusted = this.TRUSTED_DOMAINS.some(domain => urlLower.includes(domain));
        
        return {
          title: r.title,
          url: r.url,
          content: r.content,
          score: isTrusted ? 1.0 : 0.4,
          isTrusted
        };
      }).sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('❌ Error en búsqueda web (axios/tavily):', error);
      return [];
    }
  }

  /**
   * Realiza scraping de un sitio específico para obtener más contexto
   */
  public async scrapeUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      const $ = cheerio.load(response.data);
      $('script, style, nav, header, footer').remove();
      const mainContent = $('main, article, .content, #content').text() || $('body').text();
      return mainContent.replace(/\s+/g, ' ').trim().substring(0, 3000);

    } catch (error) {
      console.error(`❌ Error al scrapear ${url}:`, error);
      return '';
    }
  }
}

export const searchService = new SearchService();
