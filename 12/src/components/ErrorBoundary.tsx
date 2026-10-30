import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component<{ children: ReactNode; label: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <div className="glass-lux max-w-[420px] rounded-3xl p-8">
            <AlertTriangle className="mx-auto mb-3 text-amber-300" size={30} />
            <p className="font-display text-xl font-bold text-[#f3d894]">{this.props.label} mein kuch atak gaya</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              Koi baat nahi, jaan — ek refresh se sab theek ho jayega. (Error: {String(this.state.error.message || this.state.error).slice(0, 80)})
            </p>
            <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="btn-gold mx-auto mt-5 flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-bold">
              <RotateCcw size={14} /> Reload the magic
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
