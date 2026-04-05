/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { MongoClient, ObjectId } from "mongodb";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB_NAME ?? "dcspace";

const globalForMongo = globalThis as unknown as {
  adminMongoClient?: MongoClient;
  adminMongoClientPromise?: Promise<MongoClient>;
};

function createAppError(name: string, message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.name = name;
  error.status = status;
  return error;
}

async function getMongoClient() {
  if (globalForMongo.adminMongoClient) {
    return globalForMongo.adminMongoClient;
  }

  if (!globalForMongo.adminMongoClientPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo.adminMongoClientPromise = client.connect();
  }

  globalForMongo.adminMongoClient = await globalForMongo.adminMongoClientPromise;
  return globalForMongo.adminMongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}

async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection<any>("users");
}

async function getEventsCollection() {
  const db = await getDatabase();
  return db.collection<any>("events");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword: string) {
  if (!storedPassword.includes(":")) {
    return storedPassword === password;
  }

  const [salt, storedHash] = storedPassword.split(":");
  const candidateHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");

  if (candidateHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, expectedHash);
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

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw createAppError("ValidationError", "Invalid identifier", 400);
  }

  return new ObjectId(id);
}

function formatTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return {
    iso: date.toISOString(),
    display: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function mapAuthenticatedUser(user: any) {
  return {
    id: String(user._id),
    name: user.name ?? user.fullName ?? user.email ?? "",
    email: user.email ?? "",
    role: user.role ?? "student",
    organization: user.organizationName ?? user.organization?.name ?? null,
    isActive: user.isActive ?? true,
  };
}

function mapUserRecord(user: any) {
  const timestamp = formatTimestamp(user.updatedAt ?? user.createdAt ?? null);
  const registrationStatus = user.registrationStatus ?? (user.rfid ? "Registered" : "Not Registered");

  return {
    id: String(user._id),
    name: user.name ?? user.fullName ?? "",
    email: user.email ?? "",
    role: user.role ?? "student",
    organization: user.organizationName ?? user.organization?.name ?? "Unassigned",
    rfid: user.rfid ?? null,
    registrationStatus,
    isActive: user.isActive ?? true,
    status: registrationStatus,
    studentId: user.studentId ?? user.idNumber ?? null,
    assignedEventIds: Array.isArray(user.assignedEventIds) ? user.assignedEventIds : [],
    timestamp,
    actions: {
      canEdit: true,
      canResetPassword: true,
      canAssignToEvent: true,
      canDelete: true,
      canToggleActive: true,
    },
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

function mapAssignedEvent(event: any) {
  return {
    id: String(event._id),
    title: event.title ?? event.name ?? "Untitled event",
    status: (event.status ?? "unknown").toString().toLowerCase(),
  };
}

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
  organization?: string | null;
  studentId?: string | null;
  rfid?: string | null;
  googleId?: string | null;
};

export type LoginUserInput = {
  email: string;
  password: string;
  requireAdmin?: boolean;
};

export type GetUsersParams = {
  search?: string | null;
  role?: string | null;
  status?: string | null;
  organization?: string | null;
  page?: number | null;
  limit?: number | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  role: string;
  organization?: string | null;
  studentId?: string | null;
  rfid?: string | null;
  isActive?: boolean;
  password?: string;
};

export type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: string;
  organization: string | null;
  studentId: string | null;
  rfid: string | null;
  isActive: boolean;
  registrationStatus: string;
}>;

export type AssignToEventInput = {
  eventId: string;
};

/**
 * Registers a new user in MongoDB and assigns the default role when none is provided.
 */
export async function registerUser(input: RegisterUserInput) {
  const users = await getUsersCollection();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await users.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createAppError("ValidationError", "A user with that email already exists", 400);
  }

  const now = new Date();
  const document = {
    name: input.name,
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    role: (input.role ?? "student").toLowerCase(),
    organizationName: input.organization ?? null,
    studentId: input.studentId ?? null,
    rfid: input.rfid ?? null,
    registrationStatus: input.rfid ? "Registered" : "Not Registered",
    isActive: true,
    authProviders: input.googleId ? ["credentials", "google"] : ["credentials"],
    googleId: input.googleId ?? null,
    assignedEventIds: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await users.insertOne(document);

  return mapUserRecord({ ...document, _id: result.insertedId });
}

/**
 * Logs in a registered user with email and password.
 */
export async function loginUser(input: LoginUserInput) {
  const users = await getUsersCollection();
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await users.findOne({ email: normalizedEmail });

  if (!user || user.isActive === false) {
    throw createAppError("AuthenticationError", "Invalid email or password", 401);
  }

  const storedPassword = user.passwordHash ?? user.password;

  if (!storedPassword || !verifyPassword(input.password, storedPassword)) {
    throw createAppError("AuthenticationError", "Invalid email or password", 401);
  }

  const authenticatedUser = mapAuthenticatedUser(user);

  if (input.requireAdmin && authenticatedUser.role !== "admin") {
    throw createAppError("AuthorizationError", "Forbidden", 403);
  }

  return authenticatedUser;
}

/**
 * Finds a registered user by email for Google SSO and session initialization.
 */
export async function findUserByEmail(email: string) {
  const users = await getUsersCollection();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await users.findOne({ email: normalizedEmail });

  if (!user) {
    return null;
  }

  return mapAuthenticatedUser(user);
}

/**
 * Lists users for the admin users table with filters and pagination.
 */
export async function getUsers(params: GetUsersParams) {
  const users = await getUsersCollection();
  const search = normalizeFilter(params.search);
  const role = normalizeFilter(params.role);
  const status = normalizeFilter(params.status);
  const organization = normalizeFilter(params.organization);
  const page = Math.max(Number(params.page ?? 1) || 1, 1);
  const limit = Math.max(Number(params.limit ?? 10) || 10, 1);
  const skip = (page - 1) * limit;

  const andConditions: Record<string, unknown>[] = [];

  if (search) {
    andConditions.push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { idNumber: { $regex: search, $options: "i" } },
        { rfid: { $regex: search, $options: "i" } },
      ],
    });
  }

  if (role) {
    andConditions.push({
      role: role.toLowerCase(),
    });
  }

  if (status) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "active" || normalizedStatus === "inactive") {
      andConditions.push({ isActive: normalizedStatus === "active" });
    } else {
      andConditions.push({ registrationStatus: status });
    }
  }

  if (organization) {
    andConditions.push({
      $or: [
        { organizationName: { $regex: organization, $options: "i" } },
        { department: { $regex: organization, $options: "i" } },
      ],
    });
  }

  const query = andConditions.length > 0 ? { $and: andConditions } : {};
  const total = await users.countDocuments(query);
  const rows = await users
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const showingFrom = total === 0 ? 0 : skip + 1;
  const showingTo = total === 0 ? 0 : Math.min(skip + rows.length, total);

  return {
    users: rows.map(mapUserRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: totalPages > 0 && page < totalPages,
      showingFrom,
      showingTo,
      summary: `Showing ${showingFrom} to ${showingTo} of ${total} entries`,
      entriesPerPageOptions: [10, 25, 50, 100],
    },
  };
}

/**
 * Creates a new user from the admin add-user flow.
 */
export async function createUser(input: CreateUserInput) {
  const createdUser = await registerUser({
    name: input.name,
    email: input.email,
    password: input.password ?? "ChangeMe123!",
    role: input.role,
    organization: input.organization ?? null,
    studentId: input.studentId ?? null,
    rfid: input.rfid ?? null,
  });

  if (input.isActive === false) {
    return updateUser(createdUser.id, { isActive: false });
  }

  return createdUser;
}

/**
 * Updates editable user fields from the admin users table.
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  const users = await getUsersCollection();
  const objectId = toObjectId(id);
  const existingUser = await users.findOne({ _id: objectId });

  if (!existingUser) {
    throw createAppError("NotFoundError", "User not found", 404);
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.email !== undefined) updates.email = input.email.trim().toLowerCase();
  if (input.role !== undefined) updates.role = input.role.toLowerCase();
  if (input.organization !== undefined) updates.organizationName = input.organization;
  if (input.studentId !== undefined) updates.studentId = input.studentId;
  if (input.rfid !== undefined) updates.rfid = input.rfid;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.registrationStatus !== undefined) updates.registrationStatus = input.registrationStatus;

  await users.updateOne({ _id: objectId }, { $set: updates });
  const updatedUser = await users.findOne({ _id: objectId });

  return mapUserRecord(updatedUser);
}

/**
 * Deletes a user from the system.
 */
export async function deleteUser(id: string) {
  const users = await getUsersCollection();
  const objectId = toObjectId(id);
  const result = await users.deleteOne({ _id: objectId });

  if (result.deletedCount === 0) {
    throw createAppError("NotFoundError", "User not found", 404);
  }

  return { id, deleted: true };
}

/**
 * Toggles a user's active status, or sets it explicitly when provided.
 */
export async function toggleUserStatus(id: string, nextStatus?: boolean) {
  const users = await getUsersCollection();
  const objectId = toObjectId(id);
  const existingUser = await users.findOne({ _id: objectId });

  if (!existingUser) {
    throw createAppError("NotFoundError", "User not found", 404);
  }

  const isActive = nextStatus ?? !(existingUser.isActive ?? true);

  await users.updateOne(
    { _id: objectId },
    {
      $set: {
        isActive,
        updatedAt: new Date(),
      },
    },
  );

  const updatedUser = await users.findOne({ _id: objectId });
  return mapUserRecord(updatedUser);
}

/**
 * Resets a user's password and returns the generated temporary password.
 */
export async function resetUserPassword(id: string) {
  const users = await getUsersCollection();
  const objectId = toObjectId(id);
  const existingUser = await users.findOne({ _id: objectId });

  if (!existingUser) {
    throw createAppError("NotFoundError", "User not found", 404);
  }

  const temporaryPassword = randomBytes(6).toString("base64url");

  await users.updateOne(
    { _id: objectId },
    {
      $set: {
        passwordHash: hashPassword(temporaryPassword),
        passwordResetAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  return {
    id,
    temporaryPassword,
  };
}

/**
 * Assigns a user to an event for the admin users action dropdown.
 */
export async function assignToEvent(id: string, input: AssignToEventInput) {
  const trimmedEventId = input.eventId?.trim();

  if (!trimmedEventId) {
    throw createAppError("ValidationError", "eventId is required", 400);
  }

  const users = await getUsersCollection();
  const events = await getEventsCollection();
  const objectId = toObjectId(id);
  const existingUser = await users.findOne({ _id: objectId });

  if (!existingUser) {
    throw createAppError("NotFoundError", "User not found", 404);
  }

  let eventRecord: any | null = null;

  if (ObjectId.isValid(trimmedEventId)) {
    eventRecord = await events.findOne({ _id: new ObjectId(trimmedEventId) });
  }

  if (!eventRecord) {
    eventRecord = await events.findOne({ eventId: trimmedEventId });
  }

  if (!eventRecord) {
    throw createAppError("NotFoundError", "Event not found", 404);
  }

  const assignedEventId = String(eventRecord._id);

  await users.updateOne(
    { _id: objectId },
    {
      $addToSet: { assignedEventIds: assignedEventId },
      $set: { updatedAt: new Date() },
    },
  );

  await events.updateOne(
    { _id: eventRecord._id },
    {
      $addToSet: { participantIds: id },
      $set: { updatedAt: new Date() },
    },
  );

  const updatedUser = await users.findOne({ _id: objectId });

  return {
    user: mapUserRecord(updatedUser),
    assignedEvent: mapAssignedEvent(eventRecord),
  };
}
