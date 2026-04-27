"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type RegisterReview = {
  firstName: string;
  lastName: string;
  studentNumber: string;
  studentEmail: string;
  rfidNumber: string;
  organizationPart: string;
  organizationRole: string;
  course: string;
  school: string;
  password: string;
  confirmPassword: string;
};

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
};

export function RegisterAccountContent() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState<RegisterReview>(emptyReview);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains an uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Contains a lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Contains a number", valid: /\d/.test(password) },
    { label: "Contains a special character", valid: /[^A-Za-z0-9]/.test(password) },
    { label: "Passwords match", valid: password.length > 0 && password === confirmPassword },
  ];

  const passwordIsValid = passwordChecks.every((check) => check.valid);

  const getValue = (formData: FormData, key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
  };

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
  };

  const handleSignUp = () => {
    if (!formRef.current) return;

    if (!passwordIsValid) {
      setValidationError("Please complete all password requirements before signing up.");
      setShowReview(false);
      return;
    }

    const formData = new FormData(formRef.current);

    window.localStorage.setItem("dcspaceStudentNumber", getValue(formData, "student_number"));
    window.localStorage.setItem("dcspaceStudentEmail", studentEmail.trim());
    window.localStorage.setItem("dcspaceRfidNumber", getValue(formData, "rfid_number"));
    window.localStorage.setItem("dcspaceCourse", getValue(formData, "course"));
    window.localStorage.setItem("dcspaceSchool", getValue(formData, "school"));
    window.localStorage.setItem("dcspaceOrganizationPart", getValue(formData, "organization_part"));
    window.localStorage.setItem("dcspaceOrganizationRole", getValue(formData, "organization_role"));
    window.sessionStorage.removeItem("dcspacePrivacySeen");

    router.push("/login");
  };

  return (
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

        <div className="register-actions">
          <button className="review-btn" type="button" onClick={handleReview}>
            Review
          </button>

          <button className="signup-btn" type="button" onClick={handleSignUp}>
            Sign Up
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M7 12.4L10.2 15.5L17 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>

        <Link href="/login" className="back-login-link register-back-link">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 5L9.66939 11.2191C9.2842 11.6684 9.2842 12.3316 9.66939 12.7809L15 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Back to Login
        </Link>

        {showReview && (
          <div className="register-review-overlay">
            <section className="register-review-modal" role="dialog" aria-modal="true" aria-labelledby="register-review-title">
              <div className="register-review-header">
                <h2 id="register-review-title">Review Account Info</h2>

                <button type="button" className="register-review-close" aria-label="Close review" onClick={() => setShowReview(false)}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

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

              <div className="register-review-actions">
                <button className="review-btn" type="button" onClick={() => setShowReview(false)}>
                  Edit
                </button>

                <button className="signup-btn" type="button" onClick={handleSignUp}>
                  Sign Up
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 12.4L10.2 15.5L17 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

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