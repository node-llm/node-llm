# Security Policy

## Supported Versions

We actively provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

**If you discover a security vulnerability, please do NOT open a public issue.**

We take the security of NodeLLM seriously. If you believe you have found a vulnerability—especially related to PII leakage, prompt injection handling, or tool execution safety—please report it privately.

Please send your report via email to: **eshaiju@gmail.com**

Your report should include:

- A description of the vulnerability.
- A minimal reproduction case (if possible).
- Any potential impact on production systems.

We will acknowledge your report within 48 hours and provide a timeline for a fix and public disclosure.

## Security Philosophy: Agentic Zero Trust

NodeLLM is built on the principle of **Agentic Zero Trust**. We assume the LLM is untrusted and that its output could be malicious (Prompt Injection).

Our security features are designed to enforce safety at the infrastructure level:

- **`maxToolCalls`**: Prevents runaway loops and potential DoS or budget exhaustion.
- **Tool Execution Policies**: Intercepts high-risk actions before they execute.
- **Response Validation**: Ensures structured outputs meet your schemas before they reach your business logic.

For more details on building secure agents, see our [Security Features Guide](https://node-llm.eshaiju.com/advanced/security).
