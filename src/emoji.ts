/*
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import EMOJIBASE from 'emojibase-data/en/compact.json';
import SHORTCODES from 'emojibase-data/en/shortcodes/iamcal.json';

export interface IEmoji {
    annotation: string;
    group?: number;
    hexcode: string;
    order?: number;
    shortcodes: string[];
    tags?: string[];
    unicode: string;
    skins?: Omit<IEmoji, "shortcodes" | "tags">[]; // Currently unused
    emoticon?: string;
}

// The unicode is stored without the variant selector
const UNICODE_TO_EMOJI = new Map<string, IEmoji>(); // not exported as gets for it are handled by getEmojiFromUnicode
export const EMOTICON_TO_EMOJI = new Map<string, IEmoji>();

export const getEmojiFromUnicode = unicode => UNICODE_TO_EMOJI.get(stripVariation(unicode));

const isRegionalIndicator = (x: string) =>
    Array.from(x).length === 1 && x >= '\u{1f1e6}' && x <= '\u{1f1ff}';

const EMOJIBASE_GROUP_ID_TO_CATEGORY = [
    "people", // smileys
    "people", // actually people
    "control", // modifiers and such, not displayed in picker
    "nature",
    "foods",
    "places",
    "activity",
    "objects",
    "symbols",
    "flags",
];

export const DATA_BY_CATEGORY = {
    "people": [],
    "nature": [],
    "foods": [],
    "places": [],
    "activity": [],
    "objects": [],
    "symbols": [],
    "flags": [],
};

// Store various mappings from unicode/emoticon/shortcode to the Emoji objects
export const EMOJI: IEmoji[] = EMOJIBASE.map((emojiData: Omit<IEmoji, "shortcodes">) => {
    // If there's ever a gap in shortcode coverage, we fudge it by
    // filling it in with the emoji's CLDR annotation
    const shortcodeData = SHORTCODES[emojiData.hexcode] ??
        [emojiData.annotation.toLowerCase().replace(/ /g, "_")];

    const emoji: IEmoji = {
        ...emojiData,
        // Homogenize shortcodes by ensuring that everything is an array
        shortcodes: typeof shortcodeData === "string" ? [shortcodeData] : shortcodeData,
    };

    // We manually include regional indicators in the symbols group, since
    // Emojibase intentionally leaves them uncategorized
    const categoryId = EMOJIBASE_GROUP_ID_TO_CATEGORY[emoji.group] ??
        (isRegionalIndicator(emoji.unicode) ? "symbols" : null);

    if (DATA_BY_CATEGORY.hasOwnProperty(categoryId)) {
        DATA_BY_CATEGORY[categoryId].push(emoji);
    }

    // Add mapping from unicode to Emoji object
    // The 'unicode' field that we use in emojibase has either
    // VS15 or VS16 appended to any characters that can take
    // variation selectors. Which one it appends depends
    // on whether emojibase considers their type to be 'text' or
    // 'emoji'. We therefore strip any variation chars from strings
    // both when building the map and when looking up.
    UNICODE_TO_EMOJI.set(stripVariation(emoji.unicode), emoji);

    if (emoji.emoticon) {
        // Add mapping from emoticon to Emoji object
        EMOTICON_TO_EMOJI.set(emoji.emoticon, emoji);
    }

    return emoji;
});

/**
 * Strips variation selectors from the end of given string
 * NB. Skin tone modifiers are not variation selectors:
 * this function does not touch them. (Should it?)
 *
 * @param {string} str string to strip
 * @returns {string} stripped string
 */
function stripVariation(str) {
    return str.replace(/[\uFE00-\uFE0F]$/, "");
}
