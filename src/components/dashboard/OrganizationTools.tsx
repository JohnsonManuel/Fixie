import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

type ToolFieldType = "text" | "url" | "secret";

interface ToolField {
  key: string;
  label: string;
  type: ToolFieldType;
  required?: boolean;
  isSecret?: boolean;
}

interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  fields: ToolField[];
}

interface ConfiguredTool {
  id: string;
  organizationId: string;
  toolSlug: string;
  toolName: string;
  connectionName?: string;
  category?: string;
  subcategory?: string;
  credentials: Record<string, string>;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  updatedBy?: string;
}

interface OrganizationToolsProps {
  organizationId: string;
  organizationDomain: string;
  userEmail: string;
}

// ─── Industry-standard IT categories & subcategories ───────────────────────
const TOOL_CATEGORIES: Record<string, string[]> = {
  "Hardware": [
    "Desktop & Laptop",
    "Printer & Scanner",
    "Mobile Device",
    "Peripherals & Accessories",
    "Server Hardware",
    "Network Equipment",
    "Audio / Video Equipment",
  ],
  "Software & Applications": [
    "Operating System",
    "Business Application",
    "Security Software",
    "Development Tools",
    "Email Client",
    "Collaboration Tools",
    "ERP / CRM",
  ],
  "Network & Connectivity": [
    "Internet Access",
    "VPN & Remote Access",
    "Wi-Fi",
    "LAN / Ethernet",
    "Firewall & Proxy",
    "DNS & DHCP",
    "Load Balancer",
  ],
  "Security & Compliance": [
    "Account Lockout",
    "Malware & Virus",
    "Phishing & Spam",
    "Unauthorized Access",
    "Data Breach",
    "Password Reset",
    "Compliance & Audit",
  ],
  "User Account & Access": [
    "New User Onboarding",
    "Account Deactivation",
    "Permission Change",
    "MFA Setup",
    "SSO Issues",
    "Directory Services",
    "Role & Group Management",
  ],
  "Email & Communication": [
    "Email Delivery Issues",
    "Calendar Sync",
    "Distribution Lists",
    "Spam Filter",
    "Video Conferencing",
    "Instant Messaging",
    "Voicemail & Phone",
  ],
  "Cloud & SaaS": [
    "Microsoft 365",
    "Google Workspace",
    "Zoom",
    "Slack",
    "Salesforce",
    "AWS / Azure / GCP",
    "Other SaaS",
  ],
  "Data & Storage": [
    "File Recovery",
    "Backup Failure",
    "Storage Quota",
    "Database Issues",
    "File Sharing & Permissions",
    "Data Migration",
  ],
  "Service Requests": [
    "New Equipment Request",
    "Software License Request",
    "Access Request",
    "Asset Return",
    "Vendor Onboarding",
  ],
  "General IT Support": [
    "Tier 1 – Basic Support",
    "Tier 2 – Advanced Support",
    "Tier 3 – Escalation",
    "Training Request",
    "Incident Management",
    "Change Management",
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  "Hardware": "bg-amber-900/30 text-amber-300 border-amber-700",
  "Software & Applications": "bg-blue-900/30 text-blue-300 border-blue-700",
  "Network & Connectivity": "bg-cyan-900/30 text-cyan-300 border-cyan-700",
  "Security & Compliance": "bg-red-900/30 text-red-300 border-red-700",
  "User Account & Access": "bg-purple-900/30 text-purple-300 border-purple-700",
  "Email & Communication": "bg-green-900/30 text-green-300 border-green-700",
  "Cloud & SaaS": "bg-sky-900/30 text-sky-300 border-sky-700",
  "Data & Storage": "bg-orange-900/30 text-orange-300 border-orange-700",
  "Service Requests": "bg-teal-900/30 text-teal-300 border-teal-700",
  "General IT Support": "bg-gray-800 text-gray-300 border-gray-600",
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const isSecretField = (f: ToolField) => f.type === "secret" || f.isSecret === true;
const looksLikeUrl = (v: string) =>
  /^(https?:\/\/|www\.)[^\s]+$/i.test(v.trim()) ||
  /^[a-z0-9-]+(\.[a-z0-9-]+)+\.[a-z]{2,}(\/\S*)?$/i.test(v.trim());

export default function OrganizationTools({
  organizationId,
  organizationDomain,
  userEmail,
}: OrganizationToolsProps) {
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [configuredTools, setConfiguredTools] = useState<ConfiguredTool[]>([]);
  const [loading, setLoading] = useState(false);

  const [connectionName, setConnectionName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  // Form state
  const [selectedToolSlug, setSelectedToolSlug] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  // ----------------------------
  // Load available tools (catalog) from Firestore: /tools
  // ----------------------------
  const loadAvailableTools = useCallback(async () => {
    try {
      const toolsRef = collection(db, "tools");
      const snapshot = await getDocs(toolsRef);

      const loaded: ToolDefinition[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          slug: data.slug ?? d.id,
          name: data.name ?? d.id,
          fields: Array.isArray(data.fields) ? (data.fields as ToolField[]) : [],
        };
      });

      loaded.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableTools(loaded);
    } catch (error) {
      console.error("Error loading available tools:", error);
    }
  }, []);

  // ----------------------------
  // Load configured tools for this org from Firestore: /organizationToolMap
  // ----------------------------
  const loadConfiguredTools = useCallback(async () => {
    setLoading(true);
    try {
      const mapRef = collection(db, "organizationToolMap");
      const q = query(mapRef, where("organizationId", "==", organizationId));
      const snapshot = await getDocs(q);

      const loaded = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as ConfiguredTool[];

      loaded.sort((a, b) => {
        const toolCmp = (a.toolName || "").localeCompare(b.toolName || "");
        if (toolCmp !== 0) return toolCmp;
        return (a.connectionName || "").localeCompare(b.connectionName || "");
      });

      setConfiguredTools(loaded);
    } catch (error) {
      console.error("Error loading configured tools:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadAvailableTools();
  }, [loadAvailableTools]);

  useEffect(() => {
    loadConfiguredTools();
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, loadConfiguredTools]);

  // ----------------------------
  // Helpers
  // ----------------------------
  const getToolDefinition = useCallback(
    (slug: string) => availableTools.find((t) => t.slug === slug),
    [availableTools]
  );

  const selectedTool = useMemo(
    () => (selectedToolSlug ? getToolDefinition(selectedToolSlug) : null),
    [selectedToolSlug, getToolDefinition]
  );

  const subcategoryOptions = useMemo(
    () => (selectedCategory ? TOOL_CATEGORIES[selectedCategory] ?? [] : []),
    [selectedCategory]
  );

  // ----------------------------
  // Form ops
  // ----------------------------
  const resetForm = () => {
    setSelectedToolSlug("");
    setFormData({});
    setFormError("");
    setShowForm(false);
    setEditingToolId(null);
    setConnectionName("");
    setSelectedCategory("");
    setSelectedSubcategory("");
  };

  const handleToolSelect = (slug: string) => {
    setSelectedToolSlug(slug);
    setFormError("");

    const toolDef = getToolDefinition(slug);
    if (!toolDef) {
      setFormData({});
      return;
    }

    const initialData: Record<string, string> = {};
    (toolDef.fields || []).forEach((field) => {
      initialData[field.key] = "";
    });
    setFormData(initialData);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory("");
  };

  const validateForm = (): boolean => {
    if (!selectedToolSlug) {
      setFormError("Please select a tool");
      return false;
    }
    if (!connectionName.trim()) {
      setFormError("Connection Name is required");
      return false;
    }
    if (!selectedCategory) {
      setFormError("Please select a category");
      return false;
    }
    if (!selectedSubcategory) {
      setFormError("Please select a subcategory");
      return false;
    }

    const toolDef = getToolDefinition(selectedToolSlug);
    if (!toolDef) {
      setFormError("Invalid tool selected");
      return false;
    }

    for (const field of toolDef.fields || []) {
      if (field.required && !formData[field.key]?.trim()) {
        setFormError(`${field.label} is required`);
        return false;
      }
    }

    return true;
  };

  const handleCreateTool = async () => {
    setFormError("");
    if (!validateForm()) return;

    const toolDef = getToolDefinition(selectedToolSlug);
    if (!toolDef) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "organizationToolMap"), {
        organizationId,
        toolSlug: selectedToolSlug,
        toolName: toolDef.name,
        connectionName: connectionName.trim(),
        category: selectedCategory,
        subcategory: selectedSubcategory,
        credentials: formData,
        createdAt: serverTimestamp(),
        createdBy: userEmail,
        updatedAt: serverTimestamp(),
        updatedBy: userEmail,
      });

      await loadConfiguredTools();
      resetForm();
    } catch (error) {
      console.error("Error creating tool configuration:", error);
      setFormError("Failed to configure tool");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTool = async () => {
    if (!editingToolId) return;
    setFormError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const toolRef = doc(db, "organizationToolMap", editingToolId);
      await updateDoc(toolRef, {
        connectionName: connectionName.trim(),
        category: selectedCategory,
        subcategory: selectedSubcategory,
        credentials: formData,
        updatedAt: serverTimestamp(),
        updatedBy: userEmail,
      });

      await loadConfiguredTools();
      resetForm();
    } catch (error) {
      console.error("Error updating tool configuration:", error);
      setFormError("Failed to update tool");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!window.confirm("Are you sure you want to delete this tool configuration?")) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "organizationToolMap", toolId));
      await loadConfiguredTools();
    } catch (error) {
      console.error("Error deleting tool configuration:", error);
      alert("Failed to delete tool configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTool = (configuredTool: ConfiguredTool) => {
    setEditingToolId(configuredTool.id);
    setSelectedToolSlug(configuredTool.toolSlug);
    setConnectionName(configuredTool.connectionName || "");
    setSelectedCategory(configuredTool.category || "");
    setSelectedSubcategory(configuredTool.subcategory || "");

    const toolDef = getToolDefinition(configuredTool.toolSlug);
    const next: Record<string, string> = {};

    (toolDef?.fields || []).forEach((field) => {
      next[field.key] = configuredTool.credentials?.[field.key] ?? "";
    });
    Object.entries(configuredTool.credentials || {}).forEach(([k, v]) => {
      if (next[k] === undefined) next[k] = v ?? "";
    });

    setFormData(next);
    setShowForm(true);
    setFormError("");
  };

  // ----------------------------
  // Render helpers
  // ----------------------------
  const selectClass =
    "w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-primary)] text-[var(--text-primary)]";

  const CategoryBadge = ({ category }: { category: string }) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium ${
        CATEGORY_COLORS[category] ?? "bg-gray-800 text-gray-300 border-gray-600"
      }`}
    >
      {category}
    </span>
  );

  // Group configured tools by category for display
  const groupedTools = useMemo(() => {
    const groups: Record<string, ConfiguredTool[]> = {};
    configuredTools.forEach((t) => {
      const cat = t.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [configuredTools]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">🌐 {organizationDomain}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage Integration Tools — set category &amp; subcategory so tickets are routed automatically
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            <AddIcon fontSize="small" /> Add Tool
          </button>
        )}
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="border border-gray-700 rounded-xl p-6 shadow-lg bg-[var(--bg-secondary)] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {editingToolId ? "Edit Tool Configuration" : "Add New Tool"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-200 text-sm">
              Cancel
            </button>
          </div>

          {formError && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-2 rounded-md text-sm">
              {formError}
            </div>
          )}

          {/* Tool Selection */}
          {!editingToolId && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Tool *</label>
              <select
                value={selectedToolSlug}
                onChange={(e) => handleToolSelect(e.target.value)}
                className={selectClass}
              >
                <option value="">-- Choose a tool --</option>
                {availableTools.map((tool) => (
                  <option key={tool.slug} value={tool.slug}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTool && (
            <>
              {/* Connection Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Connection Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Freshdesk – IT Helpdesk"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  className={`${selectClass} placeholder-gray-400`}
                />
              </div>

              {/* ── Category & Subcategory ─────────────────────────────── */}
              <div className="border border-gray-700 rounded-lg p-4 space-y-4 bg-[var(--bg-primary)]">
                <div>
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                    Issue Routing — Category &amp; Subcategory
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Tell Fixie which type of issues this tool handles. When a user reports a problem,
                    the AI will automatically route the ticket here — no need to ask them.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">-- Select category --</option>
                      {Object.keys(TOOL_CATEGORIES).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Subcategory *</label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      disabled={!selectedCategory}
                      className={`${selectClass} disabled:opacity-50`}
                    >
                      <option value="">
                        {selectedCategory ? "-- Select subcategory --" : "Select a category first"}
                      </option>
                      {subcategoryOptions.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCategory && selectedSubcategory && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs text-gray-400">Will handle:</span>
                    <CategoryBadge category={selectedCategory} />
                    <span className="text-gray-500 text-xs">›</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-600 text-[10px] font-medium text-gray-300 bg-gray-800">
                      {selectedSubcategory}
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic credential fields */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Configure {selectedTool.name} credentials</p>
                <div className="space-y-3">
                  {selectedTool.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-2">
                        {field.label} {field.required && "*"}
                      </label>
                      <input
                        type={isSecretField(field) ? "password" : "text"}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={formData[field.key] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className={`${selectClass} placeholder-gray-400 ${
                          isSecretField(field) ? "font-mono" : ""
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={editingToolId ? handleUpdateTool : handleCreateTool}
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium disabled:opacity-50"
              >
                {loading ? "Saving..." : editingToolId ? "Update Configuration" : "Add Tool"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Configured Tools List ─────────────────────────────────────────── */}
      <div className="border border-gray-700 rounded-xl p-6 shadow-md bg-[var(--bg-secondary)]">
        <h3 className="text-lg font-medium mb-5">🛠️ Configured Tools</h3>

        {loading && !showForm ? (
          <p className="text-gray-400 text-sm text-center py-6">Loading tools...</p>
        ) : configuredTools.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-600 rounded-lg">
            No tools configured yet. Click "Add Tool" to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTools).map(([category, tools]) => (
              <div key={category}>
                {/* Category group header */}
                <div className="flex items-center gap-3 mb-3">
                  <CategoryBadge category={category} />
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-xs text-gray-500">{tools.length} tool{tools.length > 1 ? "s" : ""}</span>
                </div>

                <div className="space-y-2">
                  {tools.map((configuredTool) => {
                    const toolDef = getToolDefinition(configuredTool.toolSlug);

                    return (
                      <div
                        key={configuredTool.id}
                        className="flex justify-between items-start px-4 py-3 rounded-md bg-[var(--bg-primary)] border border-gray-700"
                      >
                        <div className="flex-1 min-w-0">
                          {/* Tool name + subcategory badge */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className="text-sm font-semibold">
                              {configuredTool.toolName}
                              {configuredTool.connectionName
                                ? ` — ${configuredTool.connectionName}`
                                : ""}
                            </h4>
                            {configuredTool.subcategory && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-600 text-[10px] font-medium text-gray-400 bg-gray-800">
                                {configuredTool.subcategory}
                              </span>
                            )}
                          </div>

                          {/* Credentials */}
                          <div className="space-y-1">
                            {(toolDef?.fields || []).map((field) => {
                              const value = configuredTool.credentials?.[field.key] ?? "";
                              return (
                                <div key={field.key} className="text-xs">
                                  <span className="text-gray-400">{field.label}:</span>{" "}
                                  {isSecretField(field) ? (
                                    <span className="text-gray-300 font-mono">••••••••••••</span>
                                  ) : looksLikeUrl(value) ? (
                                    <a
                                      href={value.startsWith("http") ? value : `https://${value}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-400 hover:text-indigo-300 underline font-mono transition-colors"
                                    >
                                      {value}
                                    </a>
                                  ) : (
                                    <span className="text-gray-300 font-mono">{value}</span>
                                  )}
                                </div>
                              );
                            })}

                            {!toolDef && (
                              <div className="text-xs text-gray-500">
                                Tool schema not found for slug: {configuredTool.toolSlug}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <button
                            onClick={() => handleEditTool(configuredTool)}
                            className="text-gray-400 hover:text-indigo-400 transition"
                            title="Edit tool"
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => handleDeleteTool(configuredTool.id)}
                            className="text-gray-400 hover:text-red-400 transition"
                            title="Delete tool"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
