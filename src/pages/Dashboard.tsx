import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import "../styles/Dashboard.css";

// Component Imports
import DashboardHeader from "../components/dashboard/DashboardHeader";
import ChatModule from "../components/dashboard/ChatModule";
import OrganizationModule from "../components/dashboard/OrganizationModule";
import ToolsModule from "../components/dashboard/ToolsModule";

type DashboardContentProps = {
    userRole: string | null;
    organizationKey: string | null;
};

function DashboardContent({ userRole, organizationKey }: DashboardContentProps) {
    const { user, logout, loading } = useAuth();
    const { theme } = useTheme();
    
    // UI State
    const [activeTab, setActiveTab] = useState<"chat" | "organization" | "tools">("chat");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ===========================================================================
    // AUTHENTICATION GUARD
    // ===========================================================================

    if (loading) return null; 

    if (!user) {
       logout();
       return null; 
    }

    // ===========================================================================
    // MAIN DASHBOARD RENDER
    // ===========================================================================

    return (
        <div className="dashboard" data-theme={theme}>
            {/* 1. HEADER SECTION */}
            <DashboardHeader 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userRole={userRole}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* 2. MAIN CONTENT SECTION */}
            <main className="dashboard-content">
                
                {/* CHAT TAB */}
                {activeTab === "chat" && (
                    <ChatModule 
                        isSidebarOpen={isSidebarOpen} 
                        setIsSidebarOpen={setIsSidebarOpen}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        userRole={userRole}
                        logout={logout}
                    />
                )}

                {/* ORGANIZATION TAB (Admin Only) */}
                {activeTab === "organization" && userRole === "admin" && (
                    <OrganizationModule 
                        userRole={userRole}
                        organizationKey={organizationKey}
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen} /* ADDED THIS PROP */
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        logout={logout}
                    />
                )}

                {/* TOOLS TAB (Admin Only) */}
                {activeTab === "tools" && userRole === "admin" && (
                    <ToolsModule 
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen} /* ADDED THIS PROP */
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        logout={logout}
                    />
                )}
                
                {/* FALLBACK FOR NON-ADMINS */}
                {activeTab !== "chat" && userRole !== "admin" && (
                    <div className="no-permission-container flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-500 font-medium">You do not have permission to view this tab.</p>
                            <button 
                                onClick={() => setActiveTab("chat")}
                                className="mt-4 text-indigo-500 text-sm font-bold hover:underline"
                            >
                                Back to Chat
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ===========================================================================
// ROOT COMPONENT
// ===========================================================================

type DashboardProps = {
    userRole: string | null;
    organizationKey: string | null;
};

export default function Dashboard({ userRole, organizationKey }: DashboardProps) {
    return (
        <ThemeProvider>
            <DashboardContent userRole={userRole} organizationKey={organizationKey} />
        </ThemeProvider>
    );
}