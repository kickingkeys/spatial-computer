"use client";

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          Spatial Canvas
        </h1>
        <p className="text-[#888] text-sm max-w-md leading-relaxed">
          A freeform drawing canvas for riffing on ideas. Draw wireframes,
          sketches, or annotations — then ask Claude to turn them into
          working HTML.
        </p>
      </div>

      <div className="flex flex-col gap-4 text-left max-w-sm w-full">
        <div className="flex items-start gap-3">
          <span className="text-[#00c864] font-mono text-sm mt-0.5">1</span>
          <p className="text-sm text-[#ccc]">
            Draw on the canvas with your mouse or a projector setup
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[#00c864] font-mono text-sm mt-0.5">2</span>
          <p className="text-sm text-[#ccc]">
            Optionally connect a webcam for hand gesture control
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[#00c864] font-mono text-sm mt-0.5">3</span>
          <p className="text-sm text-[#ccc]">
            Ask Claude to see your drawing and generate working code
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-[#00c864] text-black font-mono text-sm rounded-lg
                   hover:bg-[#00e070] transition-colors"
      >
        Get Started
      </button>
    </div>
  );
}
