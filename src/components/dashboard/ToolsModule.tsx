import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase"; 
import { useAuth } from "../../hooks/useAuth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import OrganizationTools from "../OrganizationTools";
import { motion, AnimatePresence } from "framer-motion";

// ICONS
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BusinessIcon from '@mui/icons-material/Business';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import ConstructionIcon from '@mui/icons-material/Construction';

type ToolsModuleProps = {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void; // Fix: Added prop
    activeTab: "chat" | "organization" | "tools";
    setActiveTab: (tab: "chat" | "organization" | "tools") => void;
    logout: () => void;
};

const ToolsModule = ({ isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab, logout }: ToolsModuleProps) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Load Organizations (Admins only see orgs they created)
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

    // Fix: Handler to close sidebar on mobile selection
    const handleOrgSelect = (id: string) => {
        setActiveOrgId(id);
        setIsSidebarOpen(false); 
    };

    const activeOrg = organizations.find((org) => org.id === activeOrgId);

    return (
        <div className="tools-tab flex h-full w-full bg-[var(--bg-primary)]">
            {/* LEFT: Organizations Sidebar */}
            <aside className={`sidebar w-1/4 min-w-[18rem] flex flex-col ${isSidebarOpen ? 'open' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-4">
                    <h2 className="text-sm font-bold tracking-tight uppercase opacity-50 text-[var(--text-primary)]">
                        Tool Manager
                    </h2>
                </div>

                <div className="conversations-list flex-1 overflow-y-auto px-2">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                key="loader" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="space-y-4 py-4"
                            >
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex flex-col gap-2 px-3">
                                        {/* Fix: Replaced hardcoded gray with theme tertiary */}
                                        <div className="h-4 w-3/4 bg-[var(--bg-tertiary)] rounded relative overflow-hidden">
                                            <motion.div 
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" 
                                                animate={{ x: ['-100%', '100%'] }} 
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            />
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
                                        className={`conversation-item flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer mb-1 transition-all ${
                                            activeOrgId === org.id ? "active" : ""
                                        }`}
                                        onClick={() => handleOrgSelect(org.id)}
                                    >
                                        <div className="conversation-content flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate text-[var(--text-primary)]">🌐 {org.domain}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-40 mt-1 text-[var(--text-secondary)]">
                                                Manage Automations
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDEBAR FOOTER */}
                {/* Fix: Replaced hardcoded black with theme secondary */}
                <div className="sidebar-footer border-t border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]">
                    <div className="md:hidden space-y-1 mb-4">
                        <button 
                            onClick={() => { setActiveTab("chat"); setIsSidebarOpen(false); }} 
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-indigo-600/10 text-indigo-500' : 'text-[var(--text-secondary)]'}`}
                        >
                            <ChatBubbleOutlineIcon fontSize="small" /> Support Chat
                        </button>
                        <button 
                            onClick={() => { setActiveTab("organization"); setIsSidebarOpen(false); }} 
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === 'organization' ? 'bg-indigo-600/10 text-indigo-400' : 'text-[var(--text-secondary)]'}`}
                        >
                            <BusinessIcon fontSize="small" /> Organization
                        </button>
                    </div>
                    <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        <LogoutIcon fontSize="small" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* RIGHT: Main Tools Area */}
            <section className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto bg-[var(--bg-primary)]">
                <AnimatePresence mode="wait">
                    {activeOrgId && user ? (
                        <motion.div 
                            key="tools-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-5xl w-full mx-auto"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                                    <ConstructionIcon className="text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Tool Configuration</h2>
                                    <p className="opacity-50 text-[var(--text-secondary)] text-sm">Managing assets for {activeOrg?.domain}</p>
                                </div>
                            </div>

                            {/* Fix: Replaced gray-900/50 with theme secondary */}
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm">
                                <OrganizationTools
                                    organizationId={activeOrgId}
                                    organizationDomain={activeOrg?.domain || ""}
                                    userEmail={user.email || ""}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20 text-[var(--text-primary)]"
                        >
                             <SettingsSuggestIcon style={{ fontSize: 80 }} />
                             <h2 className="text-xl font-bold mt-4">Admin Panel</h2>
                             <p className="max-w-xs mx-auto text-sm mt-2">
                                 Select an organization from the sidebar to configure tools.
                             </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default ToolsModule;