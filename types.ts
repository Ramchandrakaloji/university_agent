
export interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

export type AgentName = 'Query Director' | 'Knowledge Retriever' | 'Final Answer Synthesizer' | 'Form Filler';

export type Status = 'idle' | 'processing' | 'completed' | 'skipped' | 'error';

export interface AgentStatus {
  status: Status;
  message: string;
}

export type StatusUpdateCallback = (agentName: AgentName, status: Status, message: string) => void;

export interface ConversationContext {
  mode: 'idle' | 'FORM_FILLING';
  data: Record<string, any>;
}
