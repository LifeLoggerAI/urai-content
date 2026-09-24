import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_ECOSYSTEM_COLLECTIONS = [
  'users',
  'memories',
  'emotionalFields',
  'lifeMapNodes',
  'generatedAssets',
  'spatialScenes',
  'jobs',
  'contentPacks',
  'b2bAccounts',
  'xrSceneObjects'
] as const;

export const REQUIRED_INTEGRATION_TARGETS = [
  'home',
  'jobs',
  'b2bportal',
  'asset-factory',
  'analytics',
  'communications',
  'privacy',
  'studio',
  'spatial',
  'admin',
  'marketing',
  'investors',
  'foundation',
  'licensing'
] as const;

type JsonSchema = {
  $id?: string;
  required?: unknown;
  properties?: Record<string, unknown>;
  $defs?: Record<string, unknown>;
};

type ValidationResult = {
  ok: boolean;
  errors: string[];
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function enumValues(schemaPart: unknown): string[] {
  const object = asObject(schemaPart);
  const rawEnum = object?.enum;
  return Array.isArray(rawEnum) ? rawEnum.filter((value): value is string => typeof value === 'string') : [];
}

export function loadEcosystemSchema(
  schemaPath = resolve(process.cwd(), 'docs/contracts/URAI_ECOSYSTEM_SCHEMA_V2.json')
): JsonSchema {
  return JSON.parse(readFileSync(schemaPath, 'utf8')) as JsonSchema;
}

export function loadContentEcosystemExtension(
  schemaPath = resolve(process.cwd(), 'docs/contracts/URAI_CONTENT_ECOSYSTEM_EXTENSION_V1.json')
): JsonSchema {
  return JSON.parse(readFileSync(schemaPath, 'utf8')) as JsonSchema;
}

export function validateEcosystemSchema(schema: JsonSchema): ValidationResult {
  const errors: string[] = [];
  if (schema.$id !== 'urai://contracts/ecosystem-schema-v2') {
    errors.push('Unexpected ecosystem base schema id');
  }

  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const collection of REQUIRED_ECOSYSTEM_COLLECTIONS) {
    if (!required.includes(collection)) errors.push(`Missing required ecosystem collection: ${collection}`);
    if (!schema.properties?.[collection]) errors.push(`Missing schema property for ecosystem collection: ${collection}`);
  }

  const defs = schema.$defs ?? {};
  for (const defName of ['user','memory','emotionalField','lifeMapNode','generatedAsset','spatialScene','job','contentPack','b2bAccount','xrSceneObject','governance','provenance','integrationTarget','lifecycleStatus','visibility']) {
    if (!defs[defName]) errors.push(`Missing ecosystem base definition: ${defName}`);
  }

  return { ok: errors.length === 0, errors };
}

export function validateContentEcosystemExtension(schema: JsonSchema): ValidationResult {
  const errors: string[] = [];
  if (schema.$id !== 'urai://contracts/content-ecosystem-extension-v1') {
    errors.push('Unexpected Content ecosystem extension schema id');
  }

  const defs = schema.$defs ?? {};
  for (const defName of ['contentPackGovernance','provenance','integrationTarget','lifecycleStatus','visibility']) {
    if (!defs[defName]) errors.push(`Missing Content extension definition: ${defName}`);
  }

  const targets = enumValues(defs.integrationTarget);
  for (const target of REQUIRED_INTEGRATION_TARGETS) {
    if (!targets.includes(target)) errors.push(`Missing integration target enum: ${target}`);
  }

  for (const status of ['draft','review','approved','published','archived','blocked']) {
    if (!enumValues(defs.lifecycleStatus).includes(status)) errors.push(`Missing lifecycle status enum: ${status}`);
  }

  for (const value of ['public','private','tiered','licensed','internal']) {
    if (!enumValues(defs.visibility).includes(value)) errors.push(`Missing visibility enum: ${value}`);
  }

  return { ok: errors.length === 0, errors };
}

export function validateContentPackContract(candidate: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  for (const field of ['id','version','slug','lifecycleStatus','visibility','integrationTargets','provenance','assetIds']) {
    if (!(field in candidate)) errors.push(`Content pack is missing ${field}`);
  }

  if (typeof candidate.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.slug)) {
    errors.push('Content pack slug must be lowercase kebab-case');
  }
  if (!Array.isArray(candidate.assetIds)) errors.push('Content pack assetIds must be an array');

  if (!Array.isArray(candidate.integrationTargets) || candidate.integrationTargets.length === 0) {
    errors.push('Content pack integrationTargets must be a non-empty array');
  } else {
    for (const target of candidate.integrationTargets) {
      if (typeof target !== 'string' || !(REQUIRED_INTEGRATION_TARGETS as readonly string[]).includes(target)) {
        errors.push(`Unsupported integration target: ${String(target)}`);
      }
    }
  }

  const provenance = asObject(candidate.provenance);
  if (!provenance?.source || typeof provenance.source !== 'string') errors.push('Content pack provenance.source is required');
  if (!provenance?.createdAt || typeof provenance.createdAt !== 'string') errors.push('Content pack provenance.createdAt is required');

  return { ok: errors.length === 0, errors };
}

export function checkEcosystemContracts(): ValidationResult {
  const base = validateEcosystemSchema(loadEcosystemSchema());
  const extension = validateContentEcosystemExtension(loadContentEcosystemExtension());
  const errors = [...base.errors, ...extension.errors];
  return { ok: errors.length === 0, errors };
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === resolve(process.argv[1]) : false;

if (isDirectRun) {
  const result = checkEcosystemContracts();
  if (!result.ok) {
    console.error('URAI ecosystem contract check failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('URAI ecosystem base + Content extension contract check passed.');
}
