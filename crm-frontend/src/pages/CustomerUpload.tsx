import { useState } from "react";
import axios from "axios";

import "./CustomerUpload.css";
import { uploadCustomers } from "../services/api";

export default function CustomerUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function upload() {
    if (!file) {
      setIsError(true);
      setMessage("ابتدا فایل اکسل مشتریان را انتخاب کنید.");
      return;
    }

    try {
      setIsUploading(true);
      setIsError(false);
      setMessage("فایل در حال ارسال و پردازش است...");

      const result = await uploadCustomers(file);

      console.log("Customer upload result:", result);

      setIsError(false);
      setMessage(
        result?.message ||
          "فایل مشتریان با موفقیت ارسال و پردازش شد."
      );
    } catch (error: unknown) {
      console.error("Customer upload error:", error);

      let errorMessage =
        "به‌روزرسانی مشتریان انجام نشد. ارتباط با سرور را بررسی کنید.";

      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message;

        if (Array.isArray(serverMessage)) {
          errorMessage = serverMessage.join(" - ");
        } else if (typeof serverMessage === "string") {
          errorMessage = serverMessage;
        } else if (error.response?.status === 404) {
          errorMessage =
            "مسیر بارگذاری فایل در سرور پیدا نشد.";
        } else if (error.response?.status === 413) {
          errorMessage =
            "حجم فایل بیشتر از حد مجاز سرور است.";
        } else if (error.response?.status === 500) {
          errorMessage =
            "سرور هنگام پردازش فایل با خطا مواجه شد.";
        } else if (error.code === "ECONNABORTED") {
          errorMessage =
            "زمان پردازش فایل طولانی شد و ارتباط قطع شد.";
        }
      }

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="customerUploadPage">
      <div className="uploadHeader">
        <div>
          <h1>به‌روزرسانی مشتریان</h1>

          <p>
            فایل اکسل مشتریان را انتخاب و برای پردازش ارسال کنید.
          </p>
        </div>
      </div>

      <div className="uploadCard">
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={isUploading}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;

            setFile(selectedFile);
            setMessage("");
            setIsError(false);
          }}
        />

        <p>
          {file
            ? `فایل انتخاب‌شده: ${file.name}`
            : "هیچ فایلی انتخاب نشده است"}
        </p>

        <button
          type="button"
          onClick={upload}
          disabled={!file || isUploading}
        >
          {isUploading
            ? "در حال پردازش..."
            : "به‌روزرسانی اطلاعات مشتریان"}
        </button>

        {message && (
          <div className={isError ? "uploadError" : "uploadSuccess"}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}