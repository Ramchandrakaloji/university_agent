
import { GoogleGenAI } from "@google/genai";
import { StatusUpdateCallback, AgentName, ConversationContext } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const directorModel = 'gemini-2.5-flash';
const retrieverModel = 'gemini-2.5-pro';
const synthesizerModel = 'gemini-2.5-flash';

const universityWebsite = 'https://www.unigoa.ac.in';

/**
 * Agent 1: Query Director Agent
 */
const queryDirectorAgent = async (query: string, onStatusUpdate: StatusUpdateCallback): Promise<'KNOWLEDGE_RETRIEVAL' | 'OFF_TOPIC' | 'FORM_FILLING'> => {
  const agentName: AgentName = 'Query Director';
  onStatusUpdate(agentName, 'processing', 'Analyzing user query...');

  const prompt = `You are a Query Director Agent. Your role is to analyze the user's query and classify its intent.

Analyze the following query and classify it into one of three categories:
1.  'KNOWLEDGE_RETRIEVAL': The user is asking a question about Goa University (e.g., courses, faculty, admissions, contact info, events, departments). The university website is ${universityWebsite}.
2.  'FORM_FILLING': The user wants to register for an event, sign up for something, or explicitly mentions filling a form. Examples: "Sign me up for the AI workshop", "I want to register for the Career Fair".
3.  'OFF_TOPIC': The user's query is not related to Goa University or form-filling tasks.

User Query: "${query}"
output should be one of the categories and nothing else
Classification:`;

  try {
    const response = await ai.models.generateContent({
        model: directorModel,
        contents: prompt,
        config: {
          temperature: 0.0,
        }
    });
    const classification = response.text.trim().toUpperCase();
    if (classification === 'KNOWLEDGE_RETRIEVAL' || classification === 'FORM_FILLING') {
      onStatusUpdate(agentName, 'completed', `Intent classified: ${classification}.`);
      return classification;
    }
    onStatusUpdate(agentName, 'completed', 'Intent classified: Off-topic.');
    return 'OFF_TOPIC';
  } catch (error) {
    console.error("Error in Query Director agent:", error);
    onStatusUpdate(agentName, 'error', 'Failed to classify intent.');
    return 'OFF_TOPIC';
  }
};

/**
 * Agent 2: Knowledge Retriever Agent
 */
const knowledgeRetrieverAgent = async (query: string, onStatusUpdate: StatusUpdateCallback): Promise<string> => {
    const agentName: AgentName = 'Knowledge Retriever';
    onStatusUpdate(agentName, 'processing', 'Searching university website...');
    
    const systemInstruction = `You are a Knowledge Retriever Agent, a research specialist for Goa University.
Your ONLY source of information is the Goa University website: ${universityWebsite}.
Your task is to find and extract the most relevant and accurate information to answer the user's query.

- Do not invent information.
- Output the raw, factual data you find. It does not need to be perfectly formatted for a user yet.
- If you cannot find the information, state that clearly. For example: "Information about [topic] could not be found on the university website."
- Focus on extracting facts, lists, names, dates, and direct links if available.`;

  try {
    const response = await ai.models.generateContent({
        model: retrieverModel,
        contents: `Based on the content of ${universityWebsite}, find the information needed to answer this query: "${query}"`,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
        }
    });
    onStatusUpdate(agentName, 'completed', 'Information retrieved successfully.');
    return response.text;
  } catch (error)
  {
    console.error("Error in Knowledge Retriever agent:", error);
    onStatusUpdate(agentName, 'error', 'Failed to retrieve data.');
    return "Error: Could not retrieve information from the knowledge base.";
  }
};


/**
 * Agent 3: Final Answer Synthesizer Agent
 */
const finalAnswerSynthesizerAgent = async (originalQuery: string, retrievedData: string, onStatusUpdate: StatusUpdateCallback): Promise<string> => {
    const agentName: AgentName = 'Final Answer Synthesizer';
    onStatusUpdate(agentName, 'processing', 'Crafting final response...');

    const systemInstruction = `You are a Final Answer Synthesizer Agent. Your role is to take raw, retrieved data and craft a final, polished, user-friendly response.

**Context:**
- The user asked the following question: "${originalQuery}"
- The following raw data was retrieved from the Goa University website: "${retrievedData}"

**Your Task:**
1.  Analyze the retrieved data to see if it adequately answers the user's query.
2.  If the data is sufficient, synthesize it into a clear, concise, and helpful answer.
3.  If the data indicates the information was not found, or an error occurred during retrieval, formulate a polite message stating that the information is unavailable on the website.
4.  If the retrieved data seems incomplete or irrelevant, handle it gracefully. Do not invent information.

**Formatting Rules for the Final Answer:**
- Use standard Markdown.
- For lists, each item MUST be on a new line and start with a dash (-) or an asterisk (*).
- Use double asterisks for **bold** text.
- Format links as [link text](URL).
- Ensure the response directly addresses the user's original query.`;

  try {
     const response = await ai.models.generateContent({
        model: synthesizerModel,
        contents: `Based on the provided context, generate the final user-facing response.`,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.6,
        }
    });
    onStatusUpdate(agentName, 'completed', 'Response generated.');
    return response.text;
  } catch (error) {
    console.error("Error in Final Answer Synthesizer agent:", error);
    onStatusUpdate(agentName, 'error', 'Failed to generate response.');
    return "I'm sorry, I'm having trouble formulating a response right now. Please try again later.";
  }
};

/**
 * Agent 4a: Information Extractor for Form Filling
 */
const informationExtractorAgent = async (query: string): Promise<Record<string, any>> => {
    const prompt = `You are an information extraction agent. Your task is to parse a user's query and extract details for a form. The form has the following fields: "fullName", "email", "studentId", "eventName", "dietaryRestrictions".

Extract any information present in the user's query and return it as a JSON object. If a piece of information is not present, do not include the key in the JSON. For "dietaryRestrictions", if the user says "none" or similar, set the value to "None".

User Query: "${query}"

JSON Output:`;
    try {
        const response = await ai.models.generateContent({
            model: directorModel,
            contents: prompt,
            config: {
                temperature: 0.0,
                responseMimeType: "application/json",
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error in informationExtractorAgent:", e);
        return {}; // Return empty object on failure
    }
};

/**
 * Agent 4: Form Filler Agent
 */
const formFields = ['fullName', 'email', 'studentId', 'eventName', 'dietaryRestrictions'];
const fieldQuestions: Record<string, string> = {
    fullName: "What is your full name?",
    email: "What is your email address?",
    studentId: "What is your student ID number?",
    eventName: "Which event would you like to register for? The options are: AI in Modern Science Workshop, Annual Tech Symposium, or Career Fair 2024.",
    dietaryRestrictions: "Do you have any dietary restrictions? If not, just say 'none'."
};

const formFillerAgent = async (
    data: Record<string, any>,
    onStatusUpdate: StatusUpdateCallback
): Promise<{ botResponseText: string; nextContext: ConversationContext }> => {
    const agentName: AgentName = 'Form Filler';
    onStatusUpdate(agentName, 'processing', 'Checking form data...');

    const missingField = formFields.find(field => !data[field] || data[field] === '');

    if (missingField) {
        onStatusUpdate(agentName, 'completed', `Asking for: ${missingField}.`);
        const nextContext: ConversationContext = { mode: 'FORM_FILLING', data };
        return {
            botResponseText: fieldQuestions[missingField],
            nextContext
        };
    }

    onStatusUpdate(agentName, 'completed', 'All information collected. Submitting form...');
    const confirmationText = `Thank you! I have all the information needed. I'm "submitting" the registration for **${data.fullName}** for the event **"${data.eventName}"**. A confirmation will be sent to **${data.email}**.

(This is a demo. No actual form was submitted.)`;
    
    const nextContext: ConversationContext = { mode: 'idle', data: {} };
    return { botResponseText: confirmationText, nextContext };
};


export const getBotResponse = async (
    query: string,
    onStatusUpdate: StatusUpdateCallback,
    context: ConversationContext | null
): Promise<{ botResponseText:string; nextContext: ConversationContext }> => {
    
    if (context && context.mode === 'FORM_FILLING') {
        const lastMissingField = formFields.find(field => !context.data[field] || context.data[field] === '');
        const updatedData = { ...context.data };
        if(lastMissingField) {
            updatedData[lastMissingField] = query;
        }

        return await formFillerAgent(updatedData, onStatusUpdate);
    }
    
    const intent = await queryDirectorAgent(query, onStatusUpdate);
    
    if (intent === 'FORM_FILLING') {
        onStatusUpdate('Knowledge Retriever', 'skipped', 'Not needed for this task.');
        onStatusUpdate('Final Answer Synthesizer', 'skipped', 'Not needed for this task.');
        
        const initialData = await informationExtractorAgent(query);
        const initialResult = await formFillerAgent(initialData, onStatusUpdate);

        return initialResult;

    } else if (intent === 'KNOWLEDGE_RETRIEVAL') {
        onStatusUpdate('Form Filler', 'skipped', 'Not needed for this query.');
        const retrievedData = await knowledgeRetrieverAgent(query, onStatusUpdate);
        const botResponseText = await finalAnswerSynthesizerAgent(query, retrievedData, onStatusUpdate);
        return { botResponseText, nextContext: { mode: 'idle', data: {} } };
    } else { // OFF_TOPIC
        onStatusUpdate('Knowledge Retriever', 'skipped', 'Not needed for this query.');
        onStatusUpdate('Final Answer Synthesizer', 'skipped', 'Not needed for this query.');
        onStatusUpdate('Form Filler', 'skipped', 'Not needed for this query.');
        const botResponseText = "I'm sorry, but I can only answer questions related to Goa University or help with event registration.";
        return { botResponseText, nextContext: { mode: 'idle', data: {} } };
    }
};
