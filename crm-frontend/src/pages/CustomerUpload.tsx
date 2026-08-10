import { useNavigate } from "react-router-dom";
import CustomerImportModal from "../components/CustomerImportModal";

export default function CustomerUpload(){
  const navigate=useNavigate();
  return <CustomerImportModal open onClose={()=>navigate("/customers")} onImported={()=>Promise.resolve()}/>;
}
