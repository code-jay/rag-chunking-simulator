"use client";

import { useMemo, useState } from "react";
import {
  ChunkResponse,
  CompareResponse,
  RecursiveSemanticCompareResponse,
  StrategyRecommendation,
} from "@/types/chunking";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type TabType = "chunks" | "comparison" | "recursiveSemantic" | "developer" | "metadata";

const STRATEGIES = [
  { id: "adaptive_hybrid", label: "Adaptive Hybrid", hint: "Automatically detects document type and chooses the best chunker"},
  { id: "recursive", label: "LangChain Recursive", hint: "Best default for PDF, DOCX, TXT" },
  { id: "semantic_similarity", label: "Semantic Similarity", hint: "Best for topic-shift splitting" },
  { id: "parent_child", label: "Parent-Child", hint: "Hierarchical chunks: child retrieval with parent context"},
  { id: "fixed_character", label: "Fixed Character", hint: "Character-size baseline" },
  { id: "fixed_word", label: "Fixed Word", hint: "Word-size baseline" },
  { id: "fixed_token", label: "Fixed Token", hint: "Token-size baseline" },
  { id: "sliding_window", label: "Sliding Window", hint: "Overlapping word windows" },
  { id: "paragraph", label: "Paragraph", hint: "Split by paragraphs" },
  { id: "sentence", label: "Sentence", hint: "Split by sentences" },
  { id: "markdown_header", label: "Markdown Header", hint: "For .md files" },
  { id: "html_header", label: "HTML Header", hint: "For HTML heading tags" },
  { id: "json_recursive", label: "Recursive JSON", hint: "For valid JSON only" },
  { id: "python_code", label: "Python Code", hint: "For Python source" },
  { id: "javascript_code", label: "JavaScript Code", hint: "For JS/TS source" }
];

const SAMPLES: Record<string, string> = {
  mixed: `Enterprise AI systems require strong document processing pipelines. Chunking is important before creating embeddings. Recursive chunking preserves paragraph structure.

Football is one of the most popular sports in the world. Teams compete in leagues and tournaments. Players need fitness, strategy, and teamwork.

Vector databases store embeddings for semantic search. Retrieval systems use similarity search to find relevant chunks. RAG pipelines combine retrieved context with LLM responses.`,
  markdown: `# RAG Pipeline

## Ingestion
Documents are uploaded, parsed, and normalized.

## Chunking
Chunking breaks documents into smaller retrieval units.

### Recursive Chunking
Recursive chunking tries to preserve paragraph and sentence boundaries.`,
  json: `{
  "company": "Altmatic",
  "pipeline": {
    "steps": ["extract", "chunk", "embed", "retrieve"],
    "strategy": "recursive_json"
  }
}`,
  python: `class ChunkService:
    def split_text(self, text: str):
        return text.split("\\n\\n")

def calculate_stats(chunks):
    return {
        "total_chunks": len(chunks)
    }`,
};

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [strategy, setStrategy] = useState("recursive");
  const [chunkSize, setChunkSize] = useState(800);
  const [chunkOverlap, setChunkOverlap] = useState(120);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

  const [result, setResult] = useState<ChunkResponse | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [recursiveSemanticResult, setRecursiveSemanticResult] =
    useState<RecursiveSemanticCompareResponse | null>(null);
  const [recommendation, setRecommendation] =
    useState<StrategyRecommendation | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("chunks");
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [metadataKey, setMetadataKey] = useState("type");
  const [metadataValue, setMetadataValue] = useState("semantic");
  const [filteredChunks, setFilteredChunks] = useState<ChunkResponse["chunks"] | null>(null);
  const [error, setError] = useState("");

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  async function applyMetadataFilter() {
  if (!result) return;

  const res = await fetch(`${API_URL}/metadata-filter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chunks: result.chunks,
      filters: {
        [metadataKey]: metadataValue,
      },
    }),
  });

  const data = await res.json();
  setFilteredChunks(data.chunks);
}

  async function runChunking() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("strategy", strategy);
        formData.append("chunk_size", String(chunkSize));
        formData.append("chunk_overlap", String(chunkOverlap));
        formData.append("similarity_threshold", String(similarityThreshold));

        res = await fetch(`${API_URL}/upload-and-chunk`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/chunk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            strategy,
            chunk_size: chunkSize,
            chunk_overlap: chunkOverlap,
            similarity_threshold: similarityThreshold,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        const message = data?.detail?.message || data?.detail || "Chunking failed";
        throw new Error(typeof message === "string" ? message : JSON.stringify(message));
      }

      setResult(data);
      setActiveTab("chunks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function compareStrategies() {
    setLoading(true);
    setError("");
    setCompareResult(null);

    try {
      const res = await fetch(`${API_URL}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          similarity_threshold: similarityThreshold,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Comparison failed");
      }

      setCompareResult(data);
      setActiveTab("comparison");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function compareRecursiveSemantic() {
    setLoading(true);
    setError("");
    setRecursiveSemanticResult(null);

    try {
      const res = await fetch(`${API_URL}/compare-recursive-semantic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          similarity_threshold: similarityThreshold,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Recursive vs Semantic comparison failed");
      }

      setRecursiveSemanticResult(data);
      setActiveTab("recursiveSemantic");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function getRecommendation() {
    setLoading(true);
    setError("");
    setRecommendation(null);

    try {
      const res = await fetch(`${API_URL}/recommend-strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          strategy,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          similarity_threshold: similarityThreshold,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Recommendation failed");
      }

      setRecommendation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    if (!result) return;

    const exportData = {
      exported_at: new Date().toISOString(),
      strategy: result.strategy,
      settings: result.settings,
      stats: result.stats,
      chunks: result.chunks,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `chunks-${result.strategy}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function copyChunks() {
    if (!result) return;

    const textToCopy = result.chunks
      .map((chunk) => `Chunk ${chunk.chunk_id}\n${chunk.text}`)
      .join("\n\n---\n\n");

    await navigator.clipboard.writeText(textToCopy);
    alert("Chunks copied to clipboard");
  }

  function generateLangChainCode() {
    if (strategy === "recursive") {
      return `from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap},
    separators=["\\\\n\\\\n", "\\\\n", ".", " ", ""]
)

chunks = splitter.split_text(text)`;
    }

    if (strategy === "semantic_similarity") {
      return `from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Split text into sentences
# Generate embeddings
# Start a new chunk when similarity drops below ${similarityThreshold}`;
    }

    return `# Custom strategy: ${strategy}`;
  }

  async function copyLangChainCode() {
    const code = generateLangChainCode();
    await navigator.clipboard.writeText(code);
    alert("LangChain code copied to clipboard");
  }

  function loadSample(sampleKey: keyof typeof SAMPLES) {
    setText(SAMPLES[sampleKey]);
    setFile(null);

    if (sampleKey === "markdown") setStrategy("markdown_header");
    if (sampleKey === "json") setStrategy("json_recursive");
    if (sampleKey === "python") setStrategy("python_code");
    if (sampleKey === "mixed") setStrategy("semantic_similarity");
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-5">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              RAG Chunking Strategy Simulator
            </h1>
            <p className="mt-1 text-gray-400">
              Compare chunking strategies for RAG and Enterprise AI pipelines.
            </p>
          </div>

          <div className="hidden rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-gray-300 md:block">
            Developer Tool • RAG Lab
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5 lg:sticky lg:top-5 lg:h-fit">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-purple-400">⚙</span>
              <h2 className="text-xl font-semibold">Settings</h2>
            </div>

            <label className="mb-2 block text-sm text-gray-300">Strategy</label>
            <select
              className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 p-3"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              {STRATEGIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <p className="mb-5 text-xs leading-5 text-gray-400">
              {STRATEGIES.find((s) => s.id === strategy)?.hint ||
                "Choose a strategy based on document type."}
            </p>

            <NumberField label="Chunk Size" value={chunkSize} onChange={setChunkSize} />
            <NumberField label="Chunk Overlap" value={chunkOverlap} onChange={setChunkOverlap} />

            {strategy === "semantic_similarity" && (
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-gray-300">Semantic Threshold</label>
                  <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
                    {similarityThreshold}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                  className="w-full"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Lower = fewer/larger chunks. Higher = more topic-sensitive chunks.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <ActionButton label="Compare Strategies" onClick={compareStrategies} disabled={loading || !text.trim()} tone="purple" />
              <ActionButton label="Compare Recursive vs Semantic" onClick={compareRecursiveSemantic} disabled={loading || !text.trim()} tone="indigo" />
            </div>

            <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/70 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-300">💡 Tip</h3>
              <p className="text-sm leading-6 text-gray-400">
                Recursive is the best default. Semantic is useful for mixed-topic documents.
              </p>
            </div>
          </aside>

          <section className="space-y-5">
            <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Input Text</h2>
                <span className="text-sm text-gray-400">
                  {text.length.toLocaleString()} chars • {wordCount.toLocaleString()} words
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-gray-950/60 p-6 text-center hover:border-blue-500">
                  <span className="mb-2 text-2xl">⬆</span>
                  <span className="font-semibold">Choose file or drag & drop</span>
                  <span className="mt-1 text-sm text-gray-400">
                    .txt, .md, .pdf, .docx, .html, .json, .csv, .py, .js, .ts
                  </span>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,.docx,.html,.json,.csv,.py,.js,.ts,.tsx,.jsx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
                  <p className="text-sm text-gray-400">Selected File</p>
                  <p className="mt-2 font-medium text-gray-200">
                    {file ? file.name : "No file selected"}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Upload a file or paste text below.
                  </p>
                </div>
              </div>

              <textarea
                className="mt-4 h-72 w-full rounded-xl border border-gray-700 bg-gray-800 p-4 text-gray-100 outline-none placeholder:text-gray-500 focus:border-blue-500"
                placeholder="Paste your document text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={runChunking}
                  disabled={loading || (!text.trim() && !file)}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-700 disabled:bg-gray-700"
                >
                  {loading ? "Processing..." : "🚀 Run Chunking"}
                </button>

                <button
                  onClick={getRecommendation}
                  disabled={loading || !text.trim()}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-3 font-semibold hover:bg-amber-700 disabled:bg-gray-700"
                >
                  ⭐ Recommend Best Strategy
                </button>
                
              </div>
              <div className="mt-4 w-full ">
              {recommendation && <RecommendationCard recommendation={recommendation} onUse={() => setStrategy(recommendation.recommended_strategy)} />}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <SampleButton label="Sample: Mixed Topics" onClick={() => loadSample("mixed")} />
                <SampleButton label="Sample: Markdown" onClick={() => loadSample("markdown")} />
                <SampleButton label="Sample: JSON" onClick={() => loadSample("json")} />
                <SampleButton label="Sample: Python" onClick={() => loadSample("python")} />
              </div>
            </section>

            {error && <section className="rounded-xl border border-red-800 bg-red-950 p-4 text-red-200">{error}</section>}


            <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <Stat title="Total Chunks" value={result?.stats.total_chunks ?? 0} />
              <Stat title="Avg Chars" value={result?.stats.avg_characters ?? 0} />
              <Stat title="Min Chars" value={result?.stats.min_characters ?? 0} />
              <Stat title="Max Chars" value={result?.stats.max_characters ?? 0} />
              <Stat title="Avg Words" value={result?.stats.avg_words ?? 0} />
            </section>
              {result?.evaluation && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ScoreCard
                    title="Chunk Quality Score"
                    value={result.evaluation.chunk_quality_score}
                    description="Checks chunk size, completeness, and boundary quality."
                  />

                  <ScoreCard
                    title="Context Preservation Score"
                    value={result.evaluation.context_preservation_score}
                    description="Checks whether chunks start and end naturally."
                  />

                  <ScoreCard
                    title="Metadata Score"
                    value={result.evaluation.metadata_score}
                    description="Shows how many chunks contain useful metadata."
                  />
                </section>
              )}
            <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
              <div className="flex flex-wrap border-b border-gray-800">
                <TabButton label="📄 Chunks" tab="chunks" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="📊 Strategy Comparison" tab="comparison" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="⚖ Recursive vs Semantic" tab="recursiveSemantic" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="💻 Developer Tools" tab="developer" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="🏷 Metadata Filter" tab="metadata" activeTab={activeTab} setActiveTab={setActiveTab}/>
              </div>

              <div className="p-5">
                {activeTab === "chunks" && (
                  !result ? <EmptyState title="No chunks yet" description="Run chunking to see document chunks here." /> : (
                    <div className="space-y-4">
                      {result.file && <UploadedFileCard result={result} />}
                      {result.chunks.map((chunk) => (
                        <CollapsibleChunkCard
                          key={chunk.chunk_id}
                          chunk={chunk}
                          expanded={!!expandedChunks[chunk.chunk_id]}
                          onToggle={() => setExpandedChunks((prev) => ({ ...prev, [chunk.chunk_id]: !prev[chunk.chunk_id] }))}
                        />
                      ))}
                    </div>
                  )
                )}

                {activeTab === "comparison" && (
                  compareResult ? <StrategyComparisonTable compareResult={compareResult} /> : <EmptyState title="No comparison yet" description="Click Compare Strategies to view metrics across strategies." />
                )}

                {activeTab === "recursiveSemantic" && (
                  recursiveSemanticResult ? (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <CompareColumn title="Recursive Character Splitter" result={recursiveSemanticResult.recursive} />
                      <CompareColumn title="Semantic Similarity Chunking" result={recursiveSemanticResult.semantic} />
                    </div>
                  ) : <EmptyState title="No side-by-side comparison yet" description="Click Compare Recursive vs Semantic to see both outputs." />
                )}

                {activeTab === "developer" && (
                  <DeveloperPanel hasResult={!!result} onExport={exportJson} onCopyChunks={copyChunks} onCopyCode={copyLangChainCode} />
                )}

                {activeTab === "metadata" && (
                    <MetadataFilterPanel
                      metadataKey={metadataKey}
                      metadataValue={metadataValue}
                      setMetadataKey={setMetadataKey}
                      setMetadataValue={setMetadataValue}
                      onApply={applyMetadataFilter}
                      filteredChunks={filteredChunks}
                    />
                  )}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm text-gray-300">{label}</label>
      <input type="number" className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function ActionButton({ label, onClick, disabled, tone }: { label: string; onClick: () => void; disabled: boolean; tone: "blue" | "purple" | "indigo" | "amber" }) {
  const toneClasses = { blue: "bg-blue-600 hover:bg-blue-700", purple: "bg-purple-600 hover:bg-purple-700", indigo: "bg-indigo-600 hover:bg-indigo-700", amber: "bg-amber-600 hover:bg-amber-700" };
  return <button onClick={onClick} disabled={disabled} className={`w-full rounded-lg p-3 font-semibold disabled:bg-gray-700 ${toneClasses[tone]}`}>{label}</button>;
}

function SampleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:border-blue-500 hover:bg-gray-700">{label}</button>;
}

function Stat({ title, value }: { title: string; value: number }) {
  return <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><p className="text-sm text-gray-400">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="text-xs text-gray-500">Current result</p></div>;
}

function TabButton({ label, tab, activeTab, setActiveTab }: { label: string; tab: TabType; activeTab: TabType; setActiveTab: (tab: TabType) => void }) {
  const isActive = activeTab === tab;
  return <button onClick={() => setActiveTab(tab)} className={`border-b-2 px-5 py-4 text-sm font-semibold ${isActive ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>{label}</button>;
}

function MetadataBadges({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  const similarity = metadata.similarity_score ? Number(metadata.similarity_score) : null;
  return (
    <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
      <div className="mb-2 flex flex-wrap gap-2">
        {metadata.type && <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">{String(metadata.type)}</span>}
        {metadata.break_reason && <span className="rounded-full bg-purple-600 px-2 py-1 text-xs text-white">{String(metadata.break_reason)}</span>}
        {metadata.parent_id && (
          <span className="rounded-full bg-cyan-600 px-2 py-1 text-xs text-white">
            Parent: {String(metadata.parent_id)}
          </span>
        )}

        {metadata.child_id && (
          <span className="rounded-full bg-pink-600 px-2 py-1 text-xs text-white">
            Child: {String(metadata.child_id)}
          </span>
        )}
        {metadata.selected_strategy && (
          <span className="rounded-full bg-amber-600 px-2 py-1 text-xs text-white">
            Strategy: {String(metadata.selected_strategy)}
          </span>
        )}

        {metadata.detected_document_type && (
          <span className="rounded-full bg-cyan-600 px-2 py-1 text-xs text-white">
            Type: {String(metadata.detected_document_type)}
          </span>
        )}

        {metadata.confidence && (
          <span className="rounded-full bg-green-600 px-2 py-1 text-xs text-white">
            Confidence: {String(metadata.confidence)}
          </span>
        )}
        {metadata.selection_reason && (
          <p className="mt-2 text-xs text-gray-400">
            {String(metadata.selection_reason)}
          </p>
        )}
      </div>
      {similarity !== null && <><div className="mb-1 text-xs text-gray-300">Similarity Score: {similarity.toFixed(3)}</div><div className="h-2 w-full rounded-full bg-gray-700"><div className="h-2 rounded-full bg-green-500" style={{ width: `${similarity * 100}%` }} /></div></>}
    </div>
  );
}

function CollapsibleChunkCard({ chunk, expanded, onToggle }: { chunk: { chunk_id: number; text: string; character_count: number; word_count: number; metadata?: Record<string, unknown>; }; expanded: boolean; onToggle: () => void }) {
  const shouldCollapse = chunk.text.length > 450;
  const displayText = shouldCollapse && !expanded ? `${chunk.text.slice(0, 450)}...` : chunk.text;
  return <article className="rounded-xl border border-gray-800 bg-gray-950/60 p-5"><div className="mb-3 flex justify-between gap-4"><h3 className="font-semibold">Chunk {chunk.chunk_id}</h3><span className="text-sm text-gray-400">{chunk.character_count} chars • {chunk.word_count} words</span></div><MetadataBadges metadata={chunk.metadata} /><p className="whitespace-pre-wrap text-gray-300">{displayText}</p>{shouldCollapse && <button onClick={onToggle} className="mt-3 text-sm text-blue-400 hover:text-blue-300">{expanded ? "Show less" : "Show more"}</button>}</article>;
}

function StrategyComparisonTable({ compareResult }: { compareResult: CompareResponse }) {
  return <div><h2 className="mb-4 text-2xl font-bold">Strategy Comparison</h2><div className="overflow-x-auto rounded-xl border border-gray-800"><table className="w-full border-collapse text-left"><thead className="bg-gray-950 text-gray-300"><tr><th className="p-3">Strategy</th><th className="p-3">Total</th><th className="p-3">Avg Chars</th><th className="p-3">Min</th><th className="p-3">Max</th><th className="p-3">Avg Words</th></tr></thead><tbody>{compareResult.results.map((item) => <tr key={item.strategy} className="border-t border-gray-800"><td className="p-3 font-medium">{item.strategy}</td>{item.stats ? <><td className="p-3">{item.stats.total_chunks}</td><td className="p-3">{item.stats.avg_characters}</td><td className="p-3">{item.stats.min_characters}</td><td className="p-3">{item.stats.max_characters}</td><td className="p-3">{item.stats.avg_words}</td></> : <td className="p-3 text-red-400" colSpan={5}>{item.error}</td>}</tr>)}</tbody></table></div></div>;
}

function CompareColumn({ title, result }: { title: string; result: ChunkResponse }) {
  return <div className="rounded-xl border border-gray-800 bg-gray-950 p-4"><h3 className="mb-3 text-lg font-semibold">{title}</h3><div className="mb-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-gray-900 p-3"><p className="text-xs text-gray-400">Total Chunks</p><p className="text-xl font-bold">{result.stats.total_chunks}</p></div><div className="rounded-lg bg-gray-900 p-3"><p className="text-xs text-gray-400">Avg Chars</p><p className="text-xl font-bold">{result.stats.avg_characters}</p></div></div><div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">{result.chunks.map((chunk) => <article key={chunk.chunk_id} className="rounded-lg border border-gray-800 bg-gray-900 p-3"><div className="mb-2 flex justify-between"><span className="font-medium">Chunk {chunk.chunk_id}</span><span className="text-xs text-gray-400">{chunk.character_count} chars</span></div><MetadataBadges metadata={chunk.metadata} /><p className="whitespace-pre-wrap text-sm text-gray-300">{chunk.text}</p></article>)}</div></div>;
}

function RecommendationCard({ recommendation, onUse }: { recommendation: { recommended_strategy: string; confidence: string; reason: string; }; onUse: () => void }) {
  return <section className="rounded-2xl border border-amber-800 bg-amber-950/80 p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-amber-300">⭐ Recommended Strategy</p><h2 className="mt-1 text-2xl font-bold text-amber-100">{recommendation.recommended_strategy}</h2><p className="mt-1 text-sm text-amber-300">Confidence: {recommendation.confidence}</p><p className="mt-3 text-gray-200">{recommendation.reason}</p></div><button onClick={onUse} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold hover:bg-amber-700">Use This Strategy</button></div></section>;
}

function UploadedFileCard({ result }: { result: ChunkResponse }) {
  if (!result.file) return null;
  return <section className="rounded-xl border border-gray-800 bg-gray-950/60 p-4"><h2 className="mb-2 text-lg font-semibold">Uploaded File</h2><p className="text-gray-300">Filename: {result.file.filename}</p><p className="text-gray-300">Type: {result.file.content_type}</p><p className="text-gray-300">Extracted Characters: {result.file.extracted_characters}</p></section>;
}

function DeveloperPanel({ hasResult, onExport, onCopyChunks, onCopyCode }: { hasResult: boolean; onExport: () => void; onCopyChunks: () => void; onCopyCode: () => void }) {
  return <div><h2 className="mb-4 text-2xl font-bold">Developer Tools</h2>{!hasResult && <p className="mb-4 text-gray-400">Run chunking first to enable export and copy actions.</p>}<div className="flex flex-wrap gap-3"><button onClick={onExport} disabled={!hasResult} className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-700 disabled:bg-gray-700">Export JSON</button><button onClick={onCopyChunks} disabled={!hasResult} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:bg-gray-700">Copy Chunks</button><button onClick={onCopyCode} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-700">Copy LangChain Code</button></div></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-950/60 p-8 text-center"><div className="mb-4 text-5xl">📄</div><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 text-gray-400">{description}</p></div>;
}

function MetadataFilterPanel({
  metadataKey,
  metadataValue,
  setMetadataKey,
  setMetadataValue,
  onApply,
  filteredChunks,
}: {
  metadataKey: string;
  metadataValue: string;
  setMetadataKey: React.Dispatch<React.SetStateAction<string>>;
  setMetadataValue: React.Dispatch<React.SetStateAction<string>>;
  onApply: () => void;
  filteredChunks: ChunkItem[] | null;
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">
        Metadata Filtering Simulation
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        <input
          className="p-3 rounded bg-gray-800 border border-gray-700"
          placeholder="Metadata Key"
          value={metadataKey}
          onChange={(e) => setMetadataKey(e.target.value)}
        />

        <input
          className="p-3 rounded bg-gray-800 border border-gray-700"
          placeholder="Metadata Value"
          value={metadataValue}
          onChange={(e) => setMetadataValue(e.target.value)}
        />

        <button
          onClick={onApply}
          className="bg-blue-600 rounded p-3 font-semibold"
        >
          Apply Filter
        </button>
      </div>

      {filteredChunks && (
        <>
          <p className="text-gray-400">
            Matching Chunks: {filteredChunks.length}
          </p>

          <div className="space-y-4">
            {filteredChunks.map((chunk) => (
              <CollapsibleChunkCard
                key={chunk.chunk_id}
                chunk={chunk}
                expanded={true}
                onToggle={() => {}}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ScoreCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}%</p>

      <div className="mt-3 h-2 w-full rounded-full bg-gray-700">
        <div
          className="h-2 rounded-full bg-green-500"
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-gray-500">{description}</p>
    </div>
  );
}
