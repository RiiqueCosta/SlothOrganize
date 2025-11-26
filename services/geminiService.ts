
import { GoogleGenAI, Type } from "@google/genai";
import { AIEnhancementResponse } from '../types';

// Schema for the structured response we want from Gemini
const taskEnhancementSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "Uma descrição breve e motivadora da tarefa.",
    },
    priority: {
      type: Type.STRING,
      description: "Nível de prioridade sugerido: 'Alta', 'Média' ou 'Baixa'.",
      enum: ["Alta", "Média", "Baixa"]
    },
    category: {
        type: Type.STRING,
        description: "Uma categoria curta (ex: Trabalho, Saúde, Estudo, Casa)."
    },
    subtasks: {
      type: Type.ARRAY,
      description: "Uma lista de 3 a 5 subtarefas acionáveis para completar a tarefa principal.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["description", "priority", "subtasks", "category"],
};

export const enhanceTaskWithAI = async (taskTitle: string): Promise<AIEnhancementResponse | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key not found. AI features disabled.");
      return null;
    }
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analise a seguinte tarefa e forneça melhorias para ajudar na produtividade: "${taskTitle}". Responda em Português do Brasil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskEnhancementSchema,
        systemInstruction: "Você é um assistente de produtividade especialista em GTD (Getting Things Done). Seu objetivo é tornar tarefas vagas em planos acionáveis.",
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIEnhancementResponse;
  } catch (error) {
    console.error("Erro ao conectar com Gemini:", error);
    return null;
  }
};