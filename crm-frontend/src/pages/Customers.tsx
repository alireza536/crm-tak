import { useEffect, useState } from "react";

import { getCustomers } from "../services/api";

import CustomerCard from "../components/CustomerCard";

export default function Customers() {

  const [customers,setCustomers]=useState<any[]>([]);

  const [search,setSearch]=useState("");

  useEffect(()=>{

    load();

  },[]);

  async function load(){

    const data=await getCustomers();

    setCustomers(data);

  }

  const filtered=customers.filter((c)=>{

    return(

      c.name.toLowerCase().includes(search.toLowerCase())

      ||

      c.phone.includes(search)

      ||

      String(c.personCode).includes(search)

    );

  });

  return(

    <div>

      <h1
      style={{
        marginBottom:25
      }}
      >
        مشتریان
      </h1>

      <input

      placeholder="جستجوی مشتری..."

      value={search}

      onChange={(e)=>setSearch(e.target.value)}

      style={{

        width:"100%",

        padding:15,

        borderRadius:12,

        border:"1px solid #ddd",

        marginBottom:30,

        fontSize:16

      }}

      />

      <div

      style={{

        display:"grid",

        gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",

        gap:20

      }}

      >

      {

        filtered.map((customer)=>(

          <CustomerCard

          key={customer.id}

          customer={customer}

          />

        ))

      }

      </div>

    </div>

  );

}