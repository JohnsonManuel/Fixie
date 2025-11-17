import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/Dashboard.css";
import ChatMessage from "../components/chat/ChatMessage";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";
import { config } from "../services/config";
import { Message, Conversation } from "../types";
import { formatTimestamp, formatConversationTitle } from "../utils";
import { db } from "../services/firebase";
import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Simple icons
const DeleteIcon = () => <span>🗑️</span>;
const AddIcon = () => <span>➕</span>;
const SendIcon = () => <span>📤</span>;
const MenuIcon = () => <span>☰</span>;
const LogoutIcon = () => <span>🚪</span>;
const ChatIcon = () => <span>💬</span>;

const CHAT_ENDPOINT = config.functions.chat;

/** DASHBOARD CONTENT COMPONENT */
function DashboardContent({ userRole }: { userRole: string | null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Tabs: "chat" or "organization"
  const [activeTab, setActiveTab] = useState<"chat" | "organization">("chat");
  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgDomain, setOrgDomain] = useState("");

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const conversationsRef = collection(db, "users", user.uid, "conversations");
    const q = query(conversationsRef, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
      setConversations(convos);
      if (convos.length > 0 && !activeConvoId) setActiveConvoId(convos[0].id);
    });
    return () => unsubscribe();
  }, [user, activeConvoId]);

  useEffect(() => {
  if (!user) return;

  const orgsRef = collection(db, "organizations");
  const q = query(orgsRef, where("createdBy", "==", user.email));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orgList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrganizations(orgList);
  });

  return () => unsubscribe();
}, [user]);

  // Load messages
  useEffect(() => {
    if (!user || !activeConvoId) return;
    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "conversations",
      activeConvoId,
      "messages"
    );
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [user, activeConvoId]);

  // Create new conversation
  const createNewConversation = async () => {
    if (!user) return;
    const conversationsRef = collection(db, "users", user.uid, "conversations");
    const newConvoRef = await addDoc(conversationsRef, {
      title: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setActiveConvoId(newConvoRef.id);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const deleteOrganization = (orgId: string) => {
    console.log('delete org', orgId)
  }


const createOrganization = async () => {
  if (!user) return;
  if (!orgDomain.trim()) return alert("Enter a valid domain name");

  const domain = orgDomain.trim().toLowerCase();

  // Check if org exists
  const q = query(
    collection(db, "organizations"),
    where("domain", "==", domain)
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    alert("This domain is already registered.");
    return;
  }

  const orgData = {
    domain,
    createdBy: user.email,
    createdAt: new Date(),
    members: {
      [user.uid]: {
        email: user.email,
        role: "admin",
        status: "active",
      }
    }
  };

  await addDoc(collection(db, "organizations"), orgData);

  setOrgDomain("");
  setCreatingOrg(false);

  console.log(`✅ Created new organization domain: ${domain}`);
};



  // Delete conversation
  const deleteConversation = async (convoId: string) => {
    if (!user) return;
    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "conversations",
      convoId,
      "messages"
    );
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(doc(db, "users", user.uid, "conversations", convoId));
    await batch.commit();

    if (activeConvoId === convoId) {
      const remaining = conversations.filter((c) => c.id !== convoId);
      setActiveConvoId(remaining[0]?.id || null);
      if (!remaining.length) setMessages([]);
    }
  };

  // Send message
  const handleSendMessage = async (message: string): Promise<void> => {
    if (!user || !activeConvoId || !message.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeConvoId,
        "messages"
      );
      await addDoc(messagesRef, {
        role: "user",
        content: message,
        createdAt: serverTimestamp(),
      });

      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          conversationId: activeConvoId,
          message,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI response failed: ${response.status} - ${errText}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeConvoId,
        "messages"
      );
      await addDoc(messagesRef, {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        createdAt: serverTimestamp(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // -------------------------------
  // 🔹 RENDER SECTION
  // -------------------------------
  if (!user) {
    return (
      <div className="dashboard">
        <div className="auth-error">
          <h2>Authentication Error</h2>
          <p>You must be logged in to access the dashboard.</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-btn" onClick={toggleSidebar}>
            <MenuIcon />
          </button>
          <h1>Fixie AI Support</h1>
          <div className="flex items-center gap-3">
  <button
    onClick={() => setActiveTab("chat")}
    className={`px-4 py-1.5 rounded-md border transition-all duration-150 text-sm font-medium
      ${
        activeTab === "chat"
          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
          : "border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-400"
      }`}
  >
    Chats
  </button>

  {userRole === "admin" && (
    <button
      onClick={() => setActiveTab("organization")}
      className={`px-4 py-1.5 rounded-md border transition-all duration-150 text-sm font-medium
        ${
          activeTab === "organization"
            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
            : "border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-400"
        }`}
    >
      Organizations
    </button>
  )}
</div>

        </div>

        {/* <div className="header-center">
         
        </div> */}

        <div className="header-right">
          <ThemeToggle />
          <button className="logout-btn" onClick={logout}>
            <LogoutIcon /> Logout
          </button>
        </div>
      </header>


      {/* MAIN CONTENT */}
      <main className="dashboard-content">
        {activeTab === "chat" && (
          <div className="chat-tab flex h-full w-full bg-gray-900 text-gray-100">
            {/* LEFT: Sidebar (1/4 width) */}
            <aside className="w-1/4 min-w-[16rem] border-r border-gray-800 bg-gray-800 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold">Conversations</h2>
                <button
                  onClick={createNewConversation}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md"
                >
                  <AddIcon /> New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-gray-400 text-sm px-4 py-6 text-center">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((convo) => (
                    <div
                      key={convo.id}
                      className={`flex items-center justify-between px-4 py-2 cursor-pointer transition ${
                        activeConvoId === convo.id
                          ? "bg-indigo-700 text-white"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setActiveConvoId(convo.id);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {formatConversationTitle(
                            convo.title || "New Chat",
                            activeConvoId === convo.id
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimestamp(convo.updatedAt)}
                        </div>
                      </div>
                      <button
                        className="text-gray-400 hover:text-red-400 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(convo.id);
                        }}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* RIGHT: Main chat area (3/4 width) */}
            <section className="w-3/4 flex flex-col">
              {!activeConvoId ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
                  <ChatIcon />
                  <h2 className="text-xl font-semibold">Welcome to Fixie AI Support</h2>
                  <p className="text-gray-400 text-sm">
                    Start a new conversation to get help with your IT issues.
                  </p>
                  <button
                    onClick={createNewConversation}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-white text-sm"
                  >
                    <AddIcon /> Start New Chat
                  </button>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {isLoading && (
                      <div className="italic text-gray-400 text-sm">
                        Fixie is typing...
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="flex items-center p-3 border-t border-gray-700 bg-gray-800">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (inputMessage.trim() && !isLoading) {
                            handleSendMessage(inputMessage);
                            setInputMessage("");
                          }
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => {
                        if (inputMessage.trim() && !isLoading) {
                          handleSendMessage(inputMessage);
                          setInputMessage("");
                        }
                      }}
                      disabled={!inputMessage.trim() || isLoading}
                      className="ml-3 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm text-white"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
        {/* 🔹 Organization tab */}
{activeTab === "organization" && (
  <div className="organization-tab flex h-full bg-gray-900 text-gray-100">
    {/* LEFT SIDEBAR */}
    <aside className="w-1/4 min-w-[16rem] border-r border-gray-800 bg-gray-800 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-300">
          Domains
        </h2>
        {userRole === "admin" && (
          <button
            onClick={() => {
              setCreatingOrg(true);
              setActiveOrgId(null);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md"
          >
            <AddIcon /> New
          </button>
        )}
      </div>

      {/* Sidebar list */}
      <div className="flex-1 overflow-y-auto">
        {organizations.length === 0 ? (
          <p className="text-gray-400 text-sm px-4 py-6 text-center">
            No domains registered yet
          </p>
        ) : (
          organizations.map((org) => {
          const membersObj = org.members || {};
          const memberIds = Object.keys(membersObj);
          const memberCount = memberIds.length;

          return (
            <div
              key={org.id}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-800 transition ${
                activeOrgId === org.id
                  ? "bg-indigo-700/60 text-white"
                  : "hover:bg-gray-700/60"
              }`}
              onClick={() => {
                setActiveOrgId(org.id);
                setCreatingOrg(false);
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-gray-100 flex items-center gap-2">
                  🌐 {org.domain}
                </div>

                <div className="text-xs text-gray-400">
                  {memberCount > 0
                    ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                    : "No members yet"}
                </div>
              </div>

              {userRole === "admin" && (
                <button
                  className="text-gray-400 hover:text-red-400 text-sm transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOrganization(org.id);
                  }}
                >
                  <DeleteIcon />
                </button>
              )}
            </div>
          );
        })
      )}
      </div>
    </aside>

    {/* RIGHT CONTENT AREA */}
    <section className="w-3/4 flex flex-col px-10 py-8 overflow-y-auto">
      {/* Admin: Create Domain */}
      {(creatingOrg || organizations.length === 0) && userRole === "admin" ? (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              🏢 Register a New Domain
            </h2>
            <p className="text-gray-400 text-sm">
              Add a domain to associate users automatically when they sign up.
            </p>
          </div>

          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Domain Name
              </label>
              <input
                type="text"
                placeholder="e.g. gmail.com"
                value={orgDomain}
                onChange={(e) => setOrgDomain(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={createOrganization}
              disabled={!orgDomain.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium disabled:opacity-50"
            >
              Register Domain
            </button>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-sm text-gray-400">
            <p>
              Once a domain is registered, any user signing up with an email
              from that domain (e.g. <code>user@gmail.com</code>) will be
              automatically linked to your organization.
            </p>
          </div>
        </div>
      ) : activeOrgId ? (
        // 🧩 Domain Details View
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                🌐 {organizations.find((org) => org.id === activeOrgId)?.domain}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {/* {JSON.stringify(organizations)} */}
                Created by{" "}
                {organizations.find((org) => org.id === activeOrgId)?.createdBy ||
                  "Unknown"}
              </p>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-medium mb-4 text-white">Members</h3>
            <div className="space-y-3">
  {(() => {
    const org = organizations.find((org) => org.id === activeOrgId);

    if (!org || !org.members) {
      return (
        <div className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-600 rounded-lg">
          No users have signed up yet.
        </div>
      );
    }

    // Convert map → array of { uid, ...data }
    const membersArray = Object.entries(org.members).map(
      ([uid, data]: [string, any]) => ({
        uid,
        ...data,
      })
    );

    if (membersArray.length === 0) {
      return (
        <div className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-600 rounded-lg">
          No users have signed up yet.
        </div>
      );
    }

    return membersArray.map((member) => (
      <div
        key={member.uid}
        className="flex justify-between items-center bg-gray-700/50 px-4 py-2 rounded-md"
      >
        <div>
          <p className="text-sm font-medium text-gray-200">{member.email}</p>

          <p
            className={`text-xs ${
              member.status === "verified"
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {member.status}
          </p>
        </div>

        <p className="text-xs text-gray-400">
          {member.role || "user"}
        </p>
      </div>
    ));
  })()}
</div>

          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-500 text-sm">
            Select a domain to view members.
          </p>
        </div>
      )}
    </section>
  </div>
)}



      </main>
    </div>
  );
}

/** WRAPPER */
export default function Dashboard({ userRole }: { userRole: string | null }) {
  return (
    <ThemeProvider>
      <DashboardContent userRole={userRole} />
    </ThemeProvider>
  );
}
