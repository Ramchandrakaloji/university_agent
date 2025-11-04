
import React from 'react';
import { AgentStatus, AgentName } from '../types';

interface AgentStatusPanelProps {
  statuses: Record<AgentName, AgentStatus>;
}

const StatusIcon: React.FC<{ status: AgentStatus['status'] }> = ({ status }) => {
  switch (status) {
    case 'processing':
      return (
        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    case 'completed':
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'skipped':
      return (
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
        </svg>
      );
     case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    case 'idle':
    default:
      return <div className="h-5 w-5 rounded-full bg-gray-300"></div>;
  }
};

const AgentStatusCard: React.FC<{ name: string; status: AgentStatus }> = ({ name, status }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center">
        <StatusIcon status={status.status} />
        <h3 className="ml-3 text-md font-semibold text-gray-700">{name}</h3>
      </div>
      <p className="mt-2 text-sm text-gray-500 truncate">{status.message}</p>
    </div>
  );
};

const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({ statuses }) => {
  return (
    <div className="h-full bg-gray-50 rounded-2xl p-4 flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 border-b-2 pb-2 mb-4">Agent Status</h2>
      <div className="space-y-4">
        {(Object.keys(statuses) as AgentName[]).map((agentName) => (
          <AgentStatusCard
            key={agentName}
            name={agentName}
            status={statuses[agentName]}
          />
        ))}
      </div>
    </div>
  );
};

export default AgentStatusPanel;
