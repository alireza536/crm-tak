import { useEffect, useMemo, useState } from "react";
import "./Sms.css";
import { getCustomers } from "../services/api";

export default function Sms() {

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const data = await getCustomers();
    setCustomers(data);
  }

  const filteredCustomers = useMemo(() => {

    return customers.filter((item: any) => {

      const name =
        item.name?.toLowerCase() || "";

      const phone =
        item.phone || "";

      return (
        name.includes(search.toLowerCase()) ||
        phone.includes(search)
      );

    });

  }, [customers, search]);

  function toggleCustomer(id: number) {

    if (selected.includes(id)) {

      setSelected(selected.filter(x => x !== id));

    } else {

      setSelected([...selected, id]);

    }

  }

  function toggleAll() {

    if (selected.length === filteredCustomers.length) {

      setSelected([]);

    } else {

      setSelected(filteredCustomers.map((x: any) => x.id));

    }

  }

  return (

    <div className="smsPage">

      <div className="smsHeader">

        <div>

          <h1>پنل پیامک</h1>

          <p>ارسال پیامک تکی و گروهی</p>

        </div>

        <div className="smsHeaderRight">

          <input

            className="smsSearch"

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

            placeholder="جستجوی مشتری..."

          />

          <button className="smsButton">

            + پیام جدید

          </button>

        </div>

      </div>

      <div className="smsStats">

        <div className="smsCard">

          <h4>کل مشتریان</h4>

          <h2>{customers.length}</h2>

        </div>

        <div className="smsCard">

          <h4>انتخاب شده</h4>

          <h2>{selected.length}</h2>

        </div>

        <div className="smsCard">

          <h4>دارای موبایل</h4>

          <h2>

            {
              customers.filter(
                (x:any)=>x.phone
              ).length
            }

          </h2>

        </div>

        <div className="smsCard">

          <h4>پیام آماده</h4>

          <h2>

            {message.length}

          </h2>

        </div>

      </div>
            <div className="smsContent">

        <div className="customerList">

          <div className="customerHeader">

            <h2>

              لیست مشتریان

            </h2>

            <label>

              <input

                type="checkbox"

                checked={
                  selected.length === filteredCustomers.length &&
                  filteredCustomers.length > 0
                }

                onChange={toggleAll}

              />

              انتخاب همه

            </label>

          </div>

          <div className="customerBody">

            {

              filteredCustomers.map((item:any)=>(

                <div

                  className="customerRow"

                  key={item.id}

                >

                  <input

                    type="checkbox"

                    checked={
                      selected.includes(item.id)
                    }

                    onChange={()=>

                      toggleCustomer(item.id)

                    }

                  />

                  <div className="avatar">

                    {

                      item.name

                      ?

                      item.name.charAt(0)

                      :

                      "؟"

                    }

                  </div>

                  <div className="customerData">

                    <b>

                      {item.name}

                    </b>

                    <span>

                      {item.phone || "بدون شماره"}

                    </span>

                  </div>

                </div>

              ))

            }

          </div>

        </div>

        <div className="messageBox">

          <h2>

            متن پیام

          </h2>

          <textarea

            value={message}

            onChange={(e)=>

              setMessage(e.target.value)

            }

            placeholder="متن پیام خود را بنویسید..."

          />

          <button

            className="sendSms"

          >

            ارسال به

            {selected.length}

            مشتری

          </button>

        </div>

      </div>

    </div>

  );

}