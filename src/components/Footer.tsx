export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-900 px-4 py-4 text-center text-xs text-gray-600 bg-black">
      © {new Date().getFullYear()} DevToolbox
    </footer>
  );
}
