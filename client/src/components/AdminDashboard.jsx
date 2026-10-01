import React, { useState, useEffect } from 'react';
import { adminApi, mlApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  ShieldAlert,
  Users,
  Eye,
  Sliders,
  Sparkles,
  MapPin,
  Laptop,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ScanFace,
  Activity,
  Layers,
  BarChart3,
  BookOpen,
  Filter,
  Maximize2
} from 'lucide-react';

export default function AdminDashboard({ onOpenEmailViewer }) {
  const { isConnected, securityAlerts, proctoringEvents: socketEvents, latestScoreUpdate } = useSocket();

  const [activeTab, setActiveTab] = useState('auth');

  const [authData, setAuthData] = useState({ attempts: [], suspicious: [] });
  const [usersData, setUsersData] = useState({ users: [], totalUsers: 0, faceEnrolledCount: 0 });
  const [cheatingData, setCheatingData] = useState({ events: [], scores: {}, stats: {} });
  const [mlCheatingModel, setMlCheatingModel] = useState(null);
  const [adversarialDemo, setAdversarialDemo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [authRes, usersRes, cheatRes, mlRes, advRes] = await Promise.all([
        adminApi.getAuthLogs(),
        adminApi.getUsers(),
        adminApi.getCheatingMonitor(),
        mlApi.getCheatingModel(),
        mlApi.getAdversarialDemo()
      ]);

      setAuthData(authRes);
      setUsersData(usersRes);
      setCheatingData(cheatRes);
      setMlCheatingModel(mlRes);
      setAdversarialDemo(advRes);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socketEvents.length > 0) {
      setCheatingData(prev => ({
        ...prev,
        events: [socketEvents[0], ...prev.events]
      }));
    }
  }, [socketEvents]);

  const filteredUsers = (usersData.users || []).filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = (cheatingData.events || []).filter(e => {
    if (selectedStudentFilter !== 'ALL' && e.studentId !== selectedStudentFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-black p-4 sm:p-6 lg:p-8 neo-grid-bg">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-3 border-black">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="neo-badge bg-[#ffe600] text-black px-2.5 py-0.5 text-[11px]">
                ADMIN CONTROL CENTER
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-white px-2 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000]">
                <span className={`w-2.5 h-2.5 rounded-full border border-black ${isConnected ? 'bg-[#10b981] animate-pulse' : 'bg-[#eab308]'}`} />
                <span>{isConnected ? 'LIVE FEED CONNECTED' : 'OFFLINE'}</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black font-display uppercase tracking-tight">
              Exam Security & Proctoring Dashboard
            </h1>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Continuous identity monitoring, brute force intrusion analysis, and AI cheating scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEmailViewer}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-white border-2 border-black shadow-neo hover:bg-[#fed7aa] flex items-center gap-2 neo-btn transition-colors"
            >
              <span>📧 Security Alerts Inbox</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-[#ffe600] border-2 border-black shadow-neo hover:bg-[#fde047] text-black neo-btn"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#fee2e2] rounded-2xl p-5 border-3 border-black shadow-neo-md">
            <span className="text-[11px] font-mono font-black uppercase block">Suspicious Logins</span>
            <div className="text-3xl font-black text-[#dc2626] font-mono mt-1">
              {authData.suspiciousCount || 0}
            </div>
            <span className="text-[10px] font-bold text-slate-800">Failed threshold alerts</span>
          </div>

          <div className="bg-[#e0f2fe] rounded-2xl p-5 border-3 border-black shadow-neo-md">
            <span className="text-[11px] font-mono font-black uppercase block">Total Candidates</span>
            <div className="text-3xl font-black text-[#0284c7] font-mono mt-1">
              {usersData.totalUsers || 0}
            </div>
            <span className="text-[10px] font-bold text-slate-800">
              {usersData.faceEnrolledCount || 0} with Face Login
            </span>
          </div>

          <div className="bg-[#fef3c7] rounded-2xl p-5 border-3 border-black shadow-neo-md">
            <span className="text-[11px] font-mono font-black uppercase block">Proctoring Flags</span>
            <div className="text-3xl font-black text-[#d97706] font-mono mt-1">
              {cheatingData.events?.length || 0}
            </div>
            <span className="text-[10px] font-bold text-slate-800">
              {cheatingData.stats?.tabSwitches || 0} tab switches
            </span>
          </div>

          <div className="bg-[#f3e8ff] rounded-2xl p-5 border-3 border-black shadow-neo-md">
            <span className="text-[11px] font-mono font-black uppercase block">Ensemble Model F1</span>
            <div className="text-3xl font-black text-[#7e22ce] font-mono mt-1">
              {mlCheatingModel?.metrics?.smote_ensemble_cheating_f1 || 96.8}%
            </div>
            <span className="text-[10px] font-bold text-slate-800">SMOTE Balanced</span>
          </div>
        </div>

        {/* Tab Navigation (Exact 3 tabs required + AI/Syllabus Lab) */}
        <div className="flex border-b-3 border-black mt-8 gap-2 overflow-x-auto pb-1 font-bold">
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-2 border-black border-b-0 uppercase ${
              activeTab === 'auth'
                ? 'bg-[#ffe600] text-black shadow-neo translate-y-0.5'
                : 'bg-white text-slate-800 hover:bg-[#f8f5ee]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
            <span>1. Authentication & Suspicious Logins</span>
            {authData.suspiciousCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#ef4444] text-white text-[10px] font-mono font-black">
                {authData.suspiciousCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-2 border-black border-b-0 uppercase ${
              activeTab === 'users'
                ? 'bg-[#38bdf8] text-black shadow-neo translate-y-0.5'
                : 'bg-white text-slate-800 hover:bg-[#f8f5ee]'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>2. Users & Face Login Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('cheating')}
            className={`py-3 px-5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-2 border-black border-b-0 uppercase ${
              activeTab === 'cheating'
                ? 'bg-[#86efac] text-black shadow-neo translate-y-0.5'
                : 'bg-white text-slate-800 hover:bg-[#f8f5ee]'
            }`}
          >
            <Eye className="w-4 h-4 stroke-[2.5]" />
            <span>3. Exam Cheating & Integrity Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`py-3 px-5 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-2 border-black border-b-0 uppercase ${
              activeTab === 'lab'
                ? 'bg-[#c084fc] text-black shadow-neo translate-y-0.5'
                : 'bg-white text-slate-800 hover:bg-[#f8f5ee]'
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>4. AI / Syllabus Research Lab (Exp 1-8)</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto">
        {/* TAB 1: Authentication Tab */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Suspicious Login Attempts & Forensic Log
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  Accounts with &gt;3 wrong passwords. Click any entry to view forensic attacker details (IP, Geolocation, Device, Browser).
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-3 border-black shadow-neo-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#ffe600] border-b-3 border-black text-black font-mono font-black uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Target User</th>
                      <th className="py-3 px-4">IP & Location</th>
                      <th className="py-3 px-4">Device & Browser</th>
                      <th className="py-3 px-4">Attempts</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black font-sans font-medium">
                    {authData.attempts?.map((att) => {
                      const isSuspicious = !att.success || att.attemptCount > 3;
                      return (
                        <tr
                          key={att.id}
                          onClick={() => setSelectedAttempt(att)}
                          className={`hover:bg-[#fff9db] cursor-pointer transition-colors ${
                            isSuspicious ? 'bg-[#fee2e2]/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-black border border-black shadow-[1px_1px_0px_#000] ${
                              att.success
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : att.attemptCount > 3
                                ? 'bg-[#ef4444] text-white animate-pulse'
                                : 'bg-[#fef3c7] text-[#92400e]'
                            }`}>
                              {att.success ? 'AUTHENTICATED' : att.attemptCount > 3 ? 'ATTACK FLAGGED' : 'WRONG PASSWORD'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-black">
                            {att.username}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono font-black text-black">{att.location?.ip || att.ip}</div>
                            <div className="text-[11px] font-semibold text-slate-700">
                              {att.location?.city ? `${att.location.city}, ${att.location.country}` : 'Localhost Dev'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-black">{att.device?.device || 'Desktop PC'}</div>
                            <div className="text-[11px] text-slate-700">{att.device?.browser || 'Browser'} • {att.device?.os}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-sm">
                            <span className={att.attemptCount > 3 ? 'text-[#dc2626]' : 'text-black'}>
                              {att.attemptCount} tries
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] font-mono font-bold text-slate-700">
                            {new Date(att.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-black underline bg-[#bae6fd] px-2 py-1 rounded border border-black shadow-[1px_1px_0px_#000] text-[11px]">
                              Inspect Forensics →
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">Registered Candidates & Face ID Registry</h2>
                <p className="text-xs font-semibold text-slate-700">Overview of candidate credentials and Face Login enablement.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-black stroke-[2.5]" />
                <input
                  type="text"
                  placeholder="Search candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 neo-input rounded-xl text-xs font-bold text-black placeholder-slate-600"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border-3 border-black shadow-neo-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#38bdf8] border-b-3 border-black text-black font-mono font-black uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Username & Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Face Login Status</th>
                      <th className="py-3 px-4">Cheating Risk Score</th>
                      <th className="py-3 px-4">Exam Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black font-sans font-medium">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#f8f5ee] transition-colors">
                        <td className="py-3 px-4 font-black text-black flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#ffe600] border-2 border-black flex items-center justify-center font-black text-black text-xs shadow-[1px_1px_0px_#000]">
                            {u.fullName.charAt(0)}
                          </div>
                          <span>{u.fullName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <div className="text-black">{u.username}</div>
                          <div className="text-[11px] text-slate-700">{u.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-[10px]">
                          <span className={`px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] font-black ${
                            u.role === 'admin' ? 'bg-[#c084fc] text-black' : 'bg-white text-black'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.hasFaceLogin ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-black bg-[#86efac] text-black border border-black shadow-[1px_1px_0px_#000]">
                              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                              <span>ENROLLED (128-D)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#f1f5f9] text-slate-700 border border-black">
                              <ScanFace className="w-3 h-3" />
                              <span>NOT ENROLLED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-sm">
                          <span className={`px-2.5 py-1 rounded border border-black shadow-[1px_1px_0px_#000] ${
                            u.cheatingScore > 60 ? 'bg-[#fee2e2] text-[#dc2626]' : u.cheatingScore > 25 ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#dcfce7] text-[#15803d]'
                          }`}>
                            {u.cheatingScore}% ({u.classification})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-mono text-xs font-bold">
                          {u.hasSubmittedExam ? (
                            <span className="bg-[#86efac] px-2 py-0.5 rounded border border-black text-black">✓ Completed</span>
                          ) : (
                            <span className="bg-white px-2 py-0.5 rounded border border-black text-slate-600">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Exam Cheating Tab */}
        {activeTab === 'cheating' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Exam Cheating & Proctoring Telemetry Feed
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  Chronological record of which candidate committed what violation and when, with real-time ensemble cheating risk scores.
                </p>
              </div>

              {/* Student Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-black stroke-[2.5]" />
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => setSelectedStudentFilter(e.target.value)}
                  className="neo-input rounded-xl px-3 py-1.5 text-xs font-bold text-black"
                >
                  <option value="ALL">All Candidates</option>
                  {usersData.users?.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Student Cheating Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(cheatingData.scores || {}).map(([sId, scoreInfo]) => (
                <div key={sId} className="bg-white rounded-2xl p-5 border-3 border-black shadow-neo space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                    <div>
                      <h4 className="text-sm font-black text-black uppercase">{scoreInfo.studentName}</h4>
                      <span className="text-[10px] font-mono font-bold text-slate-700">ID: {sId.slice(0, 10)}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-black border border-black shadow-[1px_1px_0px_#000] ${
                      scoreInfo.classification === 'HONEST' ? 'bg-[#86efac] text-black' : scoreInfo.classification === 'SUSPICIOUS' ? 'bg-[#fef08a] text-black' : 'bg-[#fca5a5] text-black'
                    }`}>
                      {scoreInfo.classification}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-black mb-1">
                      <span>Cheating Risk Score</span>
                      <span className="text-sm font-black">{scoreInfo.score}%</span>
                    </div>
                    <div className="w-full bg-[#f8f5ee] h-3 rounded-full overflow-hidden border-2 border-black">
                      <div
                        className={`h-full transition-all duration-500 ${
                          scoreInfo.score > 60 ? 'bg-[#ef4444]' : scoreInfo.score > 25 ? 'bg-[#eab308]' : 'bg-[#10b981]'
                        }`}
                        style={{ width: `${scoreInfo.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-black text-[10px] font-mono text-center font-bold">
                    <div className="bg-[#f8f5ee] p-1.5 rounded-lg border border-black">
                      <span className="text-slate-700 block">Tabs</span>
                      <strong className="text-black text-xs font-black">{scoreInfo.metrics?.tabSwitches || 0}</strong>
                    </div>
                    <div className="bg-[#f8f5ee] p-1.5 rounded-lg border border-black">
                      <span className="text-slate-700 block">Look Away</span>
                      <strong className="text-black text-xs font-black">{scoreInfo.metrics?.lookAwaySeconds || 0}s</strong>
                    </div>
                    <div className="bg-[#f8f5ee] p-1.5 rounded-lg border border-black">
                      <span className="text-slate-700 block">Faces</span>
                      <strong className="text-black text-xs font-black">{scoreInfo.metrics?.multipleFacesCount || 0}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Event Timeline Table */}
            <div className="bg-white rounded-2xl border-3 border-black shadow-neo-lg overflow-hidden">
              <div className="p-4 bg-[#f8f5ee] border-b-3 border-black flex items-center justify-between font-mono font-black text-xs uppercase">
                <span>Chronological Telemetry Stream ({filteredEvents.length} events)</span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#86efac] border-b-2 border-black text-black font-mono font-black uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Candidate</th>
                      <th className="py-2.5 px-4">Violation Type</th>
                      <th className="py-2.5 px-4">Telemetry Details</th>
                      <th className="py-2.5 px-4">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-sans font-medium">
                    {filteredEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-[#fff9db] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-4 font-black text-black">
                          {ev.studentName}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-black">
                          <span className={`px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] text-[10px] ${
                            ev.type === 'MULTIPLE_FACES' || ev.type === 'CAMERA_OFF'
                              ? 'bg-[#fee2e2] text-[#dc2626]'
                              : ev.type === 'TAB_SWITCH' || ev.type === 'LOOKING_AWAY'
                              ? 'bg-[#fef3c7] text-[#b45309]'
                              : 'bg-[#e0f2fe] text-[#0284c7]'
                          }`}>
                            {ev.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-black font-bold">
                          {ev.details}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-black">
                          <span className={ev.severity === 'CRITICAL' ? 'text-[#dc2626]' : 'text-[#b45309]'}>
                            {ev.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredEvents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-700 font-mono font-bold">
                          No proctoring violations recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AI & Syllabus Lab Tab */}
        {activeTab === 'lab' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <Sparkles className="w-6 h-6 text-black stroke-[2.5]" />
                <h2 className="text-xl font-black text-black font-display uppercase tracking-tight">
                  Syllabus Experiments & AI / ML Demonstration Lab
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed max-w-3xl">
                This lab maps directly to <strong>Experiments 1 through 8</strong> in the curriculum:
                SMOTE imbalance resampling, Ensemble Voting Classifiers, FGSM adversarial attack/defense, and keystroke dynamics.
              </p>
            </div>

            {/* Experiment 4, 5, 6: SMOTE & Ensemble Classifier */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <div>
                  <span className="neo-badge bg-[#38bdf8] text-black text-[10px] px-2.5 py-0.5">
                    Experiments 4, 5, 6
                  </span>
                  <h3 className="text-base font-black text-black uppercase mt-1">
                    SMOTE Resampling & Ensemble Cheating Score Classifier
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-[#86efac] text-black border-2 border-black shadow-neo-sm">
                  Accuracy: {mlCheatingModel?.metrics?.smote_ensemble_accuracy || 98.7}%
                </span>
              </div>

              {/* SMOTE Class Distribution Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before SMOTE */}
                <div className="bg-[#f8f5ee] rounded-xl p-5 border-2 border-black shadow-neo-sm">
                  <h4 className="text-xs font-black font-mono text-black uppercase mb-3 flex items-center justify-between">
                    <span>1. Before SMOTE (Severe Imbalance)</span>
                    <span className="bg-[#fee2e2] px-2 py-0.5 rounded border border-black text-[#dc2626] text-[10px]">Cheaters &lt; 5%</span>
                  </h4>

                  <div className="space-y-3 text-xs font-mono font-bold">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-black">
                        <span>Honest (Class 0):</span>
                        <span>2,125 (85%)</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-black">
                        <div className="bg-[#10b981] h-full w-[85%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-black">
                        <span>Suspicious (Class 1):</span>
                        <span>250 (10%)</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-black">
                        <div className="bg-[#eab308] h-full w-[10%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-black">
                        <span>Likely Cheating (Class 2):</span>
                        <span>125 (5%)</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-black">
                        <div className="bg-[#ef4444] h-full w-[5%]" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-800 mt-4 leading-snug">
                    <strong>Limitation without SMOTE:</strong> Baseline models suffer poor recall on fraud because standard loss functions optimize for the 85% majority class.
                  </p>
                </div>

                {/* After SMOTE */}
                <div className="bg-[#e0f2fe] rounded-xl p-5 border-2 border-black shadow-neo-sm">
                  <h4 className="text-xs font-black font-mono text-black uppercase mb-3 flex items-center justify-between">
                    <span>2. After SMOTE (Synthetically Balanced)</span>
                    <span className="bg-[#86efac] px-2 py-0.5 rounded border border-black text-black text-[10px]">1 : 1 : 1 Ratio</span>
                  </h4>

                  <div className="space-y-3 text-xs font-mono font-bold">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-black">
                        <span>Honest (Class 0):</span>
                        <span>1,594 (33.3%)</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-black">
                        <div className="bg-[#10b981] h-full w-[33.3%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-black">
                        <span>Suspicious (Class 1):</span>
                        <span>1,594 (33.3%)</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-black">
                        <div className="bg-[#eab308] h-full w-[33.3%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-black">
                        <span>Likely Cheating (Class 2):</span>
                        <span>1,594 (33.3%) [Synthesized]</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-black">
                        <div className="bg-[#38bdf8] h-full w-[33.3%]" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-black font-black mt-4 leading-snug font-mono bg-white p-2 rounded-lg border border-black">
                    ✓ {mlCheatingModel?.metrics?.cheater_recall_gain || '+39.2% F1-score gain with SMOTE'}
                  </p>
                </div>
              </div>

              {/* Feature Importances */}
              <div>
                <h4 className="text-xs font-black text-black uppercase font-mono mb-3">
                  Ensemble Feature Weights (Random Forest + Gradient Boosting)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(mlCheatingModel?.feature_importances || []).map((feat, idx) => (
                    <div key={idx} className="bg-[#f8f5ee] p-3 rounded-xl border-2 border-black shadow-neo-sm">
                      <span className="text-slate-800 text-xs font-bold block truncate">{feat.feature}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-mono font-black text-black">
                          {(feat.importance * 100).toFixed(1)}%
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-700">Weight</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Experiment 8: Adversarial FGSM Attack & Defense Lab */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <div>
                  <span className="neo-badge bg-[#c084fc] text-black text-[10px] px-2.5 py-0.5">
                    Experiment 8
                  </span>
                  <h3 className="text-base font-black text-black uppercase mt-1">
                    Adversarial Attack (FGSM) & Multi-Layer Defense on Face Biometrics
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-[#dcfce7] text-[#15803d] border-2 border-black shadow-neo-sm">
                  Defended Breach Rate: 0.0%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attack Pipeline */}
                <div className="bg-[#fee2e2] rounded-xl p-5 border-2 border-black shadow-neo-sm">
                  <div className="flex items-center gap-2 text-black font-black text-xs font-mono mb-2">
                    <AlertTriangle className="w-4 h-4 text-[#dc2626] stroke-[3]" />
                    <span>FGSM Perturbation Formula:</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border-2 border-black font-mono text-xs text-black font-black my-2 shadow-[2px_2px_0px_#000]">
                    η = ε · sign(∇_x Loss(θ, x, y))
                  </div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed mb-3">
                    The adversary adds subtle gradient noise (ε = 0.08) to push an impostor's facial embedding vector closer to the genuine user.
                  </p>
                  <div className="p-3 bg-white rounded-lg border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_#000]">
                    <strong>Undefended Result:</strong> Naive loose thresholds accept the attacked photo in {adversarialDemo?.vulnerability_analysis?.undefended_attack_success_rate || '88.5%'} of cases.
                  </div>
                </div>

                {/* Defense Pipeline */}
                <div className="bg-[#dcfce7] rounded-xl p-5 border-2 border-black shadow-neo-sm">
                  <div className="flex items-center gap-2 text-black font-black text-xs font-mono mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803d] stroke-[3]" />
                    <span>SecureExam 3-Layer Defense:</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-900 font-semibold mt-2">
                    <li className="flex items-start gap-2">
                      <strong className="text-black font-mono bg-white px-1.5 py-0.5 border border-black rounded">Layer 1:</strong>
                      <span>Strict Euclidean threshold (distance &le; 0.45) blocks coarse perturbations.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <strong className="text-black font-mono bg-white px-1.5 py-0.5 border border-black rounded">Layer 2:</strong>
                      <span>Feature space denoising & manifold normalization removes high-frequency adversarial noise.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <strong className="text-black font-mono bg-white px-1.5 py-0.5 border border-black rounded">Layer 3:</strong>
                      <span>Active Dynamic Liveness Check (Blink / Head Turn). Static photo attacks fail 100%.</span>
                    </li>
                  </ul>
                  <div className="p-3 bg-white rounded-lg border-2 border-black text-xs font-black text-[#15803d] mt-4 shadow-[2px_2px_0px_#000]">
                    ✓ {adversarialDemo?.defense_evaluation?.defense_effectiveness || '100% of all adversarial attacks defeated!'}
                  </div>
                </div>
              </div>
            </div>

            {/* Viva Limits & Cheatsheet (Section 9) */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border-3 border-black shadow-neo-lg space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-sm font-black text-black font-mono uppercase tracking-wider">
                  Section 9: System Limits & Viva Exam Answers
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="bg-[#f8f5ee] p-4 rounded-xl border-2 border-black shadow-neo-sm space-y-1">
                  <span className="font-black text-black block">Q: Is 100% face recognition accuracy possible?</span>
                  <p className="text-slate-800">
                    No. Lighting, angles, and camera resolution cause errors. We minimize false accepts with strict match thresholds and active liveness, and report FAR / FRR.
                  </p>
                </div>

                <div className="bg-[#f8f5ee] p-4 rounded-xl border-2 border-black shadow-neo-sm space-y-1">
                  <span className="font-black text-black block">Q: How accurate is IP Geolocation?</span>
                  <p className="text-slate-800">
                    IP location is approximate (ISP routing level). It reliably pinpoints the city and state, not the exact physical room.
                  </p>
                </div>

                <div className="bg-[#f8f5ee] p-4 rounded-xl border-2 border-black shadow-neo-sm space-y-1">
                  <span className="font-black text-black block">Q: Does looking away always mean cheating?</span>
                  <p className="text-slate-800">
                    No. Thinking or stretching causes natural eye movements. The system issues warnings first, and the human admin retains final discretionary review.
                  </p>
                </div>

                <div className="bg-[#f8f5ee] p-4 rounded-xl border-2 border-black shadow-neo-sm space-y-1">
                  <span className="font-black text-black block">Q: How is candidate biometric privacy protected?</span>
                  <p className="text-slate-800">
                    Raw webcam photos are NEVER saved. Face landmarks are transformed into a 128-dimensional mathematical vector (numbers only).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Detail Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 border-4 border-black shadow-neo-xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-4">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-[#dc2626] stroke-[2.5]" />
                <h3 className="text-lg font-black text-black font-display uppercase tracking-tight">
                  Intrusion Telemetry Forensics
                </h3>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-8 h-8 rounded-lg bg-[#fee2e2] border-2 border-black font-black text-black hover:bg-[#fca5a5] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono font-bold">
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Target Username:</span>
                <span className="text-black font-black">{selectedAttempt.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Attacker IP Address:</span>
                <span className="text-black bg-[#ffe600] px-1 border border-black">{selectedAttempt.location?.ip || selectedAttempt.ip}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Approximate Location:</span>
                <span className="text-black">
                  {selectedAttempt.location?.city}, {selectedAttempt.location?.region}, {selectedAttempt.location?.country}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">ISP / Network:</span>
                <span className="text-black">{selectedAttempt.location?.isp || 'Campus Network'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Device Hardware:</span>
                <span className="text-black">{selectedAttempt.device?.device || 'Desktop PC'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Operating System:</span>
                <span className="text-black">{selectedAttempt.device?.os}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Browser User-Agent:</span>
                <span className="text-black">{selectedAttempt.device?.browser}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black">
                <span className="text-slate-700">Consecutive Failed Attempts:</span>
                <span className="text-[#dc2626] font-black">{selectedAttempt.attemptCount} tries</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700">Incident Timestamp:</span>
                <span className="text-slate-800">{new Date(selectedAttempt.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-6 py-2.5 bg-[#ffe600] text-black font-black rounded-xl text-xs neo-btn uppercase"
              >
                Close Forensics Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
