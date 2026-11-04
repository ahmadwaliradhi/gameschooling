import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GameSchooling" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="grid flex-1 place-items-center gap-3 p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-muted-foreground">This page does not exist.</p>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  ),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh flex flex-col">
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="flex flex-col items-center gap-1 px-4 py-3 text-center text-xs text-muted-foreground">
          <nav className="flex gap-3">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <span aria-hidden>·</span>
            <Link to="/terms" className="hover:text-foreground">
              Terms of Use
            </Link>
          </nav>
          {/* The Muse Spark Open license requires this line to stay visible on every page. */}
          <p>
            Built with Muse Spark Open. Also uses Meta's Muse Wonder, Muse Spark 1.3, Muse Image, SAM 3.1 and
            Muse Voice Transcribe.
          </p>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
