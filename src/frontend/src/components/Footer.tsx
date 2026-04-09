export function Footer() {
  const year = new Date().getFullYear();
  const utm = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  )}`;

  return (
    <footer className="border-t border-border bg-muted/40 mt-auto">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          © {year}. Built with love using{" "}
          <a
            href={utm}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
