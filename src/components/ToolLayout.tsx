import AdSlot from "./AdSlot";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <AdSlot slot="1234567890" format="horizontal" />

      <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
      <p className="mb-4 text-sm text-gray-400">{description}</p>

      {children}

      <AdSlot slot="0987654321" format="horizontal" className="mt-6" />
    </div>
  );
}
