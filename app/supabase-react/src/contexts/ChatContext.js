import { createContext, useContext, useState, useMemo } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { useThreadManager } from "../hooks/useThreadManager";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();
const ASSISTANT_ID = process.env.REACT_APP_ASSISTANT_ID ?? "agent";
const DEPLOYMENT_URL =
  process.env.REACT_APP_DEPLOYMENT_URL ?? "http://localhost:2024";
console.log("DEPLOYMENT_URL", DEPLOYMENT_URL);

export function ChatProvider({ children }) {
  const { session } = useAuth();

  const client = useMemo(() => {
    return new Client({
      apiUrl: DEPLOYMENT_URL,
      defaultHeaders: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
  }, [session?.access_token]);

  const {
    threads,
    currentThreadId,
    isLoading: isThreadsLoading,
    createNewThread,
    deleteThread,
    setCurrentThreadId,
    setThreads,
  } = useThreadManager(session?.user?.id || "default-user", client);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNewThread = async () => {
    const thread = await createNewThread();
    if (thread) {
      setMessages([]);
      setCurrentThreadId(thread.thread_id);
    }
  };

  const sendMessage = async (content) => {
    if (!currentThreadId) {
      console.error("No thread ID available");
      return;
    }

    setIsLoading(true);
    try {
      // Add user message immediately
      const newMessage = { role: "user", content };
      setMessages((prev) => [...prev, newMessage]);

      const input = {
        messages: [{ role: "human", content }],
      };

      const config = {
        configurable: { model_name: "openai" },
      };

      const streamResponse = client.runs.stream(currentThreadId, ASSISTANT_ID, {
        input,
        config,
        streamMode: ["messages-tuple", "updates"],
      });

      let assistantMessage = "";

      for await (const chunk of streamResponse) {
        if (chunk.event === "messages") {
          const messages = chunk.data;
          const [messageChunk, metadata] = messages;

          if (
            messageChunk?.content !== undefined &&
            messageChunk.type === "AIMessageChunk" &&
            metadata?.langgraph_node === "chatbot"
          ) {
            assistantMessage += messageChunk.content;
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: assistantMessage },
                ];
              } else {
                return [
                  ...prev,
                  { role: "assistant", content: assistantMessage },
                ];
              }
            });
          }
        } else if (chunk.event === "updates" && chunk.data?.generate_title) {
          setThreads((prevThreads) =>
            prevThreads.map((thread) =>
              thread.thread_id === currentThreadId
                ? {
                    ...thread,
                    values: {
                      ...thread.values,
                      title: chunk.data.generate_title.title,
                      description: chunk.data.generate_title.description,
                    },
                    metadata: {
                      ...thread.metadata,
                      ...chunk.data.generate_title,
                    },
                  }
                : thread
            )
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchThread = async (threadId) => {
    if (
      !threadId ||
      typeof threadId !== "string" ||
      !threadId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    ) {
      console.error("Invalid thread ID format");
      return;
    }

    try {
      setCurrentThreadId(threadId);
      setMessages([]); // Clear messages initially

      // Fetch thread data
      const thread = await client.threads.get(threadId, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (thread && thread.values?.messages) {
        const formattedMessages = thread.values.messages.map((msg) => ({
          role: msg.type === "human" ? "user" : "assistant",
          content: msg.content,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error switching thread:", error);
      setCurrentThreadId(null);
      setMessages([]);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        isLoading,
        threads,
        currentThreadId,
        createNewThread: handleCreateNewThread,
        switchThread,
        deleteThread,
        isThreadsLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
