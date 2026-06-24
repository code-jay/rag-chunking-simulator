# RAG Chunking Strategy Simulator

## Overview

RAG Chunking Strategy Simulator is a full-stack web application for
experimenting with and comparing document chunking strategies used in
Retrieval-Augmented Generation (RAG), Enterprise AI, and LLM
applications.

The simulator allows developers to upload documents or paste text, apply
multiple chunking algorithms, compare outputs, and understand how
chunking impacts downstream retrieval quality.

## Features

### Basic Chunking

-   Fixed Character Chunking
-   Fixed Word Chunking
-   Fixed Token Chunking
-   Sliding Window Chunking
-   Paragraph Chunking
-   Sentence Chunking

### LangChain Chunking

-   RecursiveCharacterTextSplitter
-   Markdown Header Chunking
-   HTML Header Chunking
-   Recursive JSON Chunking
-   Python Code Chunking
-   JavaScript Code Chunking

### File Support

-   TXT
-   PDF
-   DOCX
-   Markdown
-   HTML
-   JSON
-   CSV
-   Python
-   JavaScript

### Comparison

-   Strategy comparison table
-   Chunk statistics
-   Character and word counts
-   Metadata support

## Architecture

    Frontend (Next.js)
            |
            v
    FastAPI Backend
            |
            v
    Chunk Service
            |
            +--> Basic Chunkers
            +--> LangChain Chunkers
            +--> Structure Aware Chunkers
            |
            v
    Statistics & Comparison

## Tech Stack

### Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS

### Backend

-   FastAPI
-   LangChain
-   langchain-text-splitters
-   pypdf
-   python-docx
-   pandas
-   tiktoken

## Project Structure

    backend/
      app/
        api/
        chunkers/
        extractors/
        models/
        services/
        utils/

    frontend/
      app/
      components/
      types/

## Installation

### Backend

``` bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

``` bash
cd frontend

npm install
npm run dev
```

## API Endpoints

  Method   Endpoint            Description
  -------- ------------------- ----------------------
  GET      /                   Health
  GET      /strategies         Supported strategies
  POST     /chunk              Chunk text
  POST     /compare            Compare strategies
  POST     /upload-and-chunk   Upload and chunk

## Example Request

``` json
{
  "text": "Enterprise AI requires intelligent document chunking.",
  "strategy": "recursive",
  "chunk_size": 800,
  "chunk_overlap": 120
}
```

## Roadmap

-   Semantic chunking
-   Embedding visualization
-   LLM-based chunking
-   Agentic chunking
-   Retrieval simulation
-   Token visualization
-   Export JSON/CSV
-   AI strategy recommendation

## Learning Goals

This project demonstrates: - Enterprise RAG architecture - LangChain
text splitters - Structure-aware chunking - Document preprocessing -
FastAPI backend development - Next.js frontend development

## License

MIT
