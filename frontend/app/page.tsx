"use client";

import { useState } from "react";
import { ChunkResponse, CompareResponse, RecursiveSemanticCompareResponse,StrategyRecommendation } from "@/types/chunking";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [text, setText] = useState("");
  const [strategy, setStrategy] = useState("recursive");
  const [chunkSize, setChunkSize] = useState(800);
  const [chunkOverlap, setChunkOverlap] = useState(120);
  const [result, setResult] = useState<ChunkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [recursiveSemanticResult, setRecursiveSemanticResult] =
  useState<RecursiveSemanticCompareResponse | null>(null);
  const [recommendation, setRecommendation] =
  useState<StrategyRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("chunks");
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({});

  async function runChunking() {
  setLoading(true);
  setResult(null);
  setError("");

  try {
    let res;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("strategy", strategy);
      formData.append("chunk_size", String(chunkSize));
      formData.append("chunk_overlap", String(chunkOverlap));

      res = await fetch(`${API_URL}/upload-and-chunk`, {
        method: "POST",
        body: formData,
      });
    } else {
      res = await fetch(`${API_URL}/chunk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      throw new Error(data.detail || "Something went wrong");
    }

    setResult(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}

async function compareStrategies() {
  setLoading(true);
  setCompareResult(null);
  setError("");

  try {
    const res = await fetch(`${API_URL}/compare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        strategies: [
          "fixed_character",
          "fixed_word",
          "fixed_token",
          "recursive",
          "paragraph",
          "sentence",
        ],
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.detail?.message ||
        data?.detail ||
        "Something went wrong";

      throw new Error(message);
    }

    setCompareResult(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}

async function compareRecursiveSemantic() {
  setLoading(true);
  setRecursiveSemanticResult(null);
  setError("");

  try {
    const res = await fetch(`${API_URL}/compare-recursive-semantic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.detail || "Recursive vs Semantic comparison failed");
    }

    setRecursiveSemanticResult(data);
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

  if (strategy === "markdown_header") {
    return `from langchain_text_splitters import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]

splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on,
    strip_headers=False
)

chunks = splitter.split_text(markdown_text)`;
  }

  if (strategy === "html_header") {
    return `from langchain_text_splitters import HTMLHeaderTextSplitter

headers_to_split_on = [
    ("h1", "h1"),
    ("h2", "h2"),
    ("h3", "h3"),
]

splitter = HTMLHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on
)

chunks = splitter.split_text(html_text)`;
  }

  if (strategy === "python_code") {
    return `from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap}
)

chunks = splitter.split_text(code_text)`;
  }

  if (strategy === "javascript_code") {
    return `from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.JS,
    chunk_size=${chunkSize},
    chunk_overlap=${chunkOverlap}
)

chunks = splitter.split_text(code_text)`;
  }

  if (strategy === "json_recursive") {
    return `import json
from langchain_text_splitters import RecursiveJsonSplitter

data = json.loads(json_text)

splitter = RecursiveJsonSplitter(
    max_chunk_size=${chunkSize}
)

chunks = splitter.split_json(json_data=data)`;
  }

  if (strategy === "semantic_similarity") {
    return `from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Split text into sentences
# Generate embeddings
# Compare sentence similarity
# Start new chunk when similarity drops below ${similarityThreshold}`;
  }

  return `# This is a custom chunking strategy: ${strategy}
# Implement using your custom splitter logic.`;
}

async function copyLangChainCode() {
  const code = generateLangChainCode();
  await navigator.clipboard.writeText(code);
  alert("LangChain code copied to clipboard");
}

async function getRecommendation() {
  setLoading(true);
  setError("");
  setRecommendation(null);

  try {
    const res = await fetch(`${API_URL}/recommend-strategy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  return (
  <main className="min-h-screen bg-gray-950 text-white p-6">
    <header className="mb-6">
      <h1 className="text-3xl font-bold">RAG Chunking Strategy Simulator</h1>
      <p className="text-gray-400 mt-1">
        Compare chunking strategies for RAG and Enterprise AI pipelines.
      </p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 lg:sticky lg:top-6 h-fit">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>

        <label className="block mb-2 text-sm text-gray-300">Strategy</label>
        <select
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-3"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        >
          <option value="semantic_similarity">Semantic Similarity</option>
          <option value="recursive">LangChain Recursive</option>
          <option value="fixed_character">Fixed Character</option>
          <option value="fixed_word">Fixed Word</option>
          <option value="fixed_token">Fixed Token</option>
          <option value="sliding_window">Sliding Window</option>
          <option value="paragraph">Paragraph</option>
          <option value="sentence">Sentence</option>
          <option value="markdown_header">Markdown Header</option>
          <option value="html_header">HTML Header</option>
          <option value="json_recursive">Recursive JSON</option>
          <option value="python_code">Python Code</option>
          <option value="javascript_code">JavaScript Code</option>
        </select>

        <p className="text-xs text-gray-400 mb-4">
          Use recursive for normal text, JSON for json_recursive, Markdown for markdown_header, HTML for html_header, and code chunking for source files.
        </p>

        <label className="block mb-2 text-sm text-gray-300">Chunk Size</label>
        <input
          type="number"
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4"
          value={chunkSize}
          onChange={(e) => setChunkSize(Number(e.target.value))}
        />

        <label className="block mb-2 text-sm text-gray-300">Chunk Overlap</label>
        <input
          type="number"
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4"
          value={chunkOverlap}
          onChange={(e) => setChunkOverlap(Number(e.target.value))}
        />

        {strategy === "semantic_similarity" && (
          <div className="mb-4">
            <label className="block mb-2 text-sm text-gray-300">
              Semantic Threshold: {similarityThreshold}
            </label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-2">
              Lower = fewer chunks. Higher = more topic-sensitive chunks.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={runChunking}
            disabled={loading || (!text.trim() && !file)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 p-3 rounded font-semibold"
          >
            {loading ? "Processing..." : "Run Chunking"}
          </button>

          <button
            onClick={compareStrategies}
            disabled={loading || !text.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 p-3 rounded font-semibold"
          >
            Compare Strategies
          </button>

          <button
            onClick={compareRecursiveSemantic}
            disabled={loading || !text.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 p-3 rounded font-semibold"
          >
            Compare Recursive vs Semantic
          </button>

          <button
            onClick={getRecommendation}
            disabled={loading || !text.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 p-3 rounded font-semibold"
          >
            Recommend Best Strategy
          </button>
        </div>
      </section>

      <section className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Input Text</h2>
          {file && <span className="text-sm text-green-400">{file.name}</span>}
        </div>

        <input
          type="file"
          accept=".txt,.md,.pdf,.docx,.html,.json,.csv,.py,.js,.ts,.tsx,.jsx"
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <textarea
          className="w-full h-80 p-4 rounded bg-gray-800 border border-gray-700"
          placeholder="Paste your document text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </section>
    </div>

    {error && (
      <div className="mt-6 bg-red-950 border border-red-800 text-red-200 rounded-xl p-4">
        {error}
      </div>
    )}

    {recommendation && (
      <RecommendationCard
        recommendation={recommendation}
        onUse={() => setStrategy(recommendation.recommended_strategy)}
      />
    )}

    {result && (
      <>
        {result.file && (
          <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-2">Uploaded File</h2>
            <p className="text-gray-300">Filename: {result.file.filename}</p>
            <p className="text-gray-300">Type: {result.file.content_type}</p>
            <p className="text-gray-300">
              Extracted Characters: {result.file.extracted_characters}
            </p>
          </section>
        )}

        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <Stat title="Total Chunks" value={result.stats.total_chunks} />
          <Stat title="Avg Chars" value={result.stats.avg_characters} />
          <Stat title="Min Chars" value={result.stats.min_characters} />
          <Stat title="Max Chars" value={result.stats.max_characters} />
          <Stat title="Avg Words" value={result.stats.avg_words} />
        </section>

        <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-2 flex flex-wrap gap-2">
          <TabButton label="Chunks" tab="chunks" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Strategy Comparison" tab="comparison" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Recursive vs Semantic" tab="recursiveSemantic" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Developer Actions" tab="developer" activeTab={activeTab} setActiveTab={setActiveTab} />
        </section>

        {activeTab === "chunks" && (
          <section className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Chunks</h2>
            <div className="space-y-4">
              {result.chunks.map((chunk) => (
                <CollapsibleChunkCard
                  key={chunk.chunk_id}
                  chunk={chunk}
                  expanded={!!expandedChunks[chunk.chunk_id]}
                  onToggle={() =>
                    setExpandedChunks((prev) => ({
                      ...prev,
                      [chunk.chunk_id]: !prev[chunk.chunk_id],
                    }))
                  }
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "comparison" && compareResult && (
          <StrategyComparisonTable compareResult={compareResult} />
        )}

        {activeTab === "recursiveSemantic" && recursiveSemanticResult && (
          <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-2xl font-bold mb-6">
              Recursive vs Semantic Comparison
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompareColumn title="Recursive Character Splitter" result={recursiveSemanticResult.recursive} />
              <CompareColumn title="Semantic Similarity Chunking" result={recursiveSemanticResult.semantic} />
            </div>
          </section>
        )}

        {activeTab === "developer" && (
          <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Developer Actions</h2>

            <div className="flex flex-wrap gap-3">
              <button onClick={exportJson} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold">
                Export JSON
              </button>
              <button onClick={copyChunks} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold">
                Copy Chunks
              </button>
              <button onClick={copyLangChainCode} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold">
                Copy LangChain Code
              </button>
            </div>
          </section>
        )}
      </>
    )}
  </main>
);
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

type TabType = "chunks" | "comparison" | "recursiveSemantic" | "developer";

function TabButton({
  label,
  tab,
  activeTab,
  setActiveTab,
}: {
  label: string;
  tab: TabType;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
        activeTab === tab
          ? "bg-blue-600 text-white"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function CollapsibleChunkCard({
  chunk,
  expanded,
  onToggle,
}: {
  chunk: {
    chunk_id: number;
    text: string;
    character_count: number;
    word_count: number;
    metadata?: Record<string, unknown>;
  };
  expanded: boolean;
  onToggle: () => void;
}) {
  const shouldCollapse = chunk.text.length > 450;
  const displayText =
    shouldCollapse && !expanded ? `${chunk.text.slice(0, 450)}...` : chunk.text;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex justify-between gap-4 mb-3">
        <h3 className="font-semibold">Chunk {chunk.chunk_id}</h3>
        <span className="text-sm text-gray-400">
          {chunk.character_count} chars • {chunk.word_count} words
        </span>
      </div>

      <MetadataBadges metadata={chunk.metadata} />

      <p className="text-gray-300 whitespace-pre-wrap">{displayText}</p>

      {shouldCollapse && (
        <button onClick={onToggle} className="mt-3 text-sm text-blue-400 hover:text-blue-300">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function MetadataBadges({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const similarity = metadata.similarity_score
    ? Number(metadata.similarity_score)
    : null;

  return (
    <div className="mb-4 rounded-lg bg-gray-800 border border-gray-700 p-3">
      <div className="flex flex-wrap gap-2 mb-2">
        {metadata.type && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {String(metadata.type)}
          </span>
        )}

        {metadata.break_reason && (
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
            {String(metadata.break_reason)}
          </span>
        )}
      </div>

      {similarity !== null && (
        <>
          <div className="text-xs text-gray-300 mb-1">
            Similarity Score: {similarity.toFixed(3)}
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${similarity * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function StrategyComparisonTable({ compareResult }: { compareResult: CompareResponse }) {
  return (
    <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-2xl font-bold mb-4">Strategy Comparison</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-300">
              <th className="p-3">Strategy</th>
              <th className="p-3">Total</th>
              <th className="p-3">Avg Chars</th>
              <th className="p-3">Min</th>
              <th className="p-3">Max</th>
              <th className="p-3">Avg Words</th>
            </tr>
          </thead>

          <tbody>
            {compareResult.results.map((item) => (
              <tr key={item.strategy} className="border-b border-gray-800">
                <td className="p-3 font-medium">{item.strategy}</td>

                {item.stats ? (
                  <>
                    <td className="p-3">{item.stats.total_chunks}</td>
                    <td className="p-3">{item.stats.avg_characters}</td>
                    <td className="p-3">{item.stats.min_characters}</td>
                    <td className="p-3">{item.stats.max_characters}</td>
                    <td className="p-3">{item.stats.avg_words}</td>
                  </>
                ) : (
                  <td className="p-3 text-red-400" colSpan={5}>
                    {item.error}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
  onUse,
}: {
  recommendation: {
    recommended_strategy: string;
    confidence: string;
    reason: string;
  };
  onUse: () => void;
}) {
  return (
    <section className="mt-6 bg-amber-950 border border-amber-800 rounded-xl p-5">
      <h2 className="text-xl font-semibold mb-2">Recommended Strategy</h2>

      <p className="text-2xl font-bold text-amber-200">
        {recommendation.recommended_strategy}
      </p>

      <p className="text-sm text-amber-300 mt-2">
        Confidence: {recommendation.confidence}
      </p>

      <p className="text-gray-200 mt-3">{recommendation.reason}</p>

      <button
        onClick={onUse}
        className="mt-4 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded font-semibold"
      >
        Use This Strategy
      </button>
    </section>
  );
}

function CompareColumn({
  title,
  result,
}: {
  title: string;
  result: ChunkResponse;
}) 

{
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Total Chunks</p>
          <p className="text-xl font-bold">{result.stats.total_chunks}</p>
        </div>

        <div className="bg-gray-900 rounded p-3">
          <p className="text-xs text-gray-400">Avg Chars</p>
          <p className="text-xl font-bold">{result.stats.avg_characters}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {result.chunks.map((chunk) => (
          <div
            key={chunk.chunk_id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-3"
          >
            <div className="flex justify-between mb-2">
              <span className="font-medium">Chunk {chunk.chunk_id}</span>
              <span className="text-xs text-gray-400">
                {chunk.character_count} chars
              </span>
            </div>

            {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {chunk.metadata.type && (
                  <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                    {String(chunk.metadata.type)}
                  </span>
                )}

                {chunk.metadata.break_reason && (
                  <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                    {String(chunk.metadata.break_reason)}
                  </span>
                )}

                {chunk.metadata.similarity_score && (
                  <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">
                    Similarity: {String(chunk.metadata.similarity_score)}
                  </span>
                )}
              </div>
            )}

            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {chunk.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}