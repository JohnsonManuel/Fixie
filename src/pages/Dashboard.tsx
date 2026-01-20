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

    // 1. If Firebase is still initializing, show nothing (prevents flicker)
    if (loading) return null; 

    // 2. If no user is found, show the Error Card. 
    // The "Return to Login" button calls logout(), which triggers the navigate("/") we added to the hook.
    if (!user) {
       logout();
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
                logout={logout} 
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* 2. MAIN CONTENT SECTION */}
            <main className="dashboard-content">
                
                {/* CHAT TAB - Default view */}
                {activeTab === "chat" && (
                    <ChatModule 
                        isSidebarOpen={isSidebarOpen} 
                        setIsSidebarOpen={setIsSidebarOpen} 
                    />
                )}

                {/* ORGANIZATION TAB (Admin Only) */}
                {activeTab === "organization" && userRole === "admin" && (
                    <OrganizationModule 
                        userRole={userRole}
                        organizationKey={organizationKey}
                        isSidebarOpen={isSidebarOpen}
                    />
                )}

                {/* TOOLS TAB (Admin Only) */}
                {activeTab === "tools" && userRole === "admin" && (
                    <ToolsModule 
                        isSidebarOpen={isSidebarOpen}
                    />
                )}
                
                {/* FALLBACK FOR NON-ADMINS TRYING TO ACCESS ADMIN TABS */}
                {activeTab !== "chat" && userRole !== "admin" && (
                    <div className="no-permission-container">
                        <p>You do not have permission to view this tab.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ===========================================================================
// ROOT COMPONENT (Wraps with Theme)
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