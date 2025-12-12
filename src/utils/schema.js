export const COLLECTION_NAME = "daodejing_chapters";

/**
 * DaodejingChapter (Firestore Document)
 *
 * {
 *   chapter: number,            // 1~81
 *   title: string,
 *   subtitle?: string,
 *   tags?: string[],
 *   lines: Array<{
 *     order: number,
 *     han: string,
 *     ko: string,
 *     note?: string
 *   }>,
 *   analysis: {
 *     sections: Array<{
 *       type: string,
 *       title: string,
 *       content: string[]
 *     }>,
 *     keySentence: string
 *   }
 * }
 */
export const SchemaDoc = null;
