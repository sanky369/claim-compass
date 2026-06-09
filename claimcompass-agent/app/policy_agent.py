import asyncio
import json
import os
import re
import shutil
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any, Protocol

from google import genai
from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client

EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2")
EMBEDDING_DIMENSIONS = 1536
DEFAULT_DATABASE = "claimcompass"
DEFAULT_PLAYBOOK_LIMIT = 8


@dataclass(frozen=True)
class PolicyQuery:
    payer_id: str
    cpt: str
    raw_text: str
    carc: tuple[str, ...] = ()
    rarc: tuple[str, ...] = ()
    cpt_family: str | None = None


@dataclass(frozen=True)
class PolicyChunk:
    id: str
    title: str
    body: str
    source_url: str
    score: float | None
    scope: dict[str, Any]


@dataclass(frozen=True)
class DenialCodeDescription:
    code: str
    label: str
    demo_summary: str | None = None


@dataclass(frozen=True)
class PolicyResult:
    chunks: list[PolicyChunk]
    carc_descriptions: list[DenialCodeDescription]
    rarc_descriptions: list[DenialCodeDescription]
    fallback_reason: str | None = None


class Embedder(Protocol):
    async def embed_query(self, text: str) -> list[float]:
        ...


class MongodbTools(Protocol):
    async def aggregate(
        self, database: str, collection: str, pipeline: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        ...

    async def find(
        self,
        database: str,
        collection: str,
        filter: dict[str, Any],
        limit: int,
    ) -> list[dict[str, Any]]:
        ...


class GeminiEmbedder:
    def __init__(
        self,
        project: str | None = None,
        location: str | None = None,
        model: str = EMBEDDING_MODEL,
    ) -> None:
        self._model = model
        self._client = genai.Client(
            vertexai=True,
            project=project or os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=location or os.environ.get("GOOGLE_CLOUD_LOCATION", "global"),
        )

    async def embed_query(self, text: str) -> list[float]:
        if self._model == "gemini-embedding-2":
            contents = f"task: search result | query: {text}"
            config = {"output_dimensionality": EMBEDDING_DIMENSIONS}
        else:
            contents = text
            config = {
                "task_type": "RETRIEVAL_QUERY",
                "output_dimensionality": EMBEDDING_DIMENSIONS,
            }
        response = await asyncio.to_thread(
            self._client.models.embed_content,
            model=self._model,
            contents=contents,
            config=config,
        )
        values = response.embeddings[0].values if response.embeddings else None
        if not values or len(values) != EMBEDDING_DIMENSIONS:
            raise ValueError(
                f"Expected {EMBEDDING_DIMENSIONS} embedding dimensions; got "
                f"{len(values) if values else 'missing'}"
            )
        return list(values)


class MongodbMcpTools:
    def __init__(self, connection_string: str | None = None) -> None:
        _load_local_env()
        self._connection_string = connection_string or os.environ.get("MONGODB_URI")
        if not self._connection_string:
            raise ValueError("Missing MONGODB_URI for MongoDB MCP tools.")

    @asynccontextmanager
    async def _session(self):
        env = {
            **os.environ,
            "MDB_MCP_CONNECTION_STRING": self._connection_string,
            "MDB_MCP_READ_ONLY": "false",
            "MDB_MCP_TELEMETRY": "disabled",
            "MDB_MCP_LOGGERS": "mcp",
        }
        node_binary = os.environ.get("NODE_BINARY") or shutil.which("node")
        node_dir = Path(node_binary).resolve().parent if node_binary else None
        if node_dir and node_dir.exists():
            env["PATH"] = f"{node_dir}:{env.get('PATH', '')}"

        server_params = StdioServerParameters(
            command="npx",
            args=["mongodb-mcp-server"],
            env=env,
        )
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session

    async def aggregate(
        self, database: str, collection: str, pipeline: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        async with self._session() as session:
            result = await session.call_tool(
                "aggregate",
                {
                    "database": database,
                    "collection": collection,
                    "pipeline": pipeline,
                },
                read_timeout_seconds=timedelta(seconds=45),
            )
        return _extract_mcp_documents(result)

    async def find(
        self,
        database: str,
        collection: str,
        filter: dict[str, Any],
        limit: int,
    ) -> list[dict[str, Any]]:
        async with self._session() as session:
            result = await session.call_tool(
                "find",
                {
                    "database": database,
                    "collection": collection,
                    "filter": filter,
                    "limit": limit,
                },
                read_timeout_seconds=timedelta(seconds=45),
            )
        return _extract_mcp_documents(result)


class PolicyAgentRetriever:
    def __init__(
        self,
        embedder: Embedder,
        mongodb: MongodbTools,
        database: str = DEFAULT_DATABASE,
        playbook_limit: int = DEFAULT_PLAYBOOK_LIMIT,
    ) -> None:
        self._embedder = embedder
        self._mongodb = mongodb
        self._database = database
        self._playbook_limit = playbook_limit

    async def retrieve(self, query: PolicyQuery) -> PolicyResult:
        cpt_family = query.cpt_family or infer_cpt_family(query.cpt)
        query_vector = await self._embedder.embed_query(_embedding_text(query))
        chunks = await self._retrieve_chunks(query, cpt_family, query_vector)
        carc_descriptions = await self._find_codes("carc", query.carc)
        rarc_descriptions = await self._find_codes("rarc", query.rarc)

        fallback_reason = None
        if not chunks:
            fallback_reason = (
                "No payer playbook chunks matched the payer and CPT family. "
                "Route to human review before drafting payer-specific guidance."
            )

        return PolicyResult(
            chunks=chunks,
            carc_descriptions=carc_descriptions,
            rarc_descriptions=rarc_descriptions,
            fallback_reason=fallback_reason,
        )

    async def _retrieve_chunks(
        self, query: PolicyQuery, cpt_family: str, query_vector: list[float]
    ) -> list[PolicyChunk]:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "playbook_vec",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 100,
                    "limit": self._playbook_limit,
                    "filter": {
                        "payer_id": query.payer_id,
                        "scope.cpt_family": cpt_family,
                    },
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "title": 1,
                    "body": 1,
                    "source_url": 1,
                    "scope": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        rows = await self._mongodb.aggregate(
            self._database, "payer_playbooks", pipeline
        )
        return [
            PolicyChunk(
                id=str(row.get("_id")),
                title=str(row.get("title", "")),
                body=str(row.get("body", "")),
                source_url=str(row.get("source_url", "")),
                score=row.get("score"),
                scope=dict(row.get("scope") or {}),
            )
            for row in rows
            if row.get("_id") and row.get("title")
        ]

    async def _find_codes(
        self, collection: str, codes: tuple[str, ...]
    ) -> list[DenialCodeDescription]:
        if not codes:
            return []
        rows = await self._mongodb.find(
            self._database,
            collection,
            {"code": {"$in": list(codes)}},
            len(codes),
        )
        return [
            DenialCodeDescription(
                code=str(row.get("code")),
                label=str(row.get("label", "")),
                demo_summary=row.get("demo_summary"),
            )
            for row in rows
            if row.get("code")
        ]


def infer_cpt_family(cpt: str) -> str:
    if cpt == "90791":
        return "evaluation_90791"
    if cpt in {"90832", "90834", "90837"}:
        return "psychotherapy_90_codes"
    return "telehealth_modifiers"


def _load_local_env() -> None:
    candidates = [
        Path.cwd() / ".env.local",
        Path.cwd() / ".env",
        Path.cwd().parent / ".env.local",
        Path.cwd().parent / ".env",
    ]
    for path in candidates:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#") or "=" not in trimmed:
                continue
            key, value = trimmed.split("=", 1)
            key = key.strip()
            value = value.strip().strip("\"'")
            if key and key not in os.environ:
                os.environ[key] = value


def _embedding_text(query: PolicyQuery) -> str:
    return "\n".join(
        [
            f"payer_id: {query.payer_id}",
            f"cpt: {query.cpt}",
            f"carc: {', '.join(query.carc)}",
            f"rarc: {', '.join(query.rarc)}",
            query.raw_text,
        ]
    )


def _extract_mcp_documents(result: Any) -> list[dict[str, Any]]:
    if getattr(result, "isError", False):
        text = _mcp_text(result)
        raise RuntimeError(f"MongoDB MCP tool failed: {text[:1000]}")

    structured = getattr(result, "structuredContent", None)
    if isinstance(structured, dict):
        rows = structured.get("result")
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]

    text = _mcp_text(result)
    matches = re.findall(
        r"<untrusted-user-data-[^>]+>\s*([\s\S]*?)\s*</untrusted-user-data-[^>]+>",
        text,
    )
    candidates = [match.strip() for match in matches if match.strip().startswith("[")]
    candidates.append(text[text.find("[") : text.rfind("]") + 1] if "[" in text else "")

    for candidate in candidates:
        if not candidate:
            continue
        try:
            rows = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
    return []


def _mcp_text(result: Any) -> str:
    parts = getattr(result, "content", []) or []
    return "\n".join(
        part.text for part in parts if getattr(part, "type", None) == "text"
    )
