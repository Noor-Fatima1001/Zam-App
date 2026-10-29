import React, { memo, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const parseNumberString = (str) => {
  if (!str || typeof str !== 'string') return 0;
  return parseFloat(str.replace(/,/g, ''));
};

const DashboardBarChart = ({ data, areas, width = "100%", height = 350, stacked = false }) => {
  const filteredData = data?.filter(item => item.date !== "Total");
  const [chartWidth, setChartWidth] = useState(0);
  const minRequiredWidth = filteredData?.length * 100 || 800;
  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = document.getElementById('chart-container')?.clientWidth || 0;
      setChartWidth(Math.max(minRequiredWidth, containerWidth));
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, [minRequiredWidth]);
  
  return (
    <div id="chart-container" className="rounded-lg w-full overflow-x-auto">
      <div style={{ width: `${chartWidth}px`, minWidth: '100%', height: `${height}px` }}>
        <BarChart
          data={filteredData}
          margin={{ top: 12, right: 30, left: 20, bottom: 5 }}
          width={chartWidth}
          height={height}
        >
          <CartesianGrid strokeDasharray="7 7" horizontal vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={{ stroke: "#bdbdbd" }}
            tickLine={false}
            fontSize={12}
            tick={{ transform: "translate(0, 5)" }}
            padding={{ left: 10, right: 10 }}
          />
          
          {/* Create separate Y-axes for sales and covers */}
          <YAxis 
            yAxisId="sales"
            fontSize={12} 
            tickFormatter={(value) => `${Math.round(value).toLocaleString()}`}
            orientation="left"
          />
          <YAxis 
            yAxisId="covers"
            fontSize={12}
            orientation="right"
          />
          
          <Tooltip 
            formatter={(value, name) => {
              if (name === "total_covers") {
                return [value, name.replace(/_/g, " ")];
              }
              return [`${parseInt(value).toLocaleString()}`, name.replace(/_/g, " ")];
            }} 
          />
          <Legend />
          
          {areas?.map((area, index) => (
            <Bar
              key={index}
              dataKey={area.dataKey}
              fill={area.color}
              yAxisId={area.dataKey === "total_covers" ? "covers" : "sales"}
              stackId={stacked ? "stack" : undefined}
              barSize={stacked ? 30 : 20}
              radius={stacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </div>
    </div>
  );
};

export default memo(DashboardBarChart);