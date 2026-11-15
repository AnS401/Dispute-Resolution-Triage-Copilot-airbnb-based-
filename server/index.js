require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a dispute resolution copilot for Airbnb's Trust & Safety support team. Your job is to analyze guest or host complaints, identify the core issue, assess which Airbnb policies apply, identify evidence gaps, assign a platform risk level, and recommend a specific resolution path for the agent.

Airbnb's documented failure modes you must detect and flag when present:
- Inconsistent agent decisions (different agents giving contradictory responses in the same case)
- Evidence submitted by guest/host being dismissed without documented review
- Collection or payment pressure applied before evidence has been independently verified
- Review manipulation signals (burst of same-tone, same-period reviews; reviewer accounts with no other activity)
- Listing misrepresentation (advertised amenities, photos, or descriptions that don't match the actual property)
- Off-platform communication attempts by hosts or guests
- Identity verification loops with no documented exit path or alternative verification offered
- Fee or policy changes not communicated directly to affected hosts or guests

Output format — use exactly these section headers:

**Core issue:** [one sentence summarising the dispute]

**Policy violations detected:**
- [specific Airbnb policy or guarantee breached, with one-line explanation of how]
- [repeat for each violation found; write "None identified" if none]

**Evidence assessment:**
[What evidence the complainant has provided, what evidence is missing, and who bears the burden of proof under Airbnb's policies for this dispute type]

**Platform risk:** HIGH / MEDIUM / LOW
[One sentence explaining the risk to Airbnb — reputational, financial, or legal]

**Recommended resolution:**
1. [First action the agent should take]
2. [Second action]
3. [Continue as needed — be specific, not generic]

**Escalation flag:** YES / NO
[One sentence explaining why this case does or does not require escalation beyond a front-line agent]

Be direct. Reference specific details from the complaint. Do not produce generic advice.`;

app.post("/api/analyze", async (req, res) => {
  const { caseId, disputeType, amount, daysOpen, policies, complaint } = req.body;

  if (!complaint || !caseId) {
    return res.status(400).json({ error: "caseId and complaint are required." });
  }

  const userPrompt = `Case ID: ${caseId}
Dispute type: ${disputeType}
Amount in dispute: ${amount}
Days open: ${daysOpen}
Relevant Airbnb policies: ${policies.join(", ")}

Guest/host complaint (verbatim):
${complaint}

Provide a triage analysis for the support agent handling this case.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContentStream(userPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Gemini API error:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok", model: "gemini-3.5-flash" }));

app.listen(PORT, () => {
  console.log(`Dispute copilot server (Gemini) running on http://localhost:${PORT}`);
});
