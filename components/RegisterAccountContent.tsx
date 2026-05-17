'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RegisterStep = 'personal' | 'school' | 'account';

type RegisterData = {
  firstName: string;
  lastName: string;
  studentNumber: string;
  course: string;
  school: string;
  organization: string;
  role: string;
  schoolEmail: string;
  password: string;
  confirmPassword: string;
};

const initialData: RegisterData = {
  firstName: '',
  lastName: '',
  studentNumber: '',
  course: '',
  school: '',
  organization: '',
  role: '',
  schoolEmail: '',
  password: '',
  confirmPassword: '',
};

export function RegisterAccountContent() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('personal');
  const [formData, setFormData] = useState<RegisterData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyModalClosing, setPrivacyModalClosing] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const passwordChecks = [
    formData.password.length >= 8,
    /[A-Z]/.test(formData.password),
    /[a-z]/.test(formData.password),
    /\d/.test(formData.password),
    /[^A-Za-z0-9]/.test(formData.password),
  ];
  const passedPasswordChecks = passwordChecks.filter(Boolean).length;
  const passwordStrength = passedPasswordChecks >= 5 ? 'Strong' : passedPasswordChecks >= 3 ? 'Medium' : 'Weak';
  const filledStrengthBoxes = passwordStrength === 'Strong' ? 5 : passwordStrength === 'Medium' ? 3 : 1;
  const showPasswordWarning = formData.password.length > 0 && passwordStrength === 'Weak';
  const showPasswordMatch = formData.confirmPassword.length > 0;
  const passwordMatches = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handlePersonalContinue = () => {
    setStep('school');
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
      formData.schoolEmail,
      formData.password,
      formData.confirmPassword,
    ];

    return !requiredValues.some((value) => !value.trim()) && passwordStrength === 'Strong' && passwordMatches;
  };

  const handleFinish = () => {
    if (!accountIsComplete()) {
      showToast('Please fill in the required details');
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

  const handleCreateAccount = () => {
    if (!privacyAgreed) {
      showToast('Please agree to the Data Privacy Policy');
      return;
    }

    window.localStorage.setItem('dcspaceFirstName', formData.firstName.trim());
    window.localStorage.setItem('dcspaceLastName', formData.lastName.trim());
    window.localStorage.setItem('dcspaceStudentNumber', formData.studentNumber.trim());
    window.localStorage.setItem('dcspaceCourse', formData.course);
    window.localStorage.setItem('dcspaceSchool', formData.school);
    window.localStorage.setItem('dcspaceOrganizationPart', formData.organization.trim());
    window.localStorage.setItem('dcspaceOrganizationRole', formData.role);
    window.localStorage.setItem('dcspaceStudentEmail', formData.schoolEmail.trim());
    window.sessionStorage.removeItem('dcspacePrivacySeen');

    showToast('Created the account');
    window.setTimeout(() => router.push('/login'), 900);
  };

  return (
    <div className="login-scope register-scope">
      <main className={`register-shell${showPrivacyModal ? ' is-modal-open' : ''}`}>
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
              <Link className="register-signin-btn" href="/login">
                <Image src="/svg icons create account page/Arrow left.svg" alt="" width={40} height={40} />
                <span>SIGN IN</span>
              </Link>
            )}
          </div>
        </aside>

        <section className="register-main" aria-label="Create account form">
          <div className="register-form-panel">
            <h1>Create Account</h1>

            {step === 'personal' ? (
              <div className="register-step" key="personal" aria-label="Personal information">
                <h2>Personal Info</h2>

              <label className="register-field">
                <span>First Name*</span>
                <input
                  name="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                />
              </label>

              <label className="register-field">
                <span>Last Name*</span>
                <input
                  name="last_name"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                />
              </label>

              <label className="register-field">
                <span>Student Number*</span>
                <input
                  name="student_number"
                  type="text"
                  placeholder="Enter your student number"
                  value={formData.studentNumber}
                  onChange={(event) => updateField('studentNumber', event.target.value)}
                />
              </label>

              <div className="register-controls register-controls--end">
                <button className="register-continue" type="button" onClick={handlePersonalContinue}>
                  Save &amp; Continue
                </button>
              </div>
              </div>
            ) : step === 'school' ? (
              <div className="register-step register-step--school" key="school" aria-label="School details">
              <h2>School Details</h2>

              <label className="register-field">
                <span>Course*</span>
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

              <label className="register-field">
                <span>School/Department*</span>
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
                  <option value="Officer">Organization Officer</option>
                  <option value="Volunteer">Volunteer</option>
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
            ) : (
              <div className="register-step register-step--account" key="account" aria-label="Account set up">
                <h2>Account Set Up</h2>

                <label className="register-field register-field--compact">
                  <span>School*</span>
                  <input
                    name="school_email"
                    type="email"
                    placeholder="Enter your school email"
                    value={formData.schoolEmail}
                    onChange={(event) => updateField('schoolEmail', event.target.value)}
                  />
                </label>

                <label className="register-field register-field--compact register-password-field">
                  <span>Password*</span>
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
                  <span>Re-enter your password*</span>
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
                  <button className="register-continue" type="button" onClick={handleFinish}>
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

                <button className="privacy-modal__submit" type="button" onClick={handleCreateAccount}>
                  Create Account
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
