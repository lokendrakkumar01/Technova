import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  Upload,
  Download,
  Plus,
  ArrowLeft,
  Sparkles,
  Play,
  Maximize2,
  Trash2,
  ExternalLink,
  Film,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const Youtube = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Initial Curated Tech Fest Memories
const DEFAULT_MEMORIES = [
  {
    id: 'mem-1',
    type: 'youtube',
    title: 'TECHNOVA Grand Finale & Tech Hackathon Ceremony',
    description: 'Highlights from the auditorium stage, audience excitement, and the final 10-second buzzer showdown.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    eventTag: 'Auditorium Finale',
    author: 'Tech Fest Media Cell',
    date: '2026 Fest Day 1',
  },
  {
    id: 'mem-2',
    type: 'photo',
    title: 'Code Warriors Champion Trophy Handover',
    description: 'The winning squad lifting the coveted TECHNOVA 2026 trophy under auditorium laser lights.',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
    eventTag: 'Trophy Moment',
    author: 'Chief Organizer',
    date: 'Final Showdown',
  },
  {
    id: 'mem-3',
    type: 'photo',
    title: 'Electric Crowd Decoding Round 2: Stack vs Queue',
    description: 'Audience and teams in deep algorithmic debate before the 5-second countdown.',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
    eventTag: 'Live Action',
    author: 'Stage Marshal',
    date: 'Round 2',
  },
  {
    id: 'mem-4',
    type: 'youtube',
    title: 'Behind The Scenes: Tech Fest Preparation & Setup',
    description: 'Engineering the projector graphics, neon stage lighting, and the buzzer sound system.',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    youtubeId: 'L_LUpnjgPso',
    eventTag: 'Backstage',
    author: 'Volunteers Core',
    date: 'Day 0 Setup',
  },
  {
    id: 'mem-5',
    type: 'photo',
    title: 'The Pictogram Matrix Screen on Giant Auditorium Display',
    description: 'Q30 Generative AI question lighting up the 20-foot projection screen.',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80',
    eventTag: 'Projector View',
    author: 'Visual Dept',
    date: 'Main Arena',
  },
  {
    id: 'mem-6',
    type: 'video',
    title: 'Victory Cheer & Confetti Explosion',
    description: 'Official recap video clip of confetti raining over the auditorium stage.',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-audience-cheering-at-a-concert-4028-large.mp4',
    eventTag: 'Celebration',
    author: 'Production Team',
    date: 'Closing Ceremony',
  },
];

export default function Memories() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState(DEFAULT_MEMORIES);
  const [filter, setFilter] = useState('all'); // 'all' | 'photo' | 'video' | 'youtube'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);

  // Form State
  const [mediaType, setMediaType] = useState('photo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTag, setEventTag] = useState('Tech Fest Highlights');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch from backend API if available
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${baseUrl}/api/memories`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.length > 0) {
          setMemories([...data, ...DEFAULT_MEMORIES]);
        }
      })
      .catch(() => {
        // Fallback to local state
      });
  }, []);

  const extractYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    let finalItem = null;

    if (mediaType === 'youtube') {
      const yId = extractYoutubeId(youtubeUrl);
      if (!yId) {
        alert('Please enter a valid YouTube video link');
        setIsUploading(false);
        return;
      }
      finalItem = {
        id: `mem-${Date.now()}`,
        type: 'youtube',
        title: title || 'TECHNOVA YouTube Highlight',
        description,
        url: youtubeUrl,
        youtubeId: yId,
        eventTag: eventTag || 'Fest Video',
        author: author || 'Fest Reporter',
        date: 'Just Now',
      };
    } else {
      // Photo or Video
      let mediaUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000';
      if (file) {
        // Try uploading to backend / Cloudinary
        try {
          const baseUrl = import.meta.env.VITE_API_URL || '';
          const formData = new FormData();
          formData.append('media', file);
          formData.append('title', title);
          formData.append('type', mediaType);
          const res = await fetch(`${baseUrl}/api/memories/upload`, {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const uploaded = await res.json();
            mediaUrl = uploaded.url || mediaUrl;
          } else {
            mediaUrl = URL.createObjectURL(file);
          }
        } catch {
          mediaUrl = URL.createObjectURL(file);
        }
      }

      finalItem = {
        id: `mem-${Date.now()}`,
        type: mediaType,
        title: title || `${mediaType.toUpperCase()} Moment`,
        description,
        url: mediaUrl,
        eventTag: eventTag || 'Captured Moment',
        author: author || 'College Delegate',
        date: 'Just Now',
      };
    }

    setMemories([finalItem, ...memories]);
    setIsUploading(false);
    setShowUploadModal(false);

    // Reset Form
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setFile(null);
  };

  const handleDownloadDesktopPack = () => {
    const summary = {
      event: 'TECHNOVA 2026 - The Ultimate Technical Pictogram Fest',
      totalMemories: memories.length,
      photos: memories.filter((m) => m.type === 'photo').length,
      videos: memories.filter((m) => m.type === 'video').length,
      youtubeLinks: memories.filter((m) => m.type === 'youtube').map((m) => ({
        title: m.title,
        url: m.url,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'technova_fest_memories_pack.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
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
              CLOUDINARY & FEST HIGHLIGHTS VAULT
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wider">
              TECHNOVA MEMORIES & ARCHIVES
            </h1>
            <p className="text-xs sm:text-sm font-body text-white/60">
              Photographs, stage action videos, and YouTube highlights captured during the game show
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 cursor-pointer shadow-neon-cyan"
            >
              <Plus className="w-4 h-4" />
              ADD MOMENT
            </button>

            <button
              type="button"
              onClick={handleDownloadDesktopPack}
              className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono flex items-center gap-2 cursor-pointer transition-all"
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
            {
              id: 'youtube',
              label: 'YouTube Highlights',
              count: memories.filter((m) => m.type === 'youtube').length,
              icon: Youtube,
            },
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

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
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
                  <span>{item.date}</span>
                </div>

                <h3 className="font-display font-bold text-base text-white group-hover:text-cyan-neon transition-colors line-clamp-1">
                  {item.title}
                </h3>

                <p className="text-xs font-body text-white/70 line-clamp-2">
                  {item.description}
                </p>

                {item.type === 'youtube' && (
                  <div className="pt-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-lg w-full rounded-2xl border border-white/20 bg-navy-950 p-6 space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-cyan-neon" />
                  CONTRIBUTE FEST MEMORY
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="text-white/40 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'photo', label: 'Photo', icon: Camera },
                  { id: 'video', label: 'Video Clip', icon: Video },
                  { id: 'youtube', label: 'YouTube URL', icon: Youtube },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMediaType(t.id)}
                      className={`p-2.5 rounded-xl border text-xs font-display font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        mediaType === t.id
                          ? 'border-cyan-neon bg-cyan-neon/15 text-cyan-neon'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-white/70 block mb-1">Moment Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Round 3 Tie-Breaker Battle"
                    className="w-full p-2.5 rounded-xl bg-navy-900 border border-white/15 text-white"
                  />
                </div>

                {mediaType === 'youtube' ? (
                  <div>
                    <label className="text-white/70 block mb-1">YouTube Video Link</label>
                    <input
                      type="url"
                      required
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full p-2.5 rounded-xl bg-navy-900 border border-white/15 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-white/70 block mb-1">
                      Choose {mediaType === 'photo' ? 'Image File' : 'Video File'} (Cloudinary Storage)
                    </label>
                    <input
                      type="file"
                      accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
                      required
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full p-2 rounded-xl bg-navy-900 border border-white/15 text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-neon file:text-black file:font-bold text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/70 block mb-1">Event Category Tag</label>
                    <input
                      type="text"
                      value={eventTag}
                      onChange={(e) => setEventTag(e.target.value)}
                      placeholder="e.g. Auditorium Finale"
                      className="w-full p-2.5 rounded-xl bg-navy-900 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 block mb-1">Uploaded By (Name / Squad)</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Cipher Team"
                      className="w-full p-2.5 rounded-xl bg-navy-900 border border-white/15 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/70 block mb-1">Memory Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of this moment..."
                    className="w-full p-2.5 rounded-xl bg-navy-900 border border-white/15 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-mono"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <span>UPLOADING TO CLOUD...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>PUBLISH MOMENT</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
