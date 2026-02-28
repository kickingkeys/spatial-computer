"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { StepWelcome } from "./StepWelcome";
import { StepProjector } from "./StepProjector";
import { StepCamera } from "./StepCamera";
import { StepHandTracking } from "./StepHandTracking";
import { StepReady } from "./StepReady";

const TOTAL_STEPS = 5;

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [cameraId, setCameraId] = useState<string | null>(null);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleCameraNext = useCallback(
    (id: string | null) => {
      setCameraId(id);
      // Skip hand tracking step if no camera selected
      if (!id) {
        setStep(4); // jump to Ready
      } else {
        next();
      }
    },
    [next]
  );

  const handleLaunch = useCallback(() => {
    const params = cameraId ? `?camera=${encodeURIComponent(cameraId)}` : "";
    router.push(`/canvas${params}`);
  }, [cameraId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <div className="mb-10">
          <StepIndicator total={TOTAL_STEPS} current={step} />
        </div>

        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && <StepProjector onNext={next} onBack={back} />}
        {step === 2 && <StepCamera onNext={handleCameraNext} onBack={back} />}
        {step === 3 && cameraId && (
          <StepHandTracking cameraId={cameraId} onNext={next} onBack={back} />
        )}
        {step === 4 && (
          <StepReady
            hasCamera={!!cameraId}
            onLaunch={handleLaunch}
            onBack={back}
          />
        )}
      </div>
    </div>
  );
}
