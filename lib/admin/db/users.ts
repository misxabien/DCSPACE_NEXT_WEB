import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  adminUsersPrisma?: PrismaClient;
};

const prisma = globalForPrisma.adminUsersPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adminUsersPrisma = prisma;
}

function getModel<T = any>(...names: string[]): T | null {
  const prismaRecord = prisma as unknown as Record<string, T | undefined>;

  for (const name of names) {
    if (prismaRecord[name]) {
      return prismaRecord[name] as T;
    }
  }

  return null;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function normalizeFilter(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return undefined;
  }

  if (
    cleaned === "All Roles" ||
    cleaned === "All Statuses" ||
    cleaned === "All Organization"
  ) {
    return undefined;
  }

  return cleaned;
}

function mapUserRecord(user: any) {
  return {
    id: String(user.id),
    name: user.name ?? user.fullName ?? "",
    email: user.email ?? "",
    role: user.role ?? "student",
    status: user.isActive === false ? "inactive" : "active",
    organization:
      user.organization?.name ?? user.organizationName ?? user.department ?? "Unassigned",
    studentId: user.studentId ?? user.schoolId ?? user.idNumber ?? null,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

export type GetUsersParams = {
  search?: string | null;
  role?: string | null;
  status?: string | null;
  organization?: string | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  role: string;
  organization?: string | null;
  studentId?: string | null;
  isActive?: boolean;
  password?: string;
};

export type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: string;
  organization: string | null;
  studentId: string | null;
  isActive: boolean;
}>;

/**
 * Lists users for the admin users table with search and filter support.
 */
export async function getUsers(params: GetUsersParams) {
  const userModel = getModel<any>("user", "users", "accountUser", "accountUsers");

  if (!userModel) {
    return {
      users: [],
      total: 0,
    };
  }

  const search = normalizeFilter(params.search);
  const role = normalizeFilter(params.role);
  const status = normalizeFilter(params.status);
  const organization = normalizeFilter(params.organization);

  const andConditions: Record<string, unknown>[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { idNumber: { contains: search, mode: "insensitive" } },
        { schoolId: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (role) {
    andConditions.push({
      role: role.toLowerCase(),
    });
  }

  if (status) {
    andConditions.push({
      isActive: status.toLowerCase() === "active",
    });
  }

  if (organization) {
    andConditions.push({
      OR: [
        { organizationName: { contains: organization, mode: "insensitive" } },
        { department: { contains: organization, mode: "insensitive" } },
        {
          organization: {
            name: { contains: organization, mode: "insensitive" },
          },
        },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const users = await userModel.findMany({
    where,
    include: {
      organization: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    users: users.map(mapUserRecord),
    total: users.length,
  };
}

/**
 * Creates a new user from the admin add-user flow.
 */
export async function createUser(input: CreateUserInput) {
  const userModel = getModel<any>("user", "users", "accountUser", "accountUsers");

  if (!userModel) {
    throw new Error("User model is not available");
  }

  const existingUser = await userModel.findFirst({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    const error = new Error("A user with that email already exists");
    error.name = "ValidationError";
    throw error;
  }

  const createdUser = await userModel.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role.toLowerCase(),
      organizationName: input.organization ?? null,
      studentId: input.studentId ?? null,
      isActive: input.isActive ?? true,
      passwordHash: hashPassword(input.password ?? "ChangeMe123!"),
    },
    include: {
      organization: true,
    },
  });

  return mapUserRecord(createdUser);
}

/**
 * Updates editable user fields from the admin users table.
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  const userModel = getModel<any>("user", "users", "accountUser", "accountUsers");

  if (!userModel) {
    throw new Error("User model is not available");
  }

  const existingUser = await userModel.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.name = "NotFoundError";
    throw error;
  }

  const updatedUser = await userModel.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined ? { role: input.role.toLowerCase() } : {}),
      ...(input.organization !== undefined ? { organizationName: input.organization } : {}),
      ...(input.studentId !== undefined ? { studentId: input.studentId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: {
      organization: true,
    },
  });

  return mapUserRecord(updatedUser);
}

/**
 * Deletes a user from the system.
 */
export async function deleteUser(id: string) {
  const userModel = getModel<any>("user", "users", "accountUser", "accountUsers");

  if (!userModel) {
    throw new Error("User model is not available");
  }

  const existingUser = await userModel.findUnique({
    where: { id },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.name = "NotFoundError";
    throw error;
  }

  await userModel.delete({
    where: { id },
  });

  return { id, deleted: true };
}

/**
 * Toggles a user's active status, or sets it explicitly when provided.
 */
export async function toggleUserStatus(id: string, nextStatus?: boolean) {
  const userModel = getModel<any>("user", "users", "accountUser", "accountUsers");

  if (!userModel) {
    throw new Error("User model is not available");
  }

  const existingUser = await userModel.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.name = "NotFoundError";
    throw error;
  }

  const updatedUser = await userModel.update({
    where: { id },
    data: {
      isActive: nextStatus ?? !(existingUser.isActive ?? true),
    },
    include: {
      organization: true,
    },
  });

  return mapUserRecord(updatedUser);
}

/**
 * Resets a user's password and returns the generated temporary password.
 */
export async function resetUserPassword(id: string) {
  const userModel = getModel<any>("user", "users", "accountUser", "accountUsers");

  if (!userModel) {
    throw new Error("User model is not available");
  }

  const existingUser = await userModel.findUnique({
    where: { id },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.name = "NotFoundError";
    throw error;
  }

  const temporaryPassword = randomBytes(6).toString("base64url");

  await userModel.update({
    where: { id },
    data: {
      passwordHash: hashPassword(temporaryPassword),
      passwordResetAt: new Date(),
    },
  });

  return {
    id,
    temporaryPassword,
  };
}