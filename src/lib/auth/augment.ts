/**
 * next-auth module augmentation.
 * Imported as a side-effect in AuthProvider so it is always part of
 * the TypeScript module graph — guaranteeing the custom Session fields
 * (id, role, branchId, permissions) are recognised project-wide.
 */
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      branchId?: string;
      permissions?: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    branchId?: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    branchId?: string;
    permissions?: string[];
  }
}

// This export makes the file a proper TypeScript module,
// which is required for `declare module` augmentation to work.
export {};
