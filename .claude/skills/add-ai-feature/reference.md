# AI code patterns used in English Practice

## Structured output with fallback (services/llm.js)

```js
const { getStructuredModel, getChatModel } = require("./llm");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");

const schema = z.object({
  mistakes: z.array(z.object({ number: z.number(), reason: z.string() })),
  summary: z.string(),
  review_topics: z.array(z.string()),
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "Explain each wrong answer in Vietnamese. Do not restate the correct answer."],
  ["human", "{items}"],
]);

const chain = prompt.pipe(getStructuredModel(schema, 0.2)); // temperature 0.2: stable output
```

Temperatures used: 0 for extracting an exam from a PDF, 0.2 for grading and analysis, 0.9 for generating speaking topics.

## Chain where code owns the facts (services/analysisChain.js)

```js
RunnableSequence.from([
  prepareItems,                                          // dedupe, keep at most 5 wrong answers
  RunnablePassthrough.assign({ result: toPromptInput.pipe(prompt).pipe(structuredModel) }),
  toMarkdown,                                            // code writes question, user answer, correct answer;
]);                                                      // the model only supplies "reason" and "summary"
```

## Agent tool (services/aiTutorTools.js)

```js
const buildTools = (userId) => [          // userId comes from the JWT
  tool(
    async ({ exam_id }) => {
      try {
        const rows = await query("... WHERE er.user_id = ? ...", [userId]);
        return JSON.stringify(rows);
      } catch (error) {
        return JSON.stringify({ error: "Data is unavailable right now" });
      }
    },
    {
      name: "review_exam_result",
      description: "Get the learner's latest exam result with every answer, to explain mistakes.",
      schema: z.object({ exam_id: z.number().int().optional() }),   // no user id argument
    }
  ),
];
```

Agent setup (services/aiTutor.js):

```js
createAgent({
  model: createChatModel(CHAT_MODEL, 0.4),
  tools: buildTools(userId),
  systemPrompt: buildSystemPrompt(displayName, summary),
  middleware: [
    modelFallbackMiddleware(createChatModel(FALLBACK_MODEL, 0.4)),
    toolCallLimitMiddleware({ runLimit: 6, exitBehavior: "continue" }),
  ],
});
agent.invoke({ messages }, { recursionLimit: 20, signal: AbortSignal.timeout(50000) });
```

## RAG (services/ragChain.js)

- Index: text → `RecursiveCharacterTextSplitter` (chunk 1000, overlap 150) → `gemini-embedding-001` (768 dims) → Qdrant collection `english_knowledge` with metadata `{ source, source_id, title, page, link }`.
- Retrieve: search each group with a `metadata.source` filter (`match: { any: [...] }`), merge, drop score < 0.55, dedupe.
- Answer: number the context `[1] (Nguồn: title, trang N)`; after the model answers, code keeps only sources whose numbers appear in the answer. If the answer starts with "Kho tài liệu chưa có thông tin", return no sources.

## Memory (services/chatMemory.js)

- `MySQLChatMessageHistory extends BaseListChatMessageHistory` over table `ai_messages`.
- Send the last 6 messages verbatim; when more than 12 messages are not summarised, fold the oldest into `ai_conversations.summary` (about 120 words: goals, weaknesses, topics, open questions) and store `summarized_until`.
- Summarise after the reply is sent; the `UPDATE ... WHERE summarized_until <=> ?` guard stops two requests overwriting each other.

## Measuring retrieval

```js
const hits = await knowledgeRetriever.invoke({ query, scope: "all" });
hits.forEach((h) => console.log(h.score.toFixed(3), h.citation));
```

Run the same 3–5 real questions before and after a change and compare the top results and scores.
