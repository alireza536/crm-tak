import { useEffect, useState } from "react";

import {

  ResponsiveContainer,

  AreaChart,

  Area,

  XAxis,

  Tooltip,

} from "recharts";

import { getSalesChart } from "../services/api";

import "./SalesChart.css";

export default function SalesChart() {

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {

    load();

  }, []);

  async function load() {

    try {

      const result = await getSalesChart();

      setData(result);

    } catch (e) {

      console.log(e);

    }

  }

  const totalSale = data.reduce(

    (sum, item) => sum + item.sale,

    0,

  );

  return (

    <div className="chartCard">

      <div className="chartHeader">

        <div>

          <h2>

            فروش ماهانه

          </h2>

          <p>

            نمودار فروش از دیتابیس

          </p>

        </div>

        <div className="chartInfo">

          <h1>

            {totalSale.toLocaleString()}

          </h1>

          <span>

            فروش کل

          </span>

        </div>

      </div>

      <ResponsiveContainer

        width="100%"

        height={320}

      >

        <AreaChart data={data}>

          <defs>

            <linearGradient

              id="colorSale"

              x1="0"

              y1="0"

              x2="0"

              y2="1"

            >

              <stop

                offset="5%"

                stopColor="#0F6A47"

                stopOpacity={0.8}

              />

              <stop

                offset="95%"

                stopColor="#0F6A47"

                stopOpacity={0}

              />

            </linearGradient>

          </defs>

          <XAxis

            dataKey="month"

          />

          <Tooltip />

          <Area

            type="monotone"

            dataKey="sale"

            stroke="#0F6A47"

            strokeWidth={4}

            fill="url(#colorSale)"

          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  );

}