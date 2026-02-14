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
};

const DashboardHeader = ({ activeTab, setActiveTab, userRole, toggleSidebar ,isSidebarOpen }: DashboardHeaderProps) => {
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
                <ThemeToggle />
            </div>
        </header>
    );
};

export default DashboardHeader;