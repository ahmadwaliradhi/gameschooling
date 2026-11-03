import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
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
  notFoundComponent: () => <p className="p-8 text-center text-muted-foreground">Not found</p>,
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
        <footer className="px-4 py-3 text-center text-xs text-muted-foreground">
          Built with Muse Spark Open
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
