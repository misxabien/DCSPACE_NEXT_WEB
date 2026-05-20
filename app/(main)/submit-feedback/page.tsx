import type { Metadata } from 'next';
import '@/styles/pages/submit-feedback.css';

export const metadata: Metadata = {
  title: 'Submit Feedback - DC Space',
};

export default function SubmitFeedbackPage() {
  return (
    <main className="submit-feedback-page">
      <section className="submit-feedback-panel" aria-labelledby="submit-feedback-title">
        <h2 id="submit-feedback-title">Submit Feedback</h2>
        <p>
          Tell the admin team what happened with your event approval so they can review it.
        </p>
        <form className="submit-feedback-form">
          <label>
            <span>Event Name / Topic / Issue</span>
            <input type="text" name="feedback_topic" required />
          </label>
          <label>
            <span>Detailed Comment</span>
            <textarea name="feedback_comment" required />
          </label>
          <button type="submit">Submit</button>
        </form>
      </section>
    </main>
  );
}
