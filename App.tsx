
import React, { useState, useEffect } from 'react';
import { QUESTIONS, CONTACT_INFO } from './constants';
import { analyzeResults, submitToGoogleForms } from './geminiService';
import { Result } from './types';

const STORAGE_KEY = 'abai_ai_progress';

const App: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answers && parsed.answers.length > 0) {
          setHasSavedProgress(true);
        }
      } catch (e) {
        console.error("Error loading progress", e);
      }
    }
  }, []);

  useEffect(() => {
    if (step === 'quiz' || step === 'result') {
      const stateToSave = { step, currentQuestion, answers, nickname, result, submitted };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [step, currentQuestion, answers, nickname, result, submitted]);

  // Fix: Added missing resetQuiz function
  const resetQuiz = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers([]);
    setCurrentQuestion(0);
    setResult(null);
    setSubmitted(false);
    setStep('intro');
  };

  const startQuiz = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers([]);
    setCurrentQuestion(0);
    setResult(null);
    setSubmitted(false);
    setStep('quiz');
  };

  const resumeProgress = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setStep(parsed.step);
      setCurrentQuestion(parsed.currentQuestion);
      setAnswers(parsed.answers);
      setNickname(parsed.nickname);
      setResult(parsed.result);
      setSubmitted(parsed.submitted);
    }
    setHasSavedProgress(false);
  };

  const handleAnswer = (optionLabel: string) => {
    const newAnswers = [...answers, optionLabel];
    setAnswers(newAnswers);
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      processResults(newAnswers);
    }
  };

  const processResults = async (finalAnswers: string[]) => {
    setStep('loading');
    try {
      const analysis = await analyzeResults(finalAnswers);
      setResult(analysis);
      setStep('result');
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Қате орын алды. Қайта көріңіз.");
      setStep('intro');
    }
  };

  const getResultString = () => {
    if (!result) return "";
    return `Мен Абай атындағы ҚазҰПУ-дан өзіме сай мамандықты таптым! 🎓\n\nПрофиль: ${result.profileSummary}\n\nҰсынылған мамандықтар:\n${result.recommendedPrograms.map(p => `- ${p.name}`).join('\n')}\n\nСен де өз мамандығыңды анықта! ✨`;
  };

  const copyToClipboard = () => {
    const text = getResultString();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    const shareData = {
      title: 'Abai University AI Assistant',
      text: getResultString(),
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed", err);
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (submitted) return;
    setIsSubmitting(true);
    const data = {
      nickname: nickname || 'Аноним',
      answers: answers,
      recommended: result?.recommendedPrograms.map(p => p.name),
      subjects: result?.recommendedPrograms.map(p => p.subjects)
    };
    await submitToGoogleForms(data);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all">
        
        {/* Header */}
        <div className="bg-[#393185] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎓</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Abai University</h1>
              <p className="text-[10px] opacity-70 uppercase tracking-[0.2em] font-semibold">Proforientation AI</p>
            </div>
          </div>
          {step === 'quiz' && (
            <div className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              СҰРАҚ {currentQuestion + 1} / {QUESTIONS.length}
            </div>
          )}
        </div>

        <div className="p-8">
          {step === 'intro' && (
            <div className="text-center animate-fade-in">
              <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                🔓 Тіркелу қажет емес
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Мамандығыңды AI-мен тап! 🚀</h2>
              <p className="text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
                Абай атындағы ҚазҰПУ-дың білім беру бағдарламалары ішінен саған ең қолайлысын бірнеше минутта анықтаймыз.
              </p>
              
              <div className="mb-8 text-left bg-slate-50 p-5 rounded-2xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Аты-жөніңіз немесе бүркеншік ат</label>
                <input 
                  type="text" 
                  placeholder="Мұнда жазыңыз..." 
                  className="w-full px-5 py-3.5 rounded-xl border-2 border-transparent focus:border-[#393185] focus:bg-white bg-gray-100 outline-none transition-all font-medium"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={startQuiz}
                  className="w-full bg-[#393185] text-white font-bold py-4 rounded-2xl hover:bg-[#2d266e] transition-all shadow-xl shadow-[#393185]/20 flex items-center justify-center gap-2"
                >
                  {hasSavedProgress ? 'Жаңадан бастау' : 'Сынақты бастау 🚀'}
                </button>
                {hasSavedProgress && (
                  <button onClick={resumeProgress} className="w-full text-[#393185] font-bold py-3 hover:underline text-sm">
                    Алдыңғы нәтижені жалғастыру 🔄
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'quiz' && (
            <div className="animate-fade-in">
              <div className="w-full bg-gray-100 h-1.5 rounded-full mb-10 overflow-hidden">
                <div 
                  className="bg-[#393185] h-full transition-all duration-700 ease-out" 
                  style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-8 leading-tight">{QUESTIONS[currentQuestion].text}</h3>
              
              <div className="grid gap-4">
                {QUESTIONS[currentQuestion].options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.label)}
                    className="flex items-center gap-4 p-5 text-left border-2 border-gray-50 rounded-2xl hover:border-[#393185] hover:bg-slate-50 transition-all group"
                  >
                    <span className="text-2xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 w-12 h-12 flex items-center justify-center rounded-xl transition-transform">
                      {opt.emoji}
                    </span>
                    <span className="font-bold text-gray-700 text-lg">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="text-center py-16 flex flex-col items-center animate-pulse">
              <div className="w-20 h-20 border-4 border-[#393185] border-t-transparent rounded-full animate-spin mb-8"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Жауаптарды талдаудамын...</h3>
              <p className="text-gray-400 font-medium">Күте тұрыңыз, сиқыр жасалып жатыр ✨</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="animate-fade-in">
              <div className="bg-indigo-50 p-6 rounded-3xl mb-8 border border-indigo-100 flex items-start gap-4">
                <span className="text-3xl">🧩</span>
                <div>
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Сіздің бейнеңіз</h3>
                  <p className="text-gray-800 font-bold leading-relaxed">{result.profileSummary}</p>
                </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                Сәйкес келетін мамандықтар 🎯
              </h3>

              <div className="space-y-6 mb-10">
                {result.recommendedPrograms.map((prog, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-100 p-6 rounded-3xl hover:border-[#393185]/30 transition-all shadow-sm">
                    <h4 className="font-black text-lg text-[#393185] mb-2">{prog.name}</h4>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{prog.description}</p>
                    <div className="bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100 mb-4">
                      <p className="font-bold text-gray-900 mb-1">💡 Неге таңдау керек?</p>
                      <p className="text-gray-600 italic">«{prog.whyFits}»</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <span>📌 Пәндер:</span>
                      <span className="text-[#393185]">{prog.subjects}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={handleFinalSubmit}
                  disabled={submitted || isSubmitting}
                  className={`flex items-center justify-center gap-3 font-bold py-4 rounded-2xl transition-all ${submitted ? 'bg-green-600 text-white cursor-default' : 'bg-[#393185] text-white hover:bg-[#2d266e] shadow-lg shadow-[#393185]/20'}`}
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Жіберілуде...</>
                  ) : submitted ? (
                    <>Нәтиже сақталды ✅</>
                  ) : (
                    <>Нәтижені жіберу 📤</>
                  )}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  {copied ? 'Көшірілді! ✨' : 'Нәтижені көшіру 📋'}
                </button>
              </div>

              {/* Sharing Options */}
              <div className="mb-10 p-6 bg-slate-100 rounded-3xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Достарыңмен бөліс</h4>
                <div className="flex justify-center items-center gap-4">
                  {/* WhatsApp */}
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(getResultString())}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    title="WhatsApp-та бөлісу"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 00-5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </a>
                  {/* Telegram */}
                  <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(getResultString())}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-sky-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    title="Telegram-да бөлісу"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.244.244-.457.244l.203-3.006 5.441-4.913c.234-.203-.047-.313-.359-.11l-6.726 4.237-2.91-.91c-.633-.197-.643-.633.13-.933l11.378-4.384c.526-.197.986.117.795.898z"/></svg>
                  </a>
                  {/* Email */}
                  <a 
                    href={`mailto:?subject=${encodeURIComponent('Abai University AI Assistant нәтижесі')}&body=${encodeURIComponent(getResultString())}`}
                    className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    title="Email-мен жіберу"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 12.713L.657 5.241c.023-.064.051-.126.083-.183l11.26 7.472 11.259-7.472a1.525 1.525 0 01.083.183L12 12.713zM12 13.911l11.585-7.689c.26.438.415.952.415 1.503V18a2 2 0 01-2 2H4a2 2 0 01-2-2V7.725c0-.551.155-1.065.415-1.503L12 13.911z"/></svg>
                  </a>
                  {/* Native Share (if mobile) */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button 
                      onClick={shareNative}
                      className="w-12 h-12 bg-slate-700 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                      title="Басқа жолмен бөлісу"
                    >
                      <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h4 className="font-black text-xl mb-6 flex items-center gap-2">Байланыс орталығы 📞</h4>
                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4 opacity-80 font-medium">
                    <p>📍 {CONTACT_INFO.address}</p>
                    <p>📧 {CONTACT_INFO.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-[#393185] bg-white px-3 py-1 rounded-lg inline-block mb-2">Қабылдау комиссиясы:</p>
                    {CONTACT_INFO.phones.map(p => <p key={p} className="font-bold opacity-90">{p}</p>)}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={resetQuiz}
                  className="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest"
                >
                  Қайтадан бастау 🔁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-10 flex flex-col items-center gap-2 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">© {new Date().getFullYear()} Abai University Assistant</p>
        <div className="h-1 w-8 bg-[#393185] rounded-full"></div>
      </div>
    </div>
  );
};

export default App;
