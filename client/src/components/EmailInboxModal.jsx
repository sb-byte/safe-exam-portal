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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl p-6 border-4 border-black shadow-neo-xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-3 border-black">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ffe600] border-2 border-black shadow-neo-sm text-black">
              <Mail className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-black font-display uppercase tracking-tight">
                Dispatched Security Alerts (Nodemailer Telemetry)
              </h3>
              <p className="text-xs font-semibold text-slate-700">
                Alerts automatically generated when wrong password threshold (&gt;3) is breached.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="p-2 rounded-xl bg-[#f8f5ee] border-2 border-black text-black hover:bg-[#ffe600] neo-btn"
              title="Refresh Emails"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#fee2e2] border-2 border-black font-black text-black hover:bg-[#fca5a5] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Split: Left List, Right Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 overflow-hidden">
          {/* Email List */}
          <div className="border-2 border-black rounded-xl overflow-y-auto divide-y-2 divide-black bg-[#f8f5ee]">
            {emails.map((eml) => {
              const isSelected = selectedEmail?.id === eml.id;
              return (
                <button
                  key={eml.id}
                  onClick={() => setSelectedEmail(eml)}
                  className={`w-full p-3.5 text-left transition-colors flex flex-col gap-1 ${
                    isSelected ? 'bg-[#ffe600] text-black font-bold' : 'bg-white hover:bg-[#fff9db] text-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black truncate max-w-[130px]">
                      {eml.to}
                    </span>
                    <span className="text-[10px] text-slate-700 font-mono font-bold">
                      {new Date(eml.sentAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#dc2626] font-black line-clamp-1">
                    {eml.subject}
                  </span>
                  <span className="text-[10px] text-slate-800 font-mono font-bold">
                    {eml.attemptCount} Failed Attempts
                  </span>
                </button>
              );
            })}
            {emails.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-600 font-mono font-bold">
                No security emails yet. Trigger 4 wrong passwords to test!
              </div>
            )}
          </div>

          {/* Email HTML Preview */}
          <div className="md:col-span-2 border-2 border-black rounded-xl overflow-y-auto bg-white p-4 shadow-neo-sm">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                  <div>
                    <h4 className="text-sm font-black text-black">{selectedEmail.subject}</h4>
                    <p className="text-xs text-slate-700 font-mono font-bold mt-0.5">
                      To: <span className="bg-[#ffe600] px-1 border border-black rounded">{selectedEmail.to}</span> • Sent: {new Date(selectedEmail.sentAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedEmail.previewUrl && (
                    <a
                      href={selectedEmail.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#38bdf8] text-black border-2 border-black rounded-lg text-xs font-black flex items-center gap-1.5 neo-btn"
                    >
                      <span>Open Ethereal Web</span>
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    </a>
                  )}
                </div>

                {/* Rendered Email HTML Content */}
                <div
                  className="rounded-xl overflow-hidden bg-[#0f172a] p-3 border-2 border-black shadow-neo-sm text-white"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono font-bold">
                Select an email from the list to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
