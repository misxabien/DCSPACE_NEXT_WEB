export function isSchoolEmail(email) {
  return String(email || "").trim().toLowerCase().endsWith("@sdca.edu.ph");
}

export function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    studentNumber: user.studentNumber,
    email: user.email,
    role: user.role || "student",
    rfidNumber: user.rfidNumber || "",
    organizationPart: user.organizationPart || "",
    organizationRole: user.organizationRole || "",
    course: user.course || "",
    school: user.school || "",
    dataPrivacyAcceptedAt: user.dataPrivacyAcceptedAt || null,
    createdAt: user.createdAt,
  };
}

export function validateRegistrationBody(body) {
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