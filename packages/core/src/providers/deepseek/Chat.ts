import { ChatRequest, ChatResponse, Usage } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";

interface DeepSeekChatResponse {
  id: string;
  choices: Array<{
    message: {
      content: string | null;
      reasoning_content?: string | null;
      tool_calls?: any[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekChat {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const { model, messages, tools, max_tokens, response_format, headers, ...rest } = request;

    const body: any = {
      model,
      messages,
      ...rest
    };

    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;
    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;
    
    // Handle structured output for DeepSeek
    if (response_format) {
      if (response_format.type === "json_schema") {
        body.response_format = { type: "json_object" };
        
        // Append schema instructions to the system prompt or convert to a new system message
        const schema = response_format.json_schema;
        const schemaString = JSON.stringify(schema.schema, null, 2);
        const instruction = `\n\nIMPORTANT: You must output strictly valid JSON conforming to the following schema:\n${schemaString}\n\nOutput only the JSON object.`;
        
        // Find system message or append to last user message
        const systemMessage = body.messages.find((m: any) => m.role === "system");
        if (systemMessage) {
          systemMessage.content += instruction;
        } else {
           // Insert system message at the beginning
           body.messages.unshift({
             role: "system",
             content: "You are a helpful assistant." + instruction
           });
        }
      } else {
        body.response_format = response_format;
      }
    }

    if (process.env.NODELLM_DEBUG === "true") {
      console.log(`[DeepSeek Request] ${JSON.stringify(body, null, 2)}`);
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...request.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const json = (await response.json()) as DeepSeekChatResponse;
    const message = json.choices[0]?.message;
    const content = message?.content ?? null;
    const reasoning = message?.reasoning_content ?? null;

    const usage: Usage = {
      input_tokens: json.usage.prompt_tokens,
      output_tokens: json.usage.completion_tokens,
      total_tokens: json.usage.total_tokens,
    };

    const toolCalls = message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: tc.type,
        function: {
            name: tc.function.name,
            arguments: tc.function.arguments 
        }
    }));

    if (!content && !reasoning && (!toolCalls || toolCalls.length === 0)) {
      throw new Error("DeepSeek returned empty response");
    }

    // deepseek cost calculation if needed, otherwise just return usage
    const calculatedUsage = ModelRegistry.calculateCost(usage, model, "deepseek");

    return { content, reasoning, usage: calculatedUsage, tool_calls: toolCalls };
  }
}
