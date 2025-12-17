// src/components/write/StoryWriter.jsx
import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
} from "@mui/material";

import { saveChapterStory } from "../../firebase/firestore";

/**
 * 동화 텍스트 입력 → JSON 변환 → Firestore 저장
 * - 제목: 〈 〉 또는 《 》 첫 줄에서 추출
 * - 본문: 빈 줄 기준 문단 분리 (content: string[])
 */
function parseStoryText(raw) {
  const text = (raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return { title: "", content: [] };

  const lines = text.split("\n");
  let title = "";
  let body = text;

  // 1) 첫 줄 제목 패턴: 〈...〉 or 《...》
  const first = (lines[0] || "").trim();
  const m = first.match(/^[〈《]\s*(.+?)\s*[〉》]\s*$/);
  if (m?.[1]) {
    title = m[1].trim();
    body = lines.slice(1).join("\n").trim();
  }

  // 2) 문단 분리: 빈 줄(1줄 이상) 기준
  const content = body
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return { title, content };
}

export default function StoryWriter() {
  const [chapterNumber, setChapterNumber] = useState("1");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const parsed = useMemo(() => parseStoryText(rawText), [rawText]);

  const storyJson = useMemo(() => {
    const chap = Number(chapterNumber);
    return {
      chapter: Number.isFinite(chap) ? chap : null,
      title: parsed.title || "",
      content: parsed.content || [],
    };
  }, [chapterNumber, parsed]);

  const canSave =
    Number.isFinite(Number(chapterNumber)) &&
    Number(chapterNumber) >= 1 &&
    rawText.trim().length > 0 &&
    (parsed.content?.length || 0) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      await saveChapterStory(Number(chapterNumber), {
        title: storyJson.title,
        content: storyJson.content,
      });

      setMsg({ type: "success", text: `${chapterNumber}장 동화 저장 완료` });
    } catch (e) {
      setMsg({
        type: "error",
        text: `저장 실패: ${e?.code || ""} ${e?.message || ""}`.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.4}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            동화 Story Writer
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            텍스트 붙여넣기 → 자동 JSON 변환 → Firestore 저장 (daodejing_stories/{`{chapter}`})
          </Typography>
        </Stack>

        {msg.text ? (
          <Alert severity={msg.type === "error" ? "error" : "success"}>
            {msg.text}
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip label="Chapter" />
          <TextField
            size="small"
            label="장 번호 (1~81)"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(e.target.value)}
            sx={{ width: 160 }}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave || loading}
            sx={{ fontWeight: 900, borderRadius: 999 }}
          >
            저장
          </Button>
        </Stack>

        <Divider />

        <TextField
          label="동화 원문 텍스트"
          placeholder={`예)\n〈이름을 붙이지 않는 길〉\n\n마을 밖에는...`}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          multiline
          minRows={10}
          fullWidth
          disabled={loading}
        />

        <Divider />

        <Stack spacing={0.6}>
          <Typography sx={{ fontWeight: 900 }}>자동 변환 결과</Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            제목은 〈 〉/《 》 첫 줄에서 추출, 본문은 빈 줄 기준으로 문단 배열(content[])로 저장.
          </Typography>

          <Box
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(0,0,0,0.10)",
              bgcolor: "rgba(0,0,0,0.02)",
              p: 1.25,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 12.5,
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
            }}
          >
            {JSON.stringify(storyJson, null, 2)}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
