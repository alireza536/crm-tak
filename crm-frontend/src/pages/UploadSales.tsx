import { useRef, useState } from "react";

import {
  FaCheck,
  FaCircleExclamation,
  FaCloudArrowUp,
  FaFileExcel,
  FaReceipt,
  FaXmark,
  FaPaperPlane,
} from "react-icons/fa6";

import {
  uploadCustomers,
  uploadSalesInvoice,
  default as api,
} from "../services/api";

import "./UploadSales.css";


type ImportMode = "sales" | "customers";


type ImportResult = {
  success?: boolean;
  duplicate?: boolean;
  message?: string;

  extracted?: {
    factor?: string;
    date?: string;
    phone?: string;
    name?: string;
    sale?: number;
    discount?: number;
  };

  invoice?: any;
};



const validExcelFile = (file: File) =>
  /\.(xls|xlsx)$/i.test(file.name);



const money = (value?: number) =>
  Number(value || 0).toLocaleString("fa-IR");




export default function UploadSales() {


  const inputRef = useRef<HTMLInputElement>(null);


  const [mode,setMode] =
    useState<ImportMode>("sales");


  const [file,setFile] =
    useState<File | null>(null);


  const [uploading,setUploading] =
    useState(false);


  const [sendingSms,setSendingSms] =
    useState(false);


  const [error,setError] =
    useState("");


  const [result,setResult] =
    useState<ImportResult | null>(null);





  const reset = () => {

    setFile(null);
    setError("");
    setResult(null);

    if(inputRef.current){
      inputRef.current.value="";
    }

  };





  const chooseFile = (selected?:File) => {


    setError("");
    setResult(null);


    if(!selected)
      return;



    if(!validExcelFile(selected)){

      setError(
        "فقط فایل Excel با پسوند XLS یا XLSX قابل قبول است."
      );

      return;

    }


    setFile(selected);

  };







  const upload = async()=>{


    if(!file){

      setError(
        "ابتدا فایل اکسل را انتخاب کنید."
      );

      return;

    }



    try{


      setUploading(true);

      setError("");



      let response;



      if(mode==="customers"){


        response =
          await uploadCustomers(file);



        setResult({

          success:true,

          message:
          response?.message ||
          "مشتریان ثبت شدند."

        });


      }
      else{


        response =
          await uploadSalesInvoice(file);



        setResult(response);


      }



    }
    catch(error:any){


      setError(

        error?.response?.data?.message ||
        "خطا در ثبت اطلاعات"

      );


    }
    finally{


      setUploading(false);


    }


  };







  const sendMessage = async()=>{


    const data =
      result?.extracted;



    if(!data?.phone){


      alert(
        "شماره موبایل مشتری موجود نیست"
      );


      return;

    }




    try{


      setSendingSms(true);



      await api.post(

        "/sms/send",

        {

          phone:data.phone,

          name:data.name || "",

          sale:String(data.sale || 0),

          profit:String(data.discount || 0)

        }

      );



      alert(
        "پیامک با موفقیت ارسال شد"
      );



    }
    catch(error:any){


      console.log(
        error?.response?.data || error
      );


      alert(
        "خطا در ارسال پیامک"
      );


    }
    finally{


      setSendingSms(false);


    }


  };
    return (

    <section
      className="smartImportPage"
      dir="rtl"
    >


      <header className="smartImportHero">


        <div>

          <span className="smartImportEyebrow">
            مرکز ورود اطلاعات
          </span>


          <h1>
            ثبت خودکار فاکتور فروش
          </h1>


          <p>
            فایل اکسل را انتخاب کنید تا اطلاعات در CRM ثبت شود.
          </p>


        </div>



        <div className="smartImportHeroBadge">

          <FaFileExcel/>

          <div>

            <strong>
              XLS / XLSX
            </strong>

            <span>
              ثبت مستقیم
            </span>

          </div>

        </div>


      </header>





      <div className="importModeTabs">


        <button

          className={
            mode === "sales"
            ?
            "active"
            :
            ""
          }

          onClick={()=>{

            setMode("sales");
            reset();

          }}

        >

          <FaReceipt/>

          <span>

            <strong>
              فاکتور فروش
            </strong>


            <small>
              ثبت خودکار فاکتور
            </small>


          </span>


        </button>







        <button

          className={
            mode === "customers"
            ?
            "active"
            :
            ""
          }

          onClick={()=>{

            setMode("customers");
            reset();

          }}

        >

          <FaFileExcel/>


          <span>

            <strong>
              لیست مشتریان
            </strong>


            <small>
              ورود مشتری
            </small>


          </span>


        </button>


      </div>








      <div className="smartImportCard">





        <input

          ref={inputRef}

          hidden

          type="file"

          accept=".xls,.xlsx"

          onChange={(e)=>
            chooseFile(e.target.files?.[0])
          }

        />







        <div

          className="smartDropZone"

          onClick={()=>
            inputRef.current?.click()
          }

        >


          <span className="smartDropIcon">


            {
              file

              ?

              <FaFileExcel/>

              :

              <FaCloudArrowUp/>

            }


          </span>



          <strong>

            {
              file
              ?
              file.name
              :
              "برای انتخاب فایل اکسل کلیک کنید"
            }

          </strong>



          <span>

            فایل فاکتور فروش یا لیست مشتریان

          </span>



        </div>







        {
          file &&


          <div className="selectedFileBar">


            <div>

              <FaCheck/>

              فایل آماده ثبت است


            </div>


            <button
              onClick={reset}
            >

              <FaXmark/>

              حذف


            </button>


          </div>


        }









        {
          error &&


          <div className="importAlert error">


            <FaCircleExclamation/>


            <span>
              {error}
            </span>


          </div>


        }









        {
          result &&


          <div

            className={
              result.duplicate
              ?
              "importAlert error"
              :
              "importAlert success"
            }

          >


            <FaCheck/>


            <span>

              {result.message}

            </span>


          </div>


        }









        {
          result?.extracted &&


          <div className="invoiceResult">


            <h3>
              اطلاعات فاکتور
            </h3>




            <p>

              شماره فاکتور:

              <b>
                {result.extracted.factor || "-"}
              </b>

            </p>





            <p>

              تاریخ:

              <b>
                {result.extracted.date || "-"}
              </b>

            </p>





            <p>

              مشتری:

              <b>
                {result.extracted.name || "-"}
              </b>

            </p>





            <p>

              موبایل:

              <b>
                {result.extracted.phone || "-"}
              </b>

            </p>





            <p>

              مبلغ فروش:

              <b>
                {money(result.extracted.sale)}
                {" "}ریال
              </b>

            </p>





            <p>

              تخفیف:

              <b>
                {money(result.extracted.discount)}
                {" "}ریال
              </b>

            </p>




          </div>


        }









        <button

          className="smartPrimaryButton"

          disabled={
            !file ||
            uploading
          }

          onClick={upload}

        >


          {
            uploading

            ?

            "در حال ثبت..."

            :

            "ثبت خودکار فاکتور"

          }


        </button>









        <button

          className="sendMessageButton"

          disabled={
            !result?.extracted ||
            sendingSms
          }

          onClick={sendMessage}

        >


          <FaPaperPlane/>


          {

            sendingSms

            ?

            "در حال ارسال..."

            :

            "ارسال پیام به مشتری"

          }


        </button>







      </div>


    </section>

  );


}