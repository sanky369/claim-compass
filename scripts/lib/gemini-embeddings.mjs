export const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
export const embeddingDimensions = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || 1536);

export function retrievalQueryContent(query) {
  if (embeddingModel === "gemini-embedding-2") {
    return `task: search result | query: ${query}`;
  }
  return query;
}

export function retrievalDocumentContent({ title, body }) {
  if (embeddingModel === "gemini-embedding-2") {
    return `title: ${title || "none"} | text: ${body || ""}`;
  }
  return `${title || "Untitled"}\n\n${body || ""}`;
}

export function retrievalQueryConfig() {
  if (embeddingModel === "gemini-embedding-2") {
    return { outputDimensionality: embeddingDimensions };
  }
  return {
    taskType: "RETRIEVAL_QUERY",
    outputDimensionality: embeddingDimensions,
  };
}

export function retrievalDocumentConfig(title) {
  if (embeddingModel === "gemini-embedding-2") {
    return { outputDimensionality: embeddingDimensions };
  }
  return {
    taskType: "RETRIEVAL_DOCUMENT",
    title,
    outputDimensionality: embeddingDimensions,
  };
}
