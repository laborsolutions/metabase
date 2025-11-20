import type { TickRendererProps } from "@visx/axis";
import { Text, type TextProps } from "@visx/text";

import { isEmbeddingSdk } from "metabase/embedding-sdk/config";
import { Tooltip } from "metabase/ui";
import type { TextWidthMeasurer } from "metabase/visualizations/shared/types/measure-text";

interface WrappedYAxisTickProps extends TickRendererProps {
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fill: string;
  measureTextWidth: TextWidthMeasurer;
  textAnchor?: TextProps["textAnchor"];
  dy?: string;
  maxHeight?: number;
}

export const WrappedYAxisTick = ({
  formattedValue,
  x,
  y,
  maxWidth,
  fontFamily,
  fontSize,
  fontWeight,
  fill,
  measureTextWidth,
  textAnchor,
  dy,
  maxHeight,
}: WrappedYAxisTickProps) => {
  const text = formattedValue ?? "";
  const style = {
    size: `${fontSize}px`,
    family: fontFamily,
    weight: String(fontWeight),
  };

  const isEmbedded = isEmbeddingSdk();
  const lineHeight = fontSize * 1.2;
  // Subtract 1 to have some spacing, but ensure at least 1 line.
  // In embedding mode, we subtract 2 to prevent cramped labels.
  const maxLines = maxHeight
    ? Math.max(1, Math.floor(maxHeight / lineHeight) - (isEmbedded ? 2 : 1))
    : 1;

  // Split text into words
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = measureTextWidth(currentLine + " " + word, style);
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  let truncatedText = text;
  let shouldTruncate = false;

  if (maxLines === 1) {
    const width = measureTextWidth(text, style);
    shouldTruncate = width > maxWidth;
    if (shouldTruncate) {
      const ellipsis = "…";
      const ellipsisWidth = measureTextWidth(ellipsis, style);
      const availableWidth = maxWidth - ellipsisWidth;

      if (availableWidth > 0) {
        const avgCharWidth = width / text.length;
        let len = Math.floor(availableWidth / avgCharWidth);
        while (len > 0 && len < text.length) {
          const sub = text.slice(0, len);
          if (measureTextWidth(sub, style) > availableWidth) {
            len--;
          } else if (
            len < text.length - 1 &&
            measureTextWidth(text.slice(0, len + 1), style) <= availableWidth
          ) {
            len++;
          } else {
            break;
          }
        }
        truncatedText = text.slice(0, len) + ellipsis;
      } else {
        truncatedText = ellipsis;
      }
    }
  } else {
    if (lines.length > maxLines) {
      shouldTruncate = true;
      const visibleLines = lines.slice(0, maxLines - 1);
      let lastLine = lines[maxLines - 1];
      const ellipsis = "…";

      while (
        measureTextWidth(lastLine + ellipsis, style) > maxWidth &&
        lastLine.length > 0
      ) {
        lastLine = lastLine.slice(0, -1);
      }
      truncatedText = [...visibleLines, lastLine + ellipsis].join("\n");
    } else {
      truncatedText = lines
        .map((line) => {
          if (measureTextWidth(line, style) > maxWidth) {
            shouldTruncate = true;
            let l = line;
            const ellipsis = "…";
            while (
              measureTextWidth(l + ellipsis, style) > maxWidth &&
              l.length > 0
            ) {
              l = l.slice(0, -1);
            }
            return l + ellipsis;
          }
          return line;
        })
        .join("\n");
    }
  }

  const textElement = (
    <g>
      <Text
        x={x}
        y={y}
        width={maxWidth}
        verticalAnchor="middle"
        textAnchor={textAnchor}
        dy={dy}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fill={fill}
        style={{ userSelect: "none" }}
        lineHeight={maxLines > 1 ? "1.2em" : undefined}
        capHeight={maxLines > 1 ? "0.7em" : undefined}
      >
        {truncatedText}
      </Text>
    </g>
  );

  return <Tooltip label={text}>{textElement}</Tooltip>;
};
