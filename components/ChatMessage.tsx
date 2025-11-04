import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const renderMarkdown = (text: string) => {
  const processInline = (line: string): React.ReactNode => {
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const parts = line.split(regex).filter(part => part);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(part);
      if (linkMatch) {
        const [, text, url] = linkMatch;
        return <a href={url} key={index} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{text}</a>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  // Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const elements: React.ReactElement[] = [];
  // Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  let listItems: React.ReactElement[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = line.startsWith('* ') || line.startsWith('- ');

    if (isListItem) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(<li key={i}>{processInline(line.substring(2))}</li>);
    } else {
      if (inList) {
        elements.push(<ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-2 pl-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      if (line.trim()) {
        elements.push(<p key={i}>{processInline(line)}</p>);
      }
    }
  }

  if (inList) {
    elements.push(<ul key="list-end" className="list-disc list-inside space-y-1 my-2 pl-2">{listItems}</ul>);
  }
  
  return <div className="space-y-2">{elements}</div>;
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="col-start-6 col-end-13 p-3 rounded-lg">
        <div className="flex items-center justify-start flex-row-reverse">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white">
            U
          </div>
          <div className="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
            <div>{message.text}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-start-1 col-end-8 p-3 rounded-lg">
      <div className="flex flex-row items-start">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white font-bold">
          G
        </div>
        <div className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
          {renderMarkdown(message.text)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;