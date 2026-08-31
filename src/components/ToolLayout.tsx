import AdSlot from "./AdSlot";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="flex w-full">
      {/* Left side ad */}
      <div className="ad-side hidden xl:flex w-[200px] shrink-0 justify-center pt-6 pl-2">
        <div className="sticky top-16">
          <AdSlot slot="left-sidebar" format="vertical" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 py-8">
        <AdSlot slot="1234567890" format="horizontal" />

        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-4 bg-emerald-900"></div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </div>
        <p className="mb-5 text-sm text-[#525252] ml-6">{description}</p>

        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          {children}
        </div>

        <AdSlot slot="0987654321" format="horizontal" className="mt-6" />
      </div>

      {/* Right side ad */}
      <div className="ad-side hidden xl:flex w-[200px] shrink-0 justify-center pt-6 pr-2">
        <div className="sticky top-16">
          <AdSlot slot="right-sidebar" format="vertical" />
        </div>
      </div>
    </div>
  );
}
