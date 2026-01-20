
import { GoogleGenAI, Type } from "@google/genai";
import { ABAI_PROGRAMS } from "./constants";
import { Result } from "./types";

export const analyzeResults = async (answers: string[]): Promise<Result> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Оқушы келесі сұрақтарға жауап берді:
    1. Пәндер: ${answers[0]}
    2. Қызығушылық: ${answers[1]}
    3. Мықты жағы: ${answers[2]}
    4. Жұмыс форматы: ${answers[3]}
    5. Қалаған бағыты: ${answers[4]}

    Осы мәліметтер негізінде Abai University (Абай атындағы ҚазҰПУ) бакалавриат бағдарламаларының ішінен ең үйлесімді 2-3 бағдарламаны таңдап бер.
    
    Қолжетімді бағдарламалар тізімі:
    ${JSON.stringify(ABAI_PROGRAMS)}

    Жауапты қазақ тілінде, келесі JSON форматында қайтар:
    {
      "profileSummary": "Оқушының қысқаша мінездемесі (1 сөйлем)",
      "recommendedPrograms": [
        {
          "name": "Бағдарламаның толық ресми атауы",
          "description": "Бағдарлама туралы 1-2 сөйлем",
          "whyFits": "Неге осы мамандық оқушыға сай келеді? (2-3 дәлел)",
          "subjects": "Профильдік пәндер комбинациясы"
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          profileSummary: { type: Type.STRING },
          recommendedPrograms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                whyFits: { type: Type.STRING },
                subjects: { type: Type.STRING }
              },
              required: ["name", "description", "whyFits", "subjects"]
            }
          }
        },
        required: ["profileSummary", "recommendedPrograms"]
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * НӘТИЖЕЛЕРДІ GOOGLE FORM-ҒА ЖАЗУ
 * ---------------------------------
 * Пайдаланушылардан Google-ге кіруді талап етпейді.
 * Формаға қол жеткізу үшін:
 * 1. Формаңызды ашып, 'Get pre-filled link' арқылы entry ID-лерін алыңыз.
 * 2. Төмендегі FORM_ID мен ENTRIES мәндерін ауыстырыңыз.
 */
export const submitToGoogleForms = async (data: any) => {
  // МЫСАЛ: Өз формаңыздың ID-ін осында қойыңыз
  const FORM_ID = '1FAIpQLSfYourFormIDHere'; 
  
  const ENTRIES = {
    nickname: 'entry.1000001', // Формадағы "Аты" өрісінің ID-і
    answers: 'entry.1000002',  // Формадағы "Жауаптар" өрісінің ID-і
    programs: 'entry.1000003', // Формадағы "Мамандықтар" өрісінің ID-і
    subjects: 'entry.1000004'  // Формадағы "Пәндер" өрісінің ID-і
  };

  const FORM_URL = `https://docs.google.com/forms/u/0/d/e/${FORM_ID}/formResponse`;
  
  const formData = new URLSearchParams();
  formData.append(ENTRIES.nickname, data.nickname || 'Анонимді пайдаланушы');
  formData.append(ENTRIES.answers, data.answers.join(' / '));
  formData.append(ENTRIES.programs, (data.recommended || []).join('; '));
  formData.append(ENTRIES.subjects, (data.subjects || []).join('; '));

  try {
    // mode: 'no-cors' арқылы Google Forms-қа деректерді авторизациясыз жібереміз
    await fetch(FORM_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return true;
  } catch (error) {
    console.error("Жіберу кезінде қате шықты:", error);
    return false;
  }
};
