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
  id: string; // Firestore doc id
  slug: string;
  name: string;
  fields: ToolField[];
}

interface ConfiguredTool {
  id: string;
  organizationId: string;
  toolSlug: string;
  toolName: string;
  connectionName?: string; // ✅ NEW
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

const isSecretField = (f: ToolField) => f.type === "secret" || f.isSecret === true;

export default function OrganizationTools({
  organizationId,
  organizationDomain,
  userEmail,
}: OrganizationToolsProps) {
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [configuredTools, setConfiguredTools] = useState<ConfiguredTool[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: connection name
  const [connectionName, setConnectionName] = useState("");

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

      // Sort by toolName + connectionName for stable UI
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

  // ----------------------------
  // Form ops
  // ----------------------------
  const resetForm = () => {
    setSelectedToolSlug("");
    setFormData({});
    setFormError("");
    setShowForm(false);
    setEditingToolId(null);
    setConnectionName(""); // ✅ NEW
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

  const validateForm = (): boolean => {
    if (!selectedToolSlug) {
      setFormError("Please select a tool");
      return false;
    }

    if (!connectionName.trim()) {
      setFormError("Connection Name is required");
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

  // Create new tool mapping doc in /organizationToolMap
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
        connectionName: connectionName.trim(), // ✅ NEW
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

  // Update mapping doc
  const handleUpdateTool = async () => {
    if (!editingToolId) return;

    setFormError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const toolRef = doc(db, "organizationToolMap", editingToolId);
      await updateDoc(toolRef, {
        connectionName: connectionName.trim(), // ✅ NEW
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

  // Delete mapping doc
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

  // Edit tool - populate form using stored credentials
  const handleEditTool = (configuredTool: ConfiguredTool) => {
    setEditingToolId(configuredTool.id);
    setSelectedToolSlug(configuredTool.toolSlug);

    // ✅ NEW
    setConnectionName(configuredTool.connectionName || "");

    const toolDef = getToolDefinition(configuredTool.toolSlug);
    const next: Record<string, string> = {};

    (toolDef?.fields || []).forEach((field) => {
      next[field.key] = configuredTool.credentials?.[field.key] ?? "";
    });

    // include any extra keys stored in credentials
    Object.entries(configuredTool.credentials || {}).forEach(([k, v]) => {
      if (next[k] === undefined) next[k] = v ?? "";
    });

    setFormData(next);
    setShowForm(true);
    setFormError("");
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">🌐 {organizationDomain}</h2>
          <p className="text-gray-400 text-sm mt-1">Manage Integration Tools & API Keys</p>
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

      {/* Form */}
      {showForm && (
        <div className="border border-gray-700 rounded-xl p-6 shadow-lg bg-[var(--bg-secondary)] space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              {editingToolId ? "Edit Tool Configuration" : "Add New Tool"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-200">
              Cancel
            </button>
          </div>

          {formError && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-2 rounded-md text-sm">
              {formError}
            </div>
          )}

          {/* Tool Selection (only for create) */}
          {!editingToolId && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Tool *</label>
              <select
                value={selectedToolSlug}
                onChange={(e) => handleToolSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
              >
                <option value="">-- Choose a tool --</option>
                {/* ✅ CHANGED: show ALL tools from Firestore */}
                {availableTools.map((tool) => (
                  <option key={tool.slug} value={tool.slug}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ✅ NEW: Connection Name */}
          {selectedTool && (
            <div>
              <label className="block text-sm font-medium mb-2">Connection Name *</label>
              <input
                type="text"
                placeholder="e.g., Freshdesk - IT Helpdesk"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
            </div>
          )}

          {/* Dynamic Fields */}
          {selectedTool && (
            <>
              <div className="text-sm text-gray-400 mb-2">Configure {selectedTool.name}</div>

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
                    className={`w-full px-4 py-2 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-primary)] text-[var(--text-primary)] ${
                      isSecretField(field) ? "font-mono" : ""
                    }`}
                  />
                </div>
              ))}

              <button
                onClick={editingToolId ? handleUpdateTool : handleCreateTool}
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium disabled:opacity-50"
              >
                {loading ? "Saving..." : editingToolId ? "Update Configuration" : "Add Tool"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Configured Tools List */}
      <div className="border border-gray-700 rounded-xl p-6 shadow-md bg-[var(--bg-secondary)]">
        <h3 className="text-lg font-medium mb-4">🛠️ Configured Tools</h3>

        {loading && !showForm ? (
          <p className="text-gray-400 text-sm text-center py-6">Loading tools...</p>
        ) : configuredTools.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-600 rounded-lg">
            No tools configured yet. Click "Add Tool" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {configuredTools.map((configuredTool) => {
              const toolDef = getToolDefinition(configuredTool.toolSlug);

              return (
                <div
                  key={configuredTool.id}
                  className="flex justify-between items-start px-4 py-3 rounded-md bg-[var(--bg-primary)] border border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold">
                        {configuredTool.toolName}
                        {configuredTool.connectionName
                          ? ` — ${configuredTool.connectionName}`
                          : ""}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      {(toolDef?.fields || []).map((field) => (
                        <div key={field.key} className="text-xs">
                          <span className="text-gray-400">{field.label}:</span>{" "}
                          <span className="text-gray-300 font-mono">
                            {isSecretField(field)
                              ? "••••••••••••"
                              : configuredTool.credentials?.[field.key] ?? ""}
                          </span>
                        </div>
                      ))}

                      {!toolDef && (
                        <div className="text-xs text-gray-500">
                          Tool schema not found in /tools for slug: {configuredTool.toolSlug}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
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
        )}
      </div>
    </div>
  );
}
