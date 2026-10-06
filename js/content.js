import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';
//Tags
export async function fetchTags() {
  try {
    const response = await fetch('/data/_tags.json');
    return await response.json();
  } catch {
    return [];
  }
}

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchLegacy() {
    return await fetchJSON("legacy.json");
}

export async function fetchCountries() {
    try {
        const result = await fetch('/data/_countries.json');
        return await result.json();
    } catch {
        return {};
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
        }
    }


export async function fetchLeaderboard() {
    const list = await fetchList();
  
      let packs = [];

    try {
        const packsResult = await fetch(`${dir}/_packs.json`);

        if (packsResult.ok) {
            packs = await packsResult.json();
        }
    } catch (error) {
        console.error('Failed to load packs for leaderboard completions.', error);
    }

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Wrap in extra Object containing the user and total score
const res = Object.entries(scoreMap).map(([user, scores]) => {
    const { verified, completed, progressed } = scores;

    const total = [verified, completed, progressed]
        .flat()
        .reduce((prev, cur) => prev + cur.score, 0);

    // IDs of every level this player has completed
    const completedLevelIds = new Set(
        completed.map((record) => String(record.id))
    );

    // A pack is completed only if EVERY level in the pack is completed
    const packCompletions = packs
        .filter(
            (pack) =>
                Array.isArray(pack.levels) &&
                pack.levels.length > 0
        )
        .filter((pack) =>
            pack.levels.every((levelId) =>
                completedLevelIds.has(String(levelId))
            )
        )
        .map((pack) => ({
            name: pack.name,
            color: pack.color
        }));

    return {
        user,
        total: round(total),
        ...scores,
        packCompletions,
    };
});
    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}
