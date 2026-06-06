import { StyleSheet, Text } from "react-native";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { PlayerCardRenderData } from "../types";
import { BadgeLayer } from "./BadgeLayer";
import { PlayerAvatarLayer } from "./PlayerAvatarLayer";
import { PlayerCardTemplate } from "./PlayerCardTemplate";
import { PlayerNameLayer } from "./PlayerNameLayer";
import { PlayerStatsLayer } from "./PlayerStatsLayer";

export function PlayerCard({ card, renderStatValues = true, template }: PlayerCardRenderData) {
  const avatarUrl = card.avatarGeneratedUrl ?? card.avatarSourceUrl;
  const nation = SUPPORTED_NATIONS.find((candidate) => candidate.code === card.selectedNationCode);
  const overallLayer = template.metadata.layers.overall;
  const overallLabelFontSize = overallLayer.labelFontSize ?? 24;

  return (
    <PlayerCardTemplate template={template}>
      <PlayerAvatarLayer imageUrl={avatarUrl} layer={template.metadata.layers.avatar} />
      {overallLayer.label ? (
        <Text
          style={[
            styles.overallLabel,
            {
              color: overallLayer.labelColor ?? overallLayer.color,
              fontSize: overallLabelFontSize,
              fontWeight: (overallLayer.fontWeight ?? "700") as "700",
              left: overallLayer.labelX ?? overallLayer.x,
              textAlign: overallLayer.align,
              top: overallLayer.labelY ?? Math.max(0, overallLayer.y - overallLabelFontSize - 6),
              width: overallLayer.width
            }
          ]}
        >
          {overallLayer.label}
        </Text>
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.overall,
          {
            color: overallLayer.color,
            fontSize: overallLayer.fontSize,
            fontWeight: (overallLayer.fontWeight ?? "700") as "700",
            left: overallLayer.x,
            textAlign: overallLayer.align,
            top: overallLayer.y,
            width: overallLayer.width
          }
        ]}
      >
        {card.overall}
      </Text>
      <PlayerNameLayer displayName={card.displayName} layer={template.metadata.layers.displayName} />
      {renderStatValues ? (
        <PlayerStatsLayer stats={card.stats} layer={template.metadata.layers.stats} />
      ) : null}
      <BadgeLayer
        label={nation?.flagEmoji ?? card.selectedNationCode}
        layer={template.metadata.layers.badge}
      />
    </PlayerCardTemplate>
  );
}

const styles = StyleSheet.create({
  overall: {
    position: "absolute"
  },
  overallLabel: {
    position: "absolute"
  }
});
