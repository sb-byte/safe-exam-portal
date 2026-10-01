import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Mail, ShieldAlert, ExternalLink, RefreshCw, Clock, MapPin, Laptop } from 'lucide-react';

export default function EmailInboxModal({ isOpen, onClose }) {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSecurityEmails();
      setEmails(res.emails || []);
      if (res.emails && res.emails.length > 0 && !selectedEmail) {
        setSelectedEmail(res.emails[0]);
      }
    } catch (e) {
      console.warn('Failed to load security emails:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl cyber-card rounded-2xl p-6 border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Dispatched Security Alerts Inbox (Nodemailer Telemetry)
              </h3>
              <p className="text-xs text-slate-400">
                Alerts automatically generated when wrong password threshold (&gt;3) is breached.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="Refresh Emails"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Split: Left List, Right Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 overflow-hidden">
          {/* Email List */}
          <div className="border border-slate-800 rounded-xl overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/60">
            {emails.map((eml) => {
              const isSelected = selectedEmail?.id === eml.id;
              return (
                <button
                  key={eml.id}
                  onClick={() => setSelectedEmail(eml)}
                  className={`w-full p-3 text-left transition-colors flex flex-col gap-1 ${
                    isSelected ? 'bg-cyan-500/15 border-l-4 border-cyan-400' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {eml.to}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(eml.sentAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-red-400 font-semibold line-clamp-1">
                    {eml.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {eml.attemptCount} Failed Attempts
                  </span>
                </button>
              );
            })}
            {emails.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No security alert emails dispatched yet. Trigger a 4-wrong password attack to generate one!
              </div>
            )}
          </div>

          {/* Email HTML Preview */}
          <div className="md:col-span-2 border border-slate-800 rounded-xl overflow-y-auto bg-slate-900/90 p-4">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedEmail.subject}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      To: <span className="text-cyan-300">{selectedEmail.to}</span> • Sent: {new Date(selectedEmail.sentAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedEmail.previewUrl && (
                    <a
                      href={selectedEmail.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Ethereal Web</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Rendered Email HTML Content */}
                <div
                  className="rounded-xl overflow-hidden bg-slate-950 p-2 border border-slate-800"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Select an email from the list to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
