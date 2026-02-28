"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SpatialCanvas } from "@/components/canvas/SpatialCanvas";

function CanvasContent() {
  const searchParams = useSearchParams();
  const cameraId = searchParams.get("camera");

  return <SpatialCanvas cameraDeviceId={cameraId} />;
}

export default function CanvasPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <CanvasContent />
    </Suspense>
  );
}
