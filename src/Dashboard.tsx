import React, {useEffect, useRef, useState} from "react";
import {useAuth} from "./hooks/useAuth";
import "./Dashboard.css";

// Firebase client
import {db, auth} from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

type Role = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt?: any; // Firestore Timestamp | Date
}

type Conversation = {
  id: string;
  title?: string;
  updatedAt?: any;
  lastMessage?: string;
  model?: string;
};

/** Put your Cloud Run URL in an env var; fall back to a hardcoded URL */
const CHAT_ENDPOINT =
  // CRA
  (typeof process !== "undefined" &&
    (process.env as any)?.REACT_APP_CHAT_ENDPOINT) ||
  // Vite
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_CHAT_ENDPOINT) ||
  // Fallback (replace with your own run.app URL)
  "https://chat-wkhxxeirta-ey.a.run.app";

/** Minimal inline Tickets page shown on the right */
function TicketsPage() {
  return (
    <div className="tickets-page">
      <header className="tickets-header">
        <h2>Tickets</h2>
        <div className="tickets-actions">
          <button className="btn small">New Ticket</button>
        </div>
      </header>
      <div className="tickets-body">
        <div className="card">
          <p>No tickets yet. Connect your ITSM or create one.</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const {user, logout} = useAuth();

  type View = "chat" | "tickets";
  const [view, setView] = useState<View>("chat");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to user's conversations (latest first)
  useEffect(() => {
    if (!user?.uid) return;
    const convosRef = collection(db, "users", user.uid, "conversations");
    const qConvos = query(convosRef, orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(qConvos, (snap) => {
      const list: Conversation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setConversations(list);

      if (!activeConvoId && list.length) setActiveConvoId(list[0].id);
      if (activeConvoId && !list.find((c) => c.id === activeConvoId)) {
        setActiveConvoId(list[0]?.id ?? null);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Ensure at least one conversation exists
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const convosRef = collection(db, "users", user.uid, "conversations");
      const qLatest = query(convosRef, orderBy("updatedAt", "desc"), limit(1));
      const snap = await getDocs(qLatest);
      if (snap.empty) {
        const newRef = await addDoc(convosRef, {
          title: "New chat",
          model: "gpt-4o-mini",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          summary: "",
          lastMessage: "",
        });
        setActiveConvoId(newRef.id);
      }
    })();
  }, [user?.uid]);

  // Live subscribe to messages of the active conversation
  useEffect(() => {
    if (!user?.uid || !activeConvoId) {
      setMessages([]);
      return;
    }
    const msgsRef = collection(
      db,
      "users",
      user.uid,
      "conversations",
      activeConvoId,
      "messages",
    );
    const qMsgs = query(msgsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(qMsgs, (snap) => {
      const list: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setMessages(list);
    });
    return () => unsub();
  }, [user?.uid, activeConvoId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  const handleNewChat = async () => {
    if (!user?.uid) return;
    const convosRef = collection(db, "users", user.uid, "conversations");
    const newRef = await addDoc(convosRef, {
      title: "New chat",
      model: "gpt-4o-mini",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      summary: "",
      lastMessage: "",
    });
    setActiveConvoId(newRef.id);
    setView("chat");
    setInputMessage("");
  };

  // Batched deletion of a collection (subcollection) in chunks — using a single path string
  async function deleteCollectionInBatches(path: string, batchSize = 200) {
    const colRef = collection(db, path);
    // loop pages until empty
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await getDocs(query(colRef, limit(batchSize)));
      if (page.empty) break;
      const batch = writeBatch(db);
      page.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Delete a conversation: delete all messages, then the conversation doc
  const handleDeleteConversation = async (
    e: React.MouseEvent,
    convoId: string,
  ) => {
    e.stopPropagation(); // don't also select the convo
    if (!user?.uid) return;

    const title =
      conversations.find((c) => c.id === convoId)?.title || "this chat";
    const ok = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setDeletingId(convoId);

      // 1) delete messages in small batches (Firestore doesn’t cascade)
      await deleteCollectionInBatches(
        `users/${user.uid}/conversations/${convoId}/messages`,
      );

      // 2) delete the conversation doc itself
      await deleteDoc(doc(db, "users", user.uid, "conversations", convoId));

      // 3) local UI updates
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeConvoId === convoId) {
        const next = conversations.find((c) => c.id !== convoId)?.id || null;
        setActiveConvoId(next);
        if (!next) setMessages([]);
      }
    } catch (err) {
      console.error("Delete conversation failed:", err);
      alert("Failed to delete conversation. Check console for details.");
    } finally {
      setDeletingId(null);
    }
  };

  // Send message: write user msg -> call /chat -> assistant reply via onSnapshot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !user?.uid) return;

    setInputMessage("");
    setIsLoading(true);

    try {
      // ensure conversation exists
      let convoId = activeConvoId;
      if (!convoId) {
        const convosRef = collection(db, "users", user.uid, "conversations");
        const newRef = await addDoc(convosRef, {
          title: "New chat",
          model: "gpt-4o-mini",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          summary: "",
          lastMessage: "",
        });
        convoId = newRef.id;
        setActiveConvoId(convoId);
      }

      // write user message
      const msgsRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        convoId,
        "messages",
      );
      await addDoc(msgsRef, {
        role: "user",
        content: text,
        createdAt: serverTimestamp(),
      });

      // bump convo metadata
      await updateDoc(doc(db, "users", user.uid, "conversations", convoId), {
        updatedAt: serverTimestamp(),
        lastMessage: text,
      });

      // call backend function securely
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No auth token");

      await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({idToken, conversationId: convoId}),
      });

      setView("chat");
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const formatTime = (ts?: any) => {
    const d: Date =
      ts?.toDate?.() instanceof Date
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : new Date();
    return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
  };

  const getUsername = () => {
    if (!user?.email) return "User";
    return user.email.split("@")[0];
  };

  return (
    <div className="dashboard chat-started">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <button
            onClick={handleNewChat}
            className={`sidebar-item new-chat ${
              view === "chat" ? "active" : ""
            }`}
          >
            <span className="icon icon-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </span>
            <span className="label">New chat</span>
          </button>

          {/* Conversations list */}
          <ul className="convo-list">
            {conversations.map((c) => (
              <li
                key={c.id}
                className={`convo-item ${
                  activeConvoId === c.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveConvoId(c.id);
                  setView("chat");
                }}
                title={c.title || "Untitled"}
              >
                <div className="convo-meta">
                  <div className="convo-title">{c.title || "New chat"}</div>
                  {c.lastMessage && (
                    <div className="convo-preview">{c.lastMessage}</div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  className="icon-btn delete-btn"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                  onClick={(e) => handleDeleteConversation(e, c.id)}
                  disabled={deletingId === c.id}
                >
                  {deletingId === c.id ? (
                    <span className="spinner" aria-hidden />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="icon-svg"
                    >
                      <path d="M6 7h12v2H6V7zm2 4h2v7H8v-7zm6 0h2v7h-2v-7zM9 4h6l1 1h4v2H4V5h4l1-1z" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
            {!conversations.length && (
              <li className="convo-item disabled">No conversations yet</li>
            )}
          </ul>

          {/* Tickets nav item */}
          <button
            type="button"
            className={`sidebar-item ${view === "tickets" ? "active" : ""}`}
            onClick={() => setView("tickets")}
            aria-current={view === "tickets" ? "page" : undefined}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path d="M4 7h12a2 2 0 0 1 2 2v1a2 2 0 1 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 1 0 0-4V9a2 2 0 0 1 2-2z" />
              </svg>
            </span>
            <span className="label">Tickets</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content"></div>
          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        {/* Right side: Chat or Tickets */}
        {view === "chat" ? (
          <div className="chat-area">
            {/* Welcome screen */}
            {messages.length === 0 && (
              <div className="welcome-screen visible">
                <div className="welcome-content ">
                  <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                    <span className="welcome-icon">✨</span>
                    <h1 className="welcome-title">Welcome, {getUsername()}</h1>
                  </div>
                  <form
                    onSubmit={handleSendMessage}
                    className="message-form compact-form"
                  >
                    <div className="input-wrapper compact-input-wrapper">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="How can I help you today?"
                        className="message-input"
                        disabled={isLoading}
                      />
                      <div className="input-right-section">
                        <button
                          type="submit"
                          className="send-button"
                          disabled={isLoading || !inputMessage.trim()}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="send-icon"
                          >
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="messages-container">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message ${
                    m.role === "user" ? "user-message" : "assistant-message"
                  }`}
                >
                  <div className="message-avatar">
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{m.content}</div>
                    <div className="message-time">{formatTime(m.createdAt)}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message assistant-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input (bottom) */}
            {
              messages.length !== 0 && (<div className="input-container">
                <form onSubmit={handleSendMessage} className="message-form">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="How can I help you today?"
                      className="message-input"
                      disabled={isLoading}
                    />
                    <div className="input-right-section">
                      <button
                        type="submit"
                        className="send-button"
                        disabled={isLoading || !inputMessage.trim()}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="send-icon"
                        >
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>
                <div className="input-footer">
                  <div className="tool-status">
                    <div className="status-dot green"></div>
                    <div className="status-dot orange"></div>
                    <div className="status-dot blue"></div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="chevron-right"
                    >
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </div>
                </div>
              </div>)}
            
            
          </div>
        ) : (
          <TicketsPage />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
