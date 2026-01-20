import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase"; 
import { useAuth } from "../../hooks/useAuth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import OrganizationTools from "../OrganizationTools";

type ToolsModuleProps = {
    isSidebarOpen: boolean;
};

const ToolsModule = ({ isSidebarOpen }: ToolsModuleProps) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

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
        });

        return () => unsubscribe();
    }, [user]);

    const activeOrg = organizations.find((org) => org.id === activeOrgId);

    return (
        <div className="tools-tab flex h-full w-full">
            {/* LEFT: Organizations Sidebar */}
            <aside className={`sidebar w-1/4 min-w-[16rem] flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-3">
                    <h2 className="text-sm font-semibold tracking-wide uppercase">
                        Admin Tools
                    </h2>
                </div>

                <div className="conversations-list flex-1 overflow-y-auto">
                    {organizations.length === 0 ? (
                        <p className="text-gray-400 text-sm px-4 py-6 text-center">
                            No organizations found
                        </p>
                    ) : (
                        organizations.map((org) => (
                            <div
                                key={org.id}
                                className={`conversation-item flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-800 transition ${
                                    activeOrgId === org.id ? "active" : ""
                                }`}
                                onClick={() => setActiveOrgId(org.id)}
                            >
                                <div className="conversation-content flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate flex items-center gap-2">
                                        🌐 {org.domain}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Select to manage tools
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* RIGHT: Main Tools Area */}
            <section className="w-3/4 flex flex-col px-10 py-8 overflow-y-auto">
                {activeOrgId && user ? (
                    <OrganizationTools
                        organizationId={activeOrgId}
                        organizationDomain={activeOrg?.domain || ""}
                        userEmail={user.email || ""}
                    />
                ) : (
                    <div className="flex items-center justify-center flex-1">
                        <div className="text-center space-y-4">
                            <div className="text-6xl mb-4">🛠️</div>
                            <h2 className="text-2xl font-semibold">Admin Panel</h2>
                            <p className="text-gray-400 text-sm">
                                Select an organization from the left to access its automation and support tools.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ToolsModule;