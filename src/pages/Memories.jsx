import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Plus,
  ArrowLeft,
  Sparkles,
  Maximize2,
  ExternalLink,
  Film,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const Youtube = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Memories() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [lightboxItem, setLightboxItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadMemories = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/memories`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'Could not load the memories gallery.');
      setMemories(data);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Could not connect to the memories gallery.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMemories();
    const timer = window.setInterval(() => void loadMemories(), 30000);
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') void loadMemories(); };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [loadMemories]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadMemories();
  };

  const handleDownloadDesktopPack = () => {
    const summary = {
      event: 'TECHDECODE 2026 - The Ultimate Technical Pictogram Fest',
      totalMemories: memories.length,
      photos: memories.filter((m) => m.type === 'photo').length,
      videos: memories.filter((m) => m.type === 'video').length,
      youtubeLinks: memories.filter((m) => m.type === 'youtube').map((m) => ({ title: m.title, url: m.url })),
      links: memories.filter((m) => m.type === 'link').map((m) => ({ title: m.title, url: m.url })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TECHDECODE_fest_memories_pack.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filtered = memories.filter((m) => (filter === 'all' ? true : m.type === filter));

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] py-10 px-4 max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-cyan-neon mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              RETURN TO HOME
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-soft/10 border border-purple-soft/30 text-purple-soft text-xs font-mono mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              REAL FEST MEDIA ARCHIVE
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wider">
              TECHDECODE MEMORIES & ARCHIVES
            </h1>
            <p className="text-xs sm:text-sm font-body text-white/60">
              Photographs, stage action videos, and YouTube highlights captured during the game show
            </p>
          </div>

          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              aria-label="Refresh memories"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn-primary min-h-10 flex-1 sm:flex-none py-2.5 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-neon-cyan"
            >
              <Plus className="w-4 h-4" />
              ADMIN UPLOAD
            </button>

            <button
              type="button"
              onClick={handleDownloadDesktopPack}
              className="min-h-10 flex-1 sm:flex-none p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-all"
              title="Download Desktop Pack"
            >
              <Download className="w-4 h-4" />
              DESKTOP ARCHIVE
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          {[
            { id: 'all', label: 'All Moments', count: memories.length, icon: Sparkles },
            {
              id: 'photo',
              label: 'Photos',
              count: memories.filter((m) => m.type === 'photo').length,
              icon: ImageIcon,
            },
            {
              id: 'video',
              label: 'Videos',
              count: memories.filter((m) => m.type === 'video').length,
              icon: Film,
            },
            { id: 'youtube', label: 'YouTube Highlights', count: memories.filter((m) => m.type === 'youtube').length, icon: Youtube },
            { id: 'link', label: 'Links', count: memories.filter((m) => m.type === 'link').length, icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-cyan-neon/15 border border-cyan-neon text-cyan-neon shadow-lg shadow-cyan-950/40'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-60">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {loadError && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{loadError} <button type="button" onClick={handleRefresh} className="ml-2 underline underline-offset-4">Retry</button></div>}
        {isLoading && <div role="status" className="rounded-xl border border-white/10 bg-navy-900/70 p-10 text-center text-sm text-white/50">Loading the memories archive…</div>}

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <motion.div
              key={item.id || item._id || item.url}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-navy-900/70 backdrop-blur-md overflow-hidden flex flex-col justify-between group hover:border-cyan-neon/40 transition-all shadow-xl"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                {item.type === 'photo' && (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}

                {item.type === 'video' && (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                )}

                {item.type === 'youtube' && (
                  <iframe
                    className="w-full h-full border-0"
                    src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}

                {/* Badge Tag */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-cyan-neon uppercase tracking-wider">
                  {item.eventTag}
                </div>

                {item.type === 'photo' && (
                  <button
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-cyan-neon text-white hover:text-black transition-all cursor-pointer"
                    title="Expand View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Media Info */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                  <span>{item.author}</span>
                  <span>{item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')}</span>
                </div>

                <h3 className="font-display font-bold text-base text-white group-hover:text-cyan-neon transition-colors line-clamp-1">
                  {item.title}
                </h3>

                <p className="text-xs font-body text-white/70 line-clamp-2">
                  {item.description}
                </p>

                {(item.type === 'youtube' || item.type === 'link') && (
                  <div className="pt-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300"
                    >
                      {item.type === 'youtube' ? <Youtube className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      <span>{item.type === 'youtube' ? 'Watch on YouTube' : 'Open link'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {!isLoading && !loadError && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/50">No real media has been added yet. Admin uploads will appear here.</div>}

        {/* Lightbox Modal */}
        {lightboxItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxItem(null)}
          >
            <div className="max-w-4xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title}
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="flex items-center justify-between text-white text-sm">
                <div>
                  <h4 className="font-bold">{lightboxItem.title}</h4>
                  <p className="text-xs text-white/60">{lightboxItem.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

