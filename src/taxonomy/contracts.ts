export type TaxonomyTermStatus = 'active' | 'deprecated';

export type TaxonomyTerm = {
  id: string;
  slug: string;
  label: string;
  parentId: string | null;
  aliases: string[];
  status: TaxonomyTermStatus;
  replacementTermId?: string | null;
};

export type ContentRelationshipType =
  | 'related'
  | 'part_of'
  | 'derived_from'
  | 'requires'
  | 'supersedes'
  | 'localized_variant';

export type ContentRelationship = {
  id: string;
  fromId: string;
  toId: string;
  type: ContentRelationshipType;
  provenanceRecordId: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateTaxonomyTerms(terms: TaxonomyTerm[]): TaxonomyTerm[] {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const term of terms) {
    if (!term.id || !term.label || !slugPattern.test(term.slug)) {
      throw new Error('Taxonomy term identity, label and kebab-case slug are required');
    }
    if (ids.has(term.id)) throw new Error('Duplicate taxonomy term id: ' + term.id);
    if (slugs.has(term.slug)) throw new Error('Duplicate taxonomy term slug: ' + term.slug);
    ids.add(term.id);
    slugs.add(term.slug);
  }

  for (const term of terms) {
    if (term.parentId && !ids.has(term.parentId)) {
      throw new Error('Unknown taxonomy parent: ' + term.parentId);
    }
    if (term.parentId === term.id) throw new Error('Taxonomy term cannot parent itself');
    if (term.replacementTermId && !ids.has(term.replacementTermId)) {
      throw new Error('Unknown taxonomy replacement: ' + term.replacementTermId);
    }
    if (term.replacementTermId === term.id) throw new Error('Taxonomy term cannot replace itself');
  }

  const byId = new Map(terms.map((term) => [term.id, term] as const));
  for (const term of terms) {
    const seen = new Set<string>();
    let current: TaxonomyTerm | undefined = term;
    while (current?.parentId) {
      if (seen.has(current.parentId)) throw new Error('Taxonomy parent cycle detected at: ' + current.parentId);
      seen.add(current.parentId);
      current = byId.get(current.parentId);
    }
  }

  return terms.map((term) => ({
    ...term,
    aliases: [...new Set(term.aliases.map((alias) => alias.trim()).filter(Boolean))].sort(),
  }));
}

export function validateContentRelationships(
  relationships: ContentRelationship[],
): ContentRelationship[] {
  const ids = new Set<string>();
  return relationships.map((relationship) => {
    if (!relationship.id || !relationship.fromId || !relationship.toId || !relationship.provenanceRecordId) {
      throw new Error('Content relationship identity and provenance are required');
    }
    if (relationship.fromId === relationship.toId) {
      throw new Error('Content relationship cannot target itself');
    }
    if (ids.has(relationship.id)) throw new Error('Duplicate content relationship id: ' + relationship.id);
    ids.add(relationship.id);
    return { ...relationship };
  });
}
