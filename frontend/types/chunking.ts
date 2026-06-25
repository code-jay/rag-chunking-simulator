export type ChunkItem = {
  chunk_id: number;
  text: string;
  metadata?: Record<string, unknown>;
  character_count: number;
  word_count: number;
};

export type ChunkStats = {
  total_chunks: number;
  avg_characters: number;
  min_characters: number;
  max_characters: number;
  avg_words: number;
  metadata_coverage?: number;
};

export type ChunkResponse = {
  strategy: string;
  settings: {
    chunk_size: number;
    chunk_overlap: number;
    similarity_threshold?: number;
  };
  stats: ChunkStats;
  evaluation?: ChunkEvaluation;
  chunks: ChunkItem[];
  file?: {
    filename: string;
    content_type: string;
    extracted_characters: number;
  };
};

export type CompareResultItem = {
  strategy: string;
  stats?: ChunkStats;
  error?: string;
};

export type CompareResponse = {
  chunk_size: number;
  chunk_overlap: number;
  results: CompareResultItem[];
};

export type RecursiveSemanticCompareResponse = {
  recursive: ChunkResponse;
  semantic: ChunkResponse;
};

export type StrategyRecommendation = {
  recommended_strategy: string;
  confidence: string;
  reason: string;
};

export type ChunkEvaluation = {
  chunk_quality_score: number;
  context_preservation_score: number;
  metadata_score: number;
};