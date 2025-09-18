import { useMemo } from "react";
import { t } from "ttag";

import { Box, Group, Stack, Text } from "metabase/ui";

interface SurveyHorizontalBarProps {
  labels: string[];
  counts: number[];
  percentages: number[];
  showPercentages?: boolean;
  showCounts?: boolean;
}

const CHART_COLORS = [
  "#509EE3", // Blue
  "#F9CF48", // Yellow/Gold
  "#F2A86F", // Orange
  "#98D9D9", // Cyan
  "#ED8C8C", // Pink/Red
  "#9CC177", // Green
  "#A989C5", // Purple
  "#88BF4D", // Lime Green
];

export function SurveyHorizontalBar({
  labels,
  counts,
  percentages,
  showPercentages = true,
  showCounts = true,
}: SurveyHorizontalBarProps) {
  const segments = useMemo(() => {
    let cumulativePercentage = 0;
    const gapPercentage = 0.25; // Small gap between segments
    return labels.map((label, index) => {
      const segment = {
        label,
        count: counts[index],
        percentage: percentages[index],
        start: cumulativePercentage,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
      cumulativePercentage += percentages[index] + gapPercentage;
      return segment;
    });
  }, [labels, counts, percentages]);

  const formatValue = (percentage: number, count: number) => {
    if (showPercentages && showCounts) {
      return t`${percentage}% (${count})`;
    }
    if (showPercentages) {
      return `${percentage}%`;
    }
    if (showCounts) {
      return `${count}`;
    }
    return "";
  };

  return (
    <Stack gap="lg" style={{ width: "100%" }}>
      {/* Stacked horizontal bar */}
      <Box
        style={{
          height: "40px",
          backgroundColor: "var(--mb-color-bg-light)",
          borderRadius: "4px",
          position: "relative",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {segments.map((segment, index) => (
          <Box
            key={`${segment.label}-${index}`}
            style={{
              position: "absolute",
              left: `${segment.start}%`,
              top: 0,
              height: "100%",
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </Box>

      {/* Legend */}
      <Box>
        {segments.map((segment, index) => (
          <Group
            key={`legend-${segment.label}-${index}`}
            gap="sm"
            style={{
              padding: "8px 12px",
              backgroundColor:
                index % 2 === 0 ? "var(--mb-color-bg-light)" : "transparent",
              margin: "0 -12px",
            }}
          >
            <Box
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: segment.color,
                borderRadius: "2px",
              }}
            />
            <Text size="sm" style={{ flex: 1 }}>
              {segment.label}
            </Text>
            <Text size="sm" fw={500}>
              {formatValue(segment.percentage, segment.count)}
            </Text>
          </Group>
        ))}
      </Box>
    </Stack>
  );
}
