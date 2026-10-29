import React, { memo, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper function to parse string values with commas
const parseNumberString = (str) => {
  if (!str || typeof str !== 'string') return 0;
  return parseFloat(str.replace(/,/g, ''));
};

const DashboardLineChart = ({ data, areas, width = "100%", height = 350 }) => {
  // Filter out the "Total" row
  const filteredData = data?.filter(item => item.date !== "Total");
  
  // State for controlling the visible window
  const [chartWidth, setChartWidth] = useState(0);
  
  // Calculate the minimum width needed based on data points
  // Each data point needs at least 100px of width for good visibility
  const minRequiredWidth = filteredData?.length * 100 || 800;
  
  // Update chart width on component mount and window resize
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
        <LineChart
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
          
          <Tooltip formatter={(value, name) => {
            if (name === "total_covers") {
              return [value, name.replace(/_/g, " ")];
            }
            return [`${parseInt(value).toLocaleString()}`, name.replace(/_/g, " ")];
          }} />
          <Legend />
          
          {areas?.map((area, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={area.dataKey}
              stroke={area.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              yAxisId={area.dataKey === "total_covers" ? "covers" : "sales"}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </div>
    </div>
  );
};

export default memo(DashboardLineChart);