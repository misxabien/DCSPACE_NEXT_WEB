import type { ObjectId } from 'mongodb';

type DbUser = {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  studentNumber: string;
  email: string;
  photoUrl?: string;
  role?: string;
  rfidNumber?: string;
  organizationPart?: string;
  organizationRole?: string;
  course?: string;
  school?: string;
};

export function sanitizeUser(user: DbUser) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    studentNumber: user.studentNumber,
    email: user.email,
    photoUrl: user.photoUrl || '',
    role: user.role || 'student',
    rfidNumber: user.rfidNumber || '',
    organizationPart: user.organizationPart || '',
    organizationRole: user.organizationRole || '',
    course: user.course || '',
    school: user.school || '',
  };
}
