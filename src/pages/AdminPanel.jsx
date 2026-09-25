import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Plus,
  Trash2,
  Edit,
  FileUp,
  Download,
  Layers,
  Search,
  Trophy,
  Users,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

const EMOJI_OPTIONS = ['💻', '⌨️', '🐍', '⚙️', '🧠', '🤖', '🔒', '🌐', '☁️', '📱', '📊', '🔗', '🧩', '⚡'];
const ROUND_POINTS = { 2: 15, 3: 20, 4: 30 };
const isValidQuestion = (q) => q && [1, 2, 3, 4].includes(Number(q.round)) &&
  Array.isArray(q.options) && q.options.length === 4 && q.options.every((option) => typeof option === 'string' && option.trim()) &&
  typeof q.correctAnswer === 'string' && q.options.includes(q.correctAnswer) &&
  typeof q.pictogram === 'string' && q.pictogram.trim() && typeof q.question === 'string' && q.question.trim();

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [pinError, setPinError] = useState('');
  const questions = useGameStore((state) => state.questionBank);
  const loadQuestionBank = useGameStore((state) => state.loadQuestionBank);
  const saveQuestionBank = useGameStore((state) => state.saveQuestionBank);
  const [filterRound, setFilterRound] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // New Question Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [mediaType, setMediaType] = useState('photo');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [mediaStatus, setMediaStatus] = useState('');
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoriesError, setMemoriesError] = useState('');
  const [editingMemory, setEditingMemory] = useState(null);
  const [memoryForm, setMemoryForm] = useState(null);
  const [memoryReplacementFile, setMemoryReplacementFile] = useState(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [questionBankStatus, setQuestionBankStatus] = useState('');
  const [durableStorage, setDurableStorage] = useState(null);
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(null);
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

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Admin sign-in failed.');
      setAdminToken(result.token);
      setIsAuthenticated(true);
      void refreshLeaderboard(result.token);
      void refreshMemories();
      const loaded = await loadQuestionBank();
      if (!loaded) setQuestionBankStatus('Could not refresh saved questions from the server. Check the connection and retry.');
      fetch('/api/health', { cache: 'no-store' })
        .then((healthResponse) => healthResponse.ok ? healthResponse.json() : null)
        .then((health) => {
          if (health) {
            setDurableStorage(Boolean(health.durableStorage));
            setCloudinaryConfigured(Boolean(health.cloudinaryConfigured));
          }
        })
        .catch(() => { setDurableStorage(false); setCloudinaryConfigured(false); });
    } catch (error) { setPinError(error.message || 'Could not connect to the server.'); }
  };

  const refreshLeaderboard = async (token = adminToken) => {
    setLeaderboardLoading(true);
    setLeaderboardStatus('');
    try {
      const response = await fetch('/api/leaderboard', { cache: 'no-store' });
      const entries = await response.json();
      if (!response.ok || !Array.isArray(entries)) throw new Error(entries.error || 'Could not load saved results.');
      setLeaderboardEntries(entries);
    } catch (error) {
      setLeaderboardStatus(error.message || 'Could not load saved results.');
    } finally { setLeaderboardLoading(false); }
    return token;
  };

  const refreshMemories = async () => {
    setMemoriesLoading(true);
    setMemoriesError('');
    try {
      const response = await fetch('/api/memories', { cache: 'no-store' });
      const entries = await response.json();
      if (!response.ok || !Array.isArray(entries)) throw new Error(entries.error || 'Could not load the memory gallery.');
      setMemories(entries);
    } catch (error) {
      setMemoriesError(error.message || 'Could not load the memory gallery.');
    } finally { setMemoriesLoading(false); }
  };

  const startEditMemory = (memory) => {
    setEditingMemory(memory);
    setMemoryReplacementFile(null);
    setMemoryForm({
      title: memory.title || '',
      description: memory.description || '',
      eventTag: memory.eventTag || '',
      author: memory.author || '',
      url: memory.url || '',
    });
  };

  const saveMemoryEdit = async (event) => {
    event.preventDefault();
    if (!editingMemory || !memoryForm) return;
    setMediaStatus('');
    try {
      const hasNewFile = memoryReplacementFile && ['photo', 'video'].includes(editingMemory.type);
      let body = JSON.stringify(memoryForm);
      const headers = { 'Content-Type': 'application/json', 'x-admin-token': adminToken };
      if (hasNewFile) {
        body = new FormData();
        Object.entries(memoryForm).forEach(([key, value]) => body.append(key, value));
        body.append('media', memoryReplacementFile);
        delete headers['Content-Type'];
      }
      const response = await fetch(`/api/memories/${encodeURIComponent(editingMemory.id || editingMemory._id)}`, {
        method: 'PUT', headers, body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update this memory.');
      setMemories((items) => items.map((item) => String(item.id || item._id) === String(editingMemory.id || editingMemory._id) ? result : item));
      setEditingMemory(null);
      setMemoryForm(null);
      setMemoryReplacementFile(null);
      setMediaStatus('Memory updated. Changes are live in the public gallery.');
    } catch (error) { setMediaStatus(error.message || 'Could not update this memory.'); }
  };

  const deleteMemory = async (memory) => {
    if (!window.confirm(`Delete “${memory.title || 'this memory'}” from the public gallery?`)) return;
    setMediaStatus('');
    try {
      const response = await fetch(`/api/memories/${encodeURIComponent(memory.id || memory._id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete this memory.');
      setMemories((items) => items.filter((item) => String(item.id || item._id) !== String(memory.id || memory._id)));
      setMediaStatus('Memory deleted from the public gallery.');
    } catch (error) { setMediaStatus(error.message || 'Could not delete this memory.'); }
  };

  const deleteLeaderboardEntry = async (entry) => {
    if (!entry?.id || !window.confirm(`Remove ${entry.name}'s saved result from the leaderboard?`)) return;
    setLeaderboardStatus('');
    try {
      const response = await fetch(`/api/admin/leaderboard/${encodeURIComponent(entry.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not remove the result.');
      setLeaderboardEntries((entries) => entries.filter((item) => String(item.id) !== String(entry.id)));
    } catch (error) { setLeaderboardStatus(error.message || 'Could not remove the result.'); }
  };

  const handleStartEdit = (q) => {
    setEditingId(q.id);
    setEditFormData({ ...q });
  };

  const commitQuestions = async (nextQuestions) => {
    const missingRounds = [1, 2, 3, 4].filter((round) => !nextQuestions.some((question) => Number(question.round) === round));
    if (missingRounds.length) { alert(`Keep at least one question in each round. Empty: ${missingRounds.map((round) => `Round ${round}`).join(', ')}.`); return false; }
    try { await saveQuestionBank([...nextQuestions].sort((a, b) => Number(a.round) - Number(b.round)), adminToken); setQuestionBankStatus('Saved to the shared question bank. Individual, team, and host game starts will load these questions.'); return true; }
    catch (error) { alert(error.message); return false; }
  };

  const handleSaveEdit = async () => {
    if (!isValidQuestion(editFormData)) { alert('Choose four options and make the correct answer one of them.'); return; }
    if (await commitQuestions(questions.map((q) => (q.id === editingId ? editFormData : q)))) setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this question from active bank?')) {
      void commitQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleCreateQuestion = (e) => {
    e.preventDefault();
    const created = { ...newQuestion, id: Date.now(), options: newQuestion.options.map((option) => option.trim()), correctAnswer: newQuestion.correctAnswer.trim() };
    if (!isValidQuestion(created)) { alert('Choose four options and make the correct answer one of them.'); return; }
    void commitQuestions([...questions, created]).then((saved) => {
      if (saved) {
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
      }
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'TECHDECODE_questions.json');
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
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidQuestion)) {
          void commitQuestions(parsed).then((saved) => { if (saved) alert(`Successfully imported ${parsed.length} questions!`); });
        } else { alert('Every question needs a round, pictogram, four options, and a correct answer from those options.'); }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMediaSubmit = async (e) => {
    e.preventDefault();
    setMediaStatus('');
    try {
      let response;
      if (mediaType === 'photo' || mediaType === 'video') {
        if (!mediaFile) throw new Error('Choose a photo or video to upload.');
        const body = new FormData();
        body.append('media', mediaFile); body.append('type', mediaType); body.append('title', mediaTitle); body.append('description', mediaDescription);
        response = await fetch('/api/memories/upload', { method: 'POST', headers: { 'x-admin-token': adminToken }, body });
      } else {
        response = await fetch(`/api/memories/${mediaType}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ url: mediaUrl, title: mediaTitle, description: mediaDescription }) });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save media.');
      setMediaStatus('Saved. It is now available in the Memories gallery.');
      setMemories((items) => [result, ...items.filter((item) => String(item.id || item._id) !== String(result.id || result._id))]);
      setMediaFile(null); setMediaUrl(''); setMediaTitle(''); setMediaDescription('');
    } catch (error) { setMediaStatus(error.message); }
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
              Configure your private ADMIN_PIN in Render → Environment.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={128}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Admin passphrase"
                  className="w-full px-4 py-3 text-center tracking-widest font-mono text-lg rounded-xl bg-navy-950/80 border border-white/15 text-white placeholder-white/20 focus:outline-none focus:border-purple-soft"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 font-mono">
                    {pinError}
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
              TECHDECODE QUESTION VAULT
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

        <section aria-label="Admin dashboard overview" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Question bank', value: questions.length, detail: 'saved questions' },
            { label: 'Round 1', value: questions.filter((question) => Number(question.round) === 1).length, detail: 'questions' },
            { label: 'Round 2', value: questions.filter((question) => Number(question.round) === 2).length, detail: 'questions' },
            { label: 'Round 3', value: questions.filter((question) => Number(question.round) === 3).length, detail: 'questions' },
            { label: 'Round 4', value: questions.filter((question) => Number(question.round) === 4).length, detail: 'questions' },
            { label: 'Saved results', value: leaderboardEntries.length, detail: 'real game records' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-navy-900/70 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/45">{stat.label}</div>
              <div className="mt-1 font-display text-2xl font-black text-cyan-neon">{stat.value}</div>
              <div className="text-[10px] text-white/40">{stat.detail}</div>
            </div>
          ))}
        </section>

        {durableStorage === false && <div role="status" className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-xs text-amber-100"><strong>Storage needs setup:</strong> this server is using local JSON files. Add a MongoDB connection in Render environment variables for reliable shared data that survives service restarts.</div>}
        {durableStorage === true && <div role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-xs text-emerald-100">Shared MongoDB storage is connected. Admin changes and completed scores are saved centrally.</div>}
        {cloudinaryConfigured === false && <div role="status" className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-xs text-amber-100"><strong>Cloud media storage needs setup:</strong> add the rotated Cloudinary credentials to Render as <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>, and <code>CLOUDINARY_API_SECRET</code>. The gallery currently falls back to server-local uploads.</div>}
        {cloudinaryConfigured === true && <div role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-xs text-emerald-100">Cloudinary is configured for durable photo and video uploads.</div>}
        {questionBankStatus && <p role="status" className="text-xs text-cyan-neon">{questionBankStatus}</p>}

        <section className="rounded-2xl border border-white/10 bg-navy-900/70 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">MEMORIES STUDIO</h2>
              <p className="mt-1 text-xs text-white/50">Upload, edit, or remove photos, videos, and links shown in the public gallery.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-cyan-neon/20 bg-cyan-neon/10 px-3 py-1.5 text-[11px] font-mono text-cyan-neon">{memories.length} items</span>
              <button type="button" onClick={() => void refreshMemories()} disabled={memoriesLoading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${memoriesLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span></button>
            </div>
          </div>

          <form onSubmit={handleMediaSubmit} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 p-4 sm:p-6 items-end">
            <label className="text-xs text-white/60">Media type<select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="mt-1 w-full min-h-11 p-2.5 rounded-lg bg-navy-950 border border-white/15 text-white"><option value="photo">Photo</option><option value="video">Video</option><option value="youtube">YouTube link</option><option value="link">External link</option></select></label>
            {(mediaType === 'photo' || mediaType === 'video') ? <label className="text-xs text-white/60 sm:col-span-1 xl:col-span-2">Choose file<input required type="file" accept={mediaType === 'photo' ? 'image/*' : 'video/*'} onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="mt-1.5 block w-full min-h-11 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-neon/15 file:px-3 file:py-2 file:text-cyan-neon" /><span className="mt-1 block text-[10px] text-white/35">Maximum upload size: 50 MB</span></label> : <label className="text-xs text-white/60 sm:col-span-1 xl:col-span-2">Link URL<input required type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full min-h-11 p-2.5 rounded-lg bg-navy-950 border border-white/15 text-white" /></label>}
            <label className="text-xs text-white/60">Title<input value={mediaTitle} onChange={(e) => setMediaTitle(e.target.value)} maxLength={120} className="mt-1 w-full min-h-11 p-2.5 rounded-lg bg-navy-950 border border-white/15 text-white" placeholder="Memory title" /></label>
            <label className="text-xs text-white/60">Description<input value={mediaDescription} onChange={(e) => setMediaDescription(e.target.value)} maxLength={1000} className="mt-1 w-full min-h-11 p-2.5 rounded-lg bg-navy-950 border border-white/15 text-white" placeholder="Short description" /></label>
            <button type="submit" className="btn-primary min-h-11 p-2.5 text-xs font-bold sm:col-span-2 xl:col-span-1">SAVE TO GALLERY</button>
          </form>

          {mediaStatus && <p role="status" className="mx-4 mb-4 sm:mx-6 rounded-lg border border-cyan-neon/15 bg-cyan-neon/5 p-3 text-xs text-cyan-neon">{mediaStatus}</p>}
          {memoriesError && <p role="alert" className="mx-4 mb-4 sm:mx-6 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{memoriesError}</p>}
          {memoriesLoading && memories.length === 0 ? <p role="status" className="p-8 text-center text-sm text-white/45">Loading gallery items…</p> : memories.length === 0 ? <div className="border-t border-white/5 p-8 text-center"><p className="font-display text-white">No memories uploaded yet</p><p className="mt-1 text-xs text-white/45">Your saved photos, videos, and links will appear here for editing.</p></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 border-t border-white/5 p-4 sm:p-6">
              {memories.map((memory) => (
                <article key={memory.id || memory._id || memory.url} className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-navy-950/70 hover:border-cyan-neon/30 transition-colors">
                  <div className="relative aspect-video bg-black/50 flex items-center justify-center overflow-hidden">
                    {memory.type === 'photo' && <img src={memory.url} alt={memory.title || 'Uploaded memory'} loading="lazy" className="h-full w-full object-cover" />}
                    {memory.type === 'video' && <video src={memory.url} controls preload="metadata" className="h-full w-full object-contain" />}
                    {memory.type === 'youtube' && <iframe src={`https://www.youtube-nocookie.com/embed/${memory.youtubeId}`} title={memory.title || 'YouTube memory'} loading="lazy" className="h-full w-full border-0" allowFullScreen />}
                    {memory.type === 'link' && <a href={memory.url} target="_blank" rel="noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-cyan-neon"><ExternalLink className="h-6 w-6" /><span className="break-all text-xs">{memory.url}</span></a>}
                    <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/80">{memory.type}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-display font-bold text-sm text-white">{memory.title || 'Untitled memory'}</h3><p className="mt-1 line-clamp-2 min-h-8 text-xs text-white/50">{memory.description || 'No description'}</p></div><span className="shrink-0 text-[10px] text-white/35">{memory.createdAt ? new Date(memory.createdAt).toLocaleDateString() : ''}</span></div>
                    <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                      <button type="button" onClick={() => startEditMemory(memory)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-neon/20 bg-cyan-neon/5 text-xs font-semibold text-cyan-neon hover:bg-cyan-neon/10"><Edit className="h-3.5 w-3.5" /> Edit</button>
                      <button type="button" onClick={() => void deleteMemory(memory)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/5 text-xs font-semibold text-rose-300 hover:bg-rose-400/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {editingMemory && memoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-5 backdrop-blur-sm">
            <form onSubmit={saveMemoryEdit} className="my-4 w-full max-w-xl space-y-4 rounded-2xl border border-white/15 bg-navy-950 p-4 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-lg font-bold text-white">EDIT MEMORY</h2><p className="mt-1 text-xs text-white/45">Updates appear in the public gallery immediately.</p></div><button type="button" onClick={() => { setEditingMemory(null); setMemoryForm(null); setMemoryReplacementFile(null); }} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close editor">✕</button></div>
              <div className="space-y-3">
                <label className="block text-xs text-white/60">Title<input required maxLength={120} value={memoryForm.title} onChange={(event) => setMemoryForm({ ...memoryForm, title: event.target.value })} className="mt-1 w-full min-h-11 rounded-lg border border-white/15 bg-navy-900 p-3 text-white" /></label>
                <label className="block text-xs text-white/60">Description<textarea rows={3} maxLength={1000} value={memoryForm.description} onChange={(event) => setMemoryForm({ ...memoryForm, description: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-navy-900 p-3 text-white" /></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-white/60">Event tag<input maxLength={80} value={memoryForm.eventTag} onChange={(event) => setMemoryForm({ ...memoryForm, eventTag: event.target.value })} className="mt-1 w-full min-h-11 rounded-lg border border-white/15 bg-navy-900 p-3 text-white" /></label>
                  <label className="block text-xs text-white/60">Credit / author<input maxLength={80} value={memoryForm.author} onChange={(event) => setMemoryForm({ ...memoryForm, author: event.target.value })} className="mt-1 w-full min-h-11 rounded-lg border border-white/15 bg-navy-900 p-3 text-white" /></label>
                </div>
                {['photo', 'video'].includes(editingMemory.type) && <label className="block text-xs text-white/60">Replace media file (optional)<input type="file" accept={editingMemory.type === 'photo' ? 'image/*' : 'video/*'} onChange={(event) => setMemoryReplacementFile(event.target.files?.[0] || null)} className="mt-1.5 block w-full min-h-11 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-neon/15 file:px-3 file:py-2 file:text-cyan-neon" /></label>}
                {['link', 'youtube'].includes(editingMemory.type) && <label className="block text-xs text-white/60">Link URL<input required type="url" value={memoryForm.url} onChange={(event) => setMemoryForm({ ...memoryForm, url: event.target.value })} className="mt-1 w-full min-h-11 rounded-lg border border-white/15 bg-navy-900 p-3 text-white" /></label>}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2"><button type="button" onClick={() => { setEditingMemory(null); setMemoryForm(null); setMemoryReplacementFile(null); }} className="min-h-11 flex-1 rounded-lg border border-white/15 text-sm text-white/70">Cancel</button><button type="submit" className="btn-primary min-h-11 flex-1 text-sm font-bold">Save changes</button></div>
            </form>
          </div>
        )}

        <section className="rounded-xl border border-white/10 bg-navy-900/70 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-300/20 text-amber-300 flex items-center justify-center"><Trophy className="w-5 h-5" /></div>
              <div><h2 className="font-display text-lg font-bold text-white">LIVE GAME RESULTS</h2><p className="text-xs text-white/45">Saved individual and team scores from completed games.</p></div>
            </div>
            <button type="button" onClick={() => void refreshLeaderboard()} disabled={leaderboardLoading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${leaderboardLoading ? 'animate-spin' : ''}`} /> Refresh results</button>
          </div>
          {leaderboardStatus && <p role="alert" className="px-4 pt-3 text-xs text-rose-300">{leaderboardStatus}</p>}
          {leaderboardLoading && leaderboardEntries.length === 0 ? <p className="p-6 text-center text-sm text-white/45">Loading saved results…</p> : leaderboardEntries.length === 0 ? <p className="p-6 text-center text-sm text-white/45">No completed game results have been saved yet.</p> : (
            <div className="divide-y divide-white/5">
              {leaderboardEntries.map((entry, index) => (
                <div key={entry.id || `${entry.name}-${index}`} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="w-9 h-9 shrink-0 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs font-mono text-white/50">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-bold text-sm text-white">{entry.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase text-white/40"><Users className="w-3 h-3" />{entry.mode === 'team' ? 'Team' : 'Individual'}<span>·</span>{Number(entry.correctAnswers) || 0} correct</div>
                  </div>
                  <div className="text-right"><div className="font-display font-black text-cyan-neon">{Number(entry.score) || 0} pts</div><div className="text-[10px] text-white/35">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : 'Saved result'}</div></div>
                  <button type="button" onClick={() => void deleteLeaderboardEntry(entry)} className="rounded-lg p-2 text-white/40 hover:text-rose-300 hover:bg-rose-300/10" aria-label={`Delete ${entry.name}'s result`} title="Remove saved result"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/60 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/50">ROUND:</span>
            {['all', '1', '2', '3', '4'].map((r) => (
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
                {r === 'all' ? `All (${questions.length})` : `Round ${r}`}
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

        {editingId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <form onSubmit={(e) => { e.preventDefault(); void handleSaveEdit(); }} className="max-w-2xl w-full rounded-2xl border border-white/20 bg-navy-950 p-5 sm:p-6 space-y-3 my-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-display text-xl font-bold text-white">EDIT QUESTION</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-white/60">Round<select value={editFormData.round || 1} onChange={(e) => { const round = Number(e.target.value); setEditFormData({ ...editFormData, round, points: ROUND_POINTS[round] || editFormData.points }); }} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white"><option value={1}>Round 1 · Choose</option><option value={2}>Round 2 · Typed</option><option value={3}>Round 3 · Emoji decode</option><option value={4}>Round 4 · Rapid fire</option></select></label>
                <label className="text-xs text-white/60">Difficulty<select value={editFormData.difficulty || 'medium'} onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white"><option>easy</option><option>medium</option><option>hard</option></select></label>
                <label className="text-xs text-white/60 sm:col-span-2">Pictogram<input required value={editFormData.pictogram || ''} onChange={(e) => setEditFormData({ ...editFormData, pictogram: e.target.value })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white" /></label>
                <div className="sm:col-span-2 flex flex-wrap gap-1">{EMOJI_OPTIONS.map((emoji) => <button key={emoji} type="button" onClick={() => setEditFormData({ ...editFormData, pictogram: (editFormData.pictogram || '') + emoji })} className="rounded bg-white/10 px-2 py-1 text-lg" aria-label={`Add ${emoji} to pictogram`}>{emoji}</button>)}</div>
                <label className="text-xs text-white/60 sm:col-span-2">Question<input required value={editFormData.question || ''} onChange={(e) => setEditFormData({ ...editFormData, question: e.target.value })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white" /></label>
                <label className="text-xs text-white/60">Correct answer<select value={editFormData.correctAnswer || ''} onChange={(e) => setEditFormData({ ...editFormData, correctAnswer: e.target.value, acceptedAnswers: [] })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white">{(editFormData.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                <label className="text-xs text-white/60">Points<input type="number" min="0" value={editFormData.points || 0} readOnly={Boolean(ROUND_POINTS[Number(editFormData.round)])} onChange={(e) => setEditFormData({ ...editFormData, points: Number(e.target.value) })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white read-only:opacity-60" /></label>
                {(editFormData.options || []).map((option, index) => <label key={index} className="text-xs text-white/60">Option {index + 1}<input required value={option} onChange={(e) => { const options = [...editFormData.options]; options[index] = e.target.value; setEditFormData({ ...editFormData, options, ...(editFormData.correctAnswer === option ? { correctAnswer: e.target.value } : {}) }); }} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white" /></label>)}
                <label className="text-xs text-white/60">Hint<input value={editFormData.hint || ''} onChange={(e) => setEditFormData({ ...editFormData, hint: e.target.value })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white" /></label>
                <label className="text-xs text-white/60 sm:col-span-2">Explanation<textarea rows={3} value={editFormData.explanation || ''} onChange={(e) => setEditFormData({ ...editFormData, explanation: e.target.value })} className="mt-1 w-full p-2 rounded bg-navy-900 border border-white/15 text-white" /></label>
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setEditingId(null)} className="flex-1 p-2 rounded border border-white/15 text-white">CANCEL</button><button type="submit" className="flex-1 btn-primary p-2">SAVE CHANGES</button></div>
            </form>
          </div>
        )}

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
                    <label className="text-white/60 block mb-1">Round and answer style</label>
                    <select
                      value={newQuestion.round}
                      onChange={(e) => { const round = Number(e.target.value); setNewQuestion({ ...newQuestion, round, points: ROUND_POINTS[round] || 10 }); }}
                      className="w-full p-2 rounded bg-navy-900 border border-white/15 text-white"
                    >
                      <option value={1}>Round 1</option>
                      <option value={2}>Round 2 · Type answer</option>
                      <option value={3}>Round 3 · Emoji decode</option>
                      <option value={4}>Round 4 · Rapid fire</option>
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
                      readOnly={Boolean(ROUND_POINTS[newQuestion.round])}
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
                  <div className="mt-2 flex flex-wrap gap-1">{EMOJI_OPTIONS.map((emoji) => <button key={emoji} type="button" onClick={() => setNewQuestion({ ...newQuestion, pictogram: newQuestion.pictogram + emoji })} className="rounded bg-white/10 px-2 py-1 text-lg" aria-label={`Add ${emoji} to pictogram`}>{emoji}</button>)}</div>
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

