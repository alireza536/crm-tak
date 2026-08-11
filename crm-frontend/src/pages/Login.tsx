import axios from "axios";
import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login, userFromLogin } from "../services/api";
import { getSession, saveSession } from "../utils/auth";
import "./Login.css";

const latinDigits = (value: string) => value
  .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getSession()) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const normalizedPhone = latinDigits(phone).replace(/\D/g, "");
      const normalizedPassword = latinDigits(password).trim();
      const data = await login(normalizedPhone, normalizedPassword);
      saveSession(data.access_token, userFromLogin(data));
      navigate("/", { replace: true });
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError) && !requestError.response) {
        setError("ارتباط با سرور برقرار نشد. چند لحظه دیگر دوباره تلاش کنید.");
      } else {
        setError("شماره تلفن یا رمز عبور اشتباه است.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage" dir="rtl">
      <form className="loginCard" onSubmit={submit}>
        <div className="loginBrand">TAK CRM</div>
        <h1>ورود به سامانه CRM</h1>
        <p>برای ادامه، شماره تلفن و رمز عبور خود را وارد کنید.</p>
        <label><span>شماره تلفن</span><input inputMode="tel" autoComplete="username" placeholder="09123456789" value={phone} onChange={event => setPhone(event.target.value)} required /></label>
        <label><span>رمز عبور</span><input type="password" autoComplete="current-password" placeholder="رمز عبور" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        {error && <div className="loginError">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? "در حال ورود..." : "ورود"}</button>
      </form>
    </div>
  );
}
