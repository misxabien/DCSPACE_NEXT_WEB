type RegistrationBody = Record<string, unknown>;

type UserDocument = {
  _id: { toString(): string };
  firstName?: string;
  lastName?: string;
  studentNumber?: string;
  email?: string;
  photoUrl?: string;
  role?: string;
  rfidNumber?: string;
  organizationPart?: string;
  organizationRole?: string;
  course?: string;
  school?: string;
  dataPrivacyAcceptedAt?: string | null;
  createdAt?: string;
};

export function isSchoolEmail(email: unknown) {
  return String(email || "").trim().toLowerCase().endsWith("@sdca.edu.ph");
}

export function sanitizeUser(user: UserDocument) {
  const firstName = String(user.firstName || "");
  const lastName = String(user.lastName || "");

  return {
    id: user._id.toString(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    studentNumber: String(user.studentNumber || ""),
    email: String(user.email || ""),
    photoUrl: String(user.photoUrl || ""),
    role: String(user.role || "student"),
    rfidNumber: String(user.rfidNumber || ""),
    organizationPart: String(user.organizationPart || ""),
    organizationRole: String(user.organizationRole || ""),
    course: String(user.course || ""),
    school: String(user.school || ""),
    dataPrivacyAcceptedAt: user.dataPrivacyAcceptedAt || null,
    createdAt: user.createdAt,
  };
}

export function validateRegistrationBody(body: RegistrationBody) {
  const requiredFields = ["firstName", "lastName", "studentNumber", "email", "password", "confirmPassword"];

  for (const field of requiredFields) {
    if (!body[field] || String(body[field]).trim() === "") {
      return `${field} is required.`;
    }
  }

  if (!isSchoolEmail(body.email)) {
    return "email must use your school domain (@sdca.edu.ph).";
  }

  if (String(body.password).length < 8) {
    return "password must be at least 8 characters.";
  }

  if (body.password !== body.confirmPassword) {
    return "password and confirmPassword do not match.";
  }

  if (body.dataPrivacyAccepted !== true) {
    return "dataPrivacyAccepted must be true before registration.";
  }

  return null;
}
