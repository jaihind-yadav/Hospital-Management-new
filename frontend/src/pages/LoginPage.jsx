import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi, patientOtpLoginApi, sendOtpApi } from "../features/auth/auth.api";
import { roleHomeRoute } from "../utils/auth";
import {
  validateLogin,
  validatePatientOtpLoginStepOne,
  validatePatientOtpLoginStepTwo,
} from "../utils/validation";

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("email");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [otpForm, setOtpForm] = useState({
    mobile: "",
    otpCode: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onOtpChange = (e) => {
    const { name, value } = e.target;
    setOtpForm((prev) => ({ ...prev, [name]: name === "mobile" ? value.replace(/\D/g, "").slice(0, 15) : value.replace(/\D/g, "").slice(0, 6) }));
    setErrors((prev) => ({ ...prev, [name]: "", otpCode: "" }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const res = await loginApi(form);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate(roleHomeRoute(res.user.role));
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setOtpMessage("");
    const nextErrors = validatePatientOtpLoginStepOne({ mobile: otpForm.mobile });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const res = await sendOtpApi({ mobile: otpForm.mobile });
      setOtpSent(true);
      setOtpMessage(`OTP sent successfully. Demo OTP: ${res.otp_code}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOtpLogin = async (e) => {
    e.preventDefault();
    setError("");
    const nextErrors = validatePatientOtpLoginStepTwo({
      mobile: otpForm.mobile,
      otpCode: otpForm.otpCode,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const res = await patientOtpLoginApi({
        mobile: otpForm.mobile,
        otp_code: otpForm.otpCode,
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate(roleHomeRoute(res.user.role));
    } catch (err) {
      setError(err?.response?.data?.message || "OTP login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-panel-strong section-enter grid w-full max-w-5xl overflow-hidden rounded-[32px] md:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-[#1f3f75] via-[#244d8f] to-[#2d5daa] p-10 text-white md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-100">
            Clinical Operations
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            A calmer dashboard for patient care, teams, and hospital workflows.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-100/90">
            Sign in to manage appointments, doctor slots, patient reports, and user
            access from one place.
          </p>
          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              Faster role-based routing and a cleaner command center.
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              Inline validation helps teams move with fewer failed submissions.
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <h1 className="mb-1 text-3xl font-bold text-slate-900">Hospital Management</h1>
          <p className="mb-6 text-sm text-slate-500">Login to continue</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                mode === "email" ? "bg-[#1f3f75] text-white" : "border border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => {
                setMode("email");
                setError("");
              }}
            >
              Email Login
            </button>
            <button
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                mode === "otp" ? "bg-[#1f3f75] text-white" : "border border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => {
                setMode("otp");
                setError("");
              }}
            >
              Patient OTP Login
            </button>
          </div>

          {mode === "email" ? (
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-[#1f3f75] ${
                    errors.email ? "field-error" : "border-slate-300"
                  }`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange}
                  required
                  className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-[#1f3f75] ${
                    errors.password ? "field-error" : "border-slate-300"
                  }`}
                />
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 font-medium text-white transition hover:shadow-lg hover:shadow-[#1f3f75]/20 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={onOtpLogin} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile number"
                  value={otpForm.mobile}
                  onChange={onOtpChange}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-[#1f3f75] ${
                    errors.mobile ? "field-error" : "border-slate-300"
                  }`}
                />
              </div>
              {errors.mobile && <p className="text-sm text-red-600">{errors.mobile}</p>}
              <button
                type="button"
                disabled={loading}
                onClick={onSendOtp}
                className="w-full rounded-2xl border border-[#1f3f75] px-4 py-3 font-medium text-[#1f3f75] transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">OTP Code</label>
                <input
                  type="text"
                  name="otpCode"
                  placeholder="Enter OTP"
                  value={otpForm.otpCode}
                  onChange={onOtpChange}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-[#1f3f75] ${
                    errors.otpCode ? "field-error" : "border-slate-300"
                  }`}
                />
              </div>
              {errors.otpCode && <p className="text-sm text-red-600">{errors.otpCode}</p>}
              {otpMessage && <div className="text-sm text-[#1f3f75]">{otpMessage}</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button
                type="submit"
                disabled={loading || !otpSent}
                className="w-full rounded-2xl bg-gradient-to-r from-[#1f3f75] to-[#2d5daa] px-4 py-3 font-medium text-white transition hover:shadow-lg hover:shadow-[#1f3f75]/20 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login with OTP"}
              </button>
            </form>
          )}
          <p className="mt-4 text-sm text-slate-600">
            New patient or executive-booked patient?{" "}
            <Link to="/patient/register" className="font-medium text-[#1f3f75] hover:underline">
              Verify mobile and complete account setup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
