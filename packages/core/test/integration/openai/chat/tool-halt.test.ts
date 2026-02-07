import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM, Tool, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

// ============================================================================
// Test Tools with Halt
// ============================================================================

class PaymentTool extends Tool {
  name = "process_payment";
  description = "Process a payment. Large amounts require approval.";
  schema = z.object({
    amount: z.number().describe("Amount in dollars"),
    recipient: z.string().describe("Recipient name")
  });

  async execute({ amount, recipient }: { amount: number; recipient: string }) {
    if (amount > 10000) {
      return this.halt(`Payment of $${amount} to ${recipient} requires manager approval.`);
    }
    if (amount <= 0) {
      return this.halt(`Invalid payment amount: $${amount}. Must be positive.`);
    }
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      amount,
      recipient
    };
  }
}

class SafetyTool extends Tool {
  name = "execute_action";
  description = "Execute a system action. Some actions are restricted.";
  schema = z.object({
    action: z.enum(["read", "write", "delete"]).describe("Action type"),
    resource: z.string().describe("Resource path")
  });

  async execute({ action, resource }: { action: string; resource: string }) {
    const protectedPaths = ["/etc", "/system", "/root"];

    if (protectedPaths.some((p) => resource.startsWith(p))) {
      return this.halt(`Access denied: ${resource} is a protected path.`);
    }

    if (action === "delete") {
      return this.halt(`Delete operation on ${resource} requires confirmation.`);
    }

    return { action, resource, success: true };
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("OpenAI ToolHalt Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should halt on large payment amount", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm
      .chat("gpt-4o-mini")
      .withTool(PaymentTool)
      .withInstructions("Help users make payments using the payment tool.");

    const response = await chat.ask("Pay $50000 to Acme Corp");

    // Should contain halt message, not a processed payment
    expect(String(response)).toContain("requires manager approval");
    expect(String(response)).toContain("$50000");
  });

  it("should process normal payment without halt", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm
      .chat("gpt-4o-mini")
      .withTool(PaymentTool)
      .withInstructions("Help users make payments using the payment tool.");

    const response = await chat.ask("Pay $100 to John");

    // Should contain success indicators
    expect(String(response)).toContain("100");
    expect(String(response).toLowerCase()).toMatch(/success|completed|processed/);
  });

  it("should halt on protected path access", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm
      .chat("gpt-4o-mini")
      .withTool(SafetyTool)
      .withInstructions("Help users with file operations.");

    const response = await chat.ask("Read /etc/passwd");

    expect(String(response)).toContain("Access denied");
    expect(String(response)).toContain("protected");
  });

  it("should halt on delete operation", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm
      .chat("gpt-4o-mini")
      .withTool(SafetyTool)
      .withInstructions("Help users with file operations.");

    const response = await chat.ask("Delete /home/user/temp.txt");

    expect(String(response)).toContain("confirmation");
    expect(String(response).toLowerCase()).toContain("delete");
  });

  it("should allow normal file read without halt", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm
      .chat("gpt-4o-mini")
      .withTool(SafetyTool)
      .withInstructions("Help users with file operations.");

    const response = await chat.ask("Read /home/user/notes.txt");

    // Should succeed without halt
    expect(String(response).toLowerCase()).toMatch(/success|read|completed/);
    expect(String(response)).not.toContain("Access denied");
  });

  it("should halt on invalid payment amount", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm
      .chat("gpt-4o-mini")
      .withTool(PaymentTool)
      .withInstructions(
        "Help users make payments using the payment tool. Always attempt to process the payment even for unusual amounts."
      );

    const response = await chat.ask("Use the payment tool to pay -50 dollars to someone");

    // Should either halt with our message or LLM should recognize the issue
    const text = String(response).toLowerCase();
    expect(text).toMatch(/invalid|negative|positive|cannot|error/);
  });
});
