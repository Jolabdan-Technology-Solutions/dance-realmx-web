import React from 'react';
import { Route } from 'wouter';
import { AdminRoute } from './admin-route';
import { ProtectedRoute } from './protected-route';
import { GuestRoute } from './guest-route';

type RouteGuardProps = {
  path: string;
  component: React.ComponentType;
  routeType: 'public' | 'protected' | 'admin' | 'guest';
};

/**
 * RouteGuard - A simple wrapper that ensures route protection is consistent
 * 
 * This component prevents accidentally removing route protection by forcing
 * explicit declaration of route type.
 */
export function RouteGuard({ 
  path, 
  component: Component, 
  routeType 
}: RouteGuardProps) {
  // Return the appropriate route type based on routeType
  switch (routeType) {
    case 'protected':
      return <ProtectedRoute path={path} component={Component} />;
    case 'admin':
      return <AdminRoute path={path} component={Component} />;
    case 'guest':
      return <GuestRoute path={path} component={Component} />;
    case 'public':
    default:
      return <Route path={path} component={Component} />;
  }
}