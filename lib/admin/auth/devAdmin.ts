export function getDevAdminConfig() {
  return {
    email: (process.env.DEV_ADMIN_EMAIL ?? "admin@sdca.edu.ph").trim().toLowerCase(),
    password: process.env.DEV_ADMIN_PASSWORD ?? "Admin@123",
    name: process.env.DEV_ADMIN_NAME ?? "DC Space Admin",
  };
}

export function getNextAuthSecret() {
  return (
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dcspace-dev-nextauth-secret-do-not-use-in-production"
      : undefined)
  );
}

export function buildHardcodedAdminUser() {
  const { email, name } = getDevAdminConfig();

  return {
    id: "hardcoded-admin",
    name,
    email,
    role: "admin",
    organization: null,
    isActive: true,
  };
}

export function isHardcodedAdminLogin(email: string, password: string) {
  const dev = getDevAdminConfig();
  return email.trim().toLowerCase() === dev.email && password === dev.password;
}
