import {useParams} from "react-router-dom";

import "./CampaignDetail.css";


export default function CampaignDetail(){


const {id}=useParams();



return(

<div className="detailPage">


<h1>
جزئیات کمپین #{id}
</h1>


<div className="detailCards">


<div>
مخاطب
<strong>
5200
</strong>
</div>


<div>
فروش
<strong>
120M
</strong>
</div>


<div>
هزینه
<strong>
35M
</strong>
</div>


<div>
ROI
<strong>
242%
</strong>
</div>


</div>



</div>

)

}