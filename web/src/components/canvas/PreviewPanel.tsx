"use client";

interface PreviewPanelProps {
  html: string | null;
  text: string | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
}

export function PreviewPanel({
  html,
  text,
  error,
  loading,
  onClose,
}: PreviewPanelProps) {
  if (!html && !text && !error && !loading) return null;

  return (
    <div className="absolute top-16 right-4 bottom-4 w-[45%] flex flex-col gap-3 z-20">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute -left-8 top-0 w-6 h-6 flex items-center justify-center
                   text-[#888] hover:text-white transition-colors text-sm"
      >
        x
      </button>

      {/* Loading state */}
      {loading && (
        <div className="px-4 py-3 bg-[#111] rounded-lg border border-[#333]">
          <p className="font-mono text-sm text-[#00c864] animate-pulse">
            Claude is thinking...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-[#111] rounded-lg border border-[#ff3c3c]/30">
          <p className="font-mono text-sm text-[#ff3c3c]">{error}</p>
        </div>
      )}

      {/* Text response */}
      {text && (
        <div className="px-4 py-3 bg-[#111]/90 rounded-lg border border-[#333]">
          <p className="font-mono text-sm text-[#00c864] leading-relaxed">
            {text}
          </p>
        </div>
      )}

      {/* HTML preview */}
      {html && (
        <div className="flex-1 border border-[#333] rounded-lg overflow-hidden">
          <iframe
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full bg-black"
            title="Claude output"
          />
        </div>
      )}
    </div>
  );
}
