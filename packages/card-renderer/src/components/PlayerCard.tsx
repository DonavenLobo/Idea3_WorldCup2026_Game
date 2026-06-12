import { StyleSheet, Text } from "react-native";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { PlayerCardRenderData } from "../types";
import { resolveLayerFontStyle } from "../utils/layerTextStyle";
import { BadgeLayer } from "./BadgeLayer";
import { PlayerAvatarLayer } from "./PlayerAvatarLayer";
import { PlayerCardTemplate } from "./PlayerCardTemplate";
import { PlayerNameLayer } from "./PlayerNameLayer";
import { PlayerStatsLayer } from "./PlayerStatsLayer";

export function PlayerCard({
  card,
  renderDisplayName = true,
  renderOverall = true,
  renderStatValues = true,
  template,
}: PlayerCardRenderData) {
  const avatarUrl = card.avatarGeneratedUrl ?? card.avatarSourceUrl;
  const nation = SUPPORTED_NATIONS.find((candidate) => candidate.code === card.selectedNationCode);
  const overallLayer = template.metadata.layers.overall;
  const overallLabelFontSize = overallLayer.labelFontSize ?? 24;

  return (
    <PlayerCardTemplate template={template}>
      <PlayerAvatarLayer imageUrl={avatarUrl} layer={template.metadata.layers.avatar} />
      {renderOverall && overallLayer.label ? (
        <Text
          style={[
            styles.overallLabel,
            {
              color: overallLayer.labelColor ?? overallLayer.color,
              fontSize: overallLabelFontSize,
              left: overallLayer.labelX ?? overallLayer.x,
              textAlign: overallLayer.align,
              top: overallLayer.labelY ?? Math.max(0, overallLayer.y - overallLabelFontSize - 6),
              width: overallLayer.width,
              ...resolveLayerFontStyle(overallLayer),
            }
          ]}
        >
          {overallLayer.label}
        </Text>
      ) : null}
      {renderOverall ? (
        <Text
          numberOfLines={1}
          style={[
            styles.overall,
            {
              color: overallLayer.color,
              fontSize: overallLayer.fontSize,
              left: overallLayer.x,
              textAlign: overallLayer.align,
              top: overallLayer.y,
              width: overallLayer.width,
              ...resolveLayerFontStyle(overallLayer),
            }
          ]}
        >
          {card.overall}
        </Text>
      ) : null}
      {renderDisplayName ? (
        <PlayerNameLayer displayName={card.displayName} layer={template.metadata.layers.displayName} />
      ) : null}
      {renderStatValues ? (
        <PlayerStatsLayer stats={card.stats} layer={template.metadata.layers.stats} />
      ) : null}
      <BadgeLayer
        iconComponent={card.badgeIcon}
        imageSource={card.badgeImageSource}
        label={nation?.code ?? card.selectedNationCode}
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
