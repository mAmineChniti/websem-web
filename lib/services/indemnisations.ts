import { indemnisationsListSchema } from '@/lib/schemas/indemnisations';
import { runSparql } from '@/lib/services/sparql';
import { syncMissingHabitationLabels } from '@/lib/services/habitations';
import { slugify, getShortLocation } from '@/lib/types/habitations';
import {
  buildIndemnisationLabel,
  type CreateIndemnisationPayload,
  type Indemnisation,
  type IndemnisationStats,
  type IndemnisationsFilterParams,
  type PaginatedIndemnisations,
  type UpdateIndemnisationPayload,
} from '@/lib/types/indemnisations';
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

function escapeSparql(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`);
}

async function safeRunQuery(query: string) {
  try {
    return await runSparql(query);
  } catch {
    return;
  }
}

async function generateUniqueIndemnisationId(
  baseSlug: string
): Promise<string> {
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

export async function listIndemnisations(
  assureId?: string
): Promise<Indemnisation[]> {
  const ownerFilter = assureId
    ? `?habitation as:estPossedeePar <${AS}${escapeSparql(assureId)}>.`
    : '';
  const query = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?indemnisation ?label ?type ?montantIndemnise ?tauxIndemnisation ?habitation ?habitationLabel ?habitationAdresse ?assure ?motifRefus WHERE {
      ?indemnisation a ?type.
      VALUES ?type { ont:IndemnisationTotale ont:IndemnisationPartielle ont:IndemnisationRefusee }
      OPTIONAL { ?indemnisation rdfs:label ?label. }
      OPTIONAL { ?indemnisation as:montantIndemnise ?montantIndemnise. }
      OPTIONAL { ?indemnisation as:tauxIndemnisation ?tauxIndemnisation. }
      OPTIONAL { ?indemnisation as:concerneHabitation ?habitation. }
      OPTIONAL { ?habitation rdfs:label ?habitationLabel. }
      OPTIONAL { ?habitation as:adresseBien ?habitationAdresse. }
      OPTIONAL { ?indemnisation as:motifRefus ?motifRefus. }
      OPTIONAL {
        ?habitation as:estPossedeePar ?assure.
      }
      ${ownerFilter}
    }`;
  const result = await runSparql(query);
  if (!isSparqlSelectResult(result)) return [];
  return indemnisationsListSchema.parse(
    result.results.flatMap((row) => {
      const uri = row.indemnisation;
      const type = row.type?.split('#').at(-1);
      if (!uri || !type) return [];

      const habitationUri = row.habitation?.split('#').at(-1) ?? '';
      const habitationLocation =
        row.habitationLabel || getShortLocation(row.habitationAdresse ?? '');
      const fallbackLabel = buildIndemnisationLabel(
        type as Indemnisation['type'],
        habitationLocation
      );

      return [
        {
          id: uri.split('#').at(-1) ?? uri,
          label: row.label || fallbackLabel,
          type: type as Indemnisation['type'],
          montantIndemnise: Number.parseFloat(row.montantIndemnise ?? '0'),
          tauxIndemnisation: Number.parseFloat(row.tauxIndemnisation ?? '0'),
          habitation: habitationUri,
          habitationLabel: row.habitationLabel || undefined,
          assure: row.assure?.split('#').at(-1) ?? undefined,
          motifRefus: row.motifRefus || undefined,
        },
      ];
    })
  );
}

export async function createIndemnisation(
  payload: CreateIndemnisationPayload
): Promise<void> {
  let habitationLocation = payload.habitationLabel
    ? getShortLocation(payload.habitationLabel)
    : '';

  // Si non fourni, on extrait la localisation de l'habitation via SPARQL
  if (!habitationLocation && payload.habitation) {
    const infoQuery = `
      PREFIX as: <${AS}>
      PREFIX rdfs: <${RDFS}>
      SELECT ?label ?adresseBien WHERE {
        <${AS}${escapeSparql(payload.habitation)}> a ?type.
        OPTIONAL { <${AS}${escapeSparql(payload.habitation)}> rdfs:label ?label. }
        OPTIONAL { <${AS}${escapeSparql(payload.habitation)}> as:adresseBien ?adresseBien. }
      } LIMIT 1
    `;
    const res = await safeRunQuery(infoQuery);
    if (res && isSparqlSelectResult(res) && res.results[0]) {
      const row = res.results[0];
      habitationLocation = row.label || getShortLocation(row.adresseBien ?? '');
    }
  }

  const label =
    payload.label || buildIndemnisationLabel(payload.type, habitationLocation);
  const baseSlug = slugify(label) || 'Indemnisation';
  const id = await generateUniqueIndemnisationId(baseSlug);

  const motifTriple = payload.motifRefus
    ? `as:motifRefus "${escapeSparql(payload.motifRefus)}";`
    : '';

  await runSparql(`
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    INSERT DATA {
      as:${id} a ont:${payload.type};
        rdfs:label "${escapeSparql(label)}";
        as:montantIndemnise "${payload.montantIndemnise}"^^<https://www.w3.org/2001/XMLSchema#float>;
        as:tauxIndemnisation "${payload.tauxIndemnisation}"^^<https://www.w3.org/2001/XMLSchema#float>;
        ${motifTriple}
        as:concerneHabitation <${AS}${escapeSparql(payload.habitation)}>.
    }`);
}

export async function updateIndemnisation(
  id: string,
  payload: UpdateIndemnisationPayload
): Promise<void> {
  const subject = `<${AS}${escapeSparql(id)}>`;

  const deletes: string[] = [];
  const whereClauses: string[] = [];

  if (payload.type) {
    deletes.push(`${subject} a ?oldType.`);
    whereClauses.push(`OPTIONAL { ${subject} a ?oldType. }`);
  }
  if (payload.montantIndemnise !== undefined) {
    deletes.push(`${subject} as:montantIndemnise ?oldMontant.`);
    whereClauses.push(
      `OPTIONAL { ${subject} as:montantIndemnise ?oldMontant. }`
    );
  }
  if (payload.tauxIndemnisation !== undefined) {
    deletes.push(`${subject} as:tauxIndemnisation ?oldTaux.`);
    whereClauses.push(`OPTIONAL { ${subject} as:tauxIndemnisation ?oldTaux. }`);
  }
  if (payload.habitation) {
    deletes.push(`${subject} as:concerneHabitation ?oldHabitation.`);
    whereClauses.push(
      `OPTIONAL { ${subject} as:concerneHabitation ?oldHabitation. }`
    );
  }
  if (payload.motifRefus !== undefined) {
    deletes.push(`${subject} as:motifRefus ?oldMotif.`);
    whereClauses.push(`OPTIONAL { ${subject} as:motifRefus ?oldMotif. }`);
  }

  // Si le type ou l'habitation change, recalculer le label
  const newLabel =
    payload.label ||
    (payload.type
      ? buildIndemnisationLabel(payload.type, payload.habitationLabel)
      : undefined);

  if (newLabel) {
    deletes.push(`${subject} rdfs:label ?oldLabel.`);
    whereClauses.push(`OPTIONAL { ${subject} rdfs:label ?oldLabel. }`);
  }

  const inserts: string[] = [];
  if (payload.type) {
    inserts.push(`${subject} a ont:${payload.type}.`);
  }
  if (newLabel) {
    inserts.push(`${subject} rdfs:label "${escapeSparql(newLabel)}".`);
  }
  if (payload.montantIndemnise !== undefined) {
    inserts.push(
      `${subject} as:montantIndemnise "${payload.montantIndemnise}"^^<https://www.w3.org/2001/XMLSchema#float>.`
    );
  }
  if (payload.tauxIndemnisation !== undefined) {
    inserts.push(
      `${subject} as:tauxIndemnisation "${payload.tauxIndemnisation}"^^<https://www.w3.org/2001/XMLSchema#float>.`
    );
  }
  if (payload.habitation) {
    inserts.push(
      `${subject} as:concerneHabitation <${AS}${escapeSparql(payload.habitation)}>.`
    );
  }
  if (payload.motifRefus) {
    inserts.push(
      `${subject} as:motifRefus "${escapeSparql(payload.motifRefus)}".`
    );
  }

  await runSparql(`
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
    }`);
}

export async function deleteIndemnisation(id: string): Promise<void> {
  await runSparql(`
    PREFIX as: <${AS}>
    DELETE WHERE { <${AS}${escapeSparql(id)}> ?property ?value. }`);
}

export async function getIndemnisationStats(
  assureId?: string
): Promise<IndemnisationStats> {
  const ownerFilter = assureId
    ? `?indemnisation as:concerneHabitation ?habitationOwner. ?habitationOwner as:estPossedeePar <${AS}${escapeSparql(assureId)}>.`
    : '';
  const query = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX xsd: <${XSD}>
    SELECT
      (COUNT(DISTINCT ?indemnisation) AS ?count)
      (SUM(?decMontant) AS ?total)
      (MAX(?decMontant) AS ?max)
      (COUNT(DISTINCT ?partielle) AS ?countPartielle)
    WHERE {
      ?indemnisation a ?type.
      VALUES ?type { ont:IndemnisationTotale ont:IndemnisationPartielle ont:IndemnisationRefusee }
      OPTIONAL {
        ?indemnisation as:montantIndemnise ?rawMontant.
        BIND(xsd:decimal(STR(?rawMontant)) AS ?decMontant)
      }
      OPTIONAL {
        ?indemnisation a ont:IndemnisationPartielle.
        BIND(?indemnisation AS ?partielle)
      }
      ${ownerFilter}
    }`;
  const result = await safeRunQuery(query);
  if (!result || !isSparqlSelectResult(result) || result.results.length === 0) {
    return {
      totalCount: 0,
      sumMontantIndemnise: 0,
      maxMontantIndemnise: 0,
      countPartielle: 0,
    };
  }
  const row = result.results[0];
  const count = Number(row?.count ?? 0);
  const total = Number(row?.total ?? 0);
  const max = Number(row?.max ?? 0);
  const countPartielle = Number(row?.countPartielle ?? 0);
  return {
    totalCount: Number.isNaN(count) ? 0 : count,
    sumMontantIndemnise: Number.isNaN(total) ? 0 : Math.round(total),
    maxMontantIndemnise: Number.isNaN(max) ? 0 : Math.round(max),
    countPartielle: Number.isNaN(countPartielle) ? 0 : countPartielle,
  };
}

export async function queryIndemnisations(
  params: IndemnisationsFilterParams = {}
): Promise<PaginatedIndemnisations> {
  const {
    assureId,
    search,
    type,
    tauxMin,
    tauxMax,
    montantMin,
    montantMax,
    sortBy = 'montantIndemnise',
    sortOrder = 'desc',
    page = 1,
    pageSize = 6,
  } = params;

  const whereClauses: string[] = [
    '?indemnisation a ?type.',
    type && type !== 'Tous'
      ? `VALUES ?type { ont:${escapeSparql(type)} }`
      : 'VALUES ?type { ont:IndemnisationTotale ont:IndemnisationPartielle ont:IndemnisationRefusee }',
    'OPTIONAL { ?indemnisation rdfs:label ?label. }',
    'OPTIONAL { ?indemnisation as:montantIndemnise ?montantIndemnise. }',
    'OPTIONAL { ?indemnisation as:tauxIndemnisation ?tauxIndemnisation. }',
    'OPTIONAL { ?indemnisation as:concerneHabitation ?habitation. }',
    'OPTIONAL { ?habitation rdfs:label ?habitationLabel. }',
    'OPTIONAL { ?habitation as:adresseBien ?habitationAdresse. }',
    'OPTIONAL { ?indemnisation as:motifRefus ?motifRefus. }',
    'OPTIONAL { ?habitation as:estPossedeePar ?assure. }',
  ];

  if (assureId) {
    whereClauses.push(
      `?indemnisation as:concerneHabitation ?habitationFiltre. ?habitationFiltre as:estPossedeePar <${AS}${escapeSparql(assureId)}>.`
    );
  }

  if (search && search.trim()) {
    const esc = escapeSparql(search.trim());
    whereClauses.push(
      `FILTER(CONTAINS(LCASE(COALESCE(?label, "")), LCASE("${esc}")) || CONTAINS(LCASE(COALESCE(?habitationLabel, "")), LCASE("${esc}")) || CONTAINS(LCASE(COALESCE(?motifRefus, "")), LCASE("${esc}")) || CONTAINS(LCASE(STR(?type)), LCASE("${esc}")))`
    );
  }

  if (montantMin !== undefined && !Number.isNaN(montantMin)) {
    whereClauses.push(
      `FILTER(BOUND(?montantIndemnise) && xsd:decimal(STR(?montantIndemnise)) >= ${montantMin})`
    );
  }

  if (montantMax !== undefined && !Number.isNaN(montantMax)) {
    whereClauses.push(
      `FILTER(BOUND(?montantIndemnise) && xsd:decimal(STR(?montantIndemnise)) <= ${montantMax})`
    );
  }

  if (tauxMin !== undefined && !Number.isNaN(tauxMin)) {
    whereClauses.push(
      `FILTER(BOUND(?tauxIndemnisation) && xsd:decimal(STR(?tauxIndemnisation)) >= ${tauxMin})`
    );
  }

  if (tauxMax !== undefined && !Number.isNaN(tauxMax)) {
    whereClauses.push(
      `FILTER(BOUND(?tauxIndemnisation) && xsd:decimal(STR(?tauxIndemnisation)) <= ${tauxMax})`
    );
  }

  const countQuery = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    PREFIX xsd: <${XSD}>
    SELECT (COUNT(DISTINCT ?indemnisation) AS ?count) WHERE {
      ${whereClauses.join('\n      ')}
    }`;

  const countResult = await safeRunQuery(countQuery);
  const total =
    countResult && isSparqlSelectResult(countResult)
      ? Number(countResult.results[0]?.count ?? 0)
      : 0;

  const orderDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  let orderExpression = 'DESC(xsd:decimal(STR(?montantIndemnise)))';
  orderExpression =
    sortBy === 'tauxIndemnisation'
      ? `${orderDir}(COALESCE(xsd:decimal(STR(?tauxIndemnisation)), 0))`
      : `${orderDir}(COALESCE(xsd:decimal(STR(?montantIndemnise)), 0))`;

  const offset = Math.max(0, (page - 1) * pageSize);

  const selectQuery = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    PREFIX xsd: <${XSD}>
    SELECT ?indemnisation ?label ?type ?montantIndemnise ?tauxIndemnisation ?habitation ?habitationLabel ?habitationAdresse ?assure ?motifRefus WHERE {
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

  const items = indemnisationsListSchema.parse(
    result.results.flatMap((row) => {
      const uri = row.indemnisation;
      const typeVal = row.type?.split('#').at(-1);
      if (!uri || !typeVal) return [];

      const habitationUri = row.habitation?.split('#').at(-1) ?? '';
      const habitationLocation =
        row.habitationLabel || getShortLocation(row.habitationAdresse ?? '');
      const fallbackLabel = buildIndemnisationLabel(
        typeVal as Indemnisation['type'],
        habitationLocation
      );

      return [
        {
          id: uri.split('#').at(-1) ?? uri,
          label: row.label || fallbackLabel,
          type: typeVal as Indemnisation['type'],
          montantIndemnise: Number.parseFloat(row.montantIndemnise ?? '0'),
          tauxIndemnisation: Number.parseFloat(row.tauxIndemnisation ?? '0'),
          habitation: habitationUri,
          habitationLabel: row.habitationLabel || undefined,
          assure: row.assure?.split('#').at(-1) ?? undefined,
          motifRefus: row.motifRefus || undefined,
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
 * Synchronise les rdfs:label manquants pour les indemnisations dans le triplestore.
 * Format demandé : "Indemnisation <totale|partielle|refusée> <label de l'habitation liée>"
 * Si deux labels sont identiques, ajoute un suffixe " 2", " 3".
 */
export async function syncMissingIndemnisationLabels(): Promise<number> {
  const findQuery = `
    PREFIX as: <${AS}>
    PREFIX ont: <${ONT}>
    PREFIX rdfs: <${RDFS}>
    SELECT ?indemnisation ?type ?habitation ?habitationLabel ?habitationAdresse WHERE {
      ?indemnisation a ?type.
      VALUES ?type { ont:IndemnisationTotale ont:IndemnisationPartielle ont:IndemnisationRefusee }
      OPTIONAL {
        ?indemnisation as:concerneHabitation ?habitation.
        OPTIONAL { ?habitation rdfs:label ?habitationLabel. }
        OPTIONAL { ?habitation as:adresseBien ?habitationAdresse. }
      }
      FILTER NOT EXISTS { ?indemnisation rdfs:label ?existingLabel }
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
      ?indemnisation a ?type.
      VALUES ?type { ont:IndemnisationTotale ont:IndemnisationPartielle ont:IndemnisationRefusee }
      ?indemnisation rdfs:label ?label.
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
    const uri = row.indemnisation;
    if (!uri) continue;
    const typeVal = (row.type?.split('#').at(-1) ||
      'IndemnisationPartielle') as Indemnisation['type'];
    const habLoc =
      row.habitationLabel || getShortLocation(row.habitationAdresse ?? '');
    const baseLabel = buildIndemnisationLabel(typeVal, habLoc);

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

/**
 * Synchronise tous les labels manquants (habitations et indemnisations).
 */
export async function syncMissingLabels(): Promise<{
  habitationsCount: number;
  indemnisationsCount: number;
  total: number;
}> {
  const habitationsCount = await syncMissingHabitationLabels();
  const indemnisationsCount = await syncMissingIndemnisationLabels();
  return {
    habitationsCount,
    indemnisationsCount,
    total: habitationsCount + indemnisationsCount,
  };
}
