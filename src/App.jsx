import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, writeBatch } from "firebase/firestore";

const EMOJI_OPTIONS = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F525}", "\u{1F602}", "\u{1F680}", "\u{1F4AF}", "\u{1F389}", "\u{1F440}"];
const CATEGORIES = ["General", "Resources", "Showcase", "Help", "Off-topic"];

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const catColors = { General: "#7c3aed", Resources: "#3b82f6", Showcase: "#f59e0b", Help: "#ef4444", "Off-topic": "#6b7280" };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return isMobile;
}

function Avatar({ user, size = "md", showStatus = false }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-lg" };
  const colors = { A: "#7c3aed", M: "#e11d48", J: "#d97706", S: "#059669", B: "#3b82f6", C: "#06b6d4", D: "#ec4899" };
  const statusColors = { online: "#34d399", away: "#fbbf24", offline: "#64748b" };
  const bg = colors[user.avatar[0]] || "#64748b";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 48 : 64, height: size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 48 : 64, background: bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, fontSize: size === "sm" ? 11 : size === "md" ? 13 : size === "lg" ? 16 : 18, letterSpacing: "-0.02em" }}>
        {user.avatar}
      </div>
      {showStatus && (
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, background: statusColors[user.status] || "#64748b", borderRadius: "50%", border: "2px solid #0f0d1a" }} />
      )}
    </div>
  );
}

function LoginScreen({ onLogin, onSignUp }) {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) { setError("All fields are required"); return; }
    if (tab === "signup" && !displayName.trim()) { setError("Display name is required"); return; }
    try {
      if (tab === "login") {
        await onLogin(username.trim(), password.trim());
      } else {
        await onSignUp(username.trim(), password.trim(), displayName.trim());
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, color: "white", fontSize: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #0f0b1e 0%, #1a1035 40%, #0d1a2d 100%)" }}>
      <div style={{ width: "100%", maxWidth: 400, margin: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #7c3aed, #3b82f6)", marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>Commune</h1>
          <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>Where developers connect & share</p>
        </div>
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: 24, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", marginBottom: 24, borderRadius: 8, padding: 4, background: "rgba(255,255,255,0.06)" }}>
            {["login", "signup"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{ flex: 1, padding: "8px 0", fontSize: 14, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer", transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg, #7c3aed, #3b82f6)" : "transparent", color: tab === t ? "white" : "#94a3b8" }}>
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          {error && <div style={{ marginBottom: 16, fontSize: 13, color: "#fb7185", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tab === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle} />
            </div>
            <button onClick={handleSubmit}
              style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", color: "white", fontWeight: 600, fontSize: 14, marginTop: 4, cursor: "pointer", background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
              {tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
          {tab === "login" && (
            <p style={{ fontSize: 12, color: "#475569", textAlign: "center", marginTop: 16 }}>Demo: <span style={{ color: "#94a3b8" }}>alex_dev</span> / <span style={{ color: "#94a3b8" }}>pass123</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentUser, view, setView, unreadCount, onLogout }) {
  const navItems = [
    { id: "threads", label: "Threads", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: "chat", label: "Messages", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, badge: unreadCount },
    { id: "profile", label: "Profile", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <div style={{ width: 224, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", height: "100%", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span style={{ fontWeight: 700, color: "white", fontSize: 16, letterSpacing: "-0.02em" }}>Commune</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer", transition: "all 0.15s", background: view === item.id ? "rgba(124,58,237,0.2)" : "transparent", color: view === item.id ? "#c4b5fd" : "#94a3b8" }}>
            {item.icon}
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "#e11d48", color: "white" }}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          <Avatar user={currentUser} size="sm" showStatus />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{currentUser.displayName}</p>
            <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>@{currentUser.username}</p>
          </div>
          <button onClick={onLogout} title="Sign out" style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ view, setView, unreadCount }) {
  const navItems = [
    { id: "threads", label: "Threads", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: "chat", label: "Messages", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, badge: unreadCount },
    { id: "profile", label: "Profile", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];
  return (
    <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,13,26,0.98)", flexShrink: 0 }}>
      {navItems.map(item => (
        <button key={item.id} onClick={() => setView(item.id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0 12px", border: "none", background: "transparent", color: view === item.id ? "#c4b5fd" : "#64748b", cursor: "pointer", position: "relative", fontSize: 10, fontWeight: 500 }}>
          {item.icon}
          <span>{item.label}</span>
          {item.badge > 0 && (
            <span style={{ position: "absolute", top: 8, left: "calc(50% + 8px)", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 99, background: "#e11d48", color: "white", minWidth: 16, textAlign: "center" }}>{item.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function ThreadList({ threads, posts, users, reactions, onOpenThread, onNewThread }) {
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("General");
  const [newContent, setNewContent] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    onNewThread(newTitle.trim(), newCat, newContent.trim());
    setNewTitle(""); setNewContent(""); setNewCat("General"); setShowNew(false);
  };

  const sorted = [...threads].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, color: "white", fontSize: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Threads</h2>
          <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{threads.length} discussions</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "white", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
          + New Thread
        </button>
      </div>

      {showNew && (
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(124,58,237,0.05)" }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Thread title..." style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setNewCat(c)}
                style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: newCat === c ? (catColors[c] || "#6b7280") + "33" : "rgba(255,255,255,0.05)", color: newCat === c ? catColors[c] : "#94a3b8" }}>
                {c}
              </button>
            ))}
          </div>
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your opening post..." rows={3}
            style={{ ...inputStyle, marginBottom: 8, resize: "none", fontFamily: "inherit" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowNew(false)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 14, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleCreate} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "white", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>Post</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map(thread => {
          const author = users.find(u => u.id === thread.authorId);
          const threadPosts = posts.filter(p => p.threadId === thread.id);
          const lastPost = threadPosts[threadPosts.length - 1];
          const lastAuthor = lastPost ? users.find(u => u.id === lastPost.authorId) : author;
          const totalReactions = threadPosts.reduce((acc, p) => acc + reactions.filter(r => r.postId === p.id).length, 0);

          return (
            <button key={thread.id} onClick={() => onOpenThread(thread.id)}
              style={{ width: "100%", textAlign: "left", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Avatar user={author} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    {thread.pinned && <span style={{ fontSize: 12 }}>📌</span>}
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: (catColors[thread.category] || "#6b7280") + "22", color: catColors[thread.category] || "#6b7280" }}>{thread.category}</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, fontSize: 12, color: "#475569" }}>
                    <span>{author?.displayName}</span>
                    <span>\u00B7</span>
                    <span>{threadPosts.length} {threadPosts.length === 1 ? "reply" : "replies"}</span>
                    {totalReactions > 0 && <><span>\u00B7</span><span>{totalReactions} reactions</span></>}
                    <span style={{ marginLeft: "auto", color: "#334155" }}>{lastAuthor?.displayName} \u00B7 {timeAgo(lastPost?.createdAt || thread.createdAt)}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThreadView({ thread, posts, users, reactions, currentUser, onBack, onPost, onReact }) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(null);
  const endRef = useRef(null);

  const threadPosts = posts.filter(p => p.threadId === thread.id);

  const handlePost = () => {
    if (!content.trim()) return;
    onPost(thread.id, content.trim(), replyTo);
    setContent(""); setReplyTo(null);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const inputStyle = { flex: 1, padding: "8px 14px", borderRadius: 8, color: "white", fontSize: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: (catColors[thread.category] || "#6b7280") + "22", color: catColors[thread.category] }}>{thread.category}</span>
            {thread.pinned && <span style={{ fontSize: 12, color: "#fbbf24" }}>📌 Pinned</span>}
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.title}</h2>
        </div>
        <span style={{ fontSize: 12, color: "#475569" }}>{threadPosts.length} posts</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {threadPosts.map((post) => {
            const postAuthor = users.find(u => u.id === post.authorId);
            const postReactions = reactions.filter(r => r.postId === post.id);
            const replyPost = post.replyTo ? threadPosts.find(p => p.id === post.replyTo) : null;
            const replyAuthor = replyPost ? users.find(u => u.id === replyPost.authorId) : null;
            const grouped = {};
            postReactions.forEach(r => { grouped[r.emoji] = (grouped[r.emoji] || []); grouped[r.emoji].push(r.userId); });

            return (
              <div key={post.id} style={{ borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}>
                {replyPost && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 8, borderLeft: "2px solid rgba(124,58,237,0.3)", fontSize: 12, color: "#475569" }}>
                    <span style={{ fontWeight: 500, color: "#a78bfa" }}>\u21A9 {replyAuthor?.displayName}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyPost.content.slice(0, 80)}...</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Avatar user={postAuthor} size="md" showStatus />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{postAuthor?.displayName}</span>
                      <span style={{ fontSize: 12, color: "#334155" }}>@{postAuthor?.username}</span>
                      <span style={{ fontSize: 12, color: "#334155" }}>\u00B7</span>
                      <span style={{ fontSize: 12, color: "#334155" }}>{timeAgo(post.createdAt)}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, color: "#cbd5e1", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{post.content}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {Object.entries(grouped).map(([emoji, userIds]) => {
                        const isMine = userIds.includes(currentUser.id);
                        return (
                          <button key={emoji} onClick={() => onReact(post.id, emoji)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 12, border: `1px solid ${isMine ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`, background: isMine ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)", cursor: "pointer", color: isMine ? "#c4b5fd" : "#94a3b8" }}>
                            <span>{emoji}</span><span>{userIds.length}</span>
                          </button>
                        );
                      })}
                      <div style={{ position: "relative" }}>
                        <button onClick={() => setEmojiPicker(emojiPicker === post.id ? null : post.id)}
                          style={{ padding: "2px 6px", borderRadius: 99, fontSize: 12, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                          +😀
                        </button>
                        {emojiPicker === post.id && (
                          <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 4, display: "flex", gap: 4, padding: 6, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#1e1b2e", zIndex: 20 }}>
                            {EMOJI_OPTIONS.map(e => (
                              <button key={e} onClick={() => { onReact(post.id, e); setEmojiPicker(null); }}
                                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", fontSize: 14 }}
                                onMouseEnter={e2 => e2.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                onMouseLeave={e2 => e2.currentTarget.style.background = "transparent"}>
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setReplyTo(post.id)}
                        style={{ marginLeft: 4, fontSize: 12, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={endRef} />
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {replyTo && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: "#94a3b8" }}>
            <span>Replying to <span style={{ color: "#a78bfa", fontWeight: 500 }}>{users.find(u => u.id === threadPosts.find(p => p.id === replyTo)?.authorId)?.displayName}</span></span>
            <button onClick={() => setReplyTo(null)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>\u2715</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Write a reply..." onKeyDown={e => e.key === "Enter" && !e.shiftKey && handlePost()} style={inputStyle} />
          <button onClick={handlePost} disabled={!content.trim()}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "white", border: "none", cursor: "pointer", opacity: content.trim() ? 1 : 0.4, background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatView({ currentUser, users, messages, onSend, onMarkRead, isMobile }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const endRef = useRef(null);
  const otherUsers = users.filter(u => u.id !== currentUser.id);

  const getConversation = (userId) => messages.filter(m =>
    (m.fromId === currentUser.id && m.toId === userId) || (m.fromId === userId && m.toId === currentUser.id)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const getUnread = (userId) => messages.filter(m => m.fromId === userId && m.toId === currentUser.id && !m.read).length;

  const handleSelectUser = (userId) => {
    setSelectedUser(userId);
    if (isMobile) setPanelOpen(false);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPanelOpen(true);
  };

  const handleSend = () => {
    if (!msg.trim() || !selectedUser) return;
    onSend(selectedUser, msg.trim());
    setMsg("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    if (selectedUser) {
      onMarkRead(selectedUser);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser, messages.length]);

  const convo = selectedUser ? getConversation(selectedUser) : [];
  const selUser = users.find(u => u.id === selectedUser);

  // On mobile: show panel OR conversation fullscreen (not both)
  const showPanel = panelOpen;
  const showConvo = isMobile ? !panelOpen : true;

  return (
    <div style={{ flex: 1, display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left panel - user list */}
      {showPanel && (
        <div style={{ width: isMobile ? "100%" : 256, flexShrink: 0, borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Messages</h2>
            {!isMobile && (
              <button onClick={() => setPanelOpen(false)} title="Collapse panel"
                style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {otherUsers.map(user => {
              const unread = getUnread(user.id);
              const lastMsg = getConversation(user.id).slice(-1)[0];
              return (
                <button key={user.id} onClick={() => handleSelectUser(user.id)}
                  style={{ width: "100%", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: selectedUser === user.id ? "rgba(124,58,237,0.1)" : "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar user={user} size="md" showStatus />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</span>
                        {unread > 0 && <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 99, background: "#e11d48", fontSize: 11, color: "white", fontWeight: 700 }}>{unread}</span>}
                      </div>
                      {lastMsg && <p style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2, margin: 0 }}>{lastMsg.fromId === currentUser.id ? "You: " : ""}{lastMsg.content}</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation area */}
      {showConvo && (
        selectedUser ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
              {isMobile ? (
                <button onClick={handleBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              ) : !panelOpen && (
                <button onClick={() => setPanelOpen(true)} title="Expand panel"
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
              <Avatar user={selUser} size="md" showStatus />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>{selUser.displayName}</p>
                <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{selUser.status === "online" ? "Online" : selUser.status === "away" ? "Away" : "Offline"}</p>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {convo.map(m => {
                  const isMine = m.fromId === currentUser.id;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: isMobile ? "85%" : 320, padding: "8px 14px", borderRadius: 16, borderBottomRightRadius: isMine ? 4 : 16, borderBottomLeftRadius: isMine ? 16 : 4, fontSize: 14, background: isMine ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "rgba(255,255,255,0.06)", color: isMine ? "white" : "#e2e8f0", border: isMine ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
                        <p style={{ margin: 0 }}>{m.content}</p>
                        <p style={{ fontSize: 11, margin: "4px 0 0", color: isMine ? "rgba(196,181,253,0.6)" : "#475569" }}>{timeAgo(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={endRef} />
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={msg} onChange={e => setMsg(e.target.value)} placeholder={`Message ${selUser.displayName}...`} onKeyDown={e => e.key === "Enter" && handleSend()}
                  style={{ flex: 1, padding: "8px 14px", borderRadius: 8, color: "white", fontSize: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }} />
                <button onClick={handleSend} disabled={!msg.trim()}
                  style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "white", border: "none", cursor: "pointer", opacity: msg.trim() ? 1 : 0.4, background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              {!panelOpen && (
                <button onClick={() => setPanelOpen(true)}
                  style={{ marginBottom: 16, padding: "6px 14px", borderRadius: 8, fontSize: 13, color: "#94a3b8", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                  Show contacts
                </button>
              )}
              <div style={{ width: 64, height: 64, margin: "0 auto 12px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(124,58,237,0.1)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Select a conversation to start chatting</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ProfileView({ currentUser, onUpdate, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);

  const handleSave = () => {
    onUpdate({ displayName: displayName.trim(), bio: bio.trim() });
    setEditing(false);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, color: "white", fontSize: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 64, padding: "64px 24px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Avatar user={currentUser} size="xl" />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "white", marginTop: 12, margin: "12px 0 0" }}>{currentUser.displayName}</h2>
          <p style={{ fontSize: 14, color: "#475569", margin: "4px 0 0" }}>@{currentUser.username}</p>
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#334155" }}>Joined {currentUser.joinedAt}</span>
        </div>
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", padding: 20, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>Profile Information</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: "#a78bfa", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
            )}
          </div>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { setEditing(false); setDisplayName(currentUser.displayName); setBio(currentUser.bio); }}
                  style={{ padding: "6px 12px", fontSize: 14, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSave}
                  style={{ padding: "6px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "white", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 2 }}>Display Name</label>
                <p style={{ fontSize: 14, color: "white", margin: 0 }}>{currentUser.displayName}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 2 }}>Bio</label>
                <p style={{ fontSize: 14, color: "#cbd5e1", margin: 0 }}>{currentUser.bio || "No bio yet"}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 2 }}>Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentUser.status === "online" ? "#34d399" : currentUser.status === "away" ? "#fbbf24" : "#64748b" }} />
                  <span style={{ fontSize: 14, color: "#cbd5e1", textTransform: "capitalize" }}>{currentUser.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {onLogout && (
          <button onClick={onLogout}
            style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState("threads");
  const [activeThread, setActiveThread] = useState(null);

  // Firebase auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setCurrentUser({ id: firebaseUser.uid, ...snap.data() });
            updateDoc(doc(db, "users", firebaseUser.uid), { status: "online" }).catch(() => {});
          }
          // If no doc yet (signup race), handleSignUp sets currentUser directly
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time data listeners — active only when logged in
  useEffect(() => {
    if (!currentUser) return;

    // Shared cache for merging the two message queries
    const msgCache = { recv: [], sent: [] };
    const mergeMessages = () => {
      const seen = new Set();
      setMessages([...msgCache.recv, ...msgCache.sent].filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      }));
    };

    const unsubs = [
      onSnapshot(collection(db, "users"), snap =>
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "threads"), snap =>
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "posts"), snap =>
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "reactions"), snap =>
        setReactions(snap.docs.map(d => d.data()))),
      onSnapshot(query(collection(db, "messages"), where("toId", "==", currentUser.id)), snap => {
        msgCache.recv = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeMessages();
      }),
      onSnapshot(query(collection(db, "messages"), where("fromId", "==", currentUser.id)), snap => {
        msgCache.sent = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeMessages();
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [currentUser?.id]);

  const handleLogin = async (username, password) => {
    try {
      await signInWithEmailAndPassword(auth, `${username}@commune.internal`, password);
    } catch {
      throw new Error("Invalid username or password");
    }
  };

  const handleSignUp = async (username, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, `${username}@commune.internal`, password);
      const avatar = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      const profile = { username, displayName, avatar, bio: "", joinedAt: new Date().toISOString().slice(0, 10), status: "online" };
      await setDoc(doc(db, "users", user.uid), profile);
      // Set currentUser directly to avoid race with onAuthStateChanged
      setCurrentUser({ id: user.uid, ...profile });
      setAuthLoading(false);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") throw new Error("Username already taken");
      if (err.code === "auth/operation-not-allowed") throw new Error("Email/password sign-in is not enabled. Enable it in the Firebase console under Authentication → Sign-in method.");
      if (err.code === "auth/invalid-api-key" || err.code === "auth/configuration-not-found") throw new Error("Firebase configuration error. Check that all VITE_FIREBASE_* secrets are set in GitHub.");
      if (err.code === "auth/weak-password") throw new Error("Password must be at least 6 characters.");
      throw new Error(`Sign up failed: ${err.code || err.message}`);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.id), { status: "offline" }).catch(() => {});
    }
    await signOut(auth);
    setView("threads");
    setActiveThread(null);
  };

  const handleNewThread = async (title, category, content) => {
    const threadRef = await addDoc(collection(db, "threads"), {
      title, category, authorId: currentUser.id, createdAt: new Date().toISOString(), pinned: false
    });
    await addDoc(collection(db, "posts"), {
      threadId: threadRef.id, authorId: currentUser.id, content, createdAt: new Date().toISOString(), replyTo: null
    });
  };

  const handlePost = async (threadId, content, replyTo) => {
    await addDoc(collection(db, "posts"), {
      threadId, authorId: currentUser.id, content, createdAt: new Date().toISOString(), replyTo: replyTo || null
    });
  };

  const handleReact = async (postId, emoji) => {
    const reactionId = `${postId}_${currentUser.id}_${encodeURIComponent(emoji)}`;
    const reactionRef = doc(db, "reactions", reactionId);
    const exists = reactions.find(r => r.postId === postId && r.userId === currentUser.id && r.emoji === emoji);
    if (exists) {
      await deleteDoc(reactionRef);
    } else {
      await setDoc(reactionRef, { postId, userId: currentUser.id, emoji });
    }
  };

  const handleSendMessage = async (toId, content) => {
    await addDoc(collection(db, "messages"), {
      fromId: currentUser.id, toId, content, createdAt: new Date().toISOString(), read: false
    });
  };

  const handleMarkRead = async (fromId) => {
    const unread = messages.filter(m => m.fromId === fromId && m.toId === currentUser.id && !m.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(m => batch.update(doc(db, "messages", m.id), { read: true }));
    await batch.commit();
  };

  const handleUpdateProfile = async (updates) => {
    await updateDoc(doc(db, "users", currentUser.id), updates);
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const unreadCount = currentUser ? messages.filter(m => m.toId === currentUser.id && !m.read).length : 0;

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0d1a" }}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Connecting...</div>
    </div>
  );

  if (!currentUser) return <LoginScreen onLogin={handleLogin} onSignUp={handleSignUp} />;

  const thread = activeThread ? threads.find(t => t.id === activeThread) : null;
  const navSetView = (v) => { setView(v); setActiveThread(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", overflow: "hidden", background: "#0f0d1a", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {!isMobile && <Sidebar currentUser={currentUser} view={view} setView={navSetView} unreadCount={unreadCount} onLogout={handleLogout} />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {view === "threads" && !thread && (
            <ThreadList threads={threads} posts={posts} users={users} reactions={reactions} onOpenThread={setActiveThread} onNewThread={handleNewThread} />
          )}
          {view === "threads" && thread && (
            <ThreadView thread={thread} posts={posts} users={users} reactions={reactions} currentUser={currentUser} onBack={() => setActiveThread(null)} onPost={handlePost} onReact={handleReact} />
          )}
          {view === "chat" && (
            <ChatView currentUser={currentUser} users={users} messages={messages} onSend={handleSendMessage} onMarkRead={handleMarkRead} isMobile={isMobile} />
          )}
          {view === "profile" && (
            <ProfileView currentUser={currentUser} onUpdate={handleUpdateProfile} onLogout={isMobile ? handleLogout : null} />
          )}
        </div>
      </div>
      {isMobile && <BottomNav view={view} setView={navSetView} unreadCount={unreadCount} />}
    </div>
  );
}
