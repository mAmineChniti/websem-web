import { habitationsListSchema } from '@/lib/schemas/habitations';
import { runSparql } from '@/lib/services/sparql';
import {
  buildHabitationLabel,
  getShortLocation,
  slugify,
  type CreateHabitationPayload,
  type Habitation,
  type HabitationStats,
  type HabitationsFilterParams,
  type PaginatedHabitations,
  type UpdateHabitationPayload,
} from '@/lib/types/habitations';
import { isSparqlAskResult, isSparqlSelectResult } from '@/lib/types/sparql';

const AS = [
  'http:',
  '//www.semanticweb.org/asus/ontologies/2026/8/Assuarnce_et_Gestion_des_Sinistres#',
].join('');
const ONT = [
  'http:',
  '//www.semanticweb.org/asus/ontologies/2026/8/untitled-ontology-5#',
].join('');
const RDFS = ['http:', '//www.w3.org/2000/01/rdf-schema#'].join('');
const XSD = ['http:', '//www.w3.org/2001/XMLSchema#'].join('');
const OWL = ['http:', '//www.w3.org/2002/07/owl#'].join('');

function escapeSparql(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`);
}

const HABITATION_TYPES = new Set(['Maison', 'Appartement', 'Studio', 'Villa']);

function assertSafeIdentifier(value: string, field: string): void {
  if (!/^[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
}

async function safeRunQuery(query: string) {
  try {
    return await runSparql(query);
  } catch {
    return;
  }
}

async function generateUniqueHabitationId(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 1;
  while (counter <= 50) {
    const askQuery = `
      PREFIX as: <${AS}>
      ASK { <${AS}${candidate}> ?p ?o. }
    `;
    const res = await safeRunQuery(askQuery);
    if (res && isSparqlAskResult(res) && !res.boolean) {
      return candidate;
    }
    if (!res) {
      return counter === 1 ? candidate : `${baseSlug}_${counter}`;
    }
    counter++;
    candidate = `${baseSlug}_${counter}`;
  }
  return `${baseSlug}_${counter}`;
}

export async function listHabitations(
  assureId?: string
): Promise<Habitation[]> {
  const ownerFilter = assureId
    ? `?habitation <${AS}estPossedeePar> <${AS}${escapeSparql(assureId)}>. `
    : '';
  const query = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?habitation ?label ?type ?adresseBien ?superficie ?valeurBien ?assure WHERE {
      ?habitation a ?type.
      VALUES ?type { ont:Maison ont:Appartement ont:Studio ont:Villa }
      OPTIONAL { ?habitation rdfs:label ?label. }
      OPTIONAL { ?habitation as:adresseBien ?adresseBien. }
      OPTIONAL { ?habitation as:superficie ?superficie. }
      OPTIONAL { ?habitation as:valeurBien ?valeurBien. }
      OPTIONAL { ?habitation as:estPossedeePar ?assure. }
      ${ownerFilter}
    }`;
  const result = await runSparql(query);
  if (!isSparqlSelectResult(result)) return [];
  return habitationsListSchema.parse(
    result.results.flatMap((row) => {
      const uri = row.habitation;
      const typeUri = row.type;
      const type = typeUri?.split('#').at(-1);
      if (
        !uri ||
        !type ||
        !['Maison', 'Appartement', 'Studio', 'Villa'].includes(type)
      ) {
        return [];
      }
      const rawAdresse = row.adresseBien ?? '';
      const fallbackLabel = buildHabitationLabel(type, rawAdresse);
      return [
        {
          id: uri.split('#').at(-1) ?? uri,
          label: row.label || fallbackLabel,
          type: type as Habitation['type'],
          adresseBien: rawAdresse,
          superficie: Number.parseFloat(row.superficie ?? '0'),
          valeurBien: row.valeurBien
            ? Number.parseFloat(row.valeurBien)
            : undefined,
          assure: row.assure?.split('#').at(-1) ?? assureId ?? '',
        },
      ];
    })
  );
}

export async function createHabitation(
  payload: CreateHabitationPayload
): Promise<void> {
  if (!HABITATION_TYPES.has(payload.type)) {
    throw new Error('Invalid habitation type');
  }
  assertSafeIdentifier(payload.assure, 'assure');
  const label =
    payload.label || buildHabitationLabel(payload.type, payload.adresseBien);
  const baseSlug = slugify(label) || payload.type;
  const id = await generateUniqueHabitationId(baseSlug);

  const escapedAdresseBien = escapeSparql(payload.adresseBien);
  const valeurBienTriple =
    payload.valeurBien === undefined
      ? ''
      : `as:valeurBien "${payload.valeurBien}"^^<${XSD}float>;`;

  const query = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    PREFIX owl: <${OWL}>
    INSERT DATA {
      as:${id} a ont:${payload.type}, owl:NamedIndividual;
        rdfs:label "${escapeSparql(label)}";
        as:adresseBien "${escapedAdresseBien}";
        as:superficie "${payload.superficie}"^^<${XSD}float>;
        ${valeurBienTriple}
        as:estPossedeePar <${AS}${escapeSparql(payload.assure)}>.
    }`;
  await runSparql(query);
}

export async function updateHabitation(
  id: string,
  payload: UpdateHabitationPayload
): Promise<void> {
  assertSafeIdentifier(id, 'habitation id');
  if (payload.type && !HABITATION_TYPES.has(payload.type)) {
    throw new Error('Invalid habitation type');
  }
  if (payload.assure) assertSafeIdentifier(payload.assure, 'assure');
  const subject = `<${AS}${escapeSparql(id)}>`;

  const deletes: string[] = [];
  const whereClauses: string[] = [];

  if (payload.type) {
    deletes.push(`${subject} a ?oldType.`);
    whereClauses.push(
      `${subject} a ?oldType.`,
      `FILTER(?oldType != <${OWL}NamedIndividual>)`
    );
  }
  if (payload.adresseBien) {
    deletes.push(`${subject} as:adresseBien ?oldAdresseBien.`);
    whereClauses.push(
      `OPTIONAL { ${subject} as:adresseBien ?oldAdresseBien. }`
    );
  }
  if (payload.superficie !== undefined) {
    deletes.push(`${subject} as:superficie ?oldSuperficie.`);
    whereClauses.push(`OPTIONAL { ${subject} as:superficie ?oldSuperficie. }`);
  }
  if (payload.valeurBien !== undefined) {
    deletes.push(`${subject} as:valeurBien ?oldValeurBien.`);
    whereClauses.push(`OPTIONAL { ${subject} as:valeurBien ?oldValeurBien. }`);
  }
  if (payload.assure) {
    deletes.push(`${subject} as:estPossedeePar ?oldAssure.`);
    whereClauses.push(`OPTIONAL { ${subject} as:estPossedeePar ?oldAssure. }`);
  }

  // Mise à jour du label si le type ou l'adresse change
  const newLabel =
    payload.label ||
    (payload.type && payload.adresseBien
      ? buildHabitationLabel(payload.type, payload.adresseBien)
      : undefined);

  if (newLabel) {
    deletes.push(`${subject} rdfs:label ?oldLabel.`);
    whereClauses.push(`OPTIONAL { ${subject} rdfs:label ?oldLabel. }`);
  }

  const inserts: string[] = [];
  if (payload.type)
    inserts.push(`${subject} a ont:${payload.type}, <${OWL}NamedIndividual>.`);
  if (newLabel) {
    inserts.push(`${subject} rdfs:label "${escapeSparql(newLabel)}".`);
  }
  if (payload.adresseBien) {
    inserts.push(
      `${subject} as:adresseBien "${escapeSparql(payload.adresseBien)}".`
    );
  }
  if (payload.superficie !== undefined) {
    inserts.push(
      `${subject} as:superficie "${payload.superficie}"^^<${XSD}float>.`
    );
  }
  if (payload.valeurBien !== undefined) {
    inserts.push(
      `${subject} as:valeurBien "${payload.valeurBien}"^^<${XSD}float>.`
    );
  }
  if (payload.assure) {
    inserts.push(
      `${subject} as:estPossedeePar <${AS}${escapeSparql(payload.assure)}>.`
    );
  }

  const query = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    DELETE {
      ${deletes.join('\n      ')}
    }
    INSERT {
      ${inserts.join('\n      ')}
    }
    WHERE {
      ${whereClauses.join('\n      ')}
    }`;
  await runSparql(query);
}

export async function deleteHabitation(id: string): Promise<void> {
  assertSafeIdentifier(id, 'habitation id');
  const subject = `<${AS}${escapeSparql(id)}>`;
  await runSparql(`
    PREFIX as: <${AS}>
    DELETE WHERE { ${subject} ?property ?value. }`);
  await runSparql(`
    PREFIX as: <${AS}>
    DELETE WHERE { ?subject ?property ${subject}. }`);
}

export async function getHabitationStats(
  assureId?: string
): Promise<HabitationStats> {
  if (assureId) assertSafeIdentifier(assureId, 'assure id');
  const ownerFilter = assureId
    ? `?habitation as:estPossedeePar <${AS}${escapeSparql(assureId)}>.`
    : '';
  const query = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX xsd: <${XSD}>
    SELECT
      (COUNT(DISTINCT ?habitation) AS ?count)
      (AVG(?decSuperficie) AS ?moyenne)
      (SUM(?decValeurBien) AS ?total)
      (MAX(?decValeurBien) AS ?max)
    WHERE {
      ?habitation a ?type.
      VALUES ?type { ont:Maison ont:Appartement ont:Studio ont:Villa }
      OPTIONAL {
        ?habitation as:superficie ?rawSup.
        BIND(xsd:decimal(STR(?rawSup)) AS ?decSuperficie)
      }
      OPTIONAL {
        ?habitation as:valeurBien ?rawVal.
        BIND(xsd:decimal(STR(?rawVal)) AS ?decValeurBien)
      }
      ${ownerFilter}
    }`;
  const result = await safeRunQuery(query);
  if (!result || !isSparqlSelectResult(result) || result.results.length === 0) {
    return {
      totalCount: 0,
      avgSuperficie: 0,
      sumValeurBien: 0,
      maxValeurBien: 0,
    };
  }
  const row = result.results[0];
  const count = Number(row?.count ?? 0);
  const moyenne = Number(row?.moyenne ?? 0);
  const total = Number(row?.total ?? 0);
  const max = Number(row?.max ?? 0);
  return {
    totalCount: Number.isNaN(count) ? 0 : count,
    avgSuperficie: Number.isNaN(moyenne) ? 0 : Math.round(moyenne * 10) / 10,
    sumValeurBien: Number.isNaN(total) ? 0 : Math.round(total),
    maxValeurBien: Number.isNaN(max) ? 0 : Math.round(max),
  };
}

export async function queryHabitations(
  params: HabitationsFilterParams = {}
): Promise<PaginatedHabitations> {
  if (params.assureId) assertSafeIdentifier(params.assureId, 'assure id');
  const {
    assureId,
    search,
    type,
    superficieMin,
    superficieMax,
    valeurBienMin,
    valeurBienMax,
    sortBy = 'adresseBien',
    sortOrder = 'asc',
    page = 1,
    pageSize = 6,
  } = params;

  const whereClauses: string[] = [
    '?habitation a ?type.',
    type && type !== 'Tous'
      ? `VALUES ?type { ont:${escapeSparql(type)} }`
      : 'VALUES ?type { ont:Maison ont:Appartement ont:Studio ont:Villa }',
    'OPTIONAL { ?habitation rdfs:label ?label. }',
    'OPTIONAL { ?habitation as:adresseBien ?adresseBien. }',
    'OPTIONAL { ?habitation as:superficie ?superficie. }',
    'OPTIONAL { ?habitation as:valeurBien ?valeurBien. }',
    'OPTIONAL { ?habitation as:estPossedeePar ?assure. }',
  ];

  if (assureId) {
    whereClauses.push(
      `?habitation as:estPossedeePar <${AS}${escapeSparql(assureId)}>.`
    );
  }

  if (search && search.trim()) {
    const escapedSearch = escapeSparql(search.trim());
    whereClauses.push(
      `FILTER(CONTAINS(LCASE(COALESCE(?label, "")), LCASE("${escapedSearch}")) || CONTAINS(LCASE(COALESCE(?adresseBien, "")), LCASE("${escapedSearch}")) || CONTAINS(LCASE(STR(?type)), LCASE("${escapedSearch}")))`
    );
  }

  if (superficieMin !== undefined && !Number.isNaN(superficieMin)) {
    whereClauses.push(
      `FILTER(BOUND(?superficie) && xsd:decimal(STR(?superficie)) >= ${superficieMin})`
    );
  }

  if (superficieMax !== undefined && !Number.isNaN(superficieMax)) {
    whereClauses.push(
      `FILTER(BOUND(?superficie) && xsd:decimal(STR(?superficie)) <= ${superficieMax})`
    );
  }

  if (valeurBienMin !== undefined && !Number.isNaN(valeurBienMin)) {
    whereClauses.push(
      `FILTER(BOUND(?valeurBien) && xsd:decimal(STR(?valeurBien)) >= ${valeurBienMin})`
    );
  }

  if (valeurBienMax !== undefined && !Number.isNaN(valeurBienMax)) {
    whereClauses.push(
      `FILTER(BOUND(?valeurBien) && xsd:decimal(STR(?valeurBien)) <= ${valeurBienMax})`
    );
  }

  // 1. Compte total en SPARQL pour la pagination
  const countQuery = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    PREFIX xsd: <${XSD}>
    SELECT (COUNT(DISTINCT ?habitation) AS ?count) WHERE {
      ${whereClauses.join('\n      ')}
    }`;

  const countResult = await safeRunQuery(countQuery);
  const total =
    countResult && isSparqlSelectResult(countResult)
      ? Number(countResult.results[0]?.count ?? 0)
      : 0;

  // 2. Requête paginée avec ORDER BY, LIMIT, OFFSET
  const orderDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  let orderExpression = 'ASC(?habitation)';
  switch (sortBy) {
    case 'superficie': {
      orderExpression = `${orderDir}(xsd:decimal(STR(?superficie)))`;

      break;
    }
    case 'valeurBien': {
      orderExpression = `${orderDir}(COALESCE(xsd:decimal(STR(?valeurBien)), 0))`;

      break;
    }
    case 'adresseBien': {
      orderExpression = `${orderDir}(LCASE(COALESCE(STR(?adresseBien), "")))`;

      break;
    }
    // No default
  }

  const offset = Math.max(0, (page - 1) * pageSize);

  const selectQuery = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    PREFIX xsd: <${XSD}>
    SELECT ?habitation ?label ?type ?adresseBien ?superficie ?valeurBien ?assure WHERE {
      ${whereClauses.join('\n      ')}
    }
    ORDER BY ${orderExpression}
    LIMIT ${pageSize}
    OFFSET ${offset}`;

  const result = await safeRunQuery(selectQuery);
  if (!result || !isSparqlSelectResult(result)) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      sparqlQuery: selectQuery.trim(),
    };
  }

  const items = habitationsListSchema.parse(
    result.results.flatMap((row) => {
      const uri = row.habitation;
      const typeUri = row.type;
      const typeVal = typeUri?.split('#').at(-1);
      if (
        !uri ||
        !typeVal ||
        !['Maison', 'Appartement', 'Studio', 'Villa'].includes(typeVal)
      ) {
        return [];
      }
      const rawAdresse = row.adresseBien ?? '';
      const fallbackLabel = buildHabitationLabel(typeVal, rawAdresse);
      return [
        {
          id: uri.split('#').at(-1) ?? uri,
          label: row.label || fallbackLabel,
          type: typeVal as Habitation['type'],
          adresseBien: rawAdresse,
          superficie: Number.parseFloat(row.superficie ?? '0'),
          valeurBien: row.valeurBien
            ? Number.parseFloat(row.valeurBien)
            : undefined,
          assure: row.assure?.split('#').at(-1) ?? assureId ?? '',
        },
      ];
    })
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    sparqlQuery: selectQuery.trim(),
  };
}

/**
 * Synchronise les rdfs:label manquants pour les habitations dans le triplestore.
 * Format demandé : "<Type> <adresse courte>" (ex: "Maison Bardo").
 * Si deux labels sont identiques, ajoute un suffixe " 2", " 3".
 */
export async function syncMissingHabitationLabels(): Promise<number> {
  const findQuery = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?habitation ?type ?adresseBien WHERE {
      ?habitation a ?type.
      VALUES ?type { ont:Maison ont:Appartement ont:Studio ont:Villa }
      OPTIONAL { ?habitation as:adresseBien ?adresseBien. }
      FILTER NOT EXISTS { ?habitation rdfs:label ?existingLabel }
    }`;

  const findResult = await safeRunQuery(findQuery);
  if (
    !findResult ||
    !isSparqlSelectResult(findResult) ||
    findResult.results.length === 0
  ) {
    return 0;
  }

  const existingQuery = `
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?label WHERE {
      ?habitation a ?type.
      VALUES ?type { ont:Maison ont:Appartement ont:Studio ont:Villa }
      ?habitation rdfs:label ?label.
    }`;
  const existingResult = await safeRunQuery(existingQuery);
  const knownLabels = new Set<string>();
  if (existingResult && isSparqlSelectResult(existingResult)) {
    for (const row of existingResult.results) {
      if (row.label) knownLabels.add(row.label.trim().toLowerCase());
    }
  }

  const inserts: string[] = [];
  for (const row of findResult.results) {
    const uri = row.habitation;
    if (!uri) continue;
    const typeVal = row.type?.split('#').at(-1) || 'Habitation';
    const shortLoc = getShortLocation(row.adresseBien ?? '');
    const baseLabel = shortLoc ? `${typeVal} ${shortLoc}` : typeVal;

    let candidate = baseLabel;
    let counter = 2;
    while (knownLabels.has(candidate.toLowerCase())) {
      candidate = `${baseLabel} ${counter}`;
      counter += 1;
    }
    knownLabels.add(candidate.toLowerCase());

    const subject = uri.startsWith('http')
      ? `<${uri}>`
      : `<${AS}${escapeSparql(uri)}>`;
    inserts.push(`${subject} rdfs:label "${escapeSparql(candidate)}".`);
  }

  if (inserts.length === 0) return 0;

  const updateQuery = `
    PREFIX rdfs: <${RDFS}>
    INSERT DATA {
      ${inserts.join('\n      ')}
    }`;
  await runSparql(updateQuery);
  return inserts.length;
}

export async function syncMissingLabels(): Promise<number> {
  return syncMissingHabitationLabels();
}
