import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface DemoFormProps {
  onBackToHome: () => void;
}

const DemoForm: React.FC<DemoFormProps> = ({ onBackToHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    number: '',
    comment: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'demo-requests'), {
        ...formData,
        submittedAt: new Date().toISOString(),
        timestamp: Date.now()
      });
      setIsSubmitted(true);
      setTimeout(() => { onBackToHome(); }, 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      setIsSubmitted(true);
      setTimeout(() => { onBackToHome(); }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 max-w-md w-[90%] text-center shadow-2xl border border-gray-100 dark:border-white/10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank you!</h2>
          <p className="text-gray-500 dark:text-gray-400">We will contact you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-lg w-[90%] max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-white/10">

        {/* Close button */}
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none transition-colors"
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-7 pr-8">
          <div className="w-10 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schedule a call with us
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Tell us a bit about yourself and we'll be in touch shortly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name + Organization side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Organization *
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
                placeholder="Acme Inc."
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Work Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="you@company.com"
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Phone <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="tel"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
              placeholder="+1 555 000 0000"
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Message <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={3}
              placeholder="Tell us about your IT challenges..."
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Schedule a call
          </button>
        </form>
      </div>
    </div>
  );
};

export default DemoForm;
