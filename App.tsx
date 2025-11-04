
import React, { useState, useEffect, useRef } from 'react';
import { Message, AgentStatus, AgentName, ConversationContext } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import MessageInput from './components/MessageInput';
import AgentStatusPanel from './components/AgentStatusPanel';
import { getBotResponse } from './services/geminiService';

const initialAgentStatuses: Record<AgentName, AgentStatus> = {
  'Query Director': { status: 'idle', message: 'Waiting for query...' },
  'Knowledge Retriever': { status: 'idle', message: 'Waiting for task...' },
  'Final Answer Synthesizer': { status: 'idle', message: 'Waiting for data...' },
  'Form Filler': { status: 'idle', message: 'Waiting for task...' },
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am the Goa University assistant. How can I help you with university-related questions today?',
    },
     {
      id: 2,
      sender: 'bot',
      text: "I can also help you register for university events. Just say something like 'Sign me up for the AI workshop'. You can see the form I'll be filling here: [Demo Form](./form.html)",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentName, AgentStatus>>(initialAgentStatuses);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({ mode: 'idle', data: {} });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    setAgentStatuses(prev => {
        if (conversationContext.mode === 'FORM_FILLING') {
            const newStatuses = { ...prev };
            // Only reset the agent that is about to work
            newStatuses['Form Filler'] = { status: 'idle', message: 'Waiting for task...' };
            return newStatuses;
        }
        return initialAgentStatuses;
    });

    const handleStatusUpdate = (agentName: AgentName, status: AgentStatus['status'], message: string) => {
      setAgentStatuses(prevStatuses => ({
        ...prevStatuses,
        [agentName]: { status, message }
      }));
    };

    try {
      const { botResponseText, nextContext } = await getBotResponse(inputText, handleStatusUpdate, conversationContext);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponseText,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setConversationContext(nextContext);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again later.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setConversationContext({ mode: 'idle', data: {} }); // Reset context on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen antialiased text-gray-800">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        {/* Sidebar */}
        <div className="flex flex-col py-8 pl-6 pr-2 w-64 bg-gray-800 text-white flex-shrink-0">
          <div className="flex flex-row items-center justify-center h-12 w-full">
            <div className="flex items-center justify-center rounded-2xl text-indigo-700 bg-white h-10 w-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h6.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V8z"></path>
              </svg>
            </div>
            <div className="ml-2 font-bold text-2xl">UniBot</div>
          </div>
          <div className="flex flex-col mt-8">
            <div className="flex flex-col space-y-1 mt-4 -mx-2">
              <button className="flex flex-row items-center hover:bg-gray-700 rounded-xl p-2">
                <div className="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full text-indigo-800 font-bold">G</div>
                <div className="ml-2 text-sm font-semibold">Goa University Bot</div>
                 <div className="flex items-center justify-center ml-auto text-xs text-white bg-green-500 h-4 w-4 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-auto h-full p-6 bg-gray-200">
          <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-white h-full p-4">
            <Header />
            <div className="flex flex-col h-full overflow-x-auto mb-4">
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-12 gap-y-2">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isLoading && (
                    <div className="col-start-1 col-end-8 p-3 rounded-lg">
                      <div className="flex flex-row items-center">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white font-bold">
                          G
                        </div>
                        <div className="relative ml-3 text-sm bg-gray-100 py-2 px-4 shadow rounded-xl">
                          <div className="flex items-center space-x-1">
                            <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                   <div ref={chatEndRef} />
                </div>
              </div>
            </div>
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
        
        {/* Agent Status Panel */}
        <div className="flex flex-col w-80 p-6 bg-gray-100 flex-shrink-0">
          <AgentStatusPanel statuses={agentStatuses} />
        </div>
      </div>
    </div>
  );
};

export default App;
