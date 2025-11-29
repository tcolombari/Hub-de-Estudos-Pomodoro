import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RoadmapResponse, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const roadmapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 5-7 key study topics or modules for the subject.",
    },
  },
  required: ["topics"],
};

export const generateStudyRoadmap = async (subjectName: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Crie um roteiro de estudos conciso para a disciplina: "${subjectName}". Quebre em 5 a 7 tópicos sequenciais para um estudante iniciante a intermediário. Mantenha os tópicos curtos e acionáveis. Responda APENAS em Português do Brasil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: roadmapSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) return [];

    const parsed: RoadmapResponse = JSON.parse(text);
    return parsed.topics || [];
  } catch (error) {
    console.error("Failed to generate roadmap:", error);
    return ["Introdução", "Conceitos Básicos", "Prática Avançada"]; // Fallback Portuguese
  }
};

export const generateMoreTopics = async (subjectName: string, existingTopics: string[]): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Atue como um professor especialista em "${subjectName}".
        O aluno já tem o seguinte roteiro de estudos:
        ${JSON.stringify(existingTopics)}

        Gere 5 NOVOS tópicos sequenciais e mais avançados para continuar este roteiro.
        Não repita tópicos.
        Mantenha os títulos curtos e acionáveis.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: roadmapSchema,
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) return [];

    const parsed: RoadmapResponse = JSON.parse(text);
    return parsed.topics || [];
  } catch (error) {
    console.error("Failed to extend roadmap:", error);
    return [];
  }
};

export const sendMessageToMentor = async (
  subjectName: string, 
  history: ChatMessage[], 
  newMessage: string
): Promise<string> => {
  try {
    // Convert generic ChatMessage to Gemini format if needed, 
    // but for simple single-turn or short context we can just build a prompt string
    // or use the chat feature properly. Let's use simple context injection for robustness here.
    
    const context = history.slice(-6).map(msg => `${msg.role === 'user' ? 'Aluno' : 'Mentor'}: ${msg.text}`).join('\n');

    const prompt = `
      Você é um AGENTE ESPECIALISTA e MENTOR da disciplina "${subjectName}".
      Adote uma persona amigável, sábia e encorajadora (Ex: "Mestre dos Códigos" para TI, "Teacher" para inglês).
      
      Histórico da conversa:
      ${context}
      
      Aluno: ${newMessage}
      
      Responda ao aluno de forma educativa, curta e motivadora. Se ele pedir exercícios, dê um exemplo.
      Responda em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Estou reorganizando meus livros... pode repetir?";
  } catch (error) {
    console.error("Chat error:", error);
    return "Tive um problema de conexão com a biblioteca mágica. Tente novamente.";
  }
};

export const generateTopicContent = async (subjectName: string, topic: string): Promise<string> => {
  try {
    const isEnglishContext = subjectName.toLowerCase().includes('inglês') || subjectName.toLowerCase().includes('english');

    const englishInstructions = isEnglishContext ? `
      IMPORTANTE - REGRAS DE ÁUDIO PARA INGLÊS:
      Como esta é uma aula de INGLÊS, você DEVE adicionar botões de pronúncia para TODOS os exemplos de frases, palavras novas ou vocabulário em inglês.
      
      Use EXATAMENTE este código HTML para o botão logo após o texto em inglês:
      <button class="speech-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold ml-2 align-middle border border-primary/20 cursor-pointer select-none" data-text="TEXT_TO_SPEAK_HERE">
        🔊 Ouvir
      </button>

      Exemplo correto:
      <p>O verbo to be é essencial. Exemplo: I am happy <button class="speech-btn..." data-text="I am happy">🔊 Ouvir</button></p>
    ` : '';

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Atue como um AGENTE ESPECIALISTA E MENTOR na disciplina "${subjectName}".
      
      Sua Persona:
      1. Escolha um nome para você (ex: "Teacher Sarah" se for inglês, "Eng. Atlas" se for física, "Designer Pixel" se for UX).
      2. Adote um tom didático, empolgante e prático.

      Sua tarefa é criar uma AULA DINÂMICA sobre o tópico: "${topic}".

      ${englishInstructions}

      ESTRUTURA OBRIGATÓRIA (Use classes Tailwind CSS diretamente no HTML):
      Retorne APENAS o HTML (sem markdown, sem tags <html> ou <body>). O conteúdo deve ser responsivo, mas otimizado para telas largas em DUAS COLUNAS ou TRÊS COLUNAS.
      
      Use exatamente esta estrutura de layout:

      <div class="space-y-8 animate-fadeIn">
        
        <!-- HEADER DA AULA -->
        <div class="bg-gradient-to-r from-surface to-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-4">
           <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">🎓</div>
           <div>
              <p class="text-primary font-bold uppercase text-xs tracking-widest">Sua Mentoria de Hoje</p>
              <h1 class="text-3xl font-bold text-white">${topic}</h1>
              <p class="text-slate-400 text-sm">Com seu instrutor IA: <span class="text-white font-semibold">{NOME_DA_SUA_PERSONA}</span></p>
           </div>
        </div>

        <!-- GRID DE CONTEÚDO (Layout Revista) -->
        <div class="grid lg:grid-cols-3 gap-8">
            
            <!-- COLUNA PRINCIPAL (Esquerda - 2/3) -->
            <div class="lg:col-span-2 space-y-8">
                
                <div class="bg-surface/30 p-6 rounded-2xl border border-slate-700/50">
                    <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <span class="text-primary">#</span> Introdução & Conceito
                    </h2>
                    <div class="text-slate-300 leading-relaxed text-lg space-y-4">
                        <!-- Escreva aqui a explicação teórica profunda, use parágrafos, negritos -->
                    </div>
                </div>

                <div class="bg-surface/30 p-6 rounded-2xl border border-slate-700/50">
                    <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <span class="text-primary">#</span> Aplicação Prática
                    </h2>
                    <div class="text-slate-300 leading-relaxed text-lg space-y-4">
                        <!-- Exemplos práticos, passo a passo, como isso funciona no mundo real -->
                    </div>
                </div>

                <!-- Citação ou Dica de Ouro -->
                <div class="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-6 rounded-r-xl">
                    <h3 class="text-xl font-bold text-white mb-2">💡 Insight do Especialista</h3>
                    <p class="text-slate-200 italic">"Escreva aqui uma dica valiosa, um segredo ou um erro comum a evitar sobre ${topic}."</p>
                </div>

            </div>

            <!-- COLUNA LATERAL (Direita - 1/3 - Sticky) -->
            <div class="space-y-6">
                
                <!-- Card de Imagem -->
                <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-700 relative group">
                    <img src="https://image.pollinations.ai/prompt/${topic.replace(/\s/g, '+')}+${subjectName.replace(/\s/g, '+')}+educational+illustration?width=400&height=300&nologo=true" alt="${topic}" class="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4">
                        <p class="text-white text-xs font-bold uppercase">Visualização</p>
                    </div>
                </div>

                <!-- Card de Glossário / Pontos Chave -->
                <div class="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                    <h3 class="text-white font-bold mb-4 flex items-center gap-2">🔑 Pontos Chave</h3>
                    <ul class="space-y-3">
                        <!-- Gere 3 a 4 bullet points curtos com ícones ou emojis -->
                        <li class="text-sm text-slate-300 flex items-start gap-2"><span class="text-primary mt-1">•</span> Ponto chave 1 curto</li>
                        <li class="text-sm text-slate-300 flex items-start gap-2"><span class="text-primary mt-1">•</span> Ponto chave 2 curto</li>
                        <li class="text-sm text-slate-300 flex items-start gap-2"><span class="text-primary mt-1">•</span> Ponto chave 3 curto</li>
                    </ul>
                </div>

                <!-- Card de Desafio Rápido -->
                <div class="bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-2xl p-5 border border-purple-500/30">
                    <h3 class="text-white font-bold mb-2">⚡ Desafio Rápido</h3>
                    <p class="text-sm text-slate-300 mb-4">Uma pequena pergunta ou exercício mental sobre o tema para fixar.</p>
                </div>

                 <!-- Card de Vídeo -->
                <div class="bg-surface rounded-2xl p-5 border border-slate-700 text-center">
                   <p class="text-xs text-slate-500 mb-3 uppercase tracking-widest font-bold">Material Extra</p>
                   <a href="https://www.youtube.com/results?search_query=aula+${topic.replace(/\s/g, '+')}+${subjectName.replace(/\s/g, '+')}" target="_blank" class="block w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                      <span>▶</span> Ver Vídeos no YouTube
                   </a>
                </div>

            </div>
        </div>

      </div>

      REGRAS GERAIS:
      - O Texto explicativo deve ser 100% em Português do Brasil.
      - Preencha os placeholders com conteúdo real e educativo.
      - Use negrito (<b> ou <strong>) para enfatizar termos importantes no texto principal.
      `,
      config: {
        temperature: 0.75, // Um pouco mais criativo para a persona
      },
    });

    let text = response.text || "<p>Não foi possível gerar o conteúdo.</p>";
    text = text.replace(/```html/g, '').replace(/```/g, '');
    return text;
  } catch (error) {
    console.error("Failed to generate topic content:", error);
    return "<p>Erro ao gerar conteúdo. Por favor, tente novamente.</p>";
  }
};