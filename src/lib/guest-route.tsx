import { Route } from "wouter";

// GuestRoute is a simple wrapper around Route that allows guest access
// It's almost identical to a regular Route but makes it clear in the code
// that this route is intentionally accessible to guests
export function GuestRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return <Route path={path} component={Component} />;
}