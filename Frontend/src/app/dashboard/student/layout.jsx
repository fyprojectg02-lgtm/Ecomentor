import { Suspense } from "react";
import StudentLayout from "./components/StudentLayout";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#060606]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudentLayout>{children}</StudentLayout>
    </Suspense>
  );
}

