import React from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

const GaugeCard = ({
  gauge = {},
  colorInfo = {},
  timeFrameLabel = "",
  highlightNegative = false,
}) => {
  const { name = "Metric", value = 0, max = 100 } = gauge;
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  // For negative values, we'll show the absolute value in the chart but indicate it's negative in text
  const chartValue = isNegative ? absValue : value;
  const percentage = Math.min((absValue / max) * 100, 100);

  // Determine colors based on whether value is negative
  const gradientStart = isNegative
    ? "#ef4444"
    : colorInfo.gradientStart || "#00C49F";
  const gradientEnd = isNegative
    ? "#dc2626"
    : colorInfo.gradientEnd || "#0088FE";
  const textColor = isNegative
    ? "text-red-600"
    : colorInfo.text || "text-gray-800";
  const percentColor = isNegative ? "text-red-500" : "text-gray-500";

  const formattedValue = `${isNegative ? "-" : ""}$${Math.round(
    absValue,
  ).toLocaleString()}`;

  // The main value text was fixed at text-2xl regardless of how many
  // digits it had, so large amounts (e.g. $31,304,000) overflowed past
  // the gauge's inner circle and overlapped the percentage text below
  // it. Scale the font size down as the string gets longer, and use
  // SVG's textLength/lengthAdjust as a hard guarantee that the text
  // never exceeds the available width no matter how large the number
  // gets — this fixes the root cause generically instead of hardcoding
  // a value-specific fix.
  const availableTextWidth = 108; // px, fits inside the ~70% inner radius circle
  const fontSizePx =
    formattedValue.length <= 7
      ? 24
      : formattedValue.length <= 10
        ? 19
        : formattedValue.length <= 13
          ? 15
          : 12;
  const estimatedTextWidth = formattedValue.length * fontSizePx * 0.6;
  const needsCompression = estimatedTextWidth > availableTextWidth;

  return (
    <div className="bg-white rounded-xl p-5 -mx-3 lg:-mx-0 md:-mx-5 shadow-sm 
    flex flex-col items-center border border-gray-100">
      <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>{name}</h3>
      <div className="w-full h-48">
        <ResponsiveContainer minWidth={0} minHeight={0}>
          {/* Keying on name+max forces a clean remount whenever the
              selected time frame changes the domain (Daily/Weekly/Monthly
              each have different max values). Without this, RadialBarChart
              could carry over stale internal animation/layout state from
              the previous time frame, which is what caused the Daily gauge
              to render incorrectly right after switching from Weekly. */}
          <RadialBarChart
            key={`${name}-${max}`}
            data={[{ ...gauge, value: chartValue }]}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, max]}
              angleAxisId={0}
              tick={false}
              allowDataOverflow
            />

            <RadialBar
              minAngle={15}
              background={{ fill: "#f3f4f6" }}
              dataKey="value"
              cornerRadius="50%"
              fill={`url(#${name}Gradient)`}
              isAnimationActive={false}
            />

            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSizePx}
              textLength={needsCompression ? availableTextWidth : undefined}
              lengthAdjust="spacingAndGlyphs"
              className={`font-bold ${textColor}`}
            >
              {formattedValue}
            </text>
            <text
              x="50%"
              y="65%"
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-sm ${percentColor}`}
            >
              {Math.round(percentage)}%
            </text>

            <defs>
              <linearGradient
                id={`${name}Gradient`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={gradientStart} />
                <stop offset="100%" stopColor={gradientEnd} />
              </linearGradient>
            </defs>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-3">
        {isNegative && highlightNegative && (
          <p className="text-sm text-red-600 font-semibold mb-1">
            Negative savings
          </p>
        )}
        <p className="text-sm text-gray-500">{timeFrameLabel} data</p>
      </div>
    </div>
  );
};

export default GaugeCard;

// for Gauge UI like speedometer