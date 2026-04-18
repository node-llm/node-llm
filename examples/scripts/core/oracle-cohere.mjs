import "dotenv/config";
import crypto from "crypto";
import { NodeLLM, createLLM, BaseProvider, fetchWithTimeout } from "../../../packages/core/dist/index.js";

/**
 * EXAMPLE: Manual OCI Request Signing (Zero-Dependency)
 * 
 * This example demonstrates how to implement the OCI HTTP Signature scheme
 * manually using Node.js native 'crypto' module. This avoids the need for
 * the heavy '@oraclecloud/oci-sdk'.
 */

class OracleCohereProvider extends BaseProvider {
  constructor(config = {}) {
    super();
    this.tenancyId = config.tenancyId || process.env.OCI_TENANCY;
    this.userId = config.userId || process.env.OCI_USER_ID;
    this.fingerprint = config.fingerprint || process.env.OCI_FINGERPRINT;
    this.privateKey = config.privateKey || process.env.OCI_PRIVATE_KEY;
    this.compartmentId = config.compartmentId || process.env.OCI_COMPARTMENT_ID;
    this.region = config.region || process.env.OCI_REGION || "us-ashburn-1";
    this.apiBase = config.apiBase || process.env.OCI_API_BASE || `https://inference.generativeai.${this.region}.oci.oraclecloud.com`;
  }

  providerName() {
    return "oracle-cohere-manual";
  }

  defaultModel() {
    return process.env.OCI_COHERE_MODEL_ID;
  }

  /**
   * Generates the OCI Authorization header
   */
  sign(method, url, headers, body) {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname + parsedUrl.search;
    const host = parsedUrl.host;
    const date = new Date().toUTCString();

    const requestHeaders = {
      date: date,
      host: host,
      "content-type": "application/json",
    };

    if (body) {
      const bodyString = typeof body === "string" ? body : JSON.stringify(body);
      const hash = crypto.createHash("sha256").update(bodyString).digest("base64");
      requestHeaders["x-content-sha256"] = hash;
      requestHeaders["content-length"] = Buffer.byteLength(bodyString).toString();
    }

    const signingHeaders = ["date", "(request-target)", "host"];
    if (body) {
      signingHeaders.push("content-type", "content-length", "x-content-sha256");
    }

    let signingString = "";
    signingHeaders.forEach((header, index) => {
      if (header === "(request-target)") {
        signingString += `(request-target): ${method.toLowerCase()} ${path}`;
      } else {
        signingString += `${header}: ${requestHeaders[header]}`;
      }
      if (index < signingHeaders.length - 1) signingString += "\n";
    });

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signingString);
    const signature = signer.sign(this.privateKey, "base64");

    const keyId = `${this.tenancyId}/${this.userId}/${this.fingerprint}`;
    const authorization = `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",headers="${signingHeaders.join(" ")}",signature="${signature}"`;

    return {
      ...requestHeaders,
      Authorization: authorization,
    };
  }

  async chat(request) {
    const { model, messages, requestTimeout } = request;

    const chatHistory = messages.slice(0, -1).map(m => ({
      role: m.role === "user" ? "USER" : "CHATBOT",
      message: m.content
    }));

    const body = {
      compartmentId: this.compartmentId,
      servingMode: { 
        servingType: "ON_DEMAND",
        modelId: model 
      },
      chatRequest: {
        apiFormat: "COHERE",
        message: messages[messages.length - 1].content,
        chatHistory: chatHistory,
        maxTokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7
      }
    };

    const url = `${this.apiBase}/20231130/actions/chat`;
    const headers = this.sign("POST", url, {}, body);

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    }, requestTimeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCI API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const usage = data.chatResponse.usage || data.chatResponse.tokenUsage || {};
    
    return {
      content: data.chatResponse.text,
      usage: {
        input_tokens: usage.promptTokens || 0,
        output_tokens: usage.completionTokens || 0,
        total_tokens: usage.totalTokens || ((usage.promptTokens || 0) + (usage.completionTokens || 0))
      }
    };
  }
}

// Register
NodeLLM.registerProvider("oracle-manual", () => new OracleCohereProvider());

async function main() {
  const llm = createLLM({ provider: "oracle-manual" });

  try {
    const modelId = process.env.OCI_COHERE_MODEL_ID;
    if (!modelId) {
      throw new Error("OCI_COHERE_MODEL_ID not found in environment.");
    }

    console.log("--- Sending Request to OCI ---");
    const response = await llm.chat(modelId).ask("Explain the value of manual header signing for security.");
    
    console.log("\nOCI Response:");
    console.log(response.content);
    
    console.log("\nUsage:");
    console.log(JSON.stringify(response.usage, null, 2));
  } catch (err) {
    console.error("\nExecution failed:", err.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
