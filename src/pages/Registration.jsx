import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Users, ArrowLeft, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

export default function Registration() {
  const navigate = useNavigate();
  const { mode, registerPlayer, registerTeam } = useGameStore();

  // If no mode selected yet, fallback to individual or let them choose
  const currentMode = mode || 'individual';

  // Individual Form State
  const [individualData, setIndividualData] = useState({
    name: '',
    college: '',
    department: '',
    year: '2nd Year',
  });

  // Team Form State
  const [teamData, setTeamData] = useState({
    teamName: '',
    captainName: '',
    memberCount: 3,
    members: ['', '', ''],
    college: '',
  });

  const [errors, setErrors] = useState({});
  const [registeredCode, setRegisteredCode] = useState(null);

  const handleMemberCountChange = (count) => {
    const num = parseInt(count, 10);
    const newMembers = [...teamData.members];
    if (num > newMembers.length) {
      while (newMembers.length < num) newMembers.push('');
    } else {
      newMembers.length = num;
    }
    setTeamData({ ...teamData, memberCount: num, members: newMembers });
  };

  const handleMemberNameChange = (index, value) => {
    const newMembers = [...teamData.members];
    newMembers[index] = value;
    setTeamData({ ...teamData, members: newMembers });
  };

  const handleIndividualSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!individualData.name.trim()) newErrors.name = 'Player name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerPlayer(individualData);
    // Optional backend sync in background
    syncWithBackend({
      type: 'individual',
      ...individualData,
    });

    setRegisteredCode('IND-' + Math.random().toString(36).substring(2, 7).toUpperCase());
    setTimeout(() => {
      navigate('/ready');
    }, 900);
  };

  const handleTeamSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!teamData.teamName.trim()) newErrors.teamName = 'Team name is required';
    if (!teamData.captainName.trim()) newErrors.captainName = 'Captain name is required';

    const filledMembers = teamData.members.filter((m) => m.trim().length > 0);
    if (filledMembers.length < 1) {
      newErrors.members = 'Please add at least 1 team member name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerTeam({
      teamName: teamData.teamName,
      captainName: teamData.captainName,
      members: teamData.members.filter(Boolean),
    });

    syncWithBackend({
      type: 'team',
      ...teamData,
    });

    setRegisteredCode('TEAM-' + Math.random().toString(36).substring(2, 7).toUpperCase());
    setTimeout(() => {
      navigate('/ready');
    }, 900);
  };

  const syncWithBackend = async (payload) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      await fetch(`${baseUrl}/api/participants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Backend is optional or local; client state always persists
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/mode')}
            className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-cyan-neon mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN TO MODE SELECT
          </button>

          <div className="relative rounded-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            {/* Ambient Card Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-neon/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="p-3 rounded-xl bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon">
                {currentMode === 'individual' ? (
                  <User className="w-6 h-6" />
                ) : (
                  <Users className="w-6 h-6" />
                )}
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-white uppercase">
                  {currentMode === 'individual' ? 'Solo Operative Entry' : 'Squad Squadron Entry'}
                </h1>
                <p className="text-xs font-mono text-cyan-neon/80">
                  {currentMode === 'individual'
                    ? 'REGISTRATION PROTOCOL // INDIVIDUAL MODE'
                    : 'REGISTRATION PROTOCOL // TEAM MODE (2-5 MEMBERS)'}
                </p>
              </div>
            </div>

            {registeredCode ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10 space-y-4"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h2 className="font-display text-2xl font-bold text-white">ACCESS GRANTED</h2>
                <p className="text-sm font-mono text-cyan-neon">
                  YOUR ACCESS CODE: <span className="font-bold text-white text-lg">{registeredCode}</span>
                </p>
                <div className="text-xs text-white/60">Initializing Tech Matrix...</div>
              </motion.div>
            ) : currentMode === 'individual' ? (
              /* INDIVIDUAL FORM */
              <form onSubmit={handleIndividualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-display tracking-widest text-white/70 uppercase mb-2">
                    Player Codename / Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={individualData.name}
                    onChange={(e) => setIndividualData({ ...individualData, name: e.target.value })}
                    placeholder="e.g. Alex Vance / Cipher_01"
                    className="w-full px-4 py-3 rounded-xl bg-navy-950/70 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon transition-all"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-mono">
                      <ShieldAlert className="w-3.5 h-3.5" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-display tracking-widest text-white/70 uppercase mb-2">
                      College / Institute (Optional)
                    </label>
                    <input
                      type="text"
                      value={individualData.college}
                      onChange={(e) => setIndividualData({ ...individualData, college: e.target.value })}
                      placeholder="e.g. IIT Bombay / MIT"
                      className="w-full px-4 py-3 rounded-xl bg-navy-950/70 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-neon transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display tracking-widest text-white/70 uppercase mb-2">
                      Department / Branch
                    </label>
                    <input
                      type="text"
                      value={individualData.department}
                      onChange={(e) => setIndividualData({ ...individualData, department: e.target.value })}
                      placeholder="e.g. Computer Science / IT"
                      className="w-full px-4 py-3 rounded-xl bg-navy-950/70 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-neon transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm tracking-widest uppercase cursor-pointer"
                  >
                    <span>INITIALIZE CHALLENGER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* TEAM FORM */
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-display tracking-widest text-white/70 uppercase mb-2">
                      Team Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamData.teamName}
                      onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })}
                      placeholder="e.g. Binary Beasts"
                      className="w-full px-4 py-3 rounded-xl bg-navy-950/70 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-soft transition-all"
                    />
                    {errors.teamName && (
                      <p className="text-xs text-rose-400 mt-1 font-mono">{errors.teamName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-display tracking-widest text-white/70 uppercase mb-2">
                      Team Captain <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamData.captainName}
                      onChange={(e) => setTeamData({ ...teamData, captainName: e.target.value })}
                      placeholder="Captain Codename"
                      className="w-full px-4 py-3 rounded-xl bg-navy-950/70 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-soft transition-all"
                    />
                    {errors.captainName && (
                      <p className="text-xs text-rose-400 mt-1 font-mono">{errors.captainName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-display tracking-widest text-white/70 uppercase">
                      Squad Size (2 - 5 Members)
                    </label>
                    <span className="text-xs font-mono text-purple-soft">
                      {teamData.memberCount} Participants
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => handleMemberCountChange(num)}
                        className={`py-2 rounded-lg font-display text-xs font-bold border transition-all ${
                          teamData.memberCount === num
                            ? 'bg-purple-electric/30 border-purple-soft text-white shadow-lg shadow-purple-900/40'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {num} Members
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {teamData.members.map((member, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={member}
                        onChange={(e) => handleMemberNameChange(idx, e.target.value)}
                        placeholder={`Member #${idx + 1} Name`}
                        className="w-full px-4 py-2.5 rounded-lg bg-navy-950/70 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-purple-soft transition-all"
                      />
                    ))}
                  </div>
                  {errors.members && (
                    <p className="text-xs text-rose-400 mt-1 font-mono">{errors.members}</p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm tracking-widest uppercase cursor-pointer"
                  >
                    <span>INITIALIZE TEAM MATRIX</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
