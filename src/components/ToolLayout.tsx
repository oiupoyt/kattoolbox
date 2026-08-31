import AdSlot from "./AdSlot";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="flex w-full">
      {/* Left side ad — flush to edge */}
      <div className="ad-side hidden xl:flex w-[200px] shrink-0 justify-center pt-6 pl-2">
        <div className="sticky top-16">
          <AdSlot slot="left-sidebar" format="vertical" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 py-6">
        <AdSlot slot="1234567890" format="horizontal" />

        <h1 className="mb-1 text-lg font-semibold text-white">{title}</h1>
        <p className="mb-4 text-sm text-gray-500">{description}</p>

        {children}

        <AdSlot slot="0987654321" format="horizontal" className="mt-6" />
      </div>

      {/* Right side ad — flush to edge */}
      <div className="ad-side hidden xl:flex w-[200px] shrink-0 justify-center pt-6 pr-2">
        <div className="sticky top-16">
          <AdSlot slot="right-sidebar" format="vertical" />
        </div>
      </div>
    </div>
  );
}
