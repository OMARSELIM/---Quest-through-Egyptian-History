
import { GoogleGenAI, Type } from "@google/genai";
import { Era, Riddle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateRiddle = async (era: Era): Promise<Riddle> => {
  const eraPrompt = era === Era.ALL ? "أي عصر من تاريخ مصر" : era;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `أنت خبير في تاريخ مصر. قم بإنشاء لغز تاريخي ممتع عن ${eraPrompt}. 
    يجب أن يكون اللغز عن شخصية، مكان، أو حدث مهم.
    قم بتوفير 4 خيارات للإجابة، واحد منها فقط هو الصحيح.
    تأكد من أن الخيارات منطقية ومتقاربة لزيادة التحدي.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "اللغز باللغة العربية" },
          answer: { type: Type.STRING, description: "الإجابة الصحيحة" },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "4 خيارات تشمل الإجابة الصحيحة"
          },
          hints: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "تلميحات تدريجية (3 تلميحات)"
          },
          funFact: { type: Type.STRING, description: "حقيقة تاريخية ممتعة عن موضوع اللغز" },
          era: { type: Type.STRING, description: "العصر التاريخي للغز" }
        },
        required: ["question", "answer", "options", "hints", "funFact", "era"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text.trim());
    // Ensure options are shuffled so the answer isn't always at the same index
    const shuffledOptions = [...data.options].sort(() => Math.random() - 0.5);
    
    return {
      ...data,
      options: shuffledOptions,
      era: data.era as Era
    };
  } catch (error) {
    console.error("Failed to parse riddle response", error);
    throw new Error("حدث خطأ أثناء تحميل اللغز. حاول مرة أخرى.");
  }
};

export const checkAnswerWithAI = async (userAnswer: string, correctAnswer: string, question: string): Promise<boolean> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `السؤال: "${question}"
    الإجابة الصحيحة هي: "${correctAnswer}"
    إجابة المستخدم هي: "${userAnswer}"
    هل إجابة المستخدم صحيحة؟ أجب بـ "true" إذا كانت صحيحة و "false" إذا كانت خاطئة.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isCorrect: { type: Type.BOOLEAN }
        },
        required: ["isCorrect"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text.trim());
    return data.isCorrect;
  } catch {
    return userAnswer.trim() === correctAnswer.trim();
  }
};
