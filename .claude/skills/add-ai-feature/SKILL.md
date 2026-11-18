---
name: add-ai-feature
description: Add or change an AI feature in English Practice using LangChain.js and Gemini (prompts, structured output, chains, RAG over Qdrant, chat memory, the tutor agent and its tools). Use when asked to build, extend, debug or improve anything AI-related in english-practice-backend/services.
when_to_use: Also use for AI bugs such as wrong answers, made-up facts, slow replies, 503 overloads, empty embeddings or poor retrieval results.
---

# Add an AI feature (LangChain.js + Gemini)

Read [reference.md](reference.md) for code patterns before writing code.

## Where things live

| Concern | File |
|---|---|
| Shared chat models, fallback, embeddings | `services/llm.js` |
| Fixed pipelines (chains) | `services/analysisChain.js`, `services/examImporter.js` |
| RAG: indexing, search, answer with citations | `services/knowledgeBase.js`, `services/documentIngest.js`, `services/ragChain.js` |
| Chat memory (MySQL history + summary) | `services/chatMemory.js` |
| Tutor agent and its tools | `services/aiTutor.js`, `services/aiTutorTools.js` |

## Steps

1. **Choose the simplest shape that works.** Fixed steps → a chain. The model must decide what data it needs → a tool for the agent. Answer from documents → RAG. Do not add an agent where a chain is enough.
2. **Reuse `llm.js`.** Never create a new `ChatGoogleGenerativeAI` in a feature file; use `getChatModel`, `getStructuredModel` or `createChatModel` so every feature gets the same model, retry and fallback.
3. **Make output structured.** If code consumes the result, define a Zod schema and use `getStructuredModel(schema)`. Gemini's response schema rejects `.nullable()`; use `""` or `[]` for "unknown".
4. **Let code own the facts.** Anything the code already knows (correct answers, citation list, links, user id) is filled in by code. The model only explains or ranks. This fixed a real bug where the model copied the wrong correct answer.
5. **Tools are read-only and user-bound.** Tools are built per request with `buildTools(userId)`; the user id comes from the JWT, never from a tool argument. Validate arguments with Zod. Catch errors inside the tool and return `{ error }` so the agent can still answer.
6. **Measure before tuning.** For retrieval changes, write a small script that prints the top results and scores for real questions, before and after. Keep a change only if the numbers improve. (Embedding task types were tested this way and gave +0 to +0.06, so they were not adopted.)
7. **Verify end to end** with the `run-and-verify` skill: call the real endpoint, check the answer, the sources and `tools_used`, and check that nothing private leaks.

## Guardrails already in place (keep them)

- Primary model + fallback model; `maxRetries: 1`; agent `toolCallLimitMiddleware` (6 calls) and a 50 s timeout; chat rate limit 20 requests/min per user.
- RAG searches each source group separately (documents, lessons, flashcards, exam questions) and drops results below score 0.55; exam questions are indexed **without answers**.
- Embedding on the free tier allows 100 requests/min and LangChain returns **empty vectors** instead of throwing on 429: embed in batches of 20, check for empty vectors, retry, and run indexing in the background.
- Long work (document ingest, summarising memory) runs after the response (`202 Accepted` or fire-and-forget with `.catch`).
- The Gemini API key stays in the backend `.env`, never in the frontend or in logs.
