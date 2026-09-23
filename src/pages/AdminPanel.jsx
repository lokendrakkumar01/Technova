import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Plus,
  Trash2,
  Edit,
  Save,
  FileUp,
  Download,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowLeft,
  Search,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { QUESTIONS as INITIAL_QUESTIONS } from '../data/questions';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Question Management State
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [filterRound, setFilterRound] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // New Question Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    round: 1,
    category: 'Code Language',
    difficulty: 'medium',
    pictogram: '⚡ + 💻',
    question: 'WHAT DOES THIS REPRESENT?',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 20,
    hint: '',
  });

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === '9999') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleStartEdit = (q) => {
    setEditingId(q.id);
    setEditFormData({ ...q });
  };

  const handleSaveEdit = () => {
    setQuestions(questions.map((q) => (q.id === editingId ? editFormData : q)));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this question from active bank?')) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleCreateQuestion = (e) => {
    e.preventDefault();
    const created = {
      ...newQuestion,
      id: Date.now(),
    };
    setQuestions([...questions, created]);
    setShowAddModal(false);
    setNewQuestion({
      round: 1,
      category: 'Code Language',
      difficulty: 'medium',
      pictogram: '',
      question: 'WHAT DOES THIS REPRESENT?',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 20,
      hint: '',
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'technova_questions.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          setQuestions(parsed);
          alert(`Successfully imported ${parsed.length} questions!`);
        }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-purple-soft/10 border border-purple-soft/30 text-purple-soft flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-white mb-1">
              ADMINISTRATIVE VAULT
            </h1>
            <p className="text-xs font-mono text-white/50 mb-6">
              SYSTEM QUESTION MATRIX ACCESS
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Admin PIN (Default: 9999)"
                  className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-lg rounded-xl bg-navy-950/80 border border-white/15 text-white placeholder-white/20 focus:outline-none focus:border-purple-soft"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 font-mono">
                    SECURITY REJECTED // ACCESS DENIED
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-electric to-cyan-neon font-display font-bold text-xs tracking-widest uppercase text-white cursor-pointer"
              >
                ACCESS ADMIN PANEL
              </button>
            </form>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Filter questions
  const filtered = questions.filter((q) => {
    const matchRound = filterRound === 'all' || String(q.round) === filterRound;
    const matchSearch =
      q.correctAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.pictogram.includes(searchQuery);
    return matchRound && matchSearch;
  });

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] py-8 px-4 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-soft/10 border border-purple-soft/30 text-purple-soft text-xs font-mono mb-2">
              <Layers className="w-3.5 h-3.5" />
              QUESTION REPOSITORY ENGINE
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider">
              TECHNOVA QUESTION VAULT
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              ADD QUESTION
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono flex items-center gap-2 cursor-pointer"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
              EXPORT
            </button>

            <label className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono flex items-center gap-2 cursor-pointer">
              <FileUp className="w-4 h-4" />
              IMPORT
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/60 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/50">ROUND:</span>
            {['all', '1', '2', '3'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRound(r)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase border transition-all ${
                  filterRound === r
                    ? 'border-cyan-neon bg-cyan-neon/20 text-white font-bold'
                    : 'border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {r === 'all' ? 'All (30)' : `Round ${r}`}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answer or pictogram..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-navy-950/70 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-neon"
            />
          </div>
        </div>

        {/* Questions Grid/Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q) => {
            const isEditing = editingId === q.id;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-white/10 bg-navy-900/70 p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-neon font-bold">Q#{q.id} // R{q.round}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/60 uppercase">
                      {q.difficulty}
                    </span>
                    <span className="text-purple-soft font-bold">{q.points} PTS</span>
                  </div>
                </div>

                <div className="text-center py-2 text-3xl">{q.pictogram}</div>

                <div>
                  <div className="text-[10px] font-mono text-white/40 uppercase">Answer</div>
                  <div className="font-display font-bold text-lg text-white">
                    {q.correctAnswer}
                  </div>
                </div>

                <div className="text-xs text-white/60 font-body line-clamp-2">
                  {q.explanation}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40 truncate max-w-[150px]">
                    Hint: {q.hint || 'None'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(q)}
                      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-cyan-neon"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Question Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-xl w-full rounded-2xl border border-white/20 bg-navy-950 p-6 space-y-4 my-8">
              <h2 className="font-display text-xl font-bold text-white">
                CREATE NEW PICTOGRAM PUZZLE
              </h2>

              <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 block mb-1">Round (1, 2, or 3)</label>
                    <select
                      value={newQuestion.round}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, round: Number(e.target.value) })
                      }
                      className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                    >
                      <option value={1}>Round 1</option>
                      <option value={2}>Round 2</option>
                      <option value={3}>Round 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 block mb-1">Difficulty</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, difficulty: e.target.value })
                      }
                      className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                    >
                      <option value="easy">Easy (10pts)</option>
                      <option value="medium">Medium (20pts)</option>
                      <option value="hard">Hard (30pts)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 block mb-1">Points</label>
                    <input
                      type="number"
                      value={newQuestion.points}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, points: Number(e.target.value) })
                      }
                      className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Pictogram Emojis</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.pictogram}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, pictogram: e.target.value })
                    }
                    placeholder="e.g. 🐍 + 💻"
                    className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white text-base"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Correct Answer</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.correctAnswer}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })
                    }
                    placeholder="e.g. Python"
                    className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">4 Option Choices</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        required
                        placeholder={`Option ${['A', 'B', 'C', 'D'][idx]}`}
                        value={newQuestion.options[idx] || ''}
                        onChange={(e) => {
                          const updated = [...newQuestion.options];
                          updated[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: updated });
                        }}
                        className="p-2 rounded bg-navy-900 border border-white/15 text-white"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Hint</label>
                  <input
                    type="text"
                    value={newQuestion.hint}
                    onChange={(e) => setNewQuestion({ ...newQuestion, hint: e.target.value })}
                    placeholder="Clue revealed on hint lifeline"
                    className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Technical Explanation</label>
                  <textarea
                    rows={2}
                    value={newQuestion.explanation}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, explanation: e.target.value })
                    }
                    placeholder="Educational breakdown revealed after answering"
                    className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-white text-xs font-mono"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg btn-primary text-xs font-bold"
                  >
                    SAVE TO MATRIX
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
