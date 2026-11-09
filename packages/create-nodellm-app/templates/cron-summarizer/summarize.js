import { NodeLLM } from "@node-llm/core";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

// Summarizes every .txt file in ./inbox into structured data.
// `npm run once` runs a single pass; `npm start` repeats every INTERVAL_MINUTES (default 60).
// In production, prefer your scheduler (cron, a queue worker, a cloud scheduler) calling `npm run once`.

const Summary = z.object({
  title: z.string().describe("A short title for the document"),
  summary: z.string().describe("Two or three sentences"),
  actionItems: z.array(z.string()).describe("Concrete follow-ups, empty if none"),
  sentiment: z.enum(["positive", "neutral", "negative"])
});

async function runOnce() {
  const dir = "inbox";
  const files = (await readdir(dir)).filter((name) => name.endsWith(".txt"));
  if (files.length === 0) return console.log("Nothing to summarize in ./inbox");

  for (const name of files) {
    const text = await readFile(join(dir, name), "utf8");
    const chat = NodeLLM.chat(process.env.NODELLM_MODEL || undefined).withSchema(Summary);
    const response = await chat.ask(`Summarize this document:\n\n${text}`);
    console.log(`\n${name}`);
    console.log(JSON.stringify(response.data, null, 2));
  }
}

async function safeRun() {
  try {
    await runOnce();
    return true;
  } catch (error) {
    console.error(`\nSummarize failed: ${error.message}`);
    console.error("Check NODELLM_PROVIDER, NODELLM_MODEL and your API key in .env.");
    return false;
  }
}

const ok = await safeRun();

if (process.argv.includes("--once")) {
  process.exitCode = ok ? 0 : 1;
} else {
  const minutes = Number(process.env.INTERVAL_MINUTES) || 60;
  console.log(`\nNext run in ${minutes} minutes. Press Ctrl+C to stop.`);
  setInterval(safeRun, minutes * 60_000);
}
