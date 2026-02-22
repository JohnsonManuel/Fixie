import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase"; 
import { useAuth } from "../../hooks/useAuth";
import {
    addDoc,
    collection,
    onSnapshot,
    query,
    where,
    deleteDoc,
    doc,
    getDocs
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// ICONS
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

type OrganizationModuleProps = {
    userRole: string | null;
    organizationKey: string | null;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    activeTab: "chat" | "organization" | "tools";
    setActiveTab: (tab: "chat" | "organization" | "tools") => void;
    logout: () => void;
};

const OrganizationModule = ({ 
    userRole, 
    organizationKey, 
    isSidebarOpen, 
    setIsSidebarOpen,
    activeTab, 
    setActiveTab, 
    logout 
}: OrganizationModuleProps) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [orgDomain, setOrgDomain] = useState("");
    const [isLoading, setIsLoading] = useState(true);

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
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const deleteOrganization = async (orgId: string) => {
        if (!window.confirm("Are you sure you want to delete this domain?")) return;
        try {
            await deleteDoc(doc(db, "organizations", orgId));
            if (activeOrgId === orgId) setActiveOrgId(null);
        } catch (e) {
            console.error("Error deleting org", e);
        }
    };

    const createOrganization = async () => {
        if (!user || !organizationKey) return;
        let raw = orgDomain.trim().toLowerCase();
        if (!raw) return;

        raw = raw.replace(/^@/, "");
        const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
        if (!DOMAIN_PATTERN.test(raw)) return alert("Invalid domain format.");

        const [prefix, ...rest] = raw.split(".");
        if (prefix !== organizationKey.toLowerCase()) {
            return alert(`Domain must start with "${organizationKey}."`);
        }

        const tld = rest.join(".");
        if (!["com", "co", "org"].includes(tld)) {
            return alert(`Only .co, .com or .org are allowed.`);
        }

        const q = query(collection(db, "organizations"), where("domain", "==", raw));
        const existing = await getDocs(q);
        if (!existing.empty) return alert("This domain is already registered.");

        const orgData = {
            domain: raw,
            organizationKey,
            createdBy: user.email,
            createdAt: new Date(),
            members: {
                [user.uid]: {
                    email: user.email,
                    role: "admin",
                    status: "active",
                },
            },
        };

        await addDoc(collection(db, "organizations"), orgData);
        setOrgDomain("");
        setCreatingOrg(false);
    };

    const handleOrgSelect = (id: string) => {
        setActiveOrgId(id);
        setCreatingOrg(false);
        setIsSidebarOpen(false); // Fix: Closes Sidebar on Mobile selection
    };

    const handleNewClick = () => {
        setCreatingOrg(true);
        setActiveOrgId(null);
        setIsSidebarOpen(false); // Fix: Closes Sidebar on Mobile when adding new
    };

    return (
        <div className="organization-tab flex h-full w-full bg-[var(--bg-primary)]">
            {/* SIDEBAR */}
            <aside className={`sidebar w-1/4 min-w-[18rem] flex flex-col ${isSidebarOpen ? 'open' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-4">
                    <h2 className="text-sm font-bold tracking-tight uppercase opacity-50 text-[var(--text-primary)]">Domains</h2>
                    <motion.button 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }} 
                        onClick={handleNewClick} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-500/20"
                    >
                        <AddIcon sx={{ fontSize: 16 }}/> New
                    </motion.button>
                </div>

                <div className="conversations-list flex-1 overflow-y-auto px-2">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex flex-col gap-2 px-3">
                                        <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded relative overflow-hidden">
                                            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5 }}/>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }}>
                                {organizations.map((org) => (
                                    <motion.div 
                                        key={org.id} 
                                        whileHover={{ x: 4, backgroundColor: "var(--bg-tertiary)" }} 
                                        className={`conversation-item flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer mb-1 transition-all ${activeOrgId === org.id ? "active" : ""}`} 
                                        onClick={() => handleOrgSelect(org.id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate text-[var(--text-primary)]">🌐 {org.domain}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-40 mt-1 text-[var(--text-secondary)]">{Object.keys(org.members || {}).length} members</div>
                                        </div>
                                        <motion.button 
                                            whileHover={{ scale: 1.2, color: "#f87171" }} 
                                            onClick={(e) => { e.stopPropagation(); deleteOrganization(org.id); }} 
                                            className="delete-conversation-btn text-[var(--text-muted)] ml-2"
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDEBAR FOOTER */}
                <div className="sidebar-footer border-t border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]">
                    <div className="md:hidden space-y-1 mb-4">
                        <button onClick={() => { setActiveTab("chat");  }} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
                            <ChatBubbleOutlineIcon fontSize="small" /> Support Chat
                        </button>
                        <button onClick={() => { setActiveTab("tools");  }} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
                            <SettingsSuggestIcon fontSize="small" /> Tool Manager
                        </button>
                    </div>
                    <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        <LogoutIcon fontSize="small" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* CONTENT AREA */}
            <section className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <AnimatePresence mode="wait">
                    {creatingOrg ? (
                        <motion.div key="create" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-xl mx-auto w-full space-y-8 mt-12">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Register Domain</h2>
                                <p className="opacity-60 text-[var(--text-secondary)]">Add a new organization domain to your network.</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-3xl shadow-xl space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-[var(--text-secondary)]">Domain Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. company.com" 
                                        value={orgDomain} 
                                        onChange={(e) => setOrgDomain(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-indigo-500/50 transition-all placeholder:opacity-30"
                                    />
                                </div>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createOrganization} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                                    Register Domain
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : activeOrgId ? (
                        <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                                        <BusinessIcon className="text-indigo-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{organizations.find(o => o.id === activeOrgId)?.domain}</h2>
                                </div>
                            </div>
                            {(() => {
                                const members = Object.entries(organizations.find(o => o.id === activeOrgId)?.members || {});
                                const adminMembers = members.filter(([, m]: any) => m.role === "admin");
                                const normalMembers = members.filter(([, m]: any) => m.role !== "admin");

                                const MemberCard = ({ uid, m }: { uid: string; m: any }) => (
                                    <div key={uid} className="flex justify-between items-center px-6 py-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">{m.email.substring(0, 2).toUpperCase()}</div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{m.email}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-tighter ${m.status === "active" ? "text-emerald-500" : "text-amber-500"}`}>{m.status}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[10px] font-bold opacity-60 uppercase tracking-widest border border-[var(--border-primary)] text-[var(--text-secondary)]">{m.role || "user"}</span>
                                    </div>
                                );

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* ADMIN USERS COLUMN */}
                                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-sm">
                                            <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                                                <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 text-[var(--text-secondary)]">Admins ({adminMembers.length})</h3>
                                            </div>
                                            <div className="divide-y divide-[var(--border-primary)]">
                                                {adminMembers.length > 0 ? (
                                                    adminMembers.map(([uid, m]: any) => <MemberCard key={uid} uid={uid} m={m} />)
                                                ) : (
                                                    <p className="px-6 py-8 text-center text-sm opacity-40 text-[var(--text-secondary)]">No admins</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* NORMAL USERS COLUMN */}
                                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-sm">
                                            <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                                                <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 text-[var(--text-secondary)]">Users ({normalMembers.length})</h3>
                                            </div>
                                            <div className="divide-y divide-[var(--border-primary)]">
                                                {normalMembers.length > 0 ? (
                                                    normalMembers.map(([uid, m]: any) => <MemberCard key={uid} uid={uid} m={m} />)
                                                ) : (
                                                    <p className="px-6 py-8 text-center text-sm opacity-40 text-[var(--text-secondary)]">No users</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 text-[var(--text-primary)]">
                             <BusinessIcon style={{ fontSize: 80 }} />
                             <p className="mt-4 font-medium">Select a domain to manage members</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default OrganizationModule;