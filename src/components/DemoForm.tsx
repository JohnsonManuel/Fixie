import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/DemoForm.css';

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
      // Save to Firestore
      await addDoc(collection(db, 'demo-requests'), {
        ...formData,
        submittedAt: new Date().toISOString(),
        timestamp: Date.now()
      });
      
      console.log('Demo form submitted and saved:', formData);
      setIsSubmitted(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onBackToHome();
      }, 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      // Still show success message even if save fails
      setIsSubmitted(true);
      setTimeout(() => {
        onBackToHome();
      }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <div className="demo-form-overlay">
        <div className="demo-form-container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Thank you!</h2>
            <p>We will contact you soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-form-overlay">
      <div className="demo-form-container">
        <button className="close-button" onClick={onBackToHome}>×</button>
        <h2>Book a Demo</h2>
        <form onSubmit={handleSubmit} className="demo-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="organization">Organization *</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="number">Phone Number (Optional)</label>
            <input
              type="tel"
              id="number"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="comment">Comment (Optional)</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default DemoForm;