import "./UploadSales.css";

import { useState } from "react";
import api from "../services/api";

export default function UploadSales() {

  const [rows, setRows] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<any>({});
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const upload = async () => {

    if (!file) {

      alert("ابتدا فایل را انتخاب کنید");

      return;

    }

    const formData = new FormData();

    formData.append("file", file);

    try {

      const response = await api.post(

        "/sales/upload",

        formData

      );

      setRows(response.data);

      setStatus({});

      setSelectedRows([]);

    } catch (error) {

      console.log(error);

      alert("خطا در ارسال فایل");

    }

  };

  const sendSMS = async (row: any, index: number) => {

    if (row.phone === "پیدا نشد" || !row.phone) {

      setStatus((prev: any) => ({

        ...prev,

        [index]: "error",

      }));

      return;

    }

    setStatus((prev: any) => ({

      ...prev,

      [index]: "loading",

    }));

    try {

      await api.post("/sms/send", {

        phone: row.phone,

        name: row.name,

        sale: row.sale,

        profit: row.profit,

      });

      setStatus((prev: any) => ({

        ...prev,

        [index]: "success",

      }));

    } catch {

      setStatus((prev: any) => ({

        ...prev,

        [index]: "error",

      }));

    }

  };

  const toggleRow = (index: number) => {

    if (selectedRows.includes(index)) {

      setSelectedRows(

        selectedRows.filter(i => i !== index)

      );

    } else {

      setSelectedRows([

        ...selectedRows,

        index,

      ]);

    }

  };

  const sendSelected = async () => {

    for (const index of selectedRows) {

      await sendSMS(rows[index], index);

    }

  };
  return (

<div className="uploadPage">

  <div className="uploadHeader">

    <div>

      <h1>📤 آپلود فروش روزانه</h1>

      <p>

        فایل اکسل فروش امروز را انتخاب کنید

      </p>

    </div>

  </div>

  <div className="uploadCard">

    <input

      type="file"

      hidden

      id="excel"

      accept=".xlsx,.xls"

      onChange={(e)=>{

        if(e.target.files){

          setFile(e.target.files[0]);

        }

      }}

    />

    <label

      htmlFor="excel"

      className="dropZone"

    >

      <div className="uploadIcon">

        📁

      </div>

      <h2>

        فایل Excel را انتخاب کنید

      </h2>

      <p>

        فایل را اینجا رها کنید یا کلیک کنید

      </p>

      {

        file && (

          <span className="fileName">

            {file.name}

          </span>

        )

      }

    </label>

    <button

      className="uploadButton"

      onClick={upload}

    >

      آپلود فایل

    </button>

  </div>

  <div className="uploadStats">

    <div className="statCard">

      <h4>

        👥 مشتری

      </h4>

      <h2>

        {rows.length}

      </h2>

    </div>

    <div className="statCard">

      <h4>

        💰 جمع فروش

      </h4>

      <h2>

        {

          rows.reduce(

            (sum,item)=>sum+Number(item.sale),

            0

          ).toLocaleString()

        }

      </h2>

    </div>

    <div className="statCard">

      <h4>

        📈 جمع سود

      </h4>

      <h2>

        {

          rows.reduce(

            (sum,item)=>sum+Number(item.profit),

            0

          ).toLocaleString()

        }

      </h2>

    </div>

  </div>
  <h2 className="tableTitle">

📋 لیست مشتریان

</h2>

<div className="tableCard">

<table className="customerTable">

<thead>

<tr>

<th>✔</th>

<th>موبایل</th>

<th>نام مشتری</th>

<th>فاکتور</th>

<th>تاریخ</th>

<th>فروش</th>

<th>سود</th>

<th>وضعیت</th>

<th>عملیات</th>

</tr>

</thead>

<tbody>

{

rows.map((row:any,index:number)=>(

<tr key={index}>

<td>

<input

type="checkbox"

checked={selectedRows.includes(index)}

onChange={()=>toggleRow(index)}

/>

</td>

<td>

{row.phone}

</td>

<td>

<div className="customerInfo">

<div className="avatar">

{

row.name

?

row.name.charAt(0)

:

"؟"

}

</div>

<div>

<b>

{row.name}

</b>

</div>

</div>

</td>

<td>

{row.factor}

</td>

<td>

{row.date}

</td>

<td>

{

Number(row.sale).toLocaleString()

}

</td>

<td>

{

Number(row.profit).toLocaleString()

}

</td>

<td>

{

status[index]==="success"

?

<span className="success">

ارسال شد

</span>

:

status[index]==="loading"

?

<span className="loading">

درحال ارسال

</span>

:

status[index]==="error"

?

<span className="error">

خطا

</span>

:

<span className="ready">

آماده

</span>

}

</td>

<td>

<button

className="sendButton"

onClick={()=>sendSMS(row,index)}

>

📨 ارسال

</button>

</td>

</tr>

))

}

</tbody>

</table>

</div>
</div>

);

}