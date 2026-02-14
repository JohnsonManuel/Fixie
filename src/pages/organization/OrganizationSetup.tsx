import React, { useState } from "react";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const OrganizationSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const storage = getStorage();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    orgName: "",
    orgEmail: "",
    knowledgeBaseFile: null as File | null,
    userEmails: [""],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handle file upload selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setForm({ ...form, knowledgeBaseFile: file });
  };

  // manage user emails
  const handleUserEmailChange = (index: number, value: string) => {
    const updated = [...form.userEmails];
    updated[index] = value;
    setForm({ ...form, userEmails: updated });
  };

  const addUserEmailField = () => {
    setForm({ ...form, userEmails: [...form.userEmails, ""] });
  };

  const removeUserEmailField = (index: number) => {
    const updated = form.userEmails.filter((_, i) => i !== index);
    setForm({ ...form, userEmails: updated });
  };

  // handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in as an admin.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let fileUrl = "";
      if (form.knowledgeBaseFile) {
        const fileRef = ref(storage, `knowledge_base/${user.uid}/${form.knowledgeBaseFile.name}`);
        await uploadBytes(fileRef, form.knowledgeBaseFile);
        fileUrl = await getDownloadURL(fileRef);
      }

      // Create organization record
      const orgData = {
        adminId: user.uid,
        firstName: form.firstName,
        lastName: form.lastName,
        organizationName: form.orgName,
        organizationEmail: form.orgEmail,
        knowledgeBaseFileUrl: fileUrl,
        invitedUsers: form.userEmails.filter((email) => email.trim() !== ""),
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      const orgRef = doc(db, "organizations", user.uid);
      await setDoc(orgRef, orgData);

      // Update admin profile
      await updateDoc(doc(db, "users", user.uid), {
        profileComplete: true,
        organizationId: user.uid,
      });

      setSuccess("Organization setup completed successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organization-setup-page bg-white dark:bg-neutral-900 min-h-screen py-10 px-6">
      <div className="max-w-3xl mx-auto shadow-lg rounded-2xl p-8 bg-gray-50 dark:bg-neutral-800">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-900 dark:text-white">
          Organization Setup
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Complete your organization details to start using Fixie.
        </p>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {success && <div className="text-green-500 text-center mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg bg-white dark:bg-neutral-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg bg-white dark:bg-neutral-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization Name</label>
            <input
              type="text"
              name="orgName"
              value={form.orgName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg bg-white dark:bg-neutral-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization Email</label>
            <input
              type="email"
              name="orgEmail"
              value={form.orgEmail}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg bg-white dark:bg-neutral-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Knowledge Base File</label>
            <input
              type="file"
              accept=".pdf,.csv,.docx,.txt"
              onChange={handleFileChange}
              className="w-full text-gray-600 dark:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">User Emails</label>
            {form.userEmails.map((email, index) => (
              <div key={index} className="flex items-center mb-2 gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleUserEmailChange(index, e.target.value)}
                  placeholder="Enter user email"
                  className="flex-1 p-2 border rounded-lg bg-white dark:bg-neutral-700 dark:text-white"
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeUserEmailField(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUserEmailField}
              className="text-indigo-600 font-medium hover:underline mt-1"
            >
              + Add another user
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizationSetup;
