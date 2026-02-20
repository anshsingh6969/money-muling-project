import { useState } from "react";
import { Send, Github, Mail, Shield, CheckCircle } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (form.name.trim().length > 100) errs.name = "Name must be under 100 characters.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.message.trim() || form.message.trim().length < 10) errs.message = "Message must be at least 10 characters.";
    if (form.message.trim().length > 1000) errs.message = "Message must be under 1000 characters.";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitted(true);
    // In production, this would call an API
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="w-4 h-px bg-cyber" /> CONTACT
          </div>
          <h1 className="font-mono font-bold text-2xl text-foreground">Get In Touch</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Questions or feedback?

          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 forensics-panel p-6">
            {submitted ?
            <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-normal mx-auto mb-4" />
                <h2 className="font-mono font-bold text-foreground mb-2">Message Sent!</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  Thank you for reaching out. We'll respond as soon as possible.
                </p>
                <button
                onClick={() => {setSubmitted(false);setForm({ name: "", email: "", message: "" });}}
                className="mt-6 px-4 py-2 border border-cyber/40 text-cyber rounded font-mono text-xs hover:bg-cyber/10 transition-colors">

                  Send Another Message
                </button>
              </div> :

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-wider uppercase">
                    Name
                  </label>
                  <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Your full name"
                  className={`w-full bg-secondary border rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors ${
                  errors.name ?
                  "border-suspicious focus:ring-suspicious" :
                  "border-border focus:border-cyber focus:ring-cyber"}`
                  } />

                  {errors.name && <p className="mt-1 text-xs font-mono text-suspicious">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-wider uppercase">
                    Email
                  </label>
                  <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full bg-secondary border rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors ${
                  errors.email ?
                  "border-suspicious focus:ring-suspicious" :
                  "border-border focus:border-cyber focus:ring-cyber"}`
                  } />

                  {errors.email && <p className="mt-1 text-xs font-mono text-suspicious">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-wider uppercase">
                    Message
                  </label>
                  <textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Describe your question or feedback…"
                  rows={5}
                  className={`w-full bg-secondary border rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors resize-none ${
                  errors.message ?
                  "border-suspicious focus:ring-suspicious" :
                  "border-border focus:border-cyber focus:ring-cyber"}`
                  } />

                  <div className="flex justify-between mt-1">
                    {errors.message ?
                  <p className="text-xs font-mono text-suspicious">{errors.message}</p> :
                  <span />}
                    <p className="text-xs font-mono text-muted-foreground/50">{form.message.length}/1000</p>
                  </div>
                </div>

                <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyber text-panel font-mono font-bold tracking-wider rounded-lg hover:bg-cyber/90 transition-all duration-200 shadow-glow-cyan">

                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            }
          </div>

          {/* Info panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Project info */}
            <div className="forensics-panel p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-cyber" />
                <h2 className="font-mono font-bold text-sm text-foreground">Project Info</h2>
              </div>
              <div className="space-y-2 text-xs font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>Project</span>
                  <span className="text-foreground">Invivious Forensics</span>
                </div>
                <div className="flex justify-between">
                  
                  
                </div>
                <div className="flex justify-between">
                  <span>Category</span>
                  <span className="text-foreground">Financial Crime</span>
                </div>
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="text-normal">v1.0.0</span>
                </div>
              </div>
            </div>

            {/* GitHub */}
            <div className="forensics-panel p-5">
              <div className="flex items-center gap-2 mb-3">
                <Github className="w-5 h-5 text-cyber" />
                <h2 className="font-mono font-bold text-sm text-foreground">Repository</h2>
              </div>
              <p className="text-xs font-mono text-muted-foreground mb-3">
                Source code and documentation for the RIFT 2026 Money Muling Detection Engine.
              </p>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-cyber/30 text-cyber rounded font-mono text-xs hover:bg-cyber/10 transition-colors">

                <Github className="w-3.5 h-3.5" />
                View on GitHub (RIFT 2026)
              </a>
            </div>

            {/* Contact info */}
            <div className="forensics-panel p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-cyber" />
                <h2 className="font-mono font-bold text-sm text-foreground">Invidious Reference</h2>
              </div>
              <div className="space-y-1 text-xs font-mono text-muted-foreground">
                <p className="text-foreground font-bold my-[0.1px]">
                </p>
                <p>Financial Crime Detection Track</p>
                <p className="text-cyber">Money Muling Detection Engine</p>
                <p className="mt-2 text-muted-foreground/60">
                  Graph-based transaction analysis using cycle detection, smurfing identification, and shell network mapping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyber" />
            <span>Digital Forensics Investigation Workspace    2026</span>
          </div>
          <span>Money Muling Detection Engine · Built with React & Cytoscape.js</span>
        </div>
      </div>
    </div>);
}