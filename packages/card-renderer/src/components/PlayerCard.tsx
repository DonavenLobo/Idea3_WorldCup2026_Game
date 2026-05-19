import { StyleSheet, Text } from "react-native";
import type { PlayerCardRenderData } from "../types";
import { BadgeLayer } from "./BadgeLayer";
import { PlayerAvatarLayer } from "./PlayerAvatarLayer";
import { PlayerCardTemplate } from "./PlayerCardTemplate";
import { PlayerNameLayer } from "./PlayerNameLayer";
import { PlayerStatsLayer } from "./PlayerStatsLayer";

export function PlayerCard({ card, template }: PlayerCardRenderData) {
  const avatarUrl = card.avatarGeneratedUrl ?? card.avatarSourceUrl;

  return (
    <PlayerCardTemplate template={template}>
      <Text
        style={[
          styles.overall,
          {
            color: template.metadata.layers.overall.color,
            fontSize: template.metadata.layers.overall.fontSize,
            fontWeight: template.metadata.layers.overall.fontWeight as "900",
            left: template.metadata.layers.overall.x,
            top: template.metadata.layers.overall.y
          }
        ]}
      >
        {card.overall}
      </Text>
      <PlayerAvatarLayer imageUrl={avatarUrl} layer={template.metadata.layers.avatar} />
      <PlayerNameLayer displayName={card.displayName} layer={template.metadata.layers.displayName} />
      <PlayerStatsLayer stats={card.stats} layer={template.metadata.layers.stats} />
      <BadgeLayer label={card.selectedNationCode} layer={template.metadata.layers.badge} />
    </PlayerCardTemplate>
  );
}

const styles = StyleSheet.create({
  overall: {
    position: "absolute"
  }
});
