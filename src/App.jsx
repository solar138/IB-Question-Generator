import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Settings, 
  Database, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  Trash2, 
  Edit, 
  X, 
  Sun, 
  Moon, 
  HelpCircle, 
  Info, 
  Save, 
  BookOpen, 
  AlertCircle,
  Award,
  ChevronDown,
  Archive
} from "lucide-react";

import { SYLLABUS, getFlattenedSlots } from "./syllabus";
import { generateQuestions } from "./ollama";
import { exportQuestionBankToDocx, exportQuestionsToZip } from "./exporter";

export default function App() {
  // --- Persistent State (LocalStorage) ---
  const [questionsBank, setQuestionsBank] = useState(() => {
    let saved = localStorage.getItem("ib_physics_questions_bank");
    if (saved) {
      // One-time migration to fix corrupted LaTeX in previously saved questions
      saved = saved.replace(/\x0Crac/g, '\\\\frac')
                   .replace(/\x08eta/g, '\\\\beta')
                   .replace(/\x09ext/g, '\\\\text')
                   .replace(/\x09heta/g, '\\\\theta')
                   .replace(/\x09au/g, '\\\\tau')
                   .replace(/\x0Dho/g, '\\\\rho')
                   .replace(/\x0Dight/g, '\\\\right')
                   .replace(/\x0Aeq/g, '\\\\neq')
                   .replace(/\x0Au/g, '\\\\nu')
                   .replace(/\\\\bigpi/g, '\\\\pi')
                   .replace(/\\\\text\{sqrt\}/g, '\\\\sqrt');
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [ollamaHost, setOllamaHost] = useState(() => {
    return localStorage.getItem("ib_physics_ollama_host") || "http://localhost:11434";
  });

  const [ollamaModel, setOllamaModel] = useState(() => {
    return localStorage.getItem("ib_physics_ollama_model") || "llama3";
  });

  const [providerMode, setProviderMode] = useState(() => {
    const saved = localStorage.getItem("ib_physics_provider_mode");
    return saved || "mock"; // Default to "mock"
  });

  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem("ib_physics_gemini_key") || "";
  });

  const [geminiModel, setGeminiModel] = useState(() => {
    const saved = localStorage.getItem("ib_physics_gemini_model");
    const validModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    return (saved && validModels.includes(saved)) ? saved : "gemini-1.5-flash";
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("ib_physics_theme") || "dark";
  });

  // --- UI & Application State ---
  const [currentSlotId, setCurrentSlotId] = useState(() => {
    const slots = getFlattenedSlots();
    // Default to first uncompleted slot, or first slot
    const saved = localStorage.getItem("ib_physics_current_slot_id");
    if (saved) return saved;
    return slots[0]?.id || "";
  });

  const [expandedTopic, setExpandedTopic] = useState("A");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedChoices, setGeneratedChoices] = useState([]);
  const [pregeneratedCache, setPregeneratedCache] = useState({});
  const [isPregenerating, setIsPregenerating] = useState(false);
  const [pregeneratingSlotId, setPregeneratingSlotId] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState("mock"); // 'connected', 'disconnected', 'mock'
  
  // Modals & Popups
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [toast, setToast] = useState(null);
  const [showExplanationIndex, setShowExplanationIndex] = useState(null);
  const [autoFillProgress, setAutoFillProgress] = useState(null);

  // Define flattened list of all 50 slots
  const slots = getFlattenedSlots();
  const currentSlot = slots.find(s => s.id === currentSlotId) || slots[0];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("ib_physics_questions_bank", JSON.stringify(questionsBank));
  }, [questionsBank]);

  useEffect(() => {
    localStorage.setItem("ib_physics_ollama_host", ollamaHost);
  }, [ollamaHost]);

  useEffect(() => {
    localStorage.setItem("ib_physics_ollama_model", ollamaModel);
  }, [ollamaModel]);

  useEffect(() => {
    localStorage.setItem("ib_physics_provider_mode", providerMode);
    if (providerMode === "mock") {
      setOllamaStatus("mock");
    } else if (providerMode === "gemini") {
      setOllamaStatus(geminiApiKey ? "connected" : "disconnected");
    } else {
      checkOllamaConnection();
    }
  }, [providerMode, geminiApiKey]);

  useEffect(() => {
    localStorage.setItem("ib_physics_gemini_key", geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    localStorage.setItem("ib_physics_gemini_model", geminiModel);
  }, [geminiModel]);

  useEffect(() => {
    localStorage.setItem("ib_physics_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (currentSlot) {
      localStorage.setItem("ib_physics_current_slot_id", currentSlot.id);
      const savedForSlot = questionsBank.find(q => q.id === currentSlot.id);
      if (savedForSlot) {
        setGeneratedChoices([savedForSlot]);
        setShowExplanationIndex(null);
      } else if (pregeneratedCache[currentSlot.id]) {
        setGeneratedChoices(pregeneratedCache[currentSlot.id]);
        setShowExplanationIndex(null);
        
        const newCache = { ...pregeneratedCache };
        delete newCache[currentSlot.id];
        setPregeneratedCache(newCache);
        // Do not show toast here to avoid spamming the user when they click sidebar
      } else {
        setGeneratedChoices([]);
        setShowExplanationIndex(null);
      }
      
      // Auto expand the active slot's topic
      setExpandedTopic(currentSlot.topicId);
    }
  }, [currentSlotId]);

  // Background pregenerator
  useEffect(() => {
    const runPregenerator = async () => {
      // If we are currently generating the main UI or already pregenerating, abort to save resources
      if (isGenerating || isPregenerating) return;

      // Find the next uncompleted slot
      const currentIndex = slots.findIndex(s => s.id === currentSlotId);
      if (currentIndex === -1) return;
      
      let nextIndex = (currentIndex + 1) % slots.length;
      let nextSlotToGenerate = null;

      for (let i = 0; i < slots.length; i++) {
        const checkSlot = slots[nextIndex];
        const isCompleted = questionsBank.some(q => q.id === checkSlot.id);
        if (!isCompleted) {
          nextSlotToGenerate = checkSlot;
          break;
        }
        nextIndex = (nextIndex + 1) % slots.length;
      }

      // If there's a next slot, and it's not cached, pregenerate it silently
      if (nextSlotToGenerate && !pregeneratedCache[nextSlotToGenerate.id]) {
        setIsPregenerating(true);
        setPregeneratingSlotId(nextSlotToGenerate.id);
        try {
          const questions = await generateQuestions(
            ollamaHost,
            ollamaModel,
            nextSlotToGenerate.topicId,
            nextSlotToGenerate.subtopicId,
            nextSlotToGenerate.subtopicName,
            nextSlotToGenerate.level,
            providerMode,
            geminiApiKey,
            geminiModel
          );
          setPregeneratedCache(prev => ({
            ...prev,
            [nextSlotToGenerate.id]: questions
          }));
        } catch (err) {
          console.error("Background pregeneration failed silently", err);
        } finally {
          setIsPregenerating(false);
          setPregeneratingSlotId(null);
        }
      }
    };

    // Wait a brief moment to not block main thread renders
    const timer = setTimeout(runPregenerator, 1500);
    return () => clearTimeout(timer);
  }, [currentSlotId, generatedChoices, questionsBank, isGenerating, isPregenerating]);

  // Listen for background pregeneration finishing if we are actively waiting for it
  useEffect(() => {
    if (isGenerating && generatedChoices.length === 0 && pregeneratedCache[currentSlotId]) {
      setGeneratedChoices(pregeneratedCache[currentSlotId]);
      
      const newCache = { ...pregeneratedCache };
      delete newCache[currentSlotId];
      setPregeneratedCache(newCache);
      
      setIsGenerating(false);
      showToast(`Finished loading pre-generated choices for Topic ${currentSlot?.subtopicId}!`, "success");
    }
  }, [pregeneratedCache, isGenerating, currentSlotId, generatedChoices, currentSlot]);

  // Check Ollama Connection status
  const checkOllamaConnection = async () => {
    if (providerMode !== "ollama") {
      setOllamaStatus(providerMode === "mock" ? "mock" : (geminiApiKey ? "connected" : "disconnected"));
      return;
    }
    try {
      const response = await fetch(`${ollamaHost.replace(/\/$/, "")}/api/tags`, {
        method: "GET"
      });
      if (response.ok) {
        setOllamaStatus("connected");
        showToast("Connected to local Ollama API!", "success");
      } else {
        setOllamaStatus("disconnected");
      }
    } catch (e) {
      setOllamaStatus("disconnected");
    }
  };

  // Run initial connection test
  useEffect(() => {
    if (providerMode === "ollama") {
      checkOllamaConnection();
    }
  }, [ollamaHost]);

  // Auto-render math equations with KaTeX whenever relevant state changes
  useEffect(() => {
    const renderMath = () => {
      if (window.renderMathInElement) {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      }
    };
    renderMath();
    // Use a small timeout to catch any deferred React DOM rendering cycles
    const timer = setTimeout(renderMath, 50);
    return () => clearTimeout(timer);
  }, [generatedChoices, questionsBank, currentSlotId, editingQuestion, showExplanationIndex]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to trigger automatic generation for a specific slot
  const triggerAutoGenerate = async (targetSlot) => {
    if (!targetSlot) return;

    if (pregeneratedCache[targetSlot.id]) {
      // It's already in cache! The currentSlotId useEffect will handle setting 
      // generatedChoices and deleting the cache, preventing race conditions.
      showToast(`Instantly loaded pre-generated choices for Topic ${targetSlot.subtopicId}!`, "success");
      return;
    }

    if (pregeneratingSlotId === targetSlot.id) {
      setIsGenerating(true);
      // Let the currentSlotId useEffect clear the choices, we just wait.
      showToast(`Waiting for background generation to finish for Topic ${targetSlot.subtopicId}...`, "warning");
      return;
    }

    setIsGenerating(true);
    setShowExplanationIndex(null);
    setGeneratedChoices([]);

    try {
      const questions = await generateQuestions(
        ollamaHost,
        ollamaModel,
        targetSlot.topicId,
        targetSlot.subtopicId,
        targetSlot.subtopicName,
        targetSlot.level,
        providerMode,
        geminiApiKey,
        geminiModel
      );
      setGeneratedChoices(questions);
      showToast(`Automatically generated choices for Topic ${targetSlot.subtopicId}!`, "success");
    } catch (err) {
      console.error(err);
      showToast(`Auto-generation failed. Check host endpoint or enable Mock Mode.`, "error");
      setOllamaStatus("disconnected");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Questions handler
  const handleGenerate = async () => {
    if (!currentSlot) return;

    if (pregeneratingSlotId === currentSlot.id) {
      setIsGenerating(true);
      setShowExplanationIndex(null);
      setGeneratedChoices([]);
      showToast(`Waiting for background generation to finish...`, "warning");
      return;
    }

    setIsGenerating(true);
    setShowExplanationIndex(null);
    setGeneratedChoices([]);

    try {
      const questions = await generateQuestions(
        ollamaHost,
        ollamaModel,
        currentSlot.topicId,
        currentSlot.subtopicId,
        currentSlot.subtopicName,
        currentSlot.level,
        providerMode,
        geminiApiKey,
        geminiModel
      );
      setGeneratedChoices(questions);
      showToast(`Successfully generated 5 multiple-choice questions!`, "success");
    } catch (err) {
      console.error(err);
      showToast(`Ollama Generation failed. Check host endpoint or enable Mock Mode.`, "error");
      setOllamaStatus("disconnected");
    } finally {
      setIsGenerating(false);
    }
  };

  // Select Question & add to Bank
  const handleSelectQuestion = (questionObj) => {
    // Remove if already exists for this slot, to avoid duplicates
    const filtered = questionsBank.filter(q => q.id !== currentSlot.id);
    
    const questionToSave = {
      ...questionObj,
      id: currentSlot.id,
      topicId: currentSlot.topicId,
      subtopicId: currentSlot.subtopicId,
      subtopicName: currentSlot.subtopicName,
      level: currentSlot.level,
      timestamp: Date.now()
    };

    const newBank = [...filtered, questionToSave];
    setQuestionsBank(newBank);
    showToast(`Added to Question Bank: Topic ${currentSlot.subtopicId}`, "success");

    // Automatically navigate to the next uncompleted slot
    const currentIndex = slots.findIndex(s => s.id === currentSlot.id);
    let nextIndex = (currentIndex + 1) % slots.length;
    
    // Find next uncompleted slot, up to one full loop
    let foundNext = false;
    let nextSlotToGenerate = null;
    for (let i = 0; i < slots.length; i++) {
      const checkSlot = slots[nextIndex];
      const isCompleted = newBank.some(q => q.id === checkSlot.id);
      if (!isCompleted) {
        setCurrentSlotId(checkSlot.id);
        nextSlotToGenerate = checkSlot;
        foundNext = true;
        break;
      }
      nextIndex = (nextIndex + 1) % slots.length;
    }

    if (!foundNext) {
      showToast("Amazing! You have completed all 50 slots in the IB Physics HL syllabus!", "success");
    } else if (nextSlotToGenerate) {
      triggerAutoGenerate(nextSlotToGenerate);
    }
  };

  // Delete Question from bank
  const handleDeleteQuestion = (slotId) => {
    setQuestionsBank(questionsBank.filter(q => q.id !== slotId));
    showToast("Removed question from bank.", "warning");
    // If the active slot was completed and we deleted it, update choices view
    if (currentSlotId === slotId) {
      setGeneratedChoices([]);
    }
  };

  // Start Editing modal
  const handleStartEdit = (q) => {
    setEditingQuestion({ ...q });
  };

  // Save Edits handler
  const handleSaveEdits = (e) => {
    e.preventDefault();
    setQuestionsBank(questionsBank.map(q => q.id === editingQuestion.id ? editingQuestion : q));
    
    // Update active view if current slot matches edited question
    if (currentSlotId === editingQuestion.id) {
      setGeneratedChoices([editingQuestion]);
    }
    
    setEditingQuestion(null);
    showToast("Successfully updated question details.", "success");
  };

  // Clear entire Question Bank
  const handleClearBank = () => {
    if (window.confirm("Are you sure you want to clear your entire question bank progress? This action cannot be undone.")) {
      setQuestionsBank([]);
      setGeneratedChoices([]);
      const firstSlot = slots[0];
      if (firstSlot) setCurrentSlotId(firstSlot.id);
      showToast("Reset all question bank progress.", "warning");
    }
  };

  // Auto-fill all remaining uncompleted slots with real-time visual progress
  const handleFillRemaining = async () => {
    const uncompletedSlots = slots.filter(slot => !questionsBank.some(q => q.id === slot.id));
    if (uncompletedSlots.length === 0) return;

    setIsGenerating(true);
    setAutoFillProgress({ current: 0, total: uncompletedSlots.length });
    showToast(`Beginning automatic progress fill for ${uncompletedSlots.length} slots...`, "warning");

    let currentBank = [...questionsBank];

    for (let i = 0; i < uncompletedSlots.length; i++) {
      const slot = uncompletedSlots[i];
      try {
        // Generate 5 mock questions instantly (using isMock = true for high speed)
        const questions = await generateQuestions(
          ollamaHost,
          ollamaModel,
          slot.topicId,
          slot.subtopicId,
          slot.subtopicName,
          slot.level,
          true // force mock generation for instant populating
        );
        
        // Randomly choose 1 out of the 5
        const randomIndex = Math.floor(Math.random() * questions.length);
        const chosenQuestion = questions[randomIndex];

        currentBank = [...currentBank, {
          ...chosenQuestion,
          id: slot.id,
          topicId: slot.topicId,
          subtopicId: slot.subtopicId,
          subtopicName: slot.subtopicName,
          level: slot.level,
          timestamp: Date.now()
        }];

        // Update state incrementally so progress bar and tree animate live!
        setQuestionsBank(currentBank);
        setAutoFillProgress({ current: i + 1, total: uncompletedSlots.length });
      } catch (e) {
        console.error("Failed to generate mock question for auto-fill slot:", slot.id, e);
      }
    }

    // Update active view choice if currently selected slot was filled
    const savedForSlot = currentBank.find(q => q.id === currentSlotId);
    if (savedForSlot) {
      setGeneratedChoices([savedForSlot]);
    }

    setIsGenerating(false);
    setAutoFillProgress(null);
    showToast(`Instantly filled all ${uncompletedSlots.length} remaining slots with randomized exam questions!`, "success");
  };

  // Export Question Bank to MS Word document
  const handleExport = () => {
    // Sort questions in syllabus order before exporting
    const sortedQuestions = [...questionsBank].sort((a, b) => {
      const idxA = slots.findIndex(s => s.id === a.id);
      const idxB = slots.findIndex(s => s.id === b.id);
      return idxA - idxB;
    });
    exportQuestionBankToDocx(sortedQuestions);
  };

  const handleExportZip = () => {
    const sortedQuestions = [...questionsBank].sort((a, b) => {
      const idxA = slots.findIndex(s => s.id === a.id);
      const idxB = slots.findIndex(s => s.id === b.id);
      return idxA - idxB;
    });
    exportQuestionsToZip(sortedQuestions);
  };

  // Calculate Progress Stats
  const totalSlots = slots.length;
  const completedSlots = slots.filter(s => questionsBank.some(q => q.id === s.id)).length;
  const progressPercentage = Math.round((completedSlots / totalSlots) * 100);

  // Group slots by subtopic
  const getSubtopicProgress = (subtopicId) => {
    const subtopicSlots = slots.filter(s => s.subtopicId === subtopicId);
    const completed = subtopicSlots.filter(s => questionsBank.some(q => q.id === s.id)).length;
    return { completed: completed, total: subtopicSlots.length };
  };

  // Check if slot is completed
  const isSlotCompleted = (slotId) => {
    return questionsBank.some(q => q.id === slotId);
  };

  return (
    <div className="app-container">
      {/* 1. LEFT SIDEBAR: TOPICS & COMPLETION PROGRESS */}
      <aside className="sidebar-left">
        <div className="brand-section">
          <div className="brand-icon">
            <Brain size={20} />
          </div>
          <div>
            <h1 className="brand-name">IB Physics Bank</h1>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              HL Syllabus builder
            </span>
          </div>
        </div>

        {/* Circular Progress Meter */}
        <div className="progress-card">
          <div className="progress-circular">
            <svg>
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle className="bg" cx="30" cy="30" r="26" />
              <circle 
                className="bar" 
                cx="30" 
                cy="30" 
                r="26" 
                strokeDasharray={163.36} 
                strokeDashoffset={163.36 - (163.36 * progressPercentage) / 100}
              />
            </svg>
            <div className="progress-text">{progressPercentage}%</div>
          </div>
          <div className="progress-info">
            <span className="progress-title">Overall Progress</span>
            <span className="progress-sub">{completedSlots} / {totalSlots} Target Slots</span>
          </div>
        </div>

        {/* Syllabus Topic Accordion Tree */}
        <div className="topics-list">
          {SYLLABUS.map((topic) => {
            const isTopicActive = topic.id === expandedTopic;
            const completedInTopic = slots.filter(s => s.topicId === topic.id && isSlotCompleted(s.id)).length;
            const totalInTopic = slots.filter(s => s.topicId === topic.id).length;

            return (
              <div key={topic.id} className="topic-group">
                <div 
                  className={`topic-header ${isTopicActive ? "active" : ""}`}
                  onClick={() => setExpandedTopic(isTopicActive ? "" : topic.id)}
                >
                  <span className="topic-header-title">
                    <BookOpen size={14} style={{ color: "var(--accent-color)" }} />
                    Topic {topic.id}
                  </span>
                  <span className="topic-indicator">
                    {completedInTopic}/{totalInTopic}
                  </span>
                </div>

                {isTopicActive && (
                  <div className="subtopics-container">
                    {topic.subtopics.map((sub) => {
                      const { completed: subCompleted, total: subTotal } = getSubtopicProgress(sub.id);
                      return (
                        <div key={sub.id} className="subtopic-item">
                          <div className="subtopic-meta">
                            <span style={{ color: "var(--text-primary)" }}>{sub.id}</span>
                            <span>{subCompleted}/{subTotal}</span>
                          </div>
                          <span className="subtopic-name">{sub.name}</span>

                          {/* Render slot badges inside subtopic */}
                          <div className="slots-grid">
                            {sub.slots.map((slot, sIdx) => {
                              const uniqueId = `${sub.id}-${slot.level.replace(/\s+/g, "_")}-${sIdx}`;
                              const isActive = uniqueId === currentSlotId;
                              const isFinished = isSlotCompleted(uniqueId);
                              
                              let badgeClass = "remembering";
                              if (slot.level.includes("fundamental")) badgeClass = "understanding";
                              else if (slot.level.includes("advanced")) badgeClass = "understanding_adv";
                              else if (slot.level.includes("understanding")) badgeClass = "understanding";

                              return (
                                <button
                                  key={uniqueId}
                                  onClick={() => setCurrentSlotId(uniqueId)}
                                  className={`slot-badge ${badgeClass} ${isActive ? "active" : ""} ${isFinished ? "completed" : ""}`}
                                  title={`${sub.id} - ${slot.level} (${isFinished ? "Completed" : "Pending"})`}
                                >
                                  {isFinished ? (
                                    <CheckCircle size={9} strokeWidth={3} />
                                  ) : (
                                    <Circle size={9} />
                                  )}
                                  {slot.level.split(" ")[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Theme Settings Toggle */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", gap: "8px", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Appearance</span>
          <button 
            className="btn btn-secondary" 
            style={{ padding: "6px 12px" }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE: QUESTIONS BUILDER AND CONFIGURATION */}
      <main className="main-workspace">
        <header className="workspace-header">
          <div className="workspace-title-wrapper">
            <h2>Question Builder Workspace</h2>
            <p>Active Syllabus Target: <strong>Topic {currentSlot?.subtopicId} — {currentSlot?.subtopicName}</strong></p>
          </div>
        </header>

        {/* Ollama Connection Settings Dashboard */}
        <section className="ollama-card">
          <div className="form-group">
            <label>AI Provider Mode</label>
            <select 
              value={providerMode} 
              onChange={(e) => setProviderMode(e.target.value)}
              className="settings-select"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <option value="mock">Mock Database (Instant)</option>
              <option value="gemini">Google Gemini API</option>
              <option value="ollama">Local Ollama LLM</option>
            </select>
          </div>

          {providerMode === "ollama" && (
            <>
              <div className="form-group">
                <label>Local Ollama API Endpoint</label>
                <input 
                  type="text" 
                  value={ollamaHost} 
                  onChange={(e) => setOllamaHost(e.target.value)} 
                  placeholder="e.g. http://localhost:11434"
                />
              </div>
              <div className="form-group">
                <label>Target LLM Model</label>
                <input 
                  type="text" 
                  value={ollamaModel} 
                  onChange={(e) => setOllamaModel(e.target.value)} 
                  placeholder="e.g. llama3"
                />
              </div>
            </>
          )}

          {providerMode === "gemini" && (
            <>
              <div className="form-group">
                <label>Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiApiKey} 
                  onChange={(e) => setGeminiApiKey(e.target.value)} 
                  placeholder="Enter your Google AI Studio API key"
                />
              </div>
              <div className="form-group">
                <label>Gemini Model</label>
                <select 
                  value={geminiModel} 
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="settings-select"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default/Lite)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.0-pro">Gemini 1.0 Pro (Legacy)</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="status-dot-wrapper">
              <span className={`status-dot ${ollamaStatus}`}></span>
              <span style={{ fontSize: '0.8rem' }}>
                {providerMode === "mock" ? "Mock Mode Active" : 
                 providerMode === "gemini" ? (geminiApiKey ? "Gemini Key Provided" : "Missing API Key") : 
                 "Ollama " + ollamaStatus}
              </span>
            </div>
            {providerMode === "ollama" && (
              <button 
                className="btn btn-secondary"
                onClick={checkOllamaConnection}
              >
                <RefreshCw size={14} />
                Ping
              </button>
            )}
          </div>


        </section>

        {/* Active Target Prompter Dashboard */}
        <section className="prompt-box">
          <div className="prompt-header">
            <span className="prompt-badge">LLM Prompt Preview</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <Award size={12} style={{ color: "var(--color-warning)" }} />
              <span>Bloom Level: <strong>{currentSlot?.level}</strong></span>
            </div>
          </div>
          
          <div className="prompt-text">
            For IB Physics HL topic {currentSlot?.subtopicId}, create 3-5 multiple choice questions, with answer and explanation, that will fit the {currentSlot?.level} level of bloom's taxonomy.
          </div>

          <div className="action-bar">
            {questionsBank.some(q => q.id === currentSlot.id) && (
              <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--color-success)", fontWeight: 700 }}>
                <CheckCircle size={16} />
                <span>Question saved in bank for this slot!</span>
              </div>
            )}
            <button 
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              {isGenerating ? "Generating choices..." : "Generate 5 Choices"}
            </button>
          </div>
        </section>

        {/* LOADING SKELETON */}
        {isGenerating && (
          <div className="skeleton-container">
            {[1, 2].map(n => (
              <div key={n} className="skeleton-card">
                <div className="skeleton-shimmer"></div>
                <div className="skeleton-line title"></div>
                <div className="skeleton-line body"></div>
                <div className="skeleton-line body" style={{ width: "60%" }}></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "16px" }}>
                  <div className="skeleton-line option"></div>
                  <div className="skeleton-line option"></div>
                  <div className="skeleton-line option"></div>
                  <div className="skeleton-line option"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESULTS: OPTIONS LIST GENERATED */}
        {!isGenerating && generatedChoices.length > 0 && (
          <section className="results-container">
            <div className="results-heading-bar">
              <h3>
                {questionsBank.some(q => q.id === currentSlot.id) 
                  ? "Saved Question for Syllabus Slot" 
                  : `Select 1 Question out of ${generatedChoices.length} choices to add to bank`}
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {questionsBank.some(q => q.id === currentSlot.id) ? "Editing this selection will update the saved bank." : "Select your preferred version below."}
              </span>
            </div>

            <div className="question-choices-list">
              {generatedChoices.map((q, idx) => {
                const isSavedThisOne = questionsBank.some(bankQ => bankQ.id === currentSlot.id && bankQ.question === q.question);
                const isExplanationOpen = showExplanationIndex === idx;

                return (
                  <div 
                    key={idx} 
                    className={`question-choice-card ${isSavedThisOne ? "selected" : ""}`}
                  >
                    <div className="question-choice-header">
                      <div className="question-number-badge">{idx + 1}</div>
                      <div className="question-text-content">{q.question}</div>
                    </div>

                    <div className="options-grid">
                      {["A", "B", "C", "D"].map((letter) => {
                        const optionText = q.options[letter];
                        const isCorrectOption = q.answer === letter;
                        return (
                          <div 
                            key={letter} 
                            className={`option-btn ${isCorrectOption && (isExplanationOpen || isSavedThisOne) ? "correct-choice" : ""}`}
                          >
                            <div className="option-letter">{letter}</div>
                            <span>{optionText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {isExplanationOpen && (
                      <div className="explanation-panel">
                        <div className="explanation-title">
                          <CheckCircle size={12} />
                          <span>Correct Option {q.answer} & Explanation</span>
                        </div>
                        <p className="explanation-body">{q.explanation}</p>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "14px", justifyContent: "flex-end", alignItems: "center" }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                        onClick={() => setShowExplanationIndex(isExplanationOpen ? null : idx)}
                      >
                        {isExplanationOpen ? "Hide Details" : "Show Answer & Explanation"}
                      </button>
                      
                      {!questionsBank.some(bankQ => bankQ.id === currentSlot.id) ? (
                        <button 
                          className="btn btn-success"
                          style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                          onClick={() => handleSelectQuestion(q)}
                        >
                          Choose & Add to Bank
                        </button>
                      ) : (
                        isSavedThisOne && (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle size={12} /> Active Bank Choice
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {!isGenerating && generatedChoices.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 40px", color: "var(--text-secondary)", gap: "16px" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: "24px", borderRadius: "100%", border: "1px solid var(--border-color)" }}>
              <Brain size={40} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>No Questions Generated</h3>
              <p style={{ fontSize: "0.82rem", maxWidth: "420px", color: "var(--text-muted)" }}>
                Generate five multiple-choice questions for the active syllabus target (<strong>Topic {currentSlot?.subtopicId} — {currentSlot?.level}</strong>) using your local LLM models.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate}>
              <Play size={14} />
              Generate 5 Choices Now
            </button>
          </div>
        )}
      </main>

      {/* 3. RIGHT SIDEBAR: QUESTION BANK TRACKER */}
      <aside className="sidebar-right">
        <div className="bank-header">
          <div className="bank-header-title">
            <Database size={16} style={{ color: "var(--accent-color)" }} />
            <span>Question Bank</span>
          </div>
          <span className="bank-badge">{questionsBank.length} / 50</span>
        </div>

        {/* Saved Bank List */}
        <div className="bank-list">
          {questionsBank.length === 0 ? (
            <div className="bank-empty-state">
              <Database size={32} />
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>Bank is Empty</h4>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "0 10px" }}>
                  Select questions from your generation workspace on the left to add them to your persistent bank.
                </p>
              </div>
            </div>
          ) : (
            [...questionsBank]
              .sort((a, b) => {
                const idxA = slots.findIndex(s => s.id === a.id);
                const idxB = slots.findIndex(s => s.id === b.id);
                return idxA - idxB;
              })
              .map((q) => (
                <div key={q.id} className="bank-item-card">
                  <div className="bank-item-meta">
                    <span className="bank-item-tag">{q.subtopicId} • {q.level.split(" ")[0]}</span>
                    <div className="bank-item-actions">
                      <button 
                        className="bank-item-btn" 
                        title="Edit question details"
                        onClick={() => handleStartEdit(q)}
                      >
                        <Edit size={12} />
                      </button>
                      <button 
                        className="bank-item-btn delete" 
                        title="Delete question from bank"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="bank-item-text">{q.question}</p>
                  <div className="bank-item-ans">Answer: {q.answer}</div>
                </div>
              ))
          )}
        </div>

        {/* Bank Footer Controls */}
        <div className="bank-footer">
          {questionsBank.length < 50 && (
            <button 
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center", marginBottom: "10px", borderColor: "var(--border-hover)", color: "var(--text-primary)", position: "relative", overflow: "hidden" }}
              onClick={handleFillRemaining}
              disabled={isGenerating || autoFillProgress !== null}
            >
              {autoFillProgress ? (
                <>
                  <RefreshCw size={14} className="animate-spin" style={{ marginRight: "8px" }} />
                  Filling: {Math.round((autoFillProgress.current / autoFillProgress.total) * 100)}% ({autoFillProgress.current}/{autoFillProgress.total})
                  <div 
                    style={{ 
                      position: "absolute", 
                      bottom: 0, 
                      left: 0, 
                      height: "3px", 
                      background: "var(--primary-gradient)", 
                      width: `${(autoFillProgress.current / autoFillProgress.total) * 100}%`,
                      transition: "width 0.1s ease"
                    }} 
                  />
                </>
              ) : (
                <>
                  <Play size={14} style={{ color: "var(--bloom-remember)", marginRight: "8px" }} />
                  Auto-Fill Remaining ({50 - questionsBank.length} slots)
                </>
              )}
            </button>
          )}
          
          <button 
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginBottom: "10px" }}
            onClick={handleExport}
            disabled={questionsBank.length === 0}
          >
            <Download size={14} />
            Export to Word (.docx)
          </button>

          <button 
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center", marginBottom: "10px" }}
            onClick={handleExportZip}
            disabled={questionsBank.length === 0}
          >
            <Archive size={14} />
            Export ZIP (Debug individual DOCX)
          </button>
          
          {questionsBank.length > 0 && (
            <button 
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center", color: "var(--color-danger)", borderColor: "rgba(244, 63, 94, 0.2)" }}
              onClick={handleClearBank}
            >
              <Trash2 size={14} />
              Reset Progress
            </button>
          )}
        </div>
      </aside>

      {/* --- EDIT MODAL OVERLAY --- */}
      {editingQuestion && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveEdits}>
            <div className="modal-header">
              <h3>Edit Question Details</h3>
              <button 
                type="button" 
                className="bank-item-btn" 
                style={{ color: "var(--text-muted)" }}
                onClick={() => setEditingQuestion(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label>Question Wording</label>
              <textarea 
                value={editingQuestion.question} 
                onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Option A</label>
                <input 
                  type="text" 
                  value={editingQuestion.options.A} 
                  onChange={(e) => setEditingQuestion({ 
                    ...editingQuestion, 
                    options: { ...editingQuestion.options, A: e.target.value } 
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Option B</label>
                <input 
                  type="text" 
                  value={editingQuestion.options.B} 
                  onChange={(e) => setEditingQuestion({ 
                    ...editingQuestion, 
                    options: { ...editingQuestion.options, B: e.target.value } 
                  })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Option C</label>
                <input 
                  type="text" 
                  value={editingQuestion.options.C} 
                  onChange={(e) => setEditingQuestion({ 
                    ...editingQuestion, 
                    options: { ...editingQuestion.options, C: e.target.value } 
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Option D</label>
                <input 
                  type="text" 
                  value={editingQuestion.options.D} 
                  onChange={(e) => setEditingQuestion({ 
                    ...editingQuestion, 
                    options: { ...editingQuestion.options, D: e.target.value } 
                  })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Correct Answer Letter</label>
              <select 
                value={editingQuestion.answer}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="form-group">
              <label>Detailed Explanation</label>
              <textarea 
                value={editingQuestion.explanation} 
                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setEditingQuestion(null)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-success"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- TOAST NOTIFICATIONS --- */}
      {toast && (
        <div className={`notification-toast ${toast.type}`}>
          <AlertCircle size={16} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
