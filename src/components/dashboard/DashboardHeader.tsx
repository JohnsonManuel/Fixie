import React from "react";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from "@mui/icons-material/Close";
import ThemeToggle from "../layout/ThemeToggle";
import fixieLogo from "../../images/image.png"; // Reusing the logo from ChatMessage
import "../../styles/Dashboard.css";

type DashboardHeaderProps = {
    isSidebarOpen: boolean;
    activeTab: "chat" | "organization" | "tools";
    setActiveTab: (tab: "chat" | "organization" | "tools") => void;
    userRole: string | null;
    toggleSidebar: () => void;
    username: string | null;
};

const DashboardHeader = ({ activeTab, setActiveTab, userRole, toggleSidebar, isSidebarOpen, username }: DashboardHeaderProps) => {
    return (
        <header className="dashboard-header">
            <div className="header-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? (
                    <CloseIcon fontSize="small" />
                ) : (
                    <MenuIcon fontSize="small" />
                )}
                    
                </button>
                
                {/* BRAND LOGO & NAME SECTION */}
                <div className="header-brand">
                    <img src={fixieLogo} alt="Fixie Logo" className="header-logo" />
                    <span className="header-title">Fixie</span>
                    <span className="hidden-mobile text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border border-indigo-500/30 text-indigo-500 bg-indigo-500/5 ml-1">AI</span>
                </div>

                <nav className="header-tabs hidden-mobile">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
                    >
                        Chats
                    </button>

                    {userRole === "admin" && (
                        <>
                            <button
                                onClick={() => setActiveTab("organization")}
                                className={`tab-btn ${activeTab === "organization" ? "active" : ""}`}
                            >
                                Organizations
                            </button>

                            <button
                                onClick={() => setActiveTab("tools")}
                                className={`tab-btn ${activeTab === "tools" ? "active" : ""}`}
                            >
                                Tools
                            </button>
                        </>
                    )}
                </nav>
            </div>

            <div className="header-right">
                {username && (
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hidden-mobile">
                        Welcome, <span className="font-bold text-neutral-900 dark:text-white">{username}</span>
                    </span>
                )}
                <ThemeToggle />
            </div>
        </header>
    );
};

export default DashboardHeader;