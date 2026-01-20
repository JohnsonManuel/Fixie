import React from "react";
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ThemeToggle from "../ThemeToggle";
import "../../styles/Dashboard.css";

type DashboardHeaderProps = {
    activeTab: "chat" | "organization" | "tools";
    setActiveTab: (tab: "chat" | "organization" | "tools") => void;
    userRole: string | null;
    logout: () => void;
    toggleSidebar: () => void;
};

const DashboardHeader = ({ activeTab, setActiveTab, userRole, logout, toggleSidebar }: DashboardHeaderProps) => {
    return (
        <header className="dashboard-header">
            <div className="header-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <MenuIcon fontSize="small" />
                </button>
                
                <h1>Fixie AI Support</h1>

                {/* Fixed: Replaced complex Tailwind divs with a clean nav container */}
                <nav className="header-tabs">
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
                <button className="logout-btn" onClick={logout} title="Sign out">
                    <LogoutIcon fontSize="small" /> 
                    <span className="logout-text">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;