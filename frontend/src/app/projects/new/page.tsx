import Link from "next/link";
import ProjectForm from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Add Project</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <ProjectForm mode="create" />
        </div>
      </main>
    </div>
  );
}
