interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px w-4 bg-emerald-900"></div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      <p className="mb-5 text-sm text-[#525252] ml-6">{description}</p>

      <div className="border border-[#1a1a1a] bg-[#0a0a0a]/80 p-5">
        {children}
      </div>
    </div>
  );
}
