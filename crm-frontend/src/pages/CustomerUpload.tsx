import { useState } from "react";
import "./CustomerUpload.css";
import { uploadCustomers } from "../services/api";

export default function CustomerUpload() {

  const [file, setFile] = useState<File | null>(null);
  async function upload() {

  if (!file) {

    alert("ابتدا فایل را انتخاب کنید");

    return;

  }

  try {

    const result = await uploadCustomers(file);

    console.log(result);

    alert("بروزرسانی انجام شد");

  } catch (e) {

    alert("خطا در بروزرسانی");

  }

}

  return (

    <div className="customerUploadPage">

      <div className="uploadHeader">

        <div>

          <h1>بروزرسانی مشتریان</h1>

          <p>

            فایل اکسل مشتریان را انتخاب کنید

          </p>

        </div>

      </div>

      <div className="uploadCard">

        <input

          type="file"

          accept=".xlsx,.xls"

          onChange={(e)=>{

            if(e.target.files){

              setFile(e.target.files[0]);

            }

          }}

        />

        <p>

          {file
            ? file.name
            : "هیچ فایلی انتخاب نشده است"}

        </p>

      <button onClick={upload}>

  بروزرسانی مشتریان

</button>
      </div>

    </div>

  );

}