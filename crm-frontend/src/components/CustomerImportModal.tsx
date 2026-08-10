import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { ActionButton, Badge, DataTable } from "./ui/DesignSystem";
import { importCustomers, previewCustomerImport, type CustomerImportRow } from "../services/api";
import "./CustomerImportModal.css";

type Preview={fileName:string;totalRows:number;validRows:number;invalidRows:number;rows:CustomerImportRow[]};
type Result={importedRows:number;failedRows:number;totalRows:number;createdCustomers:Array<{id:number;name:string;phone:string}>};

export default function CustomerImportModal({open,onClose,onImported}:{open:boolean;onClose:()=>void;onImported:()=>Promise<void>|void}){
  const inputRef=useRef<HTMLInputElement>(null);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [progress,setProgress]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<Result|null>(null);
  useEffect(()=>{if(!open){setPreview(null);setProgress(0);setError("");setResult(null)}},[open]);
  if(!open)return null;
  const selectFile=async(file?:File)=>{if(!file)return;setBusy(true);setError("");setResult(null);setProgress(1);try{setPreview(await previewCustomerImport(file,setProgress));setProgress(100)}catch(e:any){setPreview(null);setError(e.response?.data?.message||"فایل قابل پردازش نیست.")}finally{setBusy(false)}};
  const confirm=async()=>{if(!preview||!preview.validRows)return;setBusy(true);setError("");setProgress(10);try{const response=await importCustomers({fileName:preview.fileName,rows:preview.rows});setResult(response);setProgress(100);await onImported()}catch(e:any){setError(e.response?.data?.message||"ثبت مشتریان انجام نشد.");setProgress(0)}finally{setBusy(false)}};
  return createPortal(<div className="customerImportBackdrop" onMouseDown={onClose}><section className="customerImportModal" onMouseDown={event=>event.stopPropagation()} dir="rtl">
    <header><div><span>DATA IMPORT</span><h2>ورود گروهی مشتریان</h2><p>فایل CSV یا Excel را بررسی و سپس اطلاعات معتبر را ثبت کنید.</p></div><button onClick={onClose} aria-label="بستن"><X/></button></header>
    {!preview&&!result&&<button className={"customerImportDrop "+(busy?"uploading":"")} type="button" onClick={()=>inputRef.current?.click()} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void selectFile(event.dataTransfer.files[0])}}><input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={event=>void selectFile(event.target.files?.[0])}/><i><UploadCloud/></i><strong>{busy?"در حال تحلیل فایل...":"انتخاب یا رها کردن فایل"}</strong><span>CSV، XLSX یا XLS بدون محدودیت تعداد ردیف</span></button>}
    {progress>0&&<div className="customerImportProgress"><span style={{width:progress+"%"}}/><small>{progress.toLocaleString("fa-IR")}٪</small></div>}
    {error&&<div className="customerImportError"><AlertCircle/><span>{error}</span></div>}
    {preview&&!result&&<><div className="customerImportSummary"><div><FileSpreadsheet/><span>کل ردیف‌ها<strong>{preview.totalRows.toLocaleString("fa-IR")}</strong></span></div><div className="valid"><CheckCircle2/><span>آماده ثبت<strong>{preview.validRows.toLocaleString("fa-IR")}</strong></span></div><div className="invalid"><AlertCircle/><span>دارای خطا<strong>{preview.invalidRows.toLocaleString("fa-IR")}</strong></span></div></div>
      <DataTable className="customerImportTable"><thead><tr><th>ردیف</th><th>نام مشتری</th><th>فروشگاه</th><th>موبایل</th><th>کد ملی</th><th>استان / شهر</th><th>وضعیت</th><th>تخصیص</th><th>اعتبارسنجی</th></tr></thead><tbody>{preview.rows.slice(0,100).map(row=><tr key={row.rowNumber} className={row.errors.length?"hasError":""}><td>{row.rowNumber.toLocaleString("fa-IR")}</td><td>{row.name||"—"}</td><td>{row.storeName||"—"}</td><td>{row.phone||"—"}</td><td>{row.nationalCode||"—"}</td><td>{[row.province,row.city].filter(Boolean).join(" / ")||"—"}</td><td>{row.status}</td><td><Badge tone="info">مشتری آزاد</Badge></td><td>{row.errors.length?<span className="rowErrors">{row.errors.join("، ")}</span>:<Badge tone="success">معتبر</Badge>}</td></tr>)}</tbody></DataTable>
      {preview.rows.length>100&&<small className="previewLimit">۱۰۰ ردیف اول نمایش داده شده است؛ همه ردیف‌ها هنگام ثبت پردازش می‌شوند.</small>}</>}
    {result&&<div className="customerImportDone"><i><CheckCircle2/></i><h3>ورود مشتریان تکمیل شد</h3><p><strong>{result.importedRows.toLocaleString("fa-IR")}</strong> مشتری ثبت و <strong>{result.failedRows.toLocaleString("fa-IR")}</strong> ردیف رد شد.</p>{result.createdCustomers.length>0&&<div className="importedCustomerList">{result.createdCustomers.slice(0,12).map(customer=><span key={customer.id}><b>{customer.name}</b><small>{customer.phone}</small></span>)}</div>}</div>}
    <footer><ActionButton className="secondary" type="button" onClick={result?onClose:()=>{setPreview(null);setProgress(0);setError("")}}>{result?"بستن":"انتخاب فایل دیگر"}</ActionButton>{preview&&!result&&<ActionButton type="button" disabled={busy||preview.validRows===0} onClick={()=>void confirm()}>{busy?"در حال ثبت...":"تأیید و ورود "+preview.validRows.toLocaleString("fa-IR")+" مشتری"}</ActionButton>}</footer>
  </section></div>,document.body);
}
