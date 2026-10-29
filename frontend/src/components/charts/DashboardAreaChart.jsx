import React, { memo, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Helper function to parse string values with commas
const parseNumberString = (str) => {
  if (!str || typeof str !== 'string') return 0;
  return parseFloat(str.replace(/,/g, ''));
};

const DashboardAreaChart = ({ data, areas, width = "100%", height = 250 }) => {
  // Filter out any "Total" rows
  const filteredData = data?.filter(item => item.date !== "Total" && item.name !== "Total");
  
  // State for controlling the visible window
  const [chartWidth, setChartWidth] = useState(0);
  
  // Calculate the minimum width needed based on data points
  // Each data point needs at least 100px of width for good visibility
  const minRequiredWidth = filteredData?.length * 100 || 800;
  
  // Update chart width on component mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = document.getElementById('area-chart-container')?.clientWidth || 0;
      setChartWidth(Math.max(minRequiredWidth, containerWidth));
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, [minRequiredWidth]);
  
  return (
    <div id="area-chart-container" className="rounded-lg w-full overflow-x-auto">
      <div style={{ width: `${chartWidth}px`, minWidth: '100%', height: `${height}px` }}>
        <AreaChart
          data={filteredData}
          margin={{ top: 12, right: 30, left: 20, bottom: 5 }}
          width={chartWidth}
          height={height}
        >
          <CartesianGrid strokeDasharray="7 7" horizontal vertical={false} />
          <XAxis
            dataKey="name" // Using name as the key (change to date if needed)
            axisLine={{ stroke: "#bdbdbd" }}
            tickLine={false}
            fontSize={12}
            tick={{ transform: "translate(0, 5)" }}
            padding={{ left: 10, right: 10 }}
          />
          
          {/* Create separate Y-axes for sales and covers if needed */}
          <YAxis 
            fontSize={12} 
            tickFormatter={(value) => `${Math.round(value).toLocaleString()}`}
          />
          
          <Tooltip formatter={(value, name) => {
            return [`${parseInt(value).toLocaleString()}`, name.replace(/_/g, " ")];
          }} />
          <Legend />
          
          {areas?.map((area, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={area.dataKey}
              stroke={area.color}
              fill={`${area.color}30`}  // Adding 30 to color hex makes it transparent
              strokeWidth={2}
              activeDot={{ r: 5 }}
              connectNulls={true}
            />
          ))}
        </AreaChart>
      </div>
    </div>
  );
};

export default memo(DashboardAreaChart);