import { useMemo, useRef, useState } from "react";
import {
  FaArrowRotateRight,
  FaCheck,
  FaCircleExclamation,
  FaCloudArrowUp,
  FaFileExcel,
  FaMessage,
  FaPhone,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";

import api, { uploadCustomers } from "../services/api";
import "./UploadSales.css";

type ImportMode = "sales" | "customers";
type RowStatus = "idle" | "loading" | "success" | "error";

type SalesRow = {
  phone?: string;
  name?: string;
  factor?: string | number;
  date?: string;
  sale?: number | string;
  profit?: number | string;
  [key: string]: unknown;
};

const money = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

const validExcelFile = (file: File) => /\.(xlsx|xls)$/i.test(file.name);

export default function UploadSales() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>("sales");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [rowStatus, setRowStatus] = useState<Record<number, RowStatus>>({});
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalSales = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.sale || 0), 0),
    [rows]
  );

  const totalProfit = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.profit || 0), 0),
    [rows]
  );

  const validPhones = useMemo(
    () => rows.filter((row) => row.phone && row.phone !== "پیدا نشد").length,
    [rows]
  );

  const resetResult = () => {
    setRows([]);
    setSelectedRows([]);
    setRowStatus({});
    setMessage("");
    setError("");
    setProgress(0);
  };

  const changeMode = (nextMode: ImportMode) => {
    setMode(nextMode);
    setFile(null);
    resetResult();
    if (inputRef.current) inputRef.current.value = "";
  };

  const chooseFile = (nextFile?: File) => {
    setError("");
    setMessage("");

    if (!nextFile) return;
    if (!validExcelFile(nextFile)) {
      setFile(null);
      setError("فقط فایل‌های Excel با پسوند XLS یا XLSX قابل قبول هستند.");
      return;
    }

    setFile(nextFile);
    resetResult();
  };

  const removeFile = () => {
    setFile(null);
    resetResult();
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const upload = async () => {
    if (!file) {
      setError("ابتدا فایل Excel را انتخاب کنید.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setMessage("");

    try {
      if (mode === "customers") {
        await uploadCustomers(file);
        setProgress(100);
        setMessage("فایل مشتریان با موفقیت پردازش و اطلاعات بروزرسانی شد.");
      } else {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/sales/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress(Math.round((event.loaded * 100) / event.total));
          },
        });

        const result = Array.isArray(response.data) ? response.data : [];
        setRows(result);
        setSelectedRows([]);
        setRowStatus({});
        setProgress(100);
        setMessage(`${result.length.toLocaleString("fa-IR")} ردیف فروش پردازش شد.`);
      }
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        mode === "sales"
          ? "آپلود فروش انجام نشد. ساختار فایل یا ارتباط با سرور را بررسی کنید."
          : "بروزرسانی مشتریان انجام نشد. ساختار فایل یا ارتباط با سرور را بررسی کنید."
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleRow = (index: number) => {
    setSelectedRows((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(rows.map((_, index) => index));
    }
  };

  const sendSMS = async (row: SalesRow, index: number) => {
    if (!row.phone || row.phone === "پیدا نشد") {
      setRowStatus((current) => ({ ...current, [index]: "error" }));
      return;
    }

    setRowStatus((current) => ({ ...current, [index]: "loading" }));

    try {
      await api.post("/sms/send", {
        phone: row.phone,
        name: row.name,
        sale: row.sale,
        profit: row.profit,
      });
      setRowStatus((current) => ({ ...current, [index]: "success" }));
    } catch {
      setRowStatus((current) => ({ ...current, [index]: "error" }));
    }
  };

  const sendSelected = async () => {
    for (const index of selectedRows) {
      await sendSMS(rows[index], index);
    }
  };

  return (
    <section className="smartImportPage">
      <header className="smartImportHero">
        <div>
          <span className="smartImportEyebrow">مرکز ورود اطلاعات</span>
          <h1>ورود هوشمند فایل‌های Excel</h1>
          <p>
            فروش روزانه یا لیست مشتریان را وارد کنید؛ سیستم فایل را پردازش و نتیجه را همان لحظه نمایش می‌دهد.
          </p>
        </div>

        <div className="smartImportHeroBadge">
          <FaFileExcel />
          <div>
            <strong>XLS / XLSX</strong>
            <span>پردازش امن فایل</span>
          </div>
        </div>
      </header>

      <div className="importModeTabs" role="tablist" aria-label="نوع ورود اطلاعات">
        <button
          type="button"
          className={mode === "sales" ? "active" : ""}
          onClick={() => changeMode("sales")}
        >
          <FaFileExcel />
          <span>
            <strong>فروش روزانه</strong>
            <small>ثبت و تحلیل فروش و سود</small>
          </span>
        </button>

        <button
          type="button"
          className={mode === "customers" ? "active" : ""}
          onClick={() => changeMode("customers")}
        >
          <FaUsers />
          <span>
            <strong>بروزرسانی مشتریان</strong>
            <small>ورود یا اصلاح لیست اشخاص</small>
          </span>
        </button>
      </div>

      <div className="smartImportGrid">
        <div className="smartImportCard">
          <div className="smartImportCardHeader">
            <div>
              <h2>{mode === "sales" ? "فایل فروش را انتخاب کنید" : "فایل مشتریان را انتخاب کنید"}</h2>
              <p>حداکثر یک فایل Excel در هر مرحله پردازش می‌شود.</p>
            </div>
            <span className="stepPill">مرحله ۱ از ۲</span>
          </div>

          <input
            ref={inputRef}
            type="file"
            hidden
            id="smart-excel-input"
            accept=".xlsx,.xls"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />

          <label
            htmlFor="smart-excel-input"
            className={`smartDropZone ${dragging ? "dragging" : ""} ${file ? "hasFile" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="smartDropIcon">
              {file ? <FaFileExcel /> : <FaCloudArrowUp />}
            </span>

            {file ? (
              <>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} کیلوبایت</span>
              </>
            ) : (
              <>
                <strong>فایل را اینجا رها کنید</strong>
                <span>یا برای انتخاب فایل از رایانه کلیک کنید</span>
              </>
            )}
          </label>

          {file && (
            <div className="selectedFileBar">
              <div>
                <FaCheck />
                <span>فایل آماده پردازش است</span>
              </div>
              <button type="button" onClick={removeFile} aria-label="حذف فایل">
                <FaXmark />
                حذف
              </button>
            </div>
          )}

          {uploading && (
            <div className="uploadProgressBox">
              <div>
                <span>در حال ارسال و پردازش فایل...</span>
                <strong>{progress.toLocaleString("fa-IR")}٪</strong>
              </div>
              <div className="uploadProgressTrack">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="importAlert error">
              <FaCircleExclamation />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="importAlert success">
              <FaCheck />
              <span>{message}</span>
            </div>
          )}

          <button
            type="button"
            className="smartUploadButton"
            onClick={upload}
            disabled={!file || uploading}
          >
            {uploading ? <FaArrowRotateRight className="spin" /> : <FaCloudArrowUp />}
            {uploading
              ? "در حال پردازش..."
              : mode === "sales"
              ? "آپلود و پردازش فروش"
              : "بروزرسانی اطلاعات مشتریان"}
          </button>
        </div>

        <aside className="importGuideCard">
          <span className="stepPill muted">راهنمای فایل</span>
          <h3>قبل از آپلود بررسی کنید</h3>
          <ul>
            <li><FaCheck /> فایل با پسوند XLS یا XLSX باشد.</li>
            <li><FaCheck /> عنوان ستون‌ها و قالب فایل تغییر نکرده باشد.</li>
            <li><FaCheck /> شماره موبایل‌ها بدون فاصله و کاراکتر اضافی باشند.</li>
            <li><FaCheck /> مبلغ‌ها به‌صورت عددی ثبت شده باشند.</li>
          </ul>

          <div className="importPrivacyNote">
            <FaFileExcel />
            <div>
              <strong>پردازش مستقیم</strong>
              <span>نتیجه فایل پس از دریافت از سرور در همین صفحه نمایش داده می‌شود.</span>
            </div>
          </div>
        </aside>
      </div>

      {mode === "sales" && rows.length > 0 && (
        <>
          <div className="importStatsGrid">
            <article>
              <span><FaUsers /></span>
              <div><small>ردیف‌های پردازش‌شده</small><strong>{rows.length.toLocaleString("fa-IR")}</strong></div>
            </article>
            <article>
              <span><FaPhone /></span>
              <div><small>شماره تماس معتبر</small><strong>{validPhones.toLocaleString("fa-IR")}</strong></div>
            </article>
            <article>
              <span><FaFileExcel /></span>
              <div><small>جمع فروش</small><strong>{money(totalSales)} تومان</strong></div>
            </article>
            <article>
              <span><FaCheck /></span>
              <div><small>جمع سود</small><strong>{money(totalProfit)} تومان</strong></div>
            </article>
          </div>

          <div className="importResultCard">
            <div className="importResultHeader">
              <div>
                <h2>نتیجه پردازش فروش</h2>
                <p>ردیف‌ها را بررسی و برای مشتریان انتخاب‌شده پیامک ارسال کنید.</p>
              </div>

              <button
                type="button"
                className="sendSelectedButton"
                disabled={selectedRows.length === 0}
                onClick={sendSelected}
              >
                <FaMessage />
                ارسال به {selectedRows.length.toLocaleString("fa-IR")} مورد
              </button>
            </div>

            <div className="importTableWrap">
              <table className="importTable">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && selectedRows.length === rows.length}
                        onChange={toggleAll}
                        aria-label="انتخاب همه"
                      />
                    </th>
                    <th>مشتری</th>
                    <th>موبایل</th>
                    <th>فاکتور</th>
                    <th>تاریخ</th>
                    <th>فروش</th>
                    <th>سود</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const status = rowStatus[index] || "idle";
                    const name = row.name || "مشتری بدون نام";
                    return (
                      <tr key={`${row.factor || "row"}-${index}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(index)}
                            onChange={() => toggleRow(index)}
                            aria-label={`انتخاب ${name}`}
                          />
                        </td>
                        <td>
                          <div className="importCustomerCell">
                            <span>{String(name).charAt(0)}</span>
                            <strong>{name}</strong>
                          </div>
                        </td>
                        <td dir="ltr">{row.phone || "پیدا نشد"}</td>
                        <td>{row.factor || "—"}</td>
                        <td>{row.date || "—"}</td>
                        <td>{money(row.sale)} تومان</td>
                        <td>{money(row.profit)} تومان</td>
                        <td>
                          <span className={`rowState ${status}`}>
                            {status === "loading" && "در حال ارسال"}
                            {status === "success" && "ارسال شد"}
                            {status === "error" && "ناموفق"}
                            {status === "idle" && (row.phone && row.phone !== "پیدا نشد" ? "آماده" : "شماره ناقص")}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="rowSmsButton"
                            onClick={() => sendSMS(row, index)}
                            disabled={status === "loading" || status === "success"}
                          >
                            <FaMessage />
                            پیامک
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
