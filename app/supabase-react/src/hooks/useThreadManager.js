import { useState, useCallback, useEffect } from "react";
import debounce from "lodash/debounce";

const THREAD_ID_KEY = "langgraph_thread_id";

export function useThreadManager(userId, client) {
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced version of thread fetching
  const debouncedFetchThreads = useCallback(
    debounce(async () => {
      if (!userId || !client) return;
      
      setIsLoading(true);
      try {
        const userThreads = await client.threads.search({
          limit: 100,
        });

        // Sort threads by creation time, newest first
        const sortedThreads = userThreads
          .filter(thread => thread?.metadata?.created_at)
          .sort((a, b) => new Date(b.metadata.created_at) - new Date(a.metadata.created_at));
        
        console.dir(sortedThreads);

        setThreads(sortedThreads);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [userId, client]
  );

  // Load threads on mount and when userId changes
  useEffect(() => {
    if (client) {
      debouncedFetchThreads();
      return () => debouncedFetchThreads.cancel();
    }
  }, [userId, client]);

  // Initialize or restore current thread
  useEffect(() => {
    if (!client) return;

    const initializeThread = async () => {
      if (currentThreadId) {
        const thread = await getThreadById(currentThreadId);
        if (thread) return;
      }

      const storedThreadId = localStorage.getItem(THREAD_ID_KEY);
      if (storedThreadId) {
        try {
          const thread = await getThreadById(storedThreadId);
          if (thread) {
            setCurrentThreadId(storedThreadId);
            return;
          }
        } catch (error) {
          console.error("Error restoring thread:", error);
        }
      }
      
      // If we have existing threads, use the most recent one
      if (threads.length > 0) {
        setCurrentThreadId(threads[0].thread_id);
        localStorage.setItem(THREAD_ID_KEY, threads[0].thread_id);
        return;
      }

      // Only create a new thread if we have no threads at all
      const newThread = await createNewThread();
      if (newThread) {
        setCurrentThreadId(newThread.thread_id);
      }
    };

    initializeThread();
  }, [client, currentThreadId, threads]);

  const getThreadById = async (threadId) => {
    if (!client || !threadId || typeof threadId !== 'string' || !threadId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      console.error("Invalid thread ID format or missing client");
      return null;
    }
    
    try {
      return await client.threads.get(threadId);
    } catch (error) {
      console.error("Error getting thread:", error);
      return null;
    }
  };

  const createNewThread = async () => {
    if (!client) return null;

    try {
      const thread = await client.threads.create({
        metadata: {
          user_id: userId,
          created_at: new Date().toISOString(),
          title: "New Chat"
        },
      });
      
      localStorage.setItem(THREAD_ID_KEY, thread.thread_id);
      
      // Add the new thread to the list
      setThreads((prev) => [{
        ...thread,
        title: "New Chat",
      }, ...prev]);
      
      return thread;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    }
  };

  const deleteThread = async (threadId) => {
    if (!client) return;

    try {
      // First delete from the server
      await client.threads.delete(threadId);
      
      // Then update the UI
      setThreads((prev) => {
        const updatedThreads = prev.filter((t) => t.thread_id !== threadId);
        
      // If we're deleting the current thread, create a new one
        if (threadId === currentThreadId) {
          // If we have other threads, switch to the most recent one
          if (updatedThreads.length > 0) {
            const nextThread = updatedThreads[0];
            setCurrentThreadId(nextThread.thread_id);
            localStorage.setItem(THREAD_ID_KEY, nextThread.thread_id);
          } else {
            // Only create a new thread if we have no threads left
            createNewThread();
          }
        }
        
        return updatedThreads;
      });
    } catch (error) {
      console.error("Error deleting thread:", error);
      await debouncedFetchThreads();
    }
  };

  const updateThreadMetadata = async (threadId, metadata) => {
    if (!client) return;

    try {
      await client.threads.update(threadId, { 
        metadata: {
          ...metadata,
          updated_at: new Date().toISOString()
        } 
      });
      
      setThreads((prev) =>
        prev.map((thread) =>
          thread.thread_id === threadId
            ? { 
                ...thread, 
                metadata: { 
                  ...thread.metadata, 
                  ...metadata,
                  updated_at: new Date().toISOString()
                } 
              }
            : thread
        )
      );
    } catch (error) {
      console.error("Error updating thread metadata:", error);
    }
  };

  return {
    threads,
    currentThreadId,
    isLoading,
    createNewThread,
    deleteThread,
    updateThreadMetadata,
    setCurrentThreadId,
    refreshThreads: debouncedFetchThreads,
    setThreads,
  };
}
