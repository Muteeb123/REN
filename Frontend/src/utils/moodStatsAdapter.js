const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const buildDataQuality = (dataQuality = {}) => {
    const isSufficient =
        typeof dataQuality.isSufficient === "boolean"
            ? dataQuality.isSufficient
            : Boolean(dataQuality.sufficient);

    return {
        isReliable: isSufficient,
        message: isSufficient
            ? "Data quality is sufficient for reliable insights."
            : dataQuality.warningMessage || "Data quality is limited; insights may be less reliable.",
    };
};

export const adaptMoodStats = (data = {}) => {
    const seekerId = data.seekerId || data.userId || "";
    const preferredName = data.preferredName || data.name || "";

    const summary = data.summary || {};
    const volatility = summary.volatility || {};

    return {
        seekerId,
        preferredName,
        displayName: preferredName || "Unknown",
        emotionBreakdown: toArray(data.emotionBreakdown).map((item) => ({
            emotion: item?.emotion || "neutral",
            count: toNumber(item?.count),
            percentage: toNumber(item?.percentage),
            avgScore: toNumber(item?.avgScore),
        })),
        polaritySplit: {
            positive: {
                count: toNumber(data?.polaritySplit?.positive?.count),
                percentage: toNumber(data?.polaritySplit?.positive?.percentage),
            },
            negative: {
                count: toNumber(data?.polaritySplit?.negative?.count),
                percentage: toNumber(data?.polaritySplit?.negative?.percentage),
            },
            neutral: {
                count: toNumber(data?.polaritySplit?.neutral?.count),
                percentage: toNumber(data?.polaritySplit?.neutral?.percentage),
            },
        },
        dailyTrend: toArray(data.dailyTrend).map((item) => ({
            date: item?.date || "",
            dominant: item?.dominant || "neutral",
            positive: toNumber(item?.positive),
            negative: toNumber(item?.negative),
            neutral: toNumber(item?.neutral),
        })),
        volatilityScore: toNumber(volatility.score),
        distressDays: toArray(data.distressDays),
        longestConsecutiveDistress: toNumber(summary.longestConsecutiveDistress),
        weekSnapshot: {
            totalPosts: toNumber(data?.weekSnapshot?.totalPosts),
            positivePercentage: toNumber(data?.weekSnapshot?.positivePercentage),
            negativePercentage: toNumber(data?.weekSnapshot?.negativePercentage),
        },
        dataQuality: buildDataQuality(data.dataQuality),
    };
};

export const adaptMoodStatsResponse = (response = {}) => {
    const items = toArray(response.stats);

    if (!items.length) {
        return {
            seekerIds: [],
            seekers: [],
        };
    }

    const seekers = items.map(adaptMoodStats);

    return {
        seekerIds: seekers.map((item) => item.seekerId).filter(Boolean),
        seekers,
    };
};