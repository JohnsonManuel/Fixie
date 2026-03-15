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
  // multi-value (new)
  categories?: string[];
  subcategories?: string[];
  // single-value legacy fallback
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

const ALL_CATEGORIES = Object.keys(TOOL_CATEGORIES);
const ALL_SUBCATEGORIES = Object.values(TOOL_CATEGORIES).flat();

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

// Normalise legacy single-value fields to arrays
const normCategories = (t: ConfiguredTool): string[] =>
  t.categories?.length ? t.categories : t.category ? [t.category] : [];
const normSubcategories = (t: ConfiguredTool): string[] =>
  t.subcategories?.length ? t.subcategories : t.subcategory ? [t.subcategory] : [];

// ─── Multi-select checkbox panel ──────────────────────────────────────────
function CheckboxPanel({
  label,
  options,
  selected,
  onChange,
  disabled = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const allSelected = selected.length === options.length && options.length > 0;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options]);
  };

  const toggle = (val: string) => {
    onChange(
      selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]
    );
  };

  return (
    <div className={`space-y-2 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label} *</span>
        {selected.length > 0 && (
          <span className="text-[10px] text-indigo-400 font-medium">
            {selected.length} selected
          </span>
        )}
      </div>

      <div className="border border-gray-600 rounded-lg overflow-hidden">
        {/* Select All row */}
        <label className="flex items-center gap-3 px-3 py-2 bg-gray-800/60 cursor-pointer hover:bg-gray-800 border-b border-gray-700 select-none">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={toggleAll}
            className="w-3.5 h-3.5 rounded accent-indigo-500"
          />
          <span className="text-xs font-semibold text-gray-300">Select All</span>
        </label>

        {/* Individual options */}
        <div className="max-h-44 overflow-y-auto divide-y divide-gray-700/50">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-700/30 select-none"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-3.5 h-3.5 rounded accent-indigo-500 shrink-0"
              />
              <span className="text-xs text-gray-200">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Category badge ────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium ${
        CATEGORY_COLORS[category] ?? "bg-gray-800 text-gray-300 border-gray-600"
      }`}
    >
      {category}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────
export default function OrganizationTools({
  organizationId,
  organizationDomain,
  userEmail,
}: OrganizationToolsProps) {
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [configuredTools, setConfiguredTools] = useState<ConfiguredTool[]>([]);
  const [loading, setLoading] = useState(false);

  const [connectionName, setConnectionName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  const [selectedToolSlug, setSelectedToolSlug] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  // Subcategory options = union of all subcategories from selected categories
  const subcategoryOptions = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return selectedCategories.flatMap((cat) => TOOL_CATEGORIES[cat] ?? []);
  }, [selectedCategories]);

  // When categories change, drop any subcategory that's no longer valid
  const handleCategoriesChange = (cats: string[]) => {
    setSelectedCategories(cats);
    const validSubs = cats.flatMap((c) => TOOL_CATEGORIES[c] ?? []);
    setSelectedSubcategories((prev) => prev.filter((s) => validSubs.includes(s)));
  };

  // ----------------------------
  // Load available tools
  // ----------------------------
  const loadAvailableTools = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "tools"));
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
  // Load configured tools
  // ----------------------------
  const loadConfiguredTools = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "organizationToolMap"),
        where("organizationId", "==", organizationId)
      );
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

  useEffect(() => { loadAvailableTools(); }, [loadAvailableTools]);
  useEffect(() => {
    loadConfiguredTools();
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, loadConfiguredTools]);

  const getToolDefinition = useCallback(
    (slug: string) => availableTools.find((t) => t.slug === slug),
    [availableTools]
  );

  const selectedTool = useMemo(
    () => (selectedToolSlug ? getToolDefinition(selectedToolSlug) : null),
    [selectedToolSlug, getToolDefinition]
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
    setSelectedCategories([]);
    setSelectedSubcategories([]);
  };

  const handleToolSelect = (slug: string) => {
    setSelectedToolSlug(slug);
    setFormError("");
    const toolDef = getToolDefinition(slug);
    if (!toolDef) { setFormData({}); return; }
    const initialData: Record<string, string> = {};
    (toolDef.fields || []).forEach((f) => { initialData[f.key] = ""; });
    setFormData(initialData);
  };

  const validateForm = (): boolean => {
    if (!selectedToolSlug) { setFormError("Please select a tool"); return false; }
    if (!connectionName.trim()) { setFormError("Connection Name is required"); return false; }
    if (selectedCategories.length === 0) { setFormError("Please select at least one category"); return false; }
    if (selectedSubcategories.length === 0) { setFormError("Please select at least one subcategory"); return false; }
    const toolDef = getToolDefinition(selectedToolSlug);
    if (!toolDef) { setFormError("Invalid tool selected"); return false; }
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
        categories: selectedCategories,
        subcategories: selectedSubcategories,
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
      await updateDoc(doc(db, "organizationToolMap", editingToolId), {
        connectionName: connectionName.trim(),
        categories: selectedCategories,
        subcategories: selectedSubcategories,
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

  const handleEditTool = (t: ConfiguredTool) => {
    setEditingToolId(t.id);
    setSelectedToolSlug(t.toolSlug);
    setConnectionName(t.connectionName || "");
    setSelectedCategories(normCategories(t));
    setSelectedSubcategories(normSubcategories(t));

    const toolDef = getToolDefinition(t.toolSlug);
    const next: Record<string, string> = {};
    (toolDef?.fields || []).forEach((f) => { next[f.key] = t.credentials?.[f.key] ?? ""; });
    Object.entries(t.credentials || {}).forEach(([k, v]) => { if (next[k] === undefined) next[k] = v ?? ""; });
    setFormData(next);
    setShowForm(true);
    setFormError("");
  };

  const inputClass =
    "w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-gray-400";

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
            Manage Integration Tools — set categories &amp; subcategories so tickets are routed automatically
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
                className={inputClass}
              >
                <option value="">-- Choose a tool --</option>
                {availableTools.map((tool) => (
                  <option key={tool.slug} value={tool.slug}>{tool.name}</option>
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
                  className={inputClass}
                />
              </div>

              {/* ── Issue Routing ─────────────────────────────────────────── */}
              <div className="border border-gray-700 rounded-lg p-4 space-y-5 bg-[var(--bg-primary)]">
                <div>
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                    Issue Routing — Categories &amp; Subcategories
                  </p>
                  <p className="text-xs text-gray-400">
                    Select all issue types this tool handles. Fixie will automatically route matching tickets here.
                  </p>
                </div>

                {/* Categories multi-select */}
                <CheckboxPanel
                  label="Categories"
                  options={ALL_CATEGORIES}
                  selected={selectedCategories}
                  onChange={handleCategoriesChange}
                />

                {/* Subcategories multi-select */}
                <CheckboxPanel
                  label="Subcategories"
                  options={subcategoryOptions}
                  selected={selectedSubcategories}
                  onChange={setSelectedSubcategories}
                  disabled={selectedCategories.length === 0}
                />

                {selectedCategories.length === 0 && (
                  <p className="text-xs text-gray-500 -mt-2">Select at least one category to see subcategories.</p>
                )}

                {/* Summary badges */}
                {selectedCategories.length > 0 && selectedSubcategories.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-gray-400">Will handle:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategories.length === ALL_CATEGORIES.length ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-indigo-600 text-[10px] font-medium text-indigo-300 bg-indigo-900/30">
                          All Categories
                        </span>
                      ) : (
                        selectedCategories.map((c) => <CategoryBadge key={c} category={c} />)
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSubcategories.length === ALL_SUBCATEGORIES.length ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-600 text-[10px] font-medium text-gray-300 bg-gray-800">
                          All Subcategories
                        </span>
                      ) : (
                        selectedSubcategories.map((s) => (
                          <span key={s} className="inline-flex items-center px-2 py-0.5 rounded border border-gray-600 text-[10px] font-medium text-gray-300 bg-gray-800">
                            {s}
                          </span>
                        ))
                      )}
                    </div>
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={`${inputClass} ${isSecretField(field) ? "font-mono" : ""}`}
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

      {/* ── Configured Tools List ──────────────────────────────────────────── */}
      <div className="border border-gray-700 rounded-xl p-6 shadow-md bg-[var(--bg-secondary)]">
        <h3 className="text-lg font-medium mb-5">🛠️ Configured Tools</h3>

        {loading && !showForm ? (
          <p className="text-gray-400 text-sm text-center py-6">Loading tools...</p>
        ) : configuredTools.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-600 rounded-lg">
            No tools configured yet. Click "Add Tool" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {configuredTools.map((t) => {
              const toolDef = getToolDefinition(t.toolSlug);
              const cats = normCategories(t);
              const subs = normSubcategories(t);

              return (
                <div
                  key={t.id}
                  className="px-4 py-4 rounded-md bg-[var(--bg-primary)] border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      {/* Tool name */}
                      <h4 className="text-sm font-semibold mb-2">
                        {t.toolName}{t.connectionName ? ` — ${t.connectionName}` : ""}
                      </h4>

                      {/* Category badges */}
                      {cats.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {cats.map((c) => <CategoryBadge key={c} category={c} />)}
                        </div>
                      )}

                      {/* Subcategory badges */}
                      {subs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {subs.map((s) => (
                            <span key={s} className="inline-flex items-center px-2 py-0.5 rounded border border-gray-700 text-[10px] text-gray-400 bg-gray-800/50">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Credentials */}
                      <div className="space-y-1 mt-2">
                        {(toolDef?.fields || []).map((field) => {
                          const value = t.credentials?.[field.key] ?? "";
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
                          <div className="text-xs text-gray-500">Tool schema not found for slug: {t.toolSlug}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button onClick={() => handleEditTool(t)} className="text-gray-400 hover:text-indigo-400 transition" title="Edit tool">
                        <EditIcon fontSize="small" />
                      </button>
                      <button onClick={() => handleDeleteTool(t.id)} className="text-gray-400 hover:text-red-400 transition" title="Delete tool">
                        <DeleteOutlineIcon fontSize="small" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
