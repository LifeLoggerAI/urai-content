import type { TranslationRecord } from './contracts.js';
import { URAI_GOVERNED_LOCALES, type UraiLocale } from './uraiLocales.js';

export type LocaleCoverage = {
  locale: UraiLocale;
  requiredEntities: number;
  translatedEntities: number;
  approvedEntities: number;
  missingEntityIds: string[];
  staleEntityIds: string[];
  productionReady: boolean;
};

export function analyzeLocaleCoverage(
  requiredEntityIds: string[],
  records: TranslationRecord[],
  sourceVersions: Record<string,{version:string;checksum:string}>,
): LocaleCoverage[] {
  const required=[...new Set(requiredEntityIds)].sort();
  return URAI_GOVERNED_LOCALES.map((locale)=>{
    if(locale==='en'){
      return {locale,requiredEntities:required.length,translatedEntities:required.length,approvedEntities:required.length,missingEntityIds:[],staleEntityIds:[],productionReady:true};
    }
    const byEntity=new Map(records.filter((r)=>r.locale===locale).map((r)=>[r.entityId,r] as const));
    const missing=required.filter((id)=>!byEntity.has(id));
    const stale=required.filter((id)=>{
      const r=byEntity.get(id); const source=sourceVersions[id];
      return Boolean(r && source && (r.sourceVersion!==source.version || r.sourceChecksum!==source.checksum));
    });
    const translated=required.filter((id)=>byEntity.has(id));
    const approved=translated.filter((id)=>byEntity.get(id)?.status==='approved' && !stale.includes(id));
    return {
      locale, requiredEntities:required.length, translatedEntities:translated.length, approvedEntities:approved.length,
      missingEntityIds:missing, staleEntityIds:stale,
      productionReady:required.length>0 && missing.length===0 && stale.length===0 && approved.length===required.length
    };
  });
}
