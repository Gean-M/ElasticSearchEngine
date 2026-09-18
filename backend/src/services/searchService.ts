import { ElasticsearchClient } from "../elasticsearch/client";
import { AppConfig, SearchFilters, SearchResponse, SearchResultItem, StatsResult } from "../models/types";

const SOURCE_FIELDS = ["title", "url", "content", "reading_time", "dt_creation", "label"];

/** Remove tags HTML e caracteres especiais, igual ao SearchService.cleanContent do projeto original. */
export function cleanContent(content: string | null | undefined): string {
  if (!content) return "";
  const noTags = content.replace(/<[^>]+>/g, " ");
  const noSpecial = noTags.replace(/[^\p{L}\p{N}\s.,;:!?'"()\-]/gu, " ");
  const collapsed = noSpecial.replace(/\s+/g, " ").trim();
  const maxLength = 350;
  if (collapsed.length > maxLength) {
    return collapsed.substring(0, maxLength).trim() + "...";
  }
  return collapsed;
}

export class SearchService {
  constructor(private readonly client: ElasticsearchClient, private readonly config: AppConfig) {}

  async search(filters: SearchFilters): Promise<SearchResponse> {
    const page = Math.max(1, filters.page);
    const pageSize = Math.max(1, filters.pageSize);
    const from = (page - 1) * pageSize;

    const body = this.buildQueryBody(filters, from, pageSize, true);
    const response = await this.client.post(`/${this.config.indexName}/_search`, body);

    const hits = asRecord(response.hits);
    const total = hits ? asRecord(hits.total) : null;
    const totalHits = total?.value !== undefined ? Number(total.value) : 0;
    const took = response.took !== undefined ? Number(response.took) : 0;

    const items: SearchResultItem[] = [];
    const hitList = hits ? (hits.hits as unknown[]) : null;
    if (Array.isArray(hitList)) {
      for (const hitObj of hitList) {
        const hit = asRecord(hitObj);
        if (hit) items.push(this.toResultItem(hit));
      }
    }

    const totalPages = totalHits === 0 ? 0 : Math.ceil(totalHits / pageSize);

    let suggestions: string[] | null = null;
    if (totalHits === 0 && filters.text && filters.text.trim() !== "") {
      suggestions = await this.suggest(filters.text);
    }

    return {
      items,
      totalHits,
      totalPages,
      currentPage: page,
      pageSize,
      tookMillis: took,
      suggestions,
    };
  }

  private toResultItem(hit: Record<string, unknown>): SearchResultItem {
    const source = asRecord(hit._source) ?? {};
    const title = asString(source.title);
    const url = asString(source.url);
    const content = asString(source.content);
    const readingTime = asNumber(source.reading_time);
    const dtCreation = asString(source.dt_creation);
    const label = asString(source.label);
    const score = asNumber(hit._score);

    let highlightHtml: string | null = null;
    const highlight = asRecord(hit.highlight);
    if (highlight) {
      const fragments = highlight.content as unknown[] | undefined;
      if (Array.isArray(fragments) && fragments.length > 0) {
        highlightHtml = asString(fragments[0]);
      }
    }

    return {
      title,
      url,
      abstractText: cleanContent(content),
      highlightHtml,
      readingTime,
      dtCreation,
      label,
      score,
    };
  }

  private buildQueryBody(filters: SearchFilters, from: number, size: number, includeHighlight: boolean) {
    const matchParams: Record<string, unknown> = { query: filters.text };
    if (filters.operator === "AND") matchParams.operator = "and";
    if (filters.fuzziness) matchParams.fuzziness = filters.fuzziness;

    const must = [{ match: { content: matchParams } }];

    const should: unknown[] = [];
    if (filters.phraseBoost) {
      should.push({ match_phrase: { content: filters.text } });
    }

    const filter = this.buildFilterClauses(filters);

    const bool: Record<string, unknown> = { must };
    if (should.length > 0) bool.should = should;
    if (filter.length > 0) bool.filter = filter;

    const body: Record<string, unknown> = {
      from,
      size,
      _source: SOURCE_FIELDS,
      query: { bool },
    };

    const sort = this.buildSort(filters);
    if (sort) body.sort = sort;

    if (includeHighlight && filters.highlight) {
      body.highlight = {
        pre_tags: ["<b>"],
        post_tags: ["</b>"],
        number_of_fragments: 1,
        fragment_size: 300,
        fields: { content: {} },
      };
    }

    return body;
  }

  private buildFilterClauses(filters: SearchFilters): unknown[] {
    const filter: unknown[] = [];

    if (filters.readingTimeMin !== null || filters.readingTimeMax !== null) {
      const range: Record<string, unknown> = {};
      if (filters.readingTimeMin !== null) range.gte = filters.readingTimeMin;
      if (filters.readingTimeMax !== null) range.lte = filters.readingTimeMax;
      filter.push({ range: { reading_time: range } });
    }

    const hasDateFrom = !!filters.dateFrom;
    const hasDateTo = !!filters.dateTo;
    if (hasDateFrom || hasDateTo) {
      const range: Record<string, unknown> = {};
      if (hasDateFrom) range.gte = filters.dateFrom;
      if (hasDateTo) range.lte = filters.dateTo;
      filter.push({ range: { dt_creation: range } });
    }

    if (filters.labels.length > 0) {
      filter.push({ terms: { label: filters.labels } });
    }

    return filter;
  }

  private buildSort(filters: SearchFilters): unknown[] {
    const dir = filters.sortDir;
    switch (filters.sortField) {
      case "title":
        // "title" é do tipo "text" (analisado); usamos o sub-campo
        // "title.keyword" (não analisado) para permitir ordenação alfabética.
        return [{ "title.keyword": { order: dir } }, { _score: { order: "desc" } }];
      case "readingTime":
        return [{ reading_time: { order: dir } }, { _score: { order: "desc" } }];
      case "label":
        return [{ label: { order: dir } }, { _score: { order: "desc" } }];
      case "dtCreation":
        return [{ dt_creation: { order: dir } }, { _score: { order: "desc" } }];
      case "score":
      default:
        return [{ _score: { order: dir } }];
    }
  }

  async suggest(text: string): Promise<string[]> {
    const body = {
      suggest: {
        correcao: {
          text,
          term: { field: "content", size: 1 },
        },
      },
    };
    const response = await this.client.post(`/${this.config.indexName}/_search`, body);
    const suggest = asRecord(response.suggest);
    if (!suggest) return [];
    const entries = suggest.correcao as unknown[] | undefined;
    if (!Array.isArray(entries)) return [];

    const correctedWords: string[] = [];
    const alternativeWords: string[] = [];
    for (const entryObj of entries) {
      const entry = asRecord(entryObj);
      if (!entry) continue;
      const original = asString(entry.text);
      const options = entry.options as unknown[] | undefined;
      let replacement = original;
      if (Array.isArray(options) && options.length > 0) {
        const best = asRecord(options[0]);
        if (best?.text) {
          replacement = asString(best.text);
          alternativeWords.push(replacement ?? "");
        }
      }
      correctedWords.push(replacement ?? "");
    }

    if (alternativeWords.length === 0) return [];
    return [correctedWords.join(" ")];
  }

  async stats(filters: SearchFilters): Promise<StatsResult> {
    const body = this.buildQueryBody(filters, 0, 0, false);
    body.aggs = { stats_reading_time: { stats: { field: "reading_time" } } };

    const response = await this.client.post(`/${this.config.indexName}/_search`, body);
    const aggs = asRecord(response.aggregations);
    const stats = aggs ? asRecord(aggs.stats_reading_time) : null;
    if (!stats) return { count: 0, min: null, max: null, avg: null, sum: null };

    return {
      count: Number(stats.count ?? 0),
      min: asNumber(stats.min),
      max: asNumber(stats.max),
      avg: asNumber(stats.avg),
      sum: asNumber(stats.sum),
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return value === undefined || value === null ? null : String(value);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : value !== undefined && value !== null ? Number(value) : null;
}
