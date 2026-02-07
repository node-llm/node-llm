/**
 * Super Agent Example - One Agent to Rule Them All
 *
 * This example demonstrates a versatile "super agent" with access to multiple
 * tools for math, content creation, research, and more.
 *
 * Run: node examples/scripts/core/agents/super-agent.mjs
 */

import "dotenv/config";
import { Agent, Tool, z, createLLM } from "../../../../packages/core/dist/index.js";

// Create an LLM instance
const llm = createLLM({ provider: "openai" });

// ============================================================================
// Tools: Calculator for Math
// ============================================================================

class CalculatorTool extends Tool {
  name = "calculator";
  description = "Performs arithmetic operations: add, subtract, multiply, divide, power, sqrt";
  schema = z.object({
    operation: z.enum(["add", "subtract", "multiply", "divide", "power", "sqrt"]),
    a: z.number().describe("First number"),
    b: z.number().optional().describe("Second number (not needed for sqrt)")
  });

  async execute({ operation, a, b }) {
    console.log(`  📊 [Calculator] ${operation}(${a}${b !== undefined ? ", " + b : ""})`);
    switch (operation) {
      case "add": return { result: a + b };
      case "subtract": return { result: a - b };
      case "multiply": return { result: a * b };
      case "divide": return b !== 0 ? { result: a / b } : { error: "Cannot divide by zero" };
      case "power": return { result: Math.pow(a, b) };
      case "sqrt": return { result: Math.sqrt(a) };
    }
  }
}

// ============================================================================
// Tools: Web Search for Research
// ============================================================================

class WebSearchTool extends Tool {
  name = "web_search";
  description = "Search the web for information on any topic";
  schema = z.object({
    query: z.string().describe("Search query")
  });

  async execute({ query }) {
    console.log(`  🔍 [WebSearch] Searching: "${query}"`);
    // Simulated search results
    return {
      results: [
        { title: `Top result for: ${query}`, snippet: `This is comprehensive information about ${query}...` },
        { title: `${query} - Wikipedia`, snippet: `${query} is a topic that covers...` },
        { title: `Latest news on ${query}`, snippet: `Recent developments in ${query} include...` }
      ]
    };
  }
}

// ============================================================================
// Tools: Content Writer for Creative Work
// ============================================================================

class ContentWriterTool extends Tool {
  name = "write_content";
  description = "Generate various types of content: blog posts, emails, stories, poems, tweets";
  schema = z.object({
    type: z.enum(["blog", "email", "story", "poem", "tweet", "summary"]),
    topic: z.string().describe("The topic or subject to write about"),
    tone: z.enum(["professional", "casual", "humorous", "formal", "creative"]).optional(),
    length: z.enum(["short", "medium", "long"]).optional()
  });

  async execute({ type, topic, tone = "professional", length = "medium" }) {
    console.log(`  ✍️ [ContentWriter] Creating ${length} ${tone} ${type} about "${topic}"`);
    // Return metadata - the LLM will use this to generate actual content
    return {
      contentType: type,
      topic,
      tone,
      length,
      guidelines: this.getGuidelines(type, tone, length)
    };
  }

  getGuidelines(type, tone, length) {
    const lengthGuide = { short: "50-100 words", medium: "150-300 words", long: "400-600 words" };
    return `Generate a ${type} with ${tone} tone, approximately ${lengthGuide[length]}`;
  }
}

// ============================================================================
// Tools: Code Helper for Technical Tasks
// ============================================================================

class CodeHelperTool extends Tool {
  name = "code_helper";
  description = "Help with coding tasks: explain code, generate snippets, debug, or suggest improvements";
  schema = z.object({
    action: z.enum(["explain", "generate", "debug", "improve", "convert"]),
    language: z.string().describe("Programming language"),
    code: z.string().optional().describe("Existing code to analyze (for explain/debug/improve)"),
    task: z.string().optional().describe("Description of what to generate or convert to")
  });

  async execute({ action, language, code, task }) {
    console.log(`  💻 [CodeHelper] ${action} in ${language}`);
    return {
      action,
      language,
      inputCode: code,
      task,
      context: `Performing ${action} operation for ${language} code`
    };
  }
}

// ============================================================================
// Tools: Task Manager for Organization
// ============================================================================

const tasks = [];

class TaskManagerTool extends Tool {
  name = "manage_tasks";
  description = "Manage a todo list: add, complete, list, or prioritize tasks";
  schema = z.object({
    action: z.enum(["add", "complete", "list", "prioritize"]),
    task: z.string().optional().describe("Task description (for add)"),
    taskId: z.number().optional().describe("Task ID (for complete/prioritize)"),
    priority: z.enum(["high", "medium", "low"]).optional()
  });

  async execute({ action, task, taskId, priority }) {
    console.log(`  📋 [TaskManager] ${action}`);
    
    switch (action) {
      case "add":
        const newTask = { id: tasks.length + 1, task, priority: priority || "medium", completed: false };
        tasks.push(newTask);
        return { success: true, message: `Added task: "${task}"`, task: newTask };
      
      case "complete":
        const toComplete = tasks.find(t => t.id === taskId);
        if (toComplete) {
          toComplete.completed = true;
          return { success: true, message: `Completed task: "${toComplete.task}"` };
        }
        return { success: false, message: `Task ${taskId} not found` };
      
      case "list":
        return { tasks: tasks.filter(t => !t.completed), completed: tasks.filter(t => t.completed) };
      
      case "prioritize":
        const toPrioritize = tasks.find(t => t.id === taskId);
        if (toPrioritize) {
          toPrioritize.priority = priority;
          return { success: true, message: `Set priority of "${toPrioritize.task}" to ${priority}` };
        }
        return { success: false, message: `Task ${taskId} not found` };
    }
  }
}

// ============================================================================
// Tools: Date/Time Utilities
// ============================================================================

class DateTimeTool extends Tool {
  name = "datetime";
  description = "Get current date/time, calculate date differences, or format dates";
  schema = z.object({
    action: z.enum(["now", "format", "difference", "add"]),
    date: z.string().optional().describe("Date string (ISO format)"),
    date2: z.string().optional().describe("Second date for difference calculation"),
    amount: z.number().optional().describe("Amount to add"),
    unit: z.enum(["days", "weeks", "months", "years"]).optional()
  });

  async execute({ action, date, date2, amount, unit }) {
    console.log(`  📅 [DateTime] ${action}`);
    const now = new Date();
    
    switch (action) {
      case "now":
        return {
          iso: now.toISOString(),
          local: now.toLocaleString(),
          date: now.toDateString(),
          time: now.toTimeString().split(" ")[0]
        };
      
      case "format":
        const d = new Date(date);
        return {
          iso: d.toISOString(),
          local: d.toLocaleString(),
          relative: this.getRelativeTime(d)
        };
      
      case "difference":
        const d1 = new Date(date);
        const d2 = new Date(date2);
        const diffMs = Math.abs(d2 - d1);
        return {
          days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
          hours: Math.floor(diffMs / (1000 * 60 * 60)),
          minutes: Math.floor(diffMs / (1000 * 60))
        };
      
      case "add":
        const base = date ? new Date(date) : now;
        const multipliers = { days: 1, weeks: 7, months: 30, years: 365 };
        base.setDate(base.getDate() + (amount * multipliers[unit]));
        return { result: base.toISOString(), formatted: base.toDateString() };
    }
  }

  getRelativeTime(date) {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
}

// ============================================================================
// The Super Agent - Access to ALL Tools
// ============================================================================

class SuperAgent extends Agent {
  static model = "gpt-4o-mini";
  static instructions = `You are a versatile AI assistant with access to multiple powerful tools.
You can help with:
- 📊 Math and calculations (use calculator)
- 🔍 Research and information lookup (use web_search)
- ✍️ Content creation: blogs, emails, stories, poems, tweets (use write_content)
- 💻 Coding help: explain, generate, debug, improve code (use code_helper)
- 📋 Task management: add, complete, list, prioritize todos (use manage_tasks)
- 📅 Date/time operations (use datetime)

Always use the appropriate tool for the task. Be helpful, creative, and thorough.
When doing math, always show your work. When writing content, ask for preferences if not specified.`;

  static tools = [
    CalculatorTool,
    WebSearchTool,
    ContentWriterTool,
    CodeHelperTool,
    TaskManagerTool,
    DateTimeTool
  ];

  static temperature = 0.7;
}

// ============================================================================
// Interactive Demo
// ============================================================================

async function main() {
  console.log("=== 🦸 Super Agent Demo ===\n");
  console.log("This agent can handle math, research, content, coding, tasks, and dates!\n");

  const agent = new SuperAgent({ llm });

  // Demo 1: Math
  console.log("─".repeat(60));
  console.log("1️⃣ MATH: Calculate compound interest\n");
  const math = await agent.ask(
    "If I invest $1000 at 5% annual interest, what will it be worth after 10 years with compound interest? Use the formula: P * (1 + r)^t"
  );
  console.log(`Response: ${math}\n`);

  // Demo 2: Content Creation
  console.log("─".repeat(60));
  console.log("2️⃣ CONTENT: Write a tweet\n");
  const tweet = await agent.ask(
    "Write a catchy tweet announcing a new AI product launch. Make it exciting and include emojis!"
  );
  console.log(`Response: ${tweet}\n`);

  // Demo 3: Task Management
  console.log("─".repeat(60));
  console.log("3️⃣ TASKS: Add some todos\n");
  const tasks1 = await agent.ask(
    "Add these tasks to my list: 1) Review quarterly report (high priority), 2) Send team update email, 3) Schedule meeting with Sarah"
  );
  console.log(`Response: ${tasks1}\n`);

  // Demo 4: Date Calculation
  console.log("─".repeat(60));
  console.log("4️⃣ DATES: Calculate project deadline\n");
  const dates = await agent.ask(
    "If today is the start date, what date will it be in 6 weeks? Also tell me what day of the week that will be."
  );
  console.log(`Response: ${dates}\n`);

  // Demo 5: Multi-tool (Research + Content)
  console.log("─".repeat(60));
  console.log("5️⃣ MULTI-TOOL: Research and create content\n");
  const multi = await agent.ask(
    "Research the topic 'AI in healthcare' and then write a short blog post introduction about it."
  );
  console.log(`Response: ${multi}\n`);

  console.log("=== 🎉 Demo Complete ===");
  console.log(`Total tokens used: ${agent.totalUsage.total_tokens}`);
}

main().catch(console.error);
