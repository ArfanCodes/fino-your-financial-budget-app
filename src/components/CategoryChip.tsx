import React from "react";
import { View, StyleSheet } from "react-native";
import { Radius } from "../utils/constants";
import { withOpacity } from "../utils/helpers";

type Props = {
  color: string;
};

export const CategoryChip: React.FC<Props> = React.memo(({ color }) => {
  const backgroundColor = withOpacity(color, 0.12);
  const dotColor = withOpacity(color, 0.88);

  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </View>
  );
});

CategoryChip.displayName = "CategoryChip";

const styles = StyleSheet.create({
  chip: {
    minWidth: 28,
    height: 24,
    borderRadius: Radius.lg,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 9999,
  },
});
