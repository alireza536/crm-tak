import {useState} from "react";
import {useNavigate} from "react-router-dom";

import "./CampaignCreate.css";


export default function CampaignCreate(){


const navigate=useNavigate();

const [name,setName]=useState("");



return(

<div className="createPage">


<h1>
ساخت کمپین جدید
</h1>



<div className="formBox">


<input
placeholder="نام کمپین"
value={name}
onChange={(e)=>setName(e.target.value)}
/>


<select>
<option>
انتخاب کانال
</option>

<option>
اینستاگرام
</option>

<option>
پیامک
</option>

<option>
تلگرام
</option>

</select>



<input
placeholder="بودجه"
/>


<input
placeholder="تعداد مخاطب"
/>



<button
onClick={()=>{

alert("کمپین ساخته شد");

navigate("/campaigns");

}}

>

ذخیره کمپین

</button>


</div>


</div>

)

}