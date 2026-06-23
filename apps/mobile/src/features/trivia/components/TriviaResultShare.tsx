import { formatResponseTime } from "../../../utils/formatters";
import { Text } from "react-native";
import type { SpoilerSafeTriviaShare } from "@gogaffa/types";

export function TriviaResultShare({ correctAnswers, totalQuestions, totalResponseTimeMs, nationCode }: SpoilerSafeTriviaShare) {
  return (
    <Text>
      Trivia {correctAnswers}/{totalQuestions} - {formatResponseTime(totalResponseTimeMs)} - {nationCode}
    </Text>
  );
}
