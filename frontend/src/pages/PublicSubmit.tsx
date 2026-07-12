import { useState } from 'react';
import { Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PublicSubmit() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      let photoBase64 = '';
      if (file) {
        photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        payload.photoBase64 = photoBase64;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>জরুরী সহায়তা রিপোর্ট করুন<br/><span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>(Report an Emergency)</span></h2>
        <p style={{ color: 'var(--text-secondary)' }}>আপনার রিপোর্টটি এআই (AI) এর মাধ্যমে সরাসরি উদ্ধারকর্মীদের কাছে পৌঁছে যাবে।</p>
      </div>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>নাম / Name (Optional)</label>
        <input name="name" type="text" className="input-field" placeholder="আপনার নাম" />
        
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>যোগাযোগের নম্বর / Contact Number (Required)</label>
        <input name="contact" type="text" className="input-field" required placeholder="017XXXXX..." />

        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>সঠিক লোকেশন / Exact Location (Required)</label>
        <input name="location" type="text" className="input-field" required placeholder="হালিশহর, চট্টগ্রাম (Halisahar, CTG)" />

        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>বর্তমান অবস্থা / Describe Situation (Required)</label>
        <textarea name="description" className="input-field" rows={4} required placeholder="পানির উচ্চতা কত? কতজন আটকে আছেন? (Water level? How many trapped?)" style={{ resize: 'vertical' }}></textarea>

        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ছবি / Photo (Optional)</label>
        <input name="photo" type="file" accept="image/*" className="input-field" style={{ padding: '0.5rem' }} />

        <input type="hidden" name="language" value="bn" />

        <button type="submit" className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }} disabled={loading}>
          {loading ? (
            'প্রসেস হচ্ছে... (Processing...)'
          ) : (
            <>রিপোর্ট জমা দিন (Submit) <Send size={18} /></>
          )}
        </button>
      </form>

      {result && (
        <div className="glass animate-fade-in" style={{ marginTop: '2rem', padding: '1.5rem', borderLeft: `4px solid var(--${result.urgency})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {result.possibleDuplicate ? <AlertTriangle color="var(--medium)" /> : <CheckCircle2 color="var(--low)" />}
            <h3 style={{ margin: 0 }}>রিপোর্ট সফলভাবে জমা হয়েছে (Submitted Successfully)</h3>
          </div>
          <div style={{ display: 'grid', gap: '1rem', color: 'var(--text-secondary)' }}>
            <p><strong>AI Summary:</strong> {result.summary}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '0.875rem' }}>
                Category: <strong style={{ color: 'var(--text-primary)' }}>{result.category}</strong>
              </span>
              <span style={{ padding: '0.25rem 0.75rem', background: `var(--${result.urgency})`, color: 'white', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {result.urgency} Urgency
              </span>
            </div>
            {result.possibleDuplicate && (
              <p style={{ color: 'var(--medium)', fontSize: '0.875rem', margin: 0 }}>
                ⚠️ Warning: A highly similar report was recently filed. Rescue teams may already be aware.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
