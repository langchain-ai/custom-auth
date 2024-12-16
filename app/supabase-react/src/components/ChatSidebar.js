import { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';

export function ChatSidebar() {
  const { threads, currentThreadId, createNewThread, switchThread, deleteThread } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(256); // 16 * 16 = 256px default
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) { // Min 200px, max 600px
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = () => {
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
  };

  const handleDelete = async (e, threadId) => {
    e.stopPropagation(); // Prevent triggering thread switch
    if (window.confirm('Are you sure you want to delete this thread?')) {
      await deleteThread(threadId);
    }
  };

  return (
    <div 
      ref={sidebarRef}
      className={`bg-gray-50 border-r border-gray-200 flex flex-col h-screen relative transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-12' : ''
      }`}
      style={{ width: isCollapsed ? '48px' : `${width}px` }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 bg-gray-200 rounded-full p-1 hover:bg-gray-300 z-10"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors"
        onMouseDown={startResizing}
      />

      {!isCollapsed && (
        <>
          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={createNewThread}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => {
              const title = thread.values?.title || "New Chat";
              const description = thread.values?.description;
              const lastMessage = thread.values?.messages?.[thread.values.messages.length - 1];
              const messageContent = typeof lastMessage?.content === 'string' 
                ? lastMessage.content 
                : lastMessage?.content?.text || "No messages yet";
              
              return (
                <div
                  key={thread.thread_id}
                  className="flex items-center hover:bg-gray-100 transition-colors relative [&:hover>button:last-child]:block"
                >
                  <button
                    onClick={() => switchThread(thread.thread_id)}
                    className={`flex-1 text-left p-3 group ${
                      currentThreadId === thread.thread_id ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {title}
                    </div>
                    <div 
                      className="text-sm text-gray-500 truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:absolute group-hover:bg-white group-hover:shadow-lg group-hover:p-2 group-hover:rounded group-hover:z-10 group-hover:max-w-md"
                      title={description || messageContent}
                    >
                      {description || messageContent}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, thread.thread_id)}
                    className="hidden absolute right-2 p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete thread"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
