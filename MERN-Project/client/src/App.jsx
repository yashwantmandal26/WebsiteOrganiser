import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Moon, Sun, Settings, LogOut, 
  X, Trash2, Edit3, ExternalLink, Shield, Lock
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');

  // Modals
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);

  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [newKeywordName, setNewKeywordName] = useState('');
  const [newKeywordUrl, setNewKeywordUrl] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    fetchGroups();
    if (token) setIsAdmin(true);
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups`);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { password: loginPassword });
      setToken(res.data.token);
      localStorage.setItem('adminToken', res.data.token);
      setIsAdmin(true);
      setShowLogin(false);
      setLoginPassword('');
    } catch (err) {
      alert('Invalid Password');
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
  };

  const addGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/groups`, { name: newGroupName });
      setNewGroupName('');
      setShowAddGroup(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const addKeyword = async (e) => {
    e.preventDefault();
    try {
      const icon = newKeywordUrl ? `https://www.google.com/s2/favicons?sz=64&domain=${new URL(newKeywordUrl).hostname}` : null;
      await axios.post(`${API_URL}/groups/${activeGroupId}/keywords`, { 
        name: newKeywordName, 
        url: newKeywordUrl || `https://www.google.com/search?q=${encodeURIComponent(newKeywordName)}`,
        icon 
      });
      setNewKeywordName('');
      setNewKeywordUrl('');
      setShowAddKeyword(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGroup = async (id) => {
    if (!isAdmin) return setShowLogin(true);
    if (!window.confirm('Delete this group?')) return;
    try {
      await axios.delete(`${API_URL}/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteKeyword = async (groupId, keywordId) => {
    if (!isAdmin) return setShowLogin(true);
    try {
      await axios.delete(`${API_URL}/groups/${groupId}/keywords/${keywordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGroups = groups.map(group => ({
    ...group,
    keywords: group.keywords.filter(kw => 
      kw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.keywords.length > 0 || group.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-slate-50 text-slate-900'} font-['Inter'] transition-colors duration-300`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} border-b px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white text-xl font-bold">W</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">WebsiteOrganiser</h1>
        </div>

        <div className="flex-1 max-w-xl mx-4 sm:mx-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search keywords..."
            className={`w-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'} border rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {isAdmin ? (
            <button onClick={handleLogout} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}>
              <Shield className="w-5 h-5" />
            </button>
          )}

          <button onClick={() => setShowAddGroup(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Group</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 px-4 sm:px-8 pb-12 max-w-[1600px] mx-auto">
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 text-slate-500">
            <div className={`w-20 h-20 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-full flex items-center justify-center mb-6`}>
              <Search className="w-8 h-8" />
            </div>
            <p className="text-xl font-medium">No results found for your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGroups.map(group => (
              <div key={group._id} className={`${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} border rounded-2xl p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-lg shadow-indigo-500/20" style={{ backgroundColor: group.color }}></div>
                    <h3 className="text-lg font-bold truncate max-w-[150px]">{group.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setActiveGroupId(group._id); setShowAddKeyword(true); }}
                      className="p-1.5 hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteGroup(group._id)}
                      className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {group.keywords.map((kw) => (
                    <div key={kw._id} className="relative group/item">
                      <a 
                        href={kw.url} 
                        className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-slate-900/50 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'} rounded-xl transition-all border border-transparent hover:border-indigo-500/30`}
                      >
                        {kw.icon ? (
                          <img src={kw.icon} className="w-6 h-6 rounded-md object-contain" alt="" />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-md flex items-center justify-center text-[10px] font-bold text-white">
                            {kw.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="flex-1 truncate font-medium text-sm">{kw.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-40 transition-opacity" />
                      </a>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.preventDefault(); deleteKeyword(group._id, kw._id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-all scale-75 hover:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals Container */}
      {(showAddGroup || showAddKeyword || showLogin) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
          
          {/* Add Group Modal */}
          {showAddGroup && (
            <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Category</h2>
                <button onClick={() => setShowAddGroup(false)} className="p-2 hover:bg-slate-500/10 rounded-xl"><X /></button>
              </div>
              <form onSubmit={addGroup} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 opacity-60">Category Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    required
                    className={`w-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    placeholder="e.g. Work, Social, Dev Tools"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                  Create Category
                </button>
              </form>
            </div>
          )}

          {/* Add Keyword Modal */}
          {showAddKeyword && (
            <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Keyword</h2>
                <button onClick={() => setShowAddKeyword(false)} className="p-2 hover:bg-slate-500/10 rounded-xl"><X /></button>
              </div>
              <form onSubmit={addKeyword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 opacity-60">Keyword / Website Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    required
                    className={`w-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    placeholder="e.g. GitHub, OpenAI"
                    value={newKeywordName}
                    onChange={(e) => setNewKeywordName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 opacity-60">URL (Optional - will use search if empty)</label>
                  <input 
                    type="url" 
                    className={`w-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    placeholder="https://..."
                    value={newKeywordUrl}
                    onChange={(e) => setNewKeywordUrl(e.target.value)}
                  />
                </div>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                  Add to Group
                </button>
              </form>
            </div>
          )}

          {/* Admin Login Modal */}
          {showLogin && (
            <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-indigo-500" />
                  <h2 className="text-2xl font-bold">Admin Access</h2>
                </div>
                <button onClick={() => setShowLogin(false)} className="p-2 hover:bg-slate-500/10 rounded-xl"><X /></button>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <p className="text-sm opacity-60 text-center">Enter the admin password to unlock critical actions like deleting and renaming.</p>
                <div>
                  <input 
                    autoFocus
                    type="password" 
                    required
                    className={`w-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 text-center text-xl tracking-widest transition-all`}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                  Unlock Access
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
