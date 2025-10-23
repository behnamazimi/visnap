import React, { useState } from "react";
import "./button.css";
import "./form.css";

export interface FormProps {
  /** Form title */
  title?: string;
  /** Whether to show success message after submit */
  showSuccess?: boolean;
}

/** Example form component for demonstrating interactions */
export const Form = ({
  title = "Contact Form",
  showSuccess = false,
}: FormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted && showSuccess) {
    return (
      <div className="form-success">
        <h2>Success!</h2>
        <p>Thank you for your submission.</p>
        <button onClick={() => setSubmitted(false)}>Reset Form</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="example-form">
      <h2>{title}</h2>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="country">Country:</label>
        <select
          id="country"
          name="country"
          value={country}
          onChange={e => setCountry(e.target.value)}
        >
          <option value="">Select a country</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="uk">United Kingdom</option>
          <option value="de">Germany</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={newsletter}
            onChange={e => setNewsletter(e.target.checked)}
          />
          Subscribe to newsletter
        </label>
      </div>

      <button
        type="submit"
        className="storybook-button storybook-button--primary"
      >
        Submit
      </button>
    </form>
  );
};
