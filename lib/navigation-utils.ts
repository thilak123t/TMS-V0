/**
 * Navigation utilities for consistent routing and active state detection
 */

export interface NavigationItem {
  name: string
  href: string
  icon: any
  children?: NavigationItem[]
}

/**
 * Determines if a route is currently active based on the current pathname
 * Handles nested routes and exact matches properly
 */
export function isActiveRoute(itemHref: string, currentPath: string): boolean {
  // Remove trailing slashes for consistent comparison
  const normalizedItemHref = itemHref.replace(/\/$/, "")
  const normalizedCurrentPath = currentPath.replace(/\/$/, "")

  // Exact match
  if (normalizedCurrentPath === normalizedItemHref) return true

  // For nested routes, check if current path starts with item href
  // but ensure we don't match partial segments by checking for a slash
  if (normalizedCurrentPath.startsWith(normalizedItemHref + "/")) return true

  return false
}

/**
 * Gets the breadcrumb trail for the current path
 */
export function getBreadcrumbs(pathname: string, navigationItems: NavigationItem[]): NavigationItem[] {
  const breadcrumbs: NavigationItem[] = []

  // Find the active navigation item
  const activeItem = navigationItems.find((item) => isActiveRoute(item.href, pathname))

  if (activeItem) {
    breadcrumbs.push(activeItem)

    // If we're on a sub-page, try to determine the parent context
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length > 2) {
      // This is a sub-page, add context based on the path
      const subPageName = getSubPageName(pathname)
      if (subPageName) {
        breadcrumbs.push({
          name: subPageName,
          href: pathname,
          icon: null,
        })
      }
    }
  }

  return breadcrumbs
}

/**
 * Determines the sub-page name based on the pathname
 */
function getSubPageName(pathname: string): string | null {
  const pathSegments = pathname.split("/").filter(Boolean)
  const lastSegment = pathSegments[pathSegments.length - 1]

  // Handle common sub-page patterns
  if (lastSegment === "create") return "Create New"
  if (lastSegment === "edit") return "Edit"
  if (pathname.includes("/tenders/") && pathSegments.length === 4) return "Tender Details"
  if (pathname.includes("/users/") && pathSegments.length === 4) return "User Details"

  return null
}

/**
 * Navigation helper for programmatic navigation with proper state management
 */
export class NavigationManager {
  private static instance: NavigationManager
  private listeners: Array<(path: string) => void> = []

  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager()
    }
    return NavigationManager.instance
  }

  /**
   * Navigate to a path with optional state management
   */
  navigateTo(path: string, options?: { replace?: boolean; state?: any }) {
    // Notify listeners about navigation
    this.listeners.forEach((listener) => listener(path))

    // Handle the navigation
    if (typeof window !== "undefined") {
      if (options?.replace) {
        window.history.replaceState(options.state || null, "", path)
      } else {
        window.history.pushState(options.state || null, "", path)
      }
    }
  }

  /**
   * Subscribe to navigation changes
   */
  onNavigate(callback: (path: string) => void) {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }
}
