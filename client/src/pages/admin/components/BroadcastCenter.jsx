import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../services/api';

export default function BroadcastCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) return;

    setSending(true);
    try {
      await adminAPI.broadcast(title, message, 'announcement');
      setStatus({ success: true, text: 'BROADCAST TRANSMITTED SUCCESSFULLY' });
      setTitle('');
      setMessage('');
    } catch (error) {
      setStatus({ success: false, text: 'TRANSMISSION FAILURE DETECTED' });
    } finally {
      setSending(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/5 rounded-[3rem] p-12 backdrop-blur-3xl relative overflow-hidden shadow-2xl"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -ml-20 -mb-20" />
        
        <div className="relative z-10 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
             <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
             <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Priority Comms</span>
          </div>
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-3">System-Wide Broadcast</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">Disseminate priority directives to all active workspace inhabitants via secure channel.</p>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Announcement Header</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ECOSYSTEM MAINTENANCE PROTOCOL"
              className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/30 transition-all duration-500 focus:bg-black/40 text-sm font-bold tracking-tight"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Directive Content</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter operational details..."
              rows={5}
              className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/30 transition-all duration-500 focus:bg-black/40 text-sm font-medium leading-relaxed resize-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={sending}
              className={`
                group relative w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 overflow-hidden
                ${sending 
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5' 
                  : 'bg-white text-black hover:bg-purple-500 hover:text-white shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 active:scale-[0.98]'
                }
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    TRANSMITTING...
                  </>
                ) : (
                  <>
                    INITIATE BROADCAST
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`text-center text-[10px] font-black tracking-[0.3em] uppercase py-4 rounded-xl border ${
                  status.success 
                    ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                    : 'text-rose-400 bg-rose-500/5 border-rose-500/20'
                }`}
              >
                {status.text}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
