"use server";

import { AssistantChat, type Chat } from "@/models/assistant-chat";
import { HR_ASSISTANT_DEFINITION } from "@/assistants/hr-policy";
import { searchDocumentsTool } from "@/tools/search-documents";

export async function sendMessage(chatId: string | null, message: string) {
  let chat: Chat;

  if (!chatId) {
    chat = await AssistantChat.create({
      instructions: HR_ASSISTANT_DEFINITION.instructions,
      model: HR_ASSISTANT_DEFINITION.defaultModel,
      provider: HR_ASSISTANT_DEFINITION.defaultProvider,
    });
  } else {
    const loadedChat = await AssistantChat.load(chatId);
    if (!loadedChat) {
      console.warn(`Chat ${chatId} not found, creating a new session.`);
      chat = await AssistantChat.create({
        instructions: HR_ASSISTANT_DEFINITION.instructions,
        model: HR_ASSISTANT_DEFINITION.defaultModel,
        provider: HR_ASSISTANT_DEFINITION.defaultProvider,
      });
    } else {
      chat = loadedChat;
    }
  }

  const responseRecord = await chat.withTool(searchDocumentsTool).ask(message);

  const stats = await chat.stats();
  console.log(`[Chat Stats] Chat ${chat.id}:`, stats);

  return {
    chatId: chat.id,
    message: responseRecord,
  };
}

async function getOrCreateChat(chatId: string | null): Promise<Chat> {
  if (!chatId) {
    return await AssistantChat.create({
      instructions: HR_ASSISTANT_DEFINITION.instructions,
      model: HR_ASSISTANT_DEFINITION.defaultModel,
      provider: HR_ASSISTANT_DEFINITION.defaultProvider,
    });
  }

  const loadedChat = await AssistantChat.load(chatId);
  if (!loadedChat) {
    console.warn(`Chat ${chatId} not found, creating a new session.`);
    return await AssistantChat.create({
      instructions: HR_ASSISTANT_DEFINITION.instructions,
      model: HR_ASSISTANT_DEFINITION.defaultModel,
      provider: HR_ASSISTANT_DEFINITION.defaultProvider,
    });
  }

  return loadedChat;
}

export async function sendMessageStream(
  chatId: string | null,
  message: string
): Promise<ReadableStream<Uint8Array>> {
  const chat = await getOrCreateChat(chatId);

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Send chatId first so the client knows which chat to track
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "chatId", chatId: chat.id }) + "\n")
        );

        // Stream tokens and thinking
        for await (const chunk of chat.withTool(searchDocumentsTool).askStream(message)) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "chunk", chunk }) + "\n")
          );
        }

        // Signal completion
        const stats = await chat.stats();
        console.log(`[Chat Stats Stream] Chat ${chat.id}:`, stats);

        controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });
}
