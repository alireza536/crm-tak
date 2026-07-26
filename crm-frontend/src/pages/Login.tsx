import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "./Login.css";


export default function Login(){

  const navigate = useNavigate();

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");

  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);



  const login = async()=>{

    try{

      setLoading(true);
      setError("");

      console.log("LOGIN:",username,password);


      const res = await axios.post(
        "http://localhost:3001/auth/login",
        {
          username,
          password
        }
      );


      console.log(res.data);


      localStorage.setItem(
        "token",
        res.data.access_token
      );


      navigate("/");


    }catch(err){

      console.log(err);

      setError(
        "نام کاربری یا رمز عبور اشتباه است"
      );

    }
    finally{

      setLoading(false);

    }

  };



  return (

    <div className="loginPage" dir="rtl">


      <div className="loginCard">


        <h1>
          ورود به TAK CRM
        </h1>



        <input

          placeholder="نام کاربری"

          value={username}

          onChange={
            e=>setUsername(e.target.value)
          }

        />



        <input

          type="password"

          placeholder="رمز عبور"

          value={password}

          onChange={
            e=>setPassword(e.target.value)
          }

        />



        {
          error &&
          <div className="loginError">
            {error}
          </div>
        }



        <button
          onClick={login}
          disabled={loading}
        >

          {
            loading
            ?
            "در حال ورود..."
            :
            "ورود"
          }


        </button>



      </div>


    </div>

  );

}