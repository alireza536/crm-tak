import { useRef, useState } from "react";
import axios from "axios";
import {
  FaCheck,
  FaCircleExclamation,
  FaCloudArrowUp,
  FaFileExcel,
  FaReceipt,
  FaXmark,
} from "react-icons/fa6";
import { uploadCustomers, uploadSalesInvoice } from "../services/api";
import "./UploadSales.css";

type ImportMode = "sales" | "customers";

type InvoiceDetails = {
  factor?: string;
  date?: string;
  phone?: string;
  name?: string;
  sale?: number;
  discount?: number;
};

type ImportResult = {
  success?: boolean;
  duplicate?: boolean;
  message?: string;
  extracted?: InvoiceDetails;
  invoice?: {
    factor?: string;
    sale?: number;
    discount?: number;
    createdAt?: string;
    user?: {
      name?: string;
      phone?: string;
    };
  };
};

const validExcelFile = (file: File) => /\.(xlsx|xls)$/i.test(file.name);
const money = (value: unknown) => Number(value || 0).toLocaleString("fa-IR");

export default function UploadSales() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("sales");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const chooseFile = (nextFile?: File) => {
    setError("");
    setResult(null);
    if (!nextFile) return;
    if (!validExcelFile(nextFile)) {
      setError("فقط فایل Excel با پسوند XLS یا XLSX قابل قبول است.");
      return;
    }
    setFile(nextFile);
  };

  const upload = async () => {
    if (!file) {
      setError("ابتدا فایل اکسل را انتخاب کنید.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError("");
      setResult(null);

      if (mode === "customers") {
        const response = await uploadCustomers(file);
        setResult({ success: true, message: response?.message || "اطلاعات مشتریان ثبت شد." });
      } else {
        const response = (await uploadSalesInvoice(file, setProgress)) as ImportResult;
        const invoice = response?.invoice;
        const user = invoice?.user;

        setResult({
          ...response,
          extracted: {
            factor: response?.extracted?.factor || invoice?.factor,
            date: response?.extracted?.date || invoice?.createdAt,
            phone: response?.extracted?.phone || user?.phone,
            name: response?.extracted?.name || user?.name,
            sale: response?.extracted?.sale ?? invoice?.sale,
            discount: response?.extracted?.discount ?? invoice?.discount,
          },
        });
      }
      setProgress(100);
    } catch (requestError: unknown) {
      let message = "ثبت فایل انجام نشد. ساختار فایل یا ارتباط با سرور را بررسی کنید.";
      if (axios.isAxiosError(requestError)) {
        const serverMessage = requestError.response?.data?.message;
        if (Array.isArray(serverMessage)) message = serverMessage.join(" - ");
        else if (typeof serverMessage === "string") message = serverMessage;
      }
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="smartImportPage" dir="rtl">
      <header className="smartImportHero">
        <div>
          <span className="smartImportEyebrow">مرکز ورود اطلاعات</span>
          <h1>ثبت خودکار فاکتور فروش</h1>
          <p>فایل فاکتور را بارگذاری کنید؛ مشتری شناسایی و فاکتور همان لحظه در CRM ثبت می‌شود.</p>
        </div>
        <div className="smartImportHeroBadge">
          <FaFileExcel />
          <div><strong>XLS / XLSX</strong><span>ثبت مستقیم در سیستم</span></div>
        </div>
      </header>

      <div className="importModeTabs">
        <button type="button" className={mode === "sales" ? "active" : ""} onClick={() => { setMode("sales"); reset(); }}>
          <FaReceipt /><span><strong>فاکتور فروش</strong><small>ثبت خودکار فاکتور و نمودارها</small></span>
        </button>
        <button type="button" className={mode === "customers" ? "active" : ""} onClick={() => { setMode("customers"); reset(); }}>
          <FaFileExcel /><span><strong>لیست مشتریان</strong><small>ورود یا بروزرسانی اشخاص</small></span>
        </button>
      </div>

      <div className="smartImportCard">
        <input ref={inputRef} hidden type="file" id="smart-excel-input" accept=".xls,.xlsx" onChange={(event) => chooseFile(event.target.files?.[0])} />
        <label className={`smartDropZone ${file ? "hasFile" : ""}`} htmlFor="smart-excel-input">
          <span className="smartDropIcon">{file ? <FaFileExcel /> : <FaCloudArrowUp />}</span>
          <strong>{file?.name || "برای انتخاب فایل اکسل کلیک کنید"}</strong>
          <span>{file ? `${Math.ceil(file.size / 1024).toLocaleString("fa-IR")} کیلوبایت` : "فایل فاکتور فروش یا لیست مشتریان"}</span>
        </label>

        {file && (
          <div className="selectedFileBar">
            <div><FaCheck /><span>فایل آماده ثبت است</span></div>
            <button type="button" onClick={reset}><FaXmark /> حذف</button>
          </div>
        )}

        {uploading && (
          <div className="uploadProgressBox">
            <div><span>در حال خواندن و ثبت اطلاعات...</span><strong>{progress.toLocaleString("fa-IR")}٪</strong></div>
            <div className="uploadProgressTrack"><span style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {error && <div className="importAlert error"><FaCircleExclamation /><span>{error}</span></div>}

        {result && (
          <div className={`importAlert ${result.duplicate ? "warning" : "success"}`}>
            <FaCheck />
            <div>
              <strong>{result.duplicate ? "فاکتور تکراری بود" : "ثبت با موفقیت انجام شد"}</strong>
              <span>{result.message}</span>
            </div>
          </div>
        )}

        {result?.extracted && (
          <div className="importResultGrid">
            <div><span>شماره فاکتور</span><strong>{result.extracted.factor || "—"}</strong></div>
            <div><span>مشتری</span><strong>{result.extracted.name || "—"}</strong></div>
            <div><span>موبایل</span><strong>{result.extracted.phone || "—"}</strong></div>
            <div><span>مبلغ فروش</span><strong>{money(result.extracted.sale)} تومان</strong></div>
            <div><span>تخفیف</span><strong>{money(result.extracted.discount)} تومان</strong></div>
            <div><span>تاریخ فایل</span><strong>{result.extracted.date || "—"}</strong></div>
          </div>
        )}

        <button type="button" className="smartPrimaryButton" disabled={!file || uploading} onClick={upload}>
          {uploading ? "در حال ثبت..." : mode === "sales" ? "ثبت خودکار فاکتور" : "ثبت اطلاعات مشتریان"}
        </button>
      </div>
    </section>
  );
}
