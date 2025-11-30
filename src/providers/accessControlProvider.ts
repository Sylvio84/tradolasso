import type { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./authProvider";

/**
 * Access Control Provider for role-based permissions
 *
 * Checks user roles from JWT to determine access to resources
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource }) => {
    // Get user roles from authProvider
    const roles = (await authProvider.getPermissions?.()) as string[] || [];

    // Module configs and topics resources require ROLE_INT_DEVELOPER
    if (resource === "module_configs" || resource === "topics") {
      const hasAccess = roles.includes("ROLE_INT_DEVELOPER");
      return {
        can: hasAccess,
        reason: hasAccess ? undefined : "You need ROLE_INT_DEVELOPER to access this resource",
      };
    }

    // All other resources are accessible
    return { can: true };
  },
};
