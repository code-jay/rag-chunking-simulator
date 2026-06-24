"use client";

import { useState } from "react";
import { ChunkResponse, CompareResponse } from "@/types/chunking";

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
      throw new Error(data.detail || "Comparison failed");
    }

    setCompareResult(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">
        RAG Chunking Strategy Simulator
      </h1>

      <p className="text-gray-400 mb-8">
        Compare chunking strategies for RAG and Enterprise AI pipelines.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>

          <label className="block mb-2 text-sm text-gray-300">Strategy</label>
          <select
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
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

          <label className="block mb-2 text-sm text-gray-300">Chunk Size</label>
          <input
            type="number"
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4"
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
          />

          <label className="block mb-2 text-sm text-gray-300">
            Chunk Overlap
          </label>
          <input
            type="number"
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4"
            value={chunkOverlap}
            onChange={(e) => setChunkOverlap(Number(e.target.value))}
          />

          <button
            onClick={runChunking}
            disabled={loading || (!text.trim() && !file)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 p-3 rounded font-semibold"
          >
            {loading ? "Chunking..." : "Run Chunking"}
          </button>
          <button
            onClick={compareStrategies}
            disabled={loading || !text.trim()}
            className="w-full mt-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 p-3 rounded font-semibold"
          >
            Compare Strategies
          </button>
        </section>

        <section className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-4">Input Text</h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm text-gray-300">
              Upload File
            </label>

            <input
              type="file"
              accept=".txt,.md,.pdf,.docx,.html,.json,.csv,.py,.js,.ts,.tsx,.jsx"
              className="w-full p-3 rounded bg-gray-800 border border-gray-700"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                setFile(selectedFile);
              }}
            />

            {file && (
              <p className="mt-2 text-sm text-green-400">
                Selected: {file.name}
              </p>
            )}
          </div>
          <textarea
            className="w-full h-72 p-4 rounded bg-gray-800 border border-gray-700"
            placeholder="Paste your document text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </section>
      </div>
      {compareResult && (
      <section className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-2xl font-bold mb-4">Strategy Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-300">
                <th className="p-3">Strategy</th>
                <th className="p-3">Total Chunks</th>
                <th className="p-3">Avg Chars</th>
                <th className="p-3">Min Chars</th>
                <th className="p-3">Max Chars</th>
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
    )}
      {result && (
        <>
        {result.file && (
            <section className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-2">Uploaded File</h2>
              <p className="text-gray-300">Filename: {result.file.filename}</p>
              <p className="text-gray-300">Type: {result.file.content_type}</p>
              <p className="text-gray-300">
                Extracted Characters: {result.file.extracted_characters}
              </p>
            </section>
          )}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <Stat title="Total Chunks" value={result.stats.total_chunks} />
            <Stat title="Avg Chars" value={result.stats.avg_characters} />
            <Stat title="Min Chars" value={result.stats.min_characters} />
            <Stat title="Max Chars" value={result.stats.max_characters} />
            <Stat title="Avg Words" value={result.stats.avg_words} />
          </section>
            
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Chunks</h2>

            <div className="space-y-4">
              {result.chunks.map((chunk) => (
                <div
                  key={chunk.chunk_id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="font-semibold">Chunk {chunk.chunk_id}</h3>
                    <span className="text-sm text-gray-400">
                      {chunk.character_count} chars • {chunk.word_count} words
                    </span>
                  </div>

                  <p className="text-gray-300 whitespace-pre-wrap">
                    {chunk.text}
                  </p>
                  {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                    <pre className="text-xs bg-gray-800 border border-gray-700 rounded p-3 mb-3 text-green-300 overflow-x-auto">
                      {JSON.stringify(chunk.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                
              ))}
            </div>
          </section>
          {error && (
            <div className="mt-6 bg-red-950 border border-red-800 text-red-200 rounded-xl p-4">
              {error}
            </div>
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