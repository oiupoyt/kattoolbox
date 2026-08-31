export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 px-4 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
      © {new Date().getFullYear()} DevToolbox — Free, private, browser-based developer tools.
    </footer>
  );
}
