import { clampText } from "@gogaffa/card-renderer";
import type { CardTemplateMetadata } from "@gogaffa/types";
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { LEVEL_02_BASE_METADATA } from "../templates/handDrawnCardTemplates";

export interface CardTextOverlaysProps {
  displayName: string;
  overall: number;
  metadata?: CardTemplateMetadata;
}

export function CardTextOverlays({
  displayName,
  overall,
  metadata = LEVEL_02_BASE_METADATA,
}: CardTextOverlaysProps) {
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, layers } = metadata;
  const overallLayer = layers.overall;
  const displayNameLayer = layers.displayName;
  const showOverall = metadata.showOverallOverlay !== false && Boolean(overallLayer.label);
  const [imageWidth, setImageWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setImageWidth((current) => (Math.abs(current - nextWidth) < 1 ? current : nextWidth));
  };

  const scale = imageWidth > 0 ? imageWidth / CANVAS_WIDTH : 0;
  const overallFontSize = scale > 0 ? (overallLayer.fontSize ?? 42) * scale : 18;
  const overallLabelFontSize =
    scale > 0 ? (overallLayer.labelFontSize ?? 24) * scale : 14;
  const nameFontSize = scale > 0 ? (displayNameLayer.fontSize ?? 42) * scale : 18;
  const nameLineHeight = nameFontSize * 1.15;

  const overallLeftPct = ((overallLayer.x ?? 0) / CANVAS_WIDTH) * 100;
  const overallTopPct = ((overallLayer.y ?? 0) / CANVAS_HEIGHT) * 100;
  const overallWidthPct = ((overallLayer.width ?? 0) / CANVAS_WIDTH) * 100;

  const labelLeftPct = ((overallLayer.labelX ?? overallLayer.x ?? 0) / CANVAS_WIDTH) * 100;
  const labelTopPct = ((overallLayer.labelY ?? overallLayer.y ?? 0) / CANVAS_HEIGHT) * 100;

  const nameLeftPct = ((displayNameLayer.x ?? 0) / CANVAS_WIDTH) * 100;
  const nameTopPct = ((displayNameLayer.y ?? 0) / CANVAS_HEIGHT) * 100;
  const nameWidthPct = ((displayNameLayer.width ?? 0) / CANVAS_WIDTH) * 100;
  const nameHeightPct = ((displayNameLayer.height ?? 0) / CANVAS_HEIGHT) * 100;

  const fontFamily = overallLayer.fontFamily ?? displayNameLayer.fontFamily;

  return (
    <View pointerEvents="none" style={styles.overlay} onLayout={handleLayout}>
      {showOverall && overallLayer.label ? (
        <View
          style={[
            styles.slot,
            {
              left: `${labelLeftPct}%`,
              top: `${labelTopPct}%`,
              width: `${overallWidthPct}%`,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                color: overallLayer.color ?? colors.ink,
                fontFamily,
                fontSize: overallLabelFontSize,
                lineHeight: overallLabelFontSize * 1.15,
              },
            ]}
          >
            {overallLayer.label}
          </Text>
        </View>
      ) : null}
      {showOverall ? (
        <View
          style={[
            styles.slot,
            {
              left: `${overallLeftPct}%`,
              top: `${overallTopPct}%`,
              width: `${overallWidthPct}%`,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                color: overallLayer.color ?? colors.ink,
                fontFamily,
                fontSize: overallFontSize,
                lineHeight: overallFontSize * 1.1,
              },
            ]}
          >
            {overall}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.slot,
          {
            height: `${nameHeightPct}%`,
            left: `${nameLeftPct}%`,
            top: `${nameTopPct}%`,
            width: `${nameWidthPct}%`,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.text,
            {
              color: displayNameLayer.color ?? colors.ink,
              fontFamily,
              fontSize: nameFontSize,
              lineHeight: nameLineHeight,
            },
          ]}
        >
          {clampText(displayName.toUpperCase(), 16)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  text: {
    fontWeight: "normal",
    includeFontPadding: false,
    paddingHorizontal: 2,
    textAlign: "center",
    width: "100%",
  },
});
