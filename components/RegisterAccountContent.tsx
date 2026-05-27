'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
<<<<<<< HEAD
import { registerUser, saveAuthSession, sendRegistrationVerificationEmail } from '@/lib/user-api';
import { syncProfileToLegacyStorage } from '@/lib/user-mappers';
=======
>>>>>>> origin/frontend-user

type RegisterStep = 'personal' | 'school' | 'account' | 'verify';

type RegisterData = {
  firstName: string;
  lastName: string;
  studentNumber: string;
<<<<<<< HEAD
  course: string;
  school: string;
  organization: string;
  role: string;
  rfidTagNumber: string;
  schoolEmail: string;
=======
  studentEmail: string;
  rfidNumber: string;
  organizationPart: string;
  organizationRole: string;
  course: string;
  school: string;
>>>>>>> backup/backend-user
  password: string;
  confirmPassword: string;
  verificationCode: string;
};

<<<<<<< HEAD
const initialData: RegisterData = {
  firstName: '',
  lastName: '',
  studentNumber: '',
  course: '',
  school: '',
  organization: '',
  role: '',
  rfidTagNumber: '',
  schoolEmail: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
=======
const emptyReview: RegisterReview = {
  firstName: "",
  lastName: "",
  studentNumber: "",
  studentEmail: "",
  rfidNumber: "",
  organizationPart: "",
  organizationRole: "",
  course: "",
  school: "",
  password: "",
  confirmPassword: "",
>>>>>>> backup/backend-user
};

function requiredLabel(label: string, value: string) {
  return `${label}${value.trim() ? '' : '*'}`;
}

export function RegisterAccountContent() {
  const router = useRouter();
<<<<<<< HEAD
  const [step, setStep] = useState<RegisterStep>('personal');
  const [formData, setFormData] = useState<RegisterData>(initialData);
=======
  const formRef = useRef<HTMLFormElement>(null);

  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState<RegisterReview>(emptyReview);
>>>>>>> backup/backend-user
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyModalClosing, setPrivacyModalClosing] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
<<<<<<< HEAD
  const [isSendingVerification, setIsSendingVerification] = useState(false);
=======
>>>>>>> origin/frontend-user

  const passwordChecks = [
    formData.password.length >= 8,
    /[A-Z]/.test(formData.password),
    /[a-z]/.test(formData.password),
    /\d/.test(formData.password),
    /[^A-Za-z0-9]/.test(formData.password),
  ];
<<<<<<< HEAD
  const passedPasswordChecks = passwordChecks.filter(Boolean).length;
  const passwordStrength = passedPasswordChecks >= 5 ? 'Strong' : passedPasswordChecks >= 3 ? 'Medium' : 'Weak';
  const filledStrengthBoxes = passwordStrength === 'Strong' ? 5 : passwordStrength === 'Medium' ? 3 : 1;
  const showPasswordWarning = formData.password.length > 0 && passwordStrength === 'Weak';
  const showPasswordMatch = formData.confirmPassword.length > 0;
  const passwordMatches = formData.password.length > 0 && formData.password === formData.confirmPassword;
=======

  const passwordIsValid = passwordChecks.every((check) => check.valid);
>>>>>>> backup/backend-user

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

<<<<<<< HEAD
  const handlePersonalContinue = () => {
    setStep('school');
=======
  const handleReview = () => {
    if (!formRef.current) return;

    if (!passwordIsValid) {
      setValidationError("Please complete all password requirements before reviewing.");
      return;
    }

    const formData = new FormData(formRef.current);

    setReview({
      firstName: getValue(formData, "first_name"),
      lastName: getValue(formData, "last_name"),
      studentNumber: getValue(formData, "student_number"),
      studentEmail: getValue(formData, "student_email"),
      rfidNumber: getValue(formData, "rfid_number"),
      organizationPart: getValue(formData, "organization_part"),
      organizationRole: getValue(formData, "organization_role"),
      course: getValue(formData, "course"),
      school: getValue(formData, "school"),
      password: getValue(formData, "password") === "Not provided" ? "Not provided" : "********",
      confirmPassword: getValue(formData, "confirm_password") === "Not provided" ? "Not provided" : "********",
    });

    setValidationError("");
    setShowReview(true);
>>>>>>> backup/backend-user
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2200);
  };

  const accountIsComplete = () => {
    const requiredValues = [
      formData.firstName,
      formData.lastName,
      formData.studentNumber,
      formData.course,
      formData.school,
      formData.rfidTagNumber,
      formData.schoolEmail,
      formData.password,
      formData.confirmPassword,
    ];

    return !requiredValues.some((value) => !value.trim()) && passwordStrength === 'Strong' && passwordMatches;
  };

  const requiredAccountDetailsAreFilled = () => {
    const requiredValues = [
      formData.firstName,
      formData.lastName,
      formData.studentNumber,
      formData.course,
      formData.school,
      formData.rfidTagNumber,
      formData.schoolEmail,
      formData.password,
      formData.confirmPassword,
    ];

    return !requiredValues.some((value) => !value.trim());
  };

<<<<<<< HEAD
  const handleVerifyAccount = async () => {
=======
  const handleVerifyAccount = () => {
>>>>>>> origin/frontend-user
    if (requiredAccountDetailsAreFilled() && passwordStrength !== 'Strong') {
      showToast('Password is too weak');
      return;
    }

    if (!accountIsComplete()) {
      showToast('Please fill in the required details');
      return;
    }

<<<<<<< HEAD
    const schoolEmail = formData.schoolEmail.trim().toLowerCase();
    if (!schoolEmail.endsWith('@sdca.edu.ph')) {
      showToast('Please use your school email (@sdca.edu.ph)');
      return;
    }

    setIsSendingVerification(true);
    try {
<<<<<<< HEAD
      const result = await sendRegistrationVerificationEmail(schoolEmail);
      setStep('verify');
      showToast(result.message || 'Verification code sent. Please check your school email.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification email';
      showToast(message);
    } finally {
      setIsSendingVerification(false);
    }
=======
    setStep('verify');
>>>>>>> origin/frontend-user
  };

  const handleVerificationCreate = () => {
    if (!formData.verificationCode.trim()) {
      showToast('Please enter the verification code');
      return;
    }

    setShowPrivacyModal(true);
    setPrivacyModalClosing(false);
  };

  const handleClosePrivacyModal = () => {
    setPrivacyModalClosing(true);
    window.setTimeout(() => {
      setShowPrivacyModal(false);
      setPrivacyModalClosing(false);
    }, 240);
  };

<<<<<<< HEAD
  const handleCreateAccount = async () => {
=======
  const handleCreateAccount = () => {
>>>>>>> origin/frontend-user
    if (!privacyAgreed) {
      showToast('Please agree to the Data Privacy Policy');
      return;
    }

    setIsCreatingAccount(true);
<<<<<<< HEAD
    try {
      const result = await registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        studentNumber: formData.studentNumber.trim(),
        email: formData.schoolEmail.trim().toLowerCase(),
        rfidNumber: formData.rfidTagNumber.trim(),
        organizationPart: formData.organization.trim(),
        organizationRole: formData.role,
        course: formData.course,
        school: formData.school,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        verificationCode: formData.verificationCode.trim(),
        role: 'student',
        dataPrivacyAccepted: true,
      });

      saveAuthSession(result.token, result.user);
      syncProfileToLegacyStorage(result.user);
      window.sessionStorage.removeItem('dcspacePrivacySeen');

      window.setTimeout(() => router.push('/home'), 900);
    } catch (error) {
      setIsCreatingAccount(false);
      showToast(error instanceof Error ? error.message : 'Failed to create account');
=======
      setIsSubmitting(true);
      await registerUser({
        firstName,
        lastName,
        studentNumber,
        email: studentEmail.trim(),
        rfidNumber: getValue(formData, "rfid_number"),
        organizationPart: getValue(formData, "organization_part"),
        organizationRole: getValue(formData, "organization_role"),
        course: getValue(formData, "course"),
        school: getValue(formData, "school"),
        password,
        confirmPassword,
        role: "student",
        dataPrivacyAccepted: true,
      });

      window.localStorage.setItem("dcspaceStudentNumber", studentNumber);
      window.localStorage.setItem("dcspaceStudentEmail", studentEmail.trim());
      window.localStorage.setItem("dcspaceRfidNumber", getValue(formData, "rfid_number"));
      window.localStorage.setItem("dcspaceCourse", getValue(formData, "course"));
      window.localStorage.setItem("dcspaceSchool", getValue(formData, "school"));
      window.localStorage.setItem("dcspaceOrganizationPart", getValue(formData, "organization_part"));
      window.localStorage.setItem("dcspaceOrganizationRole", getValue(formData, "organization_role"));
      window.sessionStorage.removeItem("dcspacePrivacySeen");
      router.push(`/login?registered=1&email=${encodeURIComponent(studentEmail.trim())}`);
    } catch (registerError) {
      setValidationError(registerError instanceof Error ? registerError.message : "Failed to create account.");
    } finally {
      setIsSubmitting(false);
>>>>>>> backup/backend-user
    }
=======
    window.localStorage.setItem('dcspaceFirstName', formData.firstName.trim());
    window.localStorage.setItem('dcspaceLastName', formData.lastName.trim());
    window.localStorage.setItem('dcspaceStudentNumber', formData.studentNumber.trim());
    window.localStorage.setItem('dcspaceCourse', formData.course);
    window.localStorage.setItem('dcspaceSchool', formData.school);
    window.localStorage.setItem('dcspaceOrganizationPart', formData.organization.trim());
    window.localStorage.setItem('dcspaceOrganizationRole', formData.role);
    window.localStorage.setItem('dcspaceRfidNumber', formData.rfidTagNumber.trim());
    window.localStorage.setItem('dcspaceStudentEmail', formData.schoolEmail.trim());
    window.sessionStorage.removeItem('dcspacePrivacySeen');

    window.setTimeout(() => router.push('/login'), 900);
>>>>>>> origin/frontend-user
  };

  return (
<<<<<<< HEAD
    <div className="login-scope register-scope">
      <main className={`register-shell register-shell--${step}${showPrivacyModal ? ' is-modal-open' : ''}`}>
        <aside className="register-side" aria-label="DC Space welcome panel">
          <div className="register-side__content">
            <Image
              className="register-side__logo"
              src="/dcspace-logos/dcspace-whitetext-transparent.svg"
              alt="DC Space logo"
              width={498}
              height={270}
              priority
            />
            <h2>Hello New Friend!</h2>
            {step === 'personal' && <p>Already have an account?</p>}
            {step === 'personal' && (
              <button className="register-signin-btn" type="button" onClick={() => router.back()}>
                <Image src="/svg icons create account page/Arrow left.svg" alt="" width={40} height={40} />
                <span>SIGN IN</span>
              </button>
            )}
          </div>
        </aside>
=======
    <div className="login-scope">
      <main className="register-page">
        <section className="register-card" aria-label="Register account form">
          <h1>Register your Account!</h1>

          <form ref={formRef} className="register-form">
            <div className="register-two-col">
              <input name="first_name" type="text" placeholder="First Name:" aria-label="First Name" />
              <input name="last_name" type="text" placeholder="Last Name:" aria-label="Last Name" />
            </div>

            <div className="register-two-col">
              <input name="student_number" type="text" placeholder="Student Number:" aria-label="Student Number" />

              <input
                name="rfid_number"
                type="text"
                placeholder="RFID Tag No.:"
                aria-label="RFID Number"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleReview();
                  }
                }}
              />
            </div>

            <div className="register-two-col">
              <input
                name="organization_part"
                type="text"
                placeholder="Organization:"
                aria-label="Organization or Part of Organization"
              />

              <select name="organization_role" aria-label="Organization Role" defaultValue="">
                <option value="" disabled>
                  Position:
                </option>
                <option value="Organization Member">Organization Member</option>
                <option value="Officer">Organization Officer</option>
              </select>
            </div>

            <div className="register-two-col">
              <select name="course" aria-label="Course" defaultValue="">
                <option value="" disabled>
                  Course:
                </option>
                <option value="BSN">BSN – Bachelor of Science in Nursing</option>
                <option value="BSRT">BSRT – Bachelor of Science in Radiologic Technology</option>
                <option value="BSPT">BSPT – Bachelor of Science in Physical Therapy</option>
                <option value="BS Bio">BS Bio – Bachelor of Science in Biology</option>
                <option value="BS Pharm">BS Pharm – Bachelor of Science in Pharmacy</option>
                <option value="BS MLS">BS MLS – Bachelor of Science in Medical Laboratory Science</option>
                <option value="BSA">BSA – Bachelor of Science in Accountancy</option>
                <option value="BSAT">BSAT – Bachelor of Science in Accounting Technology</option>
                <option value="BS Psych">BS Psych – Bachelor of Science in Psychology</option>
                <option value="BEEd">BEEd – Bachelor of Elementary Education</option>
                <option value="BSEd">BSEd – Bachelor of Secondary Education</option>
                <option value="BSBA-FM">BSBA-FM – Bachelor of Science in Business Administration (Financial Management)</option>
                <option value="BSBA-MM">BSBA-MM – Bachelor of Science in Business Administration (Marketing Management)</option>
                <option value="BSBA-HRDM">BSBA-HRDM – Bachelor of Science in Business Administration (Human Resource Development Management)</option>
                <option value="BSBA-OM">BSBA-OM – Bachelor of Science in Business Administration (Operations Management)</option>
                <option value="BSTM">BSTM – Bachelor of Science in Tourism Management</option>
                <option value="BSHM (CAKO)">BSHM (CAKO) – Bachelor of Science in Hospitality Management (Culinary Arts & Kitchen Operations)</option>
                <option value="BSHM (CO)">BSHM (CO) – Bachelor of Science in Hospitality Management (Cruiseline Operations)</option>
                <option value="BA Comm">BA Comm – Bachelor of Arts in Communication</option>
                <option value="BMA">BMA – Bachelor of Multimedia Arts</option>
                <option value="BSIT">BSIT – Bachelor of Science in Information Technology</option>
              </select>

              <select name="school" aria-label="School" defaultValue="">
                <option value="" disabled>
                  School:
                </option>
                <option value="SNAHS">SNAHS – School of Nursing and Allied Health Studies</option>
                <option value="SMLS">SMLS – School of Medical Laboratory Sciences</option>
                <option value="SASE">SASE – School of Accountancy, Science, and Education</option>
                <option value="SIHTM">SIHTM – School of International Hospitality, Tourism, and Management</option>
                <option value="SCMCS">SCMCS – School of Communication, Multimedia, and Computer Studies</option>
              </select>
            </div>

            <input
              name="student_email"
              type="email"
              placeholder="Student Email:"
              aria-label="Student Email"
              value={studentEmail}
              onChange={(event) => {
                setStudentEmail(event.target.value);
                setValidationError("");
              }}
            />

            <label className="register-password-wrap">
              <span className="register-sr-only">Password</span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password:"
                aria-label="Password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setValidationError("");
                }}
              />
              <button
                className="register-eye-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </label>

            <label className="register-password-wrap">
              <span className="register-sr-only">Re-enter password</span>
              <input
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password:"
                aria-label="Re-enter password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setValidationError("");
                }}
              />
              <button
                className="register-eye-toggle"
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </label>

            <ul className="password-requirements" aria-label="Password requirements">
              {passwordChecks.map((check) => (
                <li className={check.valid ? "is-valid" : ""} key={check.label}>
                  {check.label}
                </li>
              ))}
            </ul>

            {validationError && <p className="auth-field-error">{validationError}</p>}
          </form>
        </section>
>>>>>>> backup/backend-user

        <section className="register-main" aria-label="Create account form">
          <div className="register-form-panel">
            <h1>Create Account</h1>

            {step === 'personal' ? (
              <div className="register-step" key="personal" aria-label="Personal information">
                <h2>Personal Info</h2>

<<<<<<< HEAD
              <label className="register-field">
                <span>{requiredLabel('First Name', formData.firstName)}</span>
                <input
                  name="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                />
              </label>

              <label className="register-field">
                <span>{requiredLabel('Last Name', formData.lastName)}</span>
                <input
                  name="last_name"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                />
              </label>

              <label className="register-field">
                <span>{requiredLabel('Student Number', formData.studentNumber)}</span>
                <input
                  name="student_number"
                  type="text"
                  placeholder="Enter your student number"
                  value={formData.studentNumber}
                  onChange={(event) => updateField('studentNumber', event.target.value)}
                />
              </label>

              <div className="register-controls register-controls--end">
                <button className="register-back-step auth-mobile-control-back" type="button" onClick={() => router.back()}>
                  Go back to Sign In
                </button>
                <button className="register-continue" type="button" onClick={handlePersonalContinue}>
                  Save &amp; Continue
=======
        {showReview && (
          <div className="register-review-overlay">
            <section className="register-review-modal" role="dialog" aria-modal="true" aria-labelledby="register-review-title">
              <div className="register-review-header">
                <h2 id="register-review-title">Review Account Info</h2>

                <button type="button" className="register-review-close" aria-label="Close review" onClick={() => setShowReview(false)}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
>>>>>>> backup/backend-user
                </button>
              </div>
              </div>
            ) : step === 'school' ? (
              <div className="register-step register-step--school" key="school" aria-label="School details">
              <h2>School Details</h2>

<<<<<<< HEAD
              <label className="register-field">
                <span>{requiredLabel('Course', formData.course)}</span>
                <select
                  name="course"
                  value={formData.course}
                  onChange={(event) => updateField('course', event.target.value)}
                >
                  <option value="" disabled>
                    Choose your course
                  </option>
                  <option value="BSN">BSN - Bachelor of Science in Nursing</option>
                  <option value="BSRT">BSRT - Bachelor of Science in Radiologic Technology</option>
                  <option value="BSPT">BSPT - Bachelor of Science in Physical Therapy</option>
                  <option value="BS Bio">BS Bio - Bachelor of Science in Biology</option>
                  <option value="BS Pharm">BS Pharm - Bachelor of Science in Pharmacy</option>
                  <option value="BS MLS">BS MLS - Bachelor of Science in Medical Laboratory Science</option>
                  <option value="BSA">BSA - Bachelor of Science in Accountancy</option>
                  <option value="BS Psych">BS Psych - Bachelor of Science in Psychology</option>
                  <option value="BEEd">BEEd - Bachelor of Elementary Education</option>
                  <option value="BSEd">BSEd - Bachelor of Secondary Education</option>
                  <option value="BSBA-FM">BSBA-FM - Business Administration Financial Management</option>
                  <option value="BSBA-MM">BSBA-MM - Business Administration Marketing Management</option>
                  <option value="BSTM">BSTM - Bachelor of Science in Tourism Management</option>
                  <option value="BMA">BMA - Bachelor of Multimedia Arts</option>
                  <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                </select>
              </label>
=======
              <dl className="register-review-list">
                <div>
                  <dt>First Name</dt>
                  <dd>{review.firstName}</dd>
                </div>
                <div>
                  <dt>Last Name</dt>
                  <dd>{review.lastName}</dd>
                </div>
                <div>
                  <dt>Student Number</dt>
                  <dd>{review.studentNumber}</dd>
                </div>
                <div>
                  <dt>RFID Tag No.</dt>
                  <dd>{review.rfidNumber}</dd>
                </div>
                <div>
                  <dt>Organization</dt>
                  <dd>{review.organizationPart}</dd>
                </div>
                <div>
                  <dt>Position</dt>
                  <dd>{review.organizationRole}</dd>
                </div>
                <div>
                  <dt>Course</dt>
                  <dd>{review.course}</dd>
                </div>
                <div>
                  <dt>School</dt>
                  <dd>{review.school}</dd>
                </div>
                <div>
                  <dt>Student Email</dt>
                  <dd>{review.studentEmail}</dd>
                </div>
                <div>
                  <dt>Password</dt>
                  <dd>{review.password}</dd>
                </div>
                <div>
                  <dt>Re-enter Password</dt>
                  <dd>{review.confirmPassword}</dd>
                </div>
              </dl>
>>>>>>> backup/backend-user

              <label className="register-field">
                <span>{requiredLabel('School/Department', formData.school)}</span>
                <select
                  name="school"
                  value={formData.school}
                  onChange={(event) => updateField('school', event.target.value)}
                >
                  <option value="" disabled>
                    Choose your school/departme...
                  </option>
                  <option value="SNAHS">SNAHS - School of Nursing and Allied Health Studies</option>
                  <option value="SMLS">SMLS - School of Medical Laboratory Sciences</option>
                  <option value="SASE">SASE - School of Accountancy, Science, and Education</option>
                  <option value="SIHTM">SIHTM - School of International Hospitality, Tourism, and Management</option>
                  <option value="SCMCS">SCMCS - School of Communication, Multimedia, and Computer Studies</option>
                </select>
              </label>

              <label className="register-field">
                <span>Organization</span>
                <input
                  name="organization"
                  type="text"
                  placeholder="Enter your organization"
                  value={formData.organization}
                  onChange={(event) => updateField('organization', event.target.value)}
                />
              </label>

              <label className="register-field">
                <span>Role</span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={(event) => updateField('role', event.target.value)}
                >
                  <option value="" disabled>
                    Choose your role
                  </option>
                  <option value="Organization Member">Organization Member</option>
                  <option value="Organization Officer">Organization Officer</option>
                </select>
              </label>

              <div className="register-controls">
                <button className="register-back-step" type="button" onClick={() => setStep('personal')}>
                  Go back to Personal Info
                </button>
                <button className="register-continue" type="button" onClick={() => setStep('account')}>
                  Save &amp; Continue
                </button>
              </div>
            </div>
            ) : step === 'account' ? (
              <div className="register-step register-step--account" key="account" aria-label="Account set up">
                <h2>Account Set Up</h2>

                <label className="register-field register-field--compact">
                  <span>{requiredLabel('RFID Tag Number', formData.rfidTagNumber)}</span>
                  <input
                    name="rfid_tag_number"
                    type="text"
                    inputMode="numeric"
                    placeholder="Tap your School ID"
                    value={formData.rfidTagNumber}
                    onChange={(event) => updateField('rfidTagNumber', event.target.value)}
                  />
                </label>

                <label className="register-field register-field--compact">
                  <span>{requiredLabel('School email', formData.schoolEmail)}</span>
                  <input
                    name="school_email"
                    type="email"
                    placeholder="Enter your school email"
                    value={formData.schoolEmail}
                    onChange={(event) => updateField('schoolEmail', event.target.value)}
                  />
                </label>

                <label className="register-field register-field--compact register-password-field">
                  <span>{requiredLabel('Password', formData.password)}</span>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Choose a strong password!"
                    value={formData.password}
                    onChange={(event) => updateField('password', event.target.value)}
                  />
                  <button
                    className="register-password-eye"
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    <Image
                      src={showPassword ? '/svg icons sign in page/Eye (1).svg' : '/svg icons sign in page/Eye off.svg'}
                      alt=""
                      width={48}
                      height={48}
                    />
                  </button>
                </label>

                {formData.password.length > 0 && (
                  <div className={`password-strength password-strength--${passwordStrength.toLowerCase()}`}>
                    <div className="password-strength__bars" aria-hidden>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span className={index < filledStrengthBoxes ? 'is-filled' : ''} key={index} />
                      ))}
                    </div>
                    <p>Password Strength: {passwordStrength}</p>
                    {showPasswordWarning && (
                      <p className="password-strength__warning">
                        Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                      </p>
                    )}
                  </div>
                )}

                <label className="register-field register-field--compact register-password-field">
                  <span>{requiredLabel('Re-enter your password', formData.confirmPassword)}</span>
                  <input
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                  />
                  <button
                    className="register-password-eye"
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    <Image
                      src={showConfirmPassword ? '/svg icons sign in page/Eye (1).svg' : '/svg icons sign in page/Eye off.svg'}
                      alt=""
                      width={48}
                      height={48}
                    />
                  </button>
                </label>

                {showPasswordMatch && (
                  <p className={`password-match ${passwordMatches ? 'is-match' : 'is-mismatch'}`}>
                    {passwordMatches ? 'Password matched!' : "Password doesn't match."}
                  </p>
                )}

                <div className="register-controls">
                  <button className="register-back-step" type="button" onClick={() => setStep('school')}>
                    Go back to School Details
                  </button>
<<<<<<< HEAD
                  <button
                    className="register-continue"
                    type="button"
                    onClick={() => void handleVerifyAccount()}
                    disabled={isSendingVerification}
                  >
                    {isSendingVerification ? 'Sending code…' : 'Verify Account'}
=======
                  <button className="register-continue" type="button" onClick={handleVerifyAccount}>
                    Verify Account
>>>>>>> origin/frontend-user
                  </button>
                </div>
              </div>
            ) : (
              <div className="register-step register-step--verify" key="verify" aria-label="Verify your account">
                <h2>Verify your Account</h2>
                <p className="register-verify-copy">Kindly check your email for the verification code.</p>

                <label className="register-field register-field--verify">
                  <span>{requiredLabel('Verification Code:', formData.verificationCode)}</span>
                  <input
                    name="verification_code"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter verification code"
                    value={formData.verificationCode}
                    onChange={(event) => updateField('verificationCode', event.target.value)}
                  />
                </label>

                <div className="register-controls">
                  <button className="register-back-step" type="button" onClick={() => setStep('account')}>
                    Go back to Account Setup
                  </button>
<<<<<<< HEAD
                  <button
                    className="register-back-step"
                    type="button"
                    disabled={isSendingVerification}
                    onClick={() => void handleVerifyAccount()}
                  >
                    Resend code
                  </button>
=======
>>>>>>> origin/frontend-user
                  <button className="register-continue" type="button" onClick={handleVerificationCreate}>
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        {toastMessage && (
          <div className="auth-toast" role="status" aria-live="polite">
            {toastMessage}
          </div>
        )}

        {showPrivacyModal && (
          <div className={`privacy-modal-overlay${privacyModalClosing ? ' is-closing' : ''}`} role="presentation">
            <section className="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
              <button
                className="privacy-modal__close"
                type="button"
                aria-label="Close privacy agreement"
                onClick={handleClosePrivacyModal}
              >
                <Image src="/svg icons create account page/x-square.svg" alt="" width={40} height={40} />
              </button>

              <div className="privacy-modal__content">
                <p className="privacy-modal__intro">
                  To create your account, please review and agree to the Data Privacy Policy first.
                </p>

                <h2 id="privacy-modal-title">Agreement &amp; Data Privacy</h2>

                <h3>Data Privacy Notice</h3>
                <p>
                  This application, DC Space, collects and processes your personal data to facilitate e-certificate
                  issuance and attendance tracking. We are committed to protecting your privacy in accordance with the
                  Data Privacy Act of 2012 (RA 10173). Your student number will be used to verify your identity and link
                  your records.
                </p>

                <h3>Consent</h3>
                <label className="privacy-consent">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(event) => setPrivacyAgreed(event.target.checked)}
                  />
                  <span>
                    I have read and agree to the Data Privacy Notice and give my consent for the collection and
                    processing of my student number.
                  </span>
                </label>

<<<<<<< HEAD
                <button className="privacy-modal__submit" type="button" onClick={() => void handleCreateAccount()}>
=======
                <button className="privacy-modal__submit" type="button" onClick={handleCreateAccount}>
>>>>>>> origin/frontend-user
                  Create Account
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
      {isCreatingAccount && <LoadingScreen context="create-account-submit" />}
    </div>
  );
}
<<<<<<< HEAD
=======

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.12 14.12C13.8454 14.4147 13.5141 14.6511 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1961C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.87999M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68189 3.96914 7.6566 6.06 6.05999L17.94 17.94ZM9.9 4.23999C10.5883 4.07887 11.2931 3.99833 12 3.99999C19 3.99999 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19L9.9 4.23999Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
>>>>>>> backup/backend-user
