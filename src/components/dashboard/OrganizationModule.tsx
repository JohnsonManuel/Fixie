import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase"; 
import { useAuth } from "../../hooks/useAuth";
import {
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
    deleteDoc,
    doc
} from "firebase/firestore";

// ICONS
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

type OrganizationModuleProps = {
    userRole: string | null;
    organizationKey: string | null;
    isSidebarOpen: boolean;
};

const OrganizationModule = ({ userRole, organizationKey, isSidebarOpen }: OrganizationModuleProps) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [orgDomain, setOrgDomain] = useState("");

    // 1. Load Organizations from Firestore (Real-time)
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

    // 2. Delete Organization
    const deleteOrganization = async (orgId: string) => {
        if (!window.confirm("Are you sure you want to delete this domain?")) return;
        try {
            await deleteDoc(doc(db, "organizations", orgId));
            if (activeOrgId === orgId) setActiveOrgId(null);
        } catch (e) {
            console.error("Error deleting org", e);
        }
    };

    // 3. Create Organization with Validation
    const createOrganization = async () => {
        if (!user || !organizationKey) return;

        let raw = orgDomain.trim().toLowerCase();
        if (!raw) return alert("Enter a valid domain name");

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

    return (
        <div className="organization-tab flex h-full w-full">
            {/* SIDEBAR: Domain List */}
            <aside className={`sidebar w-1/4 min-w-[16rem] flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
                <div className="sidebar-header flex items-center justify-between px-4 py-3">
                    <h2 className="text-sm font-semibold uppercase">Domains</h2>
                    <button onClick={() => { setCreatingOrg(true); setActiveOrgId(null); }} className="bg-indigo-600 px-2 py-1 text-white text-xs rounded-md">
                        <AddIcon fontSize="small" /> New
                    </button>
                </div>
                <div className="conversations-list flex-1 overflow-y-auto">
                    {organizations.map((org) => (
                        <div key={org.id} className={`conversation-item flex items-center justify-between px-4 py-3 cursor-pointer ${activeOrgId === org.id ? "active" : ""}`} onClick={() => { setActiveOrgId(org.id); setCreatingOrg(false); }}>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">🌐 {org.domain}</div>
                                <div className="text-xs text-gray-400">{Object.keys(org.members || {}).length} members</div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteOrganization(org.id); }} className="text-gray-400 hover:text-red-400 ml-2">
                                <DeleteOutlineIcon fontSize="small" />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* CONTENT AREA: Domain Registration or Member List */}
            <section className="w-3/4 flex flex-col px-10 py-8 overflow-y-auto">
                {creatingOrg ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h2 className="text-2xl font-semibold text-center">🏢 Register a New Domain</h2>
                        <div className="border border-gray-700 rounded-xl p-6 bg-[var(--bg-secondary)] space-y-4">
                            <input 
                                type="text" 
                                placeholder="e.g. yourcompany.com" 
                                value={orgDomain} 
                                onChange={(e) => setOrgDomain(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[var(--bg-primary)]"
                            />
                            <button onClick={createOrganization} className="w-full py-2 bg-indigo-600 text-white rounded-md font-medium">
                                Register Domain
                            </button>
                        </div>
                    </div>
                ) : activeOrgId ? (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h2 className="text-2xl font-semibold">🌐 {organizations.find(o => o.id === activeOrgId)?.domain}</h2>
                        <div className="border border-gray-700 rounded-xl p-6 bg-[var(--bg-secondary)]">
                            <h3 className="text-lg font-medium mb-4">Members</h3>
                            <div className="space-y-3">
                                {Object.entries(organizations.find(o => o.id === activeOrgId)?.members || {}).map(([uid, m]: any) => (
                                    <div key={uid} className="flex justify-between items-center px-4 py-2 rounded-md bg-[var(--bg-primary)]">
                                        <div>
                                            <p className="text-sm font-medium">{m.email}</p>
                                            <p className={`text-xs ${m.status === "verified" ? "text-green-400" : "text-yellow-400"}`}>{m.status}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">{m.role || "user"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                        Select a domain to view members or register a new one.
                    </div>
                )}
            </section>
        </div>
    );
};

export default OrganizationModule;