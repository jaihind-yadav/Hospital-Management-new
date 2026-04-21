import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  registerPatientApi,
  sendOtpApi,
  verifyOtpApi,
} from "../features/auth/auth.api";
import AppShell from "../components/AppShellReference";
import {
  validatePatientRegistrationStepOne,
  validatePatientRegistrationStepTwo,
  validatePatientRegistrationStepThree,
} from "../utils/validation";

const PatientRegisterPage = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const nextErrors = validatePatientRegistrationStepOne({ mobile });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const res = await sendOtpApi({ mobile });
      setMessage(`OTP sent successfully. Demo OTP: ${res.otp_code}`);
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const nextErrors = validatePatientRegistrationStepTwo({ otpCode });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      await verifyOtpApi({ mobile, otp_code: otpCode });
      setMessage("Mobile verified successfully. Complete registration.");
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const nextErrors = validatePatientRegistrationStepThree({
      ...registerForm,
      mobile,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const res = await registerPatientApi({
        ...registerForm,
        mobile,
      });
      setMessage(res.message || "Patient registration completed successfully. Please login now.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Patient Registration" showSidebar={false} showUserMenu={false}>
      <div className="glass-panel-strong section-enter mx-auto w-full max-w-3xl rounded-[32px] p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-800">Patient Registration</h1>
        <p className="mt-1 mb-2 text-sm text-slate-500">Step {step} of 3</p>
        <p className="mb-5 text-sm text-slate-500">
          Use this flow for both new patients and executive-booked patients who need to activate self-login.
        </p>

        {step === 1 && (
          <form onSubmit={onSendOtp} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mobile Number</label>
              <input
                type="text"
                placeholder="Mobile number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-[#1f3f75] ${
                  errors.mobile ? "field-error" : "border-slate-300"
                }`}
              />
            </div>
            {errors.mobile && <div className="text-sm text-red-600">{errors.mobile}</div>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 font-medium text-white hover:shadow-lg hover:shadow-[#1f3f75]/20 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={onVerifyOtp} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Verified Mobile Number</label>
              <input
                type="text"
                value={mobile}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">OTP Code</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setErrors((prev) => ({ ...prev, otpCode: "" }));
                }}
                required
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#1f3f75] ${
                  errors.otpCode ? "field-error" : "border-slate-300"
                }`}
              />
            </div>
            {errors.otpCode && <div className="text-sm text-red-600">{errors.otpCode}</div>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 font-medium text-white hover:shadow-lg hover:shadow-[#1f3f75]/20 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={onRegister} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={registerForm.name}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                required
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#1f3f75] ${
                  errors.name ? "field-error" : "border-slate-300"
                }`}
              />
            </div>
            {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, email: e.target.value }));
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                required
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#1f3f75] ${
                  errors.email ? "field-error" : "border-slate-300"
                }`}
              />
            </div>
            {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) => {
                  setRegisterForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                required
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#1f3f75] ${
                  errors.password ? "field-error" : "border-slate-300"
                }`}
              />
            </div>
            {errors.password && <div className="text-sm text-red-600">{errors.password}</div>}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Verified Mobile Number</label>
              <input
                type="text"
                value={mobile}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 font-medium text-white hover:shadow-lg hover:shadow-[#1f3f75]/20 disabled:opacity-60"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}

        {message && <div className="mt-4 text-sm text-[#1f3f75]">{message}</div>}
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        <p className="mt-4 text-sm text-slate-600">
          Already have account?{" "}
          <Link to="/login" className="font-medium text-[#1f3f75] hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </AppShell>
  );
};

export default PatientRegisterPage;
